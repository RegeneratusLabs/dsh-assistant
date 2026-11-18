# Storyboard Basics · Lightweight storyboarding and frame composition

> The storyboarding method to run before any animation begins, whether it is 5 seconds or 50. In one sentence: **every shot is first a cover that moves**.
>
> Method sources: the freeze-frame rules (S1-S11) distilled from 300+ measured covers in the studio's illustration library; the energy-skeleton precedents of video-shotcraft's 106 shot cards; the shot-budget axioms of the HuaRec Studio camera-direction system.

---

## 0 · Positioning: division of labor with the launch-film director's script

This file is the **everyday lightweight version** of `launch-film-director-notes.md`. The ten-thousand-word launch-film director's script is the heavy process; everyday animation does not need that, but **the storyboarding step itself cannot be skipped** — skipping it produces schedule thinking (which element comes out at which second), not picture thinking (what this frame looks like).

| Runtime / type | Storyboard requirement | Basis |
|---|---|---|
| < 20s animation, motion graphic, demo | This file's **lightweight storyboard card** (§5, one line per shot) | Under 20s is not worth ten thousand words, but each shot's frame composition must be thought through first |
| ≥ 20s animation | The `director-script.md` required by the gate-file protocol, with **minimum requirement = this file's storyboard card format** (§5, all eight fields, none may be missing), free to thicken beyond that | SKILL.md "7 · Gate files" |
| launch film / brand film / "Apple-grade" expectations | Upgrade from the storyboard-card baseline to ten-thousand-word director's notes | `launch-film-director-notes.md`, whose 10 fields per shot in Part IV are the heavy version of this file's eight |

Trigger boundary: when the user says "just make a quick animation" or "a simple demo", do not dump the ten-thousand-word process on them — **but draw the storyboard cards anyway**. A storyboard card costs ten-odd minutes; skipping it costs a whole-film rework (measured on B00, 2026-07-17: skipping picture design and writing code directly produced effects that all passed, while the visuals were voted down in one go).

Relationship to existing files:

- `animation-best-practices.md` governs "how things move" (cadence, easing, motion language); this file governs "what each frame looks like and how shots are arranged" — the two are orthogonal
- The Scene-based narrative in `cinematic-patterns.md` is this file's precondition: only once scenes are divided can you talk about each scene's freeze frame
- Camera implementation parameters (camera rig, the difference between zoom and dolly, camera easing) → `camera-language.md`; this file only borrows its vocabulary at the design level

---

## 1 · Core thesis: every shot is first a cover that moves

After 300+ covers, the illustration library settled on one judgment: **a good cover = 1 concrete protagonist + ≤3 active elements + 1 clear line of sight guidance**. Every shot of an animation is first designed to that standard as a static cover, and then set in motion.

**A cover = a storyboard freeze frame.** The test is extremely concrete: pause the finished film at any random frame and that frame should work directly as a cover. A frame that fails the cover test means this shot's composition was never designed — it is just elements each moving on the timeline, added together.

Why animation violates this even more easily: animation excuses itself with "the elements appear at different times", the previous one hasn't exited before the next has entered, and every frame ends up crowded. A static cover has no such excuse, which is exactly why cover discipline is the discipline animation most lacks (illustration library, core insight #1).

The order is therefore fixed: **place the freeze frames first, then choreograph the motion**. The thumbnail pass in §6 is the executable version of that order.

---

## 2 · The eleven laws of the freeze frame

The illustration library's S1-S11 rules rewritten for the animation context. This is the heart of this file: walk every shot's composition design through them one by one.

### Law 1 · The cover test (S1)

Every scene's freeze frame must have: **1 concrete protagonist + ≤3 active elements + 1 clear visual focus**.

"≤3" is **a per-frame invariant**, not a per-scene total. When a new element enters, an old one must exit (fading out, retreating to the background, blur+dim all count as exits), so the on-screen active-element budget stays constant. When writing the timeline, count on-screen elements at each time point; if you are over, cut an entrance or exit something earlier.

