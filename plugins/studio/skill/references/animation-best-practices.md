# Animation Best Practices · The positive grammar of animation design

> Derived from a deep teardown of Anthropic's three official product animations (Claude Design / Claude Code
> Desktop / Claude for Word), distilling the rules of "Anthropic-grade" animation design.
>
> Use together with `animation-pitfalls.md` (the pitfall list) — this file is "**do it this way**",
> pitfalls is "**don't do it this way**"; they are orthogonal, and you need both.
>
> **Constraint statement**: this file records **motion logic and expressive style only** and **introduces no specific
> brand color values**. Color decisions go through the brand asset protocol (`references/brand-asset-protocol.md`,
> extracted from the brand spec) or the three directions (`references/directions.md`)
> (the palettes of the 92 styles are in `references/design-styles.md`). This reference discusses "**how it moves**",
> not "**what color it is**".

---

## §0 · Who you are · identity and taste

> Before reading any of the technical rules below, read this section. The rules **emerge from the identity** —
> not the other way round.

### §0.1 Identity anchor

**You are a motion designer who has studied the motion archives of Anthropic / Apple / Pentagram / Field.io.**

When you animate, you are not tweaking CSS transitions — you are using digital elements to **simulate a physical
world**, so the viewer's subconscious believes "these are objects with weight, inertia and overflow".

You don't make PowerPoint animation. You don't make "fade in fade out" animation. The animation you make **makes
people believe the screen is a space you could reach into**.

### §0.2 Core beliefs (3)

1. **Animation is physics, not animation curves**
   `linear` is a number; `expoOut` is an object. You believe pixels on a screen deserve to be treated as "objects".
   Every easing choice is answering a physics question: "how heavy is this element? What is its friction coefficient?"

2. **Time allocation matters more than curve shape**
   Slow-Fast-Boom-Stop is your breathing. **An evenly paced animation is a technical demo; a paced one is narrative.**
   Slowing down at the right moment matters more than using the right easing at the wrong one.

3. **Deferring to the viewer is harder than showing off**
   A 0.5-second stop before the key result is **technique**, not compromise. **Giving the human brain reaction time is
   the highest skill of an animator.**
   By default an AI makes an animation with no pauses and full information density — that is the beginner. What you
   have to do is restraint.

### §0.3 Taste standards · what is beautiful

Your criteria for "good" and "great" are as follows. Each has a **recognition method** — when you look at a
candidate animation, use these questions to judge whether it clears the bar, instead of mechanically checking
14 rules.

| Dimension of beauty | Recognition method (viewer reaction) |
|---|---|
| **Physical weight** | When the animation ends, the element **lands** solidly — it does not just "stop" there. The viewer's subconscious feels "that has weight" |
| **Deferring to the viewer** | There is a perceptible pause (≥300ms) before key information appears — the viewer has time to **see it** before continuing |
| **Negative space** | The ending is an abrupt stop + hold, not a fade to black. The last frame is clear, certain, decisive |
| **Restraint** | Only one place in the whole film is "120% refined"; the other 80% is just right — **showing off everywhere is a cheap signal** |
| **Handfeel** | Arcs (not straight lines), irregularity (not the mechanical cadence of setInterval), a sense of breathing |
| **Respect** | Show the tweaking, show the bug being fixed — **don't hide the work, don't sell "magic"**. AI is a collaborator, not a magician |

### §0.4 Self-check · the viewer's first-reaction method

When you finish an animation, **what is the viewer's first reaction?** — that is the only metric you optimize.

| Viewer reaction | Rating | Diagnosis |
|---|---|---|
| "Looks pretty smooth" | good | Competent but characterless; you are making PowerPoint |
| "This animation is really clean" | good+ | Technically right, but nothing striking |
| "This thing really looks like it's **floating up off the desk**" | great | You have reached physical weight |
| "This doesn't look like AI made it" | great+ | You have reached Anthropic's threshold |
| "I want to **screenshot** this and post it" | great++ | You made the viewer want to spread it themselves |

**The difference between great and good is not technical correctness, it is taste judgment**. Technically correct +
right taste = great. Technically correct + empty taste = good. Technically wrong = hasn't started.

### §0.5 The relationship between identity and rules

