# GSAP Recipes · A translation layer from design language to GSAP timelines

> This file does exactly one thing: take the animation design language the studio has
> already settled (`animation-best-practices.md`'s five-act narrative, easing system,
> 8 movement-language rules and scene recipes, plus `cinematic-patterns.md`'s 22-second
> 5-scene template) and translate it into copy-paste-ready GSAP timeline implementation
> recipes, running on the HyperFrames render backend.
>
> **Design judgment follows this skill's own references; GSAP is only the implementation tool.**
> When to hover, which narrative arc to use, what counts as beautiful — go read
> `animation-best-practices.md` §0. This file only answers "how do I write that rule in GSAP".
> HyperFrames' composition contract (composition root attributes, `.clip` markers, render
> commands, check audit) lives in `references/hyperframes-backend.md`; this file cites it
> and never restates it.

---

## 0 · Base boilerplate (every composition starts here)

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
  window.__timelines = window.__timelines || {};

  const tl = gsap.timeline({
    paused: true,                                   // required. HyperFrames owns seeking
    defaults: { ease: "expo.out", duration: 0.6 },  // this skill's primary easing (see §1)
  });

  // ... every tween hangs off this one timeline ...

  window.__timelines["main"] = tl;  // key must equal the composition root's data-composition-id
</script>
```

Hard constraints (violate any one and the render result is undefined):

- The timeline must be `paused: true`, and **never call `tl.play()`** for render-critical animation
- The timeline must be built in synchronous code, not inside async / timers / event callbacks
- Render duration comes from the composition root's `data-duration`, not the timeline length. Do not pad length with empty tweens
- `repeat: -1` is forbidden. For looping motion, compute a finite repeat count from the visible duration
- Note: `defaults: { ease: "expo.out" }` differs from the `power3.out` house default in the
  hyperframes-animation docs. That is its taste; this skill's existing rule is
  "expoOut is the default primary easing", and the translation layer follows its own design language

---

## 1 · Easing map · custom easings → GSAP

The custom easing functions in `assets/animations.jsx`, mapped one by one to GSAP forms.
The first three are mathematically **the exact same curve**, not an approximation.

| Custom easing | Math definition | GSAP form | Relation | Use (existing rules) |
|---|---|---|---|---|
| `expoOut` | `1 - 2^(-10t)` | `"expo.out"` | exact match | **Default primary easing**. Card rise-in, panel entry, Terminal fade, focus overlay |
| `overshoot` | easeOutBack, c1=1.70158 | `"back.out"` (default 1.70158) or `"back.out(1.7)"` | exact match | Toggle switches, button pops, emphasis interactions |
| `spring` | easeOutElastic, period 2π/3 | `"elastic.out(1, 0.3)"` (i.e. the default `"elastic.out"`) | exact match | Geometry settling, physical landings, UI bounce |
| `easeIn` | `t²` | `"power1.in"` | exact match | Exits, Anticipation setup beats |
| `easeOut` | `1-(1-t)²` | `"power1.out"` | exact match | Light motion on secondary elements (caption fades etc.) |
| `easeInOut` | quad inOut | `"power1.inOut"` | exact match | Continuous motion (mouse-trail interpolation and other symmetric moves) |
| `linear` | `t` | `"none"` | exact match | Only for proxy-driven / constant-speed camera motion. **Forbidden on element animation** |
| `anticipation` | piecewise curve, dips to -0.3 then rises | no built-in equivalent; use a function ease (below) |  | Entrances with a preparation move |

### 1.1 anticipation · function ease

GSAP accepts any `(p) => number` as an ease; move the custom definition over verbatim:

```js
// Point-for-point identical to Easing.anticipation in animations.jsx
const anticipation = (t) => {
  if (t < 0.2) return -0.3 * (t / 0.2) * (t / 0.2);   // first 20%: dip backwards
  const a = (t - 0.2) / 0.8;
  return -0.012 + 1.012 * a * a * (3 - 2 * a);         // last 80%: smoothstep rise
};

tl.fromTo("#card", { y: 40 }, { y: 0, duration: 0.7, ease: anticipation }, "s2");
```

Note: this curve crosses 0 into negative values, so **use it only on transforms**
(y / scale / rotation) — never on opacity or color (it would push them outside the legal range).

### 1.2 The other spring option · baked spring (true seek-safe physics)

`"elastic.out(1, 0.3)"` is the exact equivalent of the custom spring; using it directly is fine.
When you want a true spring feel with **tunable damping** (say "lands with almost no overshoot,
just a long tail"), use the closed-form `springEase` from hyperframes-animation
(`adapters/gsap-easing-and-stagger.md` has the full 40-line implementation; the closed form is
a pure function of time, so it is seek-safe):

```js
// dampingFraction 1.0 = a settled landing with no overshoot; 0.6-0.7 ≈ the bounce of the custom spring
const settle = springEase({ response: 0.4, dampingFraction: 0.65 });
tl.fromTo("#hero", { scale: 0 }, { scale: 1,
  duration: settle.duration, ease: settle.ease }, "s4");   // duration must be used together, it is part of the physics
