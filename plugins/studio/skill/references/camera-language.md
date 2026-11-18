# Camera Language · The camera-direction system

> **When to read this file**: before any "shot-level" movement appears in the frame — zoom / pan / orbit /
> parallax / transition / establishing curtain call; whenever what moves is the "camera" and not the "elements",
> read this before writing the timeline.
> How elements move (entrance / stagger / physicality) belongs to `animation-best-practices.md`;
> this file answers **when the camera moves, by how much, for how long, and how shots connect**.
> For the runnable GSAP implementation (rig container, PageCam translation, logarithmic duration helper) see
> the "Camera Rig recipe" section of `gsap-recipes.md`; this file gives only design judgment and formulas.
>
> Parameter provenance convention: **(HuaRec)** = measured parameters from the HuaRec Studio camera-direction
> system; **(shotcraft)** = the video-shotcraft 106-card shot system; **(measured)** = live practice in this
> skill's projects; **(inferred)** = borrowed from general film vocabulary, parameters awaiting calibration.

---

## §0 · Thesis · camera movement is a budget system, not an effects system

Most AI-generated animation treats camera movement as "effects system" thinking: wherever a zoom can be added,
add a zoom; the more the camera moves, the more "premium" it is. This is the shared source of dizziness and
cheapness. The correct mental model comes from two axioms (HuaRec):

- **A1 Visibility invariant**: at any moment, what the viewer is supposed to look at must be inside the visible
  area (including an 8% safe margin). A shot that violates this should lower its zoom, merge shots, or not be shot.
- **A2 Comfort budget**: every camera change is an attention expenditure and must be managed as a budget.
  Once the budget is spent, even a great shot does not get shot.

| Budget item | Typical value | Feel |
|---|---|---|
| Interval between adjacent shot changes | ≥2.6-3.0s (restrained setting 5.0s) | Below 2.6s the viewer starts to feel dizzy; MTV-style fast cutting does not apply to product demos (HuaRec) |
| Camera changes within any 15s window | ≤4-5 (restrained setting 3) | Over that, cut the shot with the weakest motivation, don't compress the interval (HuaRec) |
| Lower bound on push zoom | 1.25x | A zoom below 1.25x is imperceptible as visual change — pure wobble, don't shoot it (the 1.06x establishing push is the only exception) (HuaRec) |
| Upper bound on push zoom | 2.3x (restrained setting 1.8x) | Above that pixel density cannot hold; swap the material before talking about zoom (HuaRec) |
| Shots per minute | Restrained ≤4 shots/min, normal ≤6 shots/min | "Leave breathing room, don't become MTV" (HuaRec) |

Then stack two style axioms (shotcraft):

1. **Cinematic feel = camera × light × cadence × sound, not flashy animation**. All four dimensions passing beats
   one dimension maxed out.
2. **The cadence preference is one-directional: slower rather than faster**. Every piece of historical user
   feedback points to "slow down / stay longer"; not one points to "speed up". When unsure of a duration, pick
   the longer one; when unsure whether to move the camera, pick not moving.

These two share their source with "defer to the viewer" in best-practices §0.2: the camera makes decisions on the
viewer's eyes' behalf, and the fewer and more accurate the decisions, the more the viewer trusts you.

---

## §1 · Shot-language vocabulary · camera-move motivation decision table

Before every camera action, ask the motivation first: **what question does this shot answer on the viewer's
behalf?** If you can't answer, don't move.

