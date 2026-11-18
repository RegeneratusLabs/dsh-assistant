# Core asset protocol (full version)

> The full version of SKILL.md's "Narrow bridge 2 · brand asset protocol". SKILL.md keeps the trigger conditions + the 5 step headings; here you get the detailed 5 steps, download commands, the brand-spec template, the end-to-end failure fallbacks, counter-examples and the cost comparison.
> Trigger: mandatory when the task involves a specific brand/product. Go back to SKILL.md for the condensed version and context.

#### 1.a Core asset protocol (mandatory when a specific brand is involved)

> **This is v1's most important constraint and the lifeline of consistency.** Whether the agent follows this protocol decides whether the output scores 40 or 90. Do not skip any step.
>
> **v1.1 rework (2026-04-20)**: upgraded from "brand asset protocol" to "core asset protocol". The earlier version over-focused on color values and fonts and missed the most basic things in design: the logo / product shots / UI screenshots. The studio's own words: "Beyond the so-called brand colors, obviously we should find and use DJI's logo, and use the Pocket 4 product shots. For non-physical products like a website or an app, the logo at minimum is mandatory. This may be a more basic logic than the so-called brand design spec. Otherwise, what are we even expressing?"

**Trigger condition**: the task involves a specific brand — the user names a product/company/an explicit client (Stripe, Linear, Anthropic, Notion, Lovart, DJI, their own company, etc.), regardless of whether the user proactively supplied brand material.

**Precondition (hard)**: before running the protocol you must have confirmed via "#0 fact verification precedes assumption" that the brand/product exists and its state is known. If you are still unsure whether the product has shipped, or about specs/version, go search first.

##### Core idea: assets > spec

**A brand's essence is "it gets recognized"**. Recognized by what? Ordered by recognition contribution:

| Asset type | Recognition contribution | Necessity |
|---|---|---|
| **Logo** | highest · any brand is recognized at a glance once the logo appears | **mandatory for any brand** |
| **Product shots / product renders** | very high · the "protagonist" of a physical product is the product itself | **mandatory for physical products (hardware/packaging/consumer goods)** |
| **UI screenshots / interface material** | very high · the "protagonist" of a digital product is its interface | **mandatory for digital products (app/website/SaaS)** |
| **Color values** | medium · supporting recognition; on their own they often clash with someone else | supporting |
| **Fonts** | low · only build recognition together with the above | supporting |
| **Temperament keywords** | low · for the agent's self-check | supporting |

**Translated into execution rules**:
- extracting only color values + fonts without finding the logo / product shots / UI → **violates this protocol**
- substituting CSS silhouettes / hand-drawn SVG for real product shots → **violates this protocol** (what gets generated is "generic tech animation", every brand looks the same)
- not telling the user the assets could not be found, not generating them either, and forcing it through → **violates this protocol**
- better to stop and ask the user for material than to fill in with generic content

##### The 5-step hard flow (every step has a fallback, never skipped silently)

##### Step 1 · Ask (get the whole asset list in one go)

Do not just ask "do you have brand guidelines?" — too broad, the user does not know what to hand over. Ask item by item against the list:

```
For <brand/product>, which of the following do you have? Ordered by priority:
1. Logo (SVG / high-res PNG) — required for any brand
2. Product shots / official renders — required for physical products (e.g. product photos of the DJI Pocket 4)
3. UI screenshots / interface material — required for digital products (e.g. screenshots of the app's main pages)
4. Color list (HEX / RGB / brand palette)
5. Font list (Display / Body)
6. Brand guidelines PDF / Figma design system / brand website link

Send whatever you have; for what is missing I will search / scrape / generate.
```

##### Step 2 · Search official channels (by asset type)

| Asset | Search path |
|---|---|
| **Logo** | `<brand>.com/brand` · `<brand>.com/press` · `<brand>.com/press-kit` · `brand.<brand>.com` · the inline SVG in the official site header |
| **Product shots/renders** | `<brand>.com/<product>` product detail page hero image + gallery · frames from the official YouTube launch film · images attached to official press releases |
| **UI screenshots** | App Store / Google Play product page screenshots · the official site's screenshots section · frames from the official product demo video |
| **Color values** | the official site's inline CSS / Tailwind config / brand guidelines PDF |
| **Fonts** | `<link rel="stylesheet">` references on the official site · Google Fonts lookups · brand guidelines |

