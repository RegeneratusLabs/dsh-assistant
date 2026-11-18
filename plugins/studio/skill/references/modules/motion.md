# Module · Animation / video / promo film

Everything timeline-driven goes here: HTML animation, product feature demos, launch films, concept videos with narration, MP4/GIF export. This is the module with the most capabilities in this skill, so it gets its own routing. Pass the narrow bridge in SKILL.md first (the three-direction gate still applies; the first-draft form is the direction board), then work from this manual.

## First decide which kind of film it is

| Film | Main line | Must read |
|---|---|---|
| Short animation / concept demo (<1 minute, no narration) | "General flow" below | `storyboard-basics.md` → `animation-pitfalls.md` → the backend file |
| Product UI is the protagonist (feature demo, commissioned job, interface showcase) | General flow + UI showcase | `ui-demo-animation.md` (decision tree for screenshot camerawork vs HTML rebuild, the eight UI showcase forms) + `assets/cursor.jsx` |
| Launch film / brand promo ("Apple-grade" expectations) | Three-direction board → once chosen, write the ten-thousand-word director's script | `launch-film-director-notes.md`, `cinematic-patterns.md` |
| Long video with narration (≥1 minute, explains one concept) | Narration-driven: write the narration script before the visuals | `voiceover-pipeline.md` + `assets/narration_stage.jsx` |
| Lots of homogeneous material (20+ screenshots/works, needs to convey scale) | Gallery-style scene | `hero-animation-case-study.md`, `apple-gallery-showcase.md` |
| Wants several versions / multi-platform distribution | Multi-perspective parallel | `multi-perspective-parallel-case-study.md` |

## General flow

1. **Three-direction board**: one direction board per direction — 1–2 real HTML stills of hero keyframes + a palette strip + one line of character positioning + the name of a reference work. Not three finished films, but they must be rendered frames (`references/directions.md`). The difference between the three directions lies in motion language and material, not only in color.
2. **Storyboard cards**: before any animation work starts, produce lightweight storyboard cards; each shot starts as a cover that moves (the format in `storyboard-basics.md` §5, including the [CAMERA] column and the acceptance frame numbers). For films ≥20s the storyboard cards go into `director-script.md`, along with a **visual density clause** — a director's script that only describes narrative and camerawork produces wireframes (`animation-best-practices.md` §6.5).
3. **Camera language**: for shot-level motion such as zoom / pan / transitions, read `camera-language.md` first (budget system, grammar between shots); for implementation see `gsap-recipes.md` §9.
4. **Pick a backend** (table below) and write the animation. Read `animation-pitfalls.md` before you start.
5. **Look at frames**: capture frames at key moments and actually look at them — cropping, collisions, empty frames, rhythms that only work on paper. Also capture the first second after every scene change.
6. **Sound**: by default deliver an MP4 with SFX + BGM ("Sound" below).
7. **Export and verify** ("Export" below).

## Backends

| Backend | When to use it | Read |
|---|---|---|
| **HyperFrames** (the default for new animation) | You need to render a finished film, need determinism, need 60fps | `hyperframes-backend.md` (selection boundaries, composition contract, migrating old demos) + `gsap-recipes.md` |
| **Stage + Sprite** (`assets/animations.jsx`) | Single-file delivery, purely interactive demo, weak runtime | `animations.md` |
| Narration-driven (`assets/narration_stage.jsx`) | Long video with voiceover | `voiceover-pipeline.md` |

If you hand-write Stage / Sprite (not using `animations.jsx`) you must implement two things, or recording video will definitely go wrong: set `window.__ready = true` synchronously on the tick's first frame; and force `loop = false` when `window.__recording === true` is detected.

## The two most common failures

- **A PowerPoint with voiceover**: each scene with its own independent layout + text fade-up + whole-page opacity switching. The film should be one continuous motion narrative: choose 1–2 hero elements that persist across scenes, each segment is a change in their state, and scenes morph into each other instead of cutting (`voiceover-pipeline.md`, "iron rule").
- **Fake chrome drawn into the frame**: a bottom progress bar, timecode, or copyright credit strip collides with the Stage's own scrubber. Put narrative content only in the frame (`animation-pitfalls.md` §11).

## Sound (on by default)

A silent version is unfinished. Do BGM and SFX as two tracks at once; doing only BGM is a third of the completeness.

- Design the cue list for SFX per `audio-design-rules.md`, using `assets/sfx/<category>/*.mp3` (37 prebuilt, `sfx-library.md`); about 6 per 10s for a launch hero, 0–2 per 10s for a tool demo; mark them with `scripts/sfx-cues.sh`
- BGM: `scripts/add-music.sh` (6 scene-specific tracks)
- Before delivery, confirm the audio track with `ffprobe -select_streams a`
- Skip only if the user says "no audio", "picture only", or "I'll do my own voiceover"

## Export

- HyperFrames: `npm run check` (five-gate audit; add `--no-contrast` for a dark cinematic look) → `npx hyperframes render --fps 60` → `scripts/verify-video.sh`
- In-house pipeline: `scripts/render-video.js` (25fps intermediate) or `scripts/render-video-seek.js --fps=60` (frame-by-frame seek, true 60fps, no black frames; use it when running off the Stage clock) → `scripts/convert-formats.sh` to derive a 60fps MP4 and a palette-optimized GIF
- With narration: `bash "$HD/scripts/render-narration.sh" demo.html --timeline=_narration/timeline.json [--bgm-mood=educational]` (internally calls `scripts/mix-voiceover.sh` to mix the voice; you can also use it directly for mixing alone)
- After the final render, an optional AI viewing critique (cloud capability, bring your own key, explicit confirmation, see SECURITY.md): `uv run "$HD/scripts/cloud/ai-review-video.py" --video <final cut> --context director-script.md --yes`; without a key, capture frames with `scripts/verify-video.sh` and look by hand (`ai-video-review.md`)
- Full documentation: `video-export.md`

**Watermark**: animation output carries "Created by Studio" by default (decks, infographics, prototypes and web pages never get one); unofficial tribute animations for third-party brands get the prefix "Unofficial · "; remove it if the user says so. Template in the last section of `video-export.md`.

**Gate**: before rendering a long film of ≥45s, `scripts/design-gate-hook.sh` checks `direction-approved.md` and blocks the render if the file is missing; if the user explicitly says to skip it, let it through with `SKIP_DESIGN_GATE=1`.

## Starter components

| File | Purpose |
|---|---|
| `assets/animations.jsx` | Stage + Sprite + useTime + Easing + interpolate |
| `assets/narration_stage.jsx` | NarrationStage + Scene + Cue + Subtitles (narration-driven) |
| `assets/cursor.jsx` | The cursor in product demos: four shapes, arc trajectories, click ripples, frame-deterministic |
| `assets/ios_frame.jsx`, `android_frame.jsx`, `macos_window.jsx`, `browser_window.jsx` | Device and window shells |

## Engine layer (reserved)

This module's method (directorial judgment, motion language, rhythm, sound design) and the execution engine (render, audio, verification) are two separate layers. What is listed above is the existing engine; when a new engine is added later, hook it into the "Backends" table and the "Sound" and "Export" sections, and the method-layer files do not need to change.