```

**Never** bring in a real-time spring library (integrators such as react-spring): state
accumulates frame by frame and cannot be seeked deterministically.

---

## 2 · Five-act narrative skeleton · Slow-Fast-Boom-Stop (15/15/40/20/10%)

Why: an animation with even rhythm is a tech demo; an animation with rhythm is a narrative (best-practices §1).

A labeled timeline skeleton template — change `D` to fit any total duration:

```js
const D = 15;   // total duration (seconds), kept equal to the composition root's data-duration
const at = (p) => D * p;

const tl = gsap.timeline({
  paused: true,
  defaults: { ease: "expo.out", duration: 0.6 },
});

// ── five labels, proportions 15 / 15 / 40 / 20 / 10 ──────────────────
tl.addLabel("s1_trigger",  at(0));     // slow · trigger: give humans reaction time, establish believability
tl.addLabel("s2_generate", at(0.15));  // medium · generate: the visual wow moment appears
tl.addLabel("s3_process",  at(0.30));  // fast · process: show controllability / density / detail
tl.addLabel("s4_boom",     at(0.70));  // Boom · detonation: pull back / 3D pop-out / panels erupt
tl.addLabel("s5_hold",     at(0.90));  // still · landing: Logo morph + abrupt stop

// ── S1 trigger (slow rhythm: a single action + a lot of white space)─────────────────────
tl.fromTo("#terminal", { y: 48, autoAlpha: 0 },
  { y: 0, autoAlpha: 1, duration: 0.8 }, "s1_trigger+=0.1");

// ── S2 generate (one clear wow moment, don't pile on moves)─────────────────────
tl.fromTo("#result-panel", { scale: 0.92, autoAlpha: 0 },
  { scale: 1, autoAlpha: 1, duration: 0.7 }, "s2_generate");

// ── S3 process (highest density: stagger, typewriter, focus switching all live here)──
tl.fromTo(".row", { y: 10, autoAlpha: 0 },
  { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.03 }, "s3_process");

// ── S4 boom (shot-level motion: pull back / rotationX / element eruption)───────
tl.to("#stage", { scale: 0.82, rotationX: 8, duration: 1.2,
  ease: "expo.inOut" }, "s4_boom");

// ── S5 landing (Logo morph resolves, see §3.6; nothing happens after this)────────
// the last ~0.5s is a deliberate still hold: no tween, and never fade to black

window.__timelines["main"] = tl;
```

Key points:

- **White space after S5**: `data-duration` covers to the very end, but there is no tween on
  the timeline, so the frame holds on the final state. That is how "abrupt stop" is implemented
  (no fade-out ending)
- The 22-second 5-scene template (cinematic-patterns Pattern B) is isomorphic: swap the
  proportions for Invoke 3-4s / Process 5-6s / Insight 4-5s / Output 3-4s / Hero 4-5s, labels the same way
- Full-screen transitions between scenes use autoAlpha crossfades + offsets, not display switching
  (`display` / bare `visibility` are renderer no-go zones; show/hide is always `autoAlpha`)

---

## 3 · The 8 movement-language rules · translated one by one

### 3.1 Never pure black or pure white for the base color

Not a timeline rule: the base color is static CSS, a neutral with color temperature, and the
concrete values come from the brand spec. The only GSAP connection: when the base color changes
between scenes, tween `backgroundColor` (it is on the allow list), and the two scenes' base
colors should be in the same family (cinematic-patterns §2's palette consistency constraint):

```js
tl.to("#stage", { backgroundColor: "#F4EFE6", duration: 0.8, ease: "sine.inOut" }, "s4_boom");
```

### 3.2 Easing is never linear

Why: `linear` makes numeric elements feel mechanical; `expoOut` gives physical weight (best-practices §2).

Implementation: write `ease: "expo.out"` in the timeline `defaults` (see the §0 boilerplate),
and override individual tweens per the §1 map. `ease: "none"` is allowed in exactly two places:
proxy-driven tweens (§7) and deliberately mechanical motion (a constant-speed camera pan).

### 3.3 Slow-Fast-Boom-Stop

See the §2 skeleton; not repeated here.

### 3.4 Show the "process", not the "magic result"

Why: the product is a collaborator, not a magician; showing tweaks / error fixes / redlines
strikes at the "one-click magic" AI slop (best-practices §3.4).

The two most-used "sense of process" recipes:

**Chunk Reveal (simulating token streaming)**. The original recipe used `setTimeout + Math.random`,
both illegal under seek rendering. Translated into "precomputed schedule + proxy driver", seek-safe in both directions:

```js
// Why not tl.call(): callbacks are irreversible; scrubbing back in preview leaves stale state
const rand = mulberry32(42);                              // seeded random, see §7.4
const text = "为你生成了三个候选方案，第一个最激进。";
const chunks = text.split(/(?=[，。、；])|(?<=[，。、；])/); // split the Chinese text on punctuation into chunks
const times = []; let acc = 0;
chunks.forEach(() => { acc += 0.04 + rand() * 0.08; times.push(acc); }); // irregular 40-120ms