| Shot | Motivation (when to give it) | Parameter range | Taboo |
|---|---|---|---|
| **push in** | "Look here next": focus on a specific UI element / data point / keyword; tension ramping up | Steps 1.3 / 1.45 / 1.8 / 2.3 (see §4); duration follows the logarithmic formula; enter the shot 0.15s early (HuaRec) | No push below 1.25x; no push during full-screen-level change such as scrolling / page switching / video playback ("pushing in while scrolling makes you dizzy"); no camera move mid-narration (see §6 move on pause) (HuaRec) |
| **pull out** | Reveal the whole and the context: "so it belongs to a bigger system"; closing curtain call | Duration same logarithmic formula; curtain-call pull-out 0.55s + ≥0.8s full-shot pause (HuaRec) | No "out-in-out" pumping: when the gap between shots is shorter than the transition duration, connect straight to the next shot, don't return to 1x (see §5) (HuaRec) |
| **pan** | Transfer between two mid-distance foci (normalized distance 0.22-0.45); sweep one shot across several parallel elements | Only worth panning when the joint zoom ≥1.25; diagonal pans use dual-frequency sine (X/Y frequency ratio 0.22:0.35, amplitude 30-40px) (HuaRec / existing in this skill) | No pan when the focus distance is >0.45 (diagonal jump), drop the shot; pure single-axis pans feel mechanical — prefer diagonal |
| **orbit** | Single-protagonist texture close-up, the shot with the strongest "solid object" feel; the hero element's biography | rotY dominant + persp 1100-1200px; measured positions rotX46/rotY−30/rotZ9 → rotX42/rotY26/rotZ−7 (shotcraft) | One technique is the protagonist only once per film (shotcraft); banned on information-dense frames (camera position serves readability — lots of text means head-on) |
| **dolly zoom** | The reveal instant of a "worldview inversion": subject unchanged, context dramatically shifted | Fake recipe in §8: pin the subject, background scale 1→2.0-2.5 + opacity ≤0.6 (shotcraft) | At most once per film; using it without a narrative drop = pure showing off |
| **still** | Text reading, real-human-speed interaction demos, information-dense shots; the default answer when the budget is short | Brand wordmark settles and holds ≥1s; 0.5s of stillness at the end of batch effects; opening subject action arc ≥3s (shotcraft) | None. Staying still is always a legal choice — "giving no camera move" is itself a directing decision |

Two cross-cutting rules:

- **A sense of speed comes from acceleration, not from constant fast** (shotcraft). Constant-velocity motion reads
  as cheap PowerPoint; if you want it to feel "fast", use a short accelerating stretch + a long buffer, not halving
  the whole duration.
- **Camera position serves readability** (shotcraft): information-dense shots go head-on; text close-ups use a
  lateral horizontal position (rotY dominant, rotX very small); no global one-size-fits-all tilt; product films by
  default add no handheld shake.

---

## §2 · zoom vs dolly selection · the 3D real-or-fake ruling

"Pushing in" has two implementations with completely different feel; choose the type before writing code:

| Dimension | zoom (scale) | dolly (perspective + translateZ forward) |
|---|---|---|
| Parallax | None. All layers scale equally — the picture is "an image being magnified" | Yes. Near layers fast, far layers slow — the picture is "the camera moving forward through space" |
| Feel | Clean, informational; suited to UI close-ups / data focus | Spatial, cinematic; suited to hero display / atmosphere segments |
| Cost | Low: a single transform | High: needs a layered structure + preserve-3d, and it has a rasterization blur problem (§3.4) |
| Selection rule | Content is flat information (interfaces, documents, charts) → zoom | Content has a clear "foreground / subject / background" layering, and that layering is worth seeing → dolly |

**The 3D real-or-fake ruling** (the boundary line that resolves two older contradictions in this skill):

- Elements participating in 3D **≤8** → use real translateZ layering (the golden-angle recipe in best-practices §4.7 applies as written)
- Elements **≥20** → give up real 3D, use shadow / blur / brightness differences for fake depth (the position of hero-case-study)
- Between 8 and 20 → ask one question: does this shot need parallax? Only then use real 3D; otherwise fake depth.
  The cost of real 3D is not in writing it but in tuning it: every added layer adds another set of "perspective
  distortion + blurry text + z-order intersection" to hunt down.

---

## §3 · Camera Rig implementation conventions

