# Slide Decks: Rules for Building HTML Slide Decks

Decks are one of the highest-frequency design jobs. This document explains how to build HTML decks well — from architecture choice and per-page design all the way to PDF/PPTX export.

**What this skill covers**:
- **HTML presentation build (the base artifact, always the default and always mandatory)** → one standalone HTML per page + the `assets/deck_index.html` aggregator, keyboard paging and full-screen presenting in the browser
- HTML → PDF export → `scripts/export_deck_pdf.mjs` / `scripts/export_deck_stage_pdf.mjs`
- HTML → editable PPTX export → `references/editable-pptx.md` + `scripts/html2pptx.js` + `scripts/export_deck_pptx.mjs` (requires the HTML to be written under the 4 hard constraints)

> **⚠️ HTML is the base; PDF/PPTX are derivatives.** Whatever format you finally deliver, you **must** first build the aggregated HTML presentation (`index.html` + `slides/*.html`). It is the "source" of the deck. PDF/PPTX are snapshots exported from that HTML with a one-line command.
>
> **Why HTML first**:
> - It is the best thing on stage (projector / shared screen goes full-screen, keyboard paging, no dependence on Keynote/PPT software)
> - During development each page can be opened with a double-click to verify, no re-running the export each time
> - It is the only upstream for PDF/PPTX export (avoids the death loop of "discover you need to change the HTML only after exporting, so export again")
> - The deliverable can be "HTML + PDF" or "HTML + PPTX" as a pair; the recipient uses whichever they like
>
> Measured on the 2026-04-22 moxt brochure: after building 13 HTML pages + the `index.html` aggregator, `export_deck_pdf.mjs` exported the PDF in one line, zero changes. The HTML build is itself a deliverable you can present from directly in a browser.

---

## 🛑 Confirm the delivery format before starting (the hardest checkpoint)

**This decision comes before "single file or multiple files".** Measured on the 2026-04-20 options private-board project: **not confirming the delivery format before starting = 2-3 hours of rework.**

### Decision tree (HTML-first architecture)

Every delivery starts from the same aggregated HTML set (`index.html` + `slides/*.html`). The delivery format only determines **how the HTML must be written** and **which export command to run**:

```
【ALWAYS DEFAULT · MANDATORY】 aggregated HTML presentation (index.html + slides/*.html)
   │
   ├── browser presentation only / local HTML archive  → done right here; HTML has max visual freedom
   │
   ├── PDF too (print / send to a group / archive)     → run export_deck_pdf.mjs, one command
   │                                                       HTML is written freely, no visual limits
   │
   └── editable PPTX too (a colleague will edit text)  → write the HTML under the 4 hard constraints from line one
                                                          run export_deck_pptx.mjs, one command
                                                          sacrifice gradients / web components / complex SVG
```

### Opening script (copy and use)

> Whatever the final delivery is — HTML, PDF or PPTX — I will first build an aggregated HTML version you can page through and present in the browser (`index.html` plus keyboard paging). That is always the default base artifact. On top of that I then ask whether you want extra PDF / PPTX snapshots.
>
> Which export format do you need?
> - **HTML only** (present / archive) → complete visual freedom
> - **PDF too** → same as above, plus one export command
> - **Editable PPTX too** (a colleague will edit text in PowerPoint) → I must write the HTML under the 4 hard constraints from line one, which sacrifices some visual power (no gradients, no web components, no complex SVG).

### Why "want PPTX means you follow the 4 hard constraints from the start"

PPTX editability requires that `html2pptx.js` can translate the DOM element by element into PowerPoint objects. That needs **4 hard constraints**:

1. body fixed at 960pt × 540pt (matching `LAYOUT_WIDE`, 13.333″ × 7.5″, not 1920×1080px)
2. All text wrapped in `<p>`/`<h1>`-`<h6>` (no div holding text directly, no `<span>` carrying the main text)
3. `<p>`/`<h*>` must not have their own background/border/shadow (put those on an outer div)
4. `<div>` must not use `background-image` (use an `<img>` tag)
5. No CSS gradient, no web component, no complex SVG decoration

**This skill's default HTML has a high degree of visual freedom** — lots of spans, nested flex, complex SVG, web components (such as `<deck-stage>`), CSS gradients — and **almost none of it passes html2pptx's constraints by nature** (measured: putting visual-driven HTML straight through html2pptx yields a pass rate < 30%).

### The real cost of the two paths (actual 2026-04-20 experience)