const tw = { t: 0 };
tl.to(tw, {
  t: acc, duration: acc, ease: "none",
  onUpdate: () => {   // recompute the full visible text from t each frame: pure, correct when scrubbing too
    let n = 0;
    while (n < times.length && times[n] <= tw.t) n++;
    document.querySelector("#stream").textContent = chunks.slice(0, n).join("");
  },
}, "s2_generate+=0.3");
```

**Number counter (showing real data climbing)**:

```js
// snap guarantees integers; innerText is the counter form HyperFrames recognizes
tl.fromTo("#metric", { innerText: 0 },
  { innerText: 237, snap: { innerText: 1 }, duration: 1.2, ease: "expo.out" }, "s3_process");
```

For thousands separators / suffix formatting, switch to a proxy + onUpdate (derive
`toLocaleString` from `tw.v`); the pattern is the same.

### 3.5 Mouse trail · arc + hand tremor

Why: a linearly interpolated mouse feels subliminally machine-like; a real hand "accelerates,
arcs, decelerates to correct" (best-practices §3.5).

A Bézier arc cannot be expressed with ordinary property tweens, so drive it with a proxy.
Do not use Perlin for the tremor (the original relied on runtime noise); use the sum of two
sines at incommensurable frequencies — deterministic and equivalent:

```js
const mouse = { p: 0 };
const P0 = [100, 100];                       // start
const P2 = [tx, ty];                          // end (the click target)
const P1 = [tx - 200, ty + 80];               // control point: off the midpoint, so it arcs

tl.to(mouse, {
  p: 1, duration: 1.1, ease: "power1.inOut",  // symmetric easing: accelerate out, decelerate in
  onUpdate: () => {
    const t = mouse.p;
    let x = (1-t)*(1-t)*P0[0] + 2*(1-t)*t*P1[0] + t*t*P2[0];
    let y = (1-t)*(1-t)*P0[1] + 2*(1-t)*t*P1[1] + t*t*P2[1];
    x += Math.sin(t * 47.13) * 2 * (1 - t);   // ±2px tremor, converging near the target
    y += Math.sin(t * 33.7 + 1.3) * 2 * (1 - t);
    gsap.set("#cursor", { x, y });            // everything derives from p, seek-safe
  },
}, "s1_trigger+=0.5");

// Click feedback: Anticipation shrink then bounce back
tl.to("#cursor", { scale: 0.85, duration: 0.08, ease: "power1.in" }, ">");
tl.to("#cursor", { scale: 1, duration: 0.25, ease: "back.out" }, ">");
```

### 3.6 Logo morph resolve (Morph)

Why: a Logo fading in carries no narrative resolution; make the previous visual element
"collapse" and then "inflate" into the Logo, so the narrative collapses onto the brand point
(best-practices §3.6).

Blur goes through a CSS variable (`filter` is paint-only and seek-safe, the approach the
official depth-of-field-blur rule endorses):

```css
#lastVisual, #logo { --blur: 0px; filter: blur(var(--blur)); will-change: filter; }
```

```js
tl.addLabel("morph", "s5_hold-=0.3");

// Collapse: the previous visual shrinks to a color block, motion blur rises
tl.to("#lastVisual", { scale: 0.1, "--blur": "6px",
  duration: 0.5, ease: "expo.out" }, "morph");

// Inflate: the Logo pops out of the block's center, blur converges to sharp
tl.fromTo("#logo",
  { scale: 0.1, "--blur": "6px", autoAlpha: 0 },
  { scale: 1, "--blur": "0px", autoAlpha: 1, duration: 0.6, ease: "back.out" },
  "morph+=0.35");                              // ~150ms of overlap = a fast cut

tl.to("#lastVisual", { autoAlpha: 0, duration: 0.15 }, "morph+=0.5");
// after that: hold, no tween, abrupt stop
```

### 3.7 Serif + sans-serif pairing

Not a timeline rule: static CSS, font choice goes through the brand spec.
The HyperFrames compiler automatically fetches Google Fonts and injects a deterministic @font-face
(measured in Phase 0; the custom pipeline's font-timing pain does not exist in the new backend),
so just reference Google Fonts normally in CSS.

### 3.8 Focus shift = background dimmed + foreground sharpened + Flash lead

Why: when you only drop opacity the non-focus elements stay sharp; you must add blur for them
to really recede (best-practices §3.8).

All three filters go through CSS variables; GSAP tweens the variables themselves:

```css
.tile {
  --f: 0;   /* focusIntensity 0→1 */
  filter: brightness(calc(1 - 0.5 * var(--f)))
          saturate(calc(1 - 0.3 * var(--f)))
          blur(calc(var(--f) * 4px));          /* ← the point: blur is what makes non-focus recede */
  will-change: filter;
}
```

```js
tl.addLabel("focus", "s3_process+=1.5");