Camera movement and element animation **must not fight over the same transform**. Every shot-level movement goes
through one dedicated container.

### 3.1 Layered container structure

```html
<div id="viewport">          <!-- fixed viewport, overflow: hidden, owns perspective -->
  <div id="camera">          <!-- camera layer: carries camera transform only, does nothing else -->
    <div id="world">         <!-- world layer: all picture content lives here; element animation only touches the inside of world -->
      ...scene content...
    </div>
  </div>
  <div id="hud">             <!-- subtitles / badges / chrome: sibling of #camera, naturally doesn't follow the camera -->
  </div>
</div>
```

Division-of-labor iron rules:

- Only camera tweens appear on `#camera` (translate / scale / rotate / zoom properties); element entrances, stagger
  and hover states are written on elements inside `#world`. The two layers know nothing of each other, so the camera
  can be re-arranged wholesale at any time without touching element animation
- Subtitles and chrome **go in `#hud` first**, staying still at zero cost; only for annotations that "must follow an
  element in world but keep a constant font size" (such as a following tooltip) do you apply a counter-transform on
  that element: `scale(1/zoom)` cancels the camera zoom inversely, updated in sync with the camera every frame
- **transform-origin is the push target point**: for flat zoom, set the origin at the target element's center before
  scaling, equivalent to "pointing the camera at it and pushing in". In PageCam mode, cx/cy carry the same duty

### 3.2 The PageCam keyframe model (shotcraft, 2.5D camera math)

Define camera state as a keyframe object; camera movement = interpolation between keyframes:

```
{ frame, cx, cy, zoom, rotX, rotY, rotZ, persp }
```

cx/cy are **the point the camera is aimed at in world coordinates**, zoom is the magnification. Taking a
1920×1080 canvas as the example (for other sizes replace 960/540 with W/2, H/2):

**Flat mode** (no rotation, pure zoom + pan):

```
transform: translate(960 − cx·zoom, 540 − cy·zoom) scale(zoom)
transform-origin: 0 0
```

**3D mode** (with rotX/rotY/rotZ):

```
outer (#camera): perspective: persp·zoom;  perspective-origin: 960px 540px
inner (#world):  zoom: {zoom};                        /* note this is the CSS zoom property, see §3.4 */
                Tx = 960/zoom − cx;  Ty = 540/zoom − cy
                transform: translate(Tx, Ty) rotateY() rotateX() rotateZ()
                transform-origin: cx cy
                transform-style: preserve-3d
```

Typical camera parameters (shotcraft, measured): full-page zoom 0.78 → close-up 2.6;
side-on rotY34 / rotX8 / persp1200 (side-on beats top-down — rotY dominant, rotX only a little);
for orbit start/end positions see the §1 table.

### 3.3 rig construction notes (camera-specific traps)

- **pan exposing edges**: `#world` must be larger than the viewport (bleed on all sides ≥ the largest pan amplitude +
  8% margin), otherwise panning reveals blank space outside the canvas. This is the flip side of axiom A1: what
  shouldn't be seen must not be visible either
- **perspective broken**: any intermediate layer between `#camera` and `#world` that adds `overflow: hidden`,
  `filter` or `opacity <1` creates a new stacking context, kills preserve-3d, and the 3D layering goes flat instantly.
  In 3D mode, filter effects go only on the innermost elements
- **per-frame out-of-bounds fallback** (HuaRec): when the camera focus follows a moving point, check each frame
  whether the target has left the visible area; if so, keep the zoom and correct minimally along the offending axis
  to pull it back to the boundary. Better the camera "gives way" than the target leaving frame

### 3.4 The CSS zoom rasterization technique · the root cure for blurry 3D text (the most expensive knowledge in the library, shotcraft)

**Problem**: in 3D mode, magnifying the page with `transform: scale()` makes Chromium rasterize at the element's
layout size and then scale the bitmap up — text is guaranteed to blur. The higher the zoom, the worse the blur;
above 2x it is not deliverable.

