# Three directions: three good designs, not three skins

For any new visual design, produce real first drafts in three directions for the user to choose from. The gate itself does not change: 100% trigger, no exemption for a specified style or brand, stop once they are on the table, and record the choice in `direction-approved.md` (for exemptions see "the narrow bridge" in SKILL.md).

This file covers **how the three directions are generated**.

## Why it works this way (findings from three rounds and blind picks)

**Round one problem: the three versions only changed skin.** The three versions were usually the same skeleton with different colors and font weights. The difference has to land in the layout structure, not in the palette.

**Round two problem: metaphor overreach.** Forcing every version to first fix a "big idea metaphor" turned whole pages into filing cabinets, library cards, subway maps; the user lost 3 of 4 blind-pick questions.

**Round three problem: too many constraints made it boring.** To dodge the "AI default look", the rules once limited the three versions to at most one warm-paper serif, and listed look families like dark background with a single accent, and thin-rule newspaper, as yellow lights. The result: all three versions retreated to pale cool colors and tidy grids, the user said "too tidy, too boring", and it lost again to the older approach without those constraints — and the versions he approved under that older approach were exactly dark background with a single accent, and warm-paper serif.

So the current approach is **add options, don't add bans**: the same three logics, two candidates each, six thumbnails first, then pick the strongest and most different three for full versions; pick style from specimens you can see, and dissect references from real screenshots. Look families are no longer a defect; you only need to switch when all three crowd into the same family, or when they collide with a recently delivered project.

## Process

### Phase 1 · Clarify the need + actively ask for references

This is the only round of questions in the whole project (no re-asking once the direction is chosen; pick from the question bank in `references/workflow.md`), at most 3 questions at a time: audience / core message / emotional tone / output format. Ask for all reference material in the same pass: what the project is called, whether there is a logo / brand color / VI / type spec, whether there is a website or screenshot that has "exactly that feel"; if none, they say "use your judgment".

If the user does not respond, do not wait idly: fill in assumptions by best judgment (mark them assumption), proceed, and use "something you can see" instead of more questions.

If a concrete brand or product name was given (the kind whose official site has a logo) → also run the brand asset protocol (`references/brand-asset-protocol.md`), all three directions based on the same real assets, differing in interpretation. An ordinary subject name (coffee, history, fitness) is not a brand; do not go looking for "the coffee logo".

### Phase 2 · Adviser-style restatement

Restate the essential need, audience, context, emotional tone, and the expectations the user did not say out loud, in your own words. End with "I'll build 3 real versions in different directions and show you", not with "which direction do you want" — a choice made before seeing anything visual is worthless.

### Phase 3 · Freeze the spec

Write a detailed design spec; it is the shared input for all three directions: what the project is, audience and context, core message as points, emotional tone, **output format and size (required; all three versions must match it or they cannot be compared side by side)**, known constraints, image needs. The spec states only "what to say", never "what it looks like" — what it looks like is the direction card's job.

### Phase 3.5 · Materials up front

Following `references/materials.md`, first judge the tier, then collect the real photography the content requires and the logos of the named products; all three directions share them.

### Phase 4 · Six candidates → six thumbnails → pick three

Look at three things before you start writing:

```bash
# $HD = the root directory of this skill (the directory containing SKILL.md), not the user's project directory
python3 "$HD/scripts/learn.py" direction color <subject keyword>   # this user's preferences + past lessons
python3 "$HD/scripts/design_lint.py" ledger                     # looks delivered recently and references already used: don't reuse them this time
```

Then open the style overview with your image-reading ability: `$HD/assets/style-specimens/sheet-<section>.jpg` (sections: web / ppt / info / app / xhs Xiaohongshu, plus the cross-media east section for Chinese and East Asian). One image holds the specimens of every style in that section; first learn what each style looks like when done properly.

**4a · Three logics, two candidates each (six in total):**