// Non-focus elements: all three filters + dim in one tween
tl.to(".tile:not(.focus-target)", {
  "--f": 1, opacity: 0.4, duration: 0.5, ease: "expo.out",
}, "focus");

// Flash highlight to pull the eye back.
// Note: the original used element.animate() (WAAPI), which runs on the wall clock and is
// nondeterministic under seek; it must be translated into a tween
tl.fromTo("#focusFlash",
  { backgroundColor: "rgba(255,255,255,0.3)" },
  { backgroundColor: "rgba(255,255,255,0)", duration: 0.15, ease: "power1.out" },
  "focus+=0.5");

// Focus release: settle sharp. Blur must return to 0 before handing off to the next scene;
// stopping half-blurred reads to the audience as "the render has a bug"
tl.to(".tile", { "--f": 0, opacity: 1, duration: 0.5, ease: "power2.inOut" }, "focus+=2.5");
```

Performance constraint (from the official DoF rule): blur radius ≤24px on large-area elements;
prefer "dim + moderate blur" over maxing out blur; add `will-change: filter` only on elements
that actually animate blur.

---

## 4 · Concrete motion techniques · the GSAP version of the §4 snippets

### 4.1 FLIP / Shared Element (a button inflating into an input)

Why: one element transitions between two states, not two elements cross-fading (best-practices §4.1).

The original used Framer Motion's layoutId. On the GSAP side we do not bring in the Flip plugin
(unverified under HyperFrames); compute it by hand instead — the composition's viewport is fixed
(data-width/height) and both states' geometry are design constants, so hardcode them with fromTo.
Offset and scale all go through transform, and the element stays at its final layout position:

```css
/* The element is laid out in its "final" state; the start state is expressed by transform */
#search-box { width: 560px; height: 56px; }   /* static final state, sizes are not tweened */
```

```js
// Start-state geometry: button 120x44 at (400, 300); final-state input 560x56 at (200, 300)
tl.fromTo("#search-box",
  { x: 200, y: 0, scaleX: 120/560, scaleY: 44/56, transformOrigin: "left top" },
  { x: 0,   y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: "expo.out" },
  "s2_generate");
// Inner text counter-scales or enters later, so scaleX does not stretch it (same handling as §4.2)
tl.fromTo("#search-box .placeholder", { autoAlpha: 0 },
  { autoAlpha: 1, duration: 0.3 }, "s2_generate+=0.4");
```

### 4.2 Breathing open (expand first, then fill)

Why: a panel should not animate width and height at once; expanding horizontally first and then
rising vertically is what physical objects do (best-practices §4.2).

The original tweened width/height directly, which is a reflow no-go zone under HyperFrames
(integer-pixel snapping; jitter is visible to the eye in slow segments, §7.2). Translate to
scaleX/scaleY, keeping the time offset unchanged:

```js
// L = total open duration; the first 40% widens, height starts rising at 30%, the two overlap
const L = 0.9;
tl.fromTo("#panel",
  { scaleX: 0, scaleY: 0.12, transformOrigin: "left top" },
  { scaleX: 1, duration: 0.4 * L, ease: "expo.out" }, "open");
tl.to("#panel", { scaleY: 1, duration: 0.7 * L, ease: "expo.out" }, "open+=" + 0.3 * L);

// Content surfaces only after the shell has opened: it matches the "expand then fill" image,
// and it hides the content distortion that scaling causes
tl.fromTo("#panel .content", { autoAlpha: 0, y: 8 },
  { autoAlpha: 1, y: 0, duration: 0.35 }, "open+=" + 0.75 * L);
```

Note the scale version is not pixel-faithful (radii and borders distort with the ratio). On a
solid-color / large-radius panel shell it is imperceptible; if the panel's border detail matters,
switch to "fixed shell + clip-path reveal of the content" and verify with extracted frames.

### 4.3 Staggered Fade-up (30ms stagger)

Why: a list entering item by item has more "object-ness" than a block appearing; 30ms is the
established interval (best-practices §4.3).

```js
tl.fromTo(".row",
  { y: 10, autoAlpha: 0 },
  { y: 0, autoAlpha: 1, duration: 0.4, ease: "expo.out", stagger: 0.03 },
  "s3_process");

// Variant: erupt from the center outward (common in S4 boom multi-panel eruptions)
tl.fromTo(".panel",
  { y: 24, autoAlpha: 0, scale: 0.96 },
  { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.out",
    stagger: { each: 0.03, from: "center" } },
  "s4_boom");
```

Use `fromTo`, not `from`: a sub-composition gets re-seeked repeatedly, and `from` snapshots the
start state at registration time, so it can drift after scrubbing; `fromTo` declares both ends
explicitly and is always consistent.

### 4.4 Hold 0.5s before the key result

Why: machines execute fast and continuously, but a human brain needs reaction time; a 0.5-second
stop before the key result is a courtesy to the audience (best-practices §4.4, §0.2 core belief #3).

In GSAP, "hold" is just an empty gap in the position parameter; use a label to write the pause as
an explicit design decision:

```js
// the moment generation completes
tl.addLabel("generated", "s2_generate+=1.2");
// freeze the loading state for 0.5s: no tween in those 0.5s, the audience stares at the loading state
tl.addLabel("reveal", "generated+=0.5");

