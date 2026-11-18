# Design Context: start from the context that already exists

**This is the single most important thing in this skill.**

Good hi-fi design always grows out of existing design context. **Making hi-fi out of thin air is a last resort, and it always produces generic work.** So at the start of every design task, ask first: is there anything I can refer to?

## What design context is

In priority order, highest to lowest:

### 1. The user's design system / UI kit
The component library, color tokens, type specs and icon system the user's own product already has. **The ideal case**.

### 2. The user's codebase
If the user gave you a codebase, it contains living component implementations. Read those component files:
- `theme.ts` / `colors.ts` / `tokens.css` / `_variables.scss`
- Concrete components (Button.tsx, Card.tsx)
- Layout scaffold (App.tsx, MainLayout.tsx)
- Global stylesheets

**Read the code and copy exact values**: hex codes, spacing scale, font stack, border radius. Do not redraw from memory.

### 3. The user's shipped product
If the user has a live product but gave no code, use Playwright or ask the user for screenshots.

```bash
# screenshot a public URL with Playwright
npx playwright screenshot https://example.com screenshot.png --viewport-size=1920,1080
```

So you can see the real visual vocabulary.

### 4. Brand guidelines / logo / existing assets
The user may have: logo files, brand color specs, marketing material, slide templates. All of this is context.

### 5. Competitor references
The user says "like the XX website" — get them to provide a URL or a screenshot. **Do not** work from the fuzzy impression in your training data.

### 6. A known design system (fallback)
If none of the above exists, use a recognized design system as the base:
- Apple HIG
- Material Design 3
- Radix Colors (palette)
- shadcn/ui (components)
- Tailwind's default palette

Tell the user explicitly what you are using, so they know it is a starting point, not a final cut.

## The process for getting context

### Step 1: ask the user

Questions you may ask at the start of a task (from the question bank in `workflow.md`; pick the most important ones):

```markdown
1. Do you have an existing design system / UI kit / component library? Where?
2. Do you have brand guidelines, color/type specs?
3. Can you give me screenshots or a URL of the existing product?
4. Is there a codebase I can read?
```

### Step 2: when the user says "no", help them find it

Do not just give up. Try:

```markdown
Let me look for clues:
- Did your earlier projects have related design work?
- What colors/typefaces does the company's marketing site use?
- What style is your product's logo? Can you send me one?
- Is there any product you admire that I can use as a reference?
```

### Step 3: read all the context you can find

If the user gave a codebase path, read:
1. **List the file structure first**: find the style/theme/component-related files
2. **Read the theme/token files**: lift the concrete hex/px values
3. **Read 2–3 representative components**: see the visual vocabulary (hover state, shadow, border, padding pattern)
4. **Read the global stylesheet**: base reset, font loading
5. **If there is a Figma link/screenshot**: look at it, but **trust the code more**

**Important**: **do not** glance at it and then work from impression. Only when you have read 30+ concrete values have you actually lifted it.

### Step 4: vocalize the system you are going to use

After reading the context, tell the user which system you will use:

```markdown
Based on your codebase and product screenshots, here is the design system I extracted:

**Color**
- Primary: #C27558 (from tokens.css)
- Background: #FDF9F0
- Text: #1A1A1A
- Muted: #6B6B6B

**Type**
- Display: Instrument Serif (from the @font-face in global.css)
- Body: Geist Sans
- Mono: JetBrains Mono

**Spacing** (from your scale system)
- 4, 8, 12, 16, 24, 32, 48, 64

**Shadow pattern**
- `0 1px 2px rgba(0,0,0,0.04)` (subtle card)
- `0 10px 40px rgba(0,0,0,0.1)` (elevated modal)

**Border-radius**
- small components 4px, cards 12px, buttons 8px

**component vocabulary**
- Button: filled primary, outlined secondary, ghost tertiary, all with 8px radius
- Card: white background, subtle shadow, no border

I'll start work on this system. Confirm it is fine?
```

Only start work after the user confirms.

## Designing out of thin air (the fallback when there is no context)

**Strong warning**: output quality drops markedly in this situation. Tell the user clearly.

```markdown
You have no design context, so I can only work from general intuition.
The output will be "looks OK but lacks distinctiveness".
Do you want to continue, or supply some reference material first?
```

If the user insists you do it, make decisions in this order:

### 1. Pick an aesthetic direction
Do not deliver a generic result. Choose one explicit direction:
- brutally minimal
- editorial/magazine
- brutalist/raw
- organic/natural
- luxury/refined
- playful/toy
- retro-futuristic
- soft/pastel

Tell the user which one you chose.

### 2. Pick a known design system as the skeleton
- Use Radix Colors for the palette (https://www.radix-ui.com/colors)
- Use shadcn/ui for component vocabulary (https://ui.shadcn.com)
- Use the Tailwind spacing scale (multiples of 4)

### 3. Pick a distinctive type pairing

Do not use Inter/Roboto. Suggested combinations (free from Google Fonts):
- Instrument Serif + Geist Sans
- Cormorant Garamond + Inter Tight
- Bricolage Grotesque + Söhne (paid)
- Fraunces + Work Sans (note: Fraunces has been run into the ground by AI)
- JetBrains Mono + Geist Sans (technical feel)

### 4. Every key decision gets reasoning

Do not choose silently. Write it in an HTML comment:

```html
<!--
Design decisions:
- Primary color: warm terracotta (oklch 0.65 0.18 25) — fits the "editorial" direction  
- Display: Instrument Serif for humanist, literary feel
- Body: Geist Sans for cleanness contrast
- No gradients — committed to minimal, no AI slop
- Spacing: 8px base, golden ratio friendly (8/13/21/34)
-->
```

## Import strategy (the user gave a codebase)

If the user says "import this codebase as a reference":

### Small (<50 files)
Read all of it and internalize the context.

### Medium (50–500 files)
Focus on:
- `src/components/` or `components/`
- every style/token/theme-related file
- 2–3 representative full-page components (Home.tsx, Dashboard.tsx)

### Large (>500 files)
Have the user name the focus:
- "I want to build the settings page" → read the existing settings-related code
- "I want to build a new feature" → read the overall shell + the closest reference
- Do not aim for completeness, aim for accuracy

## Working with Figma / design files

If the user gave a Figma link:

- **Do not** expect to "convert Figma to HTML" directly — that needs extra tooling
- Figma links are usually not publicly accessible
- Have the user: export a **screenshot** and send it to you + tell you the concrete color/spacing values

If you are only given a Figma screenshot, tell the user:
- I can see the visuals, but I cannot get exact values
- Tell me the key numbers (hex, px), or export as code (Figma supports it)

## Final reminder

**The ceiling on a project's design quality is set by the quality of the context you got**.

Spending 10 minutes collecting context is worth more than spending an hour drawing hi-fi out of thin air.

**When there is no context, ask the user for it first rather than forcing it**.
