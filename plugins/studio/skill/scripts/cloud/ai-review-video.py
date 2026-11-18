#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "requests>=2.28.0",
# ]
# ///
"""
AI review loop — the rendered animation MP4 is fed to a video-understanding model
(seed-2.0-lite), reviewed segment by segment against a fixed checklist plus one
low-resolution pass over the whole film, then merged into a structured markdown
review report.

⚠️ Optional cloud capability: it sends the compressed segments of the finished film
to the official Volcengine Ark endpoint (ark.cn-beijing.volces.com) for
video-understanding review, using your own ARK_API_KEY. The first call needs --yes or
an explicit STUDIO_CLOUD_OK=1 confirmation. See SECURITY.md at the repo root for the
data-flow statement. Free local alternative: scripts/verify-video.sh to grab frames
and look yourself.

Usage:
    uv run ai-review-video.py --video final.mp4 --yes
    uv run ai-review-video.py --video final.mp4 --context director-script.md --yes
    uv run ai-review-video.py --video final.mp4 --segment-len 60 --output report.md --yes

Pipeline:
    1. ffprobe detects the duration / audio track
    2. audio track present → ffmpeg silencedetect extracts the sound-effect onset
       timeline (the model cannot hear the video audio track; measured 2026-07-17:
       input_video carries picture only. Audio-picture sync checking = local onsets
       + model check against the picture)
    3. split by --segment-len and compress (1280 wide/15fps/crf28, flat animation
       ≈0.5MB per minute)
    4. review each segment (checklist①-⑧), each prompt labelled with the original
       film time range
    5. compress one more low-res pass of the whole film (960 wide/10fps) and review
       it on its own, specifically for cross-segment narrative continuity / hero
       persistence
    6. text synthesis call: merge item by item per the checklist and produce the
       final report; the raw per-segment findings stay in the appendix

API key: reads the ARK_API_KEY environment variable first, then .env in the skill
root (only that one variable); never hard-coded.
Proxy: the requests session turns off trust_env (does not inherit this machine's
proxy settings), immune to TLS errors caused by leftover proxies such as ALL_PROXY.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from base64 import b64encode
from pathlib import Path

import requests

API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses"
DEFAULT_MODEL = "doubao-seed-2-0-lite-260215"
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"  # .env in the skill root (gitignored)
MAX_SEGMENT_MB = 8  # re-compress one notch lower when a single segment exceeds this size

CHECKLIST = """\
① Black frames / empty windows / broken renders: whole-frame or large-area black or
   white screens, elements that failed to render, obviously broken images
② Text problems: cards / labels clipped, overflowing their container, typos,
   garbled characters, text on top of text
③ Element overlap and occlusion: elements that should not overlap occlude each
   other, wrong layering, intersecting geometry
④ Narrative continuity: classify scene transitions into three kinds — hard cut
   (the whole frame changes between frames, with no connection at all), cross fade
   (the old scene fades out through opacity), morph (elements continuously deform /
   move into the new scene). When reporting you must state which kind you saw; do
   not misreport a cross fade as a hard cut. Hard cut = ⚡; a cross fade where the
   director script asks for a morph = 💡 "lazy transition"
⑤ hero / subject persistence: if a subject element runs through the whole film, does
   it break, disappear or jump position at scene changes
⑥ Dead pacing: see the "objective still-segment table" below (ffmpeg per-frame
   detection, intervals completely still for ≥3 seconds). Your job is not to hunt
   for dead segments but to judge each interval in the table: is it a deliberate
   hold (card reading time / comment parked / closing freeze) or a real dead
   segment (nothing left to read and it still sits there). Deliberate hold = do not
   report or 💡; real dead segment = ⚡
⑦ Sound-effect hits (see the onset table below): check whether each sound-effect
   time point has a matching event in the picture
⑧ Composition: obvious imbalance, large meaningless blank areas, important elements
   hugging the edge or squeezed into a corner"""

SEVERITY_RULE = """\
Three severity levels:
- ⚠️ fatal: must be fixed before delivery (black frames, typos, clipped text,
  elements stacked dead on each other, obviously broken images)
- ⚡ important: the viewing experience is visibly hurt (hard-cut feel, broken hero,
  dead segment over 3 seconds, obviously imbalanced composition)
