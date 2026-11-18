# Content Guidelines: anti-AI slop, content rules, Scale spec

AI slop is the default — it happens unless you actively avoid it. But the "default" moves over time: in 2024 it was purple gradients and emoji, in 2026 it became something more "tasteful". Banning only the previous generation of slop means fighting the last war.

## The 2026 AI default look (read this first)

Anthropic's official frontend-design skill (2026) describes today's clusters of AI-generated pages clearly ([source](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)):

1. **Warm cream background (near #F4F1EA) + high-contrast serif headline + terracotta accent (near #D97757)**. This is Claude's own interface palette, and it is also where you — the model — slide most easily: don't let it be the thing you land on without thinking.
2. **Near-black background + a single bright accent** (acid green or vermilion).
3. **Newspaper-style layout**: thin rules dividing columns, zero radius, dense newspaper columns.
4. **SaaS card kit**: content cut into identical rounded cards, everything the same radius and the same soft gray shadow, gradients as decoration.
5. **Template decoration**: a wide-tracked all-caps micro-label above every heading; "A · B · C" strung together with middots; "WORD — fragment" labels; #0B0B0B, #111 used in place of black; monospace for small data labels; "→" appended to links and buttons.

There are also three typographic default moves: giving exactly one word in a heading a different color or italic; setting every small label in all caps; adding an unnecessary micro-label above content. Numbers (01 / 02 / 03) only when the content really is a sequence.

**Two categories, handled differently:**

- **1–4 are look families.** They became defaults precisely because they look good; dark background with a single accent, and warm-paper serif directions still get approved in blind picks. Using one is not a mistake; the mistake is all three directions crowding into the same family, or every project looking like this. `design_lint.py check` only lists them as "hints"; what actually governs them is `compare` (three versions crowding together) and the look ledger (collision with a recent project). They were once treated as yellow lights to dodge, and all three versions retreated to pale cool tidiness, and got judged "too tidy, too boring".
- **5 and the three typographic moves below are template decoration.** They are small moves that appear by convenience, and deleting them costs almost nothing; `check` lists them as yellow lights: if the brief asks for them, do it; otherwise delete that structure. What cannot be measured (say, #111 instead of black) is on you to see.

## The previous generation of slop (around 2024, still avoid)

### Visual traps

**❌ Aggressive gradient backgrounds**
- Purple → pink → blue full-screen gradients (the typical smell of an AI-generated page)
- Rainbow gradients in any direction
- Mesh gradients filling the background
- ✅ If you use a gradient: subtle, monochromatic, deliberately placed (say, button hover)

**❌ Rounded card + left border accent color**
```css
/* This is the typical signature of an AI-smelling card */
.card {
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  padding: 16px;
}
```
Cards like this flood AI-generated dashboards. Want emphasis? Do it with more design: background contrast, weight/size contrast, plain rules, or no cards at all.

**❌ Emoji decoration**
Unless the brand itself uses emoji (Notion, Slack), do not put emoji in the UI. **Especially not**:
- 🚀 ⚡️ ✨ 🎯 💡 before headings
- ✅ in feature lists
- → inside CTA buttons (an arrow on its own is OK; an emoji arrow is not)

With no icons, use a real icon library (Lucide/Heroicons/Phosphor), or use a placeholder.

**❌ Hand-drawing people and animals in SVG**
Do not hand-draw people, animals, realistic objects or scenes in SVG — features land in the wrong place, proportions go strange, and it reads cheap at a glance. Use real photography, generated imagery, or an honest placeholder (a gray rectangle with "illustration slot 1200×800").

This does not cover geometry, icons, data charts, maps and contour lines, cross-section diagrams, procedural textures and materials — and those are often the best hero material pure HTML can produce (see the T0 tier in `references/materials.md`). The test is whether it survives being looked at screen by screen: if it bothers you during the polish pass, swap it for real photography or a placeholder.

**❌ Too much iconography**
Not every heading/feature/section needs an icon. Abusing icons makes an interface look like a toy. Less is more.

**❌ "Data slop"**
Invented stats as decoration:
- "10,000+ happy customers" (you don't even know that)
- "99.9% uptime" (no real data, don't write it)
- Decorative "metric cards" of icon + number + word
- Fake data in mock tables, dressed up elaborately

With no real data, leave a placeholder or ask the user.

**❌ "Quote slop"**
Fabricated testimonials and famous-person quotes decorating the page. Leave a placeholder and ask the user for a real quote.

### Typeface traps

**❌ Avoid these overused fonts**:
- Inter (the AI-generated web default)
- Roboto
- Arial / Helvetica
- A pure system font stack
- Fraunces (AI found it and ran it into the ground)
- Space Grotesk (recent AI favorite)

**✅ Use a distinctive display + body pairing**. Directions for inspiration:
- Serif display + sans body (editorial feel)
- Mono display + sans body (technical feel)
- Heavy display + light body (contrast)
- Variable font for weight animation in the hero

Type resources:
- The less obvious good options in Google Fonts (Instrument Serif, Cormorant, Bricolage Grotesque, JetBrains Mono)
- Open-source type sites (Fraunces' sibling faces, Adobe Fonts)
- Never invent a font name out of thin air

### Color traps

**❌ Inventing colors out of thin air**
Do not design an unfamiliar whole palette from scratch. It usually is not harmonious.

**✅ Strategy**:
1. Brand colors exist → use them; fill missing color tokens by oklch interpolation
2. No brand colors but a reference exists → sample from screenshots of the reference product
3. Truly from zero → sample from the subject (its materials, place of origin, objects, the dominant colors in real photography), and use sample → converge → argue as described in the "color derivation protocol" in `references/design-styles.md`. **Do not take Anthropic / Claude brand colors as a "safe default"** — that is exactly item one of the 2026 AI default look

**Defining color with oklch** is the most modern approach:
```css
:root {
  --primary: oklch(0.62 0.14 155);      /* example: a moss green sampled from real photography of the subject; the value changes with the content */
  --primary-light: oklch(0.85 0.06 155); /* lighter shade of the same hue */
  --primary-dark: oklch(0.42 0.15 155);  /* darker shade of the same hue */
}
```
oklch keeps hue from drifting when you adjust lightness; it is easier to use than hsl.

**❌ Adding dark mode by flipping colors casually**
It is not simply inverting colors. A good dark mode needs saturation, contrast and accent re-tuned. If you don't want to build dark mode, don't.

### Layout traps

**❌ Bento grid overuse**
Every AI-generated landing page wants a bento. Unless your information structure genuinely suits bento, use another layout.

**❌ Big hero + 3-column features + testimonials + CTA**
This landing page template has been run into the ground. If you want to innovate, actually innovate.

**❌ Every card in a card grid looks the same**
Asymmetry, different card sizes, some with an image and some text only, some spanning columns — that is what a real designer's work looks like.

## What to do positively

- **Spend the boldness in one place**: let one element be the one that is remembered, and keep everything around it quiet and restrained. Taste is being exquisite in the right place, not spreading effort evenly — one detail at 120%, everything else at 80%. Check the mirror before leaving the house, and take one accessory off.
- **Structural elements must carry information**: borders, numbering, rules, micro-labels encode content relationships, they are not decoration. Before adding one, ask what it says.
- Typographic detail is the "taste tax": `text-wrap: pretty`, CSS Grid, `oklch()`; Chinese uses 「」 quotes (`references/typography.md`).
- Do not invent colors: sample from brand assets, sample from real photography of the content, take colors from the cultural context of the subject (the color derivation protocol in `references/design-styles.md`).

**A counterexample must be visibly a counterexample**: when the task itself is to show anti-design (explaining "what AI slop is", making a comparison review), do not pile slop across the page — isolate it in an honest counterexample container, a dashed border with a "Counterexample · don't do this" badge, so the counterexample serves the narrative instead of polluting the page's main key.

## Content rules

### 1. Don't add filler content

Every element must earn its place. Empty space is a design problem; solve it with **composition** (contrast, rhythm, white space), **not** by filling it with content.

**Questions for judging filler**:
- If this content were removed, would the design get worse? If the answer is "no", remove it.
- What real problem does this element solve? If it is "so the page isn't so empty", delete it.
- Does this stat/quote/feature have real data behind it? If not, don't write it.

"One thousand no's for every yes".

### 2. Ask before adding material

Think adding another paragraph/page/section would be better? Ask the user first, don't add unilaterally.

Why:
- The user knows their audience better than you do
- Adding content has a cost, and the user may not want it
- This is about **content**: new paragraphs, pages, selling points, data. Design decisions (layout, graphics, motion, materials) are your job — no need to ask

### 3. Create a system up front

After exploring the design context, **write down the system you are going to use first** (into the direction card, or a comment at the top of the HTML). For tasks that don't go through the three directions, state it for the user to confirm:

```markdown
My design system:
- Color: #14261F primary + #E6EDE4 background + #C8553D accent (background and primary sampled from the moss green in your product photos, accent from the logo)
- Type: Schibsted Grotesk for display + Source Serif 4 for body
- Rhythm: section titles on a full-bleed color background with white type; ordinary sections on white
- Imagery: full-bleed photo for the hero, placeholders in the feature section until you provide them
- At most 2 background colors, to avoid clutter

Confirm this direction and I'll start building.
```

For tasks that went through the three directions, the direction the user chose already confirms the system; no need to ask again.

## Scale spec

### Slides (1920×1080)

- Body minimum **24px**, ideal 28-36px
- Headlines 60-120px
- Section titles 80-160px
- Hero headlines can use large type at 180-240px
- Body text never below 24px; labels, notes, chart ticks no smaller than 16px

### Print documents

- Body minimum **10pt** (≈13.3px), ideal 11-12pt
- Headlines 18-36pt
- Captions 8-9pt

### Web and mobile

- Body minimum **14px** (16px for older readers)
- Mobile body **16px** (to avoid iOS auto-zoom)
- Hit target (clickable element) minimum **44×44px**
- Line height 1.5-1.7 (1.7-1.8 for Chinese)

### Contrast

- Body vs background **at least 4.5:1** (WCAG AA)
- Large type vs background **at least 3:1**
- Check with the accessibility tools in Chrome DevTools

## CSS superpowers

**Advanced CSS features** are a designer's friend; use them boldly:

### Typography

```css
/* Make headline wrapping more natural, so the last line isn't one lonely word */
h1, h2, h3 { text-wrap: balance; }

/* Body wrapping, avoiding widows and orphans */
p { text-wrap: pretty; }

/* Chinese typesetting helpers: punctuation trimming, line-start/line-end control */
p { 
  text-spacing-trim: space-all;
  hanging-punctuation: first;
}
```

### Layout

```css
/* CSS Grid + named areas = maximum legibility */
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
}

/* Subgrid aligns card content */
.card { display: grid; grid-template-rows: subgrid; }
```

### Visual effects

```css
/* A scrollbar with some design */
* { scrollbar-width: thin; scrollbar-color: #666 transparent; }

/* Glassmorphism (use sparingly) */
.glass {
  backdrop-filter: blur(20px) saturate(150%);
  background: color-mix(in oklch, white 70%, transparent);
}

/* The View transitions API makes page changes silky */
@view-transition { navigation: auto; }
```

### Interaction

```css
/* The :has() selector makes conditional styles easy */
.card:has(img) { padding-top: 0; } /* cards with an image get no top padding */

/* Container queries make components genuinely responsive */
@container (min-width: 500px) { ... }

/* The new color-mix function */
.button:hover {
  background: color-mix(in oklch, var(--primary) 85%, black);
}
```

## When in doubt, ask three questions

When you want to add something (a gradient, an icon, a bit of motion, an image) and are not sure, don't consult the list of bans — ask three questions:

1. **Where does it come from?** Did it grow out of this subject (its materials, objects, data, story), or out of "pages usually have this"?
2. **Remove it — is the information clearer or muddier?** Clearer, remove it; muddier, it is carrying content, so keep it and do it properly.
3. **Is it the only hero of this screen?** Let one thing take the spotlight per screen; everything else stays quiet.

What passes these three questions, do boldly and do properly — half-hearted boldness looks worse than honest restraint. What doesn't pass, don't add.
Fabricated data, testimonials and logo walls are not covered by this: that is a question of content honesty. If you don't have it, you don't have it.
