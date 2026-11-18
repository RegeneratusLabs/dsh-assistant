# Editable PPTX export: HTML hard constraints + size decisions + common errors

This document covers the path that **uses `scripts/html2pptx.js` + `pptxgenjs` to translate HTML element by element into genuinely editable PowerPoint text boxes** — the only path `export_deck_pptx.mjs` supports.

> ## 🔴 Choose the path first: this document covers only one of two paths
>
> | Situation | Which path |
> |---|---|
> | **The HTML is not written yet**, building a deck from scratch | **this document** (write to the 4 hard constraints → `html2pptx.js`). Cleanest structure, best for later editing |
> | **The HTML is already written** and is visually driven (flex / centering / bare text / background images / SVG charts) | → `references/pptx-from-rendered-html.md` (reads post-render coordinates, **zero rework**) |
> | **The client insists "you must use our template"** | → same as above, **that is the only option**. pptxgenjs cannot take an existing pptx as a base and inherit its master |
>
> Do not mix the two paths within one project. The 4 constraints below hold only for this document's path —
> an already-written visual HTML **does not** need to be rewritten into a compliant structure just to convert to PPTX.
>
> **Core precondition**: to take this path, the HTML must follow the 4 constraints below from the first line. **This is not "write it, then convert"** — retrofitting triggers 2-3 hours of rework (measured on the 2026-04-20 options private-board project).

---

## Canvas size: use 960×540pt (LAYOUT_WIDE)

