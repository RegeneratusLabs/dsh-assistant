# Distributed experience (Studio)

Findings that have recurred across projects, or been measured, and hold for any user. Before work starts, `learn.py` surfaces the matching entries by topic.

Maintenance rules are in `references/evolution.md`: hand-edit only in the repo; once a reference has absorbed an entry, delete it; one user's taste does not go in here.

## S1 · verified · topics: direction, color, typography

- Finding: without constraints, the three directions slide together toward a warm cream ground + high-contrast serif headings + terracotta accents. This is the model's own default aesthetic (Anthropic's interactive palette), and Anthropic's official frontend-design skill (2026) lists it as the first clustering signature of AI-generated pages. The family itself is not ugly; the problem is three versions bunched together and recurring across projects (see S6).
- Next time: do not bunch the three versions in the same look family; `design_lint.py compare` reports "all three versions land in the same look family", and `ledger check` reports a collision with recent projects.
- Evidence: internal self-testing during skill development and three-direction screenshots from several projects (2026-10 inventory, unpublished); the original text at https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md

## S2 · verified · topics: direction, layout

- Finding: three versions that only swap palette and typefaces while sharing one layout skeleton are called out at a glance by both critique and the user as a reskin. The difference has to land in how information is organized.
- Next time: the three direction cards' skeletons must differ from each other; if `compare`'s skeleton-related score is too high, go back to the cards and change the skeleton or the source. Do not overcorrect — forcing a metaphor into every version overdoes the page (see S5).
- Evidence: internal blind testing during skill development and the 2026-10 inventory (unpublished).

## S3 · verified · topics: readability, quiet, whitespace

- Finding: the quiet, luxurious-whitespace style done to excess turns into big slabs of dead white with miniature type; at first glance it looks like the page failed to finish rendering and loses to the ordinary baseline version.
- Next time: the type-size and contrast floor (web body ≥14px, deck ≥24px, phone long image ≥36px canvas pixels, contrast ≥4.5:1) is exempt for no style; `design_lint.py check` lights a red light.
- Evidence: internal blind-test critique during skill development (unpublished).

## S4 · verified · topics: assets, logo, single-file

- Finding: a single-file HTML meant to be double-clicked open, referencing images and logos by relative path, breaks every image the moment the directory moves.
- Next time: single-file deliveries always embed as base64; `design_lint.py check` gives a yellow light for relative-path images and a red light for already-broken ones.
- Evidence: in blind testing six product buttons broke and lost the critique outright.

## S5 · verified · topics: direction, metaphor, intensity

- Finding: forcing a "big-idea metaphor" into every version in order to spread the three directions apart gets the whole page made into a prop (a filing cabinet, a library card, a prescription slip) or wrapped in a universal metaphor (a subway map, a terminal, a newspaper front page). The three directions do spread apart, but the blind pick lost to the version without this constraint, and the same subway map showed up once each in two unrelated briefs — a new kind of sameness.
- Next time: at most one of the three complete versions may turn the whole page into a prop or wrap it in a universal metaphor; the test is to remove the device and see whether the information gets clearer or mushier.
- Evidence: the 2026-10 revision's before/after blind pick (the new approach won only 1 of 4 briefs) and the new approach using the subway map twice in 4 briefs (internal baseline during skill development, unpublished).

## S6 · verified · topics: direction, constraint, boring

- Finding: the constraints added to dodge the AI default look (at most one warm-paper serif version, a yellow light on the look family, an overdone-it quota) pushed all three versions back into pale cool colors and tidy grids, rated by the user as "too tidy, too boring", and the blind pick lost again to the old approach without those constraints. The versions that were praised under the old approach happened to be dark-ground-with-a-single-accent and warm-paper serif. Constraints can only remove options; removing options does not produce good design.
- Next time: add options, not bans — two candidates per logic, draw thumbnails before choosing; see styles in specimens, decompose references from screenshots. The look family is only for comparing the three versions and comparing the ledger.
- Evidence: the 2026-10 second revision's before/after blind pick (2 briefs, the revision lost both), internal baseline during skill development, unpublished.

## S7 · observed · topics: direction, reference, medium

- Finding: real-world references chosen from award-winning work in the same medium (an App referencing Apple Design Award-winning apps, a bookstore deck referencing Stripe Press) were praised; cross-medium references (a deck referencing 1935 Penguin paperback covers, an App referencing botanical specimen sheets) were one overdone and one boring.
- Next time: prefer same-medium real-world references; cross-medium ones borrow only color or type relationships, not layout.
- Evidence: 4 real-world reference directions across the 2026-10 second and third blind picks; the sample is small and awaits more projects.

## S8 · verified · topics: direction, style, reference

- Finding: "add options, not bans" won in blind picks — two candidates per logic, draw thumbnails before picking three, see styles in specimens, decompose references from screenshots, and the look family no longer lights a yellow light. On the same two briefs that lost in the previous round, both revised versions were chosen, and the user said "this is clearly better".
- Next time: when you hear "too monotonous" or "too AI-like", add candidates and references first, not bans; a new ban has to pass a blind pick first.
- Evidence: the 2026-10 third revision's before/after blind pick (2 briefs, the revision won both), internal baseline during skill development, unpublished.