The technical rules in §1-§8 below are this identity's **means of execution** in concrete scenarios — not an
independent rule list.

- Hit a scenario the rules don't cover → go back to §0 and judge with **identity**; don't guess wildly
- Find two rules in conflict → go back to §0 and judge with the **taste standards** which matters more
- Want to break a rule → first answer: "which item of §0.3 beauty does this serve?" If you can answer, break it;
  if not, don't

Good. Keep reading.

---

## Overview · Animation is physics unfolded in three layers

The root of the cheapness in most AI-generated animation is that — **they behave like "numbers", not "objects"**.
Objects in the real world have mass, inertia, elasticity and overflow. The source of the "premium feel" in
Anthropic's three films is that they give digital elements **a set of physical-world motion rules**.

That rule set has 3 layers:

1. **Narrative cadence layer**: Slow-Fast-Boom-Stop time allocation
2. **Motion curve layer**: Expo Out / Overshoot / Spring; reject linear
3. **Expression language layer**: showing the process, mouse arcs, Logo morph convergence

---

## 1. Narrative cadence · the Slow-Fast-Boom-Stop 5-segment structure

All three of Anthropic's films follow this structure without exception:

| Segment | Share | Cadence | Role |
|---|---|---|---|
| **S1 Trigger** | ~15% | Slow | Give the human reaction time, establish realism |
| **S2 Generate** | ~15% | Medium | The visual wow point appears |
| **S3 Process** | ~40% | Fast | Show controllability / density / detail |
| **S4 Boom** | ~20% | Boom | Camera pull-out / 3D pop-out / multiple panels emerging |
| **S5 Landing** | ~10% | Still | Brand Logo + abrupt stop |

**Concrete duration mapping** (15-second animation as the example):
S1 trigger 2s · S2 generate 2s · S3 process 6s · S4 boom 3s · S5 landing 2s

**What is banned**:
- ❌ Even cadence (the same information density every second) — viewer fatigue
- ❌ Sustained high density — no peak, no memory point
- ❌ A fading ending (fade out to transparent) — it should **stop abruptly**

**Self-check**: sketch 5 thumbnails on paper, each representing one segment's climax frame. If the 5 images aren't
very different, the cadence wasn't built.

---

## 2. Easing philosophy · reject linear, embrace physics

Every effect in Anthropic's three films uses bezier curves with a "damped" feel. The default cubic easeOut
(`1-(1-t)³`) is **not sharp enough** — the start isn't fast enough, the stop isn't stable enough.

### Three core Easing functions (already built into animations.jsx)

```js
// 1. Expo Out · fast start, slow brake (most common, the default primary easing)
// maps to CSS: cubic-bezier(0.16, 1, 0.3, 1)
Easing.expoOut(t) // = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

// 2. Overshoot · springy toggle/button pop
// maps to CSS: cubic-bezier(0.34, 1.56, 0.64, 1)
Easing.overshoot(t)

// 3. Spring physics · geometry reseating, natural settling
Easing.spring(t)
```

### Usage mapping

| Scenario | Which Easing |
|---|---|
| Card rise-in / panel entrance / Terminal fade / focus overlay | **`expoOut`** (primary easing, most common) |
| Toggle switch / button pop / emphasis interaction | `overshoot` |
| Preview geometry reseat / physical settling / UI element bounce | `spring` |
| Sustained motion (e.g. mouse trajectory interpolation) | `easeInOut` (preserves symmetry) |

### The counterintuitive insight

Most product film animation is **too fast and too hard**. `linear` makes digital elements look mechanical, `easeOut`
is a passing grade, and `expoOut` is the technical root of "premium feel" — it gives digital elements **the weight of
a physical world**.

---

## 3. Motion language · 8 shared principles

### 3.1 Don't use pure black or pure white for the base

Not one of Anthropic's three films uses `#FFFFFF` or `#000000` as the main base color. A **neutral with a color
temperature** (warm or cool) has the materiality of "paper / canvas / desktop" and quiets the machine feel.

**Specific color decisions** go through the brand asset protocol (extracted from the brand spec) or the three
directions (`references/directions.md`)
(the base colors of the 92 styles are in `references/design-styles.md`). This reference gives no specific color
values — those are **brand decisions**, not motion rules.

