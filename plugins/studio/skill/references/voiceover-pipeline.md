# Voiceover Pipeline · narration-driven animation

> Upgrade an animation from "silent picture + post-recorded voice" into a workflow where **the narration script comes first, and the picture is driven by the audio's measured durations**.
> Use for: 5-20 minute concept explainers, tutorial videos, long-form knowledge pieces.
>
> Use together with `references/animation-best-practices.md` — this file covers **how to line narration up with picture**,
> animation-best-practices covers **how every frame moves**.

---

## 🛑 Iron rules · read before writing a line of code

> **It cannot be stressed enough: the #1 failure mode of narration animation is building a PowerPoint with a voiceover attached.**

### Rule one · the whole film is one continuous motion narrative, not a set of independent scenes

PowerPoint is 7 slides. What we make is **one continuous X-minute film**.

**Identity switch**:
- ❌ You are not "building content for 7 scenes"
- ✅ You are "putting one or a few hero elements on screen to perform for X minutes"

**Visual spine = one or a few hero elements that run through the whole film**:
- It appears at t=0 and only leaves at the end
- Every cue is a **state change** of it (position / size / color / perspective / form), not "swap in a new element"
- Scene boundaries exist in the script, **they must not exist on screen** — the audience cannot tell "this is scene 3", they only see one continuous motion