> Self-check: pick three time points at random, pause, and count on-screen active elements — is any frame over 3?

### Law 2 · A zoom's endpoint must be a concrete anchor (S2)

The endpoint of a push-in / zoom can only be: the brand logo, a key number, that button in the UI, that line of code, a person's expression. **Background textures, atmosphere elements and decorative shapes do not deserve a zoom**. Pushing into something with no information is the same as telling the viewer "there's really nothing to see here".

A HuaRec precedent adds one cut: **a zoom under 1.25x is not worth doing** (the visual change is imperceptible, so it is pure wobble; the only exception is the 1.06x establishing micro-push at the opening). When designing the storyboard, write the anchor for every [CAMERA] push-in action; if you can't name the anchor, delete that camera move.

> Self-check: can this shot's push-in endpoint be named with a noun (that button / that number / that logo)? If not, delete the camera move.

### Law 3 · Sight lines and arrows = the camera-movement script (S3)

The static-cover rule that "the subject's gaze points at the main object, one arrow per image" translates into animation as: **the guiding line in the freeze frame is this shot's camera-movement instruction**. The camera follows the gaze, pushes along the arrow, pans along the UI's reading direction.

A scene has exactly 1 guiding line. If you can't find the guiding line in the freeze frame, this shot has no idea how to move. Do not force a camera move at that point — go back and fix the composition (illustration library, core insight #3).

> Self-check: show the freeze frame to someone for 3 seconds — does their eye path match the camera movement you planned?

### Law 4 · Type and image divide the work, on two tracks (S4 + illustration library C series)

The text track and the image track are two independent timelines, and their jobs do not overlap:

| Rule | Content | Source |
|---|---|---|
| Type carries the hook | Display type is capped hard at 2-6 characters per shot, main copy best at 2-4; type states the hook, the image carries the mood, and the image is never forced to act out the words | illustration library C1/C3, measured |
| Two-beat entrance | Display-type entrance cadence is fixed at two beats: **the action word slams first, the modifier color block follows** ("Measured" slams down full-screen, the "Claude 4.8" block sticks on after) | illustration library C5 |
| Type lands in negative space | Text always lands in the negative space reserved by the composition, never on the protagonist, never on the focus | illustration library C2 |
| Solid strong color | Caption type must be solid and strongly colored; **hollow white type with a colored outline is absolutely banned** | illustration library G, prohibited |

> Self-check: cover the image and keep only the type — is the hook still there? Cover the type and keep only the image — does the composition still hold? Both must pass for the division of labor to be clean.

### Law 5 · Percentage-based spatial language (S5)

The composition description in a storyboard card must be written to percentage granularity: "product screenshot in the top right 60% with perspective, person at bottom left 25%, display type pressing the top edge of the screenshot, 10% safe zone from all four edges".

This is not ritual, it is an engineering interface: **percentage language maps directly onto CSS/GSAP layout parameters**, so the implementing agent can translate it the moment it receives it and needs no further composition decisions. Writing "product on the left, type on the right" at that granularity is the same as writing nothing (gbro composition-template A/B test: percentage-granularity prompts and vague descriptions produce results a tier apart).

> Self-check: does this shot's composition description contain at least 3 percentage numbers? If not, it is still literary description, not a spec.

### Law 6 · Foreground/midground/background = three parallax layers (S6)

When designing a freeze frame, explicitly write out what the foreground / midground / background are and who occludes whom. That layering is your natural parallax material: three layers, three speeds, and changes in the occlusion relationship are where depth perception comes from.

For implementation parameters, copy the shotcraft precedent directly: layer speed coefficients 0.35 / 0.7 / 1.4, **the speed ratio between adjacent layers must be ≥2x to be perceptible**, ≤4 layers.

> Self-check: can you say what this frame's foreground, midground and background are, and who occludes whom? If not, it isn't layered yet.