tl.fromTo("#result", { scale: 0.94, autoAlpha: 0 },
  { scale: 1, autoAlpha: 1, duration: 0.7, ease: "expo.out" }, "reveal");
```

### 4.5 Anticipation → Action → Follow-through

Why: an animation with only Action is a PowerPoint animation; Disney's three beats give motion
a sense of life (best-practices §4.6).

Three sequential tweens, easing per the §1 map (preparation power1.in, action expo.out, rebound elastic):

```js
tl.addLabel("pop", "s2_generate+=0.2");
tl.to("#card", { scale: 0.95, duration: 0.12, ease: "power1.in"  }, "pop");        // preparation
tl.to("#card", { scale: 1.05, duration: 0.30, ease: "expo.out"   }, ">");          // action
tl.to("#card", { scale: 1.00, duration: 0.35, ease: "elastic.out(1, 0.3)" }, ">"); // rebound
```

Single-tween version: `ease: anticipation` (§1.1) does "preparation + action" in one step, then
add one more segment for the rebound.

### 4.6 3D perspective + translateZ layering

Why: rotateX 8° / rotateY -4° simulate the natural angle of a camera looking down from the
desktop's top-left corner (best-practices §4.7).

Perspective and layering are static CSS (copy the original recipe; perspective / translateZ need
no animation); the moving part (standing up on entry, the S4 pull-back) uses GSAP's 3D transform aliases:

```css
.stage-wrap { perspective: 2400px; perspective-origin: 50% 30%; }
.card-grid  { transform-style: preserve-3d; }
.card:nth-child(3n) { transform: translateZ(30px); }
.card:nth-child(5n) { transform: translateZ(-20px); }
.card:nth-child(7n) { transform: translateZ(60px); }
```

```js
// Entry: slowly stand up from front-on to the golden angle
tl.fromTo("#card-grid", { rotationX: 0, rotationY: 0 },
  { rotationX: 8, rotationY: -4, duration: 1.4, ease: "expo.out" }, "s2_generate");
```

### 4.7 Diagonal pan · move X and Y together at different frequencies

Why: different frequencies on X and Y avoid a regularized Lissajous loop and simulate the
diagonal drift of a handheld shot (best-practices §4.8).

The original computed `Math.sin(flowT * ...)` per frame; the GSAP version layers two yoyo tweens
with different durations (GSAP tracks x and y independently, so the two tweens do not fight).
repeat must be finite:

```js
// different periods (4.6s vs 2.9s) = different frequencies, the path never closes
// repeat count derived from the visible duration: Math.ceil(D / dur) covers the whole piece
tl.to("#stage", { x: 40, duration: 4.6, ease: "sine.inOut",
  yoyo: true, repeat: Math.ceil(D / 4.6) }, 0);
tl.to("#stage", { y: 30, duration: 2.9, ease: "sine.inOut",
  yoyo: true, repeat: Math.ceil(D / 2.9) }, 0);
