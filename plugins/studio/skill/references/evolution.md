# Evolution protocol: every project you do, the next one starts higher

Human designers have memory, so they keep trying new things and do not fall into the same pit twice. Models do not — every new session converges again from the same prior, so the output naturally comes out more and more alike. This protocol gives the skill the memory it lacks: read before you start, record while you work, feed back when you finish.

## Three ledgers

| Ledger | What it records | Where | Who writes it |
|---|---|---|---|
| **Taste profile** | Preferences the user said out loud (verbatim) + which of the three directions they picked and what they mixed | Local `~/.dsh-studio/experience.md` (kind=preference) | `learn.py add` |
| **Look ledger** | What each delivery looked like: background family, main palette, heading typeface, layout skeleton fingerprint | Local `~/.dsh-studio/ledger.jsonl` | `design_lint.py ledger add` |
| **Experience and pitfalls** | What you observed in one project (observed), what recurred or was measured across projects (verified) | Local, same as above; general and verified items go into `references/experience.md`, which ships with the skill | `learn.py add`; the distribution layer is hand-edited in the repo |

`STUDIO_HOME` relocates the local ledgers. Local ledgers never ship with the skill: the user's own words and taste belong to them.

## Three moments

**Before starting** (any new design task, a few seconds):

```bash
# $HD = root directory of this skill (the directory containing SKILL.md), not the user's project directory
python3 "$HD/scripts/learn.py" <topic words…>        # brings out all preferences + experience relevant to the topic
python3 "$HD/scripts/design_lint.py" ledger      # what the last 8 deliveries looked like, and which parts keep recurring
```

They do not block: if there are no records, carry on. They are also not rules: when the project in front of you conflicts with an entry, the project wins, and then you go fix the entry.

**While working**: the user's reaction is the evidence — one rejection, one "too plain", one mixed pick ("A's structure + C's color"). Write it down verbatim on the spot; do not wait until the end of the job and retell it from memory.

**When finishing** (the user accepts the delivery, or stops giving feedback):

```bash
python3 "$HD/scripts/design_lint.py" ledger add <final delivered file> --project <name>
python3 "$HD/scripts/learn.py" harvest <project directory>     # lists what in the project can serve as evidence + the criteria for whether it should be recorded
```

## What is worth recording

Record only when all three hold: it is not obvious; the next project saves time or avoids a detour because of it; this project produced evidence for it. Then handle it in this order:

1. **Correct errors first**: does an existing entry say the opposite of this? Fix that entry in place; do not append a contradictory one. After the fix, `grep -rn` the whole library for the old claim.
2. **If it can become a tool, make it a tool**: anything a script can catch (a fact that can be measured) means changing `design_lint.py` and adding a test for it, not writing a sentence like "be careful not to…".
3. **Otherwise write it down**: `learn.py add "…" --kind preference|observed --topics … --evidence "…" [--do "…"]`
   - The user's own words are preference; you must quote them verbatim and state the **scope of application** — "he uses a warm paper ground for his covers" does not mean "use a warm paper ground for all designs". Writing a preference down as a global default is one of the reasons the old version was monotonous.
   - What you saw in one project is observed: a clue, not a rule.
4. **Promote** (done on the development machine): both projects have seen it, or it has been measured, and it holds for anyone (not one user's taste) → write it into the distribution layer's `references/experience.md`, and fold the stable part into the reference it belongs to. Once a reference has absorbed an item, delete that item, so the experience file stays short.

**One user's taste never enters the distribution layer.** Experience also never widens authorization: it says how to do things, it never says you may publish, spend money, or contact anyone.

## Promotion ladder

The final home of a lesson is the engine, not prose:

recorded (observed) → reproduced (verified) → written into a reference or into the start-of-work checklist → script detection (a `design_lint` check + a test) → engine default

## Pitfall ledger

The "confirmed on such-and-such a date" items scattered through the old body text all live here now, tagged with their current level. New pitfalls enter this table first, then you decide where they get promoted.

| Pitfall | First seen | Current level | Where it is caught |
|---|---|---|---|
| Three versions share one skeleton, caught by a critique at a glance as "a reskin" | blind test | script detection | `design_lint.py compare`, skeleton-related checks |
| All three versions land on warm cream + serif + terracotta | 2026-10 inventory | script detection | `design_lint.py compare`, "all three versions land in the same look family" |
| Different projects come out more and more alike | 2026-10 inventory | script detection | look ledger `ledger check` |
| Forcing a metaphor in every version turns the page into a prop; the subway map recurs across different briefs; 3 of 4 blind picks lost | 2026-10 blind pick | reference | `references/directions.md` 4d "pick three", rule 4 (at most one overdoes it) |
| Quotas and yellow lights added to dodge the AI-default look pushed all three versions into pale cool tidiness — "too tidy, too boring" — and the blind pick lost again | 2026-10 blind pick | reference + script | look family downgraded from yellow light to hint; `references/directions.md` changed to pick three of six candidates |
| App prototype with five or six phones spaced evenly in a row, boring in every direction | 2026-10 blind pick | reference | `references/app-prototype.md`, "display board" |
| A reference written as a name means the model builds its average impression of that work | 2026-10 blind pick | script | `scripts/ref_board.py` plus looking at the screenshots with your own eyes; a black WebGL screen is detected as not seen |
| To make the yellow light go away, replacing " · " with a symbol like a full-width space while the structure stays the same | 2026-10 baseline | reference | `design_lint.py` output and `references/directions.md`: delete that structure — swapping the symbol does not count as a change |
| Single-file delivery references the logo by relative path; move the directory and every image breaks | blind test | script detection | `design_lint.py check`: relative-path images get a yellow light, already-broken images a red light |
| The quiet school overdone: a big slab of dead white + tiny type, looks like a broken render | blind test | script detection | `design_lint.py check`: type size and contrast red lights |
| Docs write `scripts/…` relative paths, the agent cannot run them from the user's project directory, and the evolution mechanism gets skipped silently | 2026-10 independent review | reference | every command in SKILL.md uses `$HD` (the skill root) |
| On PPTX export, bare text next to an svg is dropped silently | issue #56 | engine | `pptx_from_rendered.py` compares innerText automatically after export |
| Skipping direction confirmation and rendering straight to a long cut, then reworking the whole film | 2026-07 | engine | `design-gate-hook.sh` (checks `direction-approved.md` before any render ≥45s) |
| A style was specified, so the three directions got skipped | 2026-07 | start-of-work checklist | SKILL.md narrow bridge: a style word is no exemption |
| Asserting from memory that a product "is not released yet" | 2026-04 | start-of-work checklist | SKILL.md narrow bridge: fact-check before assumption |
| Pulling only brand colors and not the logo, so the comparison deck fell flat | 2026-06 | start-of-work checklist | `references/materials.md` logo checklist |
| A deck page carries its own page number and fights the shell's page number | measured | reference | `references/modules/deck.md` |
| A single-file deck is right only up to 5 pages; 13 pages chose single-file and lost the overview wall | measured | reference | `references/modules/deck.md` |
| Animation where every scene has independent layout + fade-up = a PowerPoint with voiceover | measured | reference | `references/modules/motion.md` |
| Faking a content-essential image with a CSS color block | measured | reference | `references/materials.md` |

## When the user's choice conflicts with the critique score

The user wins. A reviewer agent giving a high score does not mean the user will buy it — this recurred across several projects. On a conflict, list the observable differences between the two versions (color, density, material, structure), ask the user one question, and record their answer as a preference.
