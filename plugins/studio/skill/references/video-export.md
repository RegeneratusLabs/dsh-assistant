# Video Export: exporting HTML animation to MP4/GIF

Once an animated HTML is finished, users often ask "can this be exported as video". This guide gives the complete process.

## When to export

**Timing**:
- The animation runs end to end and has been visually verified (Playwright screenshots confirm the state at each timestamp is correct)
- The user has watched it in a browser at least once and said it is OK
- **Do not** export while animation bugs are still unfixed — once it is a video, changes cost more

**Trigger phrases the user may use**:
- "can you export this as video"
- "convert it to MP4"
- "make it a GIF"
- "60fps"

## Output specs

By default, deliver three formats at once so the user can choose:

| Format | Spec | Suits | Typical size (30s) |
|---|---|---|---|
| MP4 25fps | 1920×1080 · H.264 · CRF 18 | WeChat article embeds, WeChat Channels, YouTube | 1-2 MB |
| MP4 60fps | 1920×1080 · frame duplication by default (stable compatibility) · H.264 · CRF 18; high-quality interpolation needs an explicit `--minterpolate`; for Stage-clock animations use render-video-seek.js to record true 60fps directly | high-frame-rate showcases, Bilibili, portfolios | 1.5-3 MB |
| GIF | 960×540 · 15fps · palette optimized | Twitter/X, README, Slack previews | 2-4 MB |

## Toolchain

Four scripts in `scripts/`:

### 1. `render-video.js` — HTML → MP4

Records a 25fps MP4 as the base version. Depends on the global playwright.

```bash
NODE_PATH=$(npm root -g) node $HD/scripts/render-video.js <html file>
```

Optional parameters:
- `--duration=30` animation duration (seconds)
- `--width=1920 --height=1080` resolution
- `--trim=2.2` seconds trimmed from the start of the video (removes reload + font loading time)
- `--fontwait=1.5` font loading wait (seconds); raise it when there are many fonts

Output: same directory as the HTML, same name, `.mp4`.

### 2. `add-music.sh` — MP4 + BGM → MP4

Mixes background music into a silent MP4, chosen from the built-in BGM library by scene (mood), or bring your own audio. Matches the duration and adds fade in/out automatically.

```bash
bash add-music.sh <input.mp4> [--mood=<name>] [--music=<path>] [--out=<path>]
```

**Built-in BGM library** (in `assets/bgm-<mood>.mp3`):

| `--mood=` | Style | Fits |
|-----------|------|---------|
| `tech` (default) | Apple Silicon / Apple keynote: minimal synth + piano | product launches, AI tools, skill promotion |
| `ad` | upbeat modern electronic, with build + drop | social media ads, product teasers, promo films |
| `educational` | warm and bright, light guitar / electric piano, inviting | explainers, tutorial intros, course trailers |
| `educational-alt` | same kind, alternate track | as above |
| `tutorial` | lo-fi ambience, almost no presence | software demos, coding tutorials, long demos |
| `tutorial-alt` | same kind, alternate track | as above |

**Behavior**:
- Music is trimmed to the video duration
- 0.3s fade in + 1s fade out (to avoid a hard cut)
- The video stream is `-c:v copy`, not re-encoded; audio AAC 192k
- `--music=<path>` takes priority over `--mood`; you can point at any external audio
- A wrong mood name lists all available options instead of failing silently

**Typical pipeline** (the export trio + music):
```bash
node render-video.js animation.html                        # record
bash convert-formats.sh animation.mp4                      # derive 60fps + GIF
bash add-music.sh animation-60fps.mp4                      # add the default tech BGM
# or for different scenes:
bash add-music.sh tutorial-demo.mp4 --mood=tutorial
bash add-music.sh product-promo.mp4 --mood=ad --out=promo-final.mp4
```

### 3. `convert-formats.sh` — MP4 → 60fps MP4 + GIF

Generates a 60fps version and a GIF from an existing MP4.

```bash
bash $HD/scripts/convert-formats.sh <input.mp4> [gif_width] [--minterpolate]
```

Outputs (same directory as the input):
- `<name>-60fps.mp4` — `fps=60` frame duplication by default (broad compatibility); add `--minterpolate` for high-quality interpolation
- `<name>.gif` — palette-optimized GIF (960 wide by default; changeable)

**Choosing the 60fps mode**:

