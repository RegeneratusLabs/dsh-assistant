# Workflow: from taking the task to delivering it

This file is the main trunk of the process once the three directions are chosen, plus how to ask questions before starting.

Alignment happens in two places: one round of questions before starting, and the choice among the three directions. Once the user has looked at real first drafts and chosen a direction, alignment is done — from there, build it through in one go, polish it, and deliver; do not stop at every step asking for confirmation. Only tasks that skip the three directions (the user said so explicitly) need the "early alignment mode" below.

## Standard flow (after the three directions are chosen)

1. **Understand the need**: when specific products, technology or events are involved, the first action is a WebSearch to verify existence, release status, version, specs, and write it into the project's `product-facts.md` — this step comes before asking questions. What Phase 1 of the three directions already asked, do not ask again; a new task that skipped the three directions (say, after a direction exemption) gets one round; small fixes skip it.
2. **Explore resources, extract the core assets**: read the design system, links, screenshots, code. For a specific brand, run the brand asset protocol and produce `brand-spec.md`. Before starting, confirm the core assets are in hand: physical products have product shots, digital products have a logo and UI screenshots, color values are extracted from real HTML/SVG. If something is missing, stop and get it.
3. **Answer the five form questions first, then plan the system** (before starting each page, screen, shot):
   - **Narrative role**: hero / transition / data / quote / ending?
   - **Audience distance**: 10cm phone / 1m laptop / 10m projected screen? This decides type size and density
   - **Visual temperature**: quiet / excited / calm / authoritative / gentle / sad?
   - **Capacity estimate**: sketch 3 five-second thumbnails and work out whether the content fits
   - **Visual motif**: what visual element, structure or metaphor is unique to this content and would not appear in another subject? If you cannot answer, you are still drawing lots from style labels

   Only then fix the design system (color, type, layout rhythm, component patterns) — the system serves the answers, written into a comment at the top of the HTML. At delivery, write one sentence on "where the form comes from in the content".
   Tasks that went through the three directions do not stop here: the direction card and the user's choice already fixed the system. Tasks that skipped the three directions say the five answers and the system out loud, and wait for the user's nod before writing code.
4. **Create the folder**: the main HTML and the needed materials go under `project-name/` — do not copy a whole batch of >20 files.
5. **Alignment pass** (only for tasks that skipped the three directions, or large projects with many pages and long flows): write assumptions + placeholders + reasoning comments at the top of the HTML, show the user once early, and wait for feedback before writing components. Regular tasks that went through the three directions skip this step.
6. **Full pass**: build the chosen direction into the complete piece, make variants, add Tweaks. Decks with many pages and prototypes with many screens fix 2 representative pages first, then batch the rest; everything else gets built through in one go.
7. **Polish and verify**: at least 2 rounds of the polish loop (`python3 "$HD/scripts/polish.py" shot`, review full-size screenshots screen by screen, write down the three worst problems, fix them — see `references/polish-loop.md`); check console errors, run `python3 "$HD/scripts/design_lint.py" check` (red lights must be fixed); click through every interaction — AI-written interactions are often buggy.
8. **Deliver and feed back**: the summary states only caveats and next steps; record the look ledger with `design_lint.py ledger add`; check with `learn.py harvest` what is worth recording (`references/evolution.md`).

**Checkpoint principle**: the only places you must stop are the ones written in the narrow bridge in SKILL.md (the three directions on the table, confirmations a gate file requires). When you stop, say clearly "I did X, next I plan to do Y", then actually wait. "Continue" authorizes moving to the next step, not skipping the gate inside this step. Otherwise move forward, write down what you decided for the user as assumptions, and list them at delivery.

## Handling exceptions

