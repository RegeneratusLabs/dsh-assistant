# Gallery Ripple + Multi-Focus · the philosophy of scene choreography

> **A reusable visual choreography structure** distilled from the studio's hero animation v9 (25 seconds, 8 scenes).
> Not an animation production pipeline — it is about **in which situations this choreography is "right"**.
> Production reference: [hero-animation-v10-en.mp4 (V2.0 Release)](https://github.com/alchaincyf/huashu-design/releases/download/V2.0/hero-animation-v10-en.mp4) · [interactive online version](https://www.huasheng.ai/studio-hero/)

## In one sentence

> **When you have 20+ homogeneous visual materials and the scene needs to "express scale and depth", reach for Gallery Ripple + Multi-Focus rather than piling up layout.**

Generic SaaS feature animations, product launches, skill promotion, showing a body of work — as long as there are enough materials in a consistent style, this structure almost always lands.

---

## What this device is actually expressing

It is not "showing off materials" — it tells a story through **two rhythm changes**:

**Beat one · Ripple unfold (~1.5s)**: 48 cards spread from the center outward, and the audience is stunned by the "quantity" — "oh, this thing produces this much".

**Beat two · Multi-Focus (~8s, 4 cycles)**: while the camera pans slowly, 4 times it dims + desaturates the background and enlarges one card alone into the center of the screen — the audience switches from "the impact of quantity" to "the gaze at quality", each pass a steady 1.7s rhythm.

**Core narrative structure**: **scale (Ripple) → gaze (Focus × 4) → fade out (Walloff)**. These three beats together express "Breadth × Depth" — not only that you can make a lot, but that each one is worth stopping to look at.

Compare the counterexamples:

| Approach | What the audience perceives |
|------|---------|
| 48 cards arranged statically (no Ripple) | good-looking but no narrative, like a grid screenshot |
| Cutting quickly from one to the next (no Gallery context) | like a slideshow, losing the "sense of scale" |
| Ripple only, no Focus | stunned, but nothing specific is remembered |
| **Ripple + Focus × 4 (this recipe)** | **first awe at quantity, then a gaze at quality, then a calm fade-out — a complete emotional arc** |

---

## Preconditions (all must hold)

This choreography **is not universal**; all 4 of the following are required:

1. **Material scale ≥ 20 pieces, 30+ preferred**
   With fewer than 20 the Ripple looks "empty" — density only reads when every one of the 48 cells is in motion. v9 used 48 cells × 32 images (cycled to fill).

2. **Materials are visually consistent**
   All 16:9 slide previews / all app screenshots / all cover designs — aspect ratio, tonality and layout have to read as "one set". Mixing makes the Gallery look like a clipboard.

3. **Materials still carry readable information when enlarged alone**
   Focus enlarges one card to 960px wide; if the original goes blurry or the information is thin at that size, the Focus beat is dead. Reverse test: can you pick 4 out of the 48 as "the most representative"? If you cannot, the material quality is uneven.

4. **The scene itself is landscape or square, not portrait**
   The Gallery's 3D tilt (`rotateX(14deg) rotateY(-10deg)`) needs a sense of horizontal extension; in portrait the tilt reads as narrow and awkward.

**Fallback paths when a condition is missing**:

| What is missing | What to degrade to |
|-------|-----------|
| Fewer than 20 materials | switch to "3-5 pieces shown statically side by side + focus each in turn" |
| Inconsistent style | switch to a keynote-style "cover + 3 chapter spreads" |
| Thin information | switch to a "data-driven dashboard" or "one-liner + large type" |
| Portrait scene | switch to "vertical scroll + sticky cards" |

---

## Technical recipe (v9 production parameters)

### 4-layer structure

```
viewport (1920×1080, perspective: 2400px)
  └─ canvas (4320×2520, oversized overflow) → 3D tilt + pan
      └─ 8×6 grid = 48 cards (gap 40px, padding 60px)
          └─ img (16:9, border-radius 9px)
      └─ focus-overlay (absolute center, z-index 40)
          └─ img (matches selected slide)
```

**Key**: the canvas is 2.25× larger than the viewport, which is what gives the pan the feeling of "peeking into a larger world".

### Ripple unfold (distance-delay algorithm)

```js
// Each card's entrance time = distance from center × 0.8s delay
const col = i % 8, row = Math.floor(i / 8);
const dc = col - 3.5, dr = row - 2.5;       // offset from center
const dist = Math.hypot(dc, dr);
const maxDist = Math.hypot(3.5, 2.5);
const delay = (dist / maxDist) * 0.8;       // 0 → 0.8s
const localT = Math.max(0, (t - rippleStart - delay) / 0.7);
const opacity = expoOut(Math.min(1, localT));
```

**Core parameters**:
- Total duration 1.7s (`T.s3_ripple: [8.3, 10.0]`)
- Maximum delay 0.8s (the center comes out first, the corners last)
- Each card's entrance duration 0.7s
- Easing: `expoOut` (a burst, not smoothness)

**Happening at the same time**: the canvas scales from 1.25 → 0.94 (zoom out to reveal) — the synchronized pull-back that goes with the appearance.

### Multi-Focus (4-beat rhythm)

```js
T.focuses = [
  { start: 11.0, end: 12.7, idx: 2  },  // 1.7s
  { start: 13.3, end: 15.0, idx: 3  },  // 1.7s
  { start: 15.6, end: 17.3, idx: 10 },  // 1.7s
  { start: 17.9, end: 19.6, idx: 16 },  // 1.7s
];
```

**Rhythm rule**: each focus is 1.7s, with 0.6s of breathing room between them. 8s in total (11.0–19.6s).

**Inside each focus**:
- In ramp: 0.4s (`expoOut`)
- Hold: the middle 0.9s (`focusIntensity = 1`)
- Out ramp: 0.4s (`easeOut`)

**Background change (this is the key part)**:

```js
if (focusIntensity > 0) {
  const dimOp = entryOp * (1 - 0.6 * focusIntensity);  // dim to 40%
  const brt = 1 - 0.32 * focusIntensity;                // brightness 68%
  const sat = 1 - 0.35 * focusIntensity;                // saturate 65%
  card.style.filter = `brightness(${brt}) saturate(${sat})`;
}
```

**Not just opacity — desaturate and darken at the same time**. That makes the foreground overlay's color "pop out" rather than merely "get a bit brighter".

**Focus overlay size animation**:
- From 400×225 (entrance) → 960×540 (hold state)
- 3 layers of shadow outside it, plus a 3px accent outline ring, giving the sense of "being framed"

### Pan (continuity keeps stillness from being boring)

```js
const panT = Math.max(0, t - 8.6);
const panX = Math.sin(panT * 0.12) * 220 - panT * 8;
const panY = Math.cos(panT * 0.09) * 120 - panT * 5;
```

- Sine wave + linear drift, two layers of motion — not a pure loop, so the position is different at every moment
- X/Y at different frequencies (0.12 vs 0.09) so the eye cannot see a "regular cycle"
- Clamped at ±900/500px so it cannot drift out

**Why not a purely linear pan**: with pure linearity the audience "predicts" where it will be next second; sine + drift makes every second new, and under the 3D tilt it produces "a mild seasick feeling" (the good kind) that holds attention.

---

## 5 reusable patterns (distilled from the v6→v9 iterations)

### 1. **expoOut as the primary easing, not cubicOut**

`easeOut = 1 - (1-t)³` (smooth) vs `expoOut = 1 - 2^(-10t)` (bursts, then converges fast).

**Why**: expoOut reaches 90% in its first 30%, more like physical damping, and matches the intuition of "something heavy landing". Especially good for:
- Card entrances (sense of weight)
- Ripple spread (shock wave)
- Brand rising up (sense of settling)

**When to still use cubicOut**: focus out ramps, symmetric micro-motion.

### 2. **Paper-feel ground + terracotta accent (Anthropic lineage)**

> This is this skill's own hero animation's brand choice (Claude-ecosystem subject) — **do not carry it over to other subjects as a default**. What transfers is the method, "one accent threading every visual anchor", not these two color values.

```css
--bg: #F7F4EE;        /* warm paper */
--ink: #1D1D1F;       /* nearly black */
--accent: #D97757;    /* terracotta orange */
--hairline: #E4DED2;  /* warm hairline */
```

**Why**: a warm ground still "breathes" after GIF compression, where pure white starts to look like a screen. Terracotta as the only accent runs through the terminal prompt, the selected dir-card, the cursor, the brand hyphen, the focus ring — every visual anchor is threaded by this one color.

**The v5 lesson**: a noise overlay was added to imitate "paper grain", and GIF frame compression was ruined (every frame differed). v6 switched to "flat ground + warm shadows", kept 90% of the paper feel, and cut GIF size by 60%.

### 3. **Two shadow tiers faking depth, not real 3D**

```css
.gallery-card.depth-near { box-shadow: 0 32px 80px -22px rgba(60,40,20,0.22), ... }
.gallery-card.depth-far  { box-shadow: 0 14px 40px -16px rgba(60,40,20,0.10), ... }
```

Use the deterministic `sin(i × 1.7) + cos(i × 0.73)` to assign each card one of three shadow tiers, near/mid/far — **visually there is a sense of "three-dimensional stacking", but every frame's transform is completely unchanged and GPU cost is 0**.

**The price of real 3D**: a separate `translateZ` per card means the GPU computes 48 transforms + shadow blurs every frame. v4 tried it; Playwright struggled even to record at 25fps. v6's two shadow tiers differ by <5% to the eye, at a tenth of the cost.

### 4. **Weight change (font-variation-settings) is more cinematic than size change**

```js
const wght = 100 + (700 - 100) * morphP;  // 100 → 700 over 0.9s
wordmark.style.fontVariationSettings = `"wght" ${wght.toFixed(0)}`;
```

The brand wordmark goes Thin → Bold over a 0.9s ramp, with letter-spacing nudged along the way (-0.045 → -0.048em).

**Why it beats scaling**:
- The audience has seen scaling too many times; the expectation is set
- A weight change is an "inner filling out", like a balloon being inflated, rather than "being pushed closer"
- Variable fonts only became widespread in 2020+, so the audience subconsciously reads it as "modern"

**Limit**: you must use a font that supports variable fonts (Inter/Roboto Flex/Recursive etc.). An ordinary static font can only fake it (switching between a few fixed weights jumps).

### 5. **Corner brand as a low-intensity persistent signature**

During the Gallery phase there is a small `STUDIO · DESIGN` mark in the top-left corner, 16% opacity, 12px type, wide tracking.

**Why add it**:
- After the Ripple bursts the audience easily "loses focus" and forgets what they are looking at; a light mark in the top-left helps anchor them
- It is classier than a big full-screen logo — people who do branding know a signature does not need to shout
- It still leaves an attribution signal when the GIF gets screenshotted and shared

**Rule**: appear only in the middle section (when the frame is busy); off at the start (don't cover the terminal), off at the end (the brand reveal is the hero).

---

## Counterexamples: when not to use this choreography

**❌ Product demo (showing features)**: the Gallery flashes every piece past, and the audience remembers no single feature. Switch to "single-screen focus + tooltip annotations".

**❌ Data-driven content**: the audience needs to read numbers, and the Gallery's fast rhythm gives no time. Switch to "data charts + item-by-item reveal".

**❌ Story narrative**: the Gallery is a "parallel" structure, and a story needs "cause and effect". Switch to keynote chapter changes.

**❌ Only 3-5 materials**: the Ripple has no density and looks like "patches". Switch to "static arrangement + highlight one at a time".

**❌ Portrait (9:16)**: the 3D tilt needs horizontal extension; in portrait the tilt reads as "crooked" instead of "unfolding".

---

## How to judge whether this choreography fits your task

A quick three-step check:

**Step 1 · Material count**: count how many similar visual materials you have. < 15 → stop; 15-25 → stretch it; 25+ → use it directly.

**Step 2 · Consistency test**: put 4 random materials side by side — do they read as "one set"? If not → unify the style first, or change the approach.

**Step 3 · Narrative match**: is what you want to express "Breadth × Depth" (quantity × quality)? Or is it "flow", "function", "story"? If it is not the former, do not force it.

If all three are yes, fork the v6 HTML directly: change the `SLIDE_FILES` array and the timeline and it is reusable. Change the palette via `--bg / --accent / --ink`; reskin without changing the bones.

---

## Related reference

- Complete technical flow: [references/animations.md](animations.md) · [references/animation-best-practices.md](animation-best-practices.md)
- Animation export pipeline: [references/video-export.md](video-export.md)
- Audio setup (BGM + SFX, two tracks): [references/audio-design-rules.md](audio-design-rules.md)
- Horizontal reference in the Apple gallery style: [references/apple-gallery-showcase.md](apple-gallery-showcase.md)
- Source HTML (v6 + audio integration): `www.huasheng.ai/studio-hero/index.html`
