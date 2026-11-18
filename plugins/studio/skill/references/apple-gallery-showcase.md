# Apple Gallery Showcase · gallery-wall animation style

> Inspiration: the Claude Design site hero video + Apple product-page "works wall" display
> Where it shipped: the studio launch hero v5
> Use when: **product launch hero animations, skill capability demos, portfolio showcases** — any scenario that has to display "many high-quality outputs" at once and steer the viewer's attention

---

## Trigger check: when to use this style

**Fits**:
- Ten or more real outputs to show on one screen (decks, apps, web pages, infographics)
- The audience is professional (developers, designers, product managers) and sensitive to "quality feel"
- The character you want to convey is "restrained, exhibition-like, premium, spatial"
- Focus and overview have to coexist (see details without losing the whole)

**Doesn't fit**:
- Single-product focus (use the product hero template from frontend-design)
- Emotion-driven or strongly narrative animation (use the timeline narrative template)
- Small screens / portrait (the tilted perspective blurs on a small canvas)

---

## Core visual tokens

```css
:root {
  /* light gallery palette */
  --bg:         #F5F5F7;   /* main canvas background — Apple site gray */
  --bg-warm:    #FAF9F5;   /* warm off-white variant */
  --ink:        #1D1D1F;   /* primary text color */
  --ink-80:     #3A3A3D;
  --ink-60:     #545458;
  --muted:      #86868B;   /* secondary text */
  --dim:        #C7C7CC;
  --hairline:   #E5E5EA;   /* 1px card border */
  --accent:     #D97757;   /* terracotta orange — Claude brand */
  --accent-deep:#B85D3D;

  --serif-cn: "Noto Serif SC", "Songti SC", Georgia, serif;
  --serif-en: "Source Serif 4", "Tiempos Headline", Georgia, serif;
  --sans:     "Inter", -apple-system, "PingFang SC", system-ui;
  --mono:     "JetBrains Mono", "SF Mono", ui-monospace;
}
```

> This palette is the studio's own brand choice for its launch film (close to the Claude ecosystem) and **is not a default**. When you apply this gallery technique to another subject, re-derive the colors from that subject — warm off-white plus terracotta is precisely the number-one item in the 2026 default-AI-look list.

**Key principles**:
1. **Never use a pure black background.** Black makes the work look like film, not "work output that could actually be adopted"
2. **Terracotta orange is the only hue accent**; everything else is grayscale + white
3. **Four font stacks** (serif EN + serif CN + sans + mono) build the character of a "publication" rather than an "internet product"

---

## Core layout patterns

### 1. Floating card (the basic unit of the whole style)

```css
.gallery-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 6px;                          /* the padding is the "mount board" */
  border: 1px solid var(--hairline);
  box-shadow:
    0 20px 60px -20px rgba(29, 29, 31, 0.12),   /* primary shadow, soft and long */
    0 6px 18px -6px rgba(29, 29, 31, 0.06);     /* second near-light layer, creates the lift */
  aspect-ratio: 16 / 9;                  /* uniform slide ratio */
  overflow: hidden;
}
.gallery-card img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 9px;                    /* slightly smaller than the card radius, visual nesting */
}
```

**What not to do**: edge-to-edge tiles (no padding, no border, no shadow) — that's infographic density, not an exhibition.

### 2. 3D tilted works wall

```css
.gallery-viewport {
  position: absolute; inset: 0;
  overflow: hidden;
  perspective: 2400px;                   /* deeper perspective so the tilt stays modest */
  perspective-origin: 50% 45%;
}
.gallery-canvas {
  width: 4320px;                         /* canvas = 2.25× viewport */
  height: 2520px;                        /* leaves room for the pan */
  transform-origin: center center;
  transform: perspective(2400px)
             rotateX(14deg)              /* tilt back */
             rotateY(-10deg)             /* turn left */
             rotateZ(-2deg);             /* slight roll so it doesn't look machine-perfect */
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 40px;
  padding: 60px;
}
```