```

### 4.8 Abrupt-stop ending

Why: a fade out carries no decision; the last frame must be clear and certain (best-practices §0.3 white space).

In implementation it means "write no code": after the S5 Logo lands, there is no tween left on the
timeline, and `data-duration` runs 0.5-1s past the last tween's end, so the frame holds on the
final state. If there is BGM, use a volume tween to pull the audio down at the tail (volume is on
the allow list):

```js
tl.to("#bgm", { volume: 0, duration: 0.4 }, "s5_hold+=0.8");  // audio cuts, picture does not move
```

---

## 5 · Scene recipes A/B/C · timeline structure essentials

The design judgment (which one, SFX density, BGM style) is in best-practices §5; here only the
timeline-side differences.

### Recipe A · Apple Keynote dramatic

- Skeleton: the §2 five-act structure as-is, with S4's Boom done fully
- defaults: `ease: "expo.out"`, overriding to `"back.out"` at emphasis interactions
- S4 signature move: rapid camera pull-back + drop. `tl.to("#stage", { scale: 0.78, y: -40, duration: 1.1, ease: "expo.inOut" }, "s4_boom")`
- S5: Logo Morph (§3.6) + ethereal single note + hold

### Recipe B · One-take tool-style

- Skeleton: **do not** use the five-act peak structure; one continuous flow. Place labels on BGM bars:
  `tl.addLabel("bar1", 0); tl.addLabel("bar2", 60/88*4);` (88 BPM, one bar ≈ 2.73s)
- Write the position parameter of key UI actions straight onto the kick/snare moments; the musical
  pulse is the interaction sound
- easing: `springEase` (§1.2) + `"expo.out"`, more settled than explosive
- No S4-style Boom; the ending is likewise abrupt

### Recipe C · Office-productivity narrative

- Skeleton: many scenes, hard cuts. One label per scene, fast autoAlpha cuts between scenes (0.15s)
  rather than long crossfades; pair with Dolly In/Out:
  `tl.fromTo("#scene2", { scale: 1.06 }, { scale: 1, duration: 1.2, ease: "expo.out" }, "sc2")`
- Toggle-type interactions are always `"back.out"`, panels always `"expo.out"`
- The whole piece must have exactly one highlight: a 3D pop-out (§4.6's rotationX + translateZ
  elements floating up), done once — showing off everywhere is a cheap signal (§0.3 restraint)

---

## 6 · Seek-safety rules (measured in Phase 0, all of them hit in practice)

HyperFrames rendering is frame-by-frame seek + screenshot. Any state that is not "a pure function
of time" produces nondeterministic results in the render, and **in preview it usually looks fine** —
only the rendered artifact exposes it.

### 6.1 No CSS transition + class switching · express everything as tweens

CSS transition runs on the browser wall clock, not the timeline. Frame-by-frame seeking makes each
frame a "state jump": the transition either never fires or starts from the wrong place. Hit for real
during the Phase 0 c3 migration.

```css
/* ✗ Old form: classList.add('lit') in JS, transitioned by CSS */
.capsule { transition: transform 0.3s ease; }
.capsule.lit { transform: scale(1.06); }
```

```js
// ✓ New form: the state change is itself a tween on the timeline
tl.to("#capsule", { scale: 1.06, duration: 0.3, ease: "expo.out" }, "lit_at");
tl.to("#capsule", { scale: 1.0,  duration: 0.3, ease: "expo.out" }, "lit_at+=1.2");
```

Adjacent no-go zones: `element.animate()` (WAAPI, also wall-clock; §3.8's Flash has its
translation), and CSS `@keyframes` animation used for render-critical motion.
Scan before delivery: `grep -n "transition:\|animation:\|\.animate(" index.html` — every hit is
either deleted or translated into a tween.

### 6.2 No animating reflow-triggering properties · use transform instead

Layout properties snap to integer device pixels during the browser's layout phase. Fast tweens hide
it; on a slow ease-out tail where each frame moves less than 1px you get "stall a few frames, jump
1px" — visible jitter. Phase 0's lint caught letterSpacing jittering frame by frame: exactly this
class of silent visual bug.

| ✗ Do not tween | ✓ Faithful substitute |
|---|---|
| `width` / `height` | `scaleX` / `scaleY` + `transformOrigin` (content handling in §4.2) |
| `top` / `left` / `right` / `bottom` | park the element at its CSS end position, tween the `x` / `y` offset |
| `fontSize` | `scale` (visually equivalent, sub-pixel smooth) |
| `letterSpacing` / `wordSpacing` | split per character and tween each character's `x` (uniform scale is not the same effect — it scales glyphs, not spacing) |
| `margin*` / `padding*` | fix the layout, animate `x` / `y` |

Repair principle: **reproduce the same visuals, remove only the jitter**. Passing lint is not the
standard; frame-by-frame comparison against the original animation is.

### 6.3 onUpdate does not fire at t=0 · proxy tweens must paint the first frame manually

When the timeline seeks to 0, a proxy tween's `onUpdate` may not fire, so the first frame is a
blank screen / the initial DOM. Every proxy-driven scene (§3.4 chunk reveal, §3.5 mouse, §7 the
old-demo adapter): call it once by hand after registering the timeline:

```js
window.__timelines["main"] = tl;
render(0);   // first-frame insurance: explicitly paint the t=0 picture
```

### 6.4 No Math.random / Date.now · use a seeded function for randomness

The same frame must yield the same picture on every seek. Runtime randomness = a different render
each time = no frame-by-frame rendering. When you need a "random feel" (particles, jitter,
irregular intervals), use mulberry32 and generate all random values once, **before building the
timeline** (the measured form in Phase 0's 3D particle demo):

```js
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260717);   // seed hardcoded; changing the seed = a different random pass

// Usage: pre-generate, never draw inside onUpdate
const offsets = Array.from({ length: 40 }, () => (rand() - 0.5) * 24);
```

Equally forbidden: `Date.now()`, `performance.now()`, any event-driven state (render mode has no
input events).

---

## 7 · Old-demo adapter recipe · hang render(t) onto GSAP

The animation core of the 21 in-house-engine old demos is a pure `render(t)` function. Migration
does not rewrite the animation logic; a proxy tween hangs render(t) on a GSAP timeline (measured in
Phase 0: 20-30 minutes per demo, not one line of animation code changed, validated on the 1134-line
c3 cinematic demo).

### 7.1 Proxy tween template (12 lines, the c3-validated original)

```js
// =============== HyperFrames adapter ===============
// The proxy tween drives the original render(t). Every frame is a pure function of timeline time:
// no rAF, no clock, no input state.
window.__timelines = window.__timelines || {};
const proxy = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(proxy, {
  t: T.DURATION,            // the old demo's total-duration constant
  duration: T.DURATION,
  ease: "none",             // time must map at constant speed; easing lives inside render(t)
  onUpdate: () => render(proxy.t),
}, 0);
window.__timelines["main"] = tl;