### 3.2 Easing is never linear

See §2.

### 3.3 Slow-Fast-Boom-Stop narrative

See §1.

### 3.4 Show the "process", not the "magic result"

- Claude Design shows tweaking parameters, dragging sliders (not one-click generation of a perfect result)
- Claude Code shows a code error + the AI fixing it (not succeeding on the first try)
- Claude for Word shows Redline's red deletions and green insertions as an edit process (not handing over the final draft)

**Shared subtext**: the product is a **collaborator, a pair engineer, a senior editor** — not a one-click magician.
This hits professional users' pain points about "controllability" and "realness" precisely.

**Anti-AI-slop**: by default AI makes "magic one-click success" animations (one click → perfect result); that is the
lowest common denominator. **Do the opposite** — show the process, show the tweaking, show the bug and the fix —
and you have a source of brand recognition.

### 3.5 Hand-drawn mouse trajectories (arcs + Perlin Noise)

A real person's mouse motion isn't a straight line; it is "accelerate from rest → arc → decelerate and correct →
click". A mouse trajectory that AI interpolates straight **triggers subconscious rejection**.

```js
// Quadratic bezier interpolation (start → control point → end)
function bezierQuadratic(p0, p1, p2, t) {
  const x = (1-t)*(1-t)*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0];
  const y = (1-t)*(1-t)*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1];
  return [x, y];
}

// Path: start → offset from the midpoint → end (making an arc)
const path = [[100, 100], [targetX - 200, targetY + 80], [targetX, targetY]];

// Then overlay a tiny amount of Perlin Noise (±2px) to create "hand jitter"
const jitterX = (simpleNoise(t * 10) - 0.5) * 4;
const jitterY = (simpleNoise(t * 10 + 100) - 0.5) * 4;
```

### 3.6 Logo "morph convergence" (Morph)

In all three of Anthropic's films the Logo entrance is **not a simple fade-in**; it **morphs out of the previous
visual element**.

**Shared pattern**: over the last 1-2 seconds, Morph / Rotate / Converge so the whole narrative "collapses" onto the
brand point.

**Low-cost implementation** (no real morph needed):
let the previous visual element "collapse" into a color block (scale → 0.1, translate toward the center), then let
the block "swell" open into the wordmark. Use a 150ms fast cut + motion blur for the transition
(`filter: blur(6px)` → `0`).

```js
<Sprite start={13} end={14}>
  {/* Collapse: previous element scale 0.1, opacity held, increasing filter blur */}
  const scale = interpolate(t, [0, 0.5], [1, 0.1], Easing.expoOut);
  const blur = interpolate(t, [0, 0.5], [0, 6]);
</Sprite>
<Sprite start={13.5} end={15}>
  {/* Swell: Logo scales 0.1 → 1 from the block's center, blur 6 → 0 */}
  const scale = interpolate(t, [0, 0.6], [0.1, 1], Easing.overshoot);
  const blur = interpolate(t, [0, 0.6], [6, 0]);
</Sprite>
```

### 3.7 Serif + sans-serif dual type

- **Brand / narration**: serif (has "academic feel / publication feel / taste")
- **UI / code / data**: sans-serif + monospace

**A single typeface is always wrong**. Serif gives "taste", sans-serif gives "function".