| Path | Approach | Result | Cost |
|------|----------|--------|------|
| ❌ **Write HTML freely first, patch PPTX afterwards** | Single-file deck-stage + lots of SVG/span decoration | Editable PPTX leaves only two options:<br>A. Hand-write hundreds of lines of pptxgenjs with hardcoded coordinates<br>B. Rewrite 17 pages of HTML into Path A format | 2-3 hours of rework, and the hand-written version carries **permanent maintenance cost** (change one word in the HTML and the PPTX must be synced by hand again) |
| ✅ **Write under Path A constraints from step one** | One standalone HTML per page + 4 hard constraints + 960×540pt | One command exports a 100% editable PPTX, and the same build still presents full-screen in a browser (Path A HTML is standard browser-playable HTML) | 5 extra minutes spent thinking "how does this text get wrapped in a `<p>`" while writing, zero rework |

### What about a mixed delivery

The user says "I want an HTML presentation **and** an editable PPTX" — **that is not a mix**, it is the PPTX requirement subsuming the HTML requirement. HTML written under Path A presents full-screen in a browser by itself (just add a `deck_index.html` aggregator). **No extra cost.**

The user says "I want PPTX **and** animation / web components" — **that is a real conflict**. Tell them: editable PPTX means giving up those visual capabilities. Make them choose the trade-off; do not quietly ship a hand-written pptxgenjs version (it becomes permanent maintenance debt).

### What if you only learn PPTX is needed afterwards (emergency recovery)

The rare case: the HTML is already written when you discover PPTX is needed. Follow the **fallback flow** (full description at the end of `references/editable-pptx.md`, "Fallback: a visual draft exists but the user insists on editable PPTX"):

1. **First choice: produce a PDF instead** (100% visual fidelity, cross-platform, the recipient can view and print it) — if the recipient's actual need is "present / archive", PDF is the best deliverable
2. **Second choice: have the AI rewrite an editable HTML from the visual draft** → export editable PPTX — keeping the design decisions (color, layout, copy) and sacrificing gradients, web components, complex SVG and similar visual capabilities
3. **Not recommended: rebuild by hand-writing pptxgenjs** — position, font and alignment all need manual tuning, maintenance cost is high, and every later one-word HTML change must be synced by hand again

Always present the choice to the user and let them decide. **Never make hand-writing pptxgenjs your first reaction** — that is the last-resort fallback.

---

## 🛑 Before batch production: build 2 showcase pages to fix the grammar

**Whenever a deck is ≥ 5 pages, you absolutely do not write from page 1 straight through to the last page.** The correct order, verified on the 2026-04-22 moxt brochure:

1. Pick the **2 page types with the greatest visual difference** and build them as showcases first (e.g. "cover" + "emotion/quote page", or "cover" + "product showcase page")
2. Screenshot them and get the user to confirm the grammar (masthead / type / color / spacing / structure / bilingual proportion)
3. Once the direction passes, batch-produce the remaining N-2 pages, each reusing the established grammar
4. When everything is done, assemble the aggregated HTML + the PDF / PPTX derivatives together

**Why**: writing 13 pages straight through → the user says "wrong direction" = 13 reworks. Building 2 showcase pages first → wrong direction = 2 reworks. Once the visual grammar is set, the decision space for the remaining N pages narrows sharply; all that remains is "how does the content fit in".

**How to choose the showcase pages**: pick the two with the most different visual structure. If those two pass, every intermediate state will pass.

| Deck type | Recommended showcase page pair |
|-----------|-------------------------------|
| B2B brochure / product launch | cover + content page (manifesto/emotion page) |
| Brand launch | cover + product feature page |
| Data report | big-data page + analysis conclusion page |
| Tutorial / courseware | chapter opener + specific concept page |

---

## 📐 Publication grammar template (verified on moxt, reusable)

Suits B2B brochure / product launch / long-report decks. Reuse this structure on every page = 13 pages visually identical, 0 rework.

### Per-page skeleton

```
┌─ masthead (top strip + rule) ─────────────┐
│  [logo 22-28px] · A Product Brochure                Issue · Date · URL │
├──────────────────────────────────────────┤
│                                          │
│  ── kicker (short green rule + uppercase label)│
│  CHAPTER XX · SECTION NAME                 │
│                                          │
│  H1 (Chinese copy, Noto Serif SC 900)     │
│  key word alone in the brand color        │
│                                          │
│  English subtitle (Lora italic)           │
│  ─────────── divider ──────────           │
│                                          │
│  [body: 60/40 two-column / 2x2 grid / list]│
│                                          │
├──────────────────────────────────────────┤
│ section name                     XX / total │
└──────────────────────────────────────────┘
```

### Style conventions (copy straight out)

