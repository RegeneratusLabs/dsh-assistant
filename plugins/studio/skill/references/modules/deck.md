# Module · Slides / PPT / presentation

Slides, PPTs, pitch decks, courseware, reporting material all go here. Pass the narrow bridge in SKILL.md first (the three-direction gate, etc.), then work from this manual.

## Delivery chain (do not ask about format at the start)

HTML deck (the base artifact, always made first) → on completion, a PDF **automatically** → an editable PPTX only when the user asks.

- PDF: for the multi-file architecture use `scripts/export_deck_pdf.mjs`, for a single-file deck-stage use `scripts/export_deck_stage_pdf.mjs`. Text stays as searchable vector; hand it over without asking.
- PPTX has two routes; choose by the state of the HTML, do not mix them:
  - HTML not written yet → write it under the 4 hard constraints, then go through `scripts/export_deck_pptx.mjs` (which calls `html2pptx.js` internally) → `references/editable-pptx.md`
  - HTML already written and visually driven, or the client wants their own template carried over → `scripts/pptx_from_rendered.py`, which reads the rendered coordinates, zero rework → `references/pptx-from-rendered-html.md`. After export it automatically compares the page innerText and reports whether any text was lost
  - Never downgrade a design that is already written just to accommodate html2pptx's constraints — that is exactly why the second route exists

## Architecture (decide first; getting it wrong means hitting CSS scoping pitfalls over and over)

- **Default: multi-file + overview wall** (nearly every deck). One independent HTML per page (a 1920×1080 `<section>`), assembled with `assets/deck_index.html`: copy it as `index.html`, edit the MANIFEST and it works, **do not rewrite the overview logic** (the three pitfalls — skew, click hit-testing, cropping — are already solved inside). It ships two adaptive overviews (grid of iframes / infinite gallery; the gallery needs thumbnails generated first with `scripts/gen_deck_thumbs.mjs`), keyboard paging, zoom, unified page numbers, and print merging.
- **Single file**: use it only for a ≤5-page minimalist pitch, when an overview wall is explicitly not needed, or when JS state must be shared across pages — with `assets/deck_stage.js`. The script must come after `</deck-stage>`, and a section's `display: flex` must be written on `.active`.
- Before choosing single-file, confirm "it really is ≤5 pages and does not need an overview wall" — a 13-page deck that went single-file and lost the overview wall is a pitfall we hit for real.

For details, directory structure, page skeleton and what goes in tokens: the "decide the architecture first" section of `references/slide-decks.md`.

## The order of work

1. Three directions: each direction produces **2 representative pages** (the two whose visual structures differ most, such as the cover + a data page), which double as the showcase. The deck shell is unified across the three versions; only the visuals change.
2. After the user chooses, for decks of ≥5 pages first fix the 2 showcase pages as the grammar in the chosen direction, then batch the remaining pages. Skipping this step = reworking N pages instead of 2 when the direction is wrong.
3. Each page answers the five form questions first (see `references/workflow.md`), especially "narrative role": cover, transition, data, quote, close — one role per page, and the layout changes with it.
4. When everything is done, assemble `index.html` and produce the PDF.

## Hard rules

- **A page never carries its own page number or progress marker**; page numbers are carried by the shell alone (we have really hit two page-number sets fighting each other, "02/03" and "6/16")
- Body text ≥24px, labels and notes ≥16px, headings 60–120px (full type scale in `references/content-guidelines.md`, "Scale spec")
- Fixed-size content implements its own scaling + letterbox (the shell already does)
- Playback position is stored in localStorage so a refresh does not lose it
- Health-check with the deck's type floor: `python3 "$HD/scripts/design_lint.py" check slides/*.html --viewport 1920x1080 --min-body 24 --min-label 16`. A single-file deck-stage can only health-check the page currently shown, which is one more reason the default is multi-file

## Do not default data pages to "three big numbers + a bar chart"

That is the template answer for a deck data page; it looks the same in any style. Ask first what relationship this set of numbers is about: proportion (objects scaled to proportion), change (one narrative curve), composition (a whole taken apart), comparison (side-by-side), scale (one oversized object). The data itself can be the protagonist material of the page (`references/materials.md`).

## Related files

| What you want to do | Read |
|---|---|
| Architecture, directory, single-page skeleton, common pitfalls | `references/slide-decks.md` |
| Editable PPTX · route A | `references/editable-pptx.md` + `scripts/html2pptx.js` |
| Editable PPTX · route B (an already-written visual draft / the client's template) | `references/pptx-from-rendered-html.md` + `scripts/pptx_from_rendered.py` |
| Speaker notes, Tweaks parameter tuning | `references/slide-decks.md`, `references/tweaks-system.md` |
| Style library and specimens (the PPT section of the seconds roulette, plus the cross-medium Chinese and East Asian section) | `references/design-styles.md` |
