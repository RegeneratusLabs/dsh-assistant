# Deep guide to design critique

> Detailed reference for the "critique, score" step in SKILL.md's routing table. Supplies scoring standards, per-scenario emphasis, and a list of common problems.

---

## Scoring standards in detail

### 0. Concept · highest weight

First ask "does this design have an idea", then look at how well it is executed. Why place it at 0: execution is an amplifier, and amplifying an empty concept only makes it emptier.

| Score | Standard |
|------|------|
| 9-10 | Has an idea that grew out of the user's content; the visual motif cannot be swapped out |
| 7-8 | Clear intent; the motif relates to the content, though it would still sort of work on a nearby theme |
| 5-6 | Style without concept: good-looking, but says nothing |
| 3-4 | A generic template with a new skin; concept level is zero |
| 1-2 | Not even the style is right; pure decoration piled up |

**Core question list**:
- What does this design say? Can you state its idea in one sentence? If not, there is none
- Cover all the text and the logo — can you still tell the theme? If not, the visuals are not carrying the expression (except type-driven design where the text is the motif; there ask instead: would this text treatment still work on another theme?)
- Would it still hold if you swapped the client/product name? **It holds = it is a template, and this dimension is capped at ≤5**
- Does the form have a visual motif unique to the content? (Echoing SKILL.md's derivation of form: form should be derived from the content, not pulled out of the style library)

**Veto rule**: when concept ≤5, the overall score is capped at 6.0 (the bottom of the "good" band). The five dimensions after it are all execution, and no amount of refined execution can pull back a design with no idea — that is just polishing the template brighter.

### 1. Philosophy alignment

| Score | Standard |
|------|------|
| 9-10 | The design perfectly embodies the core spirit of the chosen philosophy; every detail has a philosophical justification |
| 7-8 | Direction is right, core traits land, a few details drift |
| 5-6 | Intent is visible, but other styles leak into the execution; not pure enough |
| 3-4 | Surface imitation only; the philosophical core is not understood |
| 1-2 | Basically unrelated to the chosen philosophy |

**What to check**:
- Are the signature devices of that designer/institution used?
- Do colour, type and layout conform to that philosophical system?
- Are there any self-contradicting elements? (e.g. picking Kenya Hara but cramming in content)

### 2. Visual hierarchy

| Score | Standard |
|------|------|
| 9-10 | The eye flows naturally along the designer's intent; zero friction in getting the information |
| 7-8 | Primary/secondary relationships are clear, with 1-2 spots of muddy hierarchy |
| 5-6 | Headings and body are distinguishable, but the middle levels are a mess |
| 3-4 | Information is flat; no clear visual entry point |
| 1-2 | Chaotic; the user does not know where to look first |

**What to check**:
- Is the size contrast between heading and body enough? (at least 2.5x)
- Do colour/weight/size establish 3-4 clear levels?
- Is whitespace guiding the eye?
- The "squint test": squint — is the hierarchy still clear?

### 3. Craft quality

| Score | Standard |
|------|------|
| 9-10 | Pixel-precise; alignment, spacing and colour have no flaws at all |
| 7-8 | Refined overall, with 1-2 tiny alignment/spacing issues |
| 5-6 | Basically aligned, but spacing is inconsistent and colour use is not systematic |
| 3-4 | Obvious alignment errors, chaotic spacing, too many colours |
| 1-2 | Rough; looks like a draft |

**What to check**:
- Is a consistent spacing system used (e.g. an 8pt grid)?
- Is spacing consistent among elements of the same kind?
- Is the number of colours controlled? (usually no more than 3-4)
- Is the type family consistent? (usually no more than 2)
- Are the edges precisely aligned?

### 4. Functionality

| Score | Standard |
|------|------|
| 9-10 | Every design element serves the goal; zero redundancy |
| 7-8 | Clearly function-led, with a small amount of decoration that could be cut |
| 5-6 | Basically usable, but obvious decorative elements distract |
| 3-4 | Form over function; the user has to work to find the information |
| 1-2 | Drowned in decoration; the ability to convey information is gone |

**What to check**:
- If you delete any one element, does the design get worse? (If not, delete it)
- Is the CTA/key information in the most prominent position?
- Are there elements added "because they look nice"?
- Does information density match the medium? (PPT should not be too dense; PDF can be denser)

### 5. Originality

| Score | Standard |
|------|------|
| 9-10 | Refreshing; a unique expression found within that philosophical framework |
| 7-8 | Has its own ideas; not simple template application |
| 5-6 | Middle of the road; looks like a template |
| 3-4 | Heavy use of cliché (e.g. a gradient orb standing for AI) |
| 1-2 | Entirely a template or a collage of stock material |

**What to check**:
- Are common clichés avoided? (see "Top 10 common design problems" below)
- Is there personal expression while still following the design philosophy?
- Are there design decisions that are "unexpected but entirely reasonable"?

---

## Per-scenario critique emphasis

Different output types put emphasis on different things (the concept dimension is not in the table: it is the first gate for every scenario and does not take part in the emphasis trade-off):

| Scenario | Most important | Second | Can be relaxed |
|------|-----------|--------|--------|
| WeChat official account cover/inline image | Originality, visual hierarchy | Philosophy alignment | Functionality (a single image, no interaction) |
| Infographic | Functionality, visual hierarchy | Craft quality | Originality (accuracy first) |
| PPT/Keynote | Visual hierarchy, functionality | Craft quality | Originality (clarity first) |
| PDF/whitepaper | Craft quality, functionality | Visual hierarchy | Originality (professionalism first) |
| Landing page/official site | Functionality, visual hierarchy | Originality | — (everything required) |
| App UI | Functionality, craft quality | Visual hierarchy | Philosophy alignment (usability first) |
| Xiaohongshu (RED) image | Originality, visual hierarchy | Philosophy alignment | Craft quality (atmosphere first) |

---

## Top 10 common design problems

### 1. AI-tech clichés
**Problem**: gradient orbs, digital rain, blue circuit boards, robot faces
**Why it is a problem**: users are already fatigued by these visuals and cannot tell you apart from anyone else
**Fix**: replace literal symbols with abstract metaphors (e.g. the metaphor of "conversation" instead of a chat-bubble icon)

### 2. Insufficient type scale
**Problem**: heading and body are too close in size (<2.5x)
**Why it is a problem**: the user cannot locate the key information quickly
**Fix**: make the heading at least 3x the body (e.g. body 16px → heading 48-64px)

### 3. Too many colours
**Problem**: five or more colours with no hierarchy
**Why it is a problem**: visual chaos, weak brand feel
**Fix**: limit to 1 primary + 1 secondary + 1 accent + a grey scale

### 4. Inconsistent spacing
**Problem**: element spacing is arbitrary, no system
**Why it is a problem**: looks unprofessional; the visual rhythm is chaotic
**Fix**: establish an 8pt grid system (spacing only 8/16/24/32/48/64px)

### 5. Not enough whitespace
**Problem**: every space is filled with content
**Why it is a problem**: crowding causes reading fatigue and actually lowers how efficiently information gets across
**Fix**: whitespace at least 40% of the total area (60%+ for minimal styles)

### 6. Too many fonts
**Problem**: three or more typefaces
**Why it is a problem**: visual noise; weakens unity
**Fix**: at most 2 typefaces (1 heading + 1 body); create variation with weight and size

### 7. Inconsistent alignment
**Problem**: some things left-aligned, some centred, some right-aligned
**Why it is a problem**: destroys the sense of visual order
**Fix**: pick one alignment (left is recommended) and apply it globally

### 8. Decoration over content
**Problem**: background patterns/gradients/shadows steal the show from the main content
**Why it is a problem**: putting the cart before the horse; the user came for the information, not the decoration
**Fix**: "If I delete this decoration, does the design get worse?" If not, delete it

### 9. Cyber-neon abuse
**Problem**: deep blue background (#0D1117) + neon glow effects
**Why it is a problem**: it is the default aesthetic no-go zone (this skill's taste baseline) and has become one of the biggest clichés — users can override it with their own brand
**Fix**: choose a more distinctive colour scheme (see the colour systems of the 92 styles in `references/design-styles.md`)

### 10. Information density mismatched to the medium
**Problem**: a full page of text in a PPT / ten elements crammed into a cover image
**Why it is a problem**: every medium has its own optimal information density
**Fix**:
- PPT: one core point per page
- Cover image: one visual focus
- Infographic: layered presentation
- PDF: can be denser, but needs clear navigation

---

## Critique output template

```
## Design critique report

**Overall score**: X.X/10 [Excellent (8+) / Good (6-7.9) / Needs work (4-5.9) / Failing (<4)]
(When concept ≤5 the overall score is capped at 6; fix the concept before talking execution)

**Sub-scores**:
- Concept: X/10 [What is this design's idea? Say it in one sentence]
- Philosophy alignment: X/10 [One sentence]
- Visual hierarchy: X/10 [One sentence]
- Craft quality: X/10 [One sentence]
- Functionality: X/10 [One sentence]
- Originality: X/10 [One sentence]

### Keep
- [Name the things done well, described in design language]

### Fix
[Sorted by severity]

**1. [Problem name]** — ⚠️Fatal / ⚡Important / 💡Polish
- Current: [describe what is there]
- Problem: [why it is a problem]
- Fix: [the concrete action, with numbers]

### Quick wins
If you only have 5 minutes, do these 3 things first:
- [ ] [highest-impact fix]
- [ ] [second most important fix]
- [ ] [third most important fix]
```

---

**Version**: v1.0
**Updated**: 2026-02-13