| Situation | Handling |
|---|---|
| The need is too vague to start | List 3 possible directions (e.g. "landing page / dashboard / product detail page") and let the user choose; do not open with 10 questions |
| The user says "stop asking, just build it" | Questions may be skipped (fill in assumptions yourself), the three directions still happen; only if the user explicitly says "no three versions / one version is enough" do you drop to 1 main + 1 variant, and record the exact words in `direction-approved.md` |
| Reference images and the brand spec conflict | Stop, point out the specific contradiction ("the screenshot is serif, the spec says sans"), and let the user choose |
| A starter component fails to load | Check the error table in `references/react-setup.md` first; if that does not help, drop to plain HTML+CSS |
| Time pressure, "needed within 30 minutes" | Skip the alignment pass and go straight to the full pass, build 1 proposal only, and mark it "no early confirmation" at delivery |
| A single HTML >1000 lines | Split into multiple jsx per `references/react-setup.md`, share at the end with `Object.assign(window, …)` |
| The restraint principle conflicts with the information density the product needs | When the selling point is AI, data or context awareness (dashboards, trackers, copilots, health, expense tracking), go high density: ≥3 places of substantive differentiated information per screen; decorative icons still out |

On an exception, first tell the user in one sentence what happened, then handle it per the table; do not decide silently.

## The art of asking questions

The whole project asks only one round: tasks that go through the three directions ask in Phase 1 (at most 3 questions + all reference material in the same pass); the checklist below is a question bank — pick from it the questions that most affect the outcome, do not ask every one. This is not a formality; you really do need to pin the need down. But do not ask just to fill a quota — decide for yourself what can be inferred, and mark the basis. If the user does not respond, fill in assumptions by best judgment and proceed, using something visible instead of more questions.

**When to ask**: new tasks, vague tasks, no design context, the user gave one vague sentence of requirements.

**When you can skip asking**: small fixes, follow-up tasks, the user already supplied a clear PRD + screenshots + context.

**How to ask**: most agent environments have no structured question UI, so ask with a markdown checklist in the conversation. **List all the questions at once for the user to answer in batch**; do not go back and forth one at a time — that wastes the user's time and breaks their train of thought.

## Question bank

The five categories below are the questions you may ask, not every question you must ask: pick the ones that most affect the outcome, at most 3 at a time, and decide the rest yourself by best judgment, written down as assumptions.

### 1. Design Context (most important)

- Is there an existing design system, UI kit, component library? Where?
- Are there brand guidelines, color specs, type specs?
- Are there screenshots of existing products/pages to reference?
- Is there a codebase to read?

**If the user says "no"**:
- Help them find one — dig through the project directory, look for a reference brand
- Still nothing? Say plainly: "I'll work from general instinct, but that usually does not produce work that fits your brand. Would you consider providing some references first?"
- If it must be built anyway, follow the fallback strategy in `references/design-context.md`

### 2. Variation dimensions

- Beyond the three directions, which other dimensions does the user want variants on? (The three directions themselves are fixed; do not ask how many.)

### 3. Fidelity and Scope

- How high fidelity? Wireframe / half-finished / full hi-fi with real data?
- How many flows covered? One screen / one flow / the whole product?
- Are there specific "must include" elements?

### 4. Tweaks

- Which parameters should be adjustable live? (color / type size / spacing / layout / copy / feature flag)
- Does the user want to keep adjusting after it is done?

### 5. Task-specific

Details for the specific task. For example:

**Building a landing page**:
- What is the target conversion action?
- Who is the main audience?
- Competitor references?
- Who provides the copy?

**Building iOS App onboarding**:
- How many steps?
- What do users need to do?
- Skip path?
- Target retention rate?

**Building animation**:
- Duration?
- Final use (video material / official site / social)?
- Rhythm (fast / slow / segmented)?
- Keyframes that must appear?

## Question template example

For a new task, pick at most 3 questions from the bank and ask them all at once in this tone:

```markdown
Before I start, three things I want to align on — answer in one go if you can; if not, I'll start from the assumptions in brackets:

1. What is the one action you most want people to take on this page? (I'll assume download)
2. Any references you like, an existing logo, or brand colors? (if not, I'll decide from the subject)
3. Will this mostly be viewed on a phone or a computer? (I'll do both for now)
```

## Early alignment mode