| Mode | Command | Compatibility | Use |
|---|---|---|---|
| Frame duplication (default) | `convert-formats.sh in.mp4` | QuickTime/Safari/Chrome/VLC all fine | general delivery, uploading to platforms, social media |
| minterpolate interpolation | `convert-formats.sh in.mp4 --minterpolate` | macOS QuickTime/Safari may refuse to open | showcase contexts that need real interpolation, such as Bilibili; **you must test the target player locally before delivery** |

Why is the default frame duplication now? The H.264 elementary stream that minterpolate outputs has a known compatibility bug — when minterpolate was the default, "macOS QuickTime won't open it" came up repeatedly. Details in `animation-pitfalls.md` §14.

The `gif_width` parameter:
- 960 (default) — fine for social platforms generally
- 1280 — sharper but a bigger file
- 600 — loads first on Twitter/X

### 4. `render-video-seek.js` — true 60fps / deterministic rendering (recommended for high-quality delivery)

The recordVideo path in `render-video.js` has three inherent limits: the frame rate is locked at 25fps by the Chromium compositor, there are loading black frames at the start that need trimming, and 60fps can only come from post-hoc minterpolate interpolation (with ghosting + the macOS QuickTime compatibility bug, see `animation-pitfalls.md §14`). When you need **true 60fps, deterministic output, or delivery to Bilibili/portfolios**, switch to seek rendering.

It seeks to each timestamp, screenshots, then encodes the PNG sequence to MP4 with ffmpeg. The technical core borrows the "freeze the clock + seek and screenshot" approach of HeyGen HyperFrames (Apache 2.0), but pulls in no third-party packages — only the playwright + ffmpeg this skill already has, so it is runtime-neutral.

```bash
NODE_PATH=$(npm root -g) node $HD/scripts/render-video-seek.js <html file> --fps=60
```

Parameters: `--duration` · `--fps` (default 60) · `--width` · `--height` · `--concurrency` (default 4 workers in parallel) · `--settle` (wait a few rAFs after seeking before screenshotting, default 2; raise it for layout-heavy animation) · `--keep-chrome`. Output goes to the same directory as the HTML with the same name and `.mp4`.

It solves the three recordVideo dead ends head-on:
- **Truly arbitrary native frame rate**: `--fps=60` produces true 60fps (every frame is a real seek frame), no longer going through minterpolate in `convert-formats.sh`, sidestepping ghosting + the macOS compatibility bug
- **No black frames at the start**: it does not record the screen, so there are no loading black frames at all, and no need for `--trim` / `--fontwait`
- **Deterministic**: seeking to a timestamp and screenshotting gives the same output for the same input, unaffected by machine load or dropped frames

**Applicability boundary (important)**: it only supports animation that runs on a Stage clock — `<Stage>` in `assets/animations.jsx` or `<NarrationStage>` in `narration_stage.jsx`, which respond to `window.__seekRender` by freezing their self-driven clock and expose `window.__seek(t)`. Pure CSS `@keyframes` / Lottie / hand-written non-Stage animation does not honor `__seek`; keep using `render-video.js` for those (the script errors out and says so when it cannot detect `__seek`).

**Cost**: per-frame screenshots mean a long video can take longer in total than real-time recordVideo (mitigated by multiple workers via `--concurrency`); lots of temporary PNGs take disk, so close other memory-hungry apps before rendering.

**Either/or strategy**: still use `render-video.js` by default (zero risk, covers every animation type); when you need true 60fps / determinism / high-quality delivery and the animation runs on a Stage clock, use `render-video-seek.js`. For long narrated animations, use `render-narration.sh --seek` to do seek rendering + mixing in one command.

## Complete process (the standard recommendation)

After the user says "export video":

```bash
cd <project directory>

# Assume $SKILL points at this skill's root directory (substitute your own install location)

# 1. Record the 25fps base MP4
NODE_PATH=$(npm root -g) node "$SKILL/scripts/render-video.js" my-animation.html

# 2. Derive the 60fps MP4 and the GIF
bash "$SKILL/scripts/convert-formats.sh" my-animation.mp4

# Output list:
# my-animation.mp4         (25fps · 1-2 MB)
# my-animation-60fps.mp4   (60fps · 1.5-3 MB)
# my-animation.gif         (15fps · 2-4 MB)
```

## Technical details (for troubleshooting)

### Playwright recordVideo pitfalls

