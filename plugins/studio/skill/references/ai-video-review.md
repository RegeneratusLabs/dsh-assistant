# AI viewing-critique loop (scripts/cloud/ai-review-video.py)

> Feed the final-rendered MP4 to a video-understanding model (seed-2.0-lite) and get a structured critique report against a fixed checklist.
> Role: the last quality gate **after final render, before delivery**, replacing a full human re-watch. It does not replace frame-by-frame verify-video.sh.
> ⚠️ Optional cloud capability: the compressed video segments are sent to the official Volcano Ark endpoint (ark.cn-beijing.volces.com),
> using your own ARK_API_KEY, and require explicit confirmation via `--yes` or `STUDIO_CLOUD_OK=1`. See `SECURITY.md` at the repository root.
> Do not want the cloud: capture frames with `scripts/verify-video.sh` and look by hand, entirely local.

## When to use it

- After the final 60fps cut is out, before delivery/mixing — run it once
- Run it again after the SFX mix is out (the onset check only applies when there is an audio track)
- Re-check after a re-render that fixed a major problem
- Do not run it at the 30fps test-render stage (resolution/rhythm not settled yet, wasted calls)

## How to use it

```bash
cd project-directory && unset ALL_PROXY   # the script already immunizes itself against proxies; unset is belt and braces
uv run ~/.claude/skills/studio/scripts/cloud/ai-review-video.py \
  --video final.mp4 \
  --context director-script.md \      # strongly recommended: the model uses it to tell "design intent" from "a bug"
  --yes                      # confirm that video segments go to Volcano Ark (or STUDIO_CLOUD_OK=1)
```

- ARK_API_KEY is set in `.env` at the skill root (already gitignored) or in an environment variable; the script extracts only this one variable

- Report written to: the video's own directory as `<video-name>-ai-review.md` (`--output` changes it)
- `--segment-len` defaults to 60-second segments; `--model` defaults to doubao-seed-2-0-lite-260215
- Measured on a 210-second film: 6 API calls, 6–10 minutes, about 180k tokens in / 20k out (lite tier, costs pennies)

## Call chain (three hybrid layers, not pure model)

1. **ffmpeg objective detection** (deterministic, cannot miss):
   - `silencedetect` → the sound-effect onset timetable (the model **cannot hear** the video's audio track, measured 2026-07-17)
   - `freezedetect` → the list of completely static stretches ≥3 seconds
2. **Model watches in segments**: compressed 60s segments sent for review (1280 wide/15fps/crf28, flat animation about 0.5MB/minute);
   each segment's prompt contains the checklist + the director's script + that segment's onset/static-stretch data, with time points converted to source-film time
3. **Model does a whole-film low-res pass**: 960 wide/10fps, the whole film sent separately, checking specifically for cross-segment narrative continuity / hero throughline / overall rhythm
4. The text summary call merges ①-⑧; the per-segment raw records and all objective detection data are kept in the report appendix

## Checklist and severity

① black frames / render defects ② text cropping / typos ③ overlapping and occluding elements ④ narrative continuity (transitions identified by the three-layer vocabulary in camera-language.md §7: six forms [dissolve-to-white / pass through a dark field / rack-focus relay / black-frame title card / whip-pan / mask-wipe], hidden-cut, travel [shared-element return / title-void pass-through]; a bare cut = an unwrapped hard cut, marked ⚡)
⑤ hero throughline ⑥ dead stretches in the rhythm (objective list + the model's judgment whether a hold is deliberate or truly dead) ⑦ sound-effect hits (onset + frame-event cross-check)
⑧ composition imbalance / emptiness

⚠️ fatal = must fix before delivery | ⚡ important = the impression is clearly damaged | 💡 suggestion = nice to have

## Limitations (read before using a report)

- **The model cannot hear sound**: ⑦ is a one-way check of "was there a frame event at the audio onset moment";
  it cannot judge whether the sound effect was the right choice, whether the level is right, whether the BGM's mood is right
- **It cannot see frame-level detail**: 1–2 frame flicker, subtle shake, exact color deviations and sub-pixel misalignment are not caught;
  these still rely on capturing frames with verify-video.sh and looking by hand
- **Transition classification is on the strict side**: at 15fps compression a fast cross-dissolve may be reported as a "hard cut";
  when the segment pass and the whole-film pass contradict each other the summary marks it "uncertain" — extract frames yourself to confirm an uncertain item before changing anything
- **"Deliberate hold vs dead stretch" is the model's opinion**: long freeze-frames under b-roll covering narration are often let through; judge again yourself when watching the finished film on its own
- A failed call (network/key/quota) is written honestly into the report header; it never fabricates a critique result, and the time range of the failed segment is marked

## Measured baseline

First run: B00-first-three-minutes-mainline-SFX.mp4 (210s). The model found the inter-act transition problem and the hero breakpoint direction correctly
but misreported a fade as a hard cut; pure model caught only 3 of 14 dead stretches, and with freezedetect wired in, coverage was complete. Conclusion: the objective detection layer is this loop's floor guarantee; the model does the semantic judgment.
