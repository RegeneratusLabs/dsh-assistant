# Module · Infographic / data visualization / long image

One image, or one set of images, where data or knowledge is the protagonist and it can be read standalone without interaction, goes here: infographics, data-report illustrations, single vertical long images, poster-style explainers. The 3:4 multi-image swiped-through image-text posts of the Xiaohongshu kind go to `xiaohongshu.md`. Pass the narrow bridge in SKILL.md first, then work from this manual.

## Fix the viewing distance and container first

- Seen in a phone feed (Xiaohongshu, WeChat Moments): 1080 wide, and the first screen (about 1080×1350) must hold up on its own — headline, key visual, one strongest number
- Print or big screen: fix the physical size and viewing distance first, then the type sizes
- Embedded in an article: follow the body text width, and text inside the image is no smaller than the body text

## Data is the protagonist, not decoration

- **Use only numbers the user gave or that can be verified**; a schematic must be labeled "schematic" on the image. Inventing a number that looks like data is ten times worse than leaving it blank
- Ask first what relationship this set of numbers is about, then choose the form: proportion → objects or areas scaled to proportion; change → one curve or a timeline; route and space → a map; composition → a whole taken apart; scale → one oversized object next to a familiar reference
- One color carries one meaning only, and the legend is written on the image
- For protagonist material prefer real photography, public-domain scientific illustration and maps (`references/materials.md`), not a platter of icons

## The order of work

1. Three directions: one complete HTML per direction, captured as a full-page long image at the target width (`references/directions.md`). The three versions' skeletons must differ (a map, a timeline, a field guide, a single colossal object, a narrative sequence are all valid structures), but do not force a metaphor just to differ.
2. After the choice, fill in the full content and proofread every number and unit
3. Export: `npx playwright screenshot --full-page --viewport-size=1080,1350 file:///… out.png`; if it goes to a platform, slice it to that platform's specs

## Health check

```bash
# $HD = root directory of this skill (the directory containing SKILL.md), not the user's project directory
python3 "$HD/scripts/design_lint.py" check info.html --viewport 1080x1350 --min-body 36 --min-label 28
```

The smallest type in the image is computed at the final display size: a 1080-wide long image shrinks to roughly 390pt wide on a phone (about 2.8×), so body ≥36px and labels ≥28px on the canvas are what becomes 13–14pt on a phone screen. For print or big screens, compute separately from the actual viewing distance.

## Related files

| What you want to do | Read |
|---|---|
| Style library and specimens (the infographic section of the seconds roulette, plus the cross-medium Chinese and East Asian section) | `references/design-styles.md` |
| Quick specs for covers, in-body illustrations, long images | `references/scene-templates.md` |
| Typefaces and Chinese typesetting | `references/typography.md` |