- The frame rate is fixed at 25fps; you cannot record 60fps directly (the Chromium headless compositor ceiling)
- Recording starts the moment the context is created, so you must trim the loading time at the front
- Defaults to webm, which needs ffmpeg conversion to H.264 MP4 to play everywhere

`render-video.js` already handles the above.

### ffmpeg minterpolate parameters

Current configuration: `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`

- `mi_mode=mci` — motion compensation interpolation
- `mc_mode=aobmc` — adaptive overlapped block motion compensation
- `me_mode=bidir` — bidirectional motion estimation
- `vsbmc=1` — variable size block motion compensation

Works well on CSS **transform animation** (translate/scale/rotate).
On **pure fades** it can produce mild ghosting — if the user objects, degrade to simple frame duplication:

```bash
ffmpeg -i input.mp4 -r 60 -c:v libx264 ... output.mp4
```

### Why the GIF palette needs two passes

A GIF has only 256 colors. A single-pass GIF compresses the whole animation into a generic 256-color palette, which smears a delicate palette like beige ground + orange.

Two passes:
1. `palettegen=stats_mode=diff` — scan the whole film first and generate an **optimal palette for this animation**
2. `paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle` — encode with that palette; rectangle diff updates only the changed regions, cutting the file size substantially

For fade transitions, `dither=bayer` is smoother than `none`, at a slightly larger file size.

## Pre-flight check (before exporting)

A 30-second self-check before exporting:

- [ ] The HTML has run through completely in a browser with no console errors
- [ ] Frame 0 of the animation is the complete initial state (not a blank loading frame)
- [ ] The last frame of the animation is a settled closing state (not cut off halfway)
- [ ] Fonts/images/emoji all render correctly (see `animation-pitfalls.md`)
- [ ] The Duration parameter matches the actual animation duration in the HTML
- [ ] Stage in the HTML detects `window.__recording` and forces loop=false (mandatory for a hand-written Stage; `assets/animations.jsx` handles it)
- [ ] The closing Sprite has `fadeOut={0}` (the final video frame does not fade out)
- [ ] It contains the "Created by Studio" watermark (mandatory for animation scenes only; for third-party brand work add the "Unofficial · " prefix. See the "Promotional watermark template" section of this file and `references/modules/motion.md`)

## Notes to include at delivery

The standard note format to give the user after export:

```
**Complete delivery**

| File | Format | Spec | Size |
|---|---|---|---|
| foo.mp4 | MP4 | 1920×1080 · 25fps · H.264 | X MB |
| foo-60fps.mp4 | MP4 | 1920×1080 · 60fps (frame duplication by default; the interpolated version is labeled) · H.264 | X MB |
| foo.gif | GIF | 960×540 · 15fps · palette optimized | X MB |

**Notes**
- 60fps uses frame duplication by default (good compatibility); minterpolate interpolation only on explicit request (good on transform animation, prone to artifacts on complex frames); for true 60fps use render-video-seek.js to seek and record frame by frame
- The GIF uses palette optimization; a 30s animation compresses to about 3MB

Say the word if you want a different size or frame rate.
```

## Common follow-up requests

| The user says | Response |
|---|---|
| "it's too big" | MP4: raise CRF to 23-28; GIF: drop the resolution to 600 or the fps to 10 |
| "the GIF is too blurry" | raise `gif_width` to 1280; or suggest MP4 instead (WeChat Moments supports it too) |
| "I want portrait 9:16" | change the HTML source to `--width=1080 --height=1920` and re-record |
| "add a watermark" | add `-vf "drawtext=..."` in ffmpeg, or `overlay=` a PNG |
| "I want a transparent background" | MP4 does not support alpha; use WebM VP9 + alpha, or APNG |
| "I want lossless" | set CRF to 0 + preset veryslow (the file gets 10× bigger) |

## Promotional watermark template (animation exports only)

`references/modules/motion.md` requires animation MP4/GIF to carry a watermark by default; the template is below (on a dark ground switch to `rgba(255,255,255,0.35)`; third-party brand animation gets the "Unofficial · " prefix):

```jsx
<div style={{
  position: 'absolute', bottom: 24, right: 32,
  fontSize: 11, color: 'rgba(0,0,0,0.4)',
  letterSpacing: '0.15em', fontFamily: 'monospace',
  pointerEvents: 'none', zIndex: 100,
}}>
  Created by Studio
</div>
```
