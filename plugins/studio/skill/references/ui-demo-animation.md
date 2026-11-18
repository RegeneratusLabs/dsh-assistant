# Product UI Showcase Animation Playbook

> **This is the single entry point when the product being promoted has a UI.** Commissioned work, launch animation, feature demo — if the hero of the frame is an interface, read this file before you start.
>
> The core claim, in one sentence: **the texture of a product animation comes overwhelmingly from "real UI + cinematic camera moves", not from effects.** Tech feel comes from making the viewer recognize "that is the product", from how the camera looks at it — not from particles, glows or cyber gradients. One real screenshot with one restrained push-in beats ten layers of hand-faked interface.
>
> Parameter provenance convention: (shotcraft·card name) = measured values from the video-shotcraft shot cards; (huarec) = the HuaRec Studio camera-direction system; (best-practices §x) (gsap-recipes §x) = existing references in this skill. 30fps context, 1f ≈ 33ms.
>
> Division of labor: this file covers "how the UI protagonist performs"; shot vocabulary and camera-move motivation live in `camera-language.md`; element-level motion grammar (easing, stagger, FLIP, Chunk Reveal) lives in `animation-best-practices.md` — this file cites it, never restates it.

---

## §0 Two axioms (they override every parameter in the eight forms)

| Axiom | Content | Source |
|---|---|---|
| **Visibility invariant** | At any moment, the cursor and any in-progress UI operation must be inside the visible area (including an 8% safe margin). A shot that violates this should lower its zoom, merge shots, or not be shot | huarec A1 |
| **Visual language grows from the product** | First extract the product's own design tokens (typeface / corner radii / palette / grid); across the whole film you may only reuse them or extend them with restraint. Shot cards inherit only motion grammar and cadence; the skin is re-skinned for the target product | shotcraft axiom 1 |

---

## §1 Decision tree: camera moves on a real UI screenshot vs. HTML rebuild of the UI

This is **the decision in this file that most changes the workload** — the two paths differ by an order of magnitude. By default, judge starting from the cheapest path:

```
The product UI has to appear
 │
 ├─ Does the interface only need to be "looked at" (push in / tour / hover / compare)?
 │   └─ Yes → [Path 1] screenshot in a frame + 2.5D camera moves. Stop there, do not rebuild
 │
 ├─ Do only a few elements need to move on their own (one card lifts, one row of data scrolls)?
 │   └─ Yes → [Path 3] hybrid: screenshot as base + reconstructed slices for the key elements
 │
 └─ Is the interface itself the narrative subject, do elements need to enter one by one, respond to operations, change state?
     └─ Yes → [Path 2] HTML rebuild. Go to build-up, form ②
```

| Path | Approach | Workload | Applicability criterion |
|---|---|---|---|
| 1 · Screenshot camera move | Put the real screenshot into a `browser_window.jsx` / `macos_window.jsx` device frame, zoom/rotate/pan on the container | Hours | The interface is "an object being watched"; the viewer never needs to see changes happen inside the interface |
| 2 · HTML rebuild | Rebuild a movable DOM structure pixel by pixel from the screenshot | Days | Elements need their own timelines: progressive generation, typing, state switches, hover responses |
| 3 · Hybrid | Full-page screenshot as the base texture; the elements that must move are cut into transparent slices and animated on top at their original coordinates | Half-day | 90% of the frame is static, 10% of elements must live. **The right answer for most commissioned work** |

**The key to the hybrid strategy**: after a sliced element finishes moving it must return to its real slot on the screenshot. If the target card floats above the grid and never settles back into the layout, the viewer reads "fake" instantly (shotcraft·type-and-filter; the Q9 precedent nearly rewrote that whole file over this).

The hybrid path in five steps:

1. Lay a full-page 2x screenshot as the base, inside a device frame (web products use `browser_window.jsx`, desktop apps use `macos_window.jsx`)
2. Cut the elements that must move into transparent-backed slices using layout.json coordinates
3. On the base screenshot, paint a "page background patch" over the baked-in original element at the slice's own position (spotlight-hero-card's in-place patch technique: once the card takes off, paint a background patch in place + an accent-colored breathing outline; at the instant of landing it brightens and disappears)
4. Animate the slices on top of the patch, ending back at the layout.json slot
5. In close-up push-in segments, use 4x high-res slices with a 6f crossfade to cover the low-zoom texture (shotcraft·PageCam companion technique)