`WebSearch` fallback keywords:
- Logo not found → `<brand> logo download SVG`, `<brand> press kit`
- Product shots not found → `<brand> <product> official renders`, `<brand> <product> product photography`
- UI not found → `<brand> app screenshots`, `<brand> dashboard UI`

##### Step 3 · Download assets · three fallback paths by type

**3.1 Logo (required for any brand)**

> ⚠️ **Do not try `curl <brand>.com/logo.svg` once and give up** — today's official sites are mostly SPAs, and direct static paths basically return an empty shell of HTML (measured 2026-06-06: all 5 direct paths on the Trae site returned empty shells). **For digital products / SaaS / AI tools prefer the icon aggregators** — highest hit rate, and they hand you a clean SVG directly.

In descending order of success rate:
0. **Icon aggregators (first choice for well-known digital products/SaaS/AI tools, highest hit rate)**:
   ```bash
   unset ALL_PROXY HTTP_PROXY HTTPS_PROXY all_proxy http_proxy https_proxy   # clear proxies, otherwise TLS breaks easily
   # svgl — the fullest AI/developer brand coverage (Claude/Cursor/OpenAI/Copilot/Anthropic/Vercel…), with light/dark + wordmark
   curl -s "https://api.svgl.app?search=<brand>"   # returns JSON; take the svg URL from route(.light/.dark) and download it
   # simpleicons — single-color glyph, can be colored with the brand color directly
   curl -o logo.svg "https://cdn.simpleicons.org/<slug>/<hexcolor>"
   ```
1. A standalone SVG/PNG file / the official brand page (e.g. `<brand>.com/brand`, `/press`):
   ```bash
   curl -A "Mozilla/5.0" -L -o assets/<brand>-brand/logo.svg "<official-logo-url>"
   ```
2. Extract the inline SVG from the official site's full HTML:
   ```bash
   curl -A "Mozilla/5.0" -L https://<brand>.com -o assets/<brand>-brand/homepage.html
   # then grep <svg>...</svg> to extract the logo node
   ```
