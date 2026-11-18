# Typography: the typesetting inference system

> **This is not a font list, it is the inference rules for pairing and setting type.** `design-styles.md` already gives the font names for 92 styles; this file answers "why pair it this way" and "given arbitrary content, how do I derive size/measure/weight". Goal: the same style label, applied to different content, derives different typographic results — not the same size scale copied every time.
>
> The upstream discipline is unchanged: if there is a design context, lift the user's own fonts first (see `design-context.md`); everything here only kicks in when "the user has no type spec".

## 0. Typesetting decision order

Once you have the content, reason in this order. Each step is decided by the previous one; do not jump to "just pick a good-looking font":

1. **Content type** → long-form reading / data dense / marketing display / UI, decides the scale ratio and body size
2. **Language composition** → Chinese only / mixed Chinese-Western / Western only, decides the fallback chain and the line-height baseline
3. **Style temperature** (aligned to `design-styles.md`'s three tiers: quiet / neutral / bold) → decides where the contrast in the pairing comes from
4. **Only then the font names** → pick from the pairing table in chapter 3 below, or take the entry from the style library

Why: choosing font names first makes "what the content is" have zero effect on the typography — that is exactly the root of everyone looking the same.

## 1. Size scale (modular scale)

Sizes are not gut feelings; they are derived step by step from the body size times a fixed ratio. The ratio decides the page's "drama":

| Ratio | Name | Character | Use for |
|------|------|------|------|
| 1.2 | minor third | calm, many levels without noise | dashboards, docs sites, information-dense UI |
| 1.25 | major third | general purpose, safe | most web pages, product landing pages |
| 1.333 | perfect fourth | headings clearly jump out | editorial long-form, marketing pages, reports |
| 1.5 | perfect fifth | dramatic, very few levels | poster type, slides, hero one-line-per-screen |

**Derivation rule**: set body at 16-18px (for Chinese body text prefer 17-18px — Han characters have dense strokes and look tighter than Western text at the same size), then push headings up and captions down by the ratio. More than 5 levels is out of control — cut them.

| Level | Reference values at ratio 1.25 | Use |
|------|--------------------|------|
| caption | 12-13px | captions, meta info, EXIF-style small print |
| small | 14px | supporting notes, tables |
| body | 16-18px | body text, the baseline for everything |
| h3 | ≈1.25x | subsection heading |
| h2 | ≈1.56x | section heading |
| h1 | ≈1.95x | page title |
| display | 3x-8x, off-scale and free | hero display type, decided by the composition, not the scale |

**Fluid size syntax** (mandatory for the display level; keeps big screens from looking dead and small screens from overflowing):

```css
/* clamp(min, preferred, max): preferred = base rem + viewport factor */
h1 { font-size: clamp(2rem, 1.2rem + 3.5vw, 4.5rem); }
.display { font-size: clamp(3rem, 1rem + 9vw, 9rem); }
/* do not let body text clamp through a wide range; a narrow 16→18 band is enough */
body { font-size: clamp(1rem, 0.95rem + 0.3vw, 1.125rem); }
```

Why display goes off-scale: hero display type is a composition element, not a text level; its size is decided by "what fraction of the viewport it takes", so deriving it from vw is more sensible than deriving it from the scale.

## 2. Measure and line height

### Measure (affects readability more than font choice)

| Language | Comfort zone | CSS |
|------|--------|----------|
| Western body | 45-75 characters, 66 optimal | `max-width: 65ch` |
| Chinese body | 22-38 characters per line, 28-32 optimal | `max-width: 36em` (em scales with the size) |
| Captions / sidebars | shorter, 15-20 characters for Chinese | narrow containers constrain it naturally |

Why Chinese is shorter: Han characters are dense, gapless square blocks, so the same width carries clearly more information than Western text; the same number of saccades reads more content in Chinese, and when the line is too long the eye cannot find the start of the next line on the return sweep.

### Line height moves with measure

Line height is not a constant, it is a function of measure. The longer the line, the further the eye travels back, and the more leading is needed as a "track":

| Case | Western | Chinese |
|------|------|------|
| display type (1-2 lines) | 0.95-1.1 | 1.1-1.25 |
| headings (h1-h3) | 1.1-1.3 | 1.3-1.4 |
| short-measure body (<30 chars/line) | 1.4-1.5 | 1.6-1.7 |
| long-measure body (near the limit) | 1.6 | 1.8-2.0 |

Chinese runs about 0.2 higher across the board: Han characters fill their em box and there are no natural gaps between lowercase letters like in Western text, so insufficient leading muddies into a solid block.

### text-wrap (supported by all 2024+ browsers, free typographic quality)

```css
h1, h2, h3 { text-wrap: balance; }  /* balances line lengths in multi-line headings, kills orphans */
p { text-wrap: pretty; }            /* kills widows at line ends (obvious in Western text, mild in Chinese) */
```

Use balance only on headings of ≤4 lines (the algorithm caps at 6 lines and has a perf cost); pretty is safe to apply to all body text.

## 3. Ten open-source font pairings (Western)

The three sources of pairing contrast — decide which one you are using before you pair:

- **Formal contrast**: serif display x sans body (the most classic, but the x-heights must mesh or the optical size jumps)
- **Same-family meshing**: a superfamily on one design skeleton (zero risk, the price is blandness)
- **Period contrast**: classical letterforms x modern letterforms (only has tension when the lineages are 200+ years apart; 50 years apart just looks messy)

| # | Pairing (display + body) | Pairing logic | Temperature | Where to get it |
|---|------------------------|----------|------|------|
| 1 | Newsreader + Geist | Formal contrast: a screen-optimized transitional serif, high x-height, meshes well with Geist; **the legitimate stand-in for Fraunces** | quiet | Google Fonts / Vercel's official repo |
| 2 | Source Serif 4 + Source Sans 3 | Same-family meshing: Adobe's shared design system, cap heights and weight rhythm fully aligned, zero failures on reports and docs | quiet | Google Fonts |
| 3 | EB Garamond + IBM Plex Sans | Period contrast: a 16th-century French old-style serif x a 2017 rational grotesque, 400 years of tension; note Garamond's low x-height — when mixing on the same line compensate the size (+8% is an empirical start; the systematic fix is `font-size-adjust`, see chapter 4) | quiet · literary | Google Fonts |
| 4 | Lora + Hanken Grotesk | Formal contrast: Lora is a brushy serif with moderate contrast, holds up on screen; Hanken is an open-source close relative of Söhne's temperament | neutral | Google Fonts |
| 5 | Instrument Serif + Geist | Formal contrast: only one weight, 400, inherently display-only — body must go to a sans. ⚠️ on its way to being run into the ground by AI tools; in 2026 use with care for "I want to look distinctive" occasions | neutral | Google Fonts |
| 6 | Schibsted Grotesk + Source Serif 4 | Inverted structure: grotesque as display, serif as body, editorial feel; **the stand-in after Space Grotesk got saturated** (custom open-source for Norway's Schibsted media group, news pedigree) | neutral | Google Fonts |
| 7 | Bricolage Grotesque + Newsreader | Formal contrast: Bricolage's ink traps and irregular details only show at large sizes — inherently display; paired with a quiet serif body it makes rough x refined | bold | Google Fonts |
| 8 | Archivo (Expanded/Black) + Inter | Poster structure: Archivo wide and black carries the frame, Inter is only the 14-16px body worker bee (this is Inter's correct use, see anti-patterns) | bold | Google Fonts |
| 9 | Cormorant Garamond + Work Sans | High-contrast luxury: Cormorant's strokes are extremely thin, **only works ≥40px**, strokes break at small sizes; suits fashion / space-catalogue styles | bold | Google Fonts |
| 10 | Geist Mono / JetBrains Mono + Geist | Monospace as the lead: command-line feel, engineering feel; monospace only for labels/numbers/code — setting whole paragraphs in mono is a disaster (measure inflates 30%) | neutral · technical | Vercel / JetBrains official, both OFL |

**The overused list** (single typefaces AI tools have run into the ground; a stand-in is usually better):

| Overused | Why it is worn out | Stand-in |
|--------|----------|------|
| Fraunces as display | 2023-2025 default "tasteful" choice of every AI design tool | Newsreader, Libre Caslon Text |
| Inter as display | Inter was designed for small UI text; at large sizes it is uniform and expressionless | Archivo, Anton, Schibsted Grotesk |
| Space Grotesk | the lazy answer to "tech feel", everywhere on crypto/AI landing pages | Schibsted Grotesk, Familjen Grotesk |
| Playfair Display | the lazy answer to "elegant", wedding-invitation déjà vu | Cormorant (more extreme), DM Serif Display (more dowdy) |

The **combination** "high-contrast serif × warm cream ground" is not on the list: that is a look family, not a worn-out typeface. You may use it — just do not crowd all three directions into it and do not use it on every project. That is the look ledger's job (`references/content-guidelines.md`).

## 4. Chinese typography (the heaviest chapter in this file)

Western typography has a century of mature tooling; Chinese does not. AI design tools collectively phone it in on Chinese (default to system fonts, apply Western rules directly) — this is where the differentiation is.

### 4.1 Map of open-source / free-for-commercial-use Chinese typefaces

| Typeface | Category | Temperament | Temperature | Where to get it |
|------|------|------|------|------|
| 思源宋体（Noto Serif SC） | Song | publishing orthodoxy, all 7 weights, Heavy works as display | quiet-neutral | Google Fonts, OFL |
| 思源黑体（Noto Sans SC） | Hei | the Inter of Chinese: reliable, expressionless; fine as the default body but no personality | all-temperature fallback | Google Fonts, OFL |
| 霞鹜文楷 | Kai | handwritten warmth, friendly; suits literary / educational / personal-blog body and pull quotes | quiet · warm | GitHub lxgw/LxgwWenKai, OFL |
| 霞鹜新晰黑 | Hei | a leaner, airier screen Hei than Source Han Sans, comfortable over long reading | quiet | GitHub lxgw/LxgwNeoXiHei |
| 得意黑 Smiley Sans | oblique Hei | **the rare native italic in the Chinese world**, sporty, headings only; body text in it makes you dizzy | bold | GitHub atelier-anchor/smiley-sans, OFL |
| 汇文明朝体 | old-style Ming | old letterpress flavor, retro publishing; suits book covers / cultural display | neutral-bold · retro | 猫啃网/GitHub, free for commercial use |
| 京华老宋体 | old Song | square-shouldered heading Song, masthead feel | bold · retro | 猫啃网, free for commercial use |
| 源流明体/源样明体 | Ming (Traditional-leaning) | re-cut from Source Han Serif, keeps traditional letterform details; first choice for Traditional Chinese content | quiet · classical | GitHub ButTaiwan, OFL |
| 未来荧黑 Glow Sans | geometric Hei | modern geometric Hei derived from Source Han Sans, multiple widths (Compressed makes a narrow elongated display) | neutral-bold · modern | GitHub welai/glow-sans, OFL |
| MiSans / HarmonyOS Sans / OPPO Sans | vendor UI Hei | UI Hei with a bit more character than Source Han Sans; good for app prototypes | neutral | vendor sites, free for commercial use |

Selection reasoning: **choose body text only among Song / Hei / Kai** (the rest are display faces; setting a whole paragraph in them tires the reader); only reach for Smiley Sans / 京华老宋体 / Ming when display wants personality. One Chinese typeface weighs as much as ten Western ones (5-15MB per file), so at most two Chinese families per page — for loading and for consistency.

### 4.2 Mixed Chinese-Western setting

**The fallback chain is the first lever**: Chinese typefaces' own Latin glyphs are generally ugly (Source Han Sans's Latin letters are stiff); put the Western face first so Latin characters and digits are caught by it and Han characters fall through to the Chinese face behind:

```css
/* Western first, Chinese after, system Chinese as backstop, generic last */
font-family: "Geist", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
/* same for serif (font names are examples; choose from the pairing table and the subject) */
font-family: "Source Serif 4", "Noto Serif SC", "Songti SC", serif;
```

Why this order: font-family matches per character, the Western face has no CJK codepoints, so Han characters naturally fall through to the Chinese face. Written the other way round (Chinese first) Latin characters get eaten by the Chinese face and the pairing was for nothing.

**Size compensation**: at the same size Western lowercase looks optically smaller (x-height fills only half the em, Han characters fill it all). Two fixes:

```css
/* fix one: font-size-adjust normalizes the fallback faces by x-height (Chrome 127+/FF/Safari 17+) */
:root { font-size-adjust: from-font; }
/* fix two: pick Western faces with a high x-height (Geist/Inter/Source Sans are all high), mixed setting lines up naturally */
```

**Baseline alignment**: when Chinese and Western baselines disagree the symptom is English words "sinking" in a Chinese line. Prefer swapping to a Western face with a higher x-height; in some display cases nudge the Western span with `vertical-align: -0.02em~-0.06em` — do not do this in body text (maintenance cost outweighs the gain).

**Number rules**: digits always go through the Western face (the fallback chain already guarantees it); data tables must add `font-variant-numeric: tabular-nums`, otherwise 1 and 8 have different widths and columns wobble.

**No space between Chinese and English**: this is the repo's rule (the studio explicitly does not use Pangu spacing) — rely on the fonts in the fallback chain providing their own side bearings, not on manually typed spaces.

### 4.3 Chinese has no italics

Chinese letterforms have no italic tradition; when a browser meets `font-style: italic` it mechanically slants Han characters (faux italic) — strokes deform, it is extremely ugly. Replacement table for emphasis:

| Western habit | Chinese substitute | CSS |
|----------|----------|-----|
| italic emphasis | change the weight | `font-weight: 600` (precondition: the face really has that weight) |
| italic for titles/quotes | highlight the ground | `background: linear-gradient(transparent 60%, #FFE9A8 60%)` highlighter style |
| italic quote block | change the typeface | set the whole quote in 霞鹜文楷 — Kai is the Chinese "quotation voice" |
| italic for proper names | color / emphasis marks | `text-emphasis: dot` (emphasis dots, native Chinese emphasis, support is usable now) |

The fuse: `font-synthesis: none;` globally disables synthesized italic and synthesized bold — better to skip the emphasis than accept deformed letterforms.

### 4.4 Punctuation rules

| Rule | Practice | Why |
|------|------|--------|
| Quotes | corner brackets 「」『』, never curly double quotes | curly quotes occupy a full-width slot in Chinese fonts but are Western-shaped, so they float optically; 「」 is this repo's hard rule |
| Kinsoku (no-start/no-end) | `line-break: strict;` | forbid periods and commas at line start and opening quotes at line end — this is the Chinese typesetting floor |
| Hanging punctuation | `hanging-punctuation: first allow-end;` (Safari only); cross-browser use `text-indent: -0.5em` to handle an opening quote at paragraph start | an unhung opening quote at paragraph start makes the first line look indented by half a slot, so the optical left edge is ragged |
| Consecutive punctuation compression | `font-feature-settings: "halt";` (end-of-line squeeze) or `"palt"` (proportional width, needs letter-spacing alongside) | consecutive full-width punctuation (e.g. 「）。」) leaves a half-character hole; halt narrows it |

### 4.5 Chinese letter-spacing ranges

| Case | Range | Why |
|------|------|--------|
| body | 0 to 0.05em | a touch of tracking adds air; beyond 0.05em word shapes break apart and reading speed drops |
| headings (24-48px) | 0 | Han character spacing is naturally even, no Western-style tracking adjustment needed |
| display type (>60px) | -0.02em to 0 | at large sizes the gaps between glyphs get amplified, so slight tightening reads tighter; go more negative and strokes collide |
| all-caps Western small labels | 0.08-0.15em | the only case that needs wide positive tracking, and it only applies to Western capitals |

**Never apply the Western "display tightens -0.05em" rule to Chinese**: Han characters are designed to fill the em box, so negative tracking makes strokes fight directly.

### 4.6 Chinese display type

Chinese has no Western-style display ecosystem running from Ultra Thin to Black; the drama of large type has to be manufactured by reasoning:

- **Weight contrast is the main weapon**: 思源宋 Heavy 900 against Light 300 — two extremes of the same face on one screen has more tension than swapping typefaces and costs nothing to load
- **Stroke density sets the lower size limit**: faces with thin strokes / high contrast (Song's thin horizontals, Cormorant-like) only hold at large sizes; below 24px thin strokes start breaking, so body text must go back to Hei / medium strokes
- **The reverse also holds**: heavy-stroke faces (Hei Black, 老宋) put down too much ink at huge sizes — the ink-mass difference between 「一」 and 「灥」 gets amplified; for titles with uneven density consider dropping one weight
- **Vertical setting is a display weapon unique to Chinese**: `writing-mode: vertical-rl` for spine-style titles, poetry, tables of contents — Western type cannot do it; note that Western text and digits in vertical setting need `text-orientation: upright` or `text-combine-upright: all` (two-digit numbers combined and set upright)

## 5. Anti-pattern list

| ❌ Anti-pattern | Why it is wrong |
|-----------|----------|
| Inter everywhere (display+body in one go) | Inter is a small-UI tool; as display it is uniform and expressionless — this is the number one fingerprint of "AI-generated page" |
| Leaving Chinese to the `sans-serif` system default | Windows lands on 中易宋体/雅黑, macOS on PingFang — the same page has two completely different faces across devices, i.e. no design was done |
| faux italic / faux bold | browser synthesis deforms: italic distorts Han characters, synthesized bold smears strokes into ink blobs; kill it at the root with `font-synthesis: none` |
| tracking too loose on big headlines | Western display needs tightening (gaps get amplified at large sizes); AI often does the opposite and adds +0.05em, so the headline goes slack like temporary placeholder text |
| runaway measure (no max-width) | 60 Han characters per line on a big screen and the reader will get lost on the return sweep; runaway measure is the top readability problem, more damaging than the wrong font |
| more than 6 size levels | the hierarchy devalues and readers cannot tell what matters; the point of a scale is enforced restraint |
| only 400/700 weights | the hierarchy leans entirely on size and the page goes flat; in the variable-font era 300-900 are all free dimensions of expression |
| tables/data without tabular-nums | digits have unequal widths, columns jitter left and right, and the data's credibility is discounted on sight |
| setting Chinese body in a display face (whole paragraphs of Smiley Sans / 老宋) | a display face's personality becomes reading friction in body text; after 200 characters it tires you out |
| putting the Chinese face first in the fallback chain for mixed setting | Latin characters all get eaten by the Chinese face's ugly Latin glyphs and the well-paired Western face never gets to appear |

## 6. CSS implementation notes

```css
:root {
  /* 1. fallback chain: Western → Chinese → system Chinese → generic (the order is the rule, see 4.2) */
  --font-body: "Geist", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-display: "<choose for this subject from the pairing table>", "Noto Serif SC", "Songti SC", serif;  /* do not default to a serif */

  /* 2. no synthesis: do not accept browser-faked italic/bold (mandatory for Chinese) */
  font-synthesis: none;

  /* 3. Chinese line-breaking floor */
  line-break: strict;        /* kinsoku */
  overflow-wrap: break-word; /* long URLs/English strings do not blow out the container */
}

body {
  font-family: var(--font-body);
  font-size: 17px;           /* Chinese body baseline, see chapter 1 */
  line-height: 1.8;          /* Chinese line-height baseline, see chapter 2 */
  /* standard ligatures on for body text, fancy features off */
  font-feature-settings: "liga" 1, "calt" 1;
}

/* data cases: tabular figures + slashed zero (0 and O do not get confused) */
.data, table { font-variant-numeric: tabular-nums slashed-zero; }

/* Western small labels: the only legitimate case for all caps + wide tracking */
.label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; }

/* punctuation compression: narrow the holes from full-width punctuation in Chinese display type */
.display-cjk { font-feature-settings: "halt" 1; }
```

**Loading Chinese typefaces** (5-15MB per file; linking the full file destroys first paint):

- prefer Google Fonts' Noto SC family (already auto-sliced into hundreds of shards by unicode-range, the browser downloads only the characters used)
- self-hosting a personality face (霞鹜/得意黑 etc.) requires subsetting first: `cn-font-split` or fonttools' `pyftsubset` — subset body faces by the 3500 common characters, subset display faces by the characters that actually appear (a poster often has only 20 characters, so the subset compresses under 50KB)
- `font-display: swap` as the floor; Chinese fonts download slowly and a blank screen waiting for a font is the worst experience
