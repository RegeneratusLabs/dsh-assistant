---
name: meal-plan-groceries
description: Plan a week of dinners around food the user already has, then produce one grocery list grouped by store section. Use when the user asks to plan meals for the week, make a grocery list, decide what's for dinner, use up what's in the fridge, or plan the shopping.
---

## When to use

- "Plan meals for this week" or "sort out our dinners".
- "What's for dinner?" when the user wants a plan, not just one recipe.
- "Make a grocery list" or "plan the shopping".
- "Use up what's in the fridge before it goes off".
- A household with dietary needs, allergies, dislikes, or a tight food budget.
- The weekly repeat: "same as last week", "do the plan and list again".
- Busy nights where the user needs meals that fit a time limit.

## When not to use

- **Scaling or converting one recipe** ("from 4 to 10 people", "cups to grams"): answer directly, no weekly plan needed.
- **Choosing a restaurant or takeaway**: answer directly.
- **Catering an event** (party, funeral, school bake sale, 40 guests): out of scope; this skill plans household dinners.
- **Designing a medical or therapeutic diet** (diabetes, kidney, allergy elimination): a dietitian or clinician owns that. Follow a plan they gave, but do not invent one.
- **Ordering groceries or booking delivery**: no accounts, no payments; produce the list only.
- **Gift or hobby shopping**: use `gift-registry`.
- **Care coordination for a relative**: use `elder-care`.

## Procedure

1. **Read the previous plan before asking anything.** If `meal-plan/plan.md` exists, read it and summarize last week: what was cooked, what was skipped, leftovers, and any "repeat this" or "never again" notes.
   **Done when:** you can state last week's dinners and its carry-over notes, or say plainly that no earlier plan exists.

2. **Take inventory once, in one pass.** Ask what is in the fridge, freezer, and pantry that should be used, and what staples you may assume (oil, salt, pepper, flour, rice, pasta). Offer the assumption list so the user can correct it rather than write an essay.
   **Done when:** a written "already have" list exists, including "none", and the user has confirmed it in one exchange.

3. **Collect constraints in the same pass.** Number of people and portions, weekly food budget and currency, dislikes, allergies, religious or ethical rules, dietary needs, minutes available on busy nights, nights eaten out, leftovers wanted for lunch, and equipment limits (one hob, no oven). Use a batched multiple-choice question tool if one is available; otherwise send one numbered message. Anything unanswered gets a stated default.
   **Done when:** every constraint has a user answer or a stated default, read back in six lines or fewer.

4. **Draft the dinners.** One dinner per night, or fewer if the user says so. Order the week so perishables (fish, leafy greens, berries, fresh herbs) land early and sturdy food (root vegetables, pulses, frozen) lands late. Put the longest-cook meal on the freest night. Reuse one base ingredient across two meals to cut waste. Choose cheaper proteins and pulses when the budget is tight. For each dinner give: name, key ingredients, active minutes, and whether it makes leftovers.
   **Done when:** a table of dinners in date order exists, every row has active time and a day-of-week reason, and no row contains an allergen or a stated dislike.

5. **Check the budget honestly.** Mark each dinner cheap, mid, or stretch, and give a rough weekly range rather than a fake precise total. If the range is over budget, swap the most expensive dinner for a cheaper one and say what changed.
   **Done when:** the range is at or under the stated budget, or you have said plainly that it is not and named the cheapest swap.

6. **Write one grocery list grouped by store section.** Sections: Produce; Meat and fish; Dairy and eggs; Bakery; Pantry and dry goods; Frozen; Other (only if the user asked). Give a quantity and the dinner or dinners each item serves. Remove everything on the have-list. Add a short "check you still have" line for assumed staples.
   **Done when:** every ingredient in the plan appears exactly once with a quantity, nothing on the have-list is listed as a purchase, and the item count matches the list.

7. **Separate dinners from breakfast and lunch.** Do not invent a full breakfast and lunch menu unless asked. State which purchases are dinner-only and give one line each for breakfast and lunch (what is already covered, what needs buying).
   **Done when:** the list has a clear "for dinners" and "for breakfast and lunch" split, and the user can see which purchase serves which meal.

8. **Save the reusable file.** Write `meal-plan/plan.md` with five parts: week of, household and constraints, dinner table, grocery list, and notes for next week. Before overwriting, copy the old version to `meal-plan/archive/<YYYY-MM-DD>.md`.
   **Done when:** the file exists with all five parts, and reading it alone is enough to start next week without repeating the inventory questions.

9. **Read it back in chat.** Show the dinner table and the full grocery list. Name the assumptions and the single most likely disruption, with a fallback ("if the fish is gone, move the lentil bake to Thursday").
   **Done when:** the user has the plan, the full list, the file path, and a fallback for a missing ingredient.

## Gotchas

- An allergy is excluded, not "a small amount". Do not ask about cross-contamination unless the user raises it.
- Never invent prices or nutrition numbers. Call estimates estimates.
- "What's for dinner?" can be a same-day question. Answer tonight first, then offer the week.
- Leftovers are ingredients. Count them before buying more of the same thing.
- Fewer meals is a valid plan. "I don't cook on Fridays" is a constraint, not a gap to fill.
- If the household size changes mid-week, scale quantities but do not rewrite the plan unless asked.
- Check that a "use it up" item is actually still good; do not plan around food the user describes as spoiled.

## Output

Files, relative to the user's working folder (not the skill folder):

- `meal-plan/plan.md` — Markdown, the reusable weekly plan and list.
- `meal-plan/archive/<YYYY-MM-DD>.md` — the previous week, kept only when one was overwritten.

In chat:

- The dinner table, one row per night.
- The full grocery list, grouped by store section, copy-paste ready.
- One line on breakfast and lunch coverage.
- The rough weekly budget range.
- Assumptions made, the fallback meal, and the path to the file.
- No PDF or Word document unless the user asks; if document tools exist and the user wants a printable list, offer a one-page PDF.