**Counter-example (hard knocks from this skill's v1, 2026-05-10)**:
- 7 `<Scene>` each with its own independent layout; scene transition = whole page opacity 1→0 then cut to the next page
- Every cue = `opacity: p, transform: translateY((1-p)*30px)` (fade-up used monotonically)
- Result: the audience's first reaction on finishing was "it's like flipping through keynote pages", the whole film's quality went to zero

**Correct pattern**:
- Pick 1-2 hero elements (e.g. this article's demo should pick the two characters "md" and "html" as the spine)
- Those two characters **stay on screen from the first frame to the last**
- Each "scene" is really one state change of the hero element
  - opening: the two characters face off in the center of the screen
  - md-side: md grows larger and heavier and takes the frame, html retreats to small type in the corner; data floods in around md
  - html-side: html inverts into the protagonist; md retreats to the corner
  - the-real-question: the two characters return to center, but a "≠" appears between them
  - the-split: the two characters push apart to the sides, blank space opens between them
  - activity-proof: the two characters alternate blinking on the timeline
  - closing: the two characters land at the final answer position
- So the whole film is "md and html performing on screen for X minutes", not 7 independent PPT slides

**Minimal implementation skeleton** (copy and adapt directly):

```jsx
// ── Step 1: define the hero's target state per scene (position/size/opacity) ──
const HERO_KEYS = {
  opening:    { md: { x: 50, y: 35, scale: 1.0, opacity: 1 }, html: { x: 50, y: 65, scale: 1.0, opacity: 1 } },
  'md-side':  { md: { x: 78, y: 50, scale: 1.6, opacity: 1 }, html: { x: 92, y: 8,  scale: 0.25, opacity: 0.4 } },
  'html-side':{ md: { x: 8,  y: 8,  scale: 0.25, opacity: 0.4 }, html: { x: 22, y: 50, scale: 1.6, opacity: 1 } },
  // ... one entry per segment; continuous motion goes from the previous segment's final → this segment's from
};

// ── Step 2: easing + lerp helpers ──
const expoOut = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPos = (from, to, t) => ({
  x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t),
  scale: lerp(from.scale, to.scale, t),
  opacity: lerp(from.opacity ?? 1, to.opacity ?? 1, t),
});

// ── Step 3: the HeroAnchor component — mounted directly as a <NarrationStage> child, not inside <Scene> ──
const HeroAnchor = () => {
  const { time, scene, timeline } = useNarration();
  if (!scene) return null;
  const idx = timeline.scenes.findIndex(s => s.id === scene.id);
  const prevId = idx > 0 ? timeline.scenes[idx - 1].id : scene.id;
  const from = HERO_KEYS[prevId];
  const to   = HERO_KEYS[scene.id];

  // the first ~45% of the segment morphs from prev state into this segment's state, the rest holds
  const transitionDur = Math.min(2.0, scene.duration * 0.45);
  const t = expoOut(Math.min(1, (time - scene.start) / transitionDur));
  const md   = lerpPos(from.md,   to.md,   t);
  const html = lerpPos(from.html, to.html, t);

  // add subtle breathing so any single frame has motion (matches iron rule three)
  const breath = 1 + Math.sin(time * 0.6) * 0.012;

  const renderHero = (label, pos, color) => (
    <div style={{
      position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
      transform: `translate(-50%, -50%) scale(${pos.scale * breath})`,
      opacity: pos.opacity, color, fontSize: 360, fontWeight: 800,
      lineHeight: 1, willChange: 'transform, opacity', pointerEvents: 'none',
    }}>{label}</div>
  );
  return <>
    {renderHero('md',   md,   '#1B4965')}
    {renderHero('html', html, '#C04A1A')}
  </>;
};

// ── Step 4: main component — hero is a NarrationStage child, in-scene support elements are managed separately ──
const App = () => (
  <NarrationStage timeline={TIMELINE} audioSrc="_narration/voiceover.mp3" width={1920} height={1080}>
    <HeroAnchor />  {/* ← persists across scenes, the film's visual spine */}
    {/* in-scene support elements use useSceneFade for soft fades, never hard cuts */}
    <MdSideAux />
    <HtmlSideAux />
    {/* ... */}
  </NarrationStage>
);
```

**Full runnable reference**: `demos/md-html-narration/md-html-demo.html` (3 min 21 s, 7 segments, 21 cues, battle-tested)

Another full example: `demos/voiceover-demo/` (`script.md` narration script + `什么是token.html`, with [[cue:…]] markers and gap settings).

### Rule two · no "hard cuts" between scenes

| Wrong pattern (PowerPoint slop) | Right pattern (cinematic) |
|---|---|
| scene A whole-page `opacity 1→0` while scene B `opacity 0→1` | scene A's core element **morphs into** B (position/size/color transition smoothly) |
| each scene has its own layout, elements appear/disappear | elements **persist** on screen, only position and form change |
| `keepMounted=false`, components unmount at the instant of the scene switch | hero uses `keepMounted=true`, sharing a DOM node across scenes |
| subtitle bar / data cards each fade in and fade out | the subtitle bar is the only non-hero entrance, and after holding it **exits together with the hero's motion** |

At the implementation level:
- **shared element across scenes** → lift the hero to be a direct child of `<NarrationStage>`, **not inside any `<Scene>`**
- use the `useNarration()` hook inside the hero to read `time`, `scene`, `isCueTriggered`, and decide its own form from the current time
- `<Scene>` only manages support elements that appear only in that segment (data cards, quote blocks, etc.), and **those support elements must not hard cut either** — enter with expoOut + stagger, exit with a fade overlap into the next segment

### Rule three · every frame must have motion

**Self-check method**: during recording, **grab any single frame** (not the second a cue fires).
- If the frame looks **completely static** → wrong. Go back and add an underlying motion (background drift / hero subtle scale / camera pan / parallax)
- There must always be **an underlying motion** running (even when it is not the focus):
  - hero element `scale: 1 ↔ 1.02` in a 5-second breathing loop
  - background `translateX: 0 ↔ -20px` slow drift
  - data cards keep a tiny `translateY` jitter after entering (Perlin noise)
- A completely static frame = PowerPoint slop

### Rule four · Easing / Stagger / Hold are the floor

| Item | Required | Forbidden |
|---|---|---|
| Easing | `expoOut` as the main axis (`cubic-bezier(0.16, 1, 0.3, 1)`), `overshoot` for emphasis, `spring` for landing | `linear`, `ease`, CSS default |
| Multi-element entrance | 30ms stagger (each enters 30ms later) | everything appearing at once |
| Before a key cue | hold 0.3-0.5s so the audience "sees" it (previous segment's elements freeze 0.3s first, then the cue fires) | seamless cut to the next segment as soon as one sentence ends |
| Ending | stop abruptly, hold the last frame 1s | fade to black |

For detailed rules see `animation-best-practices.md` §1-§4.

### Self-check · first viewer reaction

Show it to someone who has not seen it (or to yourself 24 hours later) — **what is their first reaction**?

| Reaction | Grade | Action |
|---|---|---|
| "This is a PPT with a voiceover" | fail | go back and redo |
| "The picture switches along with the voice" | not passing | no continuous narrative; the hero element is missing or does not run through the film |
| "This thing is moving" | pass | but no memorable point |
| "I want to watch it to the end" | good | the pacing is right |
| "I want to screenshot this part" | great | you did it |

---

## Workflow (high level)

```
                ┌────────────────────────┐
                │ Narration script .md   │
                │ (## scene + [[cue:xx]])│
                └───────────┬────────────┘
                            │
               narrate-pipeline.mjs
                            │
                            ▼
            ┌─────────────────────────────┐
            │ voiceover.mp3 (one spliced) │
            │ timeline.json (measured)    │
            └──────────────┬──────────────┘
                           │
              ┌────────────┴─────────────┐
              ▼                          ▼
    ┌──────────────────────┐   ┌───────────────────────┐
    │ HTML animation       │   │ Record MP4 + mixdown  │
    │ (NarrationStage)     │   │ render-narration      │
    │ plays synced to audio│   │ → final published MP4 │
    └──────────────────────┘   └───────────────────────┘
       delivery form 1            delivery form 2
```

## Narration script format

Put it anywhere under the project directory; the suggested filename is `script.md`:

```markdown
---
title: 什么是 LLM
voice: S_JSdgdWk22   # optional, overrides the .env default voice
speed: 1.0           # optional, 0.5-2.0
gap: 0.4             # silence in seconds between segments, default 0.3
---

## intro
大家好，今天我们 5 分钟讲清楚 LLM 是什么。

## what-is
LLM 全称 Large Language Model，[[cue:bigmodel]]它是一个有几千亿参数的神经网络。
本质是一个文字接龙的预测器。

## demo
比如你输入「今天天气」，[[cue:input]]模型会预测下一个字最可能是什么。
[[cue:predict]]也许是「真好」，也许是「不错」。
```

**Rules**:
- Segment headings `## scene-id` are English/digits + hyphens (e.g. `## what-is`, `## scene-1`)
- `[[cue:xx]]` marks **the middle of a key sentence** — the script splits the text at that position when it runs, and the moment after the cue is the trigger point for the picture
- The cue id is listened for in the animation HTML with `<Cue id="xx">`
- When writing narration, **focus on rhythm + short sentences**; long sentences come out flat from TTS

## timeline.json schema

```ts
{
  title: string,
  voice: string | null,
  speed: number,
  gap: number,
  totalDuration: number,        // measured seconds of the whole voiceover.mp3
  voiceover: 'voiceover.mp3',   // path relative to timeline.json
  scenes: [
    {
      id: string,
      start: number,            // this segment's start time within the whole audio track
      end: number,
      duration: number,
      audio: 'audio/<id>.mp3',  // this segment's own audio (sub-segments already concatenated)
      text: string,             // the whole segment text with [[cue:xx]] markers stripped
      // chunks are the source for subtitles — each chunk is a sub-segment split by cues, with measured TTS time windows
      chunks: [
        {
          text: string,            // sub-segment text
          start: number,           // relative time within the segment
          end: number,
          absoluteStart: number,   // absolute time on the whole track (aligned to voiceover.mp3)
          absoluteEnd: number,
          // words: word-level timestamps (measured by TTS enable_subtitle, on by default; --no-timestamps turns it off)
          // note text is post-TN text ("2025" → "二零二五"), punctuation is attached to the previous word
          words: [
            { text: string, start: number, end: number, absoluteStart: number, absoluteEnd: number }
          ],
        }
      ],
      cues: [
        {
          id: string,
          offset: number,       // relative time within the segment
          absoluteTime: number, // absolute time on the whole timeline
        }
      ]
    }
  ]
}
```

`absoluteTime` and `absoluteStart/End` are all **really measured** — the pipeline splits each segment's text into sub-segments at the cues and TTSes them separately; the time is the accumulated measured duration of the preceding sub-segments. **Not a linear per-character approximation**.

## Subtitles

> **Subtitles are on by default** — a long narration video without subtitles loses retention noticeably. NarrationStage ships `<Subtitles />` out of the box.

### Usage (one line)

```jsx
const { NarrationStage, Subtitles } = NarrationStageLib;
<NarrationStage timeline={TIMELINE} audioSrc="...">
  {/* your hero / scene content */}
  <Subtitles />  {/* ← pulls the active text from timeline.scenes[].chunks automatically */}
</NarrationStage>
```

### Visual rules (Bilibili style · anti-PowerPoint)

| Item | Rule | Counter-example |
|---|---|---|
| Background | **no background** (no black bar, no backdrop-blur) | translucent black + blur = the subtitle bar presses down on the picture = PPT feel |
| Text color | **on light ground use dark ink `#1a1a1a` + white halo**; on dark ground use white text + black halo | white text + black outline on light ground = mushy type |
| Size | 32px (1080p video) | <24px unreadable, >40px fights the main visual |
| Typeface | `PingFang SC` / `Noto Sans SC` (sans-serif, the Bilibili standard) | serif = looks like movie subtitles |
| Position | bottom: 90px (not glued to the edge) | hugging the bottom edge looks cheap |
| Line length | **≤ 12-13 characters** (for mixed Chinese/English count English at 0.5 char) | >15 characters a line is unreadable on phones |
| Split rule | **never truncate across a period**: first split at `。！？`, then merge each sentence at `，、；：` up to ≤maxLen | hard-cutting by character count, splitting 「这是好的」 into 「这是好」+「的」 |

`<Subtitles />` runs the rules above by default, no props needed. Dark ground: `<Subtitles color="#fff" haloColor="rgba(0,0,0,0.85)" />`.

### Karaoke mode (character-level highlight)

```jsx
<Subtitles karaoke />                          {/* each character turns brand orange #e8590c as it is read */}
<Subtitles karaoke karaokeColor="#0a84ff" />   {/* custom highlight color */}
```

- Depends on the `words` character-level timestamps in the timeline chunks (narrate-pipeline.mjs emits them by default; Doubao TTS v3 `enable_subtitle`, needs a 2.0 resource, Chinese and English only)
- Whole line stays visible, characters change color one by one, line splitting reuses ≤maxLen + never-across-period (lines are assembled from words, strictly aligned to pronunciation)
- When a chunk has no words it falls back to plain chunk mode automatically; the caller does not have to check

### Split algorithm (built into narration_stage.jsx)

```js
splitChunkToLines(text, maxLen = 13)
// 1. split at strong punctuation (。！？\n)
// 2. each sentence ≤ maxLen is kept as is
// 3. otherwise slice at weak punctuation (，、；：) and merge up to ≤ maxLen
// 4. last resort hard cut (rare)
// mixed Chinese/English: count English/digits as 0.5 character of visual width
```

If a line comes out clearly too long or too short after chunking, **move the cue positions in the narration script** (cues cut the segment finer), do not tweak the splitting logic in the frontend.

## NarrationStage API

```jsx
import 'assets/narration_stage.jsx';
const { NarrationStage, Scene, Cue, useNarration } = NarrationStageLib;

<NarrationStage
  timeline={TIMELINE}                  // contents of timeline.json
  audioSrc="_narration/voiceover.mp3"  // path relative to the current HTML
  width={1920} height={1080}
  background="#f5f1e8"
  controls={true}                      // show the bottom playback bar during live playback
>
  {/* hero element: persists across scenes — placed directly as a NarrationStage child */}
  <HeroAnchor />

  {/* in-scene support elements: only appear in that segment */}
  <Scene id="intro">
    <Cue id="bigmodel">{(triggered, progress) => (
      <SomeElement style={{ opacity: progress }} />
    )}</Cue>
  </Scene>
</NarrationStage>
```

**Hooks**:
- `useNarration()` returns `{ time, scene, sceneTime, isCueTriggered, cueProgress }`
- Read it directly inside custom components, no props needed

**Scene component**:
- By default it only mounts when `scene.id === id`
- Add `keepMounted` to keep it mounted (use when animation continuity spans scenes)

**Cue component**:
- children must be `(triggered, progress) => ReactNode`
- progress is the 0→1 ramp value after the cue fires (0.6s ramp by default)

## Time source (dual track)

NarrationStage detects `window.__recording` automatically:
- **Live playback mode** (default): follows the audio element's currentTime; user pause/seek stays in sync
- **Video recording mode** (render-video.js sets `window.__recording = true`): rAF wall-clock drives itself from 0 and exposes `window.__seek(t)` for render-video.js to reset

## The three scripts

| Script | Input | Output |
|---|---|---|
| `scripts/cloud/tts-doubao.mjs` | a single segment of text | one mp3 + measured duration |
| `scripts/narrate-pipeline.mjs` | narration script .md | voiceover.mp3 + timeline.json |
| `scripts/mix-voiceover.sh` | video + voiceover.mp3 [+ BGM] | MP4 with audio |
| `scripts/render-narration.sh` | narration HTML + timeline.json | final MP4 (record + mixdown in one go) |

## .env configuration

> ⚠️ TTS is an optional cloud capability: narration text is sent to Doubao TTS's official endpoint (openspeech.bytedance.com),
> using your own key. The first call of the script requires `--yes` or `STUDIO_CLOUD_OK=1` as explicit confirmation,
> and the endpoint is enforced against an official ByteDance domain allowlist. Data-flow disclosure is in the repo root `SECURITY.md`.

`.env` at the skill root (already gitignored):

```
DOUBAO_TTS_API_KEY=<your_api_key>
DOUBAO_TTS_VOICE_ID=zh_female_xiaohe_uranus_bigtts
DOUBAO_TTS_ENDPOINT=https://openspeech.bytedance.com/api/v3/tts/unidirectional
```

You can also use the console's App ID + Access Token auth:

```
DOUBAO_APP_ID=<your_app_id>
DOUBAO_ACCESS_KEY=<your_access_token>
DOUBAO_TTS_VOICE_ID=zh_female_xiaohe_uranus_bigtts
```

`DOUBAO_TTS_RESOURCE_ID` is inferred automatically from the voice: `S_` cloned voices use `seed-icl-2.0`, official `uranus` voices use `seed-tts-2.0`, other official voices use `seed-tts-1.0`.

## Standard workflow (10 steps)

1. **Write the narration script**: the script is the source code. Finish the whole spoken text first, mark segment headings `## scene-id`, put `[[cue:xx]]` before key sentences
2. **Run narrate-pipeline**: `node scripts/narrate-pipeline.mjs --script script.md --out-dir _narration --yes` (`--yes` = confirm sending the text to Doubao TTS)
3. **Listen to the whole voiceover.mp3**: if the rhythm is off, go back and rewrite. **This step sets the film's quality ceiling**
4. **🛑 Answer the iron rules before designing**: what is the hero element? What state is it in during each segment? How does it morph across scenes? If you cannot answer, do not write code
5. **Write the animation HTML**: use NarrationStage + one or a few hero elements performing across scenes
6. **Live preview**: open the HTML in a browser, click ▶ Play, check that picture and narration are in sync
7. **First-viewer self-check**: score it with the "Self-check · first viewer reaction" table above. On failure go back to Step 4 and redo
8. **Record the video**: `bash scripts/render-narration.sh demo.html --timeline=_narration/timeline.json` (records a silent MP4 + mixes in the voiceover automatically)
9. **Optional BGM**: add `--bgm-mood=educational` to render-narration (or tech / tutorial etc.)
10. **Deliver**: browser HTML (for live demos) + final MP4 (for publishing)

## Troubleshooting

| Problem | Fix |
|---|---|
| TTS API errors | check `DOUBAO_TTS_API_KEY` in .env, or whether `DOUBAO_APP_ID` + `DOUBAO_ACCESS_KEY` are correct |
| One segment's audio is clearly longer/shorter than the script | the segment text contains odd punctuation or emoji, TTS mis-parsed it → rewrite the script |
| cue absoluteTime is off | ffmpeg had a problem splicing the sub-segments → check that the mp3 encodings are consistent |
| Recorded video has a black screen | render-video.js never got the `window.__ready` signal → check whether NarrationStage mounted properly |
| Recorded video stutters | the animation has heavy layout (lots of box-shadow / blur) → simplify or pre-composite |
| Live playback audio and picture drift | slow audio element loading → add `preload="auto"` or preload locally |

## When not to use this pipeline

- **<60s short animations**: just make a silent animation + record voice afterwards (add-music.sh + a single TTS segment); no timeline driving needed
- **BGM-only videos**: use `add-music.sh` to add a preset BGM
- **Replacing TTS with a human recording**: swap `voiceover.mp3` for the human recording, write the timeline by hand or measure segment durations with ffprobe + a helper script → the rest of the flow still applies

---

**One last reminder**: before writing code, go back to the iron rules. **Do not build a PowerPoint with a voiceover.**