// First-frame insurance (onUpdate does not fire while the timeline sits at t=0, §6.3)
render(0);
```

### 7.2 The four migration steps

1. **Wrap root / clip**: add the composition root attributes to the outermost container
   (`data-composition-id="main"` + `data-duration` + dimensions), and add `.clip` plus
   `data-start` / `data-duration` / `data-track-index` to stage elements.
   Full contract in `hyperframes-backend.md`
2. **Delete self-driving**: remove the rAF loop, `setInterval`, auto-play logic, the
   `performance.now()` origin. `render(t)` takes only the t argument and no longer finds time itself
3. **Attach the proxy**: paste the §7.1 template, match `T.DURATION` to `data-duration`, and put
   `render(0)` at the end
4. **Scan transitions**: `grep -n "transition:\|animation:\|\.animate(\|Math.random\|Date.now\|performance.now"`
   and zero them out one by one. Class-switching effects become pure functions of t per §6.1 (the
   most common residue in old demos is exactly the "classList.add + transition" combo)

After migrating, run `npx hyperframes check` once (use `--no-contrast` for dark cinematic; the other
four gates must be 0 errors), then extract 3-4 key moments and compare frames against the old version.

### 7.3 When not to use the adapter

The adapter is a **legacy-migration** solution. New animation uses the native timeline style in
§0-§5 of this file: labels are readable, stagger is declarative, the GSAP inspector can check
tween by tween, whereas animation inside a big proxy black box is opaque to auditing tools.

---

## 8 · Pre-delivery self-check (GSAP side, supplementing the best-practices §7 list)

- [ ] Timeline `paused: true`, and the registration key equals `data-composition-id`?
- [ ] defaults is `expo.out`, and no bare `linear` / `ease` appears on element animation?
- [ ] All five labels present, with a hold of white space after S5 (no fade out)?
- [ ] `grep "transition:\|\.animate(\|Math.random\|Date.now"` returns 0?
- [ ] No tween on width / height / top / left / letterSpacing / fontSize?
- [ ] Every `repeat` is a finite number?
- [ ] Proxy scenes end with a `render(0)`?
- [ ] All blur / filter goes through CSS variables, and elements that animate blur have `will-change: filter`?
- [ ] Sub-compositions use `fromTo` for all entrances, never `from`?
- [ ] `npx hyperframes check` passes (dark pieces `--no-contrast`, everything else 0 errors)?

---

## 9 · Camera Rig recipe · the implementation layer for camera motion

Why: camera motion and element animation fighting over the same transform is the technical root of
confused camerawork (camera-language.md §3). Every shot-level tween funnels into a dedicated rig
container; camera state lives in one proxy object, and every frame derives the entire camera DOM
state from it — seek-safe.

### 9.1 rig container structure (static skeleton)

```html
<div id="viewport">                <!-- fixed viewport -->
  <div id="camera">                <!-- camera layer: only the camera transform -->
    <div id="world">...</div>      <!-- world layer: element animation happens only inside here -->
  </div>
  <div id="hud">...</div>          <!-- subtitles/marks: siblings of #camera, static by nature -->
</div>
```

```css
#viewport { position: relative; width: 1920px; height: 1080px; overflow: hidden; }
#camera   { position: absolute; inset: 0; perspective-origin: 960px 540px; }
#world    { position: absolute; transform-origin: 0 0; will-change: transform; }
/* pan margin insurance: #world size ≥ viewport + max pan amplitude + 8% margin (camera-language §3.3) */
```

### 9.2 Camera proxy + PageCam keyframe translation

The camera is a plain object; GSAP tweens its fields and `onUpdate` writes the state into the DOM.
Everything derives from cam, so scrubbing is correct too (the same proxy idea as §3.4 chunk reveal):

```js
const cam = { cx: 960, cy: 540, zoom: 1, rotX: 0, rotY: 0, rotZ: 0, persp: 1200 };
const camEl = document.querySelector("#camera");
const world = document.querySelector("#world");

// ── Planar mode (pure zoom + pan, no rotation)──────────────────────────
function applyCam() {
  world.style.transform =
    `translate(${960 - cam.cx * cam.zoom}px, ${540 - cam.cy * cam.zoom}px) scale(${cam.zoom})`;
  applyCounter();
}