### Law 7 · setup → payoff; the opening frame plants the suspense (S7)

Every scene's opening freeze frame leaves one gap (an unfinished bridge, a number not yet revealed, half the screen empty), and this shot's motion is responsible for closing it. The "from A to B" structure is inherently transition narrative: the previous shot's payoff can be the next shot's setup directly.

The failure mode is "the opening frame already displays all the information, then the elements do their effects in place": that is a poster that moves, not a shot.

> Self-check: put this shot's opening frame and ending frame side by side — can the viewer say "what got fulfilled"?

### Law 8 · Reify, and pick images with a sense of process (S8)

Abstract concepts must be reified into visible physical actions, and **prefer actions with a sense of process**: "connection" = a bridge assembled span by span, "price cut" = the price tag's $89 struck out character by character until it reads $29, "too AI-flavored" = neat grey squares staggering to fill a manuscript page.

The action is itself the animation script: pick the right image and the frame's focus and the camera movement grow out of it on their own, with no need to invent effects separately. The method is a Feynman-style translation first (how does this concept "happen"?), and only then a discussion of visual style (illustration library, core insight #4).

> Self-check: can this image be summed up in one verb (build, strike out, grow, land)? An image that can only be described with nouns has no sense of process — swap it.

### Law 9 · Style × composition are orthogonal (S9)

The illustration library's most important architectural insight, migrated as-is: **the style skin is set once for the whole film** (palette, typeface, material, background logic), **the composition template changes scene by scene** (this shot a centered close-up, the next a three-column grid, the one after a diagonal two-zone split).

A scene switch = a composition switch, never a style switch. Changing style across the film is a disaster; one composition across the film is hypnosis. Hookup with the three-direction gate: the direction board the user selects is that "set once" style skin.

> Self-check: compare any two shots — style (palette / typeface / material) should be indistinguishable, composition should differ at a glance. If it's the other way round, the architecture is wrong.

### Law 10 · Inheriting the prohibited zone (S10)

The illustration library's taste prohibitions are inherited in full, and be especially wary of animation's occupational disease: **glowing particles, data streams, holographic HUDs and cyber neon are the laziest material in motion graphics, and they all happen to sit on the studio's banned list**. Your hands itch more when making animation than when making stills — control them.

The correct answer for tech feel = real UI screenshots (3D floating-card form) + clean display type + a light background. The combination of dark blue base #0D1117 + neon glow stays banned (details as in `references/design-styles.md`, "default taste prohibited zone").

> Self-check: is any element in the frame "glowing"? If so, suspect yourself of hiding behind occupational disease first, and argue each one in or out.

### Law 11 · The 3-meter test (S11)

Pause on any frame: the largest word in it must be readable from 3 meters away. **Never shrink type because "it moves anyway"** — viewers give each frame less attention while watching animation than while looking at a still, so type can only get bigger, never smaller. This and the visual-density clause in `animation-best-practices.md` §6.5 set each other's bounds: the density clause prevents emptiness, the 3-meter test prevents sacrificing readability to crowding.

> Self-check: shrink a keyframe screenshot to phone-screen size — is the largest word still readable?

---

## 3 · Shot-size system: five zoom tiers

Traditional film's five tiers — wide, full, medium, medium close, close — map onto five zoom steps in HTML animation (the step values match `camera-language.md` §4.3; implementation details defer to it):

| Shot size | zoom step | What you see | Typical use | Source |
|---|---|---|---|---|
| Wide | 0.78x | The whole plus environmental breathing room | Opening establishing shot, closing family portrait | shotcraft full-page position 0.78 |
| Full | 1x (establishing micro-push 1.06x) | Complete interface / complete scene | The narrative base plane, home of most shots | HuaRec establishing 1.06x precedent |
| Medium | 1.3-1.45x | One feature block | The workhorse shot size of a feature demo | HuaRec light / medium push steps |
| Medium close | 1.8x | A single component / a single data point | Emphasizing a specific interaction | HuaRec heavy push step |
| Close-up | 2.3x (ceiling) | The concrete anchor from Law 2 | A key number, that button, the logo | HuaRec zoom ceiling 2.3x |