- **Best designer ×2**: take a deep breath and think hard — if budget were unlimited, who is the studio or designer in the world best suited to design for "this user, this subject"? Name two with different temperaments (one bold, one restrained; or one Western, one East Asian). Switch on their design thinking and start from scratch; do not imitate the look of one of their pieces. Do not always reach for the same few names: beyond Pentagram, Kenya Hara, Vignelli, there are also Lü Jingren, Kohei Sugiura, Ikko Tanaka, Kazunari Hattori, Irma Boom, Experimental Jetset, Collins, Studio Dumbar…
- **Real reference ×2**: pick two real works in the **same medium** as the need whose design you are certain is excellent — for an app, find an app (Apple Design Awards); for a website, find a website (Awwwards annual, brand sites); for a deck, find publications and pitch decks; for an infographic, find newspaper graphics (SND, Malofiej winners). Same-medium references transfer layout directly; cross-medium ones (a deck made as a Penguin cover, an app made as a herbarium sheet) tested as either overreach or boring. Verify it exists with WebSearch, then **capture it and look**:

  ```bash
  python3 "$HD/scripts/ref_board.py" <artwork URL or image URL> [<second>] --out refs/board.jpg
  ```

  Open the reference board with your image-reading ability and write down what you borrow as concrete rules: how many grid columns, heading-to-body size ratio, share of the primary color, image-text relationship. If you cannot capture it (anti-scraping, black WebGL screen), switch to a report page or image about the same work, or ask the user for a screenshot; if none works, write "not seen in person" on the card — never pretend you looked.
- **Seconds roulette ×2**: take the current seconds S (`date +%S`; on Windows PowerShell use `(Get-Date).Second`), draw number `S % number of styles in section + 1` from the matching section of `references/design-styles.md`, then draw number `S % 12 + 1` from the east section. The number is the order in which the entry appears in the section, and matches the specimen filename and the number on the cell in the overview sheet. First open the specimen image of the drawn style (the "specimen" line in the entry), see what it looks like done properly, then write the card. If what you drew is the same kind as the last 3 deliveries in the look ledger, move on to the next number; if fidelity is <70%, mark which part is degraded. The roulette's job is to take you somewhere you would not have chosen yourself.

**When the user specified a style or brand**: all six candidates produce one interpretation within that context, and colors may all be brand-constrained (add `--brand` to compare, which then compares skeletons only); the roulette only draws among styles compatible with the context. "Apple style" is a context, not a design.

**4b · Write six direction cards**, into `directions.md` in the project directory, one paragraph each:

| Column | What to write |
|---|---|
| Logic and source | Which designer / which work (with source and reference board path) / which number and style was drawn |
| What is borrowed | The concrete rules pulled out of the source and applied to this design: grid, type relationship, color proportions, image-text relationship |
| Hero material | What is the hero of the frame: real photography, generated imagery, procedural material, data imagery, giant type… (tiers in `references/materials.md`) |
| Skeleton | The layout structure in one sentence |
| Where the boldness is spent | The single boldest place; everything else serves the content |
| Where the form comes from in the content | One sentence: what in this design could only come from this subject |

**4c · Draw six thumbnails.** One `design-demos/thumbs.html`, six cells, each cell the most critical screen of that candidate (website first screen, deck cover, infographic opening, app main screen), roughly 480×300: real fonts, real colors, real skeleton, real headline, **the hero material named in the direction card must be visible**, details may be omitted. Give each cell's container `data-thumb="1"`…`"6"`. Thumbnails are cheap — this step exists to try several styles — if one thumbnail looks wrong, swap the source and redraw that cell instead of waiting to discover it in the full version.

A cell with one headline and a block of flat color is a placeholder, not a candidate: nothing about it tells you whether the direction is good, and picking three becomes a formality. When done, run:

```bash
python3 "$HD/scripts/polish.py" thumbs design-demos/thumbs.html     # flag cells that are still placeholders; if any ✗, redraw those cells
```

Then screenshot and look with your image-reading ability. If a cell cannot hold up no matter how you draw it, rework it from that style's specimen source as described in `references/steady-track.md`.

**4d · Pick three for full versions**, criteria in order:

1. **Good enough on its own**: you would not be embarrassed to show it. If the thumbnail cannot hold up, the full version will not save it.
2. **The three differ from each other**: different skeletons, different temperaments (bold / neutral / quiet need not all be present, but do not make all three the same temperature), not crowded into one look family.
3. **No collision with recent projects**: looks and references just used in the look ledger are out this time.
4. **No overreach**: turning the whole page into a prop or a physical replica, applying a universal metaphor (subway map, terminal command line, newspaper front page, dashboard), maxing out saturation and type size — at most one of the three may do this, and only when the content truly needs it. How to judge: **remove the device — is the information clearer or muddier?** If it is clearer without it, it was overreach.

The three need not be one per logic: two best-designer plus one roulette is fine; pick the strongest. Keep the three you did not pick and show them to the user along with the rest.

One example (subject: the website of a handmade soy sauce brewery run by three generations):