- **H1**: Chinese copy in Noto Serif SC 900, 80-140px depending on information volume; key words get the brand color alone (do not pile color over the whole line)
- **English subtitle**: Lora italic 26-46px; the brand's signature phrase (e.g. "AI team") bold + brand color italic
- **Body**: Noto Serif SC 17-21px, line-height 1.75-1.85
- **Accent highlight**: bold the key terms in body copy with the brand color, no more than 3 per page (more than that and it stops anchoring the eye)
- **Background**: warm off-white #FAFAFA + a very faint radial-gradient noise (`rgba(33,33,33,0.015)`) for paper feel

### The visual lead must differ per page

If all 13 pages are "text + one screenshot" the deck is monotonous. **Rotate the type of visual lead per page**:

| Visual type | Fits these sections |
|-------------|---------------------|
| Cover typography (big type + masthead + pillar) | First page / chapter opener |
| Single-character portrait (one oversized momo, etc.) | Introducing a single concept/character |
| Group shot / avatar cards side by side | Team / user cases |
| Timeline of cards advancing | Showing "a long relationship", "evolution" |
| Knowledge graph / node-link diagram | Showing "collaboration", "flow" |
| Before/After comparison cards + arrow between | Showing "change", "difference" |
| Product UI screenshot + outlined device frame | Showing a specific feature |
| Big quote (half-page of large type) | Emotion page / problem page / citation page |
| Real headshot + testimonial card (2×2 or 1×4) | User testimonial / usage scenario |
| Big-type back cover + oval URL button | CTA / ending |

---

## ⚠️ Common pitfalls (from moxt practice)

### 1. Emoji do not render in Chromium / Playwright exports

Chromium does not ship a color emoji font by default; in `page.pdf()` or `page.screenshot()` emoji show as empty boxes.

**Fix**: use Unicode text symbols (`✦` `✓` `✕` `→` `·` `—`) instead, or switch to plain text ("Email · 23" instead of "📧 23 emails").

### 2. `export_deck_pdf.mjs` fails with `Cannot find package 'playwright'`

Cause: ESM module resolution walks up from the script's own location looking for `node_modules`. The script lives in `~/.claude/skills/studio/scripts/`, where there are no dependencies.

**Fix**: copy the script into the deck project directory (e.g. `brochure/build-pdf.mjs`), run `npm install playwright pdf-lib` at the project root, then `node build-pdf.mjs --slides slides --out output/deck.pdf`.

### 3. Screenshotting before Google Fonts finish loading → Chinese text renders in the system default sans

Before Playwright screenshots/PDFs, wait at least `wait-for-timeout=3500` so the webfonts download and paint. Or self-host the fonts under `shared/fonts/` to reduce network dependence.

### 4. Unbalanced information density: content pages hold too much

The first version of the moxt philosophy page used 2×2 = 4 paragraphs + 3 creeds at the bottom = 7 blocks, cramped and repetitive. With 1×3 = 3 paragraphs the breathing room came straight back.

**Fix**: hold each page to "1 core message + 3-4 supporting points + 1 visual lead"; go past that and split onto a new page. **Less is more** — the audience looks at a page for 10 seconds; giving them 1 memorable point is easier to remember than 4.

---

## 🛑 Decide the architecture first: single file or multiple files?

**This choice is the first step of building a deck; getting it wrong means repeated pain. Read this whole section before touching anything.**

### The two architectures compared

| Dimension | Single file + `deck_stage.js` | **Multiple files + `deck_index.html` aggregator** |
|-----------|------------------------------|-------------------------------------------------|
| Code structure | One HTML, every slide is a `<section>` | One standalone HTML per page; `index.html` aggregates them with iframes |
| CSS scoping | ❌ Global; one page's styles can hit every page | ✅ Isolated by nature; each iframe is its own world |
| Verification granularity | ❌ Need a JS goTo to get to a page | ✅ Double-click a single page file and see it in a browser |
| Parallel development | ❌ One file; multiple agents editing it conflict | ✅ Multiple agents build different pages in parallel, zero merge conflicts |
| Debugging difficulty | ❌ One CSS mistake and the whole deck falls over | ✅ One page breaks, only that page is affected |
| Embedded interactivity | ✅ Shared state across pages is trivial | 🟡 Needs postMessage between iframes |
| Print to PDF | ✅ Built in | ✅ Aggregator walks the iframes on beforeprint |
| Keyboard navigation | ✅ Built in | ✅ Built into the aggregator |

### Which one? (decision tree)

```
│ Q: roughly how many pages will this deck have?
├── ≤10 pages, needs in-deck animation or cross-page interaction, pitch deck → single file
└── ≥10 pages, academic lecture, courseware, long deck, multiple agents in parallel → multiple files (recommended)
```

