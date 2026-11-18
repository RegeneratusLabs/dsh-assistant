# v5 · "Markdown is the new typewriter."

> Director's Notes for the **studio-md-html v2.0** launch film
> 30 seconds · 1920×1080 · 25 fps · no voiceover
> Director: the studio (acting as an Apple-tier launch film director)
> Composer: TBD (target: Max Richter / Ólafur Arnalds / Jóhann Jóhannsson minimal-cinematic register)
> Color base: ivory white #FAFAF6 · ink #1A1A1A · terracotta #C2410C
> Type: Newsreader (display + body) · JetBrains Mono (interface) · Noto Serif SC (Chinese)

---

## Contents

- [Part I · Director's Statement](#part-i--directors-statement)
- [Part II · Visual System](#part-ii--visual-system)
- [Part III · Story Arc](#part-iii--story-arc)
- [Part IV · Shot-by-Shot Storyboard](#part-iv--shot-by-shot-storyboard)
- [Part V · Production Manifest](#part-v--production-manifest)

---

# Part I · Director's Statement

## 1.1 This is not a "feature tour"

Almost every SaaS upgrade video makes the same mistake — it treats the footage as a slide deck. Open → six features slide past → logo + slogan → end. Every second is spent *showing*; not one second is spent *telling*. What the viewer carries out of the room is not the product, but "another page that looks like AI made it".

**This film does not do that.**

We are going to tell a story. The story is one line long:

> **"md is the source code. Everything else is product."**

That is not a slogan, it is a worldview. Markdown is not "a lightweight document format" — it is the source of the writing. Every downstream form (html, docx, pdf, epub) is a product derived from that same source. studio-md-html v2.0 extends that product chain from 4 to 6 — and what it extends is not a "feature list", it is **the radius of the source's influence**.

If the viewer remembers exactly one thing after this film, I want it to be: "so md was the source code all along". However much of the feature list sticks is bonus.

## 1.2 The conversation our visual language is having

Every good brand film is in conversation with a set of predecessors. The context I want this film to speak into:

**Apple — "Designed by Apple in California" (2013)**

That film is, as far as I am concerned, the ceiling for tech-company brand films. Director Mark Romanek got three things right:
1. **Pure white ground + serif type** — it tells the viewer this is "a design about design", not a demo
2. **Slow tempo** — every caption line sits half a beat behind the viewer's reading speed, forcing them to stay
3. **Jony Ive's narration is almost a whisper** — not selling, sharing

Our film has **no voiceover**, so the first two principles have to be reinforced to 200% through typography and timing.

**Apple Silicon Launch Films (M1 / M2 / M3, 2020-2024)**

That series taught me that **typography can dance too**. The three characters of "M1" can go from absent, to present, to scaled up, to rotated, to exploded into dust, to reassembled — the viewer watches a logo become the lead of a dance piece in 30 seconds.

**The hero of this film is not the product UI. It is the two characters `md` plus one orange period.** It has to carry a dance piece for 30 seconds.

**Anthropic brand language (2024-2026)**

Anthropic turned "terracotta orange + serif + geometric abstraction" into the anti-slop model for AI companies. It told the industry: you can be a tech company and still look like a slim philosophy book published by Penguin Classics.

We inherit that color system. But we do it **more restrained** — Anthropic will occasionally use flat terracotta as a large color field; our terracotta is always accent only (under 8% of the frame area), and the other 92% goes to ivory white and ink black.

**Penguin Classics (from 1947, after Romek Marber's 1961 grid)**

Penguin taught me **typographic courage**. A book cover can be large serif type + one black rule + no illustration — and the reader stops anyway.

The slogan reveal at 25-29s borrows that language: **ONE SOURCE.** and **SIX FORMS.** are not "decorative text"; they are the frame itself.

**Pentagram (Paula Scher / Michael Bierut)**

Pentagram's signature is **information architecture** — the distance between letter and letter, the distance between type and edge, the size ratios between type levels. None of it is "by feel"; it is mathematics.

Our grid system (Part II.3) comes from that tradition.

**Kenya Hara, *White* (2008)**

Hara wrote: "White is not a color; it is a sensibility."

The real lead of this film is not `md.` — it is **the field of ivory white around it**. Every shot has to hold at least 60% negative space. Negative space is not "not yet filled in"; it is the content itself.

**Massimo Vignelli — Modernism in design**

Vignelli's eight-word maxim: "If you can design one thing, you can design everything."

Our design system does not permit "add a typeface just for this shot" or "add a corner radius just for this shot". All 13 shots share the same 10 color values, 3 typefaces, 4 easing curves.

## 1.3 Audience profiles

Three audiences, in order of importance:

**Primary audience A · existing studio-md-html v1 users (about 60% of traffic)**

They press play to find out "what got upgraded". Our promise to them: within 30 seconds you must know for certain —
- New capability 5: md → publication-grade PDF
- New capability 6: md → standard EPUB
- The visual quality of both is higher than you would expect (not the "I could do that with wkhtmltopdf" tier)

→ Shot 08 and Shot 09, 3 seconds each. They must carry a "★ NEW" label, and the destination card must show **visible professional-grade detail** — printer crop marks, an Apple Books frame — so old users understand in a second: "this isn't padding, this was actually built."

**Secondary audience B · AI-native creators who have heard of studio-md-html but never used it (about 25%)**

What they care about is "what does this skill have to do with me". Our promise to them: within 30 seconds you must realize —
- When you write an article / run research / build a white paper, **md should be your source of truth**
- Six downstream formats, one command

→ Shot 04 (any → md) has to let them see PDF/DOCX/PPTX/XLSX/HTML absorbed into md at once — that is the visual embodiment of "source thinking".

**Outer audience C · designers / editors / publishers with no prior exposure (about 15%)**

What they see is "a beautiful tech short", and they may not follow up. Our promise to them: within 30 seconds you must leave an impression —
- What this shop makes **has publishing-house taste**
- It is unlike the AI tools you have seen

→ The whole film's anti-AI-slop self-check (Part II.7) exists for them. Any purple gradient, emoji icon, hand-drawn SVG figure — none of it appears.

## 1.4 Philosophy of tempo

An Apple brand film does not run at a constant rate. It is a **slow beat — accelerate — peak — ease out** curve (see the emotion curve in Part III).

Concretely for this film:

- **0-3s slow beat**: the viewer enters. Typography breathes one character at a time.
- **3-6s first acceleration**: the md characters are born, 6 file cards fly in one after another.
- **6-22s second acceleration**: 6 capabilities in one breath, 3 seconds each, no letting go.
- **22-26s peak**: the slogan reveals on two lines, all chrome pulses in sync.
- **26-30s ease out**: the capability map fades in slowly, the last second is left to the brand seal + a very faint piano tail.

**Key decision**: second 22 is this film's high point (not second 29). 29 is resolution, 22 is climax. Do not mix those two up.

## 1.5 What this film does **not** do (anti-AI-slop self-check)

In order of importance:

| Don't | Why |
|------|------|
| No purple gradients | The universal formula for "tech feel" in the training corpus; in 2026 it reads as cyber slop |
| No emoji as icons | The disease of "if it isn't professional, pad it with emoji" |
| No SVG figures / hands / abstract humanoids | AI-drawn SVG people always have misaligned features and absurd proportions |
| No Inter/Roboto/Arial as display | Too common, collides with system fonts |
| No cyber neon / deep blue ground #0D1117 | The over-copied GitHub dark mode aesthetic |
| No stacked effects (blur/glow/particle) | An effect used twice is decoration, three times is slop |
| No Lorem ipsum | Every block of dummy text uses something genuinely readable (including hooks like "md is the source. Anything else is product.") |
| No stock photos | No real photograph appears anywhere in the film (it's about typography, not lifestyle) |
| No progress bar + timecode + copyright slug | Those are player chrome, not content chrome — they collide with the host player |
| Don't let the md characters look the same in every scene | They need 13 states across 13 shots while keeping one core letterform |

## 1.6 One-line positioning

> **"Markdown is the new typewriter."**
>
> A 30-second film about source-of-truth thinking, made for designers who write and writers who design.

---

# Part II · Visual System

## 2.1 Full palette

Not 3 colors, 10. Every color has a **functional definition** (not "it looked good, so we used it").

```
Name           HEX        Role                                   Max share of frame
─────────────────────────────────────────────────────────────────────
Ivory paper    #FAFAF6    Primary ground (ivory white, one degree of warmth)   60-70%
Mist           #F2EDE4    Secondary background layer (the slight dark under card shadows)   < 15%
Mica           #E6E1D6    Hairlines / dividers / card borders    < 5%
Smoke          #6B6B6B    Secondary text / metadata              < 5%
Cinder         #3D3530    Secondary dark (umber black, not pure black)   < 10%
Ink            #1A1A1A    Primary black / primary text           20-25%
Charred        #2A2620    Deepest umber black (cover cards only) < 5%
Terracotta     #C2410C    Primary accent (Anthropic register)    5-8%
Terra Hot      #E55D21    Highlight variant (only the instant a NEW tag lights up) < 1%
Terra Deep     #8B2D08    Shadow variant (terracotta drop shadow)   < 1%
```

**Iron rules**:
- No shot uses any color outside those 10. **There is no "add a little cool gray just for this shot"**.
- The terracotta family (Terracotta + variants) totals under 10% of the frame, or the image overloads.
- Any text uses only one of 4 colors: Ink / Cinder / Smoke / Terracotta.

## 2.2 Type system

```
Size tier      Family                weight    Use                        Tracking (em)
────────────────────────────────────────────────────────────────────────────────────
Display XXL    Newsreader            700       slogan top line (200px)    -0.035
Display XL     Newsreader            700       capability number (48px)   -0.020
Display L      Newsreader            600       hero md characters (300-480px)   -0.040
Display M      Newsreader            600       chapter title (32-44px)    -0.015
Body L         Newsreader            400       essay body (18-22px)       0
Body M (zh)    Noto Serif SC         500       Chinese sub-line (20-26px)  +0.04
Italic         Newsreader italic     400       pull quotes, subheads      +0.01
Mono S         JetBrains Mono        500       labels / capability counter   +0.18
Mono XS        JetBrains Mono        700       NEW / version chip (11-14px)   +0.22
Caret          (block 3px wide)      —         typing cursor              —
```

**Font loading strategy**:
- Google Fonts preconnect `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- A single `<link>` request merges all weights, cutting round-trips
- Before recording MP4, `document.fonts.ready` must complete before the clock starts (Stage already implements this)

## 2.3 Grid system

**Main canvas**: 1920 × 1080

**Outer margin (safe zone)**: 80px top, bottom, left, right

**Main content area**: 1760 × 920

**12-column grid**: column-width = 132px, gutter = 16px

**Baseline grid**: 8px base rhythm. Every vertical position must be a multiple of 8 (unless there is a specific visual reason).

**Golden-ratio anchors**:
- Upper third line: y = 360
- Lower third line: y = 720
- Centerline: y = 540 (default anchor for the hero md)
- Golden section upper: y = 412
- Golden section lower: y = 668

**Key safe zones**:
- Within the top 60px: chrome element zone (capability counter, version chip)
- Within the bottom 60px: watermark / metadata zone
- Central 800×600 area: primary content zone (the hero element of every shot must land inside it)

## 2.4 Motion system

**Easing library** (4 curves total, others banned):

```
Name           Curve formula                       Use
──────────────────────────────────────────────────────────────────
expoOut       1 - 2^(-10t)                       default ease (90% of entrances use this)
overshoot     cubic-bezier(0.34, 1.56, 0.64, 1)  NEW tag pop / button appear
linear        t                                   ground fade / paper texture drift
expoIn        2^(10(t-1))                        exit ease (10% of exits use this)
```

**Duration dictionary**:

```
Event type                Duration      Notes
────────────────────────────────────────────────────────
character stagger         30-50ms       typing effect / slogan characters arriving in sequence
small element entrance    300ms         file card / pill / chip
medium element entrance   500ms         destination card / capability number
hero element entrance     700-900ms     md character morph
slogan character entrance 800ms         "ONE SOURCE." as a whole
transition between scenes 300ms overlap cross-dissolve + scale
exit                      200-300ms     exits are always faster than entrances
```

**Stagger rules**:
- When multiple elements come in together, delay neighbours by 30-80ms (not 0, and never over 100ms)
- 6 pills entering: 250ms of cumulative stagger (50ms each)
- Slogan characters entering: 280ms of cumulative stagger (~30ms × 10 characters)

**Transitions between scenes**:
- Always **cross-dissolve + soft scale** (never a hard cut)
- The outgoing shot over its final 300ms: opacity 1 → 0, scale 1 → 0.96
- The incoming shot over its first 300ms: opacity 0 → 1, scale 1.04 → 1
- The two overlap by 300ms (on the timeline the outgoing Sprite's end is 0.3s past the incoming shot's start)

## 2.5 Chrome elements (running through the whole film)

These are **the small things that never leave the frame**, and they supply the feeling that "this is a complete film".

**Chrome A · top-left · capability counter (00-22s)**

```
   ┌─────────────┐
   │  ●  CAP·01  │     pulse dot (terracotta) + label
   │  ●●●●○○○○○  │     6-dot progress (filled = current)
   └─────────────┘
```

- Type: JetBrains Mono 12px, letter-spacing 0.24em
- Color: Ink for label, Terracotta for the current dot, Mica for upcoming dots
- Motion: on every scene change, the next dot goes hollow → solid (500ms expoOut)

**Chrome B · top-right · version chip (02-30s)**

```
   ╔═════════════════════════╗
   ║ ● STUDIO-MD-HTML · v2.0 ║
   ╚═════════════════════════╝
```

- Type: JetBrains Mono 13px Bold, letter-spacing 0.22em
- Color: Terracotta dot + Ink label
- Entrance: whole thing fades in over 600ms at 02s
- pulse dot: one very faint breath every 4 seconds (opacity 1 → 0.6 → 1, 1500ms ease-in-out)

**Chrome C · bottom-center · timeline ticker (07-22s)**

```
   any→md  ━━━━●━━━━━━━━━━━━  md→html  ─  html→md  ─  md→docx  ─  md→pdf  ─  md→epub
```

- Type: JetBrains Mono 11px, letter-spacing 0.18em
- The current capability is Terracotta + bold, the rest are Smoke
- One horizontal rule joins the 6 names, the progress dot (●) slides left to right with time
- Entrance: the whole strip fades in over 500ms at 07s

**Chrome D · bottom-right · watermark (always on)**

```
   CREATED BY THE STUDIO
```

- Type: JetBrains Mono 10px, letter-spacing 0.24em
- Color: rgba(26,26,26,0.32)
- Completely static, never moves

**Chrome E · the faintest paper texture (always on)**

- SVG grain + an extremely slow 0.3% scale breath
- opacity ≤ 0.04
- Almost invisible on recording, but it lets the frame "breathe"

## 2.6 Audio system

### BGM arc (30-second segmented curve)

```
Intensity
 │                            ╱╲
1│                          ╱╱  ╲╲
 │                       ╱╱      ╲╲
 │                    ╱╱             ╲
 │                ╱╱                   ╲
 │            ╱╱                          ╲
 │       ╱╱                                  ╲
 │   ╱╱                                          ╲
0└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴
   0  2  4  6  8 10 12 14 16 18 20 22 24 26 28 30s
   │  │     │              │           │  │
 enter │  strings │    rhythm joins    │ peak │  decay
     piano                              swell
```

**Layers (each runs the full 30 seconds; intensity is shaped by envelopes)**:

- **L0 · Room tone** (00-30s): very faint background noise, so the frame does not feel dead
- **L1 · Piano single note** (00-08s): one piano note struck repeatedly, once every 1.2 seconds, accumulating slowly
- **L2 · Piano arpeggio** (03-22s): the arpeggio enters, giving the sense of "picking up the rhythm"
- **L3 · Cello drone** (08-22s): low string bed, giving "weight"
- **L4 · Pulse** (15-22s): very faint sub-kick, 4/4 feel (not a dance beat, a cinematic pulse)
- **L5 · String swell** (22-26s): the whole string section swells up to the climax
- **L6 · Decay + reverb tail** (26-30s): every layer decays, leaving piano + reverb

**Stylistic target**: Max Richter's *On the Nature of Daylight* + Ólafur Arnalds' *Re:member* + Jóhann Jóhannsson's *Orphée*

### SFX dictionary

```
Cue                          Time        Type               Level
────────────────────────────────────────────────────────────────────
keyboard click               00.5-02.0   keypress × 12      -18dB (30ms each)
cursor blink                 02.0-02.8   subtle tick        -28dB
md morph swell               02.8-03.2   soft whoosh + bloom -16dB
file card whoosh × 6         05.5-08.0   short whoosh       -20dB (200ms each)
absorb / ink drop            08.0-08.4   "absorb" splash    -16dB
paper rustle                 08.5-09.0   paper turn         -22dB
chime: capability 02 →       09.0        single chime tone  -18dB
chime: capability 03 →       12.0        single chime tone  -18dB
chime: capability 04 →       15.0        single chime tone  -18dB
chime: NEW (05)              18.0        double chime + glow -14dB
chime: NEW (06)              21.0        double chime + glow -14dB
build sweep                  22.0-22.6   ascending sweep    -10dB
impact (slogan ONE)          22.6        deep impact         -8dB
impact (slogan SIX)          23.4        deep impact         -8dB
pen flourish                 24.0-24.4   pen on paper        -22dB
final stamp / sign-off       29.0-29.5   ink stamp           -14dB
```

**SFX band separation** (so nothing fights):

- BGM owns the low band (40Hz-2kHz)
- SFX whooshes / chimes own the upper mids (2kHz-8kHz)
- SFX impacts own the low sub band (40Hz-120Hz) — overlapping the BGM cello, so the BGM ducks -3dB at the same moment

## 2.7 Anti-AI-slop checklist (per shot)

Every shot has to pass this checklist before it is executed:

```
□  No purple (at any saturation)
□  No rounded-corner card + left border accent combo (except the destination card's honest mica border)
□  No emoji as icons
□  No SVG-drawn figures / abstract humanoids
□  No color outside the Part II.1 palette
□  No Inter / Roboto / Arial as display
□  Tracking, leading and size all come from the Part II.2 type system (no "by feel" values)
□  Vertical positions are multiples of 8 (except for a deliberate visual reason)
□  Terracotta covers < 10% of this shot
□  This shot has at least one detail worth screenshotting on pause (the 120% signature)
□  The transition from the previous shot into this one is cross-dissolve + scale, not a hard cut
□  This shot ends by visually "making room" for the next one (it does not stay filled to the last frame)
```

---

# Part III · Story Arc

## 3.1 Three-act structure

**ACT I · SET-UP (00.0 — 06.0s)**

The viewer enters the frame. The question is posed: what is a source of truth?

- SHOT 01 (0.0-1.5s) · BLANK PAGE
- SHOT 02 (1.5-3.0s) · THE CURSOR
- SHOT 03 (3.0-5.0s) · THE TRANSFORMATION
- SHOT 04 (5.0-6.0s) · enters GATHERING (overlaps ACT II)

**ACT II · ESCALATION (06.0 — 22.0s)**

The answer unfolds: md is the source. It radiates 6 product chains outward.

- SHOT 04 (5.0-8.5s) · GATHERING (any → md)
- SHOT 05 (8.5-11.5s) · FIRST FLOWER (md → html)
- SHOT 06 (11.5-14.5s) · REVERSE FLOW (html → md)
- SHOT 07 (14.5-17.5s) · PUBLISHER GRADE (md → docx)
- SHOT 08 (17.5-20.5s) · ★ NEW · PRINT (md → pdf)
- SHOT 09 (20.5-22.5s) · ★ NEW · EBOOK (md → epub, overlaps ACT III by 0.5s)

**ACT III · PAYOFF (22.5 — 30.0s)**

The theme rises. The slogan appears. The brand seal.

- SHOT 10 (22.5-24.0s) · THE CONVERGENCE
- SHOT 11 (24.0-26.5s) · ONE SOURCE.
- SHOT 12 (26.5-29.0s) · SIX FORMS.
- SHOT 13 (29.0-30.0s) · SIGN-OFF

## 3.2 Emotion curve

```
Emotional intensity
 │                                       ╔═══╗
 │                                    ╔══╝   ╚══╗
 │                              ╔═════╝         ╚══╗
 │                          ╔═══╝                   ╚══╗
 │                       ╔══╝                          ╚══╗
 │                   ╔═══╝                                 ╚════════╗
 │             ╔═════╝                                              ╚══╗
 │       ╔═════╝                                                       ╚══
 │  ╔════╝
 │══╝
 0──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──>
    0     2     4     6     8    10    12    14    16    18    20    22    24    26    28    30s
    │     │     │            │           │            │            │     │     │
    blank cursor morph      gather       cap 02-04   cap 05/06 ★  slogan slogan sign-off
                                                                  ONE   SIX
                                                                  ──────►
                                                                  PEAK 24.5s
```

**Key emotional beats**:
- **02.0s**: the first keyboard click → the viewer is in
- **03.0s**: the md characters are born → the first "awe"
- **08.0s**: 6 file cards converge into md → the first click of "ah, so md is the source"
- **18.0s**: the first NEW tag lights up → the old user's "oh"
- **22.5s**: all chrome converges, ready for Act III → tension build-up peak
- **24.5s**: SIX FORMS. lands → emotional climax
- **30.0s**: the md seal rests in silence → resolution

---

# Part IV · Shot-by-Shot Storyboard

Format for each shot:

```
SHOT NN · NAME
[TIMECODE]  |  FUNCTION
[VISUAL]     frame composition
[TYPE]       exact typographic spec
[ANIM]       per element in/out/easing/delay
[AUDIO]      music beat + SFX cue
[CHROME]     state of the four corner elements
[ANTI-SLOP]  checklist items passed
[WHY]        continuity + escalation
```

---

## SHOT 01 · "BLANK PAGE"

**[TIMECODE]** 00.00 — 01.50s (1.5s) `|` **FUNCTION** Opening. Bring the viewer in. Give "empty" some time.

**[VISUAL]**

The entire 1920×1080 is Ivory paper #FAFAF6. **There is nothing in the frame.**

The only presence: one layer of the faintest paper texture (SVG grain + 0.3% scale, extremely slow breath), almost invisible, but it plants the subconscious reading that "this is a real sheet of paper".

Composition: completely empty. This is "white" in Kenya Hara's sense — not "not yet drawn", but "the content itself".

**[TYPE]** No text.

**[ANIM]**

- 0.00s · paper texture opacity 0 → 0.04 (500ms linear)
- 0.50-1.50s · the whole frame holds, no action. Let the viewer's eyes adapt to the white.
- 1.40-1.50s · slightly left of center (x=860, y=540), the position of a cursor begins to surface (transparent; it only becomes visible in the next shot)

**[AUDIO]**

- BGM: room tone enters (300ms fade-in to -38dB)
- SFX: none

**[CHROME]** All hidden. Chrome A/B/C/D/E have none of them appeared yet.

**[ANTI-SLOP]**

- ✅ No logo, no "Loading...", no brand front-loading
- ✅ No gradients, no effects
- ✅ This shot's pause-and-look signature: the frame has texture (paper) but never steals the scene

**[WHY]**

Apple's "Designed by Apple in California" opens the same way — it gives blankness some time. It tells the viewer "this film needs you to slow down". If you open with a pile of logos and chrome, the viewer's attention is scattered and you cannot win it back for the remaining 30 seconds.

These 1.5 seconds are one of the most important 1.5 seconds in the film.

---

## SHOT 02 · "THE CURSOR"

**[TIMECODE]** 01.50 — 03.00s (1.5s) `|` **FUNCTION** The typewriter is born. The first content.

**[VISUAL]**

Slightly left of center (x=860, y=540), a vertical black block (3px × 56px, Ink #1A1A1A) starts blinking. This is the cursor.

After two blinks (0.7s per cycle × 2), `# markdown.md` starts appearing character by character behind the cursor, JetBrains Mono 56px, Ink #1A1A1A, letter-spacing -0.01em.

Every character typed fires one keyboard click. After the last character (13 characters total), the cursor blinks once more after `.md`.

**[TYPE]**

- Text: `# markdown.md`
- Font: JetBrains Mono 500 weight
- Size: 56px
- Color: Ink #1A1A1A
- Letter-spacing: -0.01em
- Position: horizontal center, y = 540 (baseline; the text's vertical center sits slightly below it)

**[ANIM]**

- 01.50s · cursor block opacity 0 → 1 (200ms)
- 01.50-01.85s · cursor blink #1 (off 200ms / on 200ms)
- 01.85-02.20s · cursor blink #2
- 02.20-02.85s · 13 characters appear staggered, 50ms apart (650ms total), each character fading + 1px slide-down (180ms expoOut)
- 02.85-03.00s · the cursor blinks once more at the end (the last one, signalling input complete)

**[AUDIO]**

- BGM: the piano's first note struck at 01.50s (-22dB)
- SFX: keyboard click × 13 (one per character, -18dB, 30ms each)
- SFX: 200ms of silence after the final cursor blink (making room for the next shot's morph)

**[CHROME]** Still hidden.

**[ANTI-SLOP]**

- ✅ The cursor is not a sci-fi blink (not the 0.1s ultra-fast blink); it is a faithful simulation of a macOS terminal cursor's rhythm
- ✅ The typing is not "all characters appear at once"; it is genuinely paced typing
- ✅ The font is JetBrains Mono, not a system-default mono like Courier or Menlo
- ✅ pause-and-look signature: the cursor's 3px width (not 2px, not 4px) — an extremely precise detail that people who know will read as "this is real terminal design"

**[WHY]**

This shot is the heart of the set-up: **markdown is not a noun, it is an action** — it is the act of striking keys to turn characters into structure.

The cursor is the smallest unit of writing. Starting from a cursor is the birth of "source code".

The next shot's morph stands on the premise the viewer has already accepted: we are writing markdown.

---

## SHOT 03 · "THE TRANSFORMATION"

**[TIMECODE]** 03.00 — 05.00s (2.0s) `|` **FUNCTION** Reveal the hero. `# markdown.md` morphs into the hero `md.`

**[VISUAL]**

At 03.00s: `# markdown.md` (56px mono) starts collapsing toward center, scaling up and deforming.

**The morph, broken down**:

- 03.00-03.30s (300ms): the `#` and `arkdown` parts of `# markdown.md` fade out (opacity 1 → 0), while `m` and `d` — the `md` part — stay.
- 03.30-04.10s (800ms): the surviving `md` morphs from mono into Newsreader serif, from 56px up to 480px, from Ink to Ink (no color change), position unchanged (still frame center).
- 04.10-04.80s (700ms): at the lower right of the `md` characters, a Terracotta period `.` surfaces (fade-in + scale 0.6 → 1 + overshoot easing).
- 04.80-05.00s (200ms): the period settles; the hero is complete. 30px below it, a 320px-wide terracotta hairline (terracotta accent rule, 2px thick) opens outward from the center.

**Final frame**: `md.` (Newsreader 600 weight, 480px, Ink with a Terracotta dot) + one terracotta hairline below. Everything else in the frame is empty.

**[TYPE]**

- Text: `md.` (`md` Ink, `.` Terracotta)
- Font: Newsreader 600 weight
- Size: 480px (display L)
- Letter-spacing: -0.04em
- Color: `m`+`d` Ink #1A1A1A, `.` Terracotta #C2410C
- Centered horizontally and vertically on the hero centerline (y = 540)
- accent rule 30px below, width 320px (grows from 0)

**[ANIM]**

- 03.00-03.30s · `#` `arkdown` `md` (the middle run) fades out (opacity 1 → 0, expoOut)
- 03.30-04.10s · `md` morph: fontFamily swap, fontSize 56 → 480, weight 500 → 600 (800ms expoOut; note the morph is not an abrupt switch but a ghost residual overlay + scale up + opacity swap)
- 04.10-04.80s · `.` enters (700ms overshoot, scale 0.6 → 1)
- 04.80-05.00s · accent rule width 0 → 320px (300ms expoOut)

**[AUDIO]**

- BGM: piano note 2 at 03.00s (-20dB), note 3 at 04.20s (-18dB) — the piano accumulates
- SFX: 03.00-03.20s soft whoosh (as the morph begins, -16dB)
- SFX: 04.10s subtle bloom (the instant the period appears, -20dB)
- SFX: 04.80s short paper rustle (accent rule opening, -22dB)

**[CHROME]**

- 04.50s · Chrome B (version chip, top-right) starts to appear (fade-in 600ms)
  - Form: `● STUDIO-MD-HTML · v2.0`
  - terracotta dot, mono text, Ink color
  - Entry position: top: 78px, right: 80px
- Still hidden: Chrome A, C, E (visible only ≥ 06s)

**[ANTI-SLOP]**

- ✅ The morph is not the cheap "fade out + fade in" transition; it is real character deformation (with a ghost residual overlay)
- ✅ The period is the hero's signature detail (the 120% thing): the Terracotta period is the size of a fingernail, but it is this film's visual anchor, and **every later shot keeps that period as the hero's identifier**
- ✅ The accent rule is not decoration; it is the hero's baseline — it returns under the slogan in Shot 11, setting up the visual rhyme between open and close
- ✅ pause-and-look signature: in 480px Newsreader the -0.04em tracking makes `m` and `d` almost touch without touching — the signature texture of this face at large sizes

**[WHY]**

This is the hero shot. The film's protagonist (`md.`) is born here and carries the remaining 25 seconds.

The design philosophy of the morph: **mono → serif is the metaphor of "I am typing" → "I am writing"**. Mono is the typewriter; serif is publishing. md is both — it is struck on a keyboard, but it is the source code of publishing.

The next shot enters ACT II with the hero established — it gets pushed up the frame to free space for "materialized products".

---

## SHOT 04 · "GATHERING" (any → md)

**[TIMECODE]** 05.00 — 08.50s (3.5s) `|` **FUNCTION** CAPABILITY 01 reveal. Everything → md. Establish the worldview "md is the source".

**[VISUAL]**

05.00s: the hero `md.` slides up from frame center (y=540) to y=280 (a quarter of the height) while shrinking to 220px.

Then, in the lower half of the frame (the y=520 ~ y=900 band), 6 file cards appear, flying in from off-frame (below, y=1140) and converging on the md hero along an invisible parabolic path.

The design of the 6 cards (**each is a mini demo of a real file type, not fake bar lines**):

```
.pdf   │ two-column layout + page header "doc.pdf" + page number "— 12 —" + a few lines of really typeset body text
.docx  │ heading "On Markdown" + italic subhead + 6 lines of paragraph ascii
.pptx  │ title "MD AS SOURCE" + one simplified bar chart placeholder
.xlsx  │ a 6×4 spreadsheet grid + some numbers
.epub  │ an Apple Books–style page + chapter title "Chapter 01"
.html  │ a browser chrome (three dots + URL bar "example.com") + heading + paragraph
```

Each card is 130×180px, white ground + Mica border + 24° top-right corner fold.

**Flight paths**: launched from y=1140 below, converging along parabolas onto the "." of the md hero (around x=960+50, y=280+90). Mid-flight (in the middle of the frame) the 6 cards fan out, 220px apart. Finally all 6 are "absorbed" by md (scale 1 → 0.5 + opacity 1 → 0, position collapsing to a point).

Absorption timing: starting at 05.60s, one launched every 0.18s. Each flies for 1.1s before being absorbed. The last absorb completes around 07.60s.

Once absorption finishes (07.60-08.20s), a tagline appears 60px below: "everything → md" (Chinese serif, 36px, Ink, italic).

08.20-08.50s · the whole frame holds, ready for Shot 05.

**[TYPE]**

- hero `md.`: shrunk to 220px (same font spec as SHOT 03)
- inside the 6 cards: JetBrains Mono 12-14px for labels, Newsreader 12-16px for content
- tagline "everything → md": Noto Serif SC 36px italic + the → in the middle is Newsreader italic + Terracotta
- Chrome A text at top: JetBrains Mono 12px

**[ANIM]**

- 05.00-05.30s · hero md scales down and moves up (300ms expoOut)
- 05.30s · Chrome A capability counter enters (showing CAPABILITY · 01, first dot solid)
- 05.60-07.60s · 6 cards launch in sequence (launch delay = 5.60 + i × 0.18s, 1.1s of flight each, absorb at launch+1.1)
- 07.60-08.20s · tagline "everything → md" enters (fade-in 400ms + slight y slide 12px → 0)
- 08.20-08.50s · hold

**[AUDIO]**

- BGM: piano arpeggio L2 enters at 05.00s (-26dB → -20dB, fading in)
- SFX: file card whoosh × 6 (one per launch, 200ms each, -20dB)
- SFX: absorb / ink drop (as the last card is absorbed, -16dB)
- SFX: paper rustle (as the tagline enters, -22dB)

**[CHROME]**

- A (top-left capability counter): ON, showing `CAPABILITY · 01`, first dot solid
- B (version chip): ON, always visible
- C (timeline ticker): OFF (enters in SHOT 05)
- D (watermark): ON, always ON
- E (paper texture): ON

**[ANTI-SLOP]**

- ✅ The 6 cards are not emoji and not icons; they are **mini demos with interiors** — every one is readable
- ✅ The flight paths are parabolic (gravity), not straight lines (computer graphics)
- ✅ The convergence is "absorption" (scale + position collapsing together), not "stacking"
- ✅ No glow or particle effects are given to the md characters (there is no need to explain "md is absorbing"; the viewer gets it)
- ✅ pause-and-look signature: pause mid-flight on any card and you can read "this is a PDF / this is a DOCX" — that is the detail done to 120%
- ✅ The tagline uses "→" rather than "to", because that is markdown's own character

**[WHY]**

This is ACT II's opening shot. If the viewer does not get "oh, md is the source" within these 3.5 seconds, the rest of the film is wasted.

There are 3 micro-narrative beats in 3.5 seconds:
1. the hero makes room (md moves up) — implying "I make room for my products"
2. the 6 products appear — revealing "what I can take in"
3. all of them return to md — "but in the end they are all md"

The next shot moves into the forward flow md → html — the viewer has accepted "md is the source" and is now ready to see "how md turns into things".

---

## SHOT 05 · "FIRST FLOWER · HTML" (md → html)

**[TIMECODE]** 08.50 — 11.50s (3.0s) `|` **FUNCTION** CAPABILITY 02. The first forward output. Establish the ScenePipeline pattern (the next 5 shots reuse this structure).

**[VISUAL]**

08.50s: the hero `md.` slides from its position above center to the left side of the frame (x=480, y=540), size unchanged at 220px.

At the same time a destination card appears on the right (x=1400, y=540): a simulated "Tufte CSS–style essay html".

The destination card design (**really readable content, not bar lines**):

```
┌─────────────────────────────────┐
│                                  │
│  On Markdown                     │  ← Newsreader 600, 32px, Ink
│  AN ESSAY · 2026                 │  ← Mono 11px, 0.18em, Smoke
│  ▬▬▬                             │  ← Terracotta rule 60×3px
│                                  │
│  md is the source of truth.      │  ← Newsreader 400, 18px, line-height 1.7
│  Anything else is product.       │
│  We write once. Publish six      │
│  ways. The river forks; the      │
│  spring stays the same.          │
│                                  │
│  ─ the studio, 2026.05.11        │  ← italic 14px, Smoke
│                                  │
│  article.html · TUFTE THEME      │  ← Mono 10px, 0.18em, Smoke (bottom)
└─────────────────────────────────┘
   480px wide × 560px tall
   white ground + Mica border + 24° corner fold
```

The md characters and the destination card are joined by a terracotta hairline that starts at md's dot, grows 380px to the right, and whose arrowhead touches the card's left edge. 30px above the line sits a label, "md → html" (JetBrains Mono 14px Terracotta, letter-spacing 0.14em).

At 09.80s: Chrome C (timeline ticker) enters for the first time, pinned at y=1000.

**[TYPE]**

- See the visual description above, embedded
- label "md → html" is 14px, Mono Bold, Terracotta, letter-spacing 0.14em
- the destination card's top chapter title is Newsreader 600, 32px, Ink
- the destination card's bottom colophon is mono 10px Smoke 0.18em

**[ANIM]**

- 08.50-08.80s · hero md slides from center-top to left-mid (300ms expoOut)
- 08.80-09.10s · arrow line grows right from md.dot (300ms expoOut, 0 → 380px)
- 09.10s · arrowhead appears (200ms overshoot)
- 09.20-09.40s · label "md → html" enters (fade-in + 8px y slide-down, 300ms expoOut)
- 09.40-10.10s · the destination card enters as a whole (700ms expoOut, scale 0.85 → 1 + opacity 0 → 1)
- 10.10-10.80s · the destination card's interior enters staggered: title (400ms, delay 0) → subhead metadata (delay 200ms) → terracotta rule (delay 400ms) → 6 lines of body (60ms cascade each) → signature (delay 1000ms) → bottom mono (delay 1100ms)
- 10.80-11.50s · hold + micro breath (overall scale 1 → 1.005 → 1, 600ms ease-in-out infinite, but this shot only plays half a cycle)

**[AUDIO]**

- BGM: cello drone L3 enters at 09.00s (-30dB → -24dB)
- SFX: chime: capability 02 at 09.00s (-18dB)
- SFX: paper rustle (as the card enters, -22dB)
- SFX: micro ticks (as each line of text enters staggered, -26dB each)

**[CHROME]**

- A: advanced to `CAPABILITY · 02`, second dot solid
- B: ON
- **C: first entrance** at 09.80s, `any→md  ━━━━●━━━━━  md→html  ─  html→md  ─  md→docx  ─  md→pdf  ─  md→epub`, the progress dot ● sitting above the second cell
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ The "On Markdown" essay inside the destination card is genuinely readable English philosophical prose, not Lorem ipsum
- ✅ "article.html · TUFTE THEME" as a colophon is the "detail signature you can read on pause"
- ✅ No glow or particles were used to "emphasize" the md → html conversion — typography and composition carry it
- ✅ The arrow line is not dashed or dotted (avoiding the "web tutorial" look); it is a 1.5px solid Terracotta
- ✅ pause-and-look signature: the "AN ESSAY · 2026" subhead at the top of the destination card uses Newsreader's small caps OpenType feature at 0.18em tracking — this shot's 120% detail

**[WHY]**

This is where the ScenePipeline pattern is first established. The next 5 capability shots all advance on this structure:
1. md on the left, destination on the right
2. arrow + label in the middle
3. the destination card's interior enters staggered (every card has 6-8 typographic levels)
4. card content is genuinely readable, not fake bar lines

By the second time (SHOT 06) the viewer understands the pattern, and by the sixth (SHOT 09) they get "ah, here we go again, but this time it's NEW" — that is exactly ACT II's rhythmic design.

---

## SHOT 06 · "REVERSE FLOW · MD" (html → md)

**[TIMECODE]** 11.50 — 14.50s (3.0s) `|` **FUNCTION** CAPABILITY 03. Reverse archiving: html → md. Establish the "bidirectional flow" idea.

**[VISUAL]**

Enters on a cross-dissolve. During 11.50-11.80s the previous shot's destination card shrinks away into the bottom-right corner, and a new destination card (this time showing markdown source) enters from the right.

The new destination card design: **a dark-ground markdown source view** (a deliberate visual contrast with SHOT 05's light html).

```
┌─────────────────────────────────┐
│                                  │  ← background Charred #2A2620
│  # On Markdown                   │  ← Terracotta, mono 14px
│                                  │
│  An essay · 2026                 │  ← Smoke, mono 14px
│                                  │
│  > md is the source.             │  ← italic Smoke, mono 14px
│  > Anything else is **product**. │     `**product**` highlighted mica + bold
│                                  │
│  - 1 source                      │  ← mono 14px Smoke
│  - 6 forms                       │
│  - ∞ outputs                     │
│                                  │
│  essay.md · CLEAN MARKDOWN       │  ← bottom Mono 10px Smoke
└─────────────────────────────────┘
   480×560px, Charred ground, the 24° top corner fold is Cinder
```

The arrow direction reverses: from the destination card on the right toward the md characters on the left (a short Terracotta line + arrowhead pointing left). The label becomes "html → md".

**Key points of difference** (forming a visual rhyme with SHOT 05):
- destination on the right, md on the left (same as SHOT 05)
- but the arrow direction reverses (visually: we are archiving, pulling it back)
- the card is dark-ground (visual contrast, emphasizing that this is the source)

**[TYPE]**

- Everything inside the card is JetBrains Mono 14px
- markdown syntax colors: `#` heading in Terracotta, `>` quote in italic Smoke, `**bold**` Mica + bold, list dashes Smoke
- bottom mono 10px Smoke

**[ANIM]**

- 11.50-11.80s · the previous card exits (shrinking toward the bottom-right corner, fading out) + md characters hold
- 11.80-12.10s · arrow line grows in reverse (this time right to left, 300ms expoOut)
- 12.10s · arrowhead (pointing left) appears
- 12.20-12.40s · label "html → md" enters
- 12.40-13.10s · the new destination card enters (same entrance logic as SHOT 05)
- 13.10-13.80s · the markdown's 6 interior lines enter staggered (100ms delay each)
  - special micro-detail: each line enters simulating a typewriter — a character-by-character cascade reveal for the line (so the viewer feels "this is markdown being written out")
- 13.80-14.50s · hold

**[AUDIO]**

- BGM: L1+L2+L3 layers continue
- SFX: chime: capability 03 at 12.00s (-18dB)
- SFX: paper rustle (12.40s)
- SFX: a very faint keyboard click ticker as each line enters (-26dB each, 100ms apart)

**[CHROME]**

- A: advanced to `CAPABILITY · 03`, third dot solid
- B: ON
- C: progress dot ● slides to the "html→md" position
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ This is the film's only dark-ground shot — deliberately creating visual contrast so the viewer knows "this is source code", not "here comes another destination"
- ✅ The syntax highlighting inside the markdown does not use cyber colors (not VS Code Dark+ style); it uses publishing colors (Terracotta + Smoke + Mica)
- ✅ "essay.md · CLEAN MARKDOWN" as the bottom colophon → pause-and-look signature
- ✅ The reverse arrow is not a U-turn curve; it is a straight line + a reversed arrowhead — structural consistency

**[WHY]**

This shot's real job is not "show off capability 03"; it is **to tell the viewer that this pipeline runs both ways**.

If all 6 capabilities in the film radiated outward from md, the viewer would assume "md only goes out". Capability 3 reverses the flow and establishes the worldview "md is the hub of everything".

That is why I ordered the capabilities 02 (md→html) → 03 (html→md) → 04 (md→docx) — I parked the reverse capability in slot 3 on purpose, to maximize the cognitive surprise of "it flows both ways".

---

## SHOT 07 · "PUBLISHER GRADE · DOCX" (md → docx)

**[TIMECODE]** 14.50 — 17.50s (3.0s) `|` **FUNCTION** CAPABILITY 04. A publisher-taste docx. Establish the argument that "md is not only for programmers".

**[VISUAL]**

Back to the light ground, back to "md on the left, destination on the right".

The destination card design: **a publisher-grade docx chapter opening page** (high information density, but completely restrained).

```
┌─────────────────────────────────┐
│                       ON MARKDOWN│  ← page header, right-aligned, Smoke italic mono 9px
│  CHAPTER · 01                    │  ← Terracotta mono 11px bold 0.22em
│                                  │
│  On Markdown                     │  ← Newsreader 700, 36px, Ink, lh 1.1
│  A short essay on source-of-truth│  ← Newsreader italic 14px, Smoke
│  thinking                        │
│                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━     │  ← Terracotta full-width rule 3px
│                                  │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬       │  ← 10 lines of mica bar paragraphs
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬           │     (varied widths 76-95%)
│  ...                             │
│                                  │
│                — 1 —             │  ← page number, centered, mono 10px Smoke
└─────────────────────────────────┘
   480×580px, white card, Mica border, 24° corner fold
```

**Specific details**:
- the page header in the top-right corner (book title in italic gray mono) is the detail signature of a real publisher's docx
- the "CHAPTER · 01" prefix tells the viewer at a glance "this is a page of a book, not an article"
- the terracotta full-width rule (not a hairline — a 3px rule) is the signature of a publisher's chapter opening page
- the dashes around the page number "— 1 —" at the bottom are Newsreader em dashes, not hyphens

**[TYPE]**

- page header: Newsreader italic 9px, Smoke, letter-spacing 0.14em
- CHAPTER · 01: JetBrains Mono Bold 11px, Terracotta, letter-spacing 0.22em
- main title: Newsreader 700, 36px, Ink, line-height 1.05
- subtitle: Newsreader italic 14px, Smoke
- terracotta rule: 3px thick, full card width
- bar paragraphs: Mica color #E6E1D6, height 6px
- page number: JetBrains Mono 10px, Smoke, letter-spacing 0.18em

**[ANIM]**

- 14.50-14.80s · the previous card exits + md holds
- 14.80-15.10s · arrow line grows forward
- 15.10s · arrowhead, label "md → docx" enters
- 15.30-16.10s · the destination card enters as a whole
- 16.10-17.00s · interior stagger: page header (delay 0) → CHAPTER label (delay 100ms) → title (delay 300ms) → subtitle (delay 500ms) → rule (delay 700ms) → 10 lines cascading (delay 850ms + 60ms cascade) → page number (delay 1600ms)
- 17.00-17.50s · hold

**[AUDIO]**

- BGM: continues; at 15.00s the whole BGM swells +2dB (signalling we are climbing toward the climax)
- SFX: chime: capability 04 at 15.00s (-18dB)
- SFX: paper rustle (15.30s)

**[CHROME]**

- A: `CAPABILITY · 04`, fourth dot solid
- B/C/D/E: ON

**[ANTI-SLOP]**

- ✅ No explanatory caption saying "this is a mockup of a book's inner page" (let the typesetting speak)
- ✅ Bar paragraphs use Mica (#E6E1D6), a very faint gray, not black — an honest signal that "this is a typesetting preview, not real content"
- ✅ pause-and-look signature: the right-aligned italic mono page header at the top — 99% of viewers will not notice, and the 1% who are designers will know "this shop did the homework"
- ✅ This is the most saturated shot of the 6 capabilities (Terracotta on the page rule + the chapter label + the top-right chrome counter) — exactly mid-story-arc, matching the build-up curve

**[WHY]**

CAPABILITY 04 is the hinge shot:
- it confirms that "md is not only for the web" — it can produce publisher-grade docx
- it establishes the "printed matter" visual context, preparing SHOT 08 (pdf) and SHOT 09 (epub)

After this shot the viewer is ready for the "md → printed matter" chain. The NEW tags in the next two shots then have something to land on.

---

## SHOT 08 · "★ NEW · PRINT" (md → pdf)

**[TIMECODE]** 17.50 — 20.50s (3.0s) `|` **FUNCTION** CAPABILITY 05. **NEW**. md → publication-grade PDF. The first "upgrade" marker lights up.

**[VISUAL]**

Enters on a cross-dissolve. This shot's visual intensity is **markedly higher** than SHOT 05-07 — because this is "the new thing" and it has to be remembered.

What is visually different:
1. **NEW tag**: top-left, beside the capability counter, a Terracotta rectangle lights up containing the characters "★ NEW" (JetBrains Mono Bold 13px, Terracotta, letter-spacing 0.22em, 4px Terracotta border, 6px×12px padding)
2. **The destination is not one card but two PDFs fanned out**: A4 behind (rotated a slight +5°), Large 32mo (176×240mm, the Chinese trade paperback format) in front (rotated a slight -3°), forming the visual "both page sizes supported"
3. **Every PDF carries printer crop marks** — one L-shaped mark in each corner, 2px thick, Smoke — the detail of a real print-shop PDF
4. arrow + label are all Terracotta (not Ink), so the overall palette runs warmer

**The content of the two PDFs**:

PDF A (A4, behind):

```
┌──────────────────────────┐
│ ┌                      ┐ │  ← crop marks
│  A4 · 210×297mm           │  ← Mono Bold 10px Terracotta
│  ─── (Terracotta rule)    │
│  On Markdown              │  ← Newsreader 22px
│  ──────────────────       │
│  ▬▬▬▬▬▬▬▬▬▬▬             │  ← 7 lines mica bars
│  ▬▬▬▬▬▬▬▬▬▬▬▬            │
│  ...                      │
│                           │
│ └                      ┘ │  ← crop marks
└──────────────────────────┘
   360×460px, white card, +5° rotation
```

PDF B (Large 32mo, in front):

```
┌────────────────────────┐
│ ┌                    ┐ │  ← crop marks
│  Large 32mo · 176×240mm│  ← Mono Bold 10px Terracotta
│  ───                  │
│  On Markdown          │  ← Newsreader 19px
│  ──────────           │
│  ▬▬▬▬▬▬▬▬▬▬          │  ← 6 lines mica bars
│  ...                  │
│ └                    ┘ │
└────────────────────────┘
   290×410px, white card, -3° rotation
```

**[TYPE]**

- NEW tag: Mono Bold 13px Terracotta, 0.22em letter-spacing, 1.5px Terracotta border
- arrow label "md → pdf": Mono Bold 14px Terracotta, 0.14em
- PDF spec labels (A4 · 210×297mm etc.): Mono Bold 10px Terracotta, 0.2em
- chapter titles inside the PDFs: Newsreader 600 weight, 19-22px, Ink

**[ANIM]**

- 17.50-17.80s · the previous card exits + md holds
- 17.70s · **the NEW tag lights up** (special handling: scale 0.8 → 1.1 → 1.0 over 400ms with overshoot easing; at the same time a very faint terracotta glow pulses briefly and disappears)
- 17.80-18.10s · arrow + label enter (Terracotta accent this time, stressing "this is NEW")
- 18.20-18.60s · PDF B (the front one) enters (400ms expoOut, scale 0.85 → 1 + clockwise -8° → -3°)
- 18.50-18.90s · PDF A (the back one) follows (400ms expoOut, scale 0.85 → 1 + clockwise 0° → +5°, stagger delay 300ms)
- 18.90-19.70s · both PDFs' interiors enter in a cascade
- 19.70s · the 4 crop marks (on PDF B) appear in sequence (80ms cascade, the detail signature of "print-shop craft")
- 19.70-20.50s · hold

**[AUDIO]**

- BGM: percussion pulse L4 joins at 18.00s (-32dB) (a very faint sub-kick establishes 4/4)
- **SFX: chime: NEW (05) at 17.70s (double chime + soft glow + reverb tail, -14dB)** ← one of the most important SFX cues in the film
- SFX: paper rustle × 2 (as each PDF enters, -22dB each)
- SFX: subtle "ink stamp" at 19.70s (as the crop marks appear, -22dB)

**[CHROME]**

- A: `CAPABILITY · 05`, fifth dot solid
- A gains a NEW tag beside it
- B: ON; the orange dot by the version chip pulses in sync (stressing "new in v2.0")
- C: progress dot ● slides to the "md→pdf" position, and the text at that position grows by 0.5px for emphasis
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ The NEW tag is not an emoji or a sticker — it is a typographic mark (mono + 0.22em + ★ + border)
- ✅ The two PDFs are not a cheap pile — they are fanned + rotated (implying the physical act of opening them)
- ✅ Crop marks are the visual expression of a real print-shop term; on pause you can see "ah, this is print-ready"
- ✅ No glow or particles were used to stress "NEW" — typography and SFX carry it
- ✅ pause-and-look signature: the "Large 32mo · 176×240mm" line at the top of PDF B sets the Chinese trim-size name next to metric dimensions — the studio's respect for the Chinese trade paperback

**[WHY]**

This is one of ACT II's climax shots. Two things have to happen at once:
1. the viewer must immediately register "this is a new feature"
2. the visual detail must say "this is not a padded wkhtmltopdf wrapper, this is genuinely publication-grade"

NEW tag + crop marks + two fanned PDFs + full A4 / Large 32mo specs — four devices doing those two jobs.

The next shot's epub is the second of the two NEW shots, and its tempo and emotional intensity have to step up one more notch.

---

## SHOT 09 · "★ NEW · EBOOK" (md → epub)

**[TIMECODE]** 20.50 — 22.50s (2.0s) `|` **FUNCTION** CAPABILITY 06. **NEW**. md → standard EPUB3. The second new feature. The last capability.

**[VISUAL]**

Enters on a cross-dissolve. This shot is **shorter than the ones before it** (2.0s instead of 3.0s) — because the "NEW + destination" pattern is already established, the viewer reads it instantly the second time, and the tempo can accelerate.

The destination card design: **an Apple Books–style EPUB reader frame** (stressing the realism of "this book is already in a reader").

```
   ╔════════════════════════════════════╗
   ║ ● ● ●                              ║  ← window chrome (Apple Books)
   ╠════════════════════════════════════╣
   ║                                    ║
   ║  STUDIO · ORANGE BOOK              ║  ← Mono Bold 10px Terracotta 0.22em
   ║                                    ║
   ║                                    ║
   ║  On                                ║  ← Newsreader 700, 30px, Ivory paper
   ║  Markdown                          ║     (on Charred bg)
   ║                                    ║
   ║  ───                               ║  ← Terracotta rule 40×2px
   ║                                    ║
   ║  an essay · the studio             ║  ← italic 14px Smoke on Charred
   ║                                    ║
   ╠════════════════════════════════════╣
   ║ Apple Books · 1 of 24    EPUB 3   ║  ← Mono 10px Smoke 0.14em
   ╚════════════════════════════════════╝
   460×470px, ivory paper outer + Charred inner book cover area
   2px Ink border, 22px border-radius (modern app frame)
```

**Key visual differences**:
- the whole frame reads as a "macOS app window" (three dots + 22px radius)
- inside it is the "open e-book" cover area (Charred ground + publisher-taste typography)
- at the bottom is the "Apple Books · 1 of 24" reader chrome
- the whole card delivers the realism of "I am reading this book in Apple Books"

**[TYPE]**

- STUDIO · ORANGE BOOK: Mono Bold 10px, Terracotta, 0.22em
- book title (On Markdown): Newsreader 700, 30px, Ivory (on Charred bg), line-height 1.0
- terracotta rule: 40×2px
- author italic: Noto Serif SC italic 14px, Smoke
- Apple Books chrome: Mono 10px, Smoke, 0.14em

**[ANIM]**

- 20.50-20.80s · the previous PDF exits + md holds
- 20.70s · the NEW tag **stays lit** (it does not pop again this time, because SHOT 08 already established it — just show "★ NEW")
- 20.80-21.10s · arrow + label "md → epub" enter (Terracotta accent, as in SHOT 08)
- 21.20-21.80s · the EPUB destination card enters as a whole (600ms expoOut, scale 0.88 → 1)
- 21.30-22.00s · interior stagger: window chrome dots (delay 0) → top brand label (delay 200ms) → book title "On" (delay 400ms) → "Markdown" (delay 480ms) → rule (delay 700ms) → author italic (delay 850ms) → bottom chrome (delay 1000ms)
- 22.00-22.50s · hold + prepare the transition into ACT III

**[AUDIO]**

- BGM: percussion continues, but at 22.00s the whole BGM swells +3dB (building up for SHOT 10's convergence)
- **SFX: chime: NEW (06) at 20.70s (double chime + soft glow, half a step higher than SHOT 08, -14dB)** — the semitone difference gives the two NEW shots a musical relationship
- SFX: window chrome subtle "click" at 21.20s (the feel of a macOS window appearing, -24dB)
- SFX: page turn rustle at 21.40s

**[CHROME]**

- A: `CAPABILITY · 06`, sixth dot solid (**all solid — 6/6**)
- the NEW tag beside A persists
- B: the version chip's orange dot pulses harder (amplitude × 1.5)
- C: progress dot ● reaches the far right, the "md→epub" position
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ No real Kindle or Apple Books logo is drawn (avoiding IP risk); a macOS window chrome is enough to imply "reader"
- ✅ No e-ink gray filter (avoiding Kindle slop)
- ✅ The "Apple Books · 1 of 24" chrome reads as real publishing data (24 chapters, chapter 1)
- ✅ pause-and-look signature: the book title "On / Markdown" is **line-broken** — Newsreader's line-breaking at 30px, a nod to Penguin Classics cover typography

**[WHY]**

This shot closes ACT II. Two things must complete:
1. all 6 capabilities shown (counter 6/6 solid)
2. the emotion starts building toward the ACT III climax

The shot length going 3.0 → 2.0s is deliberate — the tempo is accelerating and the viewer feels "we are heading for the peak".

---

## SHOT 10 · "THE CONVERGENCE"

**[TIMECODE]** 22.50 — 24.00s (1.5s) `|` **FUNCTION** The transition from ACT II → ACT III. Every element returns home. Preparing the slogan.

**[VISUAL]**

22.50s: all previous destination cards have exited. Chrome A/C begin to fade out (the capability counter is 6/6 complete; its mission is done).

At frame center, the md characters slide back from the left position (x=480) to dead center (x=960), growing from 220px → 300px.

Around md, the 6 capability labels (any→md / md→html / html→md / md→docx / md→pdf / md→epub) surface one by one from a distance (circle r=380px), ringing the md characters, one every 60°, in clockwise order (starting at the top with "any→md"). These labels mix Mono Bold 14px Smoke (not active) + Terracotta (actually new).

Overall effect: **the md characters are the sun; the 6 capabilities are planets.**

But this shot does not need the viewer to linger — it is a transitional shot.

23.50-24.00s: the 6 capability labels fade out slowly (200ms each, inverse cascade), the md characters stay centered, shrinking to 180px, making room for the slogan.

**[TYPE]**

- the 6 capability labels: JetBrains Mono Bold 14px, letter-spacing 0.16em
  - the first 4 (any→md / md→html / html→md / md→docx): Smoke
  - the last 2 (md→pdf / md→epub): Terracotta

**[ANIM]**

- 22.50-22.80s · the previous EPUB card exits, Chrome A/C fade out (300ms linear)
- 22.50-23.00s · md characters slide back to center + scale up (500ms expoOut)
- 22.80-23.40s · the 6 capability labels surface around md (each at its 60° position, r=380px, stagger 80ms each, fade-in 300ms + a tiny 20px outward slide)
- 23.40-23.80s · hold (the 6 labels settle around md)
- 23.80-24.00s · the 6 labels fade out together (200ms linear), md characters shrink to 180px (200ms expoOut)

**[AUDIO]**

- BGM: at 23.00s the all-layer swell begins (L1+L2+L3+L4 → +4dB)
- BGM: at 23.50s the percussion drops out for one beat (the tension of sudden silence)
- SFX: a very faint "click" as each of the 6 capability labels enters (-30dB each, staggered)
- SFX: from 23.50s an ascending sweep (building up to 24.00s)

**[CHROME]**

- A: fades out at 22.50s (the counter is 6/6, mission accomplished)
- B: ON, but it starts preparing for the ACT III transition (position unchanged, interior spacing slightly tightened)
- C: fades out at 22.50s
- D: ON
- E: ON

**[ANTI-SLOP]**

- ✅ The 6 capability labels do not "orbit md" (avoiding the cyber-slop "planet spinner"); they "settle in fixed positions, then fade together" (more restrained)
- ✅ Chrome A/C leave gracefully once their mission is done (they do not live on the frame forever) — a good habit: make room for the next act
- ✅ pause-and-look signature: at 23.40s all 6 labels are on the frame at once; read clockwise, it is the film's only "full capability panorama" frame — if the viewer pauses here they see all 6 pipelines complete — this is the best frame for a marketing screenshot

**[WHY]**

This is a bridge.

ACT II ends at 22.50s (NEW (06) just landed), but the slogan does not enter until 24.00s — those 1.5 seconds cannot be "blank waiting"; they must carry narrative motion.

The idea of "convergence": once the 6 pipelines are done, every capability collapses back into md, the source. That is exactly the essence of this film's whole story — **every flow ends up back at the source**.

Next shot: make room for the slogan. The md characters shrink to 180px, ready to become the slogan's "brand seal".

---

## SHOT 11 · "ONE SOURCE."

**[TIMECODE]** 24.00 — 26.50s (2.5s) `|` **FUNCTION** ACT III peak, first half. The slogan's upper line enters. Emotional climax.

**[VISUAL]**

The md characters are now 180px, resting at frame center (y=540).

24.00s: the md characters **keep sliding toward the frame's top-left** to (x=128, y=88), shrinking to 56px — becoming the "brand seal" fixed in the top-left corner. The brand returns home.

24.20s: slightly above center (y=460), the hero slogan's top line starts to surface:

```
ONE SOURCE.
```

Type: Newsreader 700, **168px**, letter-spacing -0.03em, line-height 0.95, Ink #1A1A1A
Position: horizontally centered (x=960), y=460 (character baseline)

Entrance: **staggered letter reveal** — the 10 characters (O-N-E-space-S-O-U-R-C-E-.) enter in sequence on a 30ms stagger, each fading + a 12px y slide-down + scale 0.92 → 1.0 (260ms expoOut each).

26.00s: 30px below the slogan, a short Terracotta rule (320×3px) opens outward from the center (300ms expoOut).

26.50s: into the next shot.

**[TYPE]**

- ONE SOURCE.: Newsreader 700, 168px, Ink, letter-spacing -0.03em, line-height 0.95
- terracotta rule: 320×3px, centered, accent

**[ANIM]**

- 24.00-24.30s · md characters slide to the top-left (300ms expoOut, size 180 → 56)
- 24.20s · the first character of ONE SOURCE., 'O', enters (260ms expoOut)
- 24.23s · 'N' enters
- 24.26s · 'E' enters
- 24.29s · space (no visual, but it occupies layout)
- 24.32s · 'S'
- 24.35s · 'O'
- 24.38s · 'U'
- 24.41s · 'R'
- 24.44s · 'C'
- 24.47s · 'E'
- 24.50s · '.' (the period)
- 24.20-25.00s · the whole ONE SOURCE. completes (10 characters × 30ms stagger + 260ms each = ~560ms total)
- 25.00-26.00s · hold (let the viewer read "ONE SOURCE.")
- 26.00-26.30s · the Terracotta rule appears (300ms expoOut, 0 → 320px)
- 26.30-26.50s · hold

**[AUDIO]**

- BGM: the swell that started at 22.00s peaks at 24.50s (loudest at -6dB)
- BGM: the full string section comes in (L5), cello + violin + viola stacked three deep
- **SFX: impact (slogan ONE) at 24.20s — deep bass impact + short reverb tail (-8dB)** ← the strongest SFX cue in the film
- SFX: a very light pen-on-paper stroke at 26.00s (as the rule appears, -22dB)

**[CHROME]**

- A: OFF (has exited)
- B: ON, but with an **important change**: the version chip cross-dissolves into a new form here — same position in the top-right, but the chip is slightly larger, type at 18px (was 16px), more prominent. At the same time the Terracotta dot's pulse amplitude × 2 (stressing "the v2.0 upgrade moment")
- C: OFF (has exited)
- D: ON
- E: ON

**New chrome**:
- the md characters (top-left, 56px, Newsreader 600 + Terracotta dot) formally take residence in the corner and become the brand seal

**[ANTI-SLOP]**

- ✅ The slogan is not a "whole-word fade-in" (cheap); it is a letter-by-letter stagger (cinema grade)
- ✅ The 30ms per-character stagger is calculated — enough to see the cascade, not enough to slow the tempo (60ms would read as sluggish)
- ✅ The 168px size is layout-verified — larger would collide with SIX FORMS. (SHOT 12), smaller would lose authority
- ✅ pause-and-look signature: the "." at the end of "ONE SOURCE." is Terracotta (not Ink), echoing the hero md characters' Terracotta dot — the brand signature is consistent from first frame to last

**[WHY]**

This is the first half of the emotional climax.

"ONE SOURCE." is the thesis of the film. If the viewer remembers one sentence from the whole thing, it is this one.

Moving the md characters to the top-left at this moment is strategic — the slogan is the lead, md is the brand seal. They do not compete.

Next shot: SIX FORMS. lands, and the thesis completes.

---

## SHOT 12 · "SIX FORMS."

**[TIMECODE]** 26.50 — 29.00s (2.5s) `|` **FUNCTION** ACT III peak, second half. Slogan's lower line + the full capability map. The film's emotional resolution.

**[VISUAL]**

26.50s: ONE SOURCE. is still in the upper part of the frame (y=460).

The lower part of the frame (y=720) begins the entrance of the hero slogan's bottom line:

```
SIX FORMS.
```

Type: Newsreader 700, 168px, letter-spacing -0.03em, line-height 0.95, **Terracotta #C2410C**
Position: horizontally centered (x=960), y=720 (character baseline)

Entrance: mirrored against SHOT 11 — staggered letter reveal, 9 characters + 1 period (10 total), 30ms stagger each (a slower stagger, because this is the climax).

Entrance detail: each character fades + a 12px y **slide-up** (rather than SHOT 11's slide-down, so the directions mirror) + scale 0.92 → 1.0 (260ms expoOut each).

27.20s: SIX FORMS. completes, and the two-line slogan typography is whole.

27.20-27.80s: 30px below SIX FORMS., 6 capability pills appear, entering in sequence:

```
[any→md] [md→html] [html→md] [md→docx] [md→pdf ★NEW] [md→epub ★NEW]
```

Each pill:
- Type: JetBrains Mono Bold 14px, letter-spacing 0.16em
- Size: 10px×18px padding, 1.5px border
- The first 4: Ink text + Ink border + transparent background
- The last 2 (NEW): Terracotta text + Terracotta border + Mist (#FFF7F0) background + a Terra Hot "NEW" mini badge at the top-right, -8/-10px

Pills are 14px apart. The group is horizontally centered (x=960), y=820.

Entrance: staggered left to right, 80ms delay each, fade-in + 4px y slide-up (300ms expoOut).

27.80-28.30s: the subhead line enters (y=890):

```
md is the source code, everything else is product.
```

Type: Noto Serif SC italic 26px, Ink, letter-spacing 0.04em
Horizontally centered.

Entrance: fade-in + 8px y slide-up (400ms expoOut).

28.30-29.00s: hold everything. This is the most static frame in the film — all elements in place, letting the viewer "finish reading it".

**[TYPE]**

- SIX FORMS.: Newsreader 700, 168px, Terracotta, letter-spacing -0.03em, line-height 0.95
- pills: JetBrains Mono Bold 14px, letter-spacing 0.16em, 1.5px border
- subhead: Noto Serif SC italic 26px, Ink, letter-spacing 0.04em

**[ANIM]**

- 26.50-27.20s · SIX FORMS. character stagger (mirroring SHOT 11)
- 27.20-27.30s · short hold
- 27.30-27.80s · 6 pills cascade (80ms stagger × 6 = 480ms total + 300ms per pill)
- 27.80-28.30s · subhead enters (400ms)
- 28.30-29.00s · hold everything

**[AUDIO]**

- BGM: the 26.50s peak swell continues, reaching the film's loudest at 27.20s (-4dB)
- BGM: after 27.20s the BGM sustains (no longer rising, but holding peak intensity)
- **SFX: impact (slogan SIX) at 26.50s — deep bass impact, half a step heavier than the ONE shot's impact (-7dB)**
- SFX: staggered metallic clicks as the 6 pills enter (-24dB each, 50ms)
- SFX: 27.80s a very light pen flourish (as the subhead enters)

**[CHROME]**

- B: ON, version chip continues
- D: ON, watermark continues
- E: ON
- md seal (top-left): ON

**[ANTI-SLOP]**

- ✅ ONE SOURCE. is Ink, SIX FORMS. is Terracotta — the color contrast of "source" vs "product", not decorative color
- ✅ Of the 6 pills, the two NEW ones use a #FFF7F0 background (a very faint mist tint), not "orange fill" — restrained
- ✅ The NEW mini badge hangs at the top-right of the pill at -8/-10px, but at only 9px type — the standard position for a detail signature
- ✅ Real typographic punctuation in the subhead — a proper comma and full stop, not ASCII substitutes — a mark of respect for typesetting
- ✅ This frame (28.30s) is the film's "most complete frame for marketing" — it can be screenshotted as a thumbnail / X poster / WeChat cover; all the information is in one frame: slogan + 6 capabilities + subhead + brand seal + version

**[WHY]**

This is the resolution shot.

If SHOT 11 is the thesis (ONE SOURCE.), SHOT 12 is antithesis + synthesis (SIX FORMS. plus the full capability map).

At 27.50s, in this frame, the viewer should be hearing the strings at peak while being visually fully absorbed by the typography — the 5 seconds that make the film worth it.

The next shot is the close: let the strings decay, let the md seal shine alone.

---

## SHOT 13 · "SIGN-OFF"

**[TIMECODE]** 29.00 — 30.00s (1.0s) `|` **FUNCTION** Ending. Let every slogan element leave, leaving the md seal to shine alone. The brand mark.

**[VISUAL]**

29.00s: SIX FORMS. + 6 pills + subhead hold in place.

29.20-29.60s: ONE SOURCE. + SIX FORMS. + 6 pills + subhead fade out slowly (400ms linear each, **no stagger** — a synchronized fade, giving the feeling of "the frame settling").

29.40s: the top-left md seal characters grow slowly from 56px to 88px while sliding from (128, 88) toward frame center (960, 540) — md's "final return".

29.40-29.80s: the md characters settle at frame center, size 88px, Ink + Terracotta dot.

29.80-30.00s: 30px below the md characters a short Terracotta rule appears (120×2px, shorter and finer than SHOT 03's), growing from 0.

30.00s: every element is in place. The final frame is:

```
                                                                  ● STUDIO-MD-HTML · v2.0
                                                                                              (top-right chrome)


                                            md.                   ← Newsreader 600, 88px, Ink + Terracotta dot
                                          ───                     ← Terracotta rule, 120×2px

                                                                                CREATED BY THE STUDIO
                                                                                              (bottom-right watermark)
```

The whole frame holds only 4 elements: the md seal, the accent rule, the top-right chrome, the bottom-right watermark. Everything else is empty.

**[TYPE]**

- md.: Newsreader 600, 88px, Ink + Terracotta dot
- accent rule: 120×2px Terracotta

**[ANIM]**

- 29.00-29.20s · the previous shot holds (let the viewer absorb it fully)
- 29.20-29.60s · ONE SOURCE. + SIX FORMS. + 6 pills + subhead fade out in sync (400ms linear, synchronized)
- 29.40-29.80s · md seal scales up + slides to center (400ms expoOut, size 56 → 88, position (128,88) → (960,540))
- 29.80-30.00s · accent rule opens (200ms expoOut, 0 → 120px)
- 30.00s · final hold (if there is a loop, loop back to 00.00s)

**[AUDIO]**

- BGM: from 29.00s decay into L6 (all layers fading)
- BGM: 29.40s the strings fade, leaving piano + reverb tail
- BGM: 30.00s, everything resolves to silence + room tone
- **SFX: final stamp / sign-off at 29.40s (ink stamp + soft reverb, -14dB)** — as md lands at center
- SFX: a very light paper rustle at 29.80s (accent rule entrance)

**[CHROME]**

- B: ON, continues
- D: ON, continues
- E: ON, continues
- everything else OFF

**[ANTI-SLOP]**

- ✅ No sign-off text like "Thank you" or "Made with love" (cheap)
- ✅ No big logo blow-up (not needed)
- ✅ The md seal is the true protagonist of the film's whole story; leaving it alone at frame center at the end is the simplest form of resolution
- ✅ pause-and-look signature: in the last frame, at 88px Newsreader, the Terracotta dot is the frame's visual focus — the viewer's eye naturally rests on that dot, then finds the accent rule below, then the version chip top-right. That eye path is the visual hierarchy working
- ✅ Silence gives the frame breathing room in the final 0.2s

**[WHY]**

The film starts on a blank page and ends on an md seal plus one stroke of terracotta.

This is the visual rhyme:
- 0.0s: blank ivory page (empty)
- 30.0s: ivory page + md (full)

The viewer travels from "empty" to "full", but "full" is really just one `md.` — that is the visual manifesto of source-of-truth: **everything comes from one simple md.**

If the film leaves the viewer with one frame, I want it to be this one.

---

# Part V · Production Manifest

## 5.1 Font list + loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
```

**Measured load time**: about 800-1500ms depending on CDN state. The `document.fonts.ready` wait must return true before the Stage timer starts (Stage already implements this).

## 5.2 Palette CSS variables

```css
:root {
  --paper:       #FAFAF6;
  --mist:        #F2EDE4;
  --mica:        #E6E1D6;
  --smoke:       #6B6B6B;
  --cinder:      #3D3530;
  --ink:         #1A1A1A;
  --charred:     #2A2620;
  --terracotta:  #C2410C;
  --terra-hot:   #E55D21;
  --terra-deep:  #8B2D08;
}
```

## 5.3 BGM sourcing criteria

**First choice**: generate a 30-second cinematic minimal piece yourself with Suno v6.0 / Udio v1.5. Prompt keywords:

```
minimal cinematic piano, slow tempo 60bpm, single piano notes,
sparse arpeggio, low cello drone, subtle sub-kick percussion,
swelling strings at climax, decay to silence,
in the style of Max Richter on the nature of daylight,
no vocals, 30 seconds duration, ivory paper mood
```

**Fallback**: search royalty-free libraries
- artlist.io: "minimal cinematic"
- bensound.com: "cinematic"
- musicbed.com: "Jóhann Jóhannsson style"

**Minimum bar**: BGM 30 seconds long, 44.1kHz sample rate, aim for -16 LUFS integrated loudness.

## 5.4 SFX sources

**First choice**: the 37 pre-made assets in the studio skill's `assets/sfx/<category>/*.mp3`:

```
Event                      Recommended SFX file
─────────────────────────────────────────────────────
keyboard clicks            sfx/ui/keyboard-click-*.mp3
cursor blink               sfx/ui/tick-soft.mp3
md morph swell             sfx/cinematic/whoosh-bloom.mp3
file card whoosh           sfx/cinematic/whoosh-short-*.mp3
absorb / ink drop          sfx/foley/ink-drop.mp3
paper rustle               sfx/foley/paper-turn.mp3
chime capability           sfx/melodic/chime-single-*.mp3
chime NEW (double)         sfx/melodic/chime-double-warm.mp3
build sweep                sfx/cinematic/ascending-sweep.mp3
impact (slogan)            sfx/cinematic/deep-impact-*.mp3
pen flourish               sfx/foley/pen-stroke.mp3
final stamp                sfx/foley/ink-stamp.mp3
```

## 5.5 Screenshot verification plan

Once the HTML is implemented, these key frames must be verified (with Playwright + the `?t=NN` URL parameter):

```
t=0.5    ← SHOT 01 mid: blank ivory page (check that the paper texture does not steal the scene)
t=2.5    ← SHOT 02 mid: typing in progress (check cursor blink + JetBrains Mono)
t=3.8    ← SHOT 03 mid: md morphing (check ghost residual + scale curve)
t=5.0    ← SHOT 03 end: hero md settled (check 480px + Terracotta dot)
t=7.0    ← SHOT 04 mid: cards in flight (check the parabola + that card content is really readable)
t=8.4    ← SHOT 04 tagline (check the "everything → md" italic)
t=10.5   ← SHOT 05 mid: html card complete (check that the essay content is readable)
t=13.5   ← SHOT 06 mid: md source visible (check syntax highlighting)
t=16.5   ← SHOT 07 mid: docx page complete (check chapter title + page number)
t=19.0   ← SHOT 08 mid: PDFs fanned out (check crop marks are visible)
t=21.5   ← SHOT 09 mid: EPUB frame complete (check Apple Books chrome)
t=23.4   ← SHOT 10 mid: 6 capability orbit (check the full capability panorama)
t=25.0   ← SHOT 11 mid: ONE SOURCE. complete (check tracking + Terracotta period)
t=27.5   ← SHOT 12 mid: SIX FORMS. + pills (check the complete two-line slogan)
t=28.5   ← SHOT 12 marketing frame (check that the whole frame is marketing-ready)
t=29.9   ← SHOT 13 final hold (check md seal + accent rule)
```

Every frame must satisfy:
- no element overflows the 1920×1080 canvas
- tracking and leading are visually correct
- the anti-AI-slop checklist passes
- the key typographic details (Terracotta dot, page-number em dashes, chapter-title small caps) are recognizable

## 5.6 Recording parameters

```bash
node scripts/render-video.js \
  --file file:///path/to/v5-six-forms.html \
  --duration 30 \
  --fps 25 \
  --width 1920 \
  --height 1080 \
  --out v5-final-silent.mp4
```

**Key codec parameters**:
- video codec: libx264
- pixel format: yuv420p (compatibility)
- bitrate: 12 Mbps (high quality; about 45MB for 30s)
- profile: high
- preset: slow (quality > speed)

**Frame interpolation afterwards** (optional, 60fps smooth version):

```bash
bash scripts/convert-formats.sh v5-final-silent.mp4 --fps 60
```

## 5.7 Audio mix

```bash
# Step 1: add BGM
bash scripts/add-music.sh v5-final-silent.mp4 \
  --bgm assets/bgm/cinematic-minimal-30s.mp3 \
  --bgm-volume -18dB \
  --out v5-with-bgm.mp4

# Step 2: add SFX cues (one per cue, following the Part II.6 SFX dictionary)
# multi-track mix with ffmpeg's -filter_complex amix
ffmpeg -i v5-with-bgm.mp4 \
  -i assets/sfx/ui/keyboard-click-1.mp3 \
  -i assets/sfx/ui/keyboard-click-2.mp3 \
  ... \
  -filter_complex "[1]adelay=500|500[s1];[2]adelay=550|550[s2];...;[0][s1][s2]...amix=inputs=N:duration=longest:dropout_transition=0[out]" \
  -map 0:v -map "[out]" \
  -c:v copy -c:a aac -b:a 192k \
  v5-final.mp4

# Step 3: verify the audio stream
ffprobe -i v5-final.mp4 -show_streams -select_streams a 2>&1 | grep -E "(codec_type|sample_rate|channels|duration)"
```

**Expected output**:
- audio codec: aac
- sample rate: 44100Hz or 48000Hz
- channels: 2 (stereo)
- duration: 30.0s

## 5.8 Deliverables list

```
v5-final.mp4              main deliverable (30s, 1920×1080, 25fps, with audio, ~50MB)
v5-final-60fps.mp4        high frame rate version (60fps interpolated, ~80MB, for X / YouTube)
v5-final.gif              social version (30s, palette-optimized, < 8MB, for WeChat embed)
v5-final-silent.mp4       silent version (backup, for later re-scoring / swapping the BGM)
v5-poster.png             poster version (frame at t=28.5s, for X cards / WeChat cover)
v5-director-notes.md      this document (director's notes)
v5-six-forms.html         source file (HTML animation)
v5-shot-list.csv          shot timecodes + key parameter table (for pause verification)
```

## 5.9 End-to-end time estimate

| Step | Estimated effort |
|-----|----------|
| Writing the director's notes | done |
| HTML animation implementation | 4-6 hours |
| Keyframe screenshots + visual verification | 1 hour |
| Recording the silent MP4 | 5-10 minutes (including Playwright startup) |
| BGM generation / selection | 30 minutes |
| Cueing SFX + mixing | 2-3 hours |
| Deriving the GIF | 5 minutes |
| Poster screenshot + naming | 10 minutes |
| Final delivery + git commit | 10 minutes |
| **Total** | **8-11 hours** |

---

# Appendix · the first principle of this film

If I, as director, could keep only one sentence about this film, it would be:

> **A typographic film about "the source", whose protagonist is a single `md.`**

Every other design decision — palette, type, tempo, SFX, chrome, anti-slop checklist — is derived from that sentence.

If a specific decision cannot be traced back to that sentence, do not make it.

---

*Director's notes — end of document*
*Total word count: roughly 11,500 words*
*Next: once the user's review passes, move into the HTML implementation phase*