**Choosing the device frame**: the frame is the contextual signal that "this is real software" — a bare screenshot floating on the canvas looks like a texture decal. But the frame also eats frame area: once a close-up pushes past zoom 2x the frame is already out of picture, and at that point you can use frameless slices directly.

### The three-part material kit (collect it before taking path 1/3)

The standard collectibles from stage 1 of the shotcraft pipeline (shotcraft·six-stage pipeline):

| Material | Spec | Use |
|---|---|---|
| Full-page 2x screenshot | Device pixel ratio 2 or higher, whole page for long pages | Base texture; the floor that stays sharp after push-in |
| Element transparent slices | Cut out each element that moves on its own, 4x preferred | The "actors" of the hybrid path; during close-up push-ins a 6f crossfade covers the low-zoom texture |
| layout.json coordinate table | `{x,y,w,h}` for every slice in full-page coordinates | The basis for the "real slot" to return to; the anchor for callouts and highlight boxes |

Screenshot sourcing follows the UI screenshot collection protocol in `brand-asset-protocol.md` (App Store screenshots, official-site screenshots, frames pulled from demo videos, real screenshots from user accounts), and the same "5-10-2-8" quality threshold applies. For the root cure of blurry text under a close-up push-in (CSS `zoom` layout-level scaling instead of transform scale), see `camera-language.md`.

---

## §2 The eight forms of UI showcase · overview

| # | Form | One sentence | Path | Source card |
|---|---|---|---|---|
| ① | 3D showcase table / hero close-up | One card becomes the film's protagonist: spotlight → push in → hover → reseat | 1/3 | spotlight-hero-card |
| ② | Progressive interface build-up | The interface from nothing: skeleton → content → data; the entrance itself is narrative | 2 | skeleton-reveal / row-embed / document-typewriter-reveal |
| ③ | User typing simulation | Human typing speed, cursor solid while typing then blinking | 2/3 | type-and-filter |
| ④ | Cursor operation narrative | The cursor as an actor: arc travel, click ripple, hover coupling | all | type-and-filter / collab-cursor-moves |
| ⑤ | Timeline-ized UI state transitions | tab / modal / route switches written as one scene on the timeline | 2 | command-palette-summon |
| ⑥ | 3D interface tour | A long interface glides past tilted, or the camera grazes its face | 1 | steep-tilt-glide / graze-face-tour |
| ⑦ | Long-page scroll narrative | Fast scroll, hard brake, stop on the target row | 1/3 | scroll-brake-moves |
| ⑧ | feature callout annotation | Callout lines grow, highlight boxes, explainer cards, before/after comparison | all | before-after-slider-scrub etc. |

Selection discipline: **one shot tells one form, and a form is the protagonist only once in the film** (shotcraft axiom 5). Several forms can appear in one film, but each owns its own shots.

---

## §3 The eight forms in detail

### ① 3D showcase table / hero close-up

Stand one core object (card / panel / module) up as the product's atomic unit. The highest-texture, slowest-paced shot; suited to the "single protagonist biography" segment after the opening.

| Parameter | Typical value | Feel |
|---|---|---|
| Camera position | rotY 34° dominant + rotX only 8°, perspective 1200px | Side-on beats top-down, "shoot from the left rather than from below"; a large rotX turns into looking at a desk |
| Push-in | Full-page zoom 0.78 held still for one beat, then 16f push to zoom 2.6 | The stillness before the push is "let the viewer see the whole first"; starting straight away has no sense of space |
| Action arc | rise 10f (`cubic-bezier(0.2,1.25,0.3,1)` overshoot) → hover 54f (sin bob amplitude 4px, period 40f, translateZ 110px) → reseat 18f landing with press scale 0.997 | Lock to landing is ≈3.3s; a texture shot has to be that slow; the first version is almost always too fast |
| Outline light sweep | SVG rounded-rect stroke runs two laps: first lap 14f fast and bright, second lap 20f slow and weak (opacity 0.62) | Only a difference in speed between the two laps reads as "continuous scanning"; one lap is a blink; give the sweep to the protagonist once per film |
| Double shadow | `0 8·lift px …, 0 46·lift px 90·lift px`, growing with hover height | If the shadow doesn't grow with height, the hover doesn't happen |
| Spotlight guidance | A roaming light locks onto the card center through 4 intermediate stations, the pool tightens 620→420→360, +6% pulse at the moment of lock; outer vignette 0.16→0.42 | Intermediate stations make "random illumination" believable; going straight at the target reads procedural; the vignette is the other half of the spotlight |
| Floating annotation (optional) | Two lines of serif annotation surface at the card's side, translateZ 92px + bob period 44f (close to the card's 40f but not in sync) | "Complicit" rather than mirrored; the annotation must live in the same 3D space under the same camera perspective — flat overlaid type destroys spatial unity |