Two notes:

- The same step can be implemented with zoom (scale, no parallax) or with dolly (perspective + translateZ, with parallax), and the character is completely different; the selection rules and camera rig forms for both are in `camera-language.md` — at the storyboard level you only need to write the step and the motivation in the [CAMERA] column
- Steps are design vocabulary, not a straitjacket: 1.5x and 2.0x are both legal; the role of steps is to give words like "medium" and "close-up" a definite numeric meaning in the storyboard table

### Shot-size cadence between adjacent shots

| Rule | Content | Basis |
|---|---|---|
| Avoid cutting between the same shot size | Two adjacent shots at the same step have no sense of change — it reads as "the picture jumped" rather than "we changed shots"; differ by at least one step | HuaRec's "under 1.25x isn't worth shooting" extended to between shots |
| Avoid two-step jumps | Cutting straight from wide to close-up (0.78x → 2.3x) is dizzying; to jump you need a deliberate punch-in backed by a transition (white flash / whip-pan) | HuaRec comfort budget |
| Merge shots when the focus is near | When two adjacent shots' foci are very close, merge them into one shot and re-derive the step from the joint bounding box | HuaRec between-shots grammar |
| Pan when the focus is mid-distance | Better to move across in one shot one step wider than to do a "pull out, then push in" pump | HuaRec "switch to a pan" precedent |
| Drop a shot when the focus is far | For two foci diagonally across from each other, never shoot two zooms back to back — cut one, or insert a full-shot transition | HuaRec "drop the shot" precedent |
| Duration scales with the delta | The transition duration of a shot-size change is not a constant: `duration = 0.55 × |ln(zoomTo/zoomFrom)| / ln2`, clamped to [0.30, 0.94]s; a fixed duration is a source of amateurishness | HuaRec logarithmic-stretch formula |
| Cadence budget | Adjacent shot changes ≥2.6s apart; ≤4-5 shot-size changes within any 15s window | HuaRec comfort budget A2 |
| Curtain-call iron rule | A finished film always ends on a full or wide shot, with a ≥0.8s full-shot pause before the end; **never stop abruptly while still pushed in** | HuaRec curtain-call precedent |

---

## 4 · Energy skeleton: carve out the hold budget first, then place the effects

The shot arrangement of a multi-shot film (≥10s) is not an even split — apply shotcraft's four-segment promo-energy-arc skeleton:

| Segment | Share of runtime | Energy | Content | Hard requirement |
|---|---|---|---|---|
| ① Opening | 8-12% | Low | Brand / theme reveal | Wordmark settles and holds ≥1s |
| ② Single protagonist biography | 12-15% | Low-mid · slowest in the film | One complete action arc for the protagonist (enter → hover → reseat) | Action arc ≥3s; the highest-texture stretch |
| ③ Feature ramp | 55-65% | Mid-high ⇄ low alternating | Each shot bound to one distinct feature, energies arranged high-low alternating | After every 1-2 feature shots insert a **breathing title card** (low energy, large negative space, 2-6 characters) |
| ④ Close | 13-16% | The film's peak | Family portrait + sign-off | Closing hold, curtain call back to a full shot (§3 iron rule) |

**Scheduling discipline: carve the hold / rest frame budget out first, then place the effects** (shotcraft fill-in-the-blanks precedent). The concrete order:

1. List the features and count the shots N
2. Carve the inviolable still time out of the total budget first: wordmark hold ≥1s, 0.5s of stillness at the end of batch effects, opening action arc ≥3s, ≥0.8s full-shot pause at the end, and a 0.5s hover before the key result (best-practices §4.4)
3. Only what's left goes to the effects, arranged with high and low energy alternating; never two high-energy shots in a row
4. Choose transitions seam by seam (§7); transition frames are carved out of the adjacent shots' budgets, not added on top

