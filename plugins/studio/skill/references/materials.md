# Materials first: the frame's protagonist should not be only type and cards

If the material plain HTML/CSS can produce is nothing but "type + cards + tables + hairlines", the result will look monotonous in whatever style — this is the second root cause of the old version's monotony. This file settles two things: fix the protagonist material for each direction first; and tier work by what the user actually has, recommending an install for missing capabilities but never blocking on them.

## Principles

1. **Fix the protagonist material for each direction first**, and write it into the direction card (`references/directions.md`). Do not let all three directions be "pure typography"; when you use pure typography it must be deliberate typography — the type itself becomes the image (huge type, vertical setting, cropping), not the default heading-plus-body setting.
2. **Gather the images the content requires before designing**. For a design introducing animals, places, people, products or history, images are content, not decoration; a parrot website without a parrot = failure. When unsure, treat it as content-required.
3. **The real-image honesty test**: remove this image — is any information lost? No loss = decoration, do not add it. Do not pair stock "inspiration images" in.
4. **Do not hand-draw people, animals, physical objects or scenes in SVG** — the features come out misplaced and the proportions grotesque. Use real photography, generated imagery, or an honest placeholder. Geometry, icons, data charts and map linework are not in this category; silhouette masks are for composition only (cropping photos, making shapes) and must not stand in for product images.

**When it involves the user themselves or their product, real material comes first**: check `personal-asset-index.json` under the user's private memory / config directory first (on first use, copy `assets/personal-asset-index.example.json` there and fill in the real data; real data never lives in the skill directory, so it cannot leak with distribution). If you cannot find it, ask the user; do not invent.

## Probe capabilities first

```bash
# $HD = root directory of this skill (the directory containing SKILL.md), not the user's project directory
python3 "$HD/scripts/capabilities.py"
```

It checks which relevant skills are installed on this machine, whether there is an image-generation key, whether ffmpeg / playwright are present, and gives a tier plus install advice for whatever is missing. Not detecting something does not mean it is absent (Codex ships image_gen, for example); if the user says they have it, the user is right.

## Three tiers

### T0 · Every user has this (the default, no extra capability required)

- **Real photography**: `python3 "$HD/scripts/fetch_images.py" --query "English keywords" --out project/assets/img --count 2 --width 1600` (Wikimedia Commons, output with license). For the user's own product, get official images through the brand assets protocol.
- **Logos of named products**: take one for each recognizable product that appears in the design (svgl → simpleicons → favicon, see `references/brand-asset-protocol.md`). If one on the list was not obtained, go get it; only fall back to an honest placeholder with an explicit statement when it truly cannot be had.
- **Procedural material** (usable single-file, no fetch needed):
  - SVG filters: `feTurbulence` + `feDisplacementMap` for paper grain, noise, ink bleed, misregistered print
  - CSS: multi-layer `radial-gradient` for lighting and volume, `mask-image` / `clip-path` for silhouettes and cropping, `mix-blend-mode` for overprinting
  - canvas-generated imagery: contour lines, halftone dots, flow fields, star charts, woven texture (fixed random seed, so screenshots are reproducible)
  - Three.js (`<script src>` loaded from cdnjs, works under `file://`) for procedural geometry, material and lighting
- **Data as image**: make the numbers in the content the main visual — a scale spanning the whole page, objects scaled to proportion, a route on a map — not three big number cards
- **Simulated physical objects**: build tickets, labels, certificates, instruction sheets, postcards, newspaper pages in HTML, with paper, perforations, stamps, folds
- **Type as image**: oversized letterforms cropping out of the frame, vertical setting, letterforms interlocking with images

### T1 · Has AI image generation

Determination: an image-generation skill such as `huashu-gpt-image` or `nano-banana-pro` is installed on this machine, or the runtime you are in ships an image-generation tool (Codex's image_gen, say — you know whether you have it), or the user says so explicitly. An API key alone does not count: this skill has no script that calls an image-generation API directly.

- **Produce probe images at the direction-board stage**: generate one atmosphere or key-visual image per direction (material, light, subject), and put it in front of the user alongside the HTML first draft. Have a visual layer before writing code; the user is choosing "a look they can see".
- **After the choice, generate the key visual, illustrations, textures, people and scenes**. Write concrete visual characteristics and real reference names in the prompt, not adjectives like "premium feel" or "minimal" — method in `huashu-gpt-image`.
- Generated imagery must pass the real-image honesty test, and brand product images must be generated on the basis of official reference images, never invented from nothing.

### T2 · A sibling skill is installed

| skill | What more it enables | Public address |
|---|---|---|
| huashu-gpt-image | Image-generation prompt methodology; illustrations, posters, infographics, UI mockups | `npx skills add alchaincyf/huashu-gpt-image` |
| huashu-art-motion | 36 art and narration animation styles, spoken-word driven whole films | `npx skills add alchaincyf/huashu-art-motion` |
| huashu-md-html | md to publication-grade html / PDF / EPUB | `npx skills add alchaincyf/huashu-md-html` |
| huashu-3djs, huashu-flow-diagram | Procedural 3D scenes, architecture diagrams that flow | Not yet public; use them if installed here |

## What to say when a capability is missing

Do not block; drop to T0 and carry on, and tell the user in one sentence what more they could get:

> This version's key visual uses procedural paper grain + public-domain illustration. With huashu-gpt-image installed (`npx skills add alchaincyf/huashu-gpt-image`), the next project can generate the key visual and probe images directly.

Recommend only the one thing relevant to this task; do not list a catalogue to sell.

## Three-level fallback when fetching images fails

1. Not found in public-domain libraries → switch to Unsplash / Pexels
2. Nothing suitable anywhere on the web → if you have T1, generate on the basis of a reference image
3. Still nothing → continue with an honest placeholder "image to be added", and say so explicitly on delivery. A failed fetch is a degraded continue, not a stop