**Solution**: don't magnify with `transform: scale`; use the **CSS `zoom` property**. `zoom` is layout-level scaling:
Chromium re-lays-out and rasterizes at the magnified size, so text stays vector-sharp at any magnification.
This is precisely why the inner layer in the §3.2 3D-mode formula writes `zoom: {zoom}` instead of `scale({zoom})`.

Supporting points:

| Point | Approach | Source |
|---|---|---|
| Coordinate compensation | `zoom` changes the layout coordinate system, so translate amounts must be divided by zoom: `Tx = 960/zoom − cx` (already in the §3.2 formula) | (shotcraft) |
| Relation to the reflow ban | gsap-recipes §6.2 bans tweening layout properties because of integer-snap jitter; `zoom` is whole-page-level scaling, the snap amount is imperceptible, and the sharp-text payoff far outweighs it. **This technique is the only legal exception to §6.2, used only on the `#world` camera layer** | (measured) |
| Render environment | Fully applicable under HyperFrames / Playwright offline frame-by-frame seek rendering: the cost of re-laying-out each frame doesn't affect the output, only the render time. Real-time browser preview may drop frames — that is normal; the rendered output is authoritative | (shotcraft) |
| Bitmap material enhancement | Sample full-page screenshots at 2x; prepare separate 4x screenshots of close-up elements and cover the low-zoom texture with a 6f crossfade during the push | (shotcraft) |
| Depth-of-field atmosphere | DoF is atmosphere only: a blurred + masked gradient band at the top, no real per-layer depth of field | (shotcraft) |

---

## §4 · Camera easing and duration

### 4.1 Easing vocabulary

| Scenario | easing | Feel |
|---|---|---|
| Deliberate camera move (push in / pull out, with clear start and end points) | `cubic-bezier(0.65,0,0.35,1)` = GSAP `power3.inOut` | Stable at both ends, the "director giving you the shot" feel; **never linear, never a spring overshoot** (HuaRec) |
| Following camera move (camera chasing an action already underway) | `cubic-bezier(0.33,0,0.15,1)` | Light and quick start, extremely long brake — the camera "follows in" rather than "cuts over"; shotcraft's camera default |
| Sustained drift (idle drift, constant-speed tour) | `sine.inOut` yoyo or `none` | The only scenario where a constant-speed camera is allowed (existing rule in gsap-recipes §1); banned for actions with start and end points |
| Cursor / focus following smoothing | `quickTo` + ~0.15s smoothing; Catmull-Rom path interpolation | The zero-phase idea of forward+backward EMA: tracks tightly without shaking (HuaRec) |

When the two defaults conflict, the ruling: single push/pull trusts HuaRec (power3.inOut); compound moves and
multi-segment continuous camera work trust shotcraft (0.33,0,0.15,1).

### 4.2 The logarithmic zoom duration formula (a fixed duration is the source of amateurishness)

Every push/pull duration is determined by the amount of zoom change, guaranteeing that a zoom of any magnitude has
the same "visual speed":

```
duration = 0.55 × |ln(zoom₂ / zoom₁)| / ln 2      clamp to [0.30, 0.94] seconds
```

A 1→2x push takes exactly 0.55s; 1→1.3x is about 0.30s (bottoming out); 0.78→2.6x hits the ceiling 0.94s. (HuaRec)
Big shot-size transitions take longer, small ones shorter, preventing both "jumping there in one leap" and "dragging".

### 4.3 zoom step table

| Step | Zoom | Use | Feel |
|---|---|---|---|
| Establishing micro-push | 1.06x | Only for the opening establishing shot (§6); the viewer doesn't perceive a zoom, only that "the picture is alive" | The only step allowed below 1.25x (HuaRec) |
| Light push | 1.3x | Hinting focus: doesn't interrupt global reading, just says "look at this area" | |
| Medium push | 1.45x | Standard UI close-up: one panel / one code block | |
| Heavy push | 1.8x | Single-element close-up: one button / one number | The restrained setting's ceiling (HuaRec) |
| Ceiling | 2.3x | Extreme close-up; the material must hold up (2x screenshot / 4x slice, §3.4) | Past it, swap the material, don't force the push (HuaRec) |

