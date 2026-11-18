# HyperFrames rendering backend · selection boundaries and operations manual

> Adopted after hands-on verification on 2026-07-17 (toolchain / Chinese fonts / proxy environment / migration / 3D — all five passed; the key data is embedded in this document).
> HyperFrames is HeyGen's open-source HTML→video framework (Apache 2.0): plain HTML + a paused GSAP timeline, with a headless browser seeking frame by frame for deterministic rendering.

## Selection boundaries (read this table before you start)

| Situation | Which rendering route to use |
|---|---|
| New animation project (default) | **HyperFrames**. The audit suite comes free; 3D/GSAP/Lottie/shader all unlocked |
| Need 3D / particles / physical inertia / shader transitions | HyperFrames (the in-house Stage cannot do it) |
| Old Stage demo to reuse/rework | Migrate it while you are in there (adapter recipe below, 20-30 minutes each); if you only re-render without changing anything, keep using render-video-seek.js |
| Weak runtime (no npm / cannot install dependencies / single file the user double-clicks) | In-house Stage (`assets/animations.jsx`), old flow unchanged |
| Interactive demo (the user plays with it in the browser, no video export) | In-house Stage or plain HTML; HyperFrames is a render pipeline, not an interaction framework |
| Long video with narration (driven by narration_stage) | **In-house narration pipeline** (`voiceover-pipeline.md` + `render-narration.sh`), not HyperFrames for now — dual time sources / subtitles / TTS timeline are deeply coupled to the in-house Stage; when this row and "animations default to HyperFrames" both apply, this row wins |
| Batch parameterised video (thousands of variants / template text swaps) | Remotion (see planning direction 5, independent of this skill's main flow) |

**The design language always has the final say**: narrative structure, the easing system, and the SFX/BGM two-track system all still apply in full (`animation-best-practices.md` / `audio-design-rules.md`); HyperFrames is only the implementation and rendering tool. For GSAP implementation recipes see `references/gsap-recipes.md`.

## Project scaffold

> ⚠️ Install warning: besides generating project files, `hyperframes init` also installs **19 hyperframes skills into
> `~/.claude/skills/`** (composition-contract docs for the rendering backend; pure documentation, no executable hooks). If that bothers you, run
> `npx hyperframes docs` first to see the local doc list, then decide whether to init.

```bash
npx -y hyperframes init <project-name> --example blank   # non-interactive requires --example
cd <project-name> && npm install
```

Generates index.html / hyperframes.json / meta.json / package.json (with the CLI version pinned) + a project-level CLAUDE.md. init installs the 19 hyperframes skills into `~/.claude/skills/` (already installed on this machine). For the composition-authoring contract read the hyperframes-core skill's SKILL.md (init installs it into each runtime's skill directory; Claude Code defaults to `~/.claude/skills/`; runtimes without a skill mechanism read the local docs from `npx hyperframes docs` instead), local docs via `npx hyperframes docs <topic>` (data-attributes / gsap / rendering / troubleshooting).

**Version policy**: the project package.json pins an exact version (the one actually verified here is 0.7.61). It iterates extremely fast (300+ releases); before upgrading run `npx hyperframes@latest upgrade --project . --check` to see the delta, then run a regression demo before you touch anything.

## Composition contract cheat sheet (read hyperframes-core for the full version)

- Root container: `data-composition-id` + `data-start` + `data-duration` + `data-width/height`
- Every timed element: `class="clip"` + `data-start` + `data-duration` + `data-track-index`
- The timeline must be paused and registered: `window.__timelines["<composition-id>"] = gsap.timeline({paused:true})`
- Video material uses `muted`; the audio track is a separate `<audio>` element
- **Deterministic logic only**: no `Date.now()` / `Math.random()` / runtime network fetch; use a seeded function for randomness
- Fonts: Google Fonts are fetched and injected by the compiler as deterministic @font-face (cached in `~/.cache/hyperframes/fonts/`); for system-only fonts (PingFang SC etc.) add a line `@font-face { font-family:"PingFang SC"; src: local("PingFang SC"); }` to pass lint
- Three.js goes through the `hf-seek` event adapter (`~/.claude/skills/hyperframes-animation/adapters/three.md`); the root container must declare `data-duration` explicitly

