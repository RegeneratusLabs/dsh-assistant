# Design Style Library: Web 20 + PPT 20 + Infographic 20 + App 12 + Chinese & East Asian 12 + Xiaohongshu 8 (HTML-native first, every entry has a specimen)

> **2026-06 rebuild.** Reverse-engineered from research into the world's 10 major website types + 10 major presentation types, and the generally acknowledged best design (top 5) in each — 100 real cases in total.
> The fatal flaw of the old 20-entry "graphic/installation-designer philosophy" library: the bold styles were almost all AI-generation-only (particles/light/hand-drawing), and **users have no image-generation capability by default and everything goes through HTML by default, so the bold half scored zero outright, leaving only minimalism — that is the root cause of "default output is all the same"**. Every entry in this library is marked with its **fidelity** under "pure HTML/CSS, no generated imagery".
>
> ⚖️ **But remember the positioning**: this is **"ammunition to flip through when you have no idea", not a "you must choose from here" list**. If the user gave content/brand/reference, design grows from there — don't force the library onto it. The skill's job is to help the user avoid the worst, not to prescribe what good design looks like — good design grows out of the user's real needs.

## How to use this library

0. **Look at the specimen first, then read the text.** Each section has an overview sheet `assets/style-specimens/sheet-<web|ppt|info|app|east|xhs>.jpg`, and the "specimen" at the end of each style line is a single large image (the same-named .html is the source — read its CSS directly to learn the technique). The text tells you what it is; the specimen tells you what "done properly" looks like — a model that only reads the name produces its average impression of that style. Subjects and numbers in the specimens are fictional; you borrow the layout and temperament, not the content.
1. **Choose the section by output type first**: web/landing page/corporate site → Web 20; PPT/deck/presentation → PPT 20; infographic/data visualization/single long image → Infographic 20; app/mobile prototype → App 12; Xiaohongshu image post/cover/carousel → Xiaohongshu 8 (every specimen doubles as a template). **Chinese & East Asian 12 are cross-medium** — usable for any form, and especially worth it for Chinese content.
   - The criterion is **output form, not subject matter**: a clickable site goes in the web section, something you page through goes in the PPT section, **a single image (or a set) where data is the protagonist and that can be read standalone without interaction goes in the infographic section**.
   - Two common ambiguous cases: a dashboard prototype goes in the web section (it is a product interface); a data page embedded in a deck stays in the PPT section (it gets paged through).
2. **Temperature system**: every style is tagged `bold / neutral / quiet`. **The bold ones are deliberately the majority** — the model's certainty bias naturally drifts toward quiet minimalism, so the library's mix has to push it toward bold.
   - This library is the pool for the "spin-the-wheel" in the three directions (see `references/directions.md`); when you're stuck on the best-designer and real-world-reference logics, you can flip through it too.
   - ❌ Don't let all three directions land on the same temperament (e.g. all "off-white + whitespace + one accent color").
3. **Fidelity**: ≥90% do it with your eyes closed; 70-90% the main body works, some details degrade; <70% (e.g. Memphis distressed texture) you must **explicitly mark in the output which part is degraded to flat color blocks** — don't pretend you can reproduce the original texture.
4. **Typefaces**: each entry gives an open-source substitute (Inter/Geist/Manrope/Space Grotesk/Fraunces/Playfair, etc.). Do not name paid fonts (Söhne/Circular, etc.).
5. Companion: the "spin-the-wheel" in the three directions draws from this library (`references/directions.md`); styles that need real photography (dark gallery, white-box gallery, map-as-protagonist, etc.) use honest placeholders in the specimens — when you actually build them, source the images first.

---

## Color Derivation Protocol (run these three steps before using any style)

> ⚠️ **Every hex in the style entries below is an example anchor, not a recipe.** The same style applied to different content should derive different color values through this protocol — copying entry hexes directly just produces better-tasting slop. Why: hard-coded recipes give 100 users 100 identically colored outputs, and color's information content drops to zero; derivation makes color evidence that is "unique to this content".
>
> **Same for typefaces**: the font names in the entries are example anchors too. After choosing a style, run the display+body pairing through the pairing logic and the "already worn out" list in `references/typography.md` first — **when the list and an entry conflict, typography.md wins** (e.g. an entry says Fraunces; swap in a substitute per the list).

### Three steps: sample → converge → argue

| Step | What to do | Why |
|------|-----------|-----|
| **1. Sample** | Take the primary color from three sources; don't invent it: ① brand assets (eyedrop straight from the logo / existing VI) ② real imagery from the content (dominant colors in product screenshots / photographic material) ③ cultural context (the color memory the subject carries, see the table below) | Picking colors out of thin air = drawing lots from the model's prior, and you always draw the same few internet-famous colors; colors sampled from the content carry their "why" inherently |
| **2. Converge** | Use oklch to compress the palette to **2-3 chromatic colors + 1 neutral set**. Write neutrals as a lightness sequence (e.g. L 0.15/0.35/0.65/0.92/0.98); separate chromatics by oklch hue angle H ≥60° or lightness ΔL ≥0.3 | Many colors means chaos; oklch's L channel is perceptually uniform, so a written lightness sequence is a hierarchy system, more tractable than a pile of isolated hexes |
| **3. Argue** | Write, in one sentence, "why this color", into a code comment or the delivery notes. E.g. "primary sampled from the ochre in the user's logo, chroma pulled down to 0.08 to mimic ink" | **If you can't write that sentence, you're copying a recipe.** The argument is a self-check gate against slop, not a ritual |

### Print-color texture: why low saturation reads better than pure screen color

Ink on paper can never reach the maximum saturation of screen RGB — the CMYK gamut is narrower, paper absorbs ink, ambient light reflects, and all of it "grays down" the color. The "premium feel" the eye learned over decades of print is, in essence, that physical grayness. So deliberately lowering chroma in screen design borrows print's textural memory.

| Use | oklch chroma reference | Effect |
|------|------------------|------|
| Large-area ground | 0.01–0.04 | paper feel, not harsh |
| Brand primary / accent | 0.08–0.15 | ink feel, noticeable but not plastic |
| Small-area highlights (buttons/links) | 0.15–0.22 | keeps vitality, small areas only |
| >0.25 full-bleed fill | use with caution | screen-fluorescent; only fits deliberately "electron-native" styles like Wrapped or candy |

### Cultural-context cheat sheet: same hue, different context

Choosing a color isn't just choosing a hue, it's choosing the cultural coordinate behind it. The same "red" lands worlds apart:

| Hue | Context A | Context B | Where they differ |
|------|--------|--------|--------|
| Red | Forbidden City vermilion (orange-leaning, grayed; low L low C in oklch, darker and muddier than Coke red) → traditional/solemn | Coke red (high-saturation true red) → consumer/excitement | Lower the chroma and it jumps from the shelf to the palace wall |
| Blue | Japanese indigo / lapis navy (deep, violet-gray leaning) → craft/stillness | Tech blue #0066FF family → SaaS/efficiency | The latter is the model's favorite default blue — before using it, ask yourself whether you're drawing lots |
| Green | Matcha / moss green (yellow-leaning, low saturation) → natural/Japanese | Neon green #39FF14 → terminal/hacker | Both green: one drinks tea, one writes code |
| Yellow | Gamboge / mustard (brown-gray) → retro print | Warning yellow / Mailchimp yellow → loud/playful | Grayness decides whether it's an old book page or a hard hat |
| White | Cream paper white #F5F0E8 → publication/warm | Pure white #FFF → lab/Swiss | A 2% color-temperature difference in the ground is the whole temperament divide |

---

## Web Style Library (20)

#### Bold camp