**Default to the multiple-file path**. It is not an "alternative", it is **the main path for long decks and team work**. Reason: every advantage of the single-file architecture (keyboard navigation, printing, scale) also exists in multiple files, while multiple files' scope isolation and verifiability cannot be recovered in a single file.

### Why is this rule so hard? (real incident record)

The single-file architecture hit four pitfalls in a row while building an AI psychology lecture deck:

1. **CSS specificity override**: `.emotion-slide { display: grid }` (specificity 10) crushed `deck-stage > section { display: none }` (specificity 2), so every page rendered stacked at once.
2. **Shadow DOM slot rules suppressed by outer CSS**: `::slotted(section) { display: none }` could not stop the outer rule from overriding it; the sections refused to hide.
3. **localStorage + hash navigation race**: after a refresh it jumped not to the hash position but stayed at the old position recorded in localStorage.
4. **Verification cost**: you must `page.evaluate(d => d.goTo(n))` to screenshot a given page — twice as slow as a direct `goto(file://.../slides/05-X.html)`, and it errors often.

Every root cause is **a single global namespace** — the multiple-file architecture removes these problems at the physical level.

---

## Path A (default): multiple-file architecture

### Directory structure

```
my-deck/
├── index.html              # copied from assets/deck_index.html, then edit MANIFEST
├── shared/
│   ├── tokens.css          # shared design tokens (palette / type scale / common chrome)
│   └── fonts.html          # <link> to Google Fonts (included by every page)
└── slides/
    ├── 01-cover.html       # each file is a complete 1920×1080 HTML
    ├── 02-agenda.html
    ├── 03-problem.html
    └── ...
```

### Template skeleton for each slide

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>P05 · Chapter Title</title>
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
<link rel="stylesheet" href="../shared/tokens.css">
<style>
  /* Styles unique to this page. Any class name you use here cannot pollute other pages. */
  body { padding: 120px; }
  .my-thing { ... }
</style>
</head>
<body>
  <!-- 1920×1080 content (locked by the body width/height rules in tokens.css) -->
  <div class="page-header">...</div>
  <div>...</div>
  <div class="page-footer">...</div>