## Migrating an old demo · adapter recipe (measured at 20-30 minutes each)

An in-house Stage / pure render(t) animation does not need rewriting. Four steps:

1. **Wrap the container**: put an outer `#root` carrying the composition data attributes; making the whole `.stage` the single clip is the easiest (`class="stage clip"` + data-start/duration/track-index); change `.stage` from fixed-centring to absolute inset:0, and pin html/body to 1920×1080
2. **Delete self-driving code**: the rAF tick loop, fitStage/resize listeners, replay button, and the `__ready/__setTime/__seek` protocol all go (the renderer does not need them)
3. **Attach a proxy tween** (the core 12 lines):
   ```js
   const proxy = { t: 0 };
   const tl = gsap.timeline({ paused: true });
   tl.to(proxy, { t: DURATION, duration: DURATION, ease: "none",
     onUpdate: () => render(proxy.t) }, 0);
   window.__timelines = window.__timelines || {};
   window.__timelines["main"] = tl;
   render(0);   // required: onUpdate does not fire while the timeline sits at t=0, so without this line the first frame may be uninitialised
   ```
4. **Sweep for transitions**: search the whole file for `transition:` declarations. CSS transitions + class toggles run on wall-clock time, which is non-deterministic under frame-by-frame seeking; convert them into a pure function of t inside render(t) (lerp)

## Checking and rendering

```bash
npm run check                        # five-gate audit: lint+runtime+layout+motion+contrast
npx hyperframes check --no-contrast  # for dark cinematic looks (see below)
npx -y hyperframes@<pinned-version> render --fps 60   # final render; 30fps by default
```

- **check must be 0 error before you render** (except the contrast gate). lint catches a whole class of "no warning, but visually broken" bugs: letterSpacing jitter, missing fonts, non-determinism
- **The contrast gate trade-off**: it checks WCAG 4.5:1, which flatly conflicts with low-contrast watermarks/decorative text (16-40% opacity) in dark cinematic looks, and there is no per-element exemption. Dark cinematic output uniformly uses `--no-contrast`; the other four gates must still be 0 error. Do not skip it for light-background informational output; contrast errors there are usually real problems
- **Two-stage rendering**: get a quick cut at the default 30fps first, check it by eye + extracted frames, then do the `--fps 60` final render. 60fps, 600 frames, 1080p measured at about 20 seconds
- For output-side checks of the render (audio stream / black frames / loudness / duration) use `scripts/verify-video.sh` (see verification.md)

## Alpha channel (overlay title text/stickers straight onto the edit track)

`npx hyperframes render --format mov` outputs ProRes 4444 (yuva444p12le, with alpha; verified 2026-07-17 that compositing over a coloured background keeps soft shadows correctly semi-transparent); `--format webm` also keeps transparency at a smaller size; `--format png-sequence` outputs an RGBA frame sequence for AE/DaVinci. Composition-side requirements: set the html/body background to `transparent` and lay down no base colour. Overlay material like title text/corner tags/lower-thirds can now go straight onto the edit track with no keying. Note MOV is large (ProRes near-lossless, on the order of 15MB for 4 seconds); use it for delivery to the edit; use webm for network transfer.

## Audio

In a HyperFrames composition, `<audio>` elements can go straight onto the timeline (BGM/narration render with the picture). The current audio flow is unchanged: the SFX/BGM two-track system follows audio-design-rules.md, and post-mixing with add-music.sh / mix-voiceover.sh also works. Which route is better gets settled in practice; nothing is forced for now. For SFX cueing use `scripts/sfx-cues.sh <video> <cue-table.tsv> <output>` (cue table = three columns: seconds / sfx path / volume dB; distilled from B00 production, edit the table and re-run for a new cut in 10 seconds).

## Pitfall deltas (relative to the in-house pipeline)

The in-house pipeline's pitfalls (animation-pitfalls.md §7/10/12/13 recording-protocol class, §6 font timing, §15/17 network class) **do not apply** on the HyperFrames backend: the recording protocol is handled inside the framework, fonts are fetched at compile time, and the CDN is reachable under the measured proxy. There are four new pitfalls, already recorded in animation-pitfalls.md §18-21: CSS transition non-determinism, the proxy tween's first frame, the contrast gate conflict, and the fromTo immediateRender phantom.