PPTX units are **inch** (physical size), not px. Decision principle: the body's computedStyle size must **match the presentation layout's inch size** (±0.1", enforced by `html2pptx.js`'s size-consistency check).

### Comparison of 3 candidate sizes

| HTML body | Physical size | Corresponding PPT layout | When to choose |
|---|---|---|---|
| **`960pt × 540pt`** | **13.333″ × 7.5″** | **pptxgenjs `LAYOUT_WIDE`** | ✅ **default recommendation** (the modern PowerPoint 16:9 standard) |
| `720pt × 405pt` | 10″ × 5.625″ | custom | only when the user specifies an "old PowerPoint Widescreen" template |
| `1920px × 1080px` | 20″ × 11.25″ | custom | ❌ a non-standard size on this path; type looks abnormally small when projected. ⚠️ but **when inheriting a client template the canvas must follow the template** (we have hit 26.67″×15″ in practice); that path is in `pptx-from-rendered-html.md` |

**Do not think of the HTML size as resolution.** PPTX is a vector document; the body size decides **physical size**, not sharpness. An oversized body (20″×11.25″) does not make text sharper — it only makes the pt size smaller relative to the canvas, which looks worse in projection/print.

### Three equivalent ways to write body

```css
body { width: 960pt;  height: 540pt; }    /* clearest, recommended */
body { width: 1280px; height: 720px; }    /* equivalent, px habit */
body { width: 13.333in; height: 7.5in; }  /* equivalent, inch intuition */
```

The matching pptxgenjs code:

```js
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';  // 13.333 × 7.5 inch, no custom layout needed
```

---

## The 4 hard constraints (violating them raises an error immediately)

`html2pptx.js` walks the DOM once and classifies every element as "text box / shape / picture / ignore" by tag and computed style. The classification rules come from limitations in the PowerPoint file format itself, projected onto HTML as the 4 items below — run through them in your head while writing and you save the page-by-page rework after conversion.

### Rule 1: text cannot sit directly inside a DIV — wrap it in `<p>` or `<h1>`-`<h6>`

```html
<!-- ❌ wrong: the text is a direct child text node of the div -->
<div class="metric">Daily active users 124k, +8% MoM</div>

<!-- ✅ right: wrap the text in <p>/<h1>-<h6>, the div only handles positioning/background -->
<div class="metric"><p>Daily active users 124k, +8% MoM</p></div>
```

**How it is detected**: the script checks whether the div's **direct child nodes** include a non-whitespace text node — text nested inside `<p>`/`<h1>`-`<h6>` does not count, only "characters sitting directly on the div" is a violation. The error includes the first 50 characters of the offending text (trailing with `...`) so you can locate the paragraph.

**span is equally unusable on its own**: span is an inline element; the script only treats it as a local style override inside a `<p>`/`<h1>`-`<h6>` (bold, recolor, underline) and never promotes it to a text box of its own. If you want an independently editable piece of text, it must be wrapped in `<p>`/`<h1>`-`<h6>`.

### Rule 2: CSS gradients are not supported (essentially a variant of "background-image is not supported")

```css
/* ❌ wrong: linear-gradient/radial-gradient both count as background-image */
.banner { background: linear-gradient(135deg, #FF6B6B, #4ECDC4); }

/* ✅ right: solid color */
.banner { background: #FF6B6B; }

/* ✅ if you need the look of a multi-color transition, stagger a few solid-color flex children and simulate the gradient with opacity or color steps */
.banner { display: flex; }
.banner div { flex: 1; }
.banner .c1 { background: #FF6B6B; }
.banner .c2 { background: #FF9B6B; }
.banner .c3 { background: #4ECDC4; }
```

**Why**: the script's check on a div only looks at whether the computed `background-image` is `none` — if it is anything else, whether it is an image or a CSS gradient function, it is rejected (a gradient is essentially a special kind of background-image). PowerPoint's native shape fill is only stably supported by pptxgenjs for solid colors; gradients need a separate OOXML structure that the toolchain does not implement yet.

### Rule 3: backgrounds/borders/shadows may only sit on DIVs — never on text tags (including `<ul>`/`<ol>`)

```html
<!-- ❌ wrong: the <h2> carries its own background and radius -->
<h2 style="background: #FFD700; border-radius: 6pt; padding: 6pt 10pt;">Core conclusion</h2>

<!-- ✅ right: the outer div carries the background/border, the <h2> only handles text -->
<div style="background: #FFD700; border-radius: 6pt; padding: 6pt 10pt;">
  <h2>Core conclusion</h2>
</div>
```

**Why**: for every `<p>`/`<h1>`-`<h6>`/`<ul>`/`<ol>` (and the `<li>` they absorb) the script first checks that element's own background/border/box-shadow separately — if any of the three is non-empty it errors out immediately, without even checking whether other rules such as "placeholder" (a `class` containing `placeholder`) also apply. This check runs before all other classification, because in PowerPoint a "shape that can paint a background/border/shadow" and a "text frame that can hold text" are two different objects; `<p>`/`<h*>` get translated only into the latter, so there is nowhere to put the former's properties.

### Rule 4: a DIV cannot use `background-image` — always use an `<img>` tag for images

```html
<!-- ❌ wrong -->
<div style="background-image: url('trend.png'); width: 300pt; height: 200pt;"></div>

<!-- ✅ right -->
<img src="trend.png" style="position: absolute; left: 60pt; top: 80pt; width: 300pt; height: 200pt;" />
```

**Why**: the script only reads the (browser-resolved) absolute `src` from `<img>` elements to generate picture objects; it does not parse the `url(...)` inside a div's `background-image` at all. Hitting this rule does not implicate the div's descendants — the `div` itself produces nothing, but if it contains `<p>`/`<img>` etc. those are still processed separately, only this layer of background image is lost. If you want an image and text on top of each other, place the `<img>` and the text layer as two independent elements and align them by positioning.

---

## Merging text boxes (`data-pptx-merge`)

**Default behavior**: every `<p>`/`<h1>`-`<h6>` in the HTML becomes an **independent text box** in the PPTX. Write 3 `<p>` inside a card → 3 stacked text boxes in PPT, and you cannot press enter to add a paragraph across the whole block while editing; you have to change size/alignment one by one.

**Solution**: add `data-pptx-merge="true"` to the outer div and all `<p>/<h*>` inside the container merge into **one editable text box**, with paragraph separators between them, so in PPT you edit continuously paragraph by paragraph.

```html
<!-- ✅ merged form: all 4 paragraphs in one text box -->
<div class="card" data-pptx-merge="true"
     style="position: absolute; top: 60pt; left: 60pt; width: 420pt;
            background: #1A4A8A; border-radius: 8pt; padding: 20pt 24pt;">
  <h2 style="font-size: 24pt; color: #FFFFFF;">Heading</h2>
  <p  style="font-size: 14pt; color: #DDEEFF;">First body paragraph.</p>
  <p  style="font-size: 14pt; color: #FFD166;">Second paragraph: a color change as emphasis.</p>
  <p  style="font-size: 14pt; color: #DDEEFF;">Third paragraph: keep writing in the same text box.</p>
</div>
```

**Preserved styles** (written per-paragraph as run options): `font-size`, `color`, `font-family`, `font-weight` (bold), `font-style` (italic), `text-decoration: underline`, and inline styles on `<b>/<i>/<u>/<strong>/<em>/<span>`.

**Taken from the first paragraph, shared by the whole box**: `text-align`, `line-height`. Because PowerPoint's alignment and line spacing are paragraph/textbox level — a box can only have one alignment. If several paragraphs align differently, do not use merge; leave them independent.

**The container's own `background`/`border`/`box-shadow`/`border-radius`** still render as a shape exactly like a normal div — that is, a blue card ground + text is still two layers, "shape + text frame", only the text layer collapses from 3-4 text boxes into 1.

**Limits**:
- `data-pptx-merge` cannot be nested (it errors).
- The container cannot use `background-image` (same as hard constraint rule 4).
- Do not put child divs with `background`/`border` inside the container — they still render as independent shapes, but their text has already been merged away, which can produce visual misalignment.

**When to use it**: when the content will be revised repeatedly and edited further in PPT. For one-off export and archive, leave it off; behavior is the same.

---

## Path A HTML template skeleton

One independent HTML file per slide, scoped from each other (avoiding the CSS pollution of a single-file deck).

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 960pt; height: 540pt;           /* ⚠️ match LAYOUT_WIDE */
    font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
    background: #FEFEF9;                    /* solid color, no gradients */
    overflow: hidden;
  }
  /* DIV handles layout/background/border */
  .card {
    position: absolute;
    background: #1A4A8A;                    /* background on the DIV */
    border-radius: 4pt;
    padding: 12pt 16pt;
  }
  /* text tags only carry font styling, no background/border */
  .card h2 { font-size: 24pt; color: #FFFFFF; font-weight: 700; }
  .card p  { font-size: 14pt; color: rgba(255,255,255,0.85); }
</style>
</head>
<body>

  <!-- title area: outer div positions, inner text tags hold the words -->
  <div style="position: absolute; top: 40pt; left: 60pt; right: 60pt;">
    <h1 style="font-size: 36pt; color: #1A1A1A; font-weight: 700;">Headlines assert, they do not name the topic</h1>
    <p style="font-size: 16pt; color: #555555; margin-top: 10pt;">Subtitle adds detail</p>
  </div>

  <!-- content card: div handles the background, h2/p handle the text -->
  <div class="card" style="top: 130pt; left: 60pt; width: 240pt; height: 160pt;">
    <h2>Point one</h2>
    <p>Short supporting line</p>
  </div>

  <!-- list: use ul/li, do not type • manually -->
  <div style="position: absolute; top: 320pt; left: 60pt; width: 540pt;">
    <ul style="font-size: 16pt; color: #1A1A1A; padding-left: 24pt; list-style: disc;">
      <li>First point</li>
      <li>Second point</li>
      <li>Third point</li>
    </ul>
  </div>

  <!-- illustration: use an <img> tag, not background-image -->
  <img src="illustration.png" style="position: absolute; right: 60pt; top: 110pt; width: 320pt; height: 240pt;" />

</body>
</html>
```

---

## Common errors at a glance

| Error message | Cause | Fix |
|---------|------|---------|
| `<div> contains bare text "XXX"` | bare text inside the div | wrap the text in `<p>`, `<h1>`-`<h6>`, `<ul>`/`<ol>` |
| `<div> background cannot use a CSS gradient` | linear/radial-gradient used | switch to a solid background-color, or export the gradient to PNG first and place it with `<img>` / `slide.addImage()` |
| `Text tag <p> has background set…` | a background/border/shadow on a `<p>` | wrap a `<div>` around it to carry the background, `<p>` holds only text |
| `<div> cannot use background-image` | the div uses background-image | change to an `<img>` tag |
| `Content overflows the page vertically by Xpt` | content overflows 540pt | reduce content or shrink the type, or truncate with `overflow: hidden` |
| `Page size mismatch` | body size does not match the pres layout | body `960pt × 540pt` with `LAYOUT_WIDE`; or defineLayout a custom size |
| `Text box "XXX" is only … from the page bottom edge` | a large-`<p>` sits < 0.5 inch from the body's bottom edge | move it up and leave enough bottom margin; the bottom of PPT gets partly covered anyway |

---

## Basic workflow (PPTX in 3 steps)

### Step 1: write a separate HTML per page under the constraints

```
my-deck/
├── slides/
│   ├── 01-cover.html    # each file is a complete 960×540pt HTML
│   ├── 02-agenda.html
│   └── ...
└── illustration/        # images referenced by all <img>
    ├── chart1.png
    └── ...
```

### Step 2: write build.js and call `html2pptx.js`

```js
const pptxgen = require('pptxgenjs');
const html2pptx = require('../scripts/html2pptx.js');  // this skill's script

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';  // 13.333 × 7.5 inch, matches the HTML's 960×540pt

  const slides = ['01-cover.html', '02-agenda.html', '03-content.html'];
  for (const file of slides) {
    await html2pptx(`./slides/${file}`, pres);
  }

  await pres.writeFile({ fileName: 'deck.pptx' });
})();
```

### Step 3: open and check

- open the exported PPTX in PowerPoint/Keynote
- double-click any text — it should be directly editable (if it is a picture, rule 1 was violated)
- verify overflow: every page should fit inside the body, nothing clipped

---

## This path vs the other options (what to choose when)

| Need | Choose |
|------|------|
| Colleagues will edit the text in the PPTX / send it to non-technical people for further editing | **this document's path** (editable; requires writing the HTML to the 4 constraints from the start) |
| Presentation only / archive, no further edits | `export_deck_pdf.mjs` (multi-file) or `export_deck_stage_pdf.mjs` (single-file deck-stage), output vector PDF |
| Visual freedom first (animation, web components, CSS gradients, complex SVG), accepting non-editability | **PDF** (same as above) — PDF is both faithful and cross-platform, a better fit than "picture PPTX" |

**Never force html2pptx onto visually-driven HTML** — measured pass rate for visually-driven HTML is < 30%, and retrofitting the rest page by page is slower than rewriting. That case should produce a PDF, not be squeezed into PPTX.

---

## Fallback: a visual draft already exists but the user insists on editable PPTX

Occasionally you hit this: you/the user already wrote a visually-driven HTML (gradients, web components, complex SVG all in play), a PDF would be the best fit, but the user says explicitly "no, it has to be an editable PPTX".

**Do not force `html2pptx` and hope it passes** — measured pass rate for visually-driven HTML on html2pptx is <30%; the other 70% error out or come out distorted.

> 🔴 **From 2026-09, try the third path before considering A/B below**: `scripts/pptx_from_rendered.py` reads the
> **post-render** coordinates from the browser, not the source, so visually-driven HTML converts directly with zero rework
> (20/20 pages passed in testing), and the user does not have to choose between "losing the visuals" and "losing editability".
> See `references/pptx-from-rendered-html.md`.
> Only mention A/B below when that path does not apply either.

The correct fallback is:

### Step 1 · Disclose the limitations first (transparent communication)

Tell the user three things in one sentence:

> "Your current HTML uses [list them specifically: gradients / web components / complex SVG / ...], so a direct conversion to editable PPTX will fail. I have two options:
> - A. **Produce a PDF** (recommended) — the visuals are 100% preserved, the recipient can view and print it but cannot edit the text
> - B. **Use the visual draft as the blueprint and rewrite an editable version of the HTML** (keeping the design decisions for color/layout/copy, but reorganizing the HTML structure to the 4 hard constraints, **giving up** gradients, web components, complex SVG and other visual capabilities) → then export an editable PPTX
>
> Which do you want?"

Do not make option B sound painless — state clearly **what will be lost**. Let the user make the trade-off.

### Step 2 · If the user picks B: the AI does the rewriting, do not ask the user to write it

The doctrine here is: **the user supplies design intent, you are responsible for translating it into a compliant implementation**. Do not send the user off to learn the 4 hard constraints and rewrite it themselves.

Principles to follow when rewriting:
- **Keep**: the color system (primary/secondary/neutrals), the information hierarchy (headline/subhead/body/notes), the core copy, the layout skeleton (top-middle-bottom / left-right columns / grid), the page rhythm
- **Downgrade**: CSS gradients → solid colors or flex segments, web components → paragraph-level HTML, complex SVG → a simplified `<img>` or solid-color geometry, shadows → removed or extremely weak, custom fonts → fall back toward system fonts
- **Rewrite**: bare text → wrapped in `<p>` / `<h*>`; `background-image` → `<img>` tag; backgrounds and borders on `<p>` → carried by an outer div

### Step 3 · Produce a comparison list (transparent delivery)

When the rewrite is done, give the user a before/after comparison so they know which visual details were simplified:

```
original design → editable version
- title area purple gradient → primary color #5B3DE8 solid background
- data card shadows → removed (replaced by a 2pt outline for separation)
- complex SVG line chart → simplified to <img> PNG (generated by screenshotting the HTML)
- web component motion in the hero area → static first frame (web components cannot be translated)
```

### Step 4 · Export & deliver both formats

- the `editable` HTML → run `scripts/export_deck_pptx.mjs` to produce an editable PPTX
- **recommended to also keep** the original visual draft → run `scripts/export_deck_pdf.mjs` to produce a high-fidelity PDF
- deliver both to the user: the PDF of the visual draft + the editable PPTX, each doing its job

### When to refuse option B outright

In some cases the rewrite cost is too high and you should steer the user away from editable PPTX:
- the HTML's core value is animation or interaction (after rewriting only a static first frame remains, 50%+ of the information is lost)
- more than 30 pages, the rewrite cost exceeds 2 hours
- the visual design depends heavily on precise SVG / custom filters (after rewriting it has almost nothing to do with the original)

Then tell the user: "This deck is too expensive to rewrite; I recommend a PDF rather than a PPTX. If the recipient really needs the pptx format, accept that the visuals will become much plainer — shall we switch to PDF?"

---

## Why the 4 constraints are physics, not bugs

These 4 are not `html2pptx.js`'s author being lazy — they are **constraints of the PowerPoint file format (OOXML) itself** projected onto HTML:

- In PPTX text must live in a text frame (`<a:txBody>`), which corresponds to paragraph-level HTML elements
- In PPTX, shapes and text frames are two objects; you cannot paint a background and write text on the same element
- PPTX shape fill has limited gradient support (only certain preset gradients, not arbitrary-angle CSS gradients)
- PPTX picture objects must reference a real image file, not a CSS property

Once you understand this, **do not expect the tool to get smarter** — the HTML has to adapt to the PPTX format, not the other way round.