(All of the above are measured values from shotcraft·spotlight-hero-card)

Known traps: no tail drift such as "zoom 2.6→2.58" at the end — the breath must be genuinely still; a chorus of cards at the opening cannot carry the first impression, so start from a single protagonist plus a full action arc; per-card glint was rejected twice by precedent — the light effect goes strictly to the protagonist.

Companion camera: dolly-in push plus a still hold after lock (see `camera-language.md`). For zoom spans larger than 2x, stretch the duration logarithmically; no spring overshoot (huarec).

### ② Progressive interface build-up

The entrance narrative where the interface goes "from nothing to something". **The build order has a grammar**: chrome (window frame / title bar) → skeleton (grey bars as placeholders) → content blocks in stagger → data (numbers / charts come alive last). Viewers have a free expectation about skeleton screens: the moment grey bars appear, they know content is coming.

The three source cards divide the objects: **one interface** becoming real level by level uses skeleton-reveal; **a group of rows/cards** embedding into a list uses row-embed; **a document** being written out uses document-typewriter-reveal.

| Parameter | Typical value | Feel |
|---|---|---|
| Three-stage development | Doodle (new seed every 5f, "boiling") → swap to the real thing for one beat, 8f accelerating shrink + skeleton springs in → skeleton rows stagger in 6f → developed rows stagger 13f, inside a row 12f | The swap-to-real beat must be fast and decisive; stretched into a crossfade the "leap" disappears; the three stages must be strictly isomorphic, any misalignment reads as a different page |
| Word-by-word entrance | 2.5f/word, float up 14px; last word of the last line +14f, half a beat late | Half a beat late is the full stop for "load complete"; everything landing together is flat |
| Row embedding | cue for row i = 12 + i·9, flight 12f; `perspective(900px) translateY(−120·air) rotateX(16°·air)` | **Flattening rotateX is the key read of "embedded"**; pure translateY is only "dropped" |
| Embed accent seam | A 2px accent seam on the bottom edge unfolds from the center over 5f, fades over 8f | Give every embed a confirmation point, but fade it fast |
| Document blocks | cue for block g = 6 + g·3.5, each block wipes over 8f; the accent caret follows only the newest block | **"Blocks × cadence against the budget first" is the core arithmetic**; with too many blocks cut blocks, don't speed up; "there is always exactly one pen tip" — two carets blinking at once means two authors |

(Measured values from the three cards skeleton-reveal / row-embed / document-typewriter-reveal)

Known traps: when the real content layer sits on a product screenshot, the skeleton grey-bar row heights and slots must be measured from the screenshot, not laid out from imagination; the doodle stage draws no detail — too much and the first and second stages look identical; mock copy must not contain real names of clients or members.

Companion camera: pair the development segment with a slow 1→1.34 push (giving the eye a motive to "lean in and see clearly"); add no lateral camera movement during the whole build — while the interface is changing the camera must hold still (huarec: no push during full-screen-level change).

### ③ User typing simulation

Simulating a real person typing into an input field / terminal. **This is a different thing from the existing Chunk Reveal (AI streaming output)**: AI output is irregular chunks emerging (best-practices §4.5, gsap-recipes §3.4 — keep using that set, it is not restated here); user input is character-by-character, even, with human hesitation. Getting the scenario wrong is a high-frequency accident: making user typing into chunks reads as "the input field is generating by itself".