The breathing title card has a fixed composition too: 2-6 characters of display type + full-screen negative space + zero decoration. It is itself a freeze frame that passes the cover test (active elements = 1), and its job is to drop the energy of the feature-ramp segment and give the viewer time to digest. Don't turn the breathing card into yet another information shot — that is the same as not inserting it at all.

Relationship to the five-segment narrative in `animation-best-practices.md` §1: Slow-Fast-Boom-Stop is the cadence curve of **a single scene / short film** (≤15s in one breath); promo-energy-arc is the skeleton of **a multi-shot film**. Under 15s, either one will do; above 20s, arrange shots with the energy skeleton and then use the five-segment narrative feel inside each shot.

---

## 5 · The lightweight storyboard card: this file's deliverable

One line per shot, eight fields, none may be missing. shotcraft's four-column table (#|time|shot|key effect) is the minimum configuration; here it expands to eight columns, with [CAMERA] as its own column (the launch-film director's script's 10 fields later expand to 11, and the added field is exactly this one):

```
| # | time | shot size | [CAMERA] move + motivation | frame composition (percentage language) | key effect | transition to next shot | acceptance frame numbers |
```

Field requirements:

- **time**: start and end seconds + implied duration; transition time is included in this shot's budget and not listed separately (§4 scheduling discipline, item 4)
- **shot size**: one of the five tiers in §3 + the zoom value
- **[CAMERA]**: the camera move + one clause of motivation; "still" is a legal camera move too, but write why it is still; every push-in must state its anchor (Law 2)
- **frame composition**: percentage language (Law 5), including the foreground/midground/background layering (Law 6)
- **key effect**: this shot tells exactly one effect (shotcraft's "one shot, one effect" precedent)
- **transition to next shot**: chosen from the §7 decision table; never leave it blank, never write "cut directly" (a bare cut is only legal if written as a deliberate hidden-cut)
- **acceptance frame numbers**: **pre-write 1-2 frame numbers per shot**, and after implementation capture those frames as the self-check (shotcraft's "three reads per shot + pre-written acceptance frame numbers" precedent). The point of pre-writing: the acceptance standard is fixed before you start, and there is no fuzzy room for "looks fine" after implementation

### Example: complete storyboard table for a 12s product animation

Imaginary product: PicSort, a screenshot-organizing tool. 1920×1080 · 30fps · 360 frames.

| # | time | shot size | [CAMERA] move + motivation | frame composition (percentage language) | key effect | transition to next shot | acceptance frame numbers |
|---|---|---|---|---|---|---|---|
| 1 | 0-2.0s | Full 1x | Still, light push to 1.06x over the last 0.3s · establish + plant suspense | A messy pile of desktop screenshots occupies the middle 70%; display type "3000 screenshots" lands in the top 20% negative space, 10% safe zone from all four edges; 2 foreground screenshots slightly occlude the midground pile | Screenshots land on the desktop with 30ms stagger; display type enters in two beats ("3000" slams down, the "screenshots" block follows) | defocus-handoff (the messy pile blurs away) | f30 / f55 |
| 2 | 2.0-3.5s | Close-up 2.3x | push-in 1x→2.3x · anchor = the date badge at the bottom right of one screenshot | A single screenshot occupies 80% centered with 2° perspective, the date badge at bottom right 15%; the other screenshots retreat to background blur | Push-in synchronized with background blur+dim (the three-piece focus shift) | shared-element reseat (this screenshot shrinks and flies beside the next shot's input field) | f85 |
| 3 | 3.5-6.0s | Medium 1.4x | Horizontal pan following the cursor · guiding line = the cursor's arc trajectory | Product UI occupies 85% with perspective, logo top left 10%, search field horizontally centered at 55%; the cursor enters on an arc from bottom left 25% | Typing 3f/char + results Chunk Reveal; 0.4s breath after typing | mask-wipe (the results panel's edge unfolds into the next shot's grid) | f130 / f165 |
| 4 | 6.0-8.5s | Full 1x | pull-out 1.4x→1x · motivation = show the scale of the organized result | The 3-column category grid occupies 85%, each column headed by a color tag; the top 15% negative space is reserved for the next shot's numbers | Cards stagger into their columns by column (30ms between columns); full frame still 0.5s when complete | flash-wash | f210 / f250 |
| 5 | 8.5-10.5s | Medium close 1.8x | Still · key-result hold, don't steal the number's scene | "3000 → 12 categories" occupies the middle 60%, the action word largest, the modifier as a color block; large negative space all around | digit-roll settling (tabular-nums), then hold 0.6s | shared-element reseat (the numbers shrink and move up to make way for the logo) | f290 |
| 6 | 10.5-12s | Full 1x | Still · curtain call, ending on a full shot | Logo centered at 12%, slogan on one line below at 8%, everything else empty | Logo morph convergence (previous element collapses → unfolds), final frame holds ≥1s | none (film end) | f330 / f359 |

Checking that table against the skeleton, you can see it: shot 1 is the setup that plants suspense (Law 7); shots 2-4 are the shot-size alternation of the feature ramp (close-up → medium → full, with no same-step consecutive cuts and no two-step jumps); shot 5 is the energy peak + hold budget; shot 6 is the full-shot curtain call. On-screen active elements per shot ≤3.

---

## 6 · Thumbnail Pass: grey-box validation before you write the real code

The storyboard table is text; the thumbnail pass turns it into visible composition validation. It costs under half an hour and insures against rework costs.

**Step 1 · Build a grey-box HTML**: a temporary HTML file, one 1920×1080 `<section>` per keyframe. Lay out the composition with solid color blocks + text labels only: a dark grey block labeled "product UI 85%" for the protagonist, a color block labeled "display type: 3000 screenshots" for the text zone, light grey blocks for foreground elements. No effects, no typeface choices, no color grading — just turning the storyboard card's percentage language into visible blocks.

Beautifying is banned at the grey-box stage (no picking typefaces, no color schemes, no shadows): beauty is what the direction board already settled, and the grey box validates only composition and cadence. Starting to beautify = starting to avoid the composition problem.

**Step 2 · Do only 3-5 keyframes**: not every shot — pick the key nodes of the energy skeleton: the opening setup frame, the biography segment's hero frame, one representative frame from the ramp, the peak frame, the curtain-call frame.

**Step 3 · Batch screenshots with Playwright**:

```bash
for i in 1 2 3 4 5; do
  npx -y playwright screenshot "file://$PWD/thumbnails.html#f$i" \
    "thumbs/f$i.png" --viewport-size=1920,1080
done
```

**Step 4 · The three acceptance questions** (asked against the thumbnails side by side):

1. **Cover all the text labels — can you still see the composition differences between the 5 images?** If not = the cadence wasn't built, the per-scene composition template swap wasn't executed (Law 9; same source as the thumbnail self-check in best-practices §1)
2. **Does each one pass the cover test on its own?** (Law 1: 1 protagonist + ≤3 elements + 1 focus)
3. **Can you point out each one's guiding line?** For the shot where you can't, go back and fix the composition; do not continue (Law 3)

**Step 5 · Once it passes, write the real code.** Keep the grey-box HTML in the project directory as the composition baseline, and come back to compare when the implementation drifts.

**Relationship to the three-direction gate**: the three-direction hard gate's "direction board" (a real hero keyframe still + palette + mood sentence) is in essence **the first thumbnail**. After the user selects a direction, the thumbnail pass is what expands that one direction board into the whole film's keyframe sequence: the direction board fixes the style skin, the thumbnail pass fixes the per-shot composition — exactly the two orthogonal layers of Law 9.

---

## 7 · Transition decision table: choose by narrative relationship

A transition is not decoration; it is the narrative logic at the seam. First judge the **narrative relationship** of the two adjacent shots, then pick the type. Implementation parameters for the transition vocabulary (duration, easing, mask forms) are in `camera-language.md` §7, the three-layer transition vocabulary.

| Narrative relationship of the two adjacent shots | First choice | Alternative | Precedent basis |
|---|---|---|---|
| Time jump ("three days later", "after the clean-up") | Black title card / flash-wash | whip-pan | shotcraft six forms: big drops get a white / black pad |
| Spatial pan (different regions of the same interface) | **pan as one shot, don't cut at all** | hidden-cut | HuaRec "mid-distance → switch to a pan": better one step wider in one shot than an out-in pump |
| Conceptual contrast (before/after, A vs B) | mask-wipe | split screen then hard cut + white flash | shotcraft mask-wipe through-window precedent |
| Progression / causality (the setup's answer is in the next shot) | shared-element reseat (the previous shot's element flies into place as the next shot's protagonist) | morph | shotcraft travel two forms; same source as voiceover-pipeline's iron rule that "a hero morphing across scenes doesn't cut" |
| Large energy drop (breathing title card → high-energy shot) | flash-wash / white-flash FlashCut | whip-pan | shotcraft: seams are typed by energy drop |
| Small energy drop (adjacent feature shots in the ramp) | defocus-handoff / crossfade ≥8f | hidden-cut | shotcraft graze-face-tour "crossfade between segments to prevent black flashes" |

Three disciplines:

1. **One form per seam**, no stacking (white flash + whip-pan together is slop)
2. **Transition frames come out of the adjacent shots' budgets**, never added time; the storyboard table's time column already includes the transition
3. **Zero bare cuts in the whole film**. shotcraft's precedent, verbatim: a widely praised launch film has not one bare cut from start to finish. If you want a "cut" effect, use a hidden-cut (hide the cut point behind a full-screen element / white frame / motion peak) — that is a designed cut, not an undesigned one

Films with narration get one more: **move on pause** (HuaRec precedent). Shot changes and transitions snap to speech gaps, only earlier and never later, capped at 0.8s, because a viewer's cognitive cost of moving their eyes is lowest during an auditory gap. When working with voiceover-pipeline, use timeline.json's real gaps to fix the cut points.

---

## 8 · Pre-work checklist (definition of a finished storyboard)

Before writing code, confirm all of the following exist:

- [ ] Storyboard table: one line per shot, all eight fields, saved into the project directory (at ≥20s this is the core section of `director-script.md`)
- [ ] Each shot's freeze frame has been checked against the applicable laws, at minimum explicitly checking Law 1 (cover test), Law 3 (guiding line) and Law 5 (percentage composition)
- [ ] The shot-size column has no same-step consecutive cuts and no two-step jumps (§3)
- [ ] The hold / rest budget was carved out first, and breathing title cards are inserted (§4)
- [ ] Each seam's transition choice is written in the table, with zero bare cuts in the film (§7)
- [ ] The 3-5 grey-box screenshots from the thumbnail pass pass the three acceptance questions (§6)
- [ ] Acceptance frame numbers are pre-written for every shot, to be compared frame by frame after implementation (§5)

All seven passing ends the storyboarding stage and begins implementation. When implementation gets voted down, locate by layer first: is it the effect skeleton or the visual craft (the repair formulation in best-practices §6.5)? The storyboard table itself usually does not need rewriting.

---

*Written: 2026-07-23 · Sources: the illustration library's S1-S11 freeze-frame rules + video-shotcraft energy-skeleton precedents + HuaRec shot-budget axioms*
*Sister files: `camera-language.md` (camera implementation layer) · `launch-film-director-notes.md` (the heavy version)*
