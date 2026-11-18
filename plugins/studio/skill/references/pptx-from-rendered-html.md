# Visual HTML → editable PPTX: read the rendered result, don't touch the HTML

`references/editable-pptx.md` covers **the html2pptx path**: the HTML is written against 4 hard
constraints from the first line, and only then does it convert. That document reaches one
conclusion — "**never force html2pptx onto visually-driven HTML**;
measured pass rate < 30%" — and offers two fallbacks: produce a PDF, or rewrite an editable
version of the HTML.

**This document covers a third path, and it makes that fallback unnecessary.**

The core difference in one sentence: **html2pptx reads source code; this script reads the
coordinates after the browser has rendered.** flex, centering, automatic line wrapping — the
browser has already resolved all of it into absolute positions, so "bare text inside a div",
"used flex", "a background on a p" are not problems at all — to `getBoundingClientRect` they are
just rectangles.

---

## Choose the path first: one of three

| Situation | Which path | Why |
|---|---|---|
| **The HTML isn't written yet**, you're building the deck from scratch | `scripts/html2pptx.js` (see `editable-pptx.md`) | PPTX written against the 4 constraints has the cleanest structure; text-box merging and paragraph hierarchy are better for later editing |
| **The HTML is already written** and is visually driven (flex / centering / bare text / background images / SVG charts) | **`scripts/pptx_from_rendered.py` (this document)** | Zero rework, convert as-is. Rewriting 20 pages of HTML to satisfy constraints costs far more than measuring directly |
| **The client insists "you must use our template"** | **This path is the only option** | pptxgenjs creates files from scratch and cannot inherit a master from an existing pptx; python-pptx can |

⚠️ **Don't mix the two paths in one project.** Pick one and go to the end, or the two coordinate systems will fight each other.

---

## Usage

```bash
python3 scripts/pptx_from_rendered.py deck.html -o deck.pptx --selector ".slide"
```

When inheriting the client's official template (the most common commercial-job scenario):

```bash
python3 scripts/pptx_from_rendered.py deck.html -o deck.pptx \
    --selector ".slide" \
    --template client-template.pptx \
    --layout "Content" \
    --skip-class logo \
    --bg 05070B
```

Dependencies: `playwright` (with chromium), `python-pptx`, `Pillow`.
Add `--dump-json dom.json` to dump the measured element list to disk; very useful when chasing positioning problems.

---

## Inheriting the client's template: so their master edits apply everywhere

The most common reason for rework on a commercial job isn't "it doesn't look good" — it's
"**you didn't use our template**". When the client says that, they usually mean two specific
things: ① the logo is the latest version;
② **when they edit the master, your pages have to follow.**

A PPTX with one full-bleed image per page can do neither; and even with real text boxes, a file
built from scratch with pptxgenjs has no access to their master. The approach is to use their
`.pptx` as the base:

1. Open it with `Presentation(client-template.pptx)`
2. **Delete the template's sample slides**, leaving master / layouts / theme / color palette untouched (`strip_slides`)
3. `add_slide(official layout)` for each page, and remove the empty placeholders that the layout brings onto the page
4. **Don't paint shared elements like the logo into the content layer** — let the layout provide them. At render time use `--skip-class logo`
   to skip the logo in the HTML, so the page carries only your content and the layout supplies the logo.
   That way, when the client edits the master / layout, every page follows as a whole.

⚠️ **Trap: a layout may hide a solid rectangle covering the full screen**, same color and size as
the layout background (a redundant mask). Leave it in and anything placed beneath it on the page
gets covered. The script's `unblock_layout` deletes it, and deleting it doesn't change how the
layout looks.

**Take the canvas size from the template, not from the 960×540pt in `editable-pptx.md`.** Whatever
the client's template is, match it (testing has hit 26.67×15 inch); if the sizes differ, the merged
file gets scaled wholesale. The script computes the scale as
`slide width in pt ÷ HTML canvas width in px`; with an HTML canvas of 1920px and a 1920pt slide
that ratio is exactly 1.0 — **1 CSS px = 1 PowerPoint pt**, no mental arithmetic needed.

---

## Six layout traps (every one of them has burned us)

None of these are covered by `editable-pptx.md`, because it assumes the HTML was newly written
against the constraints. When you read a rendered result, skipping any single one fails outright:

### 1. Newlines and indentation in the HTML source become real line breaks in the PPTX

```html
<div>
    <em>68</em>
    <span>projects shipped; I built daily data collection</span>
</div>
```

Newlines and indentation between tags are **real text nodes**. The browser collapses them per
`white-space:normal` (runs of whitespace → a single space, leading and trailing whitespace
dropped); PPTX has no such rule — that `\n` travels over verbatim, and in PowerPoint it becomes a
real line break that pushes the whole following run down a line to cover other elements.

**Fix**: collapse HTML whitespace at extraction time, and discard runs that collapse to empty.

### 2. A container's font-size is usually inherited; don't use it to compute margins and leading

The div above may have a `computedStyle.fontSize` of only 16px (inherited from body) while
containing a 132px number. Computing text-box margins and leading from 16px is simply wrong.

**Fix**: use the **largest** font size among the `runs` as the baseline size.

### 3. Don't dedupe line count by rectangle top

`Range.getClientRects()` returns several rectangles for runs of different font sizes on the same
line — they're baseline-aligned, but their top edges differ a lot. Dedupe by `top` and one line
gets counted as several (testing counted one line as 4).