3. **Google favicon service (a fallback for the site's real mark, almost never fails)**:
   ```bash
   curl -o logo.png "https://www.google.com/s2/favicons?domain=<brand-domain>&sz=256"   # 256px official site icon
   ```
4. The official social media avatar (last resort): GitHub/Twitter/LinkedIn company avatars are usually 400×400 or 800×800 transparent PNGs

After downloading, **check each one**: `file <logo>` to confirm it is a real SVG/PNG (not a 106-byte placeholder or an HTML shell), `head -c 90 <logo.svg>` to see whether it starts with `<svg`.

**3.2 Product shots/renders (required for physical products)**

In order of priority:
1. **The official product page hero image** (highest priority): right-click to inspect the image URL / fetch with curl. Resolution is usually 2000px+
2. **The official press kit**: `<brand>.com/press` often has high-res product shots to download
3. **Frames from the official launch video**: fetch the YouTube video with `yt-dlp`, pull a few high-res frames with ffmpeg
4. **Wikimedia Commons**: often has public-domain material
5. **AI generation as fallback** (nano-banana-pro): send the real product shot to the AI as reference and have it generate variants that fit the animation scene. **Do not substitute CSS/SVG hand-drawing**

```bash
# example: download DJI's official product hero image
curl -A "Mozilla/5.0" -L "<hero-image-url>" -o assets/<brand>-brand/product-hero.png
```

**3.3 UI screenshots (required for digital products)**

- App Store / Google Play product screenshots (note: these may be mockups rather than the real UI — compare them)
- the official site's screenshots section
- frames from the product demo video
- screenshots posted by the product's official Twitter/X (often the newest version)
- when the user has an account, screenshot the real product interface directly

**3.4 · The "5-10-2-8" material quality bar (iron rule)**

> **The logo follows different rules from other material**. If a logo exists it must be used (if not, stop and ask the user); other material (product shots/UI/reference images/supporting images) follows the "5-10-2-8" quality bar.
>
> The studio's words on 2026-04-20: "Our rule is: search 5 rounds, find 10 assets, choose 2 good ones. Each must score 8/10 or better — better to have fewer than to pad the work just to finish the task."

| Dimension | Standard | Anti-pattern |
|---|---|---|
| **5 rounds of search** | search across channels (official site / press kit / official social / YouTube frames / Wikimedia / user-account screenshots), not one round grabbing the first 2 results and stopping | using first-page results directly |
| **10 candidates** | gather at least 10 options before you start filtering | grabbing only 2, no choices |
| **choose 2 good ones** | select 2 out of the 10 as the final material | using all of them = visual overload + diluted taste |
| **each 8/10 or better** | below 8, **rather not use it** — use an honest placeholder (gray block + text label) or AI generation (nano-banana-pro based on the official reference) | padding brand-spec.md with 7-point material |

**The 8/10 scoring dimensions** (record the scores in `brand-spec.md`):

1. **Resolution** · ≥2000px (≥3000px for print/large-screen use)
2. **Copyright clarity** · official source > public domain > free stock > suspected stolen image (a suspected stolen image is an automatic 0)
3. **Fit with the brand's temperament** · consistent with the "temperament keywords" in brand-spec.md
4. **Consistency of light/composition/style** · the 2 assets do not fight each other side by side
5. **Standalone narrative ability** · can carry a narrative role on its own (not decoration)

**Why this bar is an iron rule**:
- the studio's philosophy: **better to have none than filler**. Filler material is worse than none — it pollutes visual taste and signals "unprofessional"
- **the quantified version of "120% on one detail, 80% on everything else"**: 8 points is the floor for "everything else at 80%"; the real hero material has to be 9-10
- when a consumer looks at the work, every visual element **adds or subtracts points**. 7-point material = a deduction, better to leave the space empty

**The logo exception** (restated): if it exists it must be used; "5-10-2-8" does not apply. Because the logo is not a "pick one of many" problem but a "foundation of recognition" problem — even a 6-point logo is 10× better than no logo.

##### Step 4 · Verify + extract (not just grepping color values)

| Asset | Verification action |
|---|---|
| **Logo** | file exists + SVG/PNG opens + at least two versions (for dark ground/light ground) + transparent background |
| **Product shots** | at least one at 2000px+ resolution + cut out or on a clean background + multiple angles (main view, detail, scene) |
| **UI screenshots** | real resolution (1x / 2x) + the newest version (not an old one) + no user data contamination |
| **Color values** | `grep -hoE '#[0-9A-Fa-f]{6}' assets/<brand>-brand/*.{svg,html,css} \| sort \| uniq -c \| sort -rn \| head -20`, then filter out black/white/gray |

**Beware demo-brand contamination**: product screenshots often show the brand color of a demo customer (e.g. one tool's screenshot demoing HEYTEA red) — that is not the tool's own color. **When two strong colors appear at once you must tell them apart.**

**Brand facets**: the same brand's marketing colors on the official site and its product UI colors are often different (Lovart's site is warm beige + orange, its product UI is Charcoal + Lime). **Both are real** — pick the facet that fits the delivery context.

##### Step 5 · Freeze it into a `brand-spec.md` file (the template must cover all assets)

```markdown
# <Brand> · Brand Spec
> Collected: YYYY-MM-DD
> Asset sources: <list the download sources>
> Asset completeness: <complete / partial / inferred>

## 🎯 Core assets (first-class citizens)

### Logo
- Primary: `assets/<brand>-brand/logo.svg`
- Reversed for light ground: `assets/<brand>-brand/logo-white.svg`
- Used in: <opening/ending/corner watermark/global>
- Forbidden transforms: <no stretching/recoloring/adding outlines>

### Product shots (required for physical products)
- Main view: `assets/<brand>-brand/product-hero.png` (2000×1500)
- Detail shots: `assets/<brand>-brand/product-detail-1.png` / `product-detail-2.png`
- Scene shot: `assets/<brand>-brand/product-scene.png`
- Used in: <close-up/rotation/comparison>

### UI screenshots (required for digital products)
- Home: `assets/<brand>-brand/ui-home.png`
- Core feature: `assets/<brand>-brand/ui-feature-<name>.png`
- Used in: <product showcase/dashboard reveal/comparison demo>

## 🎨 Supporting assets

### Palette
- Primary: #XXXXXX  <source note>
- Background: #XXXXXX
- Ink: #XXXXXX
- Accent: #XXXXXX
- Forbidden colors: <color families the brand explicitly does not use>

### Type
- Display: <font stack>
- Body: <font stack>
- Mono (for data HUDs): <font stack>

### Signature details
- <which details get the "120%" treatment>

### No-go zones
- <things explicitly not allowed: e.g. Lovart does not use blue, Stripe does not use low-saturation warm colors>

### Temperament keywords
- <3-5 adjectives>
```

**Execution discipline after the spec is written (hard requirement)**:
- all HTML must **reference** the asset file paths in `brand-spec.md`; CSS silhouettes/hand-drawn SVG are not allowed as substitutes
- the logo is referenced as an `<img>` pointing at the real file, never redrawn
- product shots are referenced as `<img>` pointing at the real files, never replaced by CSS silhouettes
- CSS variables are injected from the spec: `:root { --brand-primary: ...; }`, and the HTML only uses `var(--brand-*)`
- this turns brand consistency from "relying on self-discipline" into "relying on structure" — adding a color on the fly means editing the spec first

##### Fallback when the whole flow fails

Handle by asset type:

| Missing | Handling |
|---|---|
| **Logo not findable at all** | **stop and ask the user**, do not force it (the logo is the foundation of brand recognition) |
| **Product shots (physical product) not findable** | prefer nano-banana-pro AI generation (based on the official reference images) → next, ask the user → last resort an honest placeholder (gray block + text label, explicitly marked "product shot pending") |
| **UI screenshots (digital product) not findable** | ask the user for a screenshot from their own account → frames from the official demo video. Do not pad with a mockup generator |
| **Color values not findable at all** | go through the three directions (`references/directions.md`); sample the three direction cards' colors from the subject and real photography, and mark it as an assumption |

**Forbidden**: silently forcing it with CSS silhouettes/generic gradients when assets cannot be found — this is the protocol's biggest anti-pattern. **Stop and ask rather than pad**.

##### Counter-examples (real mistakes we have made)

- **Kimi animation**: guessed from memory that it "should be orange", when Kimi is actually `#1783FF` blue — redone once
- **Lovart design**: took the HEYTEA red of a demo brand inside a product screenshot for Lovart's own color — nearly ruined the whole design
- **DJI Pocket 4 launch animation (2026-04-20, the real case that triggered this protocol upgrade)**: ran the old protocol that only extracted color values, did not download the DJI logo, did not find Pocket 4 product shots, substituted CSS silhouettes for the product — the result was "a generic black-background + orange-accent tech animation" with no DJI recognition. The studio's words: "Otherwise, what are we even expressing?" → protocol upgraded.
- extracted the colors but did not write them into brand-spec.md, forgot the primary's value by page three, improvised a "close but not it" hex — brand consistency collapsed
- **Five major coding agents comparison deck (2026-06-06, the real case that extended the trigger condition)**: the agent classified the task as "a deck + no style reference" and went to the fallback design direction advisor, extracted only the five brands' colors and spawned three design logics, **without fetching a single one of the five product logos (Claude Code / Cursor / Codex / Copilot / Trae)** — caught by the studio: "why didn't we go get these products' logos". Root cause: judging "a comparison / leaderboard deck" as not triggering §1.a (assuming §1.a only covers "material for a single client"), plus no logo checkpoint anywhere in the fallback path. → Fixes: ① the trigger condition expanded to two kinds (including "naming/listing real products in the design") ② the fallback does not exempt fetching logos ③ Phase 3.5 adds a "named product logo sub-gate" that must pass before spawning ④ Step 3.1 adds the reliable svgl/simpleicons/Google favicon image chain.

##### Cost of the protocol vs cost of skipping it

| Case | Time |
|---|---|
| Running the protocol properly | download logo 5 min + download 3-5 product shots/UI 10 min + grep color values 5 min + write the spec 10 min = **30 minutes** |
| Cost of skipping the protocol | produce a generic animation with no recognition → the user needs 1-2 hours of rework, or a full redo |

**This is the cheapest investment in consistency**. Especially for commercial work / launch events / important client projects, the 30-minute asset protocol is insurance money.
