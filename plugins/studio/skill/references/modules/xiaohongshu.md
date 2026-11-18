# Module · Xiaohongshu image-text / cover / carousel

A set of near-3:4 vertical images that readers swipe through left and right on Xiaohongshu, including the case where you only make one cover (the header image). In the two-column feed the first image is squeezed in next to everyone else's covers and decides whether anyone taps in; each image after it is a page. Pass the narrow bridge in SKILL.md first, then work from this manual. For a single tall image where data is the protagonist, go to `infographic.md`.

## Specs

- Canvas 1242×1660 (Xiaohongshu's usual near-3:4; exact 3:4 is 1080×1440, also usable, with type sizes scaled proportionally). A post holds at most 18 images.
- Type-size floor (1242-wide canvas): body ≥42px, labels ≥32px, equal to 36/28 at 1080 width. In the feed a cover headline occupies only about a third of screen width, so it must be ≥100px and say everything within two lines.
- Design in the platform limits: no outbound links, QR codes, WeChat IDs or email addresses in the images; to direct people, write 「GitHub 搜 xxx」 ("search xxx on GitHub") or 「评论区说一声」 ("say so in the comments"); do not use absolutist claims such as 「最好」 (best), 「行业第一」 (industry leader) or 「唯一」 (the only one) (ordinals like "first step" or "first web page" do not count; rewrite a user's 「最值的一笔」 ("best-value purchase") as something concrete like 「值回票价的一笔」 ("it paid for itself")); if you used AI-generated imagery, make the content declaration the platform requires when publishing; if you used CC BY-type images, credit the author and license on the image or at the end of the body text.

## Pick a paradigm first (what the three-direction gate looks like here)

Three directions = three paradigms, each producing "a cover + one hardest inner page", shown side by side to the user as `xhs_render.py`'s sheet.jpg; if you are making only a cover, each direction produces one cover. Conceive the six candidates per `directions.md`, and let the seconds roulette draw from these 8 paradigms; the three versions you finally pick must land on three different paradigms. The paradigm pool is "Xiaohongshu image-text (8 kinds)" in `design-styles.md`, overview at `assets/style-specimens/sheet-xhs.jpg`.

| Content | Think of first |
|---|---|
| Your own product, and you want people to recognize it as yours at a glance | 02 sticker book (borrow the paper, controls and material of the product interface) |
| Can be laid out as one line: a set of objects, a timeline, a pipeline | 04 long scroll (several images join into one picture) |
| Nature, knowledge, cultural long-form; needs authority and a magazine feel | 01 specimen journal |
| Numeric conclusions, rankings, lists | 03 index, 08 infographic |
| An "event": a launch, a retrospective, a method write-up | 05 daily paper |
| One card per item, collectible: species, products, people, tools | 06 trading cards |
| Slow content, a story, a close-up of a single object | 07 whitespace |

A paradigm only gives the skeleton. Take colors from the content or the brand per the color-derivation protocol, use the user's own real material (`references/materials.md`), and the three directions must have different skeletons.

## Start from a template

The eight specimens double as templates: copy `$HD/assets/style-specimens/xhs/<number>.html` plus `_kit/xhs.css` and `_kit/xhs.js` into the project (put them under the project's `_kit/`, then the paths need no changes), change the text, swap the images, change the colors in `:root`. Opened in a 1200×750 browser window it lays the specimens side by side; any other width lays them out at real size.

- One page per `<section class="xhs-page">`; a continuous long scroll uses `<section class="xhs-strip" style="--n:3">`, 1242×N wide.
- `_kit/xhs.js`: `XHS.number(total images)` writes the page number (put `data-pageno="off"` on the cover); `XHS.wire()` draws a line continuous across images, `XHS.perch()` makes an object stand on the line, `XHS.straddle()` straddles an object across a given seam.
- `_kit/stickers/` and `birds.js` are bird stickers for demonstration, licensed PolyForm Shield, different from this repository's MIT: wherever a template references them, replace them with the user's own images and data, and do not carry them into the project.
- The templates link Google Fonts externally, with system fonts as a fallback in the stack; offline, deleting the `<link>` still lays out, only the letterforms change — glance at it before rendering.

## How to sequence a set

- Cover: one hook (a number, a conclusion, or a contrast) + one main visual, with a headline of eight to fourteen characters. Do not stuff a table of contents into the cover.
- The second image states "what this is"; each middle image covers one thing, one headline with one image; the last image lands on the next step (where to find it, how to use it, what to say in the comments).
- One system across the set: the same header, page numbers, colors and typefaces; adjacent images change composition (big image, list, numbers, comparison in rotation).
- Long scroll: the protagonist straddles the seam (about 2/3 visible in the left image, about 1/3 in the right), and only connects when swiped right; each image must also stand alone with a headline and make sense; draw continuous lines and horizons with the same function, do not draw a separate segment per image.

## Rendering and health checks

```bash
# $HD = root directory of this skill (the directory containing SKILL.md), not the user's project directory
python3 "$HD/scripts/xhs_render.py" notes.html --out images/ --jpg
```

The script renders `01.png`… page by page, slices long scrolls automatically, and then assembles a `sheet.jpg`. It checks: type below the floor, type running off the page, type crossing a seam in a long scroll, two blocks of text pressed on top of each other (these four are ✗, exit code 1); text covered by an image or color block, and text crowded against a small color block are !: either fix them or write in the delivery notes why they were kept. Add `data-overlap-ok` to deliberately overlapping elements. The general health check still runs as usual, but for vertical formats give it the full viewport: `design_lint.py check … --viewport 1242x1660 --min-body 42 --min-label 32` (`compare` and `ledger check` take `--viewport 1242x1660` the same way), and give long labels like credits and captions a class name containing `caption` or `credit` so the health check counts them as labels. No ✗ does not mean deliverable: the script cannot catch a layout collapse (a grid squeezed into one column, a chart that never got drawn), so open each png at full size and look, then look at the sheet.jpg: an orphaned last-line character in a headline, a bottom-of-page component colliding with the page number, a body text of only one line slipping past on the label floor, and whether the whole set's rhythm is the same on every image.

## Pitfalls hit before

- With high-contrast serifs like Bodoni below 100px, hairlines break on a phone and 4 reads as 1. Switch small numerals to a Song/serif or sans-serif face. In the feed the cover is scaled down again to about a third, so count high-contrast numerals on the cover at ≥200px.
- Cards and number bars at the bottom of a page are the most likely to collide with the page number and footer; check the last image especially.
- Specimen mode is globally scaled, so measure widths in scripts with `offsetWidth`, not `getBoundingClientRect()`, or a long scroll's line will only be drawn a third of the way.
- Do not use `top` or `name` as variable names in page scripts; they collide with browser globals and blank out the whole block without an error.
- If 32px type will not fit in a small cell, merge it into "the other N" or use an image only; do not shrink the type to cram it in.

## Related files

| What you want to do | Read |
|---|---|
| Descriptions and specimens for the eight paradigms | `references/design-styles.md` "Xiaohongshu image-text" + `assets/style-specimens/sheet-xhs.jpg` |
| Template source and shared parts | `assets/style-specimens/xhs/`, `assets/style-specimens/xhs/_kit/README.md` |
| A single data long image | `references/modules/infographic.md` |
| The cover needs generated imagery (not HTML layout) | `references/scene-templates.md` "Xiaohongshu illustrations" |
| Typefaces and Chinese typesetting | `references/typography.md` |