Framing formula (HuaRec): `scale = 0.8 / max(normalized width, height of target bounding box)`, then clamp into the
step range. Content occupies 80% of the visible area, leaving 20% to breathe — never edge to edge.

### 4.4 Cadence budget (linked to the §0 budget table)

- Adjacent shot changes ≥2.6-3.0s apart; ≤4-5 within a 15s window (HuaRec)
- Enter the shot 0.15s before the action (camera arrives first, action happens after), and stay 1.2s after the action
  ends before moving on (HuaRec)
- An isolated small action shorter than 1.2s is not worth its own camera move — prevents "a pump per click" (HuaRec)

---

## §5 · Between-shots grammar · the core of dizziness prevention

**Dizziness is not caused by a single shot; it is caused by how shots connect.** "Out-in-out" pumping and repeated
diagonal jumps between distant foci account for the overwhelming majority of dizziness (HuaRec). For two adjacent
shots (gap <1.5s), split three ways by focus distance:

| Normalized focus distance | Connection | Explanation |
|---|---|---|
| <0.22 (near) | **merge shots** | Merge into one shot: take the joint bounding box of the two targets and recompute the zoom; one shot sees everything |
| 0.22-0.45 (mid) | **switch to a pan** | Better a slightly wider zoom (joint zoom ≥1.25) and one pan across, than an "out then in" |
| >0.45 (far / diagonal) | **drop the shot** | Cut the shot with the weaker motivation. **Never shoot two distant foci back to back** — the diagonal jump is the most dizzying connection of all |

Two timing rules to add (HuaRec):

- **Short gaps connect directly**: when the gap between adjacent shots is shorter than the transition duration, don't
  return to 1.0x — transition straight from the current zoom to the next shot's zoom and focus. Returning to 1x and
  pushing again is the direct source of a "pumping" feel
- **Only with a gap ≥1.5s is "pull out then push in" allowed**: the viewer has enough time to re-orient in the full
  shot, so out-in doesn't make them dizzy

---

## §6 · Cinematic opening and closing · establishing, curtain call, move on pause

Three pieces of grammar with extremely low cost and a clear lift in how finished the work feels (HuaRec):

1. **Establishing shot**: when the runtime is >14s and the first proper shot comes after 7s, insert a **[0, 3.0s]
   1.06x centered micro-push** at the opening: the film starts already lightly pushed in and eases back out to the
   full shot within 3 seconds. The viewer's first impression is "the camera is alive", not "the PowerPoint started
   playing"
2. **Full-shot curtain-call iron rule**: the last shot closes early, leaving 0.55s of pull-out transition +
   **≥0.8s of full-shot pause**. A finished film always ends on a still full shot, **never stopping abruptly while
   still pushed in**. Fully compatible with best-practices' "abrupt stop + hold" ending: the held frame must be the
   full shot
3. **Move on pause**: cut on action, move on pause. In animations with narration, if a camera move lands in the middle
   of speech, snap it earlier to the nearest speech-silence point (at most 0.8s earlier, **earlier only, never
   later**). The viewer's cognitive cost of moving their eyes is lowest during auditory gaps. When the narration
   pipeline (voiceover-pipeline.md) arranges shots, use narration's sentence gaps directly as snap points

---

## §7 · Transition grammar table · three layers of vocabulary

Transitions are an independent layer: seams are typed by **energy drop**, one form per seam, and transition frames
come out of the adjacent shots' budgets. "A widely praised launch film has not one bare cut from start to finish"
(shotcraft).

### 7.1 shot-transitions, six forms (transitions with presence, for seams with a large energy drop)