Specific typeface choices go through the brand spec (brand-spec.md's Display / Body / Mono three stacks) or the
92 styles in `references/design-styles.md`. This reference gives no specific typefaces — those are **brand decisions**.

### 3.8 Focus shift = background weakened + foreground sharpened + Flash guidance

A focus shift is **not just** lowering opacity. The full recipe is:

```js
// Filter combination for non-focus elements
tile.style.filter = `
  brightness(${1 - 0.5 * focusIntensity})
  saturate(${1 - 0.3 * focusIntensity})
  blur(${focusIntensity * 4}px)        // ← key: only blur actually "retreats"
`;
tile.style.opacity = 0.4 + 0.6 * (1 - focusIntensity);

// After the focus settles, run a 150ms Flash highlight at the focus point to guide the eye back
focusOverlay.animate([
  { background: 'rgba(255,255,255,0.3)' },
  { background: 'rgba(255,255,255,0)' }
], { duration: 150, easing: 'ease-out' });
```

**Why blur is mandatory**: with only opacity + brightness, elements outside the focus are still "sharp" and have no
visual effect of "retreating to the background". blur(4-8px) makes out-of-focus elements genuinely fall back one
layer of depth.

---

## 4. Concrete motion techniques (code snippets you can copy directly)

### 4.1 FLIP / Shared Element Transition

The button "swells" into an input field — **not** the button disappearing + a new panel appearing. The core is that
**the same DOM element** transitions between two states, not two elements cross-fading.

```jsx
// Use Framer Motion layoutId
<motion.div layoutId="design-button">Design</motion.div>
// ↓ after click, the same layoutId
<motion.div layoutId="design-button">
  <input placeholder="Describe your design..." />
</motion.div>
```

For a native implementation see https://aerotwist.com/blog/flip-your-animations/

### 4.2 "Breathing" expansion (width→height)

A panel expanding does **not** pull width and height at the same time; instead:
- First 40% of the time: pull width only (keep height small)
- Last 60% of the time: hold width, push height

This simulates the physical-world feel of "unfolding first, then filling".

```js
const widthT = interpolate(t, [0, 0.4], [0, 1], Easing.expoOut);
const heightT = interpolate(t, [0.3, 1], [0, 1], Easing.expoOut);
style.width = `${widthT * targetW}px`;
style.height = `${heightT * targetH}px`;
```

### 4.3 Staggered Fade-up (30ms stagger)

When table rows, card columns and list items enter, **each element is delayed 30ms**, with `translateY` going from
10px back to 0.

```js
rows.forEach((row, i) => {
  const localT = Math.max(0, t - i * 0.03);  // 30ms stagger
  row.style.opacity = interpolate(localT, [0, 0.3], [0, 1], Easing.expoOut);
  row.style.transform = `translateY(${
    interpolate(localT, [0, 0.3], [10, 0], Easing.expoOut)
  }px)`;
});
```

### 4.4 Non-linear breathing · hover 0.5s before the key result

Machines execute fast and seamlessly, but **hover 0.5 seconds before the key result appears** so the viewer's brain
has reaction time.

```jsx
// Typical scenario: AI finishes generating → hover 0.5s → result surfaces
<Sprite start={8} end={8.5}>
  {/* 0.5s pause — nothing moves, let the viewer stare at the loading state */}
  <LoadingState />
</Sprite>
<Sprite start={8.5} end={10}>
  <ResultAppear />
</Sprite>
```

**Counterexample**: cutting seamlessly to the result the instant generation finishes — the viewer has no reaction
time and the information drains away.

### 4.5 Chunk Reveal · simulating token streaming

AI-generated text **must not use `setInterval` popping out single characters** (like old film subtitles); use
**chunk reveal** — 2-5 characters at a time at irregular intervals, simulating real token streaming.

```js
// Split into chunks, not characters
const chunks = text.split(/(\s+|,\s*|\.\s*|;\s*)/);  // split by word + punctuation
let i = 0;
function reveal() {
  if (i >= chunks.length) return;
  element.textContent += chunks[i++];
  const delay = 40 + Math.random() * 80;  // irregular 40-120ms
  setTimeout(reveal, delay);
}
reveal();
```

### 4.6 Anticipation → Action → Follow-through

3 of Disney's 12 principles. Anthropic uses them very explicitly:

- **Anticipation**: a small reverse action before the main action starts (the button shrinks slightly, then pops)
- **Action**: the main action itself
- **Follow-through**: residual motion after the action ends (a slight bounce after a card lands)

```js
// The full three stages of a card entrance
const anticip = interpolate(t, [0, 0.2], [1, 0.95], Easing.easeIn);     // anticipation
const action  = interpolate(t, [0.2, 0.7], [0.95, 1.05], Easing.expoOut); // the main action
const settle  = interpolate(t, [0.7, 1], [1.05, 1], Easing.spring);       // rebound
// final scale = product of the three stages, or applied piecewise
```

**Counterexample**: animation with only Action and no Anticipation + Follow-through looks like "PowerPoint animation".

### 4.7 3D Perspective + translateZ layering

To get the character of "tilted 3D + floating cards", give the container perspective and individual elements
different translateZ values:

```css
.stage-wrap {
  perspective: 2400px;
  perspective-origin: 50% 30%;  /* gaze slightly downward */
}
.card-grid {
  transform-style: preserve-3d;
  transform: rotateX(8deg) rotateY(-4deg);  /* golden ratio */
}
.card:nth-child(3n) { transform: translateZ(30px); }
.card:nth-child(5n) { transform: translateZ(-20px); }
.card:nth-child(7n) { transform: translateZ(60px); }
```

**Why rotateX 8° / rotateY -4° is the golden ratio**:
- Above 10° → the elements distort too strongly and look like they are "falling over"
- Below 5° → it looks like a "shear" rather than "perspective"
- The asymmetric 8° × -4° ratio simulates the natural angle of "a camera looking down from the desk's top left"

### 4.8 Diagonal Pan · move X and Y together

Camera movement is not purely up-down or purely left-right; it moves **X and Y at the same time** to simulate
diagonal travel:

```js
const panX = Math.sin(flowT * 0.22) * 40;
const panY = Math.sin(flowT * 0.35) * 30;
stage.style.transform = `
  translate(-50%, -50%)
  rotateX(8deg) rotateY(-4deg)
  translate3d(${panX}px, ${panY}px, 0)
`;
```

**Key**: X and Y have different frequencies (0.22 vs 0.35), avoiding a regularized Lissajous loop.

---

## 5. Scene recipes (three narrative templates)

The three reference videos correspond to three product personalities. **Pick the one that fits your product best**;
don't mix them.

### Recipe A · Apple Keynote dramatic (Claude Design type)

**Suits**: major version launches, hero animation, visual wow prioritized
**Cadence**: Slow-Fast-Boom-Stop with a strong arc
**Easing**: `expoOut` throughout + a little `overshoot`
**SFX density**: high (~0.4/s), with SFX pitched to the BGM scale
**BGM**: IDM / minimal tech electronica, cool + precise
**Close**: camera pulls out hard → drop → Logo morph → airy single tone → abrupt stop

### Recipe B · One-take tool (Claude Code type)

**Suits**: developer tools, productivity apps, flow-state scenarios
**Cadence**: a steady continuous flow, no obvious peak
**Easing**: `spring` physics + `expoOut`
**SFX density**: **0** (editing cadence driven purely by the BGM)
**BGM**: Lo-fi Hip-hop / Boom-bap, 85-90 BPM
**Core technique**: key UI actions land on the BGM's kick/snare transients — "**the groove is the interaction
sound effect**"

### Recipe C · Office-productivity narrative (Claude for Word type)

**Suits**: enterprise software, document/spreadsheet/calendar types, professionalism prioritized
**Cadence**: multiple scenes with hard cuts + Dolly In/Out
**Easing**: `overshoot` (toggle) + `expoOut` (panel)
**SFX density**: medium (~0.3/s), mostly UI clicks
**BGM**: Jazzy Instrumental, minor key, BPM 90-95
**Core highlight**: one act must have "the film's highlight" — a 3D pop-out / rising off the plane

---

## 6. Counterexamples · doing this is AI slop

| Anti-pattern | Why it's wrong | Correct approach |
|---|---|---|
| `transition: all 0.3s ease` | `ease` is a cousin of linear; all elements move at the same speed | Use `expoOut` + per-element stagger |
| Every entrance is `opacity 0→1` | No sense of motion direction | Pair with `translateY 10→0` + Anticipation |
| Logo fades in | No narrative closure | Morph / Converge / collapse-and-swell |
| Mouse moves in a straight line | Subconscious machine feel | Bezier arcs + Perlin Noise |
| Typing pops out character by character (setInterval) | Looks like old film subtitles | Chunk Reveal, random intervals |
| Key result with no hover | No reaction time for the viewer | 0.5s hover before the result |
| Focus shift changes opacity only | Non-focus elements stay sharp | opacity + brightness + **blur** |
| Pure black / pure white base | Cyber feel / glare fatigue | Neutral with a color temperature (go through the brand spec) |
| All animation equally fast | No cadence | Slow-Fast-Boom-Stop |
| Fade out ending | No sense of decision | Abrupt stop (hold the last frame) |

---

## 6.5 · The director's-script visual density clause (B00 live lesson, 2026-07-17)

**A director's script that only writes narrative + camera moves will get you a wireframe.** Measured on B00's
step b-roll: the v1 director's script covered six acts' narrative, timeline and camera movement thoroughly, and the
animation the implementing agent delivered passed every effect check, with all checks green — but the visuals were at
the level of a diagram ("three flat dark blocks + display type") and were voted down in one go by the director
("too simple, too boring"). Without a density standard, an agent always delivers the most economical geometry.

**The director's script (or any animation brief) must explicitly include three things**:

1. **A visual density standard**: the order-of-magnitude requirement for detail elements on each screen (skeleton UI
   content rows, legends, textures, secondary elements), plus one executable acceptance statement, such as "pause on
   any frame and it doesn't look embarrassing next to the benchmark"
2. **A reference benchmark**: point at one specific existing finished piece (an older animation in the same project /
   the A series / some demo), and copy its construction craft directly — don't make the agent invent it out of nothing
3. **A global atmosphere-layer list**: ground-line anchoring, soft shadows on components, paper/background textures,
   hero sidekicks or similar personified small elements, idle micro-motion on still components (breathing / cursor /
   micro push) — the main antidote to "empty and boring" is this layer, not the main elements themselves

**The repair path has a formulation too**: the effect skeleton (timeline / camera moves / morph paths / title-card
timing) and the visual craft (components / density / atmosphere) are two layers; when acceptance is voted down, first
establish which layer the problem is in — if the effects pass, only re-skin, don't re-choreograph.

---

## 7. Self-check list (60 seconds before animation delivery)

- [ ] Is the narrative structure Slow-Fast-Boom-Stop, not an even cadence?
- [ ] Is the default easing `expoOut`, not `easeOut` or `linear`?
- [ ] Do Toggle / button pops use `overshoot`?
- [ ] Do cards / lists enter with a 30ms stagger?
- [ ] Is there a 0.5s hover before the key result?
- [ ] Does typing use Chunk Reveal, not setInterval single characters?
- [ ] Does the focus shift add blur (not just opacity)?
- [ ] Is the Logo a morph convergence (Morph), not a fade-in?
- [ ] Is the base not pure black / pure white (it has a color temperature)?
- [ ] Does the type have a serif + sans-serif hierarchy?
- [ ] Is the ending an abrupt stop, not a fade out?
- [ ] (If there is a mouse) Is the mouse trajectory an arc, not a straight line?
- [ ] Does the SFX density match the product personality (see recipes A/B/C)?
- [ ] Is there a 6-8dB loudness difference between BGM and SFX? (see `audio-design-rules.md`)

---

## 8. Relationship to the other references

| reference | Positioning | Relationship |
|---|---|---|
| `animation-pitfalls.md` | Technical pitfall avoidance (24 items) | "**Don't do it this way**" · the inverse of this file |
| `animations.md` | Stage/Sprite engine usage | The foundation of **how to write** animation |
| `audio-design-rules.md` | Dual-track audio rules | The rules for **scoring** animation |
| `sfx-library.md` | A 37-item SFX list | The sound-effect **material library** |
| `apple-gallery-showcase.md` | The Apple gallery showcase style | A deep dive on one specific motion style |
| **this file** | The positive grammar of motion design | "**Do it this way**" |

**Call order**:
1. First run the five form questions in step 3 of the standard process in `references/workflow.md` (SKILL.md narrow
   bridge 1; it fixes the narrative role and visual temperature)
2. After the direction is chosen, read this file to fix the **motion language** (recipes A/B/C)
3. When writing code, refer to `animations.md` and `animation-pitfalls.md`
4. When exporting video, go through `audio-design-rules.md` + `sfx-library.md`

---

## Appendix · Source material for this file

- Anthropic official animation teardown: `reference-animation/BEST-PRACTICES.md` in the studio's project directory
- Anthropic audio teardown: `AUDIO-BEST-PRACTICES.md` in the same directory
- 3 reference videos: `ref-{1,2,3}.mp4` + the corresponding `gemini-ref-*.md` / `audio-ref-*.md`
- **Strict filtering**: this reference includes no specific brand color values, typeface names or product names.
  Color/type decisions go through the brand asset protocol or the three directions' direction cards.