// ── 3D mode (rotX/rotY/rotZ present) · magnify via the CSS zoom property, not scale ──
// Layout-level scaling makes Chromium rasterize at the enlarged size, curing blurry text in 3D
// (camera-language §3.4, the most expensive knowledge in the library). zoom changes the
// coordinate system, so translate must be divided by zoom.
function applyCam3d() {
  camEl.style.perspective = `${cam.persp * cam.zoom}px`;
  world.style.zoom = cam.zoom;
  world.style.transformOrigin = `${cam.cx}px ${cam.cy}px`;
  world.style.transform =
    `translate(${960 / cam.zoom - cam.cx}px, ${540 / cam.zoom - cam.cy}px)` +
    ` rotateY(${cam.rotY}deg) rotateX(${cam.rotX}deg) rotateZ(${cam.rotZ}deg)`;
  applyCounter();
}
```

Note: CSS `zoom` triggers a re-layout every frame and is the **only legal exception** to the §6.2
reflow ban; it is allowed only on the `#world` camera layer. Under HyperFrames / Playwright offline
frame-by-frame rendering, per-frame cost does not affect the artifact; dropped frames in the live
preview are normal — trust the rendered artifact.

### 9.3 Log-duration helper (a fixed duration is where amateur feel comes from)

```js
// camera-language §4.2: 1→2x takes exactly 0.55s; visual speed is consistent at any zoom magnitude
function zoomDur(z1, z2) {
  return gsap.utils.clamp(0.30, 0.94,
    0.55 * Math.abs(Math.log(z2 / z1)) / Math.LN2);
}
```

### 9.4 Writing a camera passage (push in → hold → pan → curtain pull out)

Every camera tween drives cam; easing per camera-language §4.1: active push/pull
`power3.inOut`, follow-style `cubic-bezier(0.33,0,0.15,1)` (the custom ease is below).

```js
const followEase = gsap.parseEase("0.33,0,0.15,1");   // shotcraft camera default

// Establishing micro push: start at 1.06x, ease out to the wide shot over 3s (only when the piece
// is >14s and the first shot is >7s)
tl.fromTo(cam, { zoom: 1.06 },
  { zoom: 1, duration: 3.0, ease: "power2.out", onUpdate: applyCam }, 0);

// Push into a close-up: target (1240, 430), 1 → 1.8x, duration from the formula
tl.to(cam, { cx: 1240, cy: 430, zoom: 1.8,
  duration: zoomDur(1, 1.8), ease: "power3.inOut", onUpdate: applyCam },
  "s2_generate");
// hold ≥1.2s once the camera lands before moving on (writing no tween is the hold)

// Mid-shot focus transfer: do not return to 1x, pan straight over (inter-shot syntax: 0.22-0.45 turns into a pan)
tl.to(cam, { cx: 880, cy: 620,
  duration: 0.7, ease: followEase, onUpdate: applyCam }, "s3_process+=1.5");

// Curtain: 0.55s pull out + ≥0.8s wide-shot pause; data-duration covers to the end of the pause
tl.to(cam, { cx: 960, cy: 540, zoom: 1,
  duration: 0.55, ease: "power3.inOut", onUpdate: applyCam }, "s5_hold");

window.__timelines["main"] = tl;
applyCam();   // first-frame insurance: onUpdate does not fire while the timeline sits at t=0 (§6.3)
```

The camera budget is not written in code, it is written when planning shots: adjacent camera tween
start points ≥2.6s apart, ≤4-5 within a 15s window, zooms <1.25x not scheduled (camera-language §0/§4.4).

### 9.5 counter-transform · keep type size constant for following captions/annotations

Subtitles and chrome belong in `#hud` first (it does not follow the camera, zero cost). Annotations
that must live inside world and follow an element while keeping a constant type size cancel the
camera zoom in reverse:

```js
const counters = gsap.utils.toArray(".cam-counter");   // annotations that need constant type size
function applyCounter() {
  const inv = 1 / cam.zoom;
  counters.forEach((el) => { el.style.transform = `scale(${inv})`; });
}
```

`.cam-counter`'s own entrance animation goes on its **child elements**, so it does not fight the
counter scale for the transform.

### 9.6 Multi-layer parallax · all derived from cam

Each layer gets no independent tween; its speed factor multiplies the same camera offset (layer
factor ratio ≥2x, ≤4 layers, camera-language §8.1), so it is synchronized and seek-safe by nature:

```js
const LAYERS = [
  { el: document.querySelector("#bg"),  k: 0.35 },
  { el: document.querySelector("#mid"), k: 0.7  },
  { el: document.querySelector("#fg"),  k: 1.4  },
];
function applyParallax() {
  const dx = 960 - cam.cx, dy = 540 - cam.cy;    // camera offset
  LAYERS.forEach(({ el, k }) => {
    el.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
  });
}
// Just append applyParallax() to the end of applyCam()
```

### 9.7 Camera Rig self-check (append to the §8 list)

- [ ] Camera tweens touch only the cam proxy, and no element inside `#world` is touched by a camera tween?
- [ ] `applyCam()` is called for the first frame after registering the timeline?
- [ ] 3D text close-ups use CSS `zoom`, not `scale()` magnification that goes blurry?
- [ ] The `zoom` property appears only on `#world` (the reflow exception does not spread)?
- [ ] All push/pull durations come from `zoomDur()`, with no hand-written constants?
- [ ] After the curtain pull-out there is a ≥0.8s wide-shot hold with no tween?