| Form | Applicable energy drop | Parameters | Trap |
|---|---|---|---|
| flash-wash | High→high, strong segment break | White peak 2-4f, 5f gradient on each side | The white flash covers only the cut point; don't reuse it as decoration |
| dip-to-dark | High→low, emotional downshift | Darken to the order of rgba(20,20,20,0.9), total length ≤0.6s | Don't linger in the dark — the viewer will think the film has ended |
| defocus-handoff | Mid→mid, switching between peer topics | Outgoing blur 0→8px overlapping incoming blur 8px→0 for ≥8f | Large-area blur ≤24px (DoF performance constraint) |
| title-card | Chapter-level separation | Card holds ≥1s, 0.3s transition on each side | ≤2 per film; more looks like a slide deck |
| whip-pan | Low→high, sharp energy rise | Hold ≥20f at both ends → 8f whip across 1.5 screens, peak ≥300px/f to blur convincingly (shotcraft) | Too slow and it is just a normal pan; if it doesn't blur through, it exposes the hand |
| mask-wipe | Spatial transfer, "passing through one interface into another" | Mask edge easing `(0.4,0,0.6,1)` (shotcraft) | The mask shape must come from an element already in the frame (window / card corner radius); a shape out of nowhere is slop |

### 7.2 hidden-cut, three forms (transitions the viewer never notices)

| Form | Approach | Source |
|---|---|---|
| flash-cut | A white flash straddles the hard cut point, 5f on each side, covering only the cut | (shotcraft, empirical parameters) |
| foreground occlusion cut | Swap scenes at the instant a foreground element (card / panel / cursor hand) sweeps across the full screen | (inferred: general film vocabulary, parameters awaiting measurement) |
| motion-blur cut | Hard cut on the peak frame of high-speed motion, both sides moving in the same direction, motion blur swallowing the cut point | (inferred: general film vocabulary, parameters awaiting measurement) |

### 7.3 travel, two forms (spatially continuous transitions — no energy drop, the scene moves)

| Form | Approach | Trap |
|---|---|---|
| shared-element reseat | An element of the previous shot (logo / card) moves continuously into its new position in the next shot — the shot-level version of the FLIP idea | The element must be the same identity in both shots; too much distortion breaks the recognition of "the same thing" |
| counter crossing | The camera pushes through the counter of a display letter (the hole in O / o / 0) into the next scene | The counter must be big enough (≥1/3 of screen height); the crossing segment's zoom uses the logarithmic duration ceiling of 0.94s |

Selection quick reference: large energy drop → pick one of the six; don't want it noticed → hidden-cut; the two scenes
are spatially continuous → travel. A hard cut is not banned; it must simply be "wrapped by any of the layers above".

---

## §8 · Multi-layer parallax recipe · fake dolly-zoom

### 8.1 parallax layer speed coefficients (shotcraft)

| Parameter | Typical value | Feel |
|---|---|---|
| Layer speed coefficient | Background 0.35 / midground 0.7 / foreground 1.4 (multiples of camera displacement) | The speed ratio between adjacent layers must be **≥2x** to be perceptible; a 1.2x difference can't be read by the viewer |
| Layer count | ≤4 layers | Nobody perceives parallax past 4 layers; it is pure budget waste |
| Implementation | Each layer translates by the same camera x/y times its own coefficient | Everything derived from camera state, seek-safe; don't give each layer an independent tween |

### 8.2 Fake dolly-zoom (pure CSS, no real 3D needed)

```
subject: pinned still (or only breathing at ≤1.02x)
background: scale 1 → 2.0-2.5, opacity dropping to ≤0.6 at the same time
```

The subject unchanged while the background rushes at the viewer produces the inversion of "the world closing in while
the protagonist freezes" (shotcraft). Give it enough duration (≥1.2s); for use see §1: at most once per film, saved
for a real reveal moment.

---

## §9 · Motion-derived signals · blur / follow / aftershock