**Parameter sweet spots**:
- rotateX: 10-15deg (much more and it's a VIP backdrop at a party)
- rotateY: ±8-12deg (the left-right symmetry)
- rotateZ: ±2-3deg (the human touch: "a machine didn't place this")
- perspective: 2000-2800px (below 2000 it goes fisheye, above 3000 it approaches orthographic)

### 3. 2×2 four-corner convergence (selection scene)

```css
.grid22 {
  display: grid;
  grid-template-columns: repeat(2, 800px);
  gap: 56px 64px;
  align-items: start;
}
```

Each card slides in from its own corner (tl/tr/bl/br) toward the center while fading in. The matching `cornerEntry` vectors:

```js
const cornerEntry = {
  tl: { dx: -700, dy: -500 },
  tr: { dx:  700, dy: -500 },
  bl: { dx: -700, dy:  500 },
  br: { dx:  700, dy:  500 },
};
```

---

## Five core animation modes

### Mode A · Four-corner convergence (0.8-1.2s)

Four elements slide in from the four corners of the viewport, scaling 0.85→1.0 on ease-out. Good as an opener that shows "choices in many directions".

```js
const inP = easeOut(clampLerp(t, start, end));
card.style.transform = `translate3d(${(1-inP)*ce.dx}px, ${(1-inP)*ce.dy}px, 0) scale(${0.85 + 0.15*inP})`;
card.style.opacity = inP;
```

### Mode B · Selected card grows, the rest slide out (0.8s)

The selected card scales 1.0→1.28; the others fade out + blur + drift back toward their corners:

```js
// selected
card.style.transform = `translate3d(${cellDx*outP}px, ${cellDy*outP}px, 0) scale(${1 + 0.28*easeOut(zoomP)})`;
// not selected
card.style.opacity = 1 - outP;
card.style.filter = `blur(${outP * 1.5}px)`;
```

**Key**: the unselected ones must blur, not merely fade. Blur fakes depth of field and visually "pushes the selected one forward".

### Mode C · Ripple expansion (1.7s)

From the center outward, delayed by distance, each card fades in and scales from 1.25x to 0.94x ("the camera pulls back"):

```js
const col = i % COLS, row = Math.floor(i / COLS);
const dc = col - (COLS-1)/2, dr = row - (ROWS-1)/2;
const dist = Math.sqrt(dc*dc + dr*dr);
const delay = (dist / maxDist) * 0.8;
const localT = Math.max(0, (t - rippleStart - delay) / 0.7);
card.style.opacity = easeOut(Math.min(1, localT));

// and scale the whole wall 1.25→0.94
const galleryScale = 1.25 - 0.31 * easeOut(rippleProgress);
```

### Mode D · Sinusoidal pan (continuous drift)

Combine a sine wave with a linear drift to avoid the marquee feel of "there's a start and there's an end":

```js
const panX = Math.sin(panT * 0.12) * 220 - panT * 8;    // drift left horizontally
const panY = Math.cos(panT * 0.09) * 120 - panT * 5;    // drift up vertically
const clampedX = Math.max(-900, Math.min(900, panX));   // clamp so edges never show
```

**Parameters**:
- Sine period `0.09-0.15 rad/s` (slow, one swing every ~30-50 seconds)
- Linear drift `5-8 px/s` (slower than the viewer blinks)
- Amplitude `120-220 px` (big enough to feel, small enough not to make anyone queasy)

### Mode E · Focus overlay (focus switching)

**Key design**: the focus overlay is a **flat element** (not tilted) floating above the tilted canvas. The selected slide scales from its tile position (~400×225) to the center of the screen (960×540); the background canvas doesn't change tilt but **dims to 45%**:

```js
// Focus overlay (flat, centered)
focusOverlay.style.width = (startW + (endW - startW) * focusIntensity) + 'px';
focusOverlay.style.height = (startH + (endH - startH) * focusIntensity) + 'px';
focusOverlay.style.opacity = focusIntensity;

// background cards dim but stay visible (key! do not mask 100%)
card.style.opacity = entryOp * (1 - 0.55 * focusIntensity);   // 1 → 0.45
card.style.filter = `brightness(${1 - 0.3 * focusIntensity})`;
```

**Sharpness iron rule**:
- The focus overlay's `<img>` must `src` the original image directly; **do not reuse the compressed thumbnails from the gallery**
- Preload all originals into a `new Image()[]` array up front
- The overlay computes `width/height` per frame; the browser resamples the original every frame

---

## Timeline architecture (reusable skeleton)

```js
const T = {
  DURATION: 25.0,
  s1_in: [0.0, 0.8],    s1_type: [1.0, 3.2],  s1_out: [3.5, 4.0],
  s2_in: [3.9, 5.1],    s2_hold: [5.1, 7.0],  s2_out: [7.0, 7.8],
  s3_hold: [7.8, 8.3],  s3_ripple: [8.3, 10.0],
  panStart: 8.6,
  focuses: [
    { start: 11.0, end: 12.7, idx: 2  },
    { start: 13.3, end: 15.0, idx: 3  },
    { start: 15.6, end: 17.3, idx: 10 },
    { start: 17.9, end: 19.6, idx: 16 },
  ],
  s4_walloff: [21.1, 21.8], s4_in: [21.8, 22.7], s4_hold: [23.7, 25.0],
};

// core easing (the historical v9 implementation used cubic; new projects default the main easing
// to expoOut — see best-practices §2 / the correction in hero-case-study mode 1)
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
function lerp(time, start, end, fromV, toV, easing) {
  if (time <= start) return fromV;
  if (time >= end) return toV;
  let p = (time - start) / (end - start);
  if (easing) p = easing(p);
  return fromV + (toV - fromV) * p;
}

// one render(t) function reads the timestamp and writes every element
function render(t) { /* ... */ }
requestAnimationFrame(function tick(now) {
  const t = ((now - startMs) / 1000) % T.DURATION;
  render(t);
  requestAnimationFrame(tick);
});
```

**The essence of the architecture**: **all state is derived from the timestamp t** — no state machine, no setTimeout. That buys you:
- Jump anywhere instantly with `window.__setTime(12.3)` (handy for frame-by-frame playwright capture)
- Seamless looping for free (t mod DURATION)
- Freeze any frame while debugging

---

## Texture details (easy to skip, fatal when you do)

### 1. SVG noise texture

A light background's worst enemy is looking "too flat". Overlay a very faint fractalNoise:

```html
<style>
.stage::before {
  content: '';
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.078  0 0 0 0 0.078  0 0 0 0 0.074  0 0 0 0.035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.5;
  pointer-events: none;
  z-index: 30;
}
</style>
```

It looks like nothing changed; take it away and you'll know it's there.

### 2. Corner brand mark

```html
<div class="corner-brand">
  <div class="mark"></div>
  <div>STUDIO · DESIGN</div>
</div>
```

```css
.corner-brand {
  position: absolute; top: 48px; left: 72px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
```

Visible only in the works-wall scene, fading in and out. Like a museum label.

### 3. Brand closing wordmark

```css
.brand-wordmark {
  font-family: var(--sans);
  font-size: 148px;
  font-weight: 700;
  letter-spacing: -0.045em;   /* negative tracking is the point — it packs the letters into a logotype */
}
.brand-wordmark .accent {
  color: var(--accent);
  font-weight: 500;           /* accent characters are actually lighter, for the visual contrast */
}
```

`letter-spacing: -0.045em` is the standard move for Apple product-page display type.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Looks like a PPT template | cards have no shadow / hairline | add the two-layer box-shadow + 1px border |
| The tilt looks cheap | only rotateY, no rotateZ | add ±2-3deg rotateZ to break the neatness |
| The pan feels "stuttery" | setTimeout or a CSS keyframes loop | rAF + continuous sin/cos functions |
| Text is unreadable during focus | reused the low-res gallery tile | dedicated overlay + original `src` |
| The background looks empty | flat `#F5F5F7` | overlay SVG fractalNoise at 0.5 opacity |
| Type feels too "internet" | Inter only | add Serif (one EN, one CN) + mono — three stacks |

---

## References

- Full implementation sample: hero-animation-v5.html (author's local sample, not distributed with the repo)
- Original inspiration: the claude.ai/design hero video
- Aesthetic references: Apple product pages, Dribbble shot collection pages

When you get an animation request to "display many high-quality outputs", copy the skeleton straight out of this file, swap the content, and retune the timing.