</body>
</html>
```

**Key constraints**:
- `<body>` is the canvas; lay out directly on it. Do not wrap it in `<section>` or any other wrapper.
- `width: 1920px; height: 1080px` is locked by the `body` rule in `shared/tokens.css`.
- Import `shared/tokens.css` for shared design tokens (palette, type scale, page-header/footer, etc.).
- Each page writes its own font `<link>` (a separate fonts import per page is cheap and guarantees each page opens standalone).

### The aggregator: `deck_index.html`

**Copy it straight from `assets/deck_index.html`**. You only edit one thing — the `window.DECK_MANIFEST` array, listing every slide filename in order with a human-readable label:

```js
window.DECK_MANIFEST = [
  { file: "slides/01-cover.html",    label: "Cover" },
  { file: "slides/02-agenda.html",   label: "Agenda" },
  { file: "slides/03-problem.html",  label: "Problem statement" },
  // ...
];
```

The aggregator already ships: keyboard navigation (←/→/Home/End/number keys/P for print), scale + letterbox, a page counter in the bottom right, localStorage memory, hash page jumps, and print mode (walk the iframes and output a PDF page by page).

#### Two overview modes (adaptive + pitfall-proof, rewritten 2026-06)

Opening a deck enters the **overview** by default; when the user has not specified one it is chosen at random by the second: **grid 60% / infinite gallery 40%** (pin it with the URL `?ov=grid|gallery` or `window.DECK_OVERVIEW='grid'|'gallery'`).

- **Grid (the default workhorse)**: renders **real child pages in iframes** (sharp, WYSIWYG, no thumbnails needed). **Adaptive**: if everything fits on one screen → tilt the plane diagonally, centered, filling the viewport; if there are too many pages to fit → keep the cards at a comfortable size and **scroll vertically** (never cram dozens of pages onto one screen as postage stamps).
- **Infinite gallery**: all pages **tile seamlessly and infinitely + drift slowly + breathe with a slight scale**, a tile contains every page (shuffled layout, all pages seen before any repeat). Lots of tiles, so it **must use `<img>` thumbnails** for performance (see below); with no thumb it falls back to an iframe.

🛑 **Three hard constraints from real experience (read before editing this file, or you will repeat the mistakes)**:
1. **Never build the overview wall with `transform-style: preserve-3d`**. Inside a preserve-3d 3D scene the browser's hit testing is unreliable for cards that "recede" (the top row) → the top row is unclickable, the middle row works intermittently. **The fix**: treat the whole wall as **a single plane tilted in 3D** (no preserve-3d), all cards coplanar, and unproject clicks onto that plane → reliable. Hover with 2D `scale`, not `translateZ`.
2. **Adapt to any page count**: a fixed column count plus a hardcoded steep tilt for the whole wall overflows and collapses at the corners / distorts perspective as pages grow. You must compute the column count from page count + viewport, flatten the tilt when rows increase, and scroll when it does not fit on one screen.
3. **Do not make thumbnails too low-resolution**: gallery thumbnails < 1000px go soft when enlarged on hover. Default 1600px.

**Generating thumbnails for the gallery**: use `scripts/gen_deck_thumbs.mjs` (playwright screenshots each page + sharp downsamples):
```bash
npm install playwright sharp
node gen_deck_thumbs.mjs --slides slides --out thumbs --width 1600
```
Then add `thumb: "thumbs/<same-name>.jpg"` to every MANIFEST entry. Grid mode ignores thumb (always iframe); only gallery mode uses it.

### Single-page verification (this is the killer advantage of multiple files)

Every slide is standalone HTML. **As soon as you finish one, double-click it open in the browser**:

```bash
open slides/05-personas.html
```

Playwright screenshots likewise just `goto(file://.../slides/05-personas.html)`; no JS page jump needed and no interference from other pages' CSS. That drives the cost of the "change a bit, verify a bit" workflow to nearly zero.

### Parallel development

Split each slide's task across different agents and run them at once — the HTML files are independent, so there are no merge conflicts. On a long deck this parallel style compresses production time to 1/N.

### What belongs in `shared/tokens.css`

Only things that are **genuinely shared across pages**:

- CSS variables (palette, type scale, spacing scale)
- Canvas locking such as `body { width: 1920px; height: 1080px; }`
- Chrome that is byte-identical on every page, such as `.page-header` / `.page-footer`

**Do not** stuff single-page layout classes in there — that degrades back into the global-pollution problem of the single-file architecture.

---

## Path B (small decks): single file + `deck_stage.js`

Suits decks of ≤10 pages that need cross-page shared state (say a React tweaks panel that must drive every page), or extremely tight scenarios like a pitch-deck demo.

### Basic usage

1. Read the contents of `assets/deck_stage.js` and embed it in the HTML `<script>` (or `<script src="deck_stage.js">`)
2. Wrap the slides in `<deck-stage>` inside body
3. 🛑 **The script tag must come after `</deck-stage>`** (see the hard constraint below)

```html
<body>

  <deck-stage>
    <section>
      <h1>Slide 1</h1>
    </section>
    <section>
      <h1>Slide 2</h1>
    </section>
  </deck-stage>

  <!-- ✅ Correct: script after deck-stage -->
  <script src="deck_stage.js"></script>

</body>
```

### 🛑 Hard constraint on script placement (real 2026-04-20 experience)

**You cannot put `<script src="deck_stage.js">` in `<head>`.** Even though it can define `customElements` there, the parser fires `connectedCallback` as soon as it reaches the `<deck-stage>` start tag — at that moment the child `<section>` elements have not been parsed yet, `_collectSlides()` gets an empty array, the counter shows `1 / 0`, and every page renders stacked at once.

**Three compliant forms** (any one):

```html
<!-- ✅ Most recommended: script after </deck-stage> -->
</deck-stage>
<script src="deck_stage.js"></script>

<!-- ✅ Also fine: script in head with defer -->
<head><script src="deck_stage.js" defer></script></head>

<!-- ✅ Also fine: module scripts are deferred by nature -->
<head><script src="deck_stage.js" type="module"></script></head>
```

`deck_stage.js` already ships a `DOMContentLoaded` deferred-collection defense, so even a head-placed script will not blow up completely — but `defer` or placing it at the bottom of body is still the cleaner approach, avoiding reliance on the defensive branch.

### ⚠️ CSS traps of the single-file architecture (read this)

The most common single-file trap — **the `display` property gets stolen by a page-level style**.

Common wrong form 1 (writing `display: flex` on the section directly):

```css
/* ❌ Outer CSS with specificity 2 overrides the shadow DOM's ::slotted(section){display:none} (also 2) */
deck-stage > section {
  display: flex;            /* every page renders stacked at once! */
  flex-direction: column;
  padding: 80px;
  ...
}
```

Common wrong form 2 (the section has a higher-specificity class):

```css
.emotion-slide { display: grid; }   /* specificity: 10, even worse */
```

Both make **every slide render stacked at once** — the counter may show `1 / 10` pretending everything is fine, while visually page one sits on top of page two on top of page three.

### ✅ Starter CSS (copy it at the start, no pitfalls)

**The section itself** only owns "visible/invisible"; **layout (flex/grid etc.) goes on `.active`**:

```css
/* The section defines only general styles that are not display */
deck-stage > section {
  background: var(--paper);
  padding: 80px 120px;
  overflow: hidden;
  position: relative;
  /* ⚠️ Do NOT write display here! */
}

/* Lock down "inactive means hidden" — specificity plus weight, double insurance */
deck-stage > section:not(.active) {
  display: none !important;
}

/* Only the active page gets the display + layout it needs */
deck-stage > section.active {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Print mode: every page must show, overriding :not(.active) */
@media print {
  deck-stage > section { display: flex !important; }
  deck-stage > section:not(.active) { display: flex !important; }
}
```

Alternative: **write the page's flex/grid on an inner wrapper `<div>`**, so the section itself is forever just a `display: block/none` switch. That is the cleanest approach:

```html
<deck-stage>
  <section>
    <div class="slide-content flex-layout">...</div>
  </section>
</deck-stage>
```

### Custom size

```html
<deck-stage width="1080" height="1920">
  <!-- 9:16 portrait -->
</deck-stage>
```

---

## Slide Labels

Both Deck_stage and deck_index label every page (shown in the counter). Give them **more meaningful** labels:

**Multiple files**: in `MANIFEST` write `{ file, label: "04 Problem statement" }`
**Single file**: put `<section data-screen-label="04 Problem Statement">` on the section

**Key: slide numbering starts at 1, not 0**.

When the user says "slide 5" they mean the 5th one, never the array position `[4]`. Humans do not speak 0-indexed.

---

## Speaker Notes

**Not by default**; add them only when the user explicitly asks.

With speaker notes you can cut the text on the slide to a minimum and focus on impactful visuals — the notes carry the full script.

### Format

**Multiple files**: in the `<head>` of `index.html` write:

```html
<script type="application/json" id="speaker-notes">
[
  "Script for slide 1...",
  "Script for slide 2...",
  "..."
]
</script>
```

**Single file**: same location.

### Notes writing tips

- **Complete**: not an outline, the words you will actually say
- **Conversational**: like normal speech, not written prose
- **Aligned**: the Nth array entry corresponds to the Nth slide
- **Length**: 200-400 words is best
- **Emotional line**: mark stresses, pauses, points of emphasis

---

## Slide design patterns

### 1. Establish a system (mandatory)

After exploring the design context, **first say out loud which system you will use**:

```markdown
Deck system:
- Background: at most 2 colors (90% white + 10% dark section divider)
- Type: display in Instrument Serif, body in Geist Sans
- Rhythm: section dividers full-bleed color + white type; ordinary slides white
- Imagery: hero slides use full-bleed photography, data slides use charts

I'll build to this system; tell me if anything is off.
```

Proceed after the user confirms.

### 2. Common slide layouts

- **Title slide**: solid background + huge title + subtitle + author/date
- **Section divider**: colored background + section number + section title
- **Content slide**: white background + title + 1-3 bullet points
- **Data slide**: title + large chart/number + a short note
- **Image slide**: full-bleed photograph + a small caption at the bottom
- **Quote slide**: white space + huge quote + attribution
- **Two-column**: left-right contrast (vs / before-after / problem-solution)

Use at most 4-5 layouts in one deck.

### 3. Scale (again)

- Body text **24px** minimum, ideally 28-36px
- Titles **60-120px**
- Hero type **180-240px**
- Slides are read from 10 meters away; the type must be big enough

### 4. Visual rhythm

A deck needs **intentional variety**:

- Color rhythm: mostly white background + the occasional colored section divider + the occasional dark passage
- Density rhythm: a few text-heavy slides + a few image-heavy ones + a few quote slides with white space
- Type-size rhythm: normal titles + the occasional giant hero type

**Do not let every slide look the same** — that is a PowerPoint template, not design.

### 5. Breathing room (required reading for data-dense pages)

**The beginner's most common mistake**: stuffing everything that could fit onto one page.

Information density ≠ effective communication. Academic/lecture decks especially need restraint:

- List/matrix pages: do not draw all N elements at the same size. Use **primary/secondary layering** — scale up the 5 things you will talk about today as the leads, shrink the other 16 into background hints.
- Big-number pages: the number is the visual lead. The caption around it must not exceed 3 lines, or the audience's eyes ping-pong.
- Quote pages: leave white space between the quote and the attribution; do not paste them together.

Self-review against two questions — "is the data the lead" and "is the text crammed together" — and keep editing until the white space makes you slightly uneasy.

---

## Printing to PDF

**Multiple files**: `deck_index.html` already handles the `beforeprint` event and outputs a PDF page by page.

**Single file**: `deck_stage.js` handles it the same way.

The print styles are already written; you do not need extra `@media print` CSS.

---

## Exporting to PPTX / PDF (self-serve scripts)

HTML first is a first-class citizen. But users often need PPTX/PDF delivery. Two general-purpose scripts are provided, **usable with any multiple-file deck**, under `scripts/`:

### `export_deck_pdf.mjs` — export a vector PDF (multiple-file architecture)

```bash
node scripts/export_deck_pdf.mjs --slides <slides-dir> --out deck.pdf
```

**Characteristics**:
- Text **stays vector** (copyable, searchable)
- 100% visual fidelity (rendered and printed by Chromium embedded in Playwright)
- **No change to a single character of the HTML**
- Each slide gets its own `page.pdf()`, then `pdf-lib` merges them

**Dependency**: `npm install playwright pdf-lib`

**Limitation**: text in a PDF is no longer editable — to change it, go back to the HTML.

### `export_deck_stage_pdf.mjs` — dedicated to the single-file deck-stage architecture ⚠️

**When to use it**: the deck is a single HTML file + a `<deck-stage>` web component wrapping N `<section>` elements (i.e. the Path B architecture). Then `export_deck_pdf.mjs` and its "one `page.pdf()` per HTML" approach does not work, and you need this dedicated script.

```bash
node scripts/export_deck_stage_pdf.mjs --html deck.html --out deck.pdf
```

**Why `export_deck_pdf.mjs` cannot be reused** (real 2026-04-20 incident record):

1. **Shadow DOM beats `!important`**: deck-stage's shadow CSS contains `::slotted(section) { display: none }` (only the active one gets `display: block`). Even `@media print { deck-stage > section { display: block !important } }` in the light DOM cannot override it — once `page.pdf()` triggers the print medium, Chromium's final render contains only the active slide, so **the whole PDF has 1 page** (a repeat of the current active slide).

2. **Looping goto over each page still yields 1 page**: the intuitive fix "navigate to each `#slide-N` then `page.pdf({pageRanges:'1'})`" also fails — because print CSS outside the shadow DOM also has a `deck-stage > section { display: block }` rule that gets overridden, and the final render is always the first section in the list (not the page you navigated to). Result: 17 loop iterations produce 17 copies of the P01 cover.

3. **Absolute children escape to the next page**: even once every section renders, if the section itself is `position: static`, its absolutely positioned `cover-footer`/`slide-footer` are positioned against the initial containing block — when print forces the section to 1080px height, the absolute footer can be pushed onto the next page (symptom: the PDF has one more page than there are sections, and that extra page holds only the orphan footer).

**Fix strategy** (already implemented in the script):

```js
// After opening the HTML, use page.evaluate to pull the sections out of the deck-stage slot,
// mount them on a plain div under body, and inline styles to force position:relative + fixed size
await page.evaluate(() => {
  const stage = document.querySelector('deck-stage');
  const sections = Array.from(stage.querySelectorAll(':scope > section'));
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
      @page { size: 1920px 1080px; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      deck-stage { display: none !important; }
    `,
  }));
  const container = document.createElement('div');
  sections.forEach(s => {
    s.style.cssText = 'width:1920px!important;height:1080px!important;display:block!important;position:relative!important;overflow:hidden!important;page-break-after:always!important;break-after:page!important;background:#F7F4EF;margin:0!important;padding:0!important;';
    container.appendChild(s);
  });
  // No page break after the last page, to avoid a trailing blank page
  sections[sections.length - 1].style.pageBreakAfter = 'auto';
  sections[sections.length - 1].style.breakAfter = 'auto';
  document.body.appendChild(container);
});

