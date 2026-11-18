# Steady track: when you are not sure, start from something already done well

This track is for three situations:

- What you built does not hold up when you look at it — the thumbnail check failed, `design_lint.py` red lights are still there after two rounds of fixes, or the polish loop shows the whole page is mediocre
- The runtime is constrained — no image-viewing ability, tight context, a lightweight model
- Time is very tight and you need to protect the floor first

There is only one idea: **do not start from a blank page; every step starts by modifying something already done well.** What you build on this track will not be the most striking, but it will not be the obvious draft of "beige ground, three cards, a hundred lines of HTML" either.
The three-direction gate, the brand assets protocol and the readability floor apply as usual; the track only changes "how you make it". Once things are going well you can leave the track at any time and use your own judgment.

## 1 · The six candidates come from specimens

Every style in `assets/style-specimens/` has a specimen done properly: a `.jpg` and a `.html` source of the same name (one screen, 1200×750).

1. Use your image-viewing ability to open the overview sheet for the relevant section, `sheet-<web|ppt|info|app|xhs>.jpg`, and the cross-medium `sheet-east.jpg`.
2. Three logics as usual, two candidates each, but every candidate lands on a specimen:
   - Seconds roulette ×2: draw two by the method in `references/directions.md`
   - Best designer ×2: once you have two designers in mind, find the specimen whose character is closest to each as a starting point (write on the card "designer so-and-so, starting from specimen NN")
   - Real-world reference ×2: if you captured an image of the reference work, decompose its rules from the image; if you could not capture it, start from the specimen with the closest layout and write honestly on the card "not seen with my own eyes, specimen NN stands in for it"
3. The six specimens must differ from each other: do not pick six dark ones, and do not pick six that are all big type.

## 2 · Thumbnails: turn the specimen into this project

Do this for each thumbnail cell:

1. Read that specimen's `.html` source, move its `<style>` and body structure into one cell of the thumbnail grid (the specimen is one 1200×750 screen; wrap the outside in `transform: scale(0.4)` to fit the cell; give each cell's container `data-thumb="1"`…`"6"`; class names from different specimens will collide, so prefix each cell's selectors with its own).
2. Change three things, and none of them may keep the specimen's original:
   - **Type**: replace it with this project's real headlines and real content. The subject matter and numbers in a specimen are fictional.
   - **Color**: follow the color-derivation protocol in `references/design-styles.md`, sample color anew from this subject matter (its materials, place of origin, objects, the dominant colors in real photography), and replace the specimen's color values.
   - **Hero graphic**: replace the specimen's main visual (a planet, a record, a mountain) with something from this subject's world.
3. What stays is the specimen's skeleton, type-size relationships and character.

Then run `python3 "$HD/scripts/polish.py" thumbs design-demos/thumbs.html` and only pick three once there is no ✗.

## 3 · The full page: write the screen-by-screen script before you write code

A specimen is only the first screen. The most common failure is that the first screen has design and everything below it is "a small label line + one big line of type" or "a small heading + three identical cards" repeated to the end.
The cure is to write a screen-by-screen script before writing code, saved as `screens.md` in the project, one per direction:

| Screen | Which piece of content | In what form | This screen's protagonist |
|---|---|---|---|
| 1 | One-line positioning | Hero (from the specimen skeleton) | A cross-section of four altitude bands |
| 2 | Why build it | Long story passage | The word "cloudy" set huge, and the thunderstorm on the ridge |
| 3 | How it is made | Before/after comparison | 9 km per grid cell versus 1 km per grid cell |
| … | | | |

Three rules: every piece of content the user gave must land on some screen; **two adjacent screens must not use the same form**; each screen's protagonist must be writable (if you cannot write it, that screen is not designed yet).

Pick forms from the menu below, by content, not in order:

| Form | What it suits | How to do it, in one sentence |
|---|---|---|
| Product interface + annotations | What a feature looks like | Draw the interface, pull two or three notes off it with thin lines |
| Playable demo | The product's core mechanism | A slider, a set of toggles, a drag; move it and the frame follows |
| Data as image | One key number or one set of numbers | Draw the number as a scale, an area, a length, a density — not as a number card |
| Before/after comparison | How it was, how it is now | Two structurally identical frames side by side or stacked, differing in exactly one place |
| Cross-section or map | Space, hierarchy, route | One image spanning the full width, labels placed on the image |
| Timeline | A process, 48 hours, the rhythm of one day | A horizontal scale with events hung on it |
| Statement in huge type | The single most important sentence | One sentence per screen, large enough to become the image |
| Long story passage | The origin, who the author is | Narrow column, generous leading, like a book page, plus one image or one year |
| Image/text spread | One feature explained at length | Half image, half text; swap the sides for the next feature |
| List or spec table | Coverage, parameters, platforms | A hairline table or a two-column list, no cards |
| Price comparison | Free and paid | Two columns side by side, differences aligned row by row |
| Action close | Download, contact | One action, whitespace around it |

Using five or six forms on a landing page is normal. Write the screen script first, then start on the HTML, screen by screen, each screen continuing the type scale (4–5 levels), colors, lines and spacing rhythm the hero established.

Check a landing page item by item:

- [ ] Hero: one sentence, hero material, one primary action
- [ ] **The product is visible**: introducing an app means drawing the interface (`assets/ios_frame.jsx`, or a hand-written simplified interface filled with the real content the user gave); introducing a data product means drawing the data as an image. A page that only describes the product in words is not done
- [ ] The screen script `screens.md` is written, and the page matches it
- [ ] Each feature is told in a different form: one product interface with annotations, one full-bleed chart, one playable demo — not three identical cards side by side
- [ ] The origin or the story gets a screen to itself, in large type or an image
- [ ] Every piece of content the user gave is on the page; no data, praise or logo you made up for them
- [ ] Every screen has at least one graphic or one piece of large type (`polish.py shot` reports "several consecutive screens of nothing but text and boxes")
- [ ] It does not break at 390px phone width, and type is not smaller than 16px
- [ ] Thickness: a complete landing page's HTML is usually over 400 lines. Only about a hundred lines usually means only the skeleton was built

The matching checklist for decks is in `references/modules/deck.md`, Xiaohongshu image-text posts start from templates anyway (`references/modules/xiaohongshu.md`), and for app prototypes see `references/app-prototype.md`.

## 4 · Safe choices for color and type

- Color: 2–3 chromatic colors plus one set of neutrals, all sampled from the subject matter, with one sentence on "why this color". If you cannot write that sentence, you are copying a recipe.
- Type: choose one pairing from the table in `references/typography.md`, one for headings and one for body, no third.
- When unsure, err toward stronger contrast: headings and body at least 2.5× apart in size is safer than "everything is about the same size".

## 5 · Before handing over

```bash
python3 "$HD/scripts/polish.py" shot <page.html> --mobile     # look screen by screen; without image-viewing ability, check against the list above and the facts it prints
python3 "$HD/scripts/design_lint.py" check <page.html>         # red lights must be fixed, yellow lights deleted
```

Run the polish loop as described in `references/polish-loop.md`. When delivering, state honestly which steps followed the track and which did not (for example "no visual polish pass").