- Best designer | Kenya Hara | borrowed: generous white space, the material itself as hero, very few words | hero: real photographs of clay vats and the sun-drying yard | skeleton: one image and one sentence per screen, slow vertical rhythm | boldness: the first screen is a single close-up of salt crystals | form: soy sauce needs 180 days in the sun, so the rhythm slows down
- Real reference | an award-winning Japanese long-established food brand site (screenshot attached) | borrowed: the relationship between vertical headline and horizontal copy, the ratio of two colors, thin-rule zoning | hero: product bottle shot + vertical headline | skeleton: vertical headline on the left, three content columns on the right | boldness: only two colors | form: the "house recipe" character of a long-established shop
- Seconds roulette | drew "media-grade brutalism" | borrowed: large-type contrast and modular grid | hero: an oversized Chinese character 酱 cutting into the first screen | skeleton: modular grid, image and text interleaved | boldness: type-size contrast on the first screen | form: one character tells the whole soy sauce works

### Phase 5 · Build in parallel, self-check each version

Each subagent gets only the spec + its own direction card (with reference board or specimen image) + the shared materials, in an independent context, no cross-referencing. On runtimes without subagent support, work serially: before starting each version, read only the spec and its own card, never the versions already built.

Build rules (shared by all three):

- The user's real content, no Lorem; all three use the same content, only the design changes
- Hard readability floor: web body ≥14px, labels ≥12px; deck body ≥24px, labels ≥16px; 1080-wide long image read on a phone: body ≥36px, labels ≥28px; body contrast ≥4.5:1; white space must be composition, not missing content
- Single-file HTML; when delivering a single file, embed images and logos as base64
- Decks use the deck shell, 2 representative pages per direction (`references/modules/deck.md`)
- For app prototypes, do not just line up several phones in a row; for the showcase board composition see "Showcase board" in `references/app-prototype.md`
- Thumbnails go to `design-demos/thumbs.html`, the three full versions to `design-demos/dir-1.html`, `dir-2.html`, `dir-3.html` (decks are `dir-1/` and similar subdirectories), screenshots with `npx playwright screenshot file:///… out.png --viewport-size=1440,900` (decks use 1920,1080)

When all three are built, run one polish loop per version (`references/polish-loop.md`):

```bash
python3 "$HD/scripts/polish.py" shot design-demos/dir-1.html --mobile    # review full-size screenshots screen by screen, write down the three worst problems, fix them; same for dir-2 and dir-3
```

The first draft exists to let the user choose a direction, one pass is enough, but this pass is not optional: a first screen that does not hold up, a missing hero material, and everything below being the same card — these three classes of problem must be solved before anything goes on the table. Then run:

```bash
python3 "$HD/scripts/design_lint.py" check design-demos/dir-*.html       # red lights must be fixed; yellow lights are incidental template decoration — delete them; look family is only a hint
python3 "$HD/scripts/design_lint.py" compare design-demos/dir-*.html     # two versions collide → swap in another of the alternates, or change the skeleton — not the colors
#   if the brand constrains colors and type, add --brand; for App prototypes with several phones side by side add --ignore-layout; for decks add --viewport 1920x1080 --min-body 24 --min-label 16
python3 "$HD/scripts/design_lint.py" ledger check design-demos/dir-*.html # collides with a recent project → swap in another of the alternates
```

Name the full versions `design-demos/dir-1.html` through `dir-3.html`, and confirm there really are 3 before going on. For a yellow light, delete that structure; swapping a symbol to dodge detection is not a fix. The look family needs no change — it only matters when all three crowd together or collide with the ledger. If the Python playwright is not installed the scripts skip and tell you to install it; in that case compare the three versions by eye from screenshots, and write that fact into the delivery notes.

### Phase 6 · Show them, then stop

Put the three full-version screenshots on the table together, each with a summary of its direction card (logic and source, what is borrowed, hero material) and one sentence of "where the form comes from in the content"; add the thumbnail overview and say "the other three are alternates — tell me which one you like and I'll build it out". Once they are on the table, end the turn and wait for the user's choice, including in unattended sessions.

### Phase 7 · After the user chooses

- Write into `direction-approved.md`: which versions were shown, their screenshot paths, and the user's exact words
- If the user's words contain an explicit statement of taste ("this one doesn't feel AI at all", "too plain", "make it more like a magazine"), record it verbatim with `learn.py add --kind preference`, and state its scope of applicability
- Mixed choices ("A's layout + C's colors") get built as asked; note which two columns they mixed — that is more useful than remembering which color they picked; if they call a version "overreach" or "too plain", record that verbatim too
- Move into execution; after delivery, run `design_lint.py ledger add <final file> --project <name> --note "<source: designer/work/style>"` to record a look ledger entry, so the next project avoids the reference along with the look
