# Polish loop: look, find fault, fix, look again

A first version, once written, is only a draft. This is where designers differ most from people who write code: when it is written, sit back and look at it, see what is wrong, fix it, look again.
The same model, looking at its own screenshots and going three more rounds versus handing over whatever came out, differs by a whole grade in output. This file covers how to look, what to look at, and how many rounds.

## How to look

```bash
# $HD = root directory of this skill
python3 "$HD/scripts/polish.py" shot <page.html> --mobile      # capture full-size screenshots screen by screen, saved to polish/<filename>/round-N/
```

It cuts the page into full-size screenshots screen by screen by viewport height, and appends this round's record to `polish-log.md` in the project.
Then **open** those screenshots one by one with your image-viewing ability. A whole-page long screenshot scaled down into one image blurs type and spacing, so the problems are invisible — you must look at each screen at full size.

A deck does not scroll; one page is one screen: produce the image of each page with `gen_deck_thumbs.mjs` or `verify.py --slides N`, and look at them one by one the same way.
For animation, look at keyframes and follow the checks in `references/modules/motion.md`.

The numbers the script prints (how many graphics per screen, how much text, how much of the ground a color covers) are only hints about where to look first; they do not replace looking.
If playwright is not installed, capture screen by screen with whatever screenshot method you have, and look using the questions below. For a runtime with no image-viewing ability, see the end of this file.

## What to look at

Carry these eight questions into every round, and write the **three most damaging findings** from the answers into `polish-log.md`, in the form "which screen, which element, how it is wrong":

1. **The first three seconds**: can someone who has never seen this project tell what this is and who it is for within three seconds? Has something unique to this subject's world appeared in the first glance?
2. **Protagonist material**: is the protagonist material written on the direction card in place? Are the images the content requires present — does a page introducing an App show the App's interface, has the data on a data page become the image?
3. **Each screen's event**: scrolling down, does each screen have something that makes you pause, or is it "a small heading + three cards" repeated to the end?
4. **Hierarchy**: squint at each screen — is the first thing that jumps out the most important thing?
5. **Craft**: alignment, spacing rhythm, orphans at line ends, ugly line breaks, overflow, broken images, elements that are not part of the same set as their surroundings.
6. **Phone**: ask the same questions again at narrow width — not just "it is not broken", but "it still looks designed on a phone".
7. **Against the direction card**: put the screenshot next to the direction card and the reference board (or specimen), and check whether the rules written under "what is borrowed" were delivered. Where did it drift?
8. **Take one thing away**: which single thing could you remove to make this screen better?

When the script hints at "several consecutive screens of nothing but text and boxes" or "nearly empty screen", question 3 most likely already has its answer.
A quiet, whitespace-heavy direction will be flagged for a high proportion of ground color; that is its intent, so do not fill things in just to make the numbers look good.

## What to fix

Change the three most damaging things per round, then re-capture and look again. Do not casually change a dozen things in one round — with too many changes you cannot tell which one did the work, and it is easy to ruin what was good.
Fix structural things first (the hero does not hold up, the protagonist material is absent, a whole screen is mediocre), then craft.

If a screen is mediocre no matter how you look at it, do not patch it — tear that screen down and redo it: change the way information is organized.
Before redoing it, ask: if a top-tier studio took this project, what would they spend three extra days doing on this screen?

## How many rounds

| Stage | Rounds |
|---|---|
| Each first draft for the three directions | 1 round: capture, look, fix the three most damaging things. A first draft is for the user to pick a direction; no need to polish it to finished |
| The formal version after the direction is chosen | At least 2 rounds; stop when a round of serious looking turns up no three things worth changing, usually 3–5 rounds |
| The user is in a hurry | 1 round, and state on delivery that only one round of polish was done |

If you are still making big changes in round 5, the problem is in the direction or the structure, not in polish: stop, and tell the user the problems you see plus two alternative ways to fix them.

Keep the screenshots from every round. On delivery, show the user the first round's hero next to the last round's, so they can see what changed across those rounds.

## When you have no image-viewing ability

A runtime that cannot read screenshots cannot truly polish, but do not skip it: run `polish.py shot` to get each screen's facts, run `design_lint.py check` and fix red and yellow lights,
then go through the page checklist in `references/steady-track.md` item by item. On delivery, state honestly that "this version did not get a visual polish pass", and give the user the screenshot paths.
