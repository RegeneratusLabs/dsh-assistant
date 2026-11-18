# Launch film workflow: write ten thousand words of director's notes first, then animate

> The standard workflow for high-spec visual work (≥ 20 seconds, with brand narrative, with a slogan reveal, possibly promoted on X / WeChat Official Accounts / Bilibili).
>
> Trigger: the task is a "product upgrade promo / brand launch film / launch trailer / superbowl-tier ad / brand campaign / hero animation video", and **the user has explicit quality expectations** (e.g. "Super Bowl quality", "10x detail", "Apple level").
>
> Anti-trigger: do not use this flow for "make a quick animation demo", "a simple motion graphic" or "a single icon animation" — it over-engineers.

---

## 1. Why write director's notes first

Field lesson (2026-05-11 md-html v2.0 project):

In the first round we went straight to writing HTML and got a "programmer's animation" — every capability given equal effort, even pacing, slogans colliding, no narrative arc.
In the second round, on the user's instruction "stop, write a 10,000-word shot-by-shot script from an Apple director's perspective first", we wrote v5-director-notes.md (11,500 words, a 13-shot shot-by-shot spec) and then implemented from the script — passed in one go, every paused frame held up, the pacing had rises and a climax.

**The core difference**: writing the script is think, writing the HTML is execute. Think it through first and execute becomes mechanical translation. Execute first and every shot is an on-the-spot decision, which is guaranteed to be a mess.

Writing director's notes is not "putting on airs" — it is depositing every visual decision **into a document before touching anything** — each shot has already been visualized in your head, reasoned about, and traced against context. During HTML implementation there are no creative decisions left to make, only faithful translation.

---

## 2. Trigger judgment (ask yourself 3 questions first)

Before starting the launch film workflow, ask:

1. **Does this film carry brand narrative?** (a thesis / slogan reveal / sense of an upgrade ceremony) — yes → use the director's notes flow
2. **Will the audience pause to look?** (might screenshot it, make an X poster, make a cover, review it in slow motion) — yes → every frame must hold up
3. **Does the client/user have a reference of "I want it like XXX"?** (Apple / Anthropic / Nike / Penguin / some director) — yes → the visual context must be pinned down

Any "yes" → use the flow. All three "no" → skip it and use the standard flow in [animations.md](animations.md).

> 🔴 **Upstream gate (before this flow)**: a launch film must also pass SKILL.md's three-direction hard gate first — one "direction board" per direction (a real still of the hero key frame + palette + temperament line + references); only after the user picks a direction do the ten thousand words of director's notes unfold around that direction. Specifying a style word like "Apple level" does not exempt it (confirmed by the studio on 2026-07-18).

---

## 3. The 5-part structure of director's notes

Ten thousand words (10,000-12,000 Chinese characters / the equivalent in English) of director's notes must contain these 5 parts. **Any missing part makes it incomplete and hurts quality**.

### Part I · Director's Statement (the poetics, about 1500-2000 characters)

Answer 5 questions:

1. **What is this film not?** (explicit exclusions — e.g. "this is not a feature walkthrough", "not a demo")
2. **The core thesis in one line** — if the audience remembers only one sentence, which one is it?
3. **Whose context is it in conversation with?** — list 5-8 visual references (director / designer / brand / photographer / work title + year), and say what each reference taught you
4. **Three audience profiles + the promise to each**: primary / secondary / outer audience, one paragraph each
5. **The philosophy of pacing** — the shape of slow beat / acceleration / peak / slow settle, plus which second the emotional climax lands on (**not necessarily the last second**)

Close with an anti-slop checklist: **what this film does not do** (listed concretely, not vaguely).

### Part II · Visual System (the full visual spectrum, about 1500-2500 characters)

This is the engineered visual spec. Once complete, any executor can produce a consistent look from it.

Required subsections:

- **Full palette**: at least 8-10 colors, each with HEX + function definition + max share of frame
- **Type system**: at least 6 size levels, each with font name + weight + size + letter-spacing + use
- **Grid system**: canvas size + outer margins + column grid + baseline grid + key safe areas + golden-ratio anchors
- **Motion system**: easing library (4 or fewer) + duration dictionary + stagger rules + scene transition rules
- **Chrome elements**: the small details running through the film (counter / chip / ticker / watermark / texture), each with position + in/out timing
- **Audio system**: the BGM's 30-second arc curve (layered) + SFX dictionary (10+ cues with timecode + level + frequency-band separation)
- **Anti-AI-slop checklist**: a per-shot self-check table (10-15 items)

Iron rule: **every visual decision is derived from the Visual System; do not invent new values on the fly inside the shot list**.

### Part III · Story Arc (about 500-800 characters)

Three-act structure + emotion curve:

- **Act I · SETUP** (0 → the first 1/5 of the runtime, e.g. 0-6s for a 30s film): the audience enters, the question is posed
- **Act II · ESCALATION** (the middle 2/3): the answer unfolds, the theme is laid out
- **Act III · PAYOFF** (the last 1/4): elevation, slogan reveal, brand seal

Include an ASCII emotion curve plus a marker for the emotional climax.

**Key decision**: the climax is not necessarily at the end. In a 30s film the climax is usually at 22-25s (not 29s) — the last few seconds are resolution / decay, not the peak. Violating this rule reliably makes the work fizzle out at the end.

### Part IV · Shot-by-Shot Storyboard (about 5000-7000 characters · 60% of the document)

Each shot has 11 fields (none may be missing):

```
SHOT NN · NAME
[TIMECODE]    start and end time + duration
[FUNCTION]    this shot's function in the story arc (one sentence)
[VISUAL]      frame composition + element positions + direction of motion
[CAMERA]      shot size (wide/full/medium/close/extreme close, mapped to zoom tiers) + camera move + one line of motivation; even "static" says why it is static; a push-in must name a concrete anchor (vocabulary and budget in camera-language.md, shot-size system in storyboard-basics.md §3)
[TYPE]        typographic spec (font / size / tracking / leading / color / alignment)
[ANIM]        every element's in/out timing + easing + duration + stagger + delay
[AUDIO]       music beat + SFX cue (each shot's BGM beat + the required SFX timetable)
[CHROME]      the four-corner element states (which chrome is in / which fades in or out / which pulses)
[ANTI-SLOP]   which self-check items this shot passes + what 120% signature detail it has
[WHY]         the logic that carries over from the previous shot + the hook that pushes into the next
```

**Fields average 30-80 characters → 400-700 per shot → 12-15 shots → 5000-7000 characters**.

Field experience: after writing the storyboard, **read it through yourself** — delete any single shot; does the film still hold? If it can be deleted, that shot was superfluous, so delete it.

### Part V · Production Manifest (about 800-1200 characters)

The engineering delivery list:

- font loading URLs (including preconnect)
- CSS variables (paste-ready)
- BGM source selection criteria + Suno/Udio prompt keywords + backup libraries
- SFX dictionary (file path + level per cue, listed by timecode)
- **Key-frame verification plan**: 12-15 pause-and-check key-frame timecodes, with the verification items listed per frame (fonts / positions / chrome state)
- recording parameters (fps / codec / bitrate / preset)
- the ffmpeg audio mixdown command (including audio stream verification)
- deliverables list (mp4 / mp4-60fps / gif / poster.png / silent.mp4 / shot-list.csv)
- end-to-end time estimate (hour-level precision)

---

## 4. Five pieces of advice for writing director's notes

**4.1 Use a director's voice, not a PM's voice**

❌ "This shot displays the product features."
✅ "This is the hero shot — if the audience pauses anywhere, I want it to be here."

Director's notes are read by the executor, but also by your future self. First person + judgment leaves more decision trails than description.

**4.2 Cite specific works (with years), not just movement names**