**Fix**: cluster by whether the y intervals overlap.

### 4. Multiple font sizes in one box can't share one leading

PowerPoint leading is **paragraph-level**, and visual comps routinely put lines of different sizes
into the same div:

```html
<div>The one I put the most into<br>over a week, forty thousand lines<br><em class="big">never shipped</em></div>
```

Apply one leading to the whole box and the small lines stretch while the big one is squeezed; in
testing, two adjacent lines overlapped outright.

**Fix**: **split on `<br>`, one text box per segment**, each with its own position and line height.
The text-box count grows (137 → 175 in testing), but that's the price of correctness.

### 5. Flex shrink-wrapped boxes have zero slack and the last character drops a line

A flex child with `align-items:center` shrinks to the text's actual width, **with no slack at all**.
Move that to PowerPoint and if the font metrics differ by a hair, the last character gets pushed
onto the next line (in testing, the final character of two separate single-line boxes dropped).

**Fix**: measure whether that segment actually wrapped in the HTML; if it was single-line to begin
with, **turn word wrap off entirely** in the PPTX (`word_wrap = False`) so wrapping is structurally
impossible. In testing, 150 of 175 boxes were this case.

### 6. Don't set exact line spacing on single-line paragraphs

The measured line-box height is larger than the real line gap (that's the **font line box**, not
the CSS line height; 185 vs 148 in testing). Use it as the exact line spacing and you push the
text down as a whole.

**Fix**: only set leading on paragraphs that actually wrapped; let PowerPoint lay out single-line
paragraphs naturally by font size — the text sits tight to the top of the box and the position
comes out more accurate than any computed value.

---

## 🔴 Verification: verify your verification tool first

**This is the biggest lesson of this path, worth more than every technical detail above.**

The same PPTX can render completely differently in different renderers. With the wrong tool, traps
1, 3, 4 and 6 **won't surface at all** — 20 pages look perfect, and the client opens it to
overlapping text.

| Tool | Trustworthy? | Notes |
|---|---|---|
| **macOS `qlmanage -t` thumbnails** | ❌ **No** | takes a simplified rendering path, far more forgiving about leading than real PowerPoint. In testing it let through 4 bugs that cause overlapping text |
| **LibreOffice (macOS)** | ⚠️ Layout trustworthy, Chinese may be entirely missing | it can't find macOS's system Chinese fonts and renders tofu boxes or even blank |
| **Keynote + AppleScript** | ✅ **the automation-friendly first choice** | real presentation-engine layout; scriptable PDF export, then page-by-page images |
| **Open in WPS / PowerPoint** | ✅ **final confirmation** | the client will most likely use one of these. Human eyes |

**Keynote automation (the only fully automatic and trustworthy route on this machine)**:

```bash
osascript <<'EOF'
tell application "Keynote"
  activate
  set d to open POSIX file "/abs/path/deck.pptx"
  delay 4
  export d to POSIX file "/abs/path/out.pdf" as PDF
  close d saving no
  quit
end tell
EOF
pdftoppm -png -r 54 out.pdf page     # then compare page by page against the original HTML
```

**Test whether a renderer is trustworthy with a control experiment**: feed the **client's original
template** to the same renderer. If Chinese goes missing when it renders the official template too,
that's an environment problem, not a problem with your file — this step saves hours of debugging in
the wrong direction.

⚠️ **Don't use System Events key injection to page through and screenshot.** The keystrokes land in
whatever window the user is typing into.

**Also run a mechanical check** (independent of any renderer):

- Text-loss check: **on by default after the script exports** (`verify_text()`); it compares the page's rendered `innerText` against the text in the pptx page by page (whitespace stripped, case-insensitive), and prints "⚠️ text-loss check" plus the missing fragments when something is missing. It's on by default because text loss is silent — nothing throws an error, and a check that depends on someone remembering to run it is no check at all
- Count comparison: image count and shape count aligned page by page

**The reference source must be independent of the extraction logic; never compare against the
`--dump-json` list.** That list and the pptx both come out of the same DOM extraction: anything the
extraction stage dropped (for example mixed "`<svg>` + bare text" content inside an element, which
has been lost wholesale) is missing on both sides, so the comparison necessarily passes — the
verification tool and the verified object share the same blind spot. `innerText` is the text the
browser itself rendered (already including `text-transform`), produced without going through any
extraction code, so only it can reveal a gap in extraction.
Exclusions: elements skipped by `--skip-class` get reported missing (expected); text inside
svg/canvas is exported as an image and is already excluded from the comparison.

---

## Fonts: the delivery font ≠ the layout font

Client specs often name a font you don't have locally (e.g. Microsoft YaHei, a commercial font
licensed with Windows). **Don't change the HTML's `font-family` for it** — with the font not
installed, previews and PDFs fall back, and **the layout falls apart on the spot** (in testing, a
whole line of numbers got pushed onto the next line).

Do it correctly by **splitting the two**:

- HTML / PDF typeset with fonts actually installed locally — what you see is what you get
- PPTX carries the font name from the client spec (their machines have it)

**The precondition for splitting them is that Chinese full-width glyphs are equal width** —
changing the font doesn't change the character count or wrap position of any line; the differences
show up only in Latin text and punctuation. Chinese-dominant copy can be split safely; Latin-dominant
copy needs separate verification.