For tasks that skip the three directions (the user explicitly said to skip the three versions) and for large projects with many pages and long flows. Regular tasks that went through the three directions are already aligned; just build them. Steps:

### Pass 1: Assumptions + Placeholders (5-15 minutes)

Write your **assumptions + reasoning comments** at the top of the HTML file first, the way a designer spreads sketches out for the client:

```html
<!--
My assumptions:
- This is for the XX audience
- I read the overall tone as XX (based on your "professional but not serious")
- The main flow is A→B→C
- I want to use brand blue + warm gray for color; not sure whether you want an accent color

Open questions:
- Where does the data in step 3 come from? Placeholder for now
- Background image: abstract geometry or real photography? Placeholder for now

If the direction looks wrong from here, now is the cheapest moment to change it.
-->

<!-- Then the structure with placeholders -->
<section class="hero">
  <h1>[main headline slot - awaiting your input]</h1>
  <p>[subheadline slot]</p>
  <div class="cta-placeholder">[CTA button]</div>
</section>
```

**Save → show the user → wait for feedback before the next step**.

### Pass 2: Real components + Variations (the main workload)

Once the user approves the direction, start filling in. At this point:
- Write React components to replace the placeholders
- Make variations (with design_canvas or Tweaks)
- For slides/animation, start from the starter components

**Show it again halfway** — do not wait until it is all done. If the design direction is wrong, showing it late means the work is wasted.

### Pass 3: Detail polish

Once the user is happy with the whole, polish:
- Type size / spacing / contrast fine-tuning
- Animation timing
- Edge cases
- Completing the Tweaks panel

### Pass 4: Verify + deliver

- Screenshot with Playwright (see `references/verification.md`)
- Open it in a browser and confirm by eye
- The summary is **minimal**: only caveats and next steps

## The deeper logic of variations

Giving variations is not about creating decision fatigue; it is about **exploring the possibility space**. Let the user mix and match into the final version.

### What good variations look like

- **Clear dimensions**: each variation changes on a different dimension (A vs B changes only the palette, C vs D changes only the layout)
- **Gradient**: progress step by step from a "by-the-book conservative version" to a "bold novel version"
- **Marked**: each variation has a short label saying what it is exploring

### How to implement

**Pure visual comparison** (static):
→ Use `assets/design_canvas.jsx`, a grid layout shown side by side. Each cell has a label.

**Multiple options / interaction differences**:
→ Build the full prototype and switch with Tweaks. For example, building a login page, "layout" is one tweak option:
- copy left, form right
- logo on top + form in the center
- full-screen background image + floating form

The user toggles the Tweaks and it switches; no need to open several HTML files.

### Thinking in an exploration matrix

For each design, run through these dimensions in your head and pick 2-3 to make variations on:

- Visual: minimal / editorial / brutalist / organic / futuristic / retro
- Color: monochrome / dual-tone / vibrant / pastel / high-contrast
- Type: sans-only / sans+serif contrast / all serif / monospace
- Layout: symmetric / asymmetric / irregular grid / full-bleed / narrow column
- Density: sparse and breathing / medium / information-dense
- Interaction: minimal hover / rich micro-interaction / exaggerated large animation
- Material: flat / layered shadows / texture / noise / gradient

## When you are unsure

- **You don't know how to do it**: say plainly that you are unsure, ask the user, or put in a placeholder and continue. **Do not make it up**.
- **The user's description contradicts itself**: point out the contradiction and let the user pick one direction.
- **The task is too big for one bite**: break it into steps, do the first step and show the user, then continue.
- **What the user wants is technically hard**: state the technical limits clearly and offer alternatives.

## Summary rules

At delivery, the summary is **very short**:

```markdown
✅ The deck is done (10 slides), with Tweaks to switch "night/day mode".

Note:
- The data on slide 4 is fake; I'll replace it when you provide the real data
- The animation uses CSS transitions, no JS needed

Suggested next step: open it in your browser first, and tell me which slide and which spot has a problem.
```

Do not:
- Enumerate the content of every slide
- Repeat what technology you used
- Praise how good your design is

Caveats + next steps, done.