- 💡 suggestion: a nice-to-have improvement"""


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def load_api_key():
    key = os.getenv("ARK_API_KEY")
    if not key and ENV_PATH.exists():
        # extract only the ARK_API_KEY variable; never pour the whole .env into the environment
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("ARK_API_KEY") and "=" in line:
                key = line.split("=", 1)[1].strip().strip("'\"")
                break
    if not key or key.startswith("your_"):
        sys.exit("Error: ARK_API_KEY is not configured (skill root .env or the environment); "
                 "refusing to continue. No fabricated review results.")
    return key


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def probe(video: Path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-show_entries", "stream=codec_type", "-of", "json", str(video)])
    info = json.loads(r.stdout)
    duration = float(info["format"]["duration"])
    has_audio = any(s.get("codec_type") == "audio" for s in info.get("streams", []))
    return duration, has_audio


def detect_audio_onsets(video: Path, noise_db=-45, min_silence=0.3):
    """Derive sound-effect onsets from silencedetect. Returns original-film seconds."""
    r = subprocess.run(
        ["ffmpeg", "-i", str(video), "-af",
         f"silencedetect=noise={noise_db}dB:d={min_silence}", "-f", "null", "-"],
        capture_output=True, text=True)
    onsets = [round(float(m), 1) for m in
              re.findall(r"silence_end:\s*([\d.]+)", r.stderr)]
    # prepend 0 when the opening is not silent (sound from the very first frame)
    starts = re.findall(r"silence_start:\s*([\d.-]+)", r.stderr)
    if starts and float(starts[0]) > min_silence:
        onsets.insert(0, 0.0)
    return onsets


def detect_static_segments(video: Path, noise=0.001, min_dur=3.0):
    """freezedetect: intervals completely still for ≥min_dur seconds. Returns [(start,end)] in original-film seconds."""
    r = subprocess.run(
        ["ffmpeg", "-i", str(video), "-vf",
         f"freezedetect=n={noise}:d={min_dur}", "-f", "null", "-"],
        capture_output=True, text=True)
    starts = re.findall(r"freeze_start:\s*([\d.]+)", r.stderr)
    durs = re.findall(r"freeze_duration:\s*([\d.]+)", r.stderr)
    return [(round(float(s), 1), round(float(s) + float(d), 1))
            for s, d in zip(starts, durs)]


def compress(src: Path, dst: Path, ss=None, t=None, width=1280, fps=15, crf=28):
    cmd = ["ffmpeg", "-y", "-v", "error"]
    if ss is not None:
        cmd += ["-ss", str(ss)]
    if t is not None:
        cmd += ["-t", str(t)]
    cmd += ["-i", str(src), "-vf", f"scale={width}:-2,fps={fps}",
            "-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast",
            "-pix_fmt", "yuv420p", "-an", str(dst)]
    run(cmd)


def fmt_ts(sec: float) -> str:
    return f"{int(sec) // 60}:{int(sec) % 60:02d}"


def ask_model(session, api_key, model, prompt, video_path: Path | None = None, retries=1):
    content = []
    if video_path is not None:
        b64 = b64encode(video_path.read_bytes()).decode()
        content.append({"type": "input_video", "video_url": f"data:video/mp4;base64,{b64}"})
    content.append({"type": "input_text", "text": prompt})
    payload = {"model": model, "input": [{"role": "user", "content": content}]}
    last_err = None
    for attempt in range(retries + 1):
        try:
            resp = session.post(
                API_URL, json=payload, timeout=600,
                headers={"Authorization": f"Bearer {api_key}",
                         "Content-Type": "application/json"})
            if resp.status_code != 200:
                last_err = f"API {resp.status_code}: {resp.text[:500]}"
                continue
            data = resp.json()
            usage = data.get("usage", {})
            text = ""
            out = data.get("output")
            if isinstance(out, list):
                for item in out:
                    if isinstance(item, dict) and item.get("type") == "message":
                        for c in item.get("content", []):
                            if isinstance(c, dict) and c.get("type") == "output_text":
                                text += c.get("text", "")
            elif isinstance(out, str):
                text = out
            if not text:
                choices = data.get("choices", [])
                if choices:
                    text = choices[0].get("message", {}).get("content", "")
            if text:
                return text, usage
            last_err = f"No text in the response: {json.dumps(data, ensure_ascii=False)[:500]}"
        except requests.RequestException as e:
            last_err = f"Network error: {e}"
        if attempt < retries:
            log(f"  retrying ({last_err[:120]})...")
            time.sleep(3)
    raise RuntimeError(last_err)


def segment_prompt(seg_start, seg_end, duration, context_text, onsets_in_seg,
                   statics_in_seg):
    p = [f"You are a quality reviewer for finished animation films; your job is to be strict about faults, not to praise the film.",
         f"This video is one segment of a finished animation film with a total length of {fmt_ts(duration)}, "
         f"corresponding to {fmt_ts(seg_start)}–{fmt_ts(seg_end)} of the original film. "
         f"Second t inside the segment = second {fmt_ts(seg_start)}+t of the original film; always report in original-film time (min:sec)."]
    if context_text:
        p.append("Below is the director script for the whole film (review context, used to judge narrative intent and what should appear):\n"
                 "<director-script>\n" + context_text + "\n</director-script>")
    p.append("Check the following checklist item by item, reporting only findings inside this segment:\n" + CHECKLIST)
    if statics_in_seg:
        ts = ", ".join(f"{fmt_ts(a)}–{fmt_ts(b)} ({b - a:.1f}s)" for a, b in statics_in_seg)
        p.append(f"Objective still-segment table for ⑥ (inside this segment, original-film time): {ts}. "
                 f"Judge each one: deliberate hold or real dead segment.")
    else:
        p.append("This segment has no still interval of ≥3 seconds, so for ⑥ just write \"not found\".")
    if onsets_in_seg:
        ts = ", ".join(f"{fmt_ts(t)}({t}s)" for t in onsets_in_seg)
        p.append(f"Onset table for ⑦ (original-film times at which sound effects actually occur inside this segment): {ts}. "
                 f"You cannot hear the audio, so just check whether the picture has an event worth a sound effect at each of these time points "
                 f"(transition / card settling / impact / element appearing); a time point with no matching event = a missed sound cue and must be reported.")
    else:
        p.append("No sound-effect onset was detected inside this segment, so skip ⑦; but if this segment has a strong visual event "
                 "(impact / card / transition) with no sound coverage, you may raise it under ⑦ with 💡.")
    p.append(SEVERITY_RULE)
    p.append("Output format: markdown. Go through ①-⑧ item by item, with a list under each:\n"
             "- [original min:sec] severity emoji  concrete description\n"
             "For an item with no problems write \"not found\". Report only what you actually saw, mark anything you are unsure about \"uncertain\"; do not fabricate.")
    return "\n\n".join(p)


def global_prompt(duration, context_text):
    p = ["You are a quality reviewer for finished animation films. This is the whole film at low resolution "
         "(compressed for review, so low image quality is normal; do not report image-quality/sharpness problems), "
         "total length " + fmt_ts(duration) + "."]
    if context_text:
        p.append("Director script:\n<director-script>\n" + context_text + "\n</director-script>")
    p.append("Do only three things (detail problems are already covered by the segment reviews, ignore them):\n"
             "A. Narrative continuity: watching from start to end, which time points are PowerPoint-style hard cuts (the whole frame changes with no transition)?\n"
             "B. hero / subject persistence: at which cuts does the subject element that runs through the whole film break, disappear or jump?\n"
             "C. Overall pacing: which intervals drag (no new information for a long time), which intervals are rushed?\n\n"
             + SEVERITY_RULE +
             "\n\nOutput markdown with three sections A/B/C, each finding carrying a [min:sec] time point. Write \"not found\" when there are no problems. Do not fabricate.")
    return "\n\n".join(p)


def synthesis_prompt(duration, seg_reports, global_report):
    parts = ["You are the editor-in-chief of this review report. Below are the raw segment reviews + whole-film review records of one "
             + fmt_ts(duration) +
             " finished animation film; merge them into the body of the final report.",
             "Requirements:\n"
             "1. Organise it item by item per checklist①-⑧, listing findings in time order under each: - [min:sec] severity description\n"
             "2. Merge the same problem reported by several segments into one entry; when a segment review and the whole-film review contradict each other, keep both statements and mark \"uncertain\"\n"
             "3. Keep the time point and severity emoji (⚠️/⚡/💡) of every finding; add no finding absent from the raw records\n"
             "4. Start with a statistics line \"total problems: ⚠️x ⚡y 💡z\" and a verdict of at most three sentences\n"
             "5. Output only the report body markdown, no pleasantries",
             "<whole-film review>\n" + global_report + "\n</whole-film review>"]
    for (s, e, text) in seg_reports:
        parts.append(f"<segment review original {fmt_ts(s)}–{fmt_ts(e)}>\n{text}\n</segment review>")
    return "\n\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description="AI review: animation MP4 → checklist-structured review report")
    ap.add_argument("--video", required=True, help="path to the finished film (mp4)")
    ap.add_argument("--context", help="path to the director script / scene breakdown md (optional, used as review context)")
    ap.add_argument("--segment-len", type=int, default=60, help="segment length in seconds (default 60)")
    ap.add_argument("--model", default=DEFAULT_MODEL, help=f"model (default {DEFAULT_MODEL})")
    ap.add_argument("--output", "-o", help="report path (default <video-name>-ai-review.md next to the video)")
    ap.add_argument("--yes", action="store_true",
                    help="confirm sending the compressed video segments to the official Volcengine Ark endpoint (or set STUDIO_CLOUD_OK=1)")
    args = ap.parse_args()

    video = Path(args.video).resolve()
    if not video.exists():
        sys.exit(f"Error: video not found {video}")

    if not args.yes and os.getenv("STUDIO_CLOUD_OK") != "1":
        sys.exit(
            f"[cloud consent] This run will send {video.name} as compressed segments to ark.cn-beijing.volces.com"
            " (the official Volcengine Ark endpoint, using your own ARK_API_KEY for video-understanding review).\n"
            "If that is fine, re-run with --yes, or set the environment variable STUDIO_CLOUD_OK=1. "
            "See SECURITY.md for the data-flow statement; free local alternative: scripts/verify-video.sh.")
    out_path = Path(args.output) if args.output else video.parent / f"{video.stem}-ai-review.md"

    context_text = ""
    if args.context:
        ctx = Path(args.context)
        if not ctx.exists():
            sys.exit(f"Error: context file not found {ctx}")
        context_text = ctx.read_text(encoding="utf-8")[:12000]

    api_key = load_api_key()
    session = requests.Session()
    session.trust_env = False  # immune to proxy pitfalls such as ALL_PROXY

    duration, has_audio = probe(video)
    log(f"video {fmt_ts(duration)}, audio track={'yes' if has_audio else 'no'}")

    onsets = detect_audio_onsets(video) if has_audio else []
    if has_audio:
        log(f"sound-effect onset detection: {len(onsets)} → {['%.1f' % t for t in onsets]}")

    # objective still-segment detection (adjacent intervals merged)
    raw_statics = detect_static_segments(video)
    statics = []
    for a, b in raw_statics:
        if statics and a - statics[-1][1] < 0.2:
            statics[-1] = (statics[-1][0], b)
        else:
            statics.append((a, b))
    log(f"still-segment detection (≥3s): {len(statics)} → "
        f"{[f'{a:.0f}-{b:.0f}s' for a, b in statics]}")

    total_usage = {"input_tokens": 0, "output_tokens": 0}

    def add_usage(u):
        for k in total_usage:
            total_usage[k] += u.get(k, 0) or 0

    seg_reports, failures = [], []
    with tempfile.TemporaryDirectory(prefix="ai-review-") as tmp:
        tmp = Path(tmp)
        # segmentation
        bounds = []
        t0 = 0.0
        while t0 < duration - 1:
            bounds.append((t0, min(t0 + args.segment_len, duration)))
            t0 += args.segment_len
        log(f"segments: {len(bounds)} × ≤{args.segment_len}s")

        for i, (s, e) in enumerate(bounds, 1):
            seg = tmp / f"seg{i}.mp4"
            compress(video, seg, ss=s, t=e - s)
            if seg.stat().st_size > MAX_SEGMENT_MB * 1024 * 1024:
                compress(video, seg, ss=s, t=e - s, width=960, fps=10, crf=32)
            mb = seg.stat().st_size / 1048576
            onsets_in = [t for t in onsets if s <= t < e]
            statics_in = [(a, b) for a, b in statics if a < e and b > s]
            log(f"segment {i} {fmt_ts(s)}–{fmt_ts(e)} ({mb:.1f}MB, onset×{len(onsets_in)}, "
                f"still×{len(statics_in)}) submitting...")
            try:
                text, usage = ask_model(session, api_key, args.model,
                                        segment_prompt(s, e, duration, context_text,
                                                       onsets_in, statics_in),
                                        seg)
                add_usage(usage)
                seg_reports.append((s, e, text))
            except RuntimeError as err:
                log(f"  segment {i} review failed: {err}")
                failures.append((s, e, str(err)))

        # whole-film low-res pass
        log("submitting the whole-film low-res version (narrative/hero/pacing)...")
        full = tmp / "full.mp4"
        compress(video, full, width=960, fps=10, crf=30)
        global_report, global_fail = "", None
        try:
            global_report, usage = ask_model(session, api_key, args.model,
                                             global_prompt(duration, context_text), full)
            add_usage(usage)
        except RuntimeError as err:
            global_fail = str(err)
            log(f"  whole-film pass failed: {err}")

    if not seg_reports and not global_report:
        sys.exit("Error: every review call failed, cannot produce a report. No fabricated review results.\n" +
                 "\n".join(f"{fmt_ts(s)}–{fmt_ts(e)}: {m}" for s, e, m in failures))

    # synthesis
    log("assembling the final report...")
    try:
        body, usage = ask_model(session, api_key, args.model,
                                synthesis_prompt(duration, seg_reports,
                                                 global_report or "(whole-film pass call failed, no record)"))
        add_usage(usage)
    except RuntimeError as err:
        log(f"synthesis call failed ({err}), falling back to concatenating the raw records")
        body = "> The synthesis call failed; below are the raw records of each pass, concatenated.\n\n" + \
               (global_report or "") + "\n\n" + \
               "\n\n".join(f"## segment {fmt_ts(s)}–{fmt_ts(e)}\n{t}" for s, e, t in seg_reports)

    lines = [f"# {video.name} · AI review report",
             "",
             f"> model: {args.model} | reviewed: {time.strftime('%Y-%m-%d %H:%M')} | "
             f"length: {fmt_ts(duration)} | segments: {len(seg_reports)} ok/{len(failures)} failed | "
             f"sound-effect onsets: {len(onsets)} / still segments ≥3s: {len(statics)}"
             f" (all objective local ffmpeg detection; the model hears no audio, so audio-picture sync = onsets + picture check) | "
             f"tokens: in {total_usage['input_tokens']} / out {total_usage['output_tokens']}",
             ""]
    if failures:
        lines.append("> ⚠️ these time ranges failed to review and are not covered: " +
                     "; ".join(f"{fmt_ts(s)}–{fmt_ts(e)} ({m[:100]})" for s, e, m in failures))
        lines.append("")
    if global_fail:
        lines.append(f"> ⚠️ whole-film continuity pass call failed: {global_fail[:200]}")
        lines.append("")
    lines.append(body)
    lines.append("\n\n---\n\n## Appendix · objective detection data (ffmpeg, not model judgement)\n")
    lines.append("still segments ≥3s: " + (", ".join(
        f"{fmt_ts(a)}–{fmt_ts(b)} ({b - a:.1f}s)" for a, b in statics) or "none"))
    lines.append("\nsound-effect onsets: " + (", ".join(fmt_ts(t) for t in onsets) or "none / no audio track"))
    lines.append("\n## Appendix · raw per-segment review records\n")
    if global_report:
        lines.append("### whole-film pass (narrative/hero/pacing)\n\n" + global_report + "\n")
    for s, e, t in seg_reports:
        lines.append(f"### segment {fmt_ts(s)}–{fmt_ts(e)} of the original film\n\n{t}\n")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    log(f"report written to: {out_path}")
    print(out_path)


if __name__ == "__main__":
    main()