❌ "Apple-inspired"
✅ "Apple 'Designed by Apple in California' (2013, dir. Mark Romanek) — what I am learning is the slow pacing + serif + big white ground"

The benefits of citing specific works: (a) any reader can look it up online for comparison (b) you force yourself to pin down which concrete technique you are learning (c) it prevents "vague inspiration".

**4.3 Trace every decision back to a first principle**

The whole film has one first principle (e.g. "Markdown is the new typewriter."). Every concrete decision — color / type / pacing / chrome — must trace back to that sentence.

A decision that does not trace back is decoration; delete it.

**4.4 Writing the anti-slop list matters more than writing the do-this list**

The "what this film does not do" list (purple gradients / emoji / Lorem ipsum / Inter display / SVG people / rounded card + left border accent) protects quality better than a "what this film does" list.

Positive decisions are endless; a negative checklist is finite — but the moment a negative checklist is violated, it is slop.

**4.5 Do not implement right after finishing — read it again 30 minutes later**

While writing, the brain is in "production mode" and cannot see inconsistencies. Read your own storyboard 30 minutes later and you will find:
- two shots with duplicate functions (delete one)
- a shot where the narrative jumps too far (add a transition)
- the emotional climax in the wrong place (move it)
- a mismatch between chrome elements and shot count (realign)

Those 30 minutes save you 2 hours of rework later.

---

## 5. Director's Notes → HTML implementation flow

After the director's notes are written, the HTML implementation steps:

1. **Reuse the starter components** (`assets/animations.jsx`'s Stage/Sprite/Easing/interpolate) — do not reinvent them
2. **Paste the CSS variables straight from Visual System Part II** — never change colors on the fly in the HTML
3. **Check the Sprite start/end timeline against Part IV's timecodes** — do not add shots on your own
4. **Extract the chrome elements into standalone components** (ChromeA/B/C/D), driven by useTime() state changes
5. **The destination cards' content must be genuinely readable** (not fake bar lines) — this is the 120% signature detail most often mentioned in the v5 project
6. **Capture and verify a key frame the moment each shot is written** (`?t=NN` URL parameter + Playwright); do not write the whole film and then verify it all at once

---

## 6. Key-frame verification flow

URL parameter implementation (must be added to the Stage component):

```js
const urlMatch = window.location.search.match(/[?&]t=([\d.]+)/);
const frozenTime = urlMatch ? parseFloat(urlMatch[1]) : null;
const [time, setTime] = useState(frozenTime != null ? frozenTime : 0);
const [playing, setPlaying] = useState(frozenTime == null);
```

→ so `file:///path/animation.html?t=14.5` freezes directly at 14.5 seconds.

Batch screenshots:

```bash
for t in 0.5 2.5 4.9 7.0 10.5 13.5 16.5 19.0 21.5 23.4 25.5 28.0 29.9; do
  npx -y playwright screenshot \
    "file://$PWD/animation.html?t=$t" \
    "keyframes/t-$t.png" \
    --viewport-size=1920,1136 \
    --wait-for-timeout=2500
done
```

Every screenshot must be verified for:
- [ ] no element overflows the 1920×1080 canvas
- [ ] tracking and leading visually correct (not cramped, not loose)
- [ ] key typographic details (period color / em-dash / italic / small caps) legible
- [ ] chrome element positions + states correct
- [ ] the anti-AI-slop checklist passes
- [ ] the "worth looking at while paused" 120% detail is present

---

## 7. Multi-perspective parallel strategy (advanced)

For complex projects (e.g. the launch film has no clear direction / you want to see several aesthetic differences / the client has not settled on a style) you can **start several subagents in parallel to build versions from different directorial perspectives**.

Real-world configuration (2026-05-11 md-html project, 6 parallel versions):

```
v5  · baseline (Anthropic / Penguin Classics publisher taste)
v5a · Wes Anderson (symmetry + retro + chapter cards)
v5b · Saul Bass (paper cutouts + 60s display type + geometric cuts)
v5c · Wong Kar-wai (Chinese serif + slow motion + nostalgia)
v5d · Massimo Vignelli (modernist grid + red and black)
v5e · Kenya Hara (minimal Japanese + negative space)
v5f · Yayoi Kusama (dots + repetition + one strong color)
```

Each subagent receives an independent brief:
- project background (the same one)
- required reading (the same v5-director-notes.md as the methodology template)
- **the assigned artist's DNA** (palette / type / visual language / pacing / signature elements / a reinforced anti-slop version, 30-50 characters per item)
- the shared task list (director-notes.md + animation.html + keyframes/ + README.md)
- shared constraints (30s / 1920×1080 / file:// / Google Fonts)

Start them in parallel and run them in the background; about 30-60 minutes gets you 6 complete versions.

Review and compare when done:
1. a table of each version's core aesthetic decisions
2. side-by-side key-frame comparison (one frame per version at the same moment)
3. vote: which one best fits the user's real need

**Crucial**: do not let the subagents reference each other — they must produce independently, otherwise everything converges to "the average". State explicitly in each subagent's instruction: "do not repeat v5's aesthetic".

---

## 8. Typical scenarios that trigger it

| User scenario | Triggers? | Notes |
|---------|---------|------|
| "Make a SaaS upgrade promo" | ✅ triggers | full flow by default |
| "An Apple-level / Super Bowl-quality video" | ✅ triggers + escalates | strongly recommend multi-perspective parallel |
| "A 30-second brand launch film" | ✅ triggers | |
| "Write a 10,000-word script for this project then animate it" | ✅ triggers | the user asked explicitly |
| "A simple motion graphic, logo spins once" | ❌ does not trigger | use the standard flow in animations.md |
| "Make an onboarding animation demo" | ❌ does not trigger | use animations.md |
| "A tutorial video with voiceover" | ❌ does not trigger | use voiceover-pipeline.md |
| "A single hero animation" | ⚠️ depends on complexity | a high-spec hero triggers it; an ordinary hero uses hero-animation-case-study.md |

---

## 9. Reference sample

A complete director's notes reference sample (self-contained, inside this skill):

`assets/director-notes-samples/launch-film-30s-sample.md` (about 78KB · 11,500 words · 13 shots · all 5 parts present)

Original project location (with the corresponding implementation HTML + key frames):

- v5-director-notes.md (the director's notes, author's local copy, not distributed with the repo)
- v5-six-forms.html (the HTML implementation, author's local copy, not distributed with the repo)
- v5-keyframes/ (key-frame verification screenshots, author's local copy, not distributed with the repo)

For a new project it is strongly recommended to **Read this sample first**, to understand the workload and the density of detail, before deciding whether to run the full flow.

---

## 10. Anti-patterns (do not do this)

❌ **Writing a condensed 1000-word version of the director's notes and then starting**
→ the condensed version will always omit some subsection of the Visual System, so you keep going back to patch the spec during HTML implementation. Do it at the ten-thousand-word level, or skip it entirely.

❌ **A storyboard with only 5-8 shots**
→ a 30-second film has at least 12-15 shots (2-3 seconds each). Fewer shots = even pacing = no climax.

❌ **Delivering the director's notes and not implementing**
→ the document is not the deliverable, the animation is. Deliver the document + the animation together, with the document as the "design rationale" appendix.

❌ **Letting the subagents see the other versions in a multi-perspective run**
→ each subagent must be independent, otherwise they converge. Only compare at the review stage.

❌ **Skipping key-frame verification and recording the MP4 directly**
→ guaranteed rework. Key-frame verification is the cheapest quality gate there is.

❌ **Deferring animation detail decisions to "I'll think about it when I record"**
→ the recording stage is mechanical execution, no creative decisions allowed. Every decision must be nailed down in the director's notes.

---

*Last revised: 2026-05-11*
*Real case: md-html v2.0 launch film (v5-director-notes.md)*