await page.pdf({ width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
```

**Why this works**:
- Pulling the sections out of the shadow DOM slot into a plain light-DOM div completely bypasses the `::slotted(section) { display: none }` rule
- Inlining `position: relative` makes the absolute children position against the section, so they cannot overflow
- `page-break-after: always` makes the browser print each section on its own page
- `:last-child` gets no break, avoiding a trailing blank page

**Careful when verifying with `mdls -name kMDItemNumberOfPages`**: macOS Spotlight metadata is cached; after rewriting the PDF you must run `mdimport file.pdf` to force a refresh, otherwise it reports the old page count. Counting with `pdfinfo` or `pdftoppm` is the real number.

---

### `export_deck_pptx.mjs` — export an editable PPTX

```bash
# The only mode: text frames are natively editable (fonts fall back to system fonts)
node scripts/export_deck_pptx.mjs --slides <dir> --out deck.pptx
```

How it works: `html2pptx` reads computedStyle element by element and translates the DOM into PowerPoint objects (text frame / shape / picture). Text becomes real text frames; double-click in PowerPoint to edit.

**Hard constraints** (the HTML must satisfy them or that page is skipped; see `references/editable-pptx.md` for details):
- All text must be inside `<p>`/`<h1>`-`<h6>`/`<ul>`/`<ol>` (no bare-text divs)
- The `<p>`/`<h*>` tag itself must not have background/border/shadow (put those on an outer div)
- Do not use `::before`/`::after` to insert decorative text (pseudo-elements cannot be extracted)
- Inline elements (span/em/strong) must not have margins
- No CSS gradient (cannot be rendered)
- A div must not use `background-image` (use `<img>`)

The script does **no** automatic preprocessing: a bare-text div is the most common violation and makes it error out and skip that page, so the text must be wrapped in `<p>`/`<h1>`-`<h6>`/`<ul>`/`<ol>` at the HTML source. Other violations (a border on a p, a margin on a span, etc.) likewise have to be fixed at the source.

**Font fallback caveat**:
- Playwright measures text-box sizes with the webfont; PowerPoint/Keynote renders with local fonts
- When the two differ there is **overflow or misalignment** — check every page by eye
- Prefer installing the fonts used in the HTML on the target machine, or fall back to `system-ui`

**Do not take this path for visual-first work** → use `export_deck_pdf.mjs` and deliver a PDF instead. A PDF is 100% faithful, vector, cross-platform, with searchable text — the true home of a visual-first deck, not some "unavoidably non-editable compromise".

### Make the HTML export-friendly from the start

For the most robust deck: **write the HTML under the 4 editable hard constraints from the moment you start**. Then `export_deck_pptx.mjs` passes everything directly. The extra cost is small:

```html
<!-- ❌ Bad -->
<div class="title">Key finding</div>

<!-- ✅ Good (wrapped in p, class inherited) -->
<p class="title">Key finding</p>

<!-- ❌ Bad (border on the p) -->
<p class="stat" style="border-left: 3px solid red;">41%</p>

<!-- ✅ Good (border on the outer div) -->
<div class="stat-wrap" style="border-left: 3px solid red;">
  <p class="stat">41%</p>
</div>
```

### When to choose which

| Scenario | Recommendation |
|----------|----------------|
| For an organizer / archival record | **PDF** (universal, high fidelity, searchable text) |
| Send to collaborators so they can tweak the text | **PPTX editable** (accept the font fallback) |
| Present live, content will not change | **PDF** (vector fidelity, cross-platform) |
| HTML is the preferred presentation medium | Play it in the browser; export is just a backup |

## The deep path to editable PPTX (long-lived projects only)

If your deck will be maintained long term, revised repeatedly, and worked on by a team — build the HTML under the html2pptx constraints **from the start**, so `export_deck_pptx.mjs` passes everything directly. See `references/editable-pptx.md` (the 4 hard constraints + HTML template + quick reference of common errors + the fallback flow when a visual draft already exists).

---

## FAQ

**Multiple files: pages in iframes will not open / show white**
→ Check whether the `MANIFEST` `file` paths are correct relative to `index.html`. Use browser DevTools to see whether the iframe src is directly reachable.

**Multiple files: one page's styles conflict with another's**
→ Impossible (iframe isolation). If it feels like a conflict, it is cache — Cmd+Shift+R for a hard refresh.

**Single file: multiple slides render stacked**
→ A CSS specificity problem. See the "CSS traps of the single-file architecture" section above.

**Single file: scaling looks wrong**
→ Check that every slide sits directly under `<deck-stage>` as a `<section>`. No `<div>` may wrap them in between.

**Single file: want to jump to a specific slide**
→ Add a hash to the URL: `index.html#slide-5` jumps to slide 5.

**Both architectures: text sits in different places on different screens**
→ Use a fixed size (1920×1080) and `px` units; do not use `vw`/`vh` or `%`. Scaling is handled uniformly.

---

## Verification checklist (mandatory once the deck is done)

1. [ ] Open `index.html` (or the main HTML) directly in a browser; check the first page has no broken images and the fonts loaded
2. [ ] Press → through every page: no blank pages, no layout misalignment
3. [ ] Press P for print preview: each page is exactly one A4 (or 1920×1080) with no cropping
4. [ ] Pick 3 random pages, Cmd+Shift+R hard refresh, confirm localStorage memory works
5. [ ] Playwright batch screenshots (multiple-file: walk `slides/*.html`; single-file: switch with goTo), then go through them by eye
6. [ ] Search for leftover `TODO` / `placeholder` and confirm they are all cleaned up