**Media-Grade Brutalism — Editorial Brutalism (huge Helvetica crushing small body copy)** `bold · fidelity 98%`
- Reference: Bloomberg Businessweek (Richard Turley's 2010-2014 redesign, executed by Code and Theory); the Neue Haas Grotesk lineage
- Fit: media/content publishing, AI product launches, brand site heroes, research report covers, opinion long-read headers
- Visual DNA: palette pure black #000 + pure white #FFF + hyperlink blue #0000EE, accents signal orange-red #FF433D / terminal green #00A33E. Type Helvetica/Neue Haas Grotesk, 120px+ huge headlines left-aligned with tight tracking, crushing 14px body copy — extreme size contrast. Layout modular grid + 1px rule lines cutting columns, high information density, deliberately no whitespace. Signature elements: rule-line column splits, hyperlink-blue underlines, large black-and-white blocks.
- HTML implementation: pure CSS, 1:1 fidelity. CSS Grid for the module grid + borders for rule-line columns, clamp() for huge responsive type + tightened letter-spacing, system Helvetica/Arial stack with Inter as fallback, hyperlinks simply #0000EE underlined. Zero asset dependencies.
- Type: Inter (for Helvetica/Neue Haas Grotesk), Geist Mono for code
- Specimen: assets/style-specimens/web/01-editorial-brutalism.jpg

**Neo-Brutalism Collision-Color Feed (thick black outlined cards + high-saturation clash colors)** `bold · fidelity 95%`
- Reference: The Verge 2022 redesign (in-house team, PolySans + Mānuka)
- Fit: media/content sites, AI product aggregation pages, event landings, community leaderboard pages, Xiaohongshu-style info cards
- Visual DNA: palette electric purple #5200FF~magenta #E1306C high-saturation primary + bright yellow #F8E000 accent + pure black #08080D + white, large clash-color blocks deliberately left unharmonized. Type geometric sans for big headlines + serif body for contrast. Layout card-based feed, 2-4px thick black outlines, hard color-block zoning, almost no border radius. Signature elements: thick-outlined cards flipping to a clash color on hover, unfinished-interface temperament.
- HTML implementation: pure CSS strength. border:3px solid #000 thick outlines + box-shadow hard offset (4px 4px 0 #000) + grid/flex card feed + :hover background clash-color flip. No 3D/lighting obstacles.
- Type: Space Grotesk (for PolySans) + any serif such as Fraunces
- Specimen: assets/style-specimens/web/02-neo-brutalism.jpg

**Memphis Maximalism (clash blocks + offset stacking + retro type)** `bold · fidelity 72%`
- Reference: Gucci Vault concept store (Alessandro Michele); the Memphis design movement / Sagmeister's rebellious gene
- Fit: e-commerce concept stores, creative event pages, brand experimental campaigns, Y2K retro themes, holiday marketing pages
- Visual DNA: retro red/mustard/royal blue/purple/olive green large clash blocks juxtaposed + a distressed cream warm ground, intense and deliberately discordant. Type retro serif + decorative faces mixed, print texture, grid-breaking offset stacking. Layout anti-grid collage curation, modules of uneven size scattered and overlapping, like wandering a digital room. Signature elements: clash blocks, offset stacking, unconventional navigation easter eggs.
- HTML implementation: transform:rotate() for offset stacking + position:absolute overlap + high-saturation clash background blocks + retro Google Fonts. Real distressed texture cannot be reproduced in CSS — degrade to flat blocks + mix-blend-mode/contrast filters to fake grain; the geometric-collage version holds up, the archival-distressed version degrades.
- Type: DM Serif Display + Bungee (decorative) + Space Mono
- Specimen: assets/style-specimens/web/03-memphis-maximalism.jpg

**Candy-Colored Raised 3D Buttons, Gamified — Friendly Geometric Candy** `bold · fidelity 85%`
- Reference: Duolingo (Johnson Banks + Monotype, Feather Bold typeface); anti-Silicon-Valley-minimalism
- Fit: education/language learning, consumer app landings, gamified products, mass-market friendly products, event signup pages
- Visual DNA: Duo green #58CC02 + duck yellow #FFC800 + sky blue #1CB0F6 candy saturation + white ground, rounded and friendly. Type extra-bold rounded (Feather Bold feel). Layout big-radius cards, raised 3D buttons (hard shadow at the bottom = pressable feel), mascot slot + progress bubbles. Signature elements: 3px solid bottom-shadow 3D buttons, press-down displacement animation, extra-round corners.
- HTML implementation: pure CSS. box-shadow:0 4px 0 hard bottom shadow for raised buttons + :active translateY(4px) removing the shadow to simulate the press, large border-radius, flat blocks. Without generated imagery, the mascot becomes a CSS geometric shape or emoji placeholder (slight degradation).
- Type: Baloo 2 / Nunito (extra-bold rounded, for Feather)
- Specimen: assets/style-specimens/web/04-friendly-candy.jpg

**Pure-CSS Geometric Illustration + Responsive Morph Easter Eggs — Pure-CSS Art** `bold · fidelity 80%`
- Reference: Lynn Fisher (lynnandtonic.com, a legend of pure-CSS art, profiled in a dedicated Adobe article)
- Fit: personal homepages, creative 404/easter-egg pages, playful brand landings, technical blog headers, designer self-presentation
- Visual DNA: 2-4 high-contrast flat colors (a different palette per breakpoint). Type bold geometric sans headlines. The layout's core is "the picture morphs with the viewport" — a set of CSS shapes recomposing into a different scene at each breakpoint (e.g. a building changing floor count with screen width). Signature elements: geometric illustration drawn in pure CSS, breakpoint-driven re-layout easter eggs, zero images.
- HTML implementation: the pure-CSS showoff arena, where zero assets is an advantage. divs + border-radius/clip-path/transform/box-shadow stacking geometric shapes, @media breakpoints changing shape size/position to morph. The difficulty is the design concept, not the tech — but every shape has to be hand-crafted carefully.
- Type: Rubik / Archivo (bold geometric, for the custom face)
- Specimen: assets/style-specimens/web/05-pure-css-art.jpg

**Giant-Type Black-and-White High-Contrast Fashion Broadside — Bold Big-Type Editorial** `bold · fidelity 88%`
- Reference: Jacquemus official site / Rik Oostenbroek / Domestika; fashion magazine broadsides
- Fit: fashion e-commerce, portfolios, media features, brand manifesto pages, video course covers, large-type research reports
- Visual DNA: minimal black and white + a single restrained accent (nude pink #E8C4C0 or true red). Type oversized Display sans / high-contrast serif, headline filling the screen. Layout full-bleed grid, giant type wrestling with negative space, 1:1 image/text splits. Signature elements: screen-dominating huge headlines, luxury-grade whitespace, left-right anchored typography.
- HTML implementation: pure CSS, perfect fidelity. clamp() giant type + CSS Grid full-bleed splits + generous padding + vh units so the headline fills the viewport. With no images, substitute flat color blocks / text blocks for the fashion editorial placeholder (light degradation, the layout still holds).
- Type: Archivo Expanded / Anton (Display) + Playfair Display (high-contrast serif)
- Specimen: assets/style-specimens/web/06-bold-big-type.jpg

**Cosmic Retro-Futurism Space Atlas** `bold · fidelity 75%`
- Reference: Perplexity Comet browser launch site (The Brand Identity: Black/Blue/Cream; "2001: A Space Odyssey" temperament)
- Fit: AI product launch sites, tech brand manifesto pages, event countdown pages, futuristic landings, concept launches
- Visual DNA: pure black #0A0A0A + cream paper #F0EAD8 + a touch of cobalt-to-peacock blue #2B4F91, low saturation like an old astronomical atlas. Type high-contrast serif (classical star-chart feel) + whitespace. Layout line-drawn orbits/parabolic SVG, planet dots, cream ground under black type, antiquarian-book typography. Signature elements: SVG celestial orbit lines, the cream+blue+black triad, retro serif display type, astronomical-atlas texture.
- HTML implementation: pure CSS + SVG reproduces 80% of the temperament in static form. SVG paths for orbit parabolas + CSS radial positioning for planet dots + three-color variables + high-contrast serif. The gap is the "space landing on Earth" full-screen video transition (the soul) — degrade to CSS scroll parallax + SVG orbit rotation as an approximation.
- Type: Cormorant Garamond / EB Garamond (high-contrast serif) + Space Mono
- Specimen: assets/style-specimens/web/07-cosmic-retro-futurism.jpg

**Cinematic Sound-Wave Visualization — Cinematic Sound-Viz Dark** `bold · fidelity 72%`
- Reference: ElevenLabs; film title sequences (Saul Bass-style minimal motion) × audio engineering interfaces
- Fit: audio/speech AI products, music tech sites, podcast platforms, media launch pages, cinema-grade brand heroes
- Visual DNA: pure black #000 ground + pure white text + blue-purple gradient accent waveforms. Type large sans headlines, Saul Bass-minimal. Layout full-bleed dark stage, waveform/spectrum visualization running throughout, giant titles pressing on the waveform, card feature zones. Signature elements: colored audio-waveform bands, film-title-sequence minimalism, high-contrast black and white + a single gradient, the sound-visualization motif.
- HTML implementation: pure CSS + SVG reproduces 70% of the temperament (skeleton perfect, the waveform is the degradation point). An SVG polyline for a static waveform, or rows of div bars of unequal height with CSS animation for a "fake waveform" bounce approximation. Gap: a Web Audio/Canvas spectrum reacting to live sound can't be done in pure CSS — the static version looks right, the moving soul doesn't come back.
- Type: Inter / Sora (large sans)
- Specimen: assets/style-specimens/web/08-cinematic-sound-viz.jpg

**Pixel-Game Side-Scroller Narrative** `bold · fidelity 70%`
- Reference: Robby Leonardi's interactive résumé (8/16-bit platform-action-game narrative, a homage to Nintendo's SNES)
- Fit: creative résumés/portfolios, playful brand campaigns, gamified landings, event easter-egg pages, personal fun homepages
- Visual DNA: retro game multi-zone palette — forest green #4CAF50 grass + sky blue #5DADE2, transitioning to space purple #2C2A4A, volcano orange-red #E8743B, seabed teal #1ABC9C; each "level" swaps in a different high-saturation cartoon palette. Type pixel fonts (8-bit feel) + bold sans. Layout horizontal/vertical scrolling level scenes, parallax layers, scroll-triggered displacement. Signature elements: per-level palette change, pixel aesthetic, parallax scrolling, game-HUD-style UI.
- HTML implementation: pure CSS + a little JS reproduces the skeleton (the original is HTML+CSS+jQuery with no WebGL). Parallax layers via position + scroll offset, image-rendering:pixelated, CSS frame-by-frame background-position for sprite animation, per-section background colors. Gap: original-character/scene hand-drawn pixel illustration — without generated imagery, substitute CSS squares assembling simple pixel icons (art degrades, tech doesn't).
- Type: Press Start 2P / VT323 (pixel type) + Inter
- Specimen: assets/style-specimens/web/09-pixel-side-scroller.jpg


#### Neutral camp

**Bauhaus Geometric Logomark + Flat Illustration System — Bauhaus Geometric** `neutral · fidelity 90%`
- Reference: Khan Academy rebrand (hexagon + petal logomark + Wonder Blocks design system); Bauhaus geometric composition
- Fit: education course sites, brand logo systems, infographics, kid-friendly products, event key visuals
- Visual DNA: the three-primary palette — Bauhaus red #E63946 / yellow #FFB703 / blue #0077B6 + black and white, flat blocks joined together. Type geometric sans (rounded geometric feel). Layout illustrations built from circles/triangles/squares as basic units, grid-aligned, modular puzzle assembly. Signature elements: purely geometric logomark, flat gradient-free illustration, primary-color composition.
- HTML implementation: pure CSS geometry does everything. border-radius:50% for circles, clip-path/border triangles, square divs assembling geometric illustrations, CSS Grid for alignment, flat fills with no assets. Illustrations are hand-built from CSS shapes or inline SVG geometric paths.
- Type: Poppins / Manrope (geometric rounded, for Wonder Blocks)
- Specimen: assets/style-specimens/web/10-bauhaus-geometric.jpg

**Dark Two-Tone Sidebar Developer Portfolio — Dark Editorial (dark ground + single fluorescent accent + monospace)** `neutral · fidelity 96%`
- Reference: Brittany Chiang (brittanychiang.com v4, the de facto standard for dev portfolios)
- Fit: portfolio homepages, developer-facing products, tech brand sites, résumé pages, AI tool landings
- Visual DNA: deep ink green/navy ground #0A192F + slate gray text #8892B0 + a single fluorescent teal accent #64FFDA. Type sans body + monospace (numbers/labels). Layout fixed left sidebar nav + scrolling main area, two columns, section numbers 01/02, link hover underline slide-in. Signature elements: single accent color, monospace numbered labels, sidebar anchor highlighting.
- HTML implementation: pure CSS, full fidelity. position:sticky fixed sidebar + CSS Grid two columns + single accent variable + monospace labels + :hover underline transform slide-in. Zero assets, pure layout and micro-interaction.
- Type: Inter + JetBrains Mono (monospace)
- Specimen: assets/style-specimens/web/11-dark-editorial.jpg

**Warm Editorial (cream paper ground + terracotta orange + serif and sans mixed setting)** `neutral · fidelity 97%`
- Reference: Anthropic / Claude (DBCo + Geist Studio, Styrene×Tiempos); Penguin/Pelican paperback typography
- Fit: AI product sites, brand sites, long-read pages, orange-paper ebooks, research reports, training material
- Visual DNA: cream paper ground #F5F0E8 + terracotta orange #CC785C/#D97757 accents + near-black text #191919, warm and low-saturation. Type serif headlines (Tiempos feel) × sans body (Styrene feel) mixed. Layout book-like single-column reading flow, comfortable leading, restrained rules. Signature elements: paper-feel warm ground, terracotta orange, publication-grade typographic rhythm.
- HTML implementation: pure CSS, 100% fidelity, zero assets. Background color variable + serif/sans stack mixing + max-width capping reading width + line-height 1.7 for comfortable leading.
- Note: this is also the look the model slides into without thinking (Claude's own palette, see `references/content-guidelines.md`). Using it is fine, as long as you chose it rather than slid into it: don't crowd all three directions here, and if the look ledger used it recently, pick another one.
- Type: Fraunces / Newsreader (for Tiempos serif) + Inter (for Styrene)
- Specimen: assets/style-specimens/web/12-warm-editorial.jpg

**Linear Dark Glow + Bento Grid — Glassmorphism Bento** `neutral · fidelity 85%`
- Reference: Linear / Cursor ("The Linear Look", a phenomenon-level genre; Frontend Horse has a code recipe)
- Fit: SaaS/AI product sites, developer tools, tech brand heroes, product feature showcases, dark dashboard demos
- Visual DNA: near-black ground #08090A + desaturated blue-purple brand #5E6AD2 + low-saturation cyan-purple glow gradient #4EA7FC→#B59AFF. Type geometric sans with tight negative tracking. Layout bento-box grid blocks, hairline dividers, glassmorphic cards. Signature elements: dark ground glowing gradient borders, bento blocks, light streamers, frosted glass.
- HTML implementation: pure CSS, strong fidelity. box-shadow/filter blur + radial-gradient for glow, backdrop-filter:blur for glassmorphism, conic/linear-gradient borders, CSS Grid for bento assembly. The only gap is "real product UI screenshots" — substitute flat blocks + text stitched into a simplified fake UI (that part degrades).
- Type: Inter / Geist (negative tracking) + Geist Mono
- Specimen: assets/style-specimens/web/13-glassmorphism-bento.jpg

**Angled Fluid Gradient Bands** `neutral · fidelity 92%`
- Reference: Stripe (signature angled gradient banner, custom Klim Söhne typeface)
- Fit: SaaS/Fintech landing pages, brand site heroes, product launch pages, event banners, AI product marketing pages
- Visual DNA: multi-color fluid gradient (indigo #635BFF → cyan → pink → warm orange) as the hero background + pure white content area + near-black text. Type refined sans (Söhne feel). Layout skewed color-block divisions (skew-cut zoning), gradient hero over a structured grid body. Signature elements: angled boundaries, multi-color fluid gradients, a rational grid pressing on an expressive gradient.
- HTML implementation: pure CSS. transform:skewY() or clip-path:polygon() for angled zones, layered linear-gradient (optionally with a slow CSS animation) for fluid gradient bands, Grid for the structured body below. Zero assets.
- Type: Inter / Hanken Grotesk (for Söhne)
- Specimen: assets/style-specimens/web/14-angled-fluid-gradient.jpg

**Utility-First Colorful Docs** `neutral · fidelity 98%`
- Reference: Tailwind CSS Docs (Sky/Cyan brand colors + rainbow hue bars for functional categories)
- Fit: technical documentation, API references, design system sites, tutorial sites, developer knowledge bases, SaaS help centers
- Visual DNA: Sky blue #38BDF8 brand + teal→cyan→sky blue gradient + Slate grays #0F172A/#64748B/#F8FAFC; the docs use rainbow hue bars to separate functional categories (pink #EC4899 / purple #A855F7 / green #10B981 / orange). Type crisp sans + monospace code. Layout left sidebar nav + center body + right TOC, three columns, color-highlighted code blocks, category color tags. Signature elements: cyan-blue gradient hero, rainbow category colors, three-column docs skeleton, syntax-highlighted code blocks.
- HTML implementation: pure CSS, 98% fidelity (it is itself CSS-framework documentation). Grid three columns + linear-gradient cyan-blue hero + category color variables + code-block syntax colors applied with span styling. Inter is open source; only the dark-mode toggle/copy needs lightweight JS. Zero lighting/3D/hand-drawing.
- Type: Inter + JetBrains Mono / Fira Code (code)
- Specimen: assets/style-specimens/web/15-utility-colorful-docs.jpg

**Terminal-Core Soft-Futurism (monospace + isometric cubes)** `neutral · fidelity 80%`
- Reference: Cursor (Anysphere); developer terminal aesthetics × Teenage Engineering industrial minimalism
- Fit: AI coding tool sites, CLI product landings, developer infrastructure, tech brand heroes, terminal-class products
- Visual DNA: charcoal #0B0D14 ground + warm white text #F2F0EF + restrained blue-purple gradient accents on buttons and glows. Type monospace as the protagonist (command-line feel) + sans support. Layout command-line/code-block foreground, bento zoning, 2.5D isometric cube diagrams. Signature elements: monospace command lines, isometric projected cubes, warm white × charcoal, restrained gradient glow, industrial minimalism.
- HTML implementation: pure CSS, 80% fidelity. Monospace code blocks + dark bento + box-shadow glow; 2.5D isometric cubes via CSS 3D transform (rotateX/Y + skew) or hand-built SVG isometric projection. Gap: clickable multi-screen demos need JS + stitched fake UI. No hard WebGL requirement.
- Type: Geist Mono / JetBrains Mono (protagonist) + Inter (support)
- Specimen: assets/style-specimens/web/16-terminal-core.jpg


#### Quiet camp

**Functional Brutalism Community (gray-line dividers + system fonts + blue links)** `quiet · fidelity 98%`
- Reference: Are.na / Lobsters / Quartz; Müller-Brockmann's grid brought to digital + Tufte information density
- Fit: community/UGC platforms, content aggregators, documentation knowledge bases, mobile-first content feeds, geek-facing products
- Visual DNA: near-white ground #FBFBFB + black text + 1px gray dividers #E0E0E0 + classic link blue #0000EE / visited purple. Type system font stack (-apple-system / undecorated). Layout high-density information lists, thin gray line columns, minimal whitespace, tight leading. Signature elements: hairline gray dividers, blue links, system fonts, information density first.
- HTML implementation: pure CSS, the easiest to reproduce — this is Brutalist Web in its natural state. border-bottom:1px gray-line lists + system-ui stack + tight padding + blue links. Needs almost no assets or JS, pure structure.
- Type: system-ui system font stack / IBM Plex Sans (fallback)
- Specimen: assets/style-specimens/web/17-functional-brutalism.jpg

**Dark Gallery Framing — Gallery Dark (deep black negative space + single-column large images + small EXIF text)** `quiet · fidelity 75%`
- Reference: Glass (glass.photo) / Bottega Veneta; museum darkrooms + Apple Photos' content-first approach
- Fit: photography portfolios, luxury e-commerce, immersive visual content display, personal gallery pages, high-end product display
- Visual DNA: pure black ground #0A0A0A + the work itself supplies the only color + extremely faint gray EXIF text #666. Type ultra-thin sans, small. Layout single centered column of large images, huge negative-space framing, metadata text below each image. Signature elements: darkroom black ground, content-first with UI receding, EXIF-style small-print captions, one large image owning the viewport.
- HTML implementation: pure CSS reproduces the layout skeleton. Pure black ground + centered max-width single column + huge padding for framing whitespace + small metadata text. The gap is "real photographs" themselves — substituting placeholder images/flat blocks loses the soul, but the darkroom mood and layout are 100% buildable.
- Type: Inter (weight 300 light) / Cormorant (optional serif luxury feel)
- Specimen: assets/style-specimens/web/18-gallery-dark.jpg

**Swiss Extreme Black and White — Swiss Monochrome (Vercel-style pure black/white + Geist + sharp corners)** `quiet · fidelity 98%`
- Reference: Vercel / Next.js Docs (in-house Geist, now open-sourced); Massimo Vignelli's less-is-more
- Fit: developer tool docs, tech brand sites, AI product sites, SaaS landing pages, minimal research reports
- Visual DNA: pure black #000 + pure white #FFF + grays #888, zero color or just a touch of link blue. Type Geist geometric sans + Geist Mono. Layout sharp right angles (no or minimal radius), high contrast, precise grid, restrained whitespace. Signature elements: pure black and white, sharp corners, Geist type, triangle/arrow geometric marks.
- HTML implementation: pure CSS, 100% fidelity; Geist is open source and can be linked directly. CSS Grid precise grid + pure black/white variables + border-radius:0 sharp corners + hairline borders. This is HTML's most comfortable minimalist home ground, zero asset dependencies.
- Type: Geist + Geist Mono (the original open-source Vercel versions)
- Specimen: assets/style-specimens/web/19-swiss-monochrome.jpg

**Japanese Whitespace White-Box Gallery — Kenya Hara White Gallery** `quiet · fidelity 80%`
- Reference: Cosmos (cosmos.so) / Aesop's official site; Kenya Hara's emptiness of "White" + a Swiss grid hybrid
- Fit: high-end e-commerce, creative galleries, content curation platforms, designer portfolios, brand boutiques, moodboard sites
- Visual DNA: near-all-white ground #FAFAFA + pure black text #0A0A0A + extremely faint gray dividers #EFEFEF; the content images supply all the color, and the UI recedes into the background. Type minimal system/geometric sans, small, wide tracking. Layout masonry waterfall grid, extreme whitespace, faint gray hairlines, Eastern emptiness. Signature elements: white-box aesthetic, luxury whitespace, content-first with UI receding, waterfall curation.
- HTML implementation: pure CSS reproduces the static layout (distinguished from the dark gallery by "white"). CSS columns or Grid for masonry + near-white variables + large padding + faint gray dividers. The gaps are Lenis/GSAP silky inertial scrolling and image entrance easing (60% of the premium feel lives there) — CSS only has basic transitions, so the motion layer degrades.
- Type: Inter (light weight) / Cooper Hewitt (the open-source one Aesop uses)
- Specimen: assets/style-specimens/web/20-kenya-hara-white-gallery.jpg


## PPT Style Library (20)

#### Bold camp

**Neo-Swiss Billboard Editorial** `bold · fidelity 98%`
- Reference: Scribe $75M, Flock Safety $47M and other AI/SaaS pitch decks in the Big-Number Editorial genre; Bloomberg Businessweek infographics; Pentagram
- Fit: fundraising pitches, QBR/business reviews, annual trend retrospectives, key product launch slides
- Visual DNA: white (#FFFFFF) or near-black (#0A0A0A) ground + a single high-saturation accent (electric blue #2D5BFF / fluorescent green #00E676 / brand orange #FF6B2C) + neutral grid lines #E5E5E5. Type extra-large bold sans, the headline taking half the screen, numbers in tabular-nums monospace with tight tracking. Masters: ① big color-block section page with one word ② giant number taking half the screen (3.2x) + small caption ③ left-right split comparison ④ full-bleed flat line/bar chart. Signature: billboarding large type, strict baseline grid, big color-block section pages.
- HTML implementation: clamp() for the giant numbers; CSS Grid for the strict grid; background-color for big section pages; line/bar charts in pure divs + CSS or inline SVG (sharper than pasted images); font-variant-numeric:tabular-nums for number alignment. Zero illustration, zero 3D.
- Type: Inter / Geist / Söhne for Neue Haas Grotesk; Geist Mono for numbers
- Specimen: assets/style-specimens/ppt/01-neo-swiss-billboard.jpg

**Black Big-Number Stage** `bold · fidelity 97%`
- Reference: Steve Jobs' 2007 iPhone keynote, Xiaomi SU7 Ultra launch by Lei Jun, Spotify Wrapped, Presentation Zen (Garr Reynolds)
- Fit: product launch keynotes, thought-leadership talks, all-hands town halls, emotion-driven annual reviews
- Visual DNA: pure black #000000 ground + pure white #FFFFFF type, high contrast; one brand accent per page for highlights only (Xiaomi orange #FF6900 / Spotify green #1ED760 / Apple blue #2997FF). Type geometric sans bold; one word or one giant number filling the view per screen, tight tracking. Masters: ① black title page, one centered large line ② data-climax page with a giant number + unit + one-line caption ③ left-right spec comparison in two columns (accent vs gray) ④ single-page slogan. Lots of negative space.
- HTML implementation: black ground and white type take a few lines of CSS; giant numbers with clamp() + flex centering; accent highlight in its own span; left-right comparison with CSS Grid two columns + bar highlights; tabular-nums. Dropping the product photos for pure type actually comes closer to the Zen essence.
- Type: Geist / Inter / Source Han Sans for SF Pro
- Specimen: assets/style-specimens/ppt/02-black-big-number-stage.jpg

**High-Saturation Monochrome Brand Clash Poster — Mono-Brand Type-as-Hero** `bold · fidelity 96%`
- Reference: the Spotify Wrapped visual system, Mailchimp Brand Book (Collins), the modern Netflix red-and-black revival, COLLINS brand systems
- Fit: brand/marketing strategy, campaign pitches, town-hall culture pages, event key visuals
- Visual DNA: a single brand primary flooding the ground (Spotify green #1ED760 / Mailchimp yellow #FFE01B / Netflix red #E50914) + contrasting black or white type, two layers of clash. Type: oversized type as the key visual (type-as-hero), standing floor to ceiling. Masters: ① full-color ground + reversed giant type ② two color blocks split top-bottom or left-right ③ giant number filling the frame. Signature: monochrome flood, type as image, high-contrast clash.
- HTML implementation: full-bleed background-color; oversized type with clamp() filling the frame; two colors via two 100vh blocks; type-as-image via font-weight 900 + negative letter-spacing. Flat blocks, zero assets — the most satisfying thing native HTML does.
- Type: Inter / Manrope / Archivo (extra-bold) for Circular/Cavendish
- Specimen: assets/style-specimens/ppt/03-mono-brand-type-hero.jpg

**Full-Bleed Gradient Manifesto** `bold · fidelity 82%`
- Reference: Zuora's "Tell a Different Story" sales deck (deconstructed by Andy Raskin), Nike "Just Do It" campaign, National Geographic spreads
- Fit: sales proposal vision pages, brand manifestos, keynote turning points, mission-vision single pages
- Visual DNA: a full-bleed CSS gradient (warm orange→magenta / deep blue→cyan) or solid-color bleed + reversed manifesto type + a hashtag slogan (#shifthappens). Type heavy sans, all-caps slogan running across. Masters: ① full-bleed gradient + centered reversed manifesto ② promised-land vision page ③ customer logo wall. Signature: full-bleed, reversed large slogans, hashtag slogans.
- HTML implementation: linear-gradient/radial-gradient full-bleed (no particles/light effects — pure CSS gradients are allowed); reversed type centered via position; logo wall as a grid of grayscale SVG/text placeholders. The parts that originally relied on documentary photography degrade to CSS gradient grounds + large type; missing the photos costs roughly 15% fidelity.
- Type: Archivo / Anton / Manrope (extra-bold)
- Specimen: assets/style-specimens/ppt/04-full-bleed-gradient-manifesto.jpg

**Single-Concept Candy Lecture Stage — Candy-Color Lecture Stage** `bold · fidelity 94%`
- Reference: Harvard CS50 (David Malan), the Lessig Method / Takahashi method, Presentation Zen
- Fit: educational courseware, technical lectures, concept explanation, code teaching
- Visual DNA: deep black ground #0A0A0A + high-saturation candy colors rotating through the large type (magenta #FF2D95 / cyan #00E5FF / bright yellow #FFD500 / green #39FF14). Type sans, oversized, floating centered, one concept per screen, very little text. Masters: ① deep black ground with a single candy-colored large word ② monospace code block with syntax highlighting ③ spotlight-feel large type. Signature: candy-colored large type floating on deep black, monospace code highlighting, strong stage spotlight, minimal text.
- HTML implementation: deep black background + single-color oversized type centered with clamp(); code blocks as pre + monospace + span coloring for syntax highlighting; the spotlight feel via a very faint radial-gradient vignette (not particle effects). High fidelity.
- Type: Inter extra-bold + JetBrains Mono (code)
- Specimen: assets/style-specimens/ppt/05-candy-lecture-stage.jpg

**Playful Hand-Drawn Minimalism — Playful Maximalist Editorial (Collins style)** `bold · fidelity 75%`
- Reference: Mailchimp Brand Book (Collins 2018), New Yorker cartoon temperament, Cooper's rounded serif, Cavendish fluorescent yellow
- Fit: brand decks with attitude, creative agency proposals, culture-oriented town halls, marketing pages that push back on SaaS minimalism
- Visual DNA: Cavendish fluorescent yellow #FFE01B across large areas + black + a little clash color, anti-SaaS-minimalism. Type Cooper-style rounded serif for big headlines (playful) + magazine-style whitespace composition. Masters: ① full fluorescent yellow ground + a weird headline ② magazine-style irregular whitespace composition ③ large type with meme copy. Signature: fluorescent yellow, rounded serif, playful composition, weird hand-drawn temperament (degraded to geometric blocks/emoji instead of real illustration).
- HTML implementation: fluorescent yellow background; rounded serif font-family; magazine whitespace via asymmetric Grid. The core element — hand-drawn gorillas/illustration — cannot be done without AI image generation, so degrade to CSS geometric blocks + large emoji + text blocks rotated with irregular transforms; missing illustration costs roughly 20% fidelity.
- Type: Fraunces (adjustable roundness) / Bree Serif for Cooper; Inter for body
- Specimen: assets/style-specimens/ppt/06-playful-collins-editorial.jpg

**Irreverent Pop (Reddit-style)** `bold · fidelity 80%`
- Reference: the Reddit Ads sales deck (ranked by Dock as the most personable), David Carson-style irreverent typography, 90s web retro, Memphis playfulness
- Fit: Gen-Z brands, meme-marketing decks, community/creator-facing work, proposals brave enough to be un-serious
- Visual DNA: Reddit orange-red #FF4500 + clash colors, 90s web retro palette. Type mixed/breaking the grid in David Carson style, meme-casual copy. Masters: ① fun page with meme large type ② facts page with a rhythm shift to serious data ③ colloquial headlines. Signature: grid-breaking mixed setting, orange-red, meme-casual voice, fun→facts rhythm reversal, retro web texture.
- HTML implementation: deliberately break the grid with transform rotation/overlapping positioning/mixed type sizes; orange-red + clash blocks; retro texture via thick black borders + hard box-shadow (no blur). Custom meme illustration degrades to emoji + geometric collage, but the mixed typography itself is reproducible in HTML.
- Type: Archivo / Space Grotesk + a mixed Inter to create contrast
- Specimen: assets/style-specimens/ppt/07-irreverent-pop.jpg

**Y2K Inflated Large Type / Maximalist 3D-Type (Wrapped-style)** `bold · fidelity 78%`
- Reference: Spotify Wrapped 2022/2023/2025, Memphis clash colors, Y2K/Maximalism, duotone portrait gradients
- Fit: annual reviews (emotion-first, made to spread), personalized data cards, vertically shareable social cards, brand year-end
- Visual DNA: high-saturation clash colors flooding the background (magenta + cyan + orange) + Spotify green accents + duotone two-color gradients. Type: giant numbers filling the frame; years/numbers with 3D inflation / metallic texture. Masters: ① clash flood + giant inflated numbers ② duotone portrait/color-block ground + reversed large type ③ vertical shareable card. Signature: giant inflated 3D numbers, clash floods, duotone gradients, metallic year treatment, vertical story cards.
- HTML implementation: clash-color full-bleed background; 3D inflated numbers via layered CSS text-shadow + transform:perspective or SVG + stroke to fake volume (not real 3D rendering); duotone via mix-blend-mode + a gradient over a grayscale placeholder block. Metallic texture degrades to gradient-filled type with background-clip:text, costing roughly 15% fidelity.
- Type: Archivo Black / Anton extra-bold + Clash Display for numbers
- Specimen: assets/style-specimens/ppt/08-y2k-inflated-wrapped.jpg


#### Neutral camp

**Bento Grid** `neutral · fidelity 95%`
- Reference: the Apple Keynote Bento Grid era, the new generation of MBB Bento/Big-Type decks (2024-2026), Stripe annual report metric-card matrices, Pitch.com QBR templates
- Fit: product feature roundups, consulting/QBR data reporting, sales results pages, town-hall metrics pages
- Visual DNA: light gray/cream ground (#F5F5F7/cream) or near-black ground + brand primary + 1-2 accents, cards on light-tinted grounds + rounded corners + micro-borders/micro-shadows. Type oversized display headlines + regular body, strong weight contrast, KPI numbers in tabular figures. Masters: ① title page with one giant sentence + whitespace ② bento page with 2×2/3-column uneven-height cards, one insight each (number/line icon/sparkline) ③ one-insight page with an oversized number. Signature: uneven-height card grid, rounded micro-borders, breathing room.
- HTML implementation: CSS Grid grid-template-areas for uneven-height bento; cards with border-radius + subtle box-shadow + 1px hairline; sparklines as inline SVG; line icons as inline SVG strokes. Zero pasted images.
- Type: Inter / Geist + Geist Mono for numbers
- Specimen: assets/style-specimens/ppt/09-bento-grid.jpg

**Neo-Swiss Dark Terminal Aesthetic — Dark Hairline Terminal** `neutral · fidelity 94%`
- Reference: the Linear pitch deck, Vercel's design language, CS50's deep black stage courseware; typefaces Inter Tight + JetBrains Mono
- Fit: developer tool/technical product launches, technical pitches, engineering-oriented reporting
- Visual DNA: near-black ground (#0D0D0F/#111113) + hairline grid #262629 + a single purple-blue accent (#5B5BD6/#7C7CFF). Type Inter Tight for headlines + JetBrains Mono for labels/data. Masters: ① minimal title page with one sentence + mono kicker ② data grid separated by hairlines ③ feature list with mono labels. Signature: 1px hairline grids, monospace-only labels, extreme whitespace, near-black rather than pure black.
- HTML implementation: near-black background + border:1px solid hairline grids; mono labels via a monospace font-family; glow via very faint box-shadow/border highlight rather than real light effects (degraded to avoid the cyber-neon forbidden zone). Note: avoid the #0D1117 deep-blue forbidden zone; use a neutral near-black.
- Type: Inter Tight + JetBrains Mono / IBM Plex Mono
- Specimen: assets/style-specimens/ppt/10-dark-hairline-terminal.jpg

**Two-Font Consulting (Bower style)** `neutral · fidelity 90%`
- Reference: McKinsey's 2019 brand system (designed by Wolff Olins, Bower serif + sans), BCG Executive Perspectives, deep-blue hairline patterns
- Fit: consulting reports, executive reporting, industry research, authority-institution proposals
- Visual DNA: deep blue (#051C2C/McKinsey deep blue) × white as a binary + a single brand color for highlights (BCG green #00805A), warm gray grounds with breathing room. Type characterful serif headlines (Bower style) set against sans body at high contrast. Masters: ① top-left conclusive action-title ② blue hairline pattern decoration ③ magazine-style left-right division (conclusion text + visual) ④ large-number data-point cards. Signature: serif × sans high contrast, deep-blue hairline patterns, action-titles, warm-gray premium feel.
- HTML implementation: two font-families set against each other (serif headline + sans body); hairline patterns via repeating-linear-gradient or SVG lines; data-point cards in pure CSS; photo grayscale processing — skippable when there are no photos. Blue-purple edge shimmer degrades to a solid edge.
- Type: Playfair Display / Fraunces serif headlines + Inter body (for Bower)
- Specimen: assets/style-specimens/ppt/11-two-font-consulting.jpg

**Diagram-and-Arrow Enterprise Edition — Diagram-Driven Isotype** `neutral · fidelity 88%`
- Reference: Salesforce sales decks, the Isotype (Otto Neurath) lineage, Gene Zelazny's "Say It With Charts", Hans Rosling/Gapminder
- Fit: platform/architecture explanation, customer journeys, process methodology, ecosystem maps
- Visual DNA: enterprise blue blocks + per-product-line color coding + iconified capability grids. Type clear sans. Masters: ① horizontal customer-journey arrow flow ② layered platform architecture diagram ③ iconified capability grid ④ 2×2/waterfall/pyramid structure diagrams. Signature: arrow flows, layered architecture boxes, Isotype icon grids, process-as-narrative.
- HTML implementation: arrow flows via Flexbox + CSS clip-path triangles or SVG arrows; architecture layers via nested bordered divs; icons via inline SVG strokes with uniform stroke weight; waterfall/pyramid via Grid + skews. Bubble charts via CSS circles + positioning. Pure vector drawing.
- Type: Inter / IBM Plex Sans (chart-friendly)
- Specimen: assets/style-specimens/ppt/12-diagram-isotype.jpg

**Single-Master-Diagram Conceptual Explainer — Diagrammatic Minimalism** `neutral · fidelity 95%`
- Reference: Simon Sinek's Golden Circle TED talk, Bauhaus geometric abstraction, the information-architecture idea of "one diagram holds the whole room"
- Fit: theoretical framework explanation, TED-style idea spreading, model/methodology visualization, single-concept keynotes
- Visual DNA: minimal white/light ground + black + 1 accent, flat geometry. Type sans, labels in caps embedded in the shapes. Masters: ① a single geometric master diagram (concentric circles/triangle/matrix) carrying every concept ② inside-out arrows ③ contrast cases. Signature: one geometric master diagram, nested concentric circles/triangles, caps labels, one diagram carrying the concept.
- HTML implementation: concentric circles via border-radius:50% nested divs or SVG circles; triangles via clip-path/SVG polygons; arrows via SVG markers; labels positioned absolutely onto the shapes. Pure geometry, perfect HTML fidelity.
- Type: Manrope / the Futura family (Jost, open-source substitute) for geometric feel
- Specimen: assets/style-specimens/ppt/13-diagrammatic-minimalism.jpg

**Narrative Sparkline (Duarte style)** `neutral · fidelity 91%`
- Reference: Nancy Duarte's "Resonate" sparkline narrative map, Al Gore's "An Inconvenient Truth", Duarte Inc. data storytelling
- Fit: talk structure design, change narratives, before/after contrasts, data story arcs
- Visual DNA: dark or white ground + brand orange accenting the turning points + grayscale comparators. Type sans, annotation callouts. Masters: ① an oscillating waveform running across the full screen ② text annotations on the waveform ③ stacked before/after comparator waveforms ④ a lone data line hanging in full black ⑤ stepwise reveal. Signature: full-width waveform line, annotated points on the wave, orange turning points, comparator waveforms, a curve climbing out of the frame.
- HTML implementation: waveform lines as inline SVG paths (smooth Béziers); annotation points via SVG circle + text positioning; comparator waveforms as two stacked paths; reveal via CSS animation of stroke-dashoffset. Pure SVG drawing, no assets.
- Type: Inter + Geist Mono for numbers
- Specimen: assets/style-specimens/ppt/14-narrative-sparkline.jpg


#### Quiet camp

**Assertion-Evidence / Tufte Information Design** `quiet · fidelity 93%`
- Reference: Michael Alley's Assertion-Evidence (empirically tested at Penn State), McKinsey/BCG action-titles, Edward Tufte's data-ink ratio, Barbara Minto's pyramid principle
- Fit: academic/engineering reporting, data-rigorous consulting pages, policy research reports, technical reviews
- Visual DNA: white/very light gray ground + black body + a single restrained accent (deep blue/brick red). Type: full-sentence headlines (not noun phrases), one figure owning the space below the headline, text annotations embedded in the figure. Masters: ① full-sentence action-title ② one evidence figure under the title ③ zero bullets. Signature: sentence titles, single-figure evidence, embedded annotation, zero chartjunk, high data-ink ratio.
- HTML implementation: sentence titles via typographic hierarchy; charts drawn in pure CSS/inline SVG as minimal line or scatter plots (gridlines and legends removed, annotations placed as text right next to the data points); zero decoration. Tufte's restraint is exactly HTML's strength.
- Type: Source Serif / Lora headlines + Inter body (two-font reading grade)
- Specimen: assets/style-specimens/ppt/15-assertion-evidence.jpg

**Institutional Swiss Minimal** `quiet · fidelity 96%`
- Reference: Sequoia's official 10-page pitch template, Airbnb's 2009 seed deck, Müller-Brockmann grids, Massimo Vignelli
- Fit: investor pitches, standard business proposals, problem-solution narratives, decoration-free brand proposals
- Visual DNA: pure white ground + black/gray body + a single brand accent (Airbnb coral #FF5A3C / neutral blue). Type Helvetica-family sans, mid-size bold one-sentence titles, short body lines with wide spacing. Masters: ① centered logo + slogan ② a top one-sentence title band + three-column parallel below (Problem/Solution, three points each) ③ TAM large-number tiers ④ 2×2 competitive matrix. Signature: top title band, three-column parallelism, single-color accent, 2×2 matrix.
- HTML implementation: Flexbox three-column parallelism; 2×2 matrix in pure CSS Grid + borders; TAM tiers via nested divs or concentric squares; one message per page. Almost purely a typographic grid — an ideal HTML subject.
- Type: Inter / Helvetica Now for Helvetica; Inter for body
- Specimen: assets/style-specimens/ppt/16-institutional-swiss.jpg

**Magazine Editorial Longform Flow — Editorial Longform** `quiet · fidelity 95%`
- Reference: Stripe Annual Letter ($1.9T), Amazon's six-page narrative memo, Benedict Evans' "X eats the world", Stripe Press
- Fit: annual letters/retrospective narratives, deep thought long-reads, internal updates, research-grade reading material
- Visual DNA: cream/off-white ground (#FBFAF8) + deep ink type + brand color accents (Stripe purple #635BFF). Type serif or high-quality sans, essay-style paragraphs + inline data cards, oversized display numbers interspersed. Masters: ① masthead large title ② multi-column essay + inline metric cards ③ an oversized number as a paragraph anchor. Signature: publication reading rhythm, inline data cards, restrained whitespace, essay prose instead of bullets.
- HTML implementation: multi-column column-count or Grid; inline data cards floated/inline-blocked into the body; serif body with max-width at 65ch; oversized numbers interspersed. Pure typography, zero assets.
- Type: Newsreader / Source Serif body + Inter support; tabular numbers
- Specimen: assets/style-specimens/ppt/17-editorial-longform.jpg

**Humanist Rounded Cards (Khan style)** `quiet · fidelity 80%`
- Reference: Khan Academy's Wonder Blocks design system, Source Serif Pro, forest green brand, friendly humanism
- Fit: education products, approachable courseware, nonprofit/NGO decks, warm brand proposals
- Visual DNA: forest green #14BF96/#0A5C4B + cream ground + warm secondary colors, soft and not harsh. Type Source Serif serif headlines (humanist feel) + sans body. Masters: ① a group of rounded card components ② serif titles + approachable body ③ real photography slots (degraded to green-family geometry/rounded blocks). Signature: forest green, serif titles, large-radius cards, humanist warmth, imperfect approachable texture.
- HTML implementation: large border-radius cards + soft box-shadow; serif headlines via font-family; warm cream ground. The real teacher-student photography item can't be generated — degrade to green-family geometric illustration blocks/large-radius flat placeholders + emoji figures; missing photos cost roughly 18% fidelity.
- Type: Source Serif 4 headlines + Nunito Sans / Inter body (Nunito's roundness echoes the humanism)
- Specimen: assets/style-specimens/ppt/18-humanist-rounded-cards.jpg

**Dense Research Report (Meeker style)** `quiet · fidelity 92%`
- Reference: Mary Meeker's "Internet Trends" (BOND), CB Insights' "State of AI", McKinsey Global Institute's "Year in Charts", FT/Bloomberg data journalism
- Fit: trend research reports, industry data retrospectives, dense data reporting, market maps
- Visual DNA: white ground + brand color (BOND/CB Insights bright blue #0066FF) as a stepped monochrome highlight with everything else grayed, almost zero whitespace. Type conclusive sentence headlines, one figure of density per page, tiny source footnotes. Masters: ① conclusion-sentence title + full-page single figure ② logo-grid market map ③ large-number KPI cards ④ dense multi-figure grid + footnotes. Signature: conclusion-sentence titles, zero-whitespace research-report feel, stepped monochrome highlighting, logo market maps, disciplined source footnotes.
- HTML implementation: dense charts all drawn in pure CSS/inline SVG (bars/lines/stacked/scatter); logo market maps via Grid + text/SVG placeholder cells; KPI cards in CSS; small-footnote type. Extreme information density is exactly what HTML is good at, zero assets.
- Type: Inter + IBM Plex Sans + tabular Geist Mono for numbers
- Specimen: assets/style-specimens/ppt/19-dense-research-report.jpg

**All-Text Manifesto (Netflix/Amazon style)** `quiet · fidelity 97%`
- Reference: Netflix Culture Deck (2009, 125 pages), Amazon's six-page narrative memo (Bezos), Tufte's anti-PowerPoint argument, Matthew Carter-grade reading typography
- Fit: culture manifestos, values talks, deep memos, anti-PPT pure-document presentations
- Visual DNA: pure white or pure black ground + a single accent (Netflix red #E50914) as the only highlight, extreme restraint. Type reading-grade typography, one point per page as a maxim/assertion or pure prose with zero bullets and zero images. Masters: ① full-bleed ground + maxim assertion ② colloquial candid paragraphs ③ institutional terms highlighted (Keeper Test) ④ six pages of prose + appendix tables. Signature: all-text one-point-per-page, zero images zero bullets, single-color highlighted maxims, candid colloquial voice, silent-read document feel.
- HTML implementation: pure typography: maxims as large clamp() type in a left-aligned hierarchy; prose with max-width capping line length; the single accent color as a span highlighting key phrases; the appendix as a minimal table. Zero assets zero images — pure text is HTML's most reliable reproduction.
- Type: Newsreader / Source Serif (reading grade) or Inter (manifesto style); headlines can be Archivo extra-bold
- Specimen: assets/style-specimens/ppt/20-all-text-manifesto.jpg


---

## Infographic Style Library (20 styles)

> **Added 2026-08.** Until then this library had only two halves, web and PPT, yet "infographic / visualization" is one of the four applicable scenarios in the SKILL — when making an infographic the wheel could only land in the web half and pull a community-site or landing-page style, then force it on. This half fills that hole.
> Criterion: **if the deliverable is one image (or a set of images) with data as the protagonist, readable standalone without interaction**, come here; a clickable site goes to the web section, and something you page through goes to the PPT section.

#### Bold school

**Personal Annual Report (Feltron style)** `Bold · 94% fidelity`
- Reference: Nicholas Felton, *Feltron Annual Report* 2005–2014 (the 2006–2011 editions entered MoMA's permanent collection); Stefanie Posavec; Bloomberg Businessweek year-end special issues
- Fit: personal or team annual summaries, quantified self, product year-in-review, Wrapped-style recaps, long-cycle self-audits
- Visual DNA: palette = warm white uncoated-paper ground + a single vermilion running accent + slate blue for the second data series + a third color bound to exactly one meaning, never reused. Type = tightly set Helvetica family, giant numerals on top, dense small-type footnotes. Four-part master: ① giant-number module strip ② polar period charts (24h / 12 months) ③ calendar heatmap grid ④ a time or geography band running the full width. Signature = the contrast of treating private, trivial data like a corporate annual report, modular print grid, 1px rules, still readable in black-and-white print
- HTML implementation: CSS Grid split into modules + 1px borders cutting the grid; polar charts as inline SVG with hand-computed polar angles (no chart library); calendar via Grid with child element heights filling. Pure layout + SVG, zero material, a strong suit for HTML
- Fonts: Archivo / Helvetica Neue (tight-set giant numerals) + Inter (small footnotes)
- Specimen: assets/style-specimens/info/01-personal-annual-report.jpg

**Explanation Graphics (Nigel Holmes style)** `Bold · 76% fidelity`
- Reference: Nigel Holmes (graphics director at TIME 1978–1994, founded Explanation Graphics in 1994); his thesis is to explain abstract numbers with pictures and humor, and he is also the bullseye of the chartjunk debate
- Fit: popular-science explanation, explaining complex concepts to lay readers, op-ed illustration in mass media, children's and educational material
- Visual DNA: palette = high-saturation flat three or four colors + black outline. Type = rounded sans + handwriting-feel annotation. Master = draw the chart itself as a physical metaphor (stacks of banknotes as columns, a thermometer as a gauge, a running track as a progress bar). Signature = skeuomorphic charts, humor, little figures, thick outlines, zero gradients
- HTML implementation: the chart skeleton is doable in CSS/SVG, **the soul is in the hand-drawn illustration** — under pure HTML you can only degrade to geometric blocks, and you must label the degradation explicitly; when image generation is available, use `huashu-gpt-image` to generate the illustration elements and composite them
- Fonts: Nunito / Baloo 2 (rounded) + Caveat (handwritten annotation)
- Specimen: assets/style-specimens/info/02-explanation-graphics.jpg

**Cross-Section Epic (SCMP Arranz style)** `Bold · 55% fidelity`
- Reference: Adolfo Arranz (senior graphics editor at SCMP, multiple gold awards at Malofiej, the international infographics prize; best known for the Kowloon Walled City cross-section *City of Anarchy*); Malofiej is called the Pulitzer of infographics
- Fit: architecture / history / object anatomy, a single sheet you read for ten minutes, museum-grade popular science
- Visual DNA: palette = dark ground (deep ink / deep brown) + warm highlights + aged-paper texture. Composition = one huge sheet, isometric or straight-on section view, dense leader-line callouts surrounding the subject. Signature = hand-drawn detail, callout lines, section view, one image telling the whole story
- HTML implementation: 🔴 **pure HTML cannot produce a hand-drawn cross-section** — this style needs illustration material; without material, do not pretend. HTML only carries the callout layer and the zoom/scroll interaction. If you cannot get material, switch style
- Fonts: Source Serif (titles) + Inter (callouts)
- Specimen: assets/style-specimens/info/03-cross-section-epic.jpg

**Magazine Pop Data (Businessweek style)** `Bold · 90% fidelity`
- Reference: Bloomberg Businessweek (the Richard Turley era), WIRED chart pages, The Economist's Graphic Detail column
- Fit: business/tech media charts, op-ed illustration, social square images, data figures embedded in WeChat posts
- Visual DNA: palette = two clashing primaries (fluorescent yellow + black, magenta + navy) + paper-white space, no third color to mediate. Type = ultra-bold condensed display + tiny caption type, a size jump of 10× or more. Master = one argument per image, the chart itself is the layout's protagonist, the headline states the conclusion. Signature = extreme type-size contrast, clashing color, chart bleeding off the margins, conclusion-style headlines
- HTML implementation: fully reproducible in pure CSS; charts as inline SVG or CSS Grid bars; bleed via negative margins. Zero material
- Fonts: Archivo Black / Anton (condensed bold) + IBM Plex Sans (captions)
- Specimen: assets/style-specimens/info/04-magazine-pop-data.jpg

**ISOTYPE Pictorial Statistics / Neurath–Arntz** `Bold · 88% fidelity`
- Reference: the ISOTYPE international system of pictorial education, founded by Otto Neurath and Gerd Arntz in 1920s Vienna
- Fit: population/social/public-policy data, public communication for low-literacy audiences, educational posters
- Visual DNA: palette = limited spot colors (black + red + blue + ochre) flat, no gradients, no shadows. Master = repeat the same icon N times to show quantity — **enlarging an icon to show "more" is wrong**, the most central rule of this system. Signature = silhouette icon arrays, horizontal rows, text labels at left, an extremely strong sense of order
- HTML implementation: icons as inline SVG silhouettes + CSS repeat layout, HTML fits this naturally. Icons can be drawn as geometric silhouettes yourself, no external material needed
- Fonts: Jost / Archivo (Futura substitutes)
- Specimen: assets/style-specimens/info/05-isotype.jpg

**Data Humanism (Lupi style)** `Bold · 80% fidelity`
- Reference: Giorgia Lupi (Pentagram partner) and Stefanie Posavec, *Dear Data*; Lupi's Data Humanism manifesto holds that "data is people, not numbers"
- Fit: personal and emotional data, deep description of small samples, turning private experience into a readable atlas, subjects with many non-quantifiable dimensions
- Visual DNA: palette = journal off-white ground + four or five soft colors each bound to a meaning (coral / pine green / mustard / ink purple), **not one color is decoration**. Master = ① define a visual language first (size / shape / spikes / tail each encode one dimension) ② always include a legend that teaches the reader to decode ③ place elements along organic paths, not on a grid. Signature = decodable custom symbols, legend always present, organic arrangement
- HTML implementation: symbols generated parametrically as inline SVG (radius / spike count / tail length bound to data fields); paths drawn as Bézier curves through the points. Pure SVG, zero material; the only thing you cannot do is a real hand-drawn stroke
- Fonts: Georgia / Source Serif (titles) + Inter (legend)
- Specimen: assets/style-specimens/info/06-data-humanism.jpg

**Scrollytelling (The Pudding style)** `Bold · 85% fidelity`
- Reference: The Pudding (data-journalism magazine), NYT The Upshot, Reuters Graphics scroll features
- Fit: complex arguments that need step-by-step reveal, long data stories, web features
- Visual DNA: palette shifts by chapter but keeps a single accent running through. Master = text steps on the left, the graphic on the right morphs with scroll; each screen advances exactly one variable. Signature = the graphic never swaps, only morphs; text and graphic strictly bound; chapter color shifts; a complete panorama at the end
- HTML implementation: IntersectionObserver to trigger state changes + CSS transitions or SVG attribute interpolation, fully reproducible in pure front end. ⚠️ The deliverable must be a web page, **exporting PDF/PNG throws away the entire narrative** — do not pick this when the user wants a static image
- Fonts: Inter / Source Serif (long-text readability first)
- Specimen: assets/style-specimens/info/07-scrollytelling.jpg

**Cartographic Lead (Stamen style)** `Bold · 65% fidelity`
- Reference: Stamen Design (founded by Eric Rodenbeck in San Francisco in 2001, clients include National Geographic); its Watercolor / Toner map tiles are a public classic
- Fit: geographic distribution data, city/transit/environment subjects, content where location is the narrative
- Visual DNA: palette = the basemap sets the key (watercolor or single-color Toner) + the data layer in high-contrast points and lines. Master = the map fills the margins, data overlaid as dot density or flow lines, a tiny legend tucked into a corner. Signature = the basemap itself has authorship, a restrained data layer, geographic shape as composition
- HTML implementation: 🔴 **needs real geographic data (GeoJSON) and a basemap**; pure HTML cannot conjure correct terrain out of nothing — if you cannot get the data, switch style, **never hand-draw a fake map**. With data, draw it with an inline SVG projection
- Fonts: Inter / IBM Plex Sans (place labels need a lot of small type)
- Specimen: assets/style-specimens/info/08-cartographic-lead.jpg

#### Neutral school

**Newsroom Chart System (FT style)** `Neutral · 96% fidelity`
- Reference: the Financial Times Chart Doctor team and its published Visual Vocabulary (choose the chart by relationship: Deviation / Correlation / Ranking / Distribution / Change-over-Time / Part-to-Whole / Magnitude / Spatial)
- Fit: financial and industry data, occasions where "picking the right chart type" matters more than "looking good", series of charts that need one shared spec
- Visual DNA: palette = the signature pink-orange newsprint ground + an ordered color ramp (single-hue gradient for continuous quantities, a contrasting pair for deviation). Master = ① the title is the conclusion ② the subtitle states the definitions ③ the chart body drops borders and gridlines ④ the data source always sits in the lower left. Signature = choose the chart type by data relationship before aesthetics, source attribution is non-negotiable, minimal axes
- HTML implementation: pure CSS/SVG lines and bars; the key is **consult the Visual Vocabulary and pick the right chart type first**, then build. Zero material
- Fonts: Inter / Source Sans (body) + a mono for numbers
- Specimen: assets/style-specimens/info/09-newsroom-chart.jpg

**Computational Portrait (Fathom style)** `Neutral · 78% fidelity`
- Reference: Ben Fry and his Boston studio Fathom Information Design (Fry co-created Processing, wrote *Visualizing Data*, and has shown at the Whitney Biennial)
- Fit: very large datasets, subjects where you must "let the data grow its own shape", genomic / transit / time-series data
- Visual DNA: palette = white or near-black ground + hairline strokes + single-hue opacity stacked into density. Master = no summarization, full presentation; the shape emerges from the stacked density of an enormous number of fine elements. Signature = hairline strokes, opacity stacking, no decoration, the shape decided by algorithm rather than by layout
- HTML implementation: Canvas, or programmatic drawing of a large number of SVG paths; with large data you must use Canvas. **Requires real, complete data** — a small sample cannot produce this style's sense of density
- Fonts: Inter / Roboto Mono (data labels)
- Specimen: assets/style-specimens/info/10-computational-portrait.jpg

**Beautiful Information (McCandless style)** `Neutral · 90% fidelity`
- Reference: David McCandless, *Information is Beautiful* and the website of the same name, known for turning large datasets into colorful graphics that compare at a glance
- Fit: popular-science comparison, rankings, mass-market data aggregation, social-media-friendly charts
- Visual DNA: palette = many colors, but a harmonious wheel at the same lightness and saturation (not random clashes). Master = chart types where "area equals quantity" — bubble charts / treemaps / Sankey diagrams — with labels pressed directly onto the color blocks. Signature = area encoding, multi-hue harmony, embedded legend, dozens of entries in one image
- HTML implementation: treemaps and bubbles laid out with CSS Grid or SVG computation (you need to write a simple bin-packing algorithm); Sankey via SVG Béziers. Zero material
- Fonts: Nunito Sans / Inter
- Specimen: assets/style-specimens/info/11-beautiful-information.jpg

**Open Research Data (Our World in Data style)** `Neutral · 94% fidelity`
- Reference: Our World in Data (Oxford's Global Change Data Lab); the rules are interactive charts, clearly stated definitions, downloadable data
- Fit: rigorous topics, data presentations that must withstand scrutiny, long-run trend comparison
- Visual DNA: palette = white ground + a set of categorical colors with high separation but no glare + gray for de-emphasized series. Master = ① a one-sentence conclusion as the title ② definitions and time range written in the subtitle ③ label series directly at the line end inside the chart (no legend) ④ source and license in the footer. Signature = end-of-line labels instead of a legend, de-emphasized series in gray, transparent definitions, restraint
- HTML implementation: pure SVG polylines + text positioned at the end, the most reliable kind for HTML. Zero material
- Fonts: Inter / Lato
- Specimen: assets/style-specimens/info/12-open-research-data.jpg

**Speculative Tech Diagram (Takram style)** `Neutral · 84% fidelity`
- Reference: Takram (design engineering studio in Tokyo and London, a speculative design practice spanning design and engineering)
- Fit: technical concept diagrams, future-scenario exploration, research white-paper figures, product architecture narratives
- Visual DNA: palette = a sand-gray ground + low-saturation natural colors (moss green / terracotta) + one metallic gray. Type = light weights, wide tracking, carefully mixed Chinese and Latin text. Master = the diagram arranged as an artwork, generous whitespace, geometric shapes with a sense of precision. Signature = soft tech feel, precise geometry, restrained natural color, charts like installations
- HTML implementation: reproducible in pure CSS/SVG; the key is the whitespace ratio and restrained stroke width (0.5–1px). Zero material
- Fonts: Inter (light weights) / Noto Sans JP + Cormorant (optional display)
- Specimen: assets/style-specimens/info/13-speculative-tech-diagram.jpg

**Pictogram System (Otl Aicher style)** `Neutral · 92% fidelity`
- Reference: Otl Aicher's icon system for the 1972 Munich Olympics and the Ulm School's grid method
- Fit: flowcharts, wayfinding and guide infographics, multilingual contexts, cases that need a whole icon set to stay consistent
- Visual DNA: palette = a restricted palette (light blue / green / silver in the Olympic version) + black. Master = every icon shares one grid and one stroke angle (only 0 / 45 / 90°), icons paired with short labels. Signature = strict angle constraint, system consistency, sans-serif short labels, visible grid
- HTML implementation: icons drawn as inline SVG under the 45° constraint; the grid via CSS Grid. Zero material, but you must hold the angle discipline yourself
- Fonts: Jost / Archivo (Univers substitutes)
- Specimen: assets/style-specimens/info/14-pictogram-system.jpg

#### Quiet school

**Small Multiples (Tufte style)** `Quiet · 95% fidelity`
- Reference: the small multiples and sparkline concepts in Edward Tufte's *Envisioning Information*
- Fit: multi-dimensional side-by-side comparison, grouped time series, one variable across dozens of slices
- Visual DNA: palette = white ground + black strokes + one accent marking outliers. Master = the same small chart repeated N times with only the data changing, **sharing the axis domain — if the domains differ, comparability is gone; this is the only fatal error in this school**; labels tiny beside the chart. Signature = gridded repeated small charts, shared scales, zero legend, zero gridlines, high data-ink ratio
- HTML implementation: CSS Grid for the small charts + inline SVG polyline per cell. Be sure to share the domain. Zero material
- Fonts: Source Serif (titles) + Inter (small labels)
- Specimen: assets/style-specimens/info/15-small-multiples.jpg

**Topological Transit Map (Beck / Vignelli style)** `Quiet · 86% fidelity`
- Reference: Harry Beck's 1933 London Underground map, Massimo Vignelli's 1972 New York subway map
- Fit: processes and relationship networks, org charts, system topology, any diagram where "connections matter more than true distance"
- Visual DNA: palette = white or light ground + one saturated pure hue per line. Master = all segments run only at 0 / 45 / 90°, stations evenly spaced — **sacrificing geographic accuracy for readability** is this school's reason to exist; interchanges are open circles. Signature = eight-direction constraint, equidistant nodes, pure-color lines, open nodes
- HTML implementation: inline SVG polyline with strict angle constraints; nodes as circles. Pure geometry, a perfect fit for HTML
- Fonts: Jost / Inter (station names may be all caps)
- Specimen: assets/style-specimens/info/16-topological-transit-map.jpg

**Ma & Emptiness (Kenya Hara style)** `Quiet · 82% fidelity`
- Reference: Kenya Hara's *White* and the MUJI visual system — "whitespace is not emptiness, it is a vessel that holds imagination"
- Fit: brand annual reports, slow-paced narrative, a small amount of important data, occasions that need gravitas
- Visual DNA: palette = pure white or rice-paper white + very light gray + one tiny point of ink or vermilion. Master = one datum per screen, huge whitespace, elements placed on the edge or at a golden position, never filled. Signature = extreme whitespace, single-point emphasis, lines so fine they nearly vanish, the East Asian sense of "ma" (interval)
- HTML implementation: pure CSS layout. 🔴 **the riskiest style in this library** — whitespace must be composition (with an explicit visual anchor); overdone it just reads as "the page broke"; body text must still be ≥14px, never shrink type for the mood
- Fonts: Noto Serif SC / Source Han Serif + Inter
- Specimen: assets/style-specimens/info/17-ma-emptiness.jpg

**Bookcraft Data (Irma Boom style)** `Quiet · 80% fidelity`
- Reference: Irma Boom (Dutch book designer, work in MoMA's permanent collection, known for extreme typographic and material experiment)
- Fit: long data reports, annual reports meant to be collected as publications, deep content with mixed text and image
- Visual DNA: palette = paper color + one or two ink colors, large color blocks pressing the page. Type = typography itself is the protagonist, extreme size range, asymmetric margins, text may run vertically or rotated. Master = data embedded in the text flow, section pages separated by full-bleed color blocks. Signature = asymmetric type area, extreme size jumps, typographic experiment, publication feel
- HTML implementation: CSS multi-column + writing-mode for vertical setting; asymmetric type area via Grid. **What you cannot do is paper material and trimming** — on screen you must compensate with typographic tension
- Fonts: Fraunces / EB Garamond + Archivo (contrast)
- Specimen: assets/style-specimens/info/18-bookcraft-data.jpg

**Scientific Figure Plate** `Quiet · 96% fidelity`
- Reference: the figure conventions of Nature and Science, the public science plates of USGS and NASA
- Fit: research conclusions, method comparison, rigorous data that needs a peer-review feel, multi-panel composites
- Visual DNA: palette = white ground + a colorblind-safe palette (blue-orange contrast rather than red-green) + grayscale. Master = panels labeled (a)(b)(c), the caption as a paragraph below the figure, error bars and sample size always marked, axes with tick marks. Signature = panel letters, long caption below the figure, error bars, colorblind safe, zero decoration
- HTML implementation: CSS Grid for the panels + SVG for the plots and error bars; the caption as a small-type paragraph. Zero material, HTML is fully up to it
- Fonts: Inter / Source Sans + Roboto Mono (numbers)
- Specimen: assets/style-specimens/info/19-scientific-figure-plate.jpg

**Swiss Grid Report (Müller-Brockmann style)** `Quiet · 97% fidelity`
- Reference: Josef Müller-Brockmann, *Grid Systems in Graphic Design*, the Ulm School, the Swiss International Style annual-report tradition
- Fit: corporate annual reports, institutional reports, series of documents that must hold one layout over the long term
- Visual DNA: palette = white ground + black + a single accent. Master = a strict modular grid (often 12 columns), every element snapped to column lines, flush left with ragged right, plenty of breathing whitespace that is never empty. Signature = visible grid logic, Helvetica family, non-centered setting, hierarchy through size and spacing rather than ornament
- HTML implementation: CSS Grid maps directly onto a column grid; the style in this library most isomorphic with HTML. Zero material
- Fonts: Inter / Archivo (Helvetica substitutes)
- Specimen: assets/style-specimens/info/20-swiss-grid-report.jpg

---

## App Style Library (12 styles)

> Added 2026-10. Use this section for App / mobile prototypes (before this you could only borrow from the web section and pull a landing-page style). The specimen is a showcase board: two or three phone screens, and the composition itself is a demo (see "showcase board" in `references/app-prototype.md`).

#### Bold school

**Hardware Panel (Teenage Engineering style, the interface language of OP-1 / EP-133)** `Bold · 85% fidelity`
- Reference: Teenage Engineering OP-1 / EP-133 K.O. II (orange, black and gray palette, the "super segment hybrid display" dot-matrix hybrid display, grid-arranged square keys and knobs, silkscreen-style labeling)
- Fit: audio/creative tools, samplers, metronomes, recording apps and hardware companion apps, geek-oriented utilities
- Visual DNA: palette near-black #0B0B0B screen + signal orange #FF5A1F + cream white #E9E9E4 keys, light gray #D8D8D4 faceplate with fine grid lines. Type dot-matrix / monospace, numbers like liquid-crystal readouts, labels like silkscreen (all caps + wide tracking). Layout on a strict square grid, 4×4 key arrays, round knobs with a single-color pointer, faders with orange tick marks; keys express physical thickness with "pressed-in depth" (inset 4px bottom shadow). Signature elements: dot-matrix large readout, square keys, silkscreen micro-labels, only one accent color (orange) per screen.
- HTML implementation: CSS Grid for the key array + aspect-ratio:1; knobs via radial-gradient + pseudo-element pointer rotate; faders as absolutely positioned bars; use Doto for the dot-matrix font, falling back to Space Mono; use repeating grid lines for the showcase-board background to simulate the faceplate. Note that orange is only for "currently active" — do not flood the screen with it.
- Fonts: Doto (dot-matrix readouts) + Space Mono (labels), Noto Sans SC for Chinese labels
- Specimen: assets/style-specimens/app/01-hardware-panel.jpg

**Liquid Glass (Apple's new design language for iOS 26)** `Bold · 70% fidelity`
- Reference: Apple Liquid Glass, announced at WWDC 2025 and shipped with iOS 26 / macOS Tahoe 26 and the rest; Apple describes it as a translucent material that refracts surrounding content and responds dynamically to touch, used for controls, navigation, icons and widgets
- Fit: weather / fitness / media apps that should feel native, system-style utilities, interfaces where "content first, controls floating", concept demos
- Visual DNA: the palette is decided by the background content itself — a high-saturation gradient ground (coral orange → magenta → indigo, or teal → mint), controls are translucent white glass. Type is a system sans, large numbers tightly tracked. Layout fills the screen with content, and controls (back button, tab bar, bottom sheet) "float" on top as rounded capsules / large-radius panels; the tab bar is a floating capsule rather than a full-width bar pinned to the bottom. Signature elements: white gradient highlight stroke, top inner highlight, background blur + boosted saturation, circular / capsule controls.
- HTML implementation: backdrop-filter:blur(22px) saturate(180%) + translucent white gradient background + 1px white stroke + inset highlight shadow is the core; the background must be a gradient with tonal depth or the glass will not read, and on a flat color the glass is just a gray block. CSS cannot do refraction or specular highlights, so degrade to a highlight stroke and say so in the deliverable.
- Fonts: Inter (in place of SF Pro) + Noto Sans SC
- Specimen: assets/style-specimens/app/02-liquid-glass.jpg

**Playful Tactile (the Not Boring series, Andy Works)** `Bold · 70% fidelity`
- Reference: the (Not Boring) series of apps (Andy Works, founded by Andy Allen and Mark Dawson; includes Weather, Calculator, Timer, Habits); (Not Boring) Habits won a 2022 Apple Design Award; characterized by saturated color, haptic feedback and 3D animation, turning plain utilities into a "bold, brash" experience
- Fit: small utilities such as timers / habits / weather / calculators, light tools for younger users, apps where you want one feature to be "fun enough to screenshot"
- Visual DNA: one full-bleed saturated primary per screen (orange #FF7A2D, lavender #B6A2FF, acid green #D4FF3F), paired with near-black #1B1330 text. Type is bold and rounded at large size for numbers, tightly tracked. Layout gives each screen one protagonist (a huge dial / temperature tube / switch) with everything else around it; cards are slightly rotated, and screens are staggered against each other. Signature elements: buttons with thickness (solid hard shadow along the bottom edge), raised dials with specular highlights, switches that "press in".
- HTML implementation: layer multiple box-shadows to build thickness (solid bottom edge + inner highlight + soft outer shadow), radial-gradient for the spherical highlight, rotate for the stagger. A static image can only show the material; haptics and motion are just written as transitions in HTML — label that honestly.
- Fonts: Bricolage Grotesque (800) + Noto Sans SC (900)
- Specimen: assets/style-specimens/app/03-playful-3d.jpg

**Friendly Fintech (Monzo style, high-saturation brand color + large radii)** `Bold · 90% fidelity`
- Reference: Monzo (brand primary Hot Coral around #FF4F40, from the signature translucent coral bank card; paired with deep navy #091723–#14233C, a rounded humanist sans, capsule buttons, colloquial copy)
- Fit: personal budgeting, savings/budgets, payments and transfers, financial products for younger users, any case where "serious money" must sound friendly
- Visual DNA: coral #FF4F40 floods the top area on a white rounded base panel, jars/categories use pastel blocks (yellow #FFD66B, blue #9AD8FF, green #C8F0CE, pink #F9B9E8, purple #D8CBFF). Type is a rounded geometric / humanist sans, the balance set bold at 58px or more. Layout puts the balance and three capsule actions in the colored top area, with the white panel below rising like a drawer; budgets are two-column large-radius blocks, the "jars". Signature elements: full-bleed brand color, radii of 34px or more, capsule buttons, initial-letter / color-block icons, colloquial subheads ("where the money went").
- HTML implementation: pure CSS reproduces it 1:1. border-radius:28~34px, a two-column grid, solid color blocks, progress bars as two nested divs. Do not draw literal icons — use a single letter plus a light/dark tint of the same hue.
- Fonts: Figtree (in place of Monzo's own MonzoSans) + Noto Sans SC
- Specimen: assets/style-specimens/app/04-friendly-fintech.jpg

**Pro Camera (Halide style, dark + yellow accent + dense scales)** `Bold · 85% fidelity`
- Reference: Halide (Lux Optics, Apple Design Award winner; the interface is designed for one-handed operation and inspired by the controls on professional camera bodies; the custom typeface Ambrotype mimics engraved lettering on film-camera bodies; it offers histogram, waveform, color zebras (highlight-clipping warning) and focus peaking views)
- Fit: camera / recording / measurement / oscilloscope-class professional tools, interfaces that need "read at a glance, adjust one-handed", apps used in low light
- Visual DNA: pure black #000 ground + bright yellow #FFCC00 accent (only for "the parameter currently selected" and the center tick) + gray-white #EDEDED readouts. Yellow is this style's own choice, not a claim about Halide's actual palette. Type is monospaced numerals, parameter labels small with wide tracking. Layout: the viewfinder on top, the lower half fixed as "parameter row (shutter / ISO / exposure / white balance) + horizontal scale + shutter button"; the scale fades out at both ends with a yellow line at center. Signature elements: dense tick scales, zebra highlight warning, translucent histogram, exactly one yellow focus point per screen.
- HTML implementation: repeating-linear-gradient for the ticks (short tick 2px/14px, long tick 2px/70px as two layers), mask-image for the fade at both ends; zebras via repeating-linear-gradient 135deg; the viewfinder area as a gradient placeholder plus a "photo slot". Keep yellow to no more than three places.
- Fonts: JetBrains Mono (numbers and scales) + Noto Sans SC (labels)
- Specimen: assets/style-specimens/app/05-pro-camera.jpg

#### Neutral school

**Topo Outdoor (Gaia GPS / AllTrails style, contours and tracks)** `Neutral · 90% fidelity`
- Reference: Gaia GPS (known for its Gaia Topo maps with contours and hillshade); AllTrails (route pages lead with distance, difficulty and elevation gain)
- Fit: hiking / cycling / trail routes, outdoor logging, camping and map tools, mobile interfaces where "the map is the protagonist"
- Visual DNA: parchment tan #EFEBDA ground + contour brown #C09A68 (every fifth line thickened as an index contour) + woodland light green #D8E4C4 + water light blue #BFDDE6, the track in high-contrast orange-red #E4572E with a white outline. Type is a narrow face for numbers (large readouts) + a Chinese sans. Layout: the map fills the screen, a white panel at the bottom holds three large numbers — distance / elevation gain / time — plus an elevation profile; each card in the list view carries a mini contour thumbnail + a difficulty swatch (yellow / green / red). Signature elements: contour lines, track line with white outline, elevation profile area chart, difficulty swatches.
- HTML implementation: SVG path for the contours (nested irregular closed curves, index contours with thicker stroke), the track as two paths (thick white under a thin orange); the showcase-board background continues the same contour set. Contours must be irregular curves — perfectly circular or concentric ellipses read as fake instantly.
- Fonts: Barlow Condensed (readouts) + Noto Sans SC
- Specimen: assets/style-specimens/app/06-topo-outdoor.jpg

**Feed Waterfall (Xiaohongshu-style two-column card feed)** `Neutral · 92% fidelity`
- Reference: the Xiaohongshu home "Discover" two-column waterfall (cards staggered at their true aspect ratios, image on top, two-line title, author and likes below, channel tabs at the top, a red plus button in the middle of the bottom navigation)
- Fit: content communities, recommendation/guide/shop-visit apps, e-commerce content feeds, any Chinese-language product whose decision entry point is "cover image + title"
- Visual DNA: white cards #FFF on a light gray ground #F5F5F7, the brand red #FF2442 only for the selected underline, the plus button, follow and the liked state. Type is a system Chinese sans, titles 15px truncated at two lines. Layout is two columns, 6px gap, 10px card radius, with covers at differing ratios (roughly 1:1 to 3:4) producing the stagger; each card's footer is one fixed row of author avatar + name + like count. Signature elements: staggered cover heights, two-line titles, the avatar + name + likes row, the red plus.
- HTML implementation: two flex columns, each flex-direction:column, cards flex:none, covers as gradient placeholders at different heights marked "photo slot"; titles with -webkit-line-clamp:2; avatars as initial-letter circles — do not draw portraits.
- Fonts: Noto Sans SC
- Specimen: assets/style-specimens/app/07-feed-waterfall.jpg

**Command Palette (Raycast style)** `Neutral · 90% fidelity`
- Reference: Raycast (near-black ground around #07080A, 1px hairline border around #242728, Inter for body with monospace keycaps; commands marked with small color-block icons, shortcuts right-aligned; hierarchy expressed with tonal steps rather than shadows)
- Fit: developer tools, productivity tools, CLI companion apps, internal ops panels, any product where "search is the action"
- Visual DNA: near-black #07080A canvas + panel #121315 + selected row #202225, command icons as saturated small color blocks (red #FF6363, blue #52A9FF, green #59D499, purple #8A63F5, yellow #FFC531). Type: Inter for body + monospace for keycaps/logs. Layout: a single input row at the top (cursor as a red bar), below it a single-column list grouped under "Suggestions / Commands", each row: small color-block icon + name + gray subtitle + right-aligned keycap; a fixed action bar at the bottom ("Open Command ↵" / "More Actions ⌘K"). Signature elements: gradient keycaps, group subheads, light gray highlight on the selected row, the bottom action bar. Raycast itself is a desktop app; the specimen presents it as "a crop of the desktop panel plus a phone adaptation".
- HTML implementation: flex rows + hairline borders; keycaps with a gradient background + darker border-bottom + 0 2px 0 shadow; no large shadows overall, only one dark drop shadow on the outer layer.
- Fonts: Inter + JetBrains Mono (keycaps and logs) + Noto Sans SC
- Specimen: assets/style-specimens/app/08-command-palette.jpg

**Health Color-Code (Apple Health / Oura style)** `Neutral · 92% fidelity`
- Reference: Apple Health / activity rings (three concentric rings in red, green and blue on black, for move, exercise and stand); Oura (Readiness / Sleep / Activity each scored 0–100, blue meaning good, yellow fair, red needs attention)
- Fit: health / sleep / fitness / vitals products, any dashboard that compresses a pile of metrics into "how am I today", wearable companion apps
- Visual DNA: pure black #000 ground + cards #1C1C1E, semantic status colors (blue #3498FF best, yellow #FFCC00 fair, red #FF453A attention), ring colors (#FA114F, #92E82A, #1EEAEF). Type is a bold large score (76px or more) + small gray labels. Layout: one large ring / large score at the top as the protagonist, then cards: component bars, sleep-stage columns, a trend line over a normal-range band; each metric gets a small status capsule (good / low / high). Signature elements: ring progress, status capsules, the translucent "normal range" band, color as conclusion.
- HTML implementation: SVG circle + stroke-dasharray for the rings (track in the same hue at low luminance), bars as two nested divs, the range band as a translucent rect; status capsule = translucent background + same-hue text. Keep status colors and ring colors separate on one screen — do not blend them into a rainbow.
- Fonts: Inter + Noto Sans SC
- Specimen: assets/style-specimens/app/09-health-color-code.jpg

#### Quiet school

**Native Polish (Things 3 style, Cultured Code)** `Quiet · 95% fidelity`
- Reference: Things 3 (Cultured Code, Stuttgart, Germany; two-time Apple Design Award winner; its site quotes a review saying the interface is "like a clean, crisp sheet of paper"; "Today" contains an "This Evening" section, lists can take heading separators, tasks expand into cards, and a draggable Magic Plus button sits at the lower right)
- Fit: task / to-do / notes / calendar productivity apps that should feel native, heavily used personal tools, products aiming for "still comfortable after long use"
- Visual DNA: pure white #FFF + near-black text #1D1D1F + one blue #3478F6 (only for checkmarks, links and the plus button), yellow star #F6C21B for "Today", gray #8A8F9B for secondary information. Type is a system sans, the large title 32px bold and tightly tracked. Layout is list-first, with an indented hairline between rows (starting to the right of the checkbox), group headings in small bold type with an underline; a task expands into a floating card with a large shadow holding notes, checklist, tags and due date. Signature elements: rounded-square checkbox, indented hairlines, the "This Evening" moon section, floating task card, blue circular plus.
- HTML implementation: pure CSS reproduces it. Checkbox with border:2px + border-radius:7px, completed state as a gray fill + pseudo-element tick; row separators via :after with left indent; the task card with a two-layer shadow (0 2px 6px + 0 26px 60px). Motion (expanding, checking) cannot be shown in a static image — build the structure only.
- Fonts: Inter (can degrade to the system stack for an iOS feel) + Noto Sans SC
- Specimen: assets/style-specimens/app/10-native-polish.jpg

**Gentle Encouragement (Gentler Streak style, dark variant)** `Quiet · 80% fidelity`
- Reference: Gentler Streak (Gentler Stories, Slovenia; 2024 Apple Design Award winner in the Social Impact category; emphasizes personal progress over comparison with others, and its core visual is the "Activity Path", which expresses the day's state as a range from "rest" to "active"; the palette is a soft blue-green). Note: the official main screen is bright and airy; this entry's midnight-blue ground is a dark variant built on its soft blue-green, rounded, non-judgmental tone
- Fit: fitness / recovery / sleep / mindfulness apps, habit products for people who "give up easily", any case where you want to turn "falling behind" from guilt into understanding
- Visual DNA: midnight-blue gradient #18213A→#202C4A, cards #26335A, accents in soft mint #9BE0CC, lavender #BAC3FA and peach #F4D0A8 (all three low-saturation pastels). Type is a rounded sans; large headings are suggestions like "today is good for…", never "X% complete". Layout is all 28px large-radius cards stacked vertically; the core card is a round-capped gradient curve path + a white point marker; the monthly view is a dot calendar, with rest days in peach and no broken streak. Signature elements: round-capped curved path, pastel status capsules, dot month calendar, copy in the spirit of "no gap: rest is part of the plan".
- HTML implementation: SVG path for the route (dark base track + a gradient stroke on top truncated with stroke-dasharray), the dot calendar with grid + border-radius:50%. The key is the copy's tone: statements and suggestions throughout — no red, no exclamation marks, no rankings.
- Fonts: Nunito (rounded) + Noto Sans SC
- Specimen: assets/style-specimens/app/11-gentle-encouraging.jpg

**Editorial Reader (Matter / Readwise Reader style)** `Quiet · 90% fidelity`
- Reference: Matter (offers about 10 reading typefaces including New York, Valkyrie, Lyon and Literata, multiple themes; its queue home keeps spacing and type sizes restrained; press and hold to drag to highlight); Readwise Reader (double-tap a paragraph to highlight, highlights sync with notes)
- Fit: read-it-later, long-form reading, note and highlight management, podcast/article aggregation, any content product whose goal is "finish reading"
- Visual DNA: warm paper white #FBF8F1 + ink black #26221C + one ochre red #B5532A (source names, progress bar, setting values), highlights in fluorescent yellow #F4D35E. Type is a serif body (18px / 1.85 line height), UI labels in a small sans with wide tracking. Layout: the reading queue is plain text entries — source/duration, serif title, two-line summary, a thin progress line, no thumbnails; the reading page is a narrow centered column, and selecting text raises a dark mini toolbar (highlight / note / copy); a highlight can be enlarged on its own into a card with the note. Signature elements: serif titles, highlighter-underline highlight, dark selection toolbar, thin progress line.
- HTML implementation: use mark with linear-gradient(transparent 12%, yellow 12%, yellow 92%, transparent 92%) to simulate a highlighter — closer to a hand stroke than a flat background color; the toolbar uses white-space:nowrap so Chinese does not break vertically; use Noto Serif SC for Chinese serif text.
- Fonts: Literata + Noto Serif SC (body), Inter (labels)
- Specimen: assets/style-specimens/app/12-editorial-reader.jpg

---

## Chinese and East Asian Design (12 styles)

> Added 2026-10. A cross-medium section: web pages, decks, posters, covers and infographics can all use it, and each entry's "Fit" says what it suits. Each turn the wheel draws one style from the section matching the deliverable form, and also draws one here. Chinese content is especially worth browsing here: Western references applied to Chinese layouts usually leave only the palette.

> The premise of this section: Chinese layout has its own grammar — vertical setting, the type area, ruled columns, title slips, the structure of Hanzi — and is not "a Western style plus a Chinese font". Use it like any other section: look at the specimen first, run the color-derivation protocol first.
> Fidelity note: handwritten title slips, aged paper, real photography, letterpress/woodblock texture cannot be done in pure HTML/CSS; all are degraded honestly, and each entry's "HTML implementation" says how.
> Fact checking: designers and works are listed only where a source was found; each entry's "Visual DNA" summarizes that style's layout language, not a pixel-by-pixel description of one page.

**Lü Jingren Bookcraft** `Quiet · 85% fidelity`
- Reference: Lü Jingren (Chinese book designer, called the "master of book clothing"); *Zhu Xi's Thousand-Character Classic* (conveying stele-rubbing atmosphere through paper texture), *Chinese Memory — Treasures of Five Thousand Years of Civilization* (honor award at the 2009 World's Most Beautiful Book), *Elegant Objects in the Sleeve — Suzhou Folding Fans* (2010 China's Most Beautiful Book). He treats book design as a system engineering of interacting with the text and coordinating editing, binding and printing, not just a cover.
- Fit: art-book/annual-report spreads, long-form feature pages, oral history and archival content, exhibition catalogues, deep content that needs "slow reading"; on the web it suits long-read pages, on a deck it suits chapter title pages
- Visual DNA: warm paper ground (in the #F4EFE4 range), deep ink black body, **cinnabar red used exactly once** (one large character or one seal). The layout move is "type-area breathing": the type area is not centered but raised and pushed toward the gutter, with a small head margin and a very large foot margin; the fore-edge side keeps a narrow marginal column for notes; a chapter title page carries only one large character plus one line of title, everything else whitespace. At the gutter, a gradient simulates the binding's recess. Line height 2 or more, folios and running heads tiny.
- HTML implementation: CSS Grid / absolute positioning to set two 560px pages side by side, the gutter with a linear-gradient shadow from dark to light; the marginal column as its own absolutely positioned column; the red seal as a solid square + one character. Paper fiber, foil stamping, slipcase and physical page turns cannot be done — degrade to a flat paper surface + shadow.
- Fonts: Noto Serif SC (Chinese titles and body; it also supplies Latin and figures) + Noto Sans SC (running heads, marginal labels and other small type)
- Specimen: assets/style-specimens/east/01-lu-jingren-bookcraft.jpg

**Song Block-Print Leaf** `Quiet · 80% fidelity`
- Reference: the leaf format of Song dynasty woodblock editions — the frame (mostly double left and right borders in the Northern Song, fine black "mouths" and book ears appearing gradually in the Southern Song), the ruled columns, the fish-tail mark in the centerfold (single black, double black and floral fish-tails appear in the Southern Song), plus title and page number; Zhejiang editions are neat, Sichuan editions have dignified, vigorous characters and open spacing; collectors' red-ink collation is a common layer in old books.
- Fit: observation/archive/documentary content pages, "raw record" pages in research reports, cultural-brand content pages, quote pages in decks, features that need an "old book" feel
- Visual DNA: one whole leaf centered, the surrounding frame thick outside and thin inside (double outside, single inside, or thick outside and thin inside), vertical text with a fine rule between columns; the centerfold (the type heart) is centered, with black "mouth" horizontal lines and inverted-triangle fish-tails above and below, a vertical abbreviation and page number between them, and the carver's name possibly at the bottom; paper slightly yellow (around #EDE0BC) + ink black; **red collation notes** in small vertical red characters in the head margin, with vermilion dots beside key sentences (text-emphasis can do this). There is no ornament anywhere on the page; all information lives in the ruled grid.
- HTML implementation: writing-mode:vertical-rl with one div per column, row-reverse flex to guarantee right-to-left reading; column rules with border-left; fish-tails via clip-path triangles; red dots via text-emphasis. Uneven ink density, irregular stroke thickness and paper damage cannot be done — degrade to even ink and a pale yellow paper tone.
- Fonts: Noto Serif TC (traditional-character block-print body, the closest skeleton to a Song-style cut); use Noto Serif SC for simplified content. English is essentially unused; if needed, the same family as the body is fine
- Specimen: assets/style-specimens/east/02-song-block-print.jpg

**Republic-Era Book Jacket** `Neutral · 70% fidelity`
- Reference: the book and magazine covers of Lu Xun and Tao Yuanqing's generation. Tao Yuanqing designed *Wandering* (1926), *The Grave*, *Dawn Blossoms Plucked at Dusk* and *Tales of the Tang and Song* for Lu Xun; Lu Xun designed covers himself (e.g. *Call to Arms*), mostly type-led, simple and quietly elegant.
- Fit: book covers and flat-lay book shots, album / screenplay collection / travelogue covers, the first screen of a cultural landing page, exhibition posters, cultural-creative packaging
- Visual DNA: low-saturation earth-yellow / gray-green paper ground, ink black plus one touch of vermilion — three colors total; a **white title slip** pasted onto the cover with the title set vertically; a fine double-rule border outside; the pattern is a flat geometric form (mountain, sun, water ripples), not realistic, with hatching; large areas of whitespace; cover, spine and back cover laid out flat and unrolled.
- HTML implementation: flex for three columns — back cover / spine / front cover — the double rule via border + pseudo-element, the title slip as a light block with a fine border; the pattern via SVG geometric polygons and lines. **Handwritten title slips cannot be done** — degrade to LXGW WenKai (a handwritten kai); aged paper, foil stamping and misregistered spot color cannot be done — degrade to flat paper color.
- Fonts: LXGW WenKai for the title and title slip (fallback Ma Shan Zheng, heavier and rougher); Noto Serif SC for author and description; English essentially does not appear
- Specimen: assets/style-specimens/east/03-republic-book-jacket.jpg

**Shanghai Moderne Deco** `Bold · 78% fidelity`
- Reference: the calendar poster (月份牌) originated as advertising art in late-Qing Shanghai and peaked in the 1920s–30s, with representative painters Zheng Manto, Hang Zhiying and Xu Yongqing working in "rubbed-pencil watercolor"; Shanghai Art Deco of the 1930s–40s was understood as "modern" (摩登) and shaped architecture and commercial art.
- Fit: posters, brand promotion pages, coffee/tea/food packaging and event pages, retro-themed landing pages, calendars and seasonal material
- Visual DNA: deep ink green #17352F + gold #C9A24A + vermilion #9E2A1D + cream paper; symmetrical geometry of a **radiating fan (sun) + stepped ziggurat**; a double frame (gold outer frame + dark inner line); the title in a bold art lettering with a dimensional shadow; a **calendar** inset on the right (a calendar poster is essentially an ad plus a calendar); a vermilion full-width band at the bottom carrying the shop name and address.
- HTML implementation: SVG for fans, concentric circles and stepped rectangles; text-shadow for the offset dimensional title; the calendar as a seven-column CSS Grid. The rubbed-pencil watercolor portraits and texture specific to calendar posters cannot be done (and you should not draw portraits in SVG) — degrade to pure geometry + flat color; substitute a geometric coffee cup for the figure.
- Fonts: ZCOOL XiaoWei (display lettering) + Noto Serif SC 900 (subheads) + Noto Sans SC (calendar and small type, Latin figures included; for more Deco flavor swap the Latin to Josefin Sans)
- Specimen: assets/style-specimens/east/04-shanghai-deco-calendar.jpg

**Experimental Hanzi Poster** `Bold · 85% fidelity`
- Reference: the lineage of contemporary Chinese-speaking graphic designers who build layouts out of Hanzi structure. Two verified: Han Jiaying (born 1961 in Tianjin, AGI member; his early posters systematically present his understanding of Hanzi "from stroke to structure, from character to page, from surface to space", and his work is held by the V&A and others); Kan Tai-keung (born 1942, Hong Kong, fuses Hanzi forms with ink wash; the Bank of China logo takes the image of an ancient coin). The common thread of this lineage is treating Hanzi as disassemblable structural material.
- Fit: exhibition / event posters, brand manifesto pages, deck covers or chapter pages, the key visual of a long feature image, course covers
- Visual DNA: **one character blown up to half the frame**, split along its strokes into separate geometric blocks, with some strokes displaced or swapped for a stroke of high-saturation color (vermilion #E4351E); on the right, a small stroke-decomposition diagram (strokes numbered 1–5) explains the "taking apart" process; black + paper white + one accent, everything else thin rules and small type in the information columns; the title is a heavy black face with emphasized words in color.
- HTML implementation: build each stroke by hand from SVG rect/path, so the glyph is your own construction (first confirm the stroke count and stroke order are correct); the decomposition diagram reuses the same path set and highlights one stroke. Characters with complex forms do not suit this — pick characters of 4–6 strokes.
- Fonts: Noto Sans SC 900 (titles) + Noto Serif SC (lead-ins); for the giant character do not use a font — build it from geometric blocks
- Specimen: assets/style-specimens/east/05-hanzi-experimental-poster.jpg

**Hong Kong Street Signs** `Bold · 80% fidelity`
- Reference: the visual language of Hong Kong's hand-painted and neon signs. The 1940s–70s commonly used "Wei Bei" (北魏体) sign lettering, with distinct starts, ends and turns, square and upright (calligraphers such as Au Kin-kung, So Sai-kit and Cheuk Siu-hang drove its popularity); signs were often vertical, densely stacked and mixed Chinese and English; the Hong Kong Neon Signs archive has documented more than 400 surviving neon signs since 2015.
- Fit: retail / restaurant / record store / night market brand pages, event posters, promo landing pages, urban nightlife features, "sense of place" pages in decks
- Visual DNA: a late-night wall as ground, with **signs stacked layer upon layer** on one building: a vertical sign pressing over another vertical sign, horizontal signs overlapping one another; each sign is a high-saturation solid ground (red, yellow, blue, green; this palette is a generalization about night-signage color, not sourced piece by piece) with a cream border and outer glow; the lettering is heavy black traditional Chinese with a hard shadow; one small red LED sign; a handwritten chalkboard price list at the bottom; power cables crossing the frame. Dense information, large type, signs occluding one another.
- HTML implementation: absolute positioning to place each block, box-shadow for the lightbox glow, text-shadow for the hard letter shadow, writing-mode:vertical-rl for vertical signs. Real Wei Bei brushwork and the bends of neon tubing cannot be done — degrade to a combination of Noto heavy sans and Noto Serif black.
- Fonts: Noto Sans TC 900 (traditional heavy vertical signs and small signs) + Noto Serif TC 900 (horizontal main signs) + Archivo Black (English subheads)
- Specimen: assets/style-specimens/east/06-hk-street-signs.jpg

**Solar-Term Palette** `Neutral · 90% fidelity`
- Reference: *Traditional Chinese Colors: Color Aesthetics in the Forbidden City* (by Guo Hao and Li Jianming; arranged by season, it collects 384 traditional colors and also provides 24 solar-term color cards); the Start of Spring maps to traditional color names such as piaobi, huangbaiyou, songhua, xiangye and haitianxia.
- Fit: web first screens, seasonal/time-based products, table-of-contents pages in decks, cultural tourism and outdoor content, brand palette pages, infographics with a built-in timeline
- Visual DNA: organize the whole palette by **traditional color names** rather than "red, green, blue": 24 vertical color bars run across the bottom of the page, each labeled with its solar term and color name, and the current term's bar rises, widens and becomes the page's accent color; the body uses a warm paper ground + ink, with pattern restrained to almost nothing. "Solar term = navigation" is this style's unique layout move.
- HTML implementation: flex with 24 equal color bars, the current bar flex:1.6 + increased height; text switches between dark and light according to each bar's luminance. The values are approximations of each color name (different sources give slightly different hex values for the same name) — in a real project use the colors you sampled yourself, and do not treat this as a standard swatch book.
- Fonts: Noto Serif SC (titles, color names, body) + Noto Sans SC (navigation, small labels)
- Specimen: assets/style-specimens/east/07-traditional-colors-solar-terms.jpg

**Sugiura Information Mandala** `Bold · 72% fidelity`
- Reference: Kohei Sugiura (born 1932, Tokyo; Japanese graphic designer and researcher of Asian imagery). Mandalas and Asian cosmology are the center of his research; he called traditional Asian imagery a world of "universal correspondence"; he worked on about 5,000 books, including roughly 1,700 covers for Kodansha's "Gendai Shinsho" series; he made the *Time-Distance Map* diagram experiments and the "Mandala" exhibition (1980).
- Fit: infographics, event posters, annual/period data pages, popular-science features, overview pages in decks
- Visual DNA: **concentric rings centered on the page** — the outer ring carries solar terms/ticks, the middle ring color-block sectors, the inner ring small moon-phase circles, with a red dot at the center; around it sit numbered-dot callouts with explanations, a large vertical title and a time-distance map, the information density high but every block corresponding to a position on the disc. The palette is a near-black warm ground + gold + vermilion + cream. Vertical and horizontal setting coexisting is a common Asian layout (this is a generalization; no page-by-page source was found this time).
- HTML implementation: generate the SVG sectors, ticks and text rotated along the circle with a script; position the explanatory text absolutely and draw callouts with SVG path. Sugiura's presswork — overprinting, special inks, cross-spread spine design — cannot be done; degrade to flat color.
- Fonts: Noto Serif SC (large vertical titles and text on the rings) + Noto Sans SC (explanatory text and the time map)
- Specimen: assets/style-specimens/east/08-sugiura-info-mandala.jpg

**Ikko Tanaka Geometric** `Neutral · 90% fidelity`
- Reference: Ikko Tanaka (1930–2002). He fused Japanese tradition with the International Style; the *Japanese Dance* poster (1981, constructing a geisha's hairstyle and face from squares and rectangles on a grid) is a signature work; he made posters for the Seibu Theater from 1973, became creative director of the Seibu group in 1975, and from 1980 helped found MUJI and led its visual direction for a long time; his style was influenced by the Rinpa school.
- Fit: exhibition / film festival / performance posters, brand manifesto pages, deck covers, first screens of cultural institution websites
- Visual DNA: **squares, circles and quarter-circles on a grid** assemble into one abstract key image, in red #D9381E / black / mustard / a touch of steel blue on a rice-paper ground; a heavy vertical Song-style title; information on the right blocked out under small red labels for "dates / venue / subject / tickets"; a fine black line at the bottom. Fans, the circular sun and stripes (curtains) are geometric translations of traditional motifs.
- HTML implementation: one 560px square matrix with 70px units, using border-radius for quarter-circles and semicircles; stripes via repeating-linear-gradient. The misregistration and paper grain of screen printing cannot be done — degrade to flat color.
- Fonts: Noto Serif SC 900 (large vertical title) + Noto Sans SC (information) + Zen Kaku Gothic New (small English type)
- Specimen: assets/style-specimens/east/09-tanaka-geometric-poster.jpg

**Hattori Playful Offset** `Bold · 75% fidelity`
- Reference: Kazunari Hattori (born 1964, Tokyo; art director and professor at Tama Art University). His work includes the Kewpie Half campaign, art direction for *Ryuko Tsushin* and the logo for the Mitsubishi Ichigokan Museum; he won the Yusaku Kamekura Award in 2004; one of his signature devices is **replacing print halftone dots with stripes** (from the 2007 "Flag" poster onward).
- Fit: posters, covers, event and media brand pages, weather/lifestyle content that should be "not serious but very considered"
- Visual DNA: one character set very large and filled with **horizontal stripes** in two different colors, offset by a few pixels (like misregistration), so the stripes themselves are the texture; beside it, tilted solid color blocks (yellow, black, a coral circle) and a thick hand-drawn wavy black line; title lettering with a handwritten feel, each character offset up or down; the information columns, by contrast, set perfectly straight. The playfulness is concentrated in one place and does not spread.
- HTML implementation: the giant character via background-clip:text + repeating-linear-gradient stripes, duplicated as one offset layer; color blocks rotated; thick lines with SVG stroke-linecap:round. Real brushwork and ink overprint cannot be done — degrade to round-capped thick lines and offset stripes. Choose characters with few strokes (water, mountain, cloud) for the giant character; complex characters turn to mush.
- Fonts: Noto Sans SC 900 (giant character and numbers) + ZCOOL KuaiLe (playful titles) + Noto Sans SC (information columns)
- Specimen: assets/style-specimens/east/10-hattori-playful-offset.jpg

**Sato Minimal Symbol** `Neutral · 92% fidelity`
- Reference: Kashiwa Sato (creative director). His 2006 rebrand for Uniqlo: a red square + bold white lettering + katakana, choosing red and white because it evokes the Japanese flag; he also served as art director of the Nissin Cup Noodle Museum. His position is that a brand needs one strong symbol (as summarized from a Design Singapore interview).
- Fit: brand launch pages, product landing pages, deck covers, app splash screens, startup home pages
- Visual DNA: **one character (or one symbol) takes half the layout**, filled with solid color (around #E60012); the other half is pure white, an information area with almost no ornament; the title in a heavy black sans; a small four-color square palette (red / black / white / blue) as a hint of the system; data rows separated by thick top rules in three colors. At most three colors on the page.
- HTML implementation: two columns, the giant character flex-centered; zero images, zero gradients. Almost no degradation — the difficulty is restraint, not implementation.
- Fonts: Noto Sans SC 900 (Chinese titles and logo lettering) + Archivo 800/900 (Latin and figures)
- Specimen: assets/style-specimens/east/11-sato-minimal-symbol.jpg

**Japanese Lifestyle Magazine Dense** `Neutral · 78% fidelity`
- Reference: POPEYE (founded 1976, Magazine House, subtitle "Magazine for City Boys") and BRUTUS (founded 1980); both magazines' logos came from art director Seiichi Horiuchi — the POPEYE logo was designed by him in 1976, and he worked on every issue through the 1970s. Horiuchi was also art director of an・an.
- Fit: annual-report/data-feature spreads, city and lifestyle content, data pages in decks, guide and checklist long images, infographics
- Visual DNA: black on white, **high-density diagramming**: the left page has a large title (underlined with a yellow marker) + a route map with numbered dots and **handwritten red and blue pen annotations**; the right page has a 3×3 data grid (thick black rules, one or two cells emphasized in yellow and black) + a heatmap + a short reading note; running heads and folios in a narrow Latin face, spanning both pages. The "handwritten annotation + diagram" characteristic is a generalization about this kind of layout — no page-by-page source was found this time, so do not treat it as reproducing a specific POPEYE issue.
- HTML implementation: two 600px pages side by side, CSS Grid for the data cells, SVG for the route map, the heatmap as a 24×7 grid of cells. Real magazine photo collage and print halftone cannot be done — mark photo slots honestly with color blocks.
- Fonts: Noto Serif SC 900 (large titles) + Noto Sans SC (body and data) + Long Cang (handwritten annotations) + Archivo Narrow (running heads, folios, big data numbers)
- Specimen: assets/style-specimens/east/12-japan-magazine-dense.jpg

---

## Xiaohongshu Posts (8 styles)

> Added 2026-10. A set of 3:4 vertical images (1242×1660, up to 18) swiped left and right, the first being the cover. Usage in `references/modules/xiaohongshu.md`. The source is a real post: the same "open-source bird stickers" piece was made in these eight versions, and the specimens are that set's cover plus one inner page, so the subject matter is identical — what is borrowed is the layout.
> Each specimen is also a template: `assets/style-specimens/xhs/<number>.html` opened at 1200×750 is the specimen, and opened at the real size it is handed to `scripts/xhs_render.py` for slicing. Type sizes are set to the 1242-wide floor (body ≥42px, labels ≥32px); do not shrink when swapping in other content.
> The sample colors are the Mingji app's paper white, ink black and sun yellow; in real work, run the color-derivation protocol and take colors from the user's brand or content.

**Specimen Journal** `Neutral · 90% fidelity`
- Reference: the grammar of natural-history plates and nature magazine covers: a hairline masthead rule, oversized serif numerals, a single main specimen filling half the page, small data in the side column
- Fit: nature, popular science and culture long reads; knowledge notes that need authority and a magazine feel
- Visual DNA: dot-grid paper ground; a huge Song-style title; a 300px-class high-contrast serif numeral as the layout's protagonist; the main sticker pressed below the numeral and crossing the column rule; two or three "big number + two-line note" pairs in the side column; the inner page uses a numbered list + same-numbered dots marked on the subject, with a scale ruler giving the position
- HTML implementation: all absolutely positioned; numbered dots via CSS counter; the ruler as one fine line plus two absolutely positioned markers. No degradation
- Fonts: Noto Serif SC 900 (titles and small numerals) + Bodoni Moda (only for numerals above 100px) + Noto Sans SC (body)
- Specimen: assets/style-specimens/xhs/01-specimen-journal.jpg

**Product Notebook** `Neutral · 95% fidelity`
- Reference: the product's own interface (here the Mingji app's paper, capsule buttons and stickers); Xiaohongshu-native journal and collage notes
- Fit: your own product, app or brand content, when you want readers to recognize "that thing" at a glance; friendly and collectible
- Visual DNA: the app's paper and dot grid used directly as ground; black capsules as labels and step numbers; a 2×3 sticker grid with names; a white card slightly rotated with a strip of translucent tape holding the large title; the inner page is an "approval sheet" made of white cards — check rows + a ring score + two number cards
- HTML implementation: absolutely positioned cards + drop-shadow in warm brown; the tape as a translucent color block. No degradation
- Fonts: Figtree 900 (numbers) + Noto Sans SC 700/900 (Chinese)
- Specimen: assets/style-specimens/xhs/02-sticker-notebook.jpg

**Index Ink** `Bold · 95% fidelity`
- Reference: Swiss-style index pages and data annual reports: ink ground, single-color accent, isometric grid, numbered rows
- Fit: numeric conclusions, rankings, lists, comparisons; a cover that must stand out at a glance in a feed
- Visual DNA: cover on an ink ground, a 340px yellow numeral occupying the upper part, below it small images in a 5×3 fine-rule grid; inner page on a paper ground, a huge black numeral + a two-line title, numbered table rows, and a proportion bar at the bottom with a solid segment plus a hatched fill
- HTML implementation: CSS Grid; hatching via repeating-linear-gradient; the proportion bar distributing widths by real values with flex. No degradation
- Fonts: Figtree 900 + Noto Sans SC 900
- Specimen: assets/style-specimens/xhs/03-index-ink.jpg

**Panorama Strip** `Bold · 90% fidelity`
- Reference: horizontal handscrolls and continuous picture books; the "several images forming one picture" swipe experience in a Xiaohongshu carousel
- Fit: content that can line up along one axis: a set of objects, a timeline, a pipeline, a route; you want people to keep swiping right
- Visual DNA: three images are one drawing, a wire (or horizon) running through all of them; the protagonist straddles the seam, showing about 2/3 on the left image and about 1/3 on the right; each image has its own large number or title and stands alone; page numbers read only 01 02 03
- HTML implementation: one 3726px-wide `.xhs-strip`, `XHS.wire()` drawing the line as a cosine curve (cycle spanning two images, lowest point never on the seam), `XHS.perch()` placing stickers on the line by their claw position; `xhs_render.py` slices the images and checks for type crossing the seam. The sticker claw positions must be measured by hand once
- Fonts: Figtree 900 + Noto Sans SC 700/900
- Specimen: assets/style-specimens/xhs/04-panorama-strip.jpg

**Daily Paper** `Neutral · 80% fidelity`
- Reference: a newspaper front page: masthead, double rule, lead story, columned body, drop cap, grayscale halftone image, news digest box
- Fit: "event" content: launches, retros, deep method pieces, annual summaries
- Visual DNA: newsprint ground with fine noise; a Song-style masthead with wide tracking; a double rule dividing masthead from body; one numeral in the lead story crossed with a yellow highlighter; images desaturated and contrast-boosted; a drop-cap body column; a boxed large score on the inner page, with a row of small grayscale images as a diagram at the bottom
- HTML implementation: noise as a background from inline SVG feTurbulence; halftone approximated with grayscale + contrast filters — real halftone screens cannot be done; drop cap via ::first-letter
- Fonts: Noto Serif SC 900/500 (masthead, titles, body) + Bodoni Moda (English masthead and the big score)
- Specimen: assets/style-specimens/xhs/05-daily-paper.jpg

**Trading Cards** `Bold · 85% fidelity`
- Reference: collectible trading cards and field-guide cards: gilt frame, rarity tag, numbering, stat bars
- Fit: one card per item, collectible lists: species, products, people, tools, cities
- Visual DNA: a dark tabletop radial gradient; a gold gradient frame wrapping a paper card core; the cover shows one large card pressing a smaller tilted card; on the card, name, scientific name, rarity tag, dot-grid image window, #number, two stat bars; the inner page is a 3×3 pack sorted by one real value
- HTML implementation: the card frame is padding plus a linear-gradient background; stat bar widths computed from real values. Foil reflection cannot be done — approximate with multi-stop gradients
- Fonts: Figtree 800/900 (numbers) + Noto Sans SC 700/900
- Specimen: assets/style-specimens/xhs/06-trading-cards.jpg

**Blank & Vertical** `Quiet · 90% fidelity`
- Reference: Chinese vertical-set books and seals; art books that put one thing on a page
- Fit: slow content, stories, a close-up of a single object, aphorisms; interleave one or two into a set as a breather
- Visual DNA: large areas of blank space; a large vertical Song-style title pushed right; a fine, long vertical subtitle; one vermilion seal; a small, isolated subject placed at the lower left; a line number at the upper left, a short rule plus the scientific name at the bottom
- HTML implementation: writing-mode:vertical-rl; the seal as a red square with vertical characters. No degradation. Whitespace comes from the layout, not from shrinking type: vertical body text is also ≥42px
- Fonts: Noto Serif SC 900/500
- Specimen: assets/style-specimens/xhs/07-blank-vertical.jpg

**Area Infographic** `Neutral · 95% fidelity`
- Reference: the treemap (proposed by Ben Shneiderman in the early 1990s) and the waffle chart
- Fit: conclusion pages with a set of hard numbers and a proportion to grasp at a glance; composition, distribution, hit rate
- Visual DNA: the cover is a treemap whose areas equal the quantities, the large cells carrying the main stickers, small cells holding only a name and a number, and the smallest merged into "N others"; the inner page is a waffle chart where one cell means a fixed quantity, in four color steps, with a legend below giving the real numbers
- HTML implementation: the squarify algorithm in about 20 lines of JS inlined in the template; the waffle chart is CSS Grid. No degradation
- Fonts: Figtree 900 + Noto Sans SC 900
- Specimen: assets/style-specimens/xhs/08-area-infographic.jpg

---

## ⚠️ AI-image-only styles (recommend only once the user has confirmed image-generation capability; not selectable in default)

The soul of these styles is **generatively produced visuals / 3D / particles / cinematic lighting / hand-drawn illustration**; in pure HTML/CSS without image generation you can only produce a badly degraded mock, so they are **removed from the default recommendation pool**. Treat them as candidates only when the user clearly has image-generation capability (via `huashu-gpt-image`):

| Style | Soul | Why HTML cannot do it |
|------|------|------------------|
| Active Theory (WebGL particles) | 3D particle systems / real-time rendering | impossible in pure CSS |
| Field.io (generative art) | algorithmically generated graphics | static SVG can only be a rigid simplification |
| Resn (illustrated interaction) | character illustration + gamification | depends on hand-drawn material |
| Zach Lieberman (real-time generation) | creative-coding strokes | depends on real-time generation |
| Raven Kwok (fractal parameters) | recursive fractals | CSS cannot reach that complexity |
| Ash Thorp (cinematic light) | cinematic volumetric light / concept art | CSS lighting is a degradation |
| Territory Studio (FUI holograms) | sci-fi holographic interfaces | depends on many layered glow assets |
| Neo Shen (ink wash) | organic ink diffusion | CSS gradients ≠ ink |
| Sagmeister & Walsh (color explosion) | handmade objects + experimental typography | the clashing-color skeleton is doable (already merged into the web section's "Memphis" and the PPT section's "monochrome clash poster"); the handmade texture is not |

> These are not "bad" — they are "wrong carrier": their native carrier is an image generated by AI, not the browser DOM.

---

## Default taste bans (the user may override for their own brand)

- ❌ **The GitHub-dark lazy solution**: a flat dark blue ground (#0D1117) + generic cyan/purple neon glow — only this one overused combination is banned; it is not "dark is always banned"
- ✅ **Not banned**: cinematic dramatic lighting, warm cyberpunk (Ash Thorp orange/cyan), the dark-stage narrative of movement poetry — dark work with authorial intent is kept (this library's "Linear dark glow", "black-ground number theater" and "CS50 candy stage" are all legitimate dark styles)
- ❌ The aggressive purple-gradient universal formula, emoji as icons, rounded cards + left colored border accent (unless the brand itself uses them)
- ❌ Personal signature / watermark on cover images

---

## Prompt guidance when image generation is available (Mood, Not Layout)

> Applies only when taking the AI image-generation path; on the HTML path, write code directly against each style's "HTML implementation" above.

Short prompts > long prompts. Describing mood and content is more effective than piling on 30 lines of layout detail.

| What kills variety | What sparks it |
|----------------|----------------|
| Specifying color ratios (60%/25%/15%) | Describing mood ("warm like Sunday morning") |
| Dictating element positions | Citing a concrete aesthetic ("Pentagram editorial feel") |
| Listing every visual element | Describing what the viewer should feel |

Full AI image-generation methodology → `huashu-gpt-image` skill.

---

**Version**: v3.2 (2026-06 restructured as an HTML-native library; 2026-08 added the infographic section, 40 → 60 styles; 2026-10 added the App and Chinese/East Asian sections, each with specimens, 60 → 84 styles; 2026-10 added the Xiaohongshu post section, 84 → 92 styles)
**Applies to**: the default HTML path for all visual design — web pages, PPT, PDF, infographics, covers, apps and more