A camera's "sense of speed" doesn't come from a faster duration; it comes from secondary signals **derived** from
velocity (shotcraft / HuaRec):

| Signal | Formula | Parameters |
|---|---|---|
| Velocity-driven blur | `v = velocityAt(f)` (central difference: `(pos(f+1)−pos(f−1))/2`), blur strength ∝ v | Only triggered when zoom velocity >0.6/s, strength `min(10, v×5)`px. **Blur only at the instant of motion; still frames stay sharp** (HuaRec) |
| Lagged follow layer | Follow layer = the subject sampled at `f − delay` | Shadow lags 2f, afterimage lags 4f (shotcraft). Afterimage as a motion-blur substitute: 5% path lag + blur(6px) + opacity 0.25·(1−t) |
| dampedSettle aftershock | `e^(−d·t) · sin(2π·f·t)`, f≈0.1, damping≈0.15 | 1-2 tiny residual swings after the camera stops hard, amplitude ≤3px; not added to deliberate camera moves (the §4.1 inOut family), only to whip-pan / hard-brake types |

All three are pure functions of time (difference, delayed sampling, closed-form decay), inherently seek-safe and
compliant with the determinism requirement of gsap-recipes §6.

---

## §10 · Camera self-check list (60 seconds after finishing the timeline)

- [ ] Can every camera action answer "what question does it answer for the viewer"? Did you delete the ones that couldn't?
- [ ] No zoom below 1.25x (except the 1.06x establishing push)?
- [ ] Adjacent shots ≥2.6s apart, ≤4-5 within a 15s window?
- [ ] Do all push/pull durations follow the logarithmic formula, with no off-the-cuff fixed durations?
- [ ] Is the push/pull easing power3.inOut, with no linear / spring overshoot?
- [ ] Have adjacent shots been adjudicated three ways by focus distance (merge / pan / drop)? No two distant foci back to back?
- [ ] Do short-gap shots connect directly, with no pumping back to 1x?
- [ ] Runtime >14s and first shot after 7s: did you add the 1.06x establishing micro-push?
- [ ] Does it end on a still full shot for ≥0.8s, never ending while pushed in?
- [ ] With narration: do camera moves snap to speech gaps (earlier only, ≤0.8s)?
- [ ] Is all camera movement routed through the `#camera` layer, not fighting element animation over transform?
- [ ] Do 3D text close-ups use CSS zoom rasterization, not scale magnification that blurs?
- [ ] Does every transition seam use one form only, with no bare cut in the film?
- [ ] parallax: adjacent layer speed ratio ≥2x, ≤4 layers?
- [ ] Does blur appear only in motion transients, with all still frames sharp?

---

## §11 · Relationship to the other references

| reference | Division of labor | Boundary |
|---|---|---|
| `animation-best-practices.md` | How elements move, narrative cadence, taste standards | It manages "the actors", this file manages "the camera"; S4's boom-segment "pull the camera out" gets its parameters from this file's §4 |
| `gsap-recipes.md` | Runnable GSAP implementation of every rule in this file | The "Camera Rig recipe" section: rig container, PageCam translation, logarithmic duration helper, counter-transform |
| `animation-pitfalls.md` | The pitfall list | Camera-specific traps (scale blur / broken perspective / pan exposing edges) are covered on the design side in §3.3-3.4; pitfalls collects the technical reproduction |
| `hyperframes-backend.md` | Render backend contract | For the applicability of the CSS zoom technique under offline frame-by-frame rendering see §3.4 |
| `voiceover-pipeline.md` | Narration-driven long video | The silence-point data for move on pause (§6.3) comes from narration sentence gaps |
| `ai-video-review.md` | Finished-film critique | The critique checklist's transition classification expands by the §7 three-layer vocabulary |

**Call order**: in the director's-script / storyboard stage read §0-§2 to fix the budget and the vocabulary → before
writing the timeline read §3-§7 to fix the implementation conventions and the seams → before delivery run the §10 list.