| Parameter | Typical value | Feel |
|---|---|---|
| Typing speed | Body text 3f/char; terminal 2f/char; decorative small type 0.7f/char | "The final-cut value after rework because the first version felt too fast"; interaction demos follow real human operating speed — this is a precedent-level iron rule |
| Cursor state machine | **Solid** while typing, switches to an 8f-cycle blink once done | Blinking while typing reads as lag; the switch from solid to blinking is itself the signal "done" |
| Backspace correction | Once in a while: type 1-2 extra characters, pause 4-6f, backspace, then type it right | "People make typos" is the cheapest realism; but it must be pre-written into the script (frame determinism), not randomized at runtime |
| Confirmation pause | Leave 11f (0.37s) of breath between finishing typing and the page responding | Responding the instant typing ends reads as a machine doing it by itself, and the viewer can't follow cause and effect |
| Code typing | Terminal 2f/char; syntax highlighting colors in progressively as you type (the current token is colored the moment it's complete), not recolored all at once after the whole block | A uniform recolor is "pasting", not "writing code"; a highlight delay within half a token is imperceptible |
| Typing over a screenshot | A background patch covers the placeholder baked into the screenshot (keeping the icon), and the text layer types on top | Overlaying text directly double-exposes against the baked-in placeholder |

(Measured values from shotcraft·type-and-filter)

The deterministic way to write backspace corrections (pre-written script, not a runtime coin flip):

```js
// Compile "typo → pause → backspace → fix" into a character event table; the timeline only replays it
const script = typeScript("nano-lab", {
  perChar: 3 / 30,                       // 3f/char
  typo: { at: 5, wrong: "0", pauseF: 5 } // at character 5, typo a "0", pause 5f, then backspace
});
// script = [{t:0, text:"n"}, {t:0.1, text:"na"}, ... {t, text:"nano-0"},
//           {t+0.17, text:"nano-"}, {t+0.27, text:"nano-l"}, ...]
// The render layer looks text up by t; bidirectional seek is safe
```

Companion camera: before typing, move the camera up / push in to the input field (give the camera first, then act — visibility axiom); during typing the camera is locked.

### ④ Cursor operation narrative

The cursor is the only "person" in a UI demo. Use the `assets/cursor.jsx` component (CursorSprite / ClickRipple / hover-coupling hooks, two clock drivers; API in that file's header comment).

The trajectory algorithm is not restated here: bezier arcs plus converged hand jitter in best-practices §3.5, the GSAP proxy form in gsap-recipes §3.5. What this form adds is **the parameters for clicks and coupling**:

| Parameter | Typical value | Feel |
|---|---|---|
| Double-ring ripple | Two concentric rings, **start offset 3f**, radii 14→54 / 14→78px | A single ring is too faint to see; 3f apart reads as "the ripple of one click", much more apart looks like two clicks |
| Decoupled expand/dissipate | Expand out-cubic 22f, dissipate linear 26f | Expansion should punch, dissipation should be even; one curve driving both "flashes once and vanishes". In tight scenes you can compress both to 10f (type-and-filter uses the compressed version) |
| Click anticipation | Cursor scale 0.85 (power1.in, about 3f) → back.out rebound | Anticipation gives the click the weight of "pressing down" (same as gsap-recipes §3.5) |
| hover coupling | When the cursor enters the target zone, the target lights up on the same frame (brightness +6% or a hairline outline surfacing), and it withdraws the moment the cursor leaves | If the target doesn't respond, the cursor is just a decal; declare coupling windows by trajectory progress, don't do runtime hit-testing |
| Cursor role split | Operating cursor (the click carries a payload) vs. performing cursor (movement is the plot: named collaborative cursors duetting, extras) | Use this form when the cursor has to click something; a purely narrative collaborative cursor is another scene entirely (shotcraft·collab-cursor-moves); they can coexist in one film but don't conflate them |

Quick reference for the two performing-cursor forms (use for collaboration / multi-person themes; parameters from collab-cursor-moves):

| Form | Mechanism | Key parameters |
|---|---|---|
| dialogue-duet | Two named cursors, blue/green, approach to converse, arc apart above and below to swap places (R≈270px), name tags light alternately as a light handoff, the green cursor easeIn scales up dozens of times into a transition wipe | All displacements are cubic beziers, never linear; two cursors on the same arc in the same direction feel like a collision — splitting above/below is the "yielding" |
| cast-ensemble | 5 colored cursors fly in on staggered springs at delays 0/5/9/13/17f, then hold with dual-frequency sinusoidal drift (0.055/0.021 rad/f, amplitude ±46/30px), one types a cameo | Name tags fading in 12f late is "arriving and introducing yourself"; after gathering, drift decays to 25% and is retained — a completely still cursor group reads as a frozen machine |

Known traps: cursor movement must obey the visibility invariant for its whole duration — if the target is off-frame, move the camera before moving the cursor; a collaborative cursor's name-tag color is an identity code and stays consistent across the film, changing it mid-film makes viewers think the person changed; a drifting cursor must never cover the main content being read.

Companion camera: after the click is confirmed, push the camera in over 16f (zoom ≈2.2) through into the detail page — the standard handoff for "click → enter" (type-and-filter); for transition hookups see `camera-language.md`.

### ⑤ Timeline-ized UI state transitions

tab switches, modal pop-ups, page route pushes. **Timeline-driven replay and an interactive prototype are two different code shapes**; when turning a prototype into a render, translate item by item:

| | Interactive prototype | Timeline replay (for rendering) |
|---|---|---|
| Trigger | `addEventListener('click')` | label / position parameters on the timeline |
| State switch | `classList.add` + CSS transition | explicit tween (gsap-recipes §6.1 forbidden-zone rule) |
| Open/close | `display: none` toggling | `autoAlpha` tween |
| hover | `:hover` pseudo-class | coupling window declared by trajectory progress (form ④) |
| Random | `Math.random()` | mulberry32 seeded pre-generation (gsap-recipes §6.4) |

After the rewrite, `grep "addEventListener\|classList\|transition:"` and drive each hit to zero. State must be a pure function of time; every bug that looks fine in preview and only breaks in the render comes from this.

| Parameter | Typical value | Feel |
|---|---|---|
| modal / command palette | Background darkens over 10f to rgba(20,20,20,0.45) + blur 10px; panel −20px→overshoot +8px (9f)→settle back (6f); candidate rows stagger i·4f | If the background doesn't darken, the panel doesn't "float above"; an 8px overshoot is a "light landing", much more becomes a toy |
| tab switch | Indicator bar slides with FLIP (best-practices §4.1), old content fades out 5f while sinking 8px, new content fades in 8f while rising | Indicator and content out of sync is a source of cheapness: the bar goes first, the content follows half a beat later |
| Route push | The new page pushes in full-screen from the right over 12-16f, the old page retreats in the same direction 30% of the distance + dims | The old page retreating a short distance (parallax) reads deeper than an equal-distance push; equal distance is "a conveyor belt" |

(modal parameters are measured values from shotcraft·command-palette-summon)

Known traps: state transitions are the worst offender for "one shot, one effect" — in a single transition the tab switches, a toast pops, and data scrolls, and the viewer sees nothing clearly; one shot performs one state change only.

Companion camera: the moment of the state switch the camera must be still, then move after it completes (huarec's between-shots grammar: change is attention spending, don't stack it with camera movement spending).

### ⑥ 3D interface tour

A "sense of space" shot for showing a long interface / multi-screen interface. The two cards divide the work clearly, and picking the wrong card is the main accident of this form:

| Card | Mechanism | Applies |
|---|---|---|
| steep-tilt-glide | **Camera still, page moving**: the page is tilted rotateY −60° and slides across the frame at constant speed | The page walks past as an "exhibit"; content doesn't need to be legible — you're reading mass and texture |
| graze-face-tour | **Camera moving, page still**: a group of pages floats fixed, and the camera grazes past them | You need to read local content during the tour; the camera has a "visitor" persona |

| Parameter | Typical value | Feel |
|---|---|---|
| Tilt angle | rotateY −60°, live ruling zone 55-65° | −45° was ruled "not tilted enough"; beyond −70° content can't be read |
| Float height | 120-180px (graze-face-tour) | Lower and it sits on the ground with no "display" feel; higher and the shadow disconnects |
| Group stagger | Stagger the start points but let falls overlap and run in parallel | A fully sequential drop is "queuing up to punch in"; overlap is "a batch arriving" |
| Segment transitions | Crossfade ≥8f | A hard cut flashes black; a tour is continuous space, no jump cuts allowed |

(Measured values from shotcraft·steep-tilt-glide / graze-face-tour)

The third variant for multi-page display on one screen (shotcraft·page-waterfall-wall): a 3-column page waterfall wall, rotateX 20° + perspective 1000px, with neighboring columns' loop periods differing by ≥25% (e.g. 12/9/14s) and the middle column reversed. Suited to the closing segment's mass statement that "the product has many pages", where content doesn't need to be read. When the period difference is under 25% the three columns periodically align and the "wall" instantly becomes "a table".

Known traps: the two cards' mechanisms must not be mixed — if page and camera move at the same time the viewer loses their reference frame (dizziness); page textures used for a tour must be 2x or better, since tilting and scaling blurs them fastest.

Companion camera: this form is itself the camera protagonist, so the shots around it must be still (energy alternation); for camera paths and orbit vocabulary see `camera-language.md`.

### ⑦ Long-page scroll narrative

The "fast scroll, hard brake" of a long landing page / document / timeline. The scroll itself is not content — **the brake point is**.

| Parameter | Typical value | Feel |
|---|---|---|
| Brake curve | `Easing.out(Easing.exp)`, one curve covering the whole run in 50f | Staged deceleration "pumps"; a single expo curve is naturally "hard scroll, gradual stop" |
| Motion blur | blur driven by the frame-to-frame displacement delta: fast means blur, stopped means sharp | Constant blur is "a dirty lens"; blur only at the instant of motion, still frames always sharp (same conclusion as huarec) |
| Target row emphasis | After stopping, target row scale 1.03, everything else dims to 0.38 | Don't dim to 0, context must remain; 1.03 is a "breath", not a "pop-out" |

(Measured values from shotcraft·scroll-brake-moves)

Budget management for multiple brake points (huarec comfort budget, copied directly): consecutive "scroll + brake" events ≥2.6-3.0s apart; ≤4-5 within any 15s window; hold each brake point ≥1.2s before scrolling again. A brake point is attention spending, more expensive than the scroll itself.

Known traps: no push-in during scrolling — "pushing in while scrolling makes you dizzy" (huarec: no camera push during full-screen-level change); when a brake point has no content emphasis (target row not raised, the rest not dimmed) the viewer doesn't know why it stopped there.

Companion camera: after the hard brake you can add one light push-in (1.3x step) into the target row, but only after it has come fully to rest; for the step table see `camera-language.md`.

### ⑧ feature callout annotation

"Pointing it out to the viewer" on a real screenshot. Four sub-recipes, with a shared principle: **an annotation is a docent, not part of the interface** — stylistically it must pull one layer away from the product UI (serif type / handwritten feel / accent color).

| Sub-recipe | Parameters | Feel |
|---|---|---|
| Callout line growth | SVG path stroke-dashoffset draw, 12-18f, out-cubic; line first, then text, with the text fading in 5f after the line arrives | Line and text appearing together reads as a sticker; the line is the time of "a finger tracing across" |
| Highlight box | Target zone rounded-rect outline unfolds over 8f + outside dimmed to 0.3 | Outline only without dimming doesn't gather the eye; dimming past 0.5 becomes an interrogation lamp |
| Magnifier | A circular loupe with a 2-3x high-res slice inside (not the CSS-scaled screenshot base), 2px stroke + soft shadow, 8f overshoot pop-out, following the target with a 10-14f slow move | The loupe must contain a high-resolution slice — magnifying a blurry texture is self-exposing bad material; one loupe per shot at most |
| Connector explainer card | The explainer card floats in 3D space, translateZ on the order of 90px + a bob period close to the subject's but not in sync | Same 3D space, same camera; flat overlaid type was rejected by precedent (the same constraint as spotlight-hero-card's floating annotation) |
| before/after slider | Fast swipe 12f (out-cubic 8%→76%, overshooting back to 70%) → hold 18f → slow sweep 48f to 40% and freeze; speed ratio 5:1; the after layer's clip-path follows the bar; the handle's scaleX micro-stretch peaks at 1.18 driven by the speed delta | A speed ratio under 3:1 makes the cadence contrast imperceptible; the fast swipe announces "it changed", the slow sweep proves "where it changed"; the slow sweep stops at 40% so after stays in the freeze |

(slider values are measured from shotcraft·before-after-slider-scrub)

Known traps: the before and after versions must share layout and camera position, otherwise they read as two pages; before must be the real old state (inject old data / disable the feature), never a hand-faked "deliberately ugly" before; put the corner badge in the content area, don't cover the sidebar avatar.

Companion camera: before the annotation appears, push the camera to the 1.3-1.45x step so the target zone fills the frame (huarec: content occupies 80% of the visible area); during the annotation the camera is locked.

---

## §3.9 Where the eight forms sit in the film-wide energy skeleton

A single form is just a shot; a finished film is arranged by the four segments of promo-energy-arc (shotcraft·the three director-layer pieces; the storyboard discipline "carve out the hold/rest frame budget first, then place the effects" applies here too):

| Energy segment | Share of runtime | Which forms | Why |
|---|---|---|---|
| ① Brand opening | 8-12% | no UI form | Wordmark holds ≥1s; the UI must not steal the opening |
| ② Single protagonist biography | 12-15% | ①hero close-up or ②build-up | The highest-texture, slowest shot; there is only one such position in the film |
| ③ Feature ramp | 55-65% | ③④⑤⑦⑧ alternating, each shot bound to one distinct feature | Alternating high and low energy; ⑧callout is a good filler for low-energy breathing slots |
| ④ Launch-event close | 13-16% | ⑥3D tour (family-portrait variant) | The film's energy peak: display multiple screens in one frame, then sign-off |

Sound hook quick reference (done only after picture lock, pin frames with relative expressions, shotcraft stage 5):

| Form | What to pin sound to |
|---|---|
| ① hero close-up | whoosh-big on the rise, sparkle on the light sweep, one snap on the reseat — three actions, three dedicated sounds |
| ② build-up | pop on the swap-to-real beat, one very light tick per developed row, a light chime closing at the last word's late half-beat |
| ③ typing | keyboard sound strictly equal in length to the typed segment (cut by character count); pad if short, trim if long |
| ④ click | the click is the loudest sound in the film (the top of the loudness layering); the ripple is silent |
| ⑤ state transition | a soft pop for the modal, whoosh-fast for the route push |
| ⑥⑦ tour/scroll | silent or a very light hum during constant-speed stretches, one muffled thud on the hard brake |
| ⑧ callout | a very light draw friction sound for the callout line growth; whoosh + rebound tick for the slider's fast swipe, silent for the slow sweep |

---

## §4 Cadence iron rules (inherited from shotcraft precedents, specific to UI demos)

1. **Interaction demos run at real human operating speed.** Typing 3f/char, movement before a click, breath before a response. The first version of an interaction shot is almost always too fast — draft at human speed (precedent R3; type-and-filter was reworked because of this).
2. **Batch effects end with 0.5s of stillness.** Once the grid has converged, the list embedded, the panel landed: hold the full frame completely still for half a second before the next shot.
3. **Exits must be staggered.** Non-target elements fade out staggered in reading order at 0.4f intervals — "disappearing simultaneously reads as the page crashing", and even 0.4f is enough (type-and-filter).
4. **One shot, one effect.** A shot tells one UI behavior; two effects sharing the frame compete, and the viewer sees neither.
5. **End genuinely still.** No tail drift at all in breathing slots and hold frames (micro zoom changes, micro opacity adjustments all count); "still" is a designed beat, not a missing action.

---

## §5 Hookup with the three-direction gate / asset protocol

**How the three-direction board comes out**: for a product UI animation the three directions are not three visual skins but **three camera-narrative interpretations of the same UI material**. Collect the three-part material kit once and reuse it across all three directions. For example, the same product screenshot: direction A takes form ① (a single-protagonist hero close-up biography), direction B takes form ② (build-up telling the generation capability from nothing to something), direction C takes form ⑥+⑦ (tour + scroll narrative telling mass). Attach 2-3 keyframe thumbnails to each direction, so what the user chooses is "how to tell this interface", not "which image looks prettier". The three-direction gate is a 100% hard gate, and a specified style does not exempt you (an existing rule in SKILL.md).

**UI screenshot sourcing follows `brand-asset-protocol.md`**: in that protocol, UI screenshots of digital products are first-class assets (they contribute extremely high recognizability); collection channels, the 5-10-2-8 quality threshold, and the solidification into brand-spec.md all apply as written. This file adds exactly one thing: when collecting, follow the three-part material kit spec in §1 (2x full page + transparent slices + layout.json), collect it all at once, and both the camera-move and rebuild paths are covered.

**No hand-faked UI**: when no real screenshot can be found, fall back per the protocol (ask the user for real screenshots / frames from official demo videos); do not patch it up with a mockup generator, do not draw a "plausible-looking" interface in CSS. What we are expressing is this product, not "a product".

**There is exactly one exception**: when you took path 2, the HTML rebuild, the rebuild is itself "a replica benchmarked against the real screenshot", and must be checked block by block against the screenshot (typeface, corner radii, spacing, icons all measured from the screenshot); after the rebuild, capture frames side by side with the screenshot and compare. Rebuilding an interface that "sort of looks like" it hurts more than using the screenshot directly — viewers are extremely sensitive to errors in the product interfaces they use every day.

---

## §6 Pre-delivery self-check (UI showcase specific, supplementing best-practices §7)

- [ ] Did you walk the §1 decision tree? Did you avoid rebuilding HTML in a scenario where "the screenshot is enough"?
- [ ] Do the sliced elements return to their real slots in layout.json after animating?
- [ ] Are the cursor and the operations inside the visible area for the whole run (including the 8% margin)?
- [ ] Is user typing at the 3f-per-character cadence, with Chunk Reveal only for AI output — the two not mixed up?
- [ ] Is the cursor solid while typing and blinking only after? Do clicks have a double-ring ripple?
- [ ] Are there no leftover addEventListener / classList / CSS transition in the state transitions?
- [ ] Are batch exits staggered ≥0.4f, and the full frame still for 0.5s at the end?
- [ ] Does only one shot in the film use outline light / glint, and only on the protagonist?
- [ ] Are before/after on the same layout and camera position, with before being the real old state?
- [ ] Are the three direction boards three camera interpretations of the same UI material, not three skins?

---

## §7 Common failure modes quick reference

| Symptom | Root cause | Go back to |
|---|---|---|
| "Not techy enough", so you add particles / glow | The direction is already wrong; the texture gap is in real UI and camera moves | Opening claim + §1 |
| The interface hangs on the canvas like a decal | No device frame, no shadow language | §1 device frame + form ① double shadow |
| Text goes blurry after push-in | Screenshot resolution too low, or rasterization resolution issue | §1 three-part kit + camera-language.md |
| Interaction "looks scripted, not human" | Typing / clicking / responding all run at machine speed | forms ③④ + §4 rule 1 |
| Fine in preview, breaks in render | Event-driven state leaked into the timeline | form ⑤ comparison table + gsap-recipes §6 |
| The viewer says "a bit dizzy" | Camera and page moving at once, or brake points over budget | forms ⑥⑦ + huarec budget |

---

## Appendix · Relationship to the other files

| File | Relationship |
|---|---|
| `camera-language.md` | Shot vocabulary, camera-move motivation, camera rig implementation. This file says "which camera to pair", that one says "how the camera is built" |
| `animation-best-practices.md` | The master grammar for element-level motion. §3.5 mouse trajectories, §4.1 FLIP, §4.5 Chunk Reveal are cited by this file |
| `gsap-recipes.md` | Implementation-layer translation. §3.4/§3.5 proxy recipes and the §6 seek-safety rules are the execution precondition for every recipe in this file |
| `brand-asset-protocol.md` | The sourcing protocol for UI screenshots. The three-part kit in §1 of this file is its formalized extension |
| `assets/cursor.jsx` | The component implementation for form ④, used together with `browser_window.jsx` / `macos_window.jsx` |
| `apple-gallery-showcase.md` | Multi-output display in one frame goes there; single-product UI narrative goes here |
