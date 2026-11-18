---
name: big-purchase
description: Research which model of a considered purchase to buy — appliance, laptop, mattress, car model, pram, bike — by agreeing a budget and the 3–5 criteria that actually matter to this buyer, checking current models against dated and sourced claims, scoring the shortlist in one comparison table, and giving a recommendation with a confidence level and the one fact that would most change it. Use when someone says "which X should I buy", "is it worth the extra money", "before I buy" or "best X for". Not for the broader commitment decision (renovate, move, switch insurers) — that is decision-grill.
---

# Big purchase

A considered purchase is a research task with a person attached. The model that wins a spec sheet is often not the one that fits this buyer, so the criteria come first and the comparison comes second.

## When to use

- "Which washing machine / laptop / mattress / pram / car should I buy?"
- "Is it worth the extra money for the bigger one?" / "Is the upgrade worth it?"
- "Best X for [use case] under [budget]."
- "Before I buy — sanity-check my shortlist."
- They have two or three named models and want them compared.
- They are about to order and want one last check.
- A replacement for something that broke, where the old model is discontinued.
- "Should I buy a new fridge" — a named-product buy with a budget.

## When not to use

- **The decision behind the purchase** — "should I renovate", "do I even need a car", "should I move house". Go to `decision-grill`; this skill assumes the purchase is happening.
- **Low-stakes, easily returned buys** — a phone cable, a cheap kitchen gadget, a single book, a phone case. Answer directly with a pick and move on.
- **A switch of service or contract** — insurer, energy plan, bank account, phone contract. Cover, terms and exit fees decide it, not product specs; that is a `decision-grill` decision, and the terms are ordinary research.
- **Checking a claim for its own sake** — "is it true this brand catches fire". Go to `claim-check`.
- **Learning about a category** — "explain how heat pumps work". Go to `teach-me`.
- **Booking a tradesperson or service** — quotes, references and availability, not a product shortlist.
- **Price hunting after the model is chosen** — "find the cheapest place to buy this exact one". That is shopping, not selection.
- **A business purchase under procurement rules** — criteria and process are set elsewhere; this skill's personal framing may not apply.

## Procedure

1. **Confirm the buy and the frame.** Ask in one short message what it replaces, what it must do, when they need it, and the budget range. If they already said, restate instead of re-asking.

   **Done when:** purpose, budget range and deadline (or "no rush") are written down, and the user has not corrected them.

2. **Elicit the 3–5 criteria that matter to this user.** Use the round style from `decision-grill`: three to five numbered questions in one message, each with a recommended answer, "yes" accepts. Ask what they would trade away, what the last one got wrong, and who else uses it.

   **Done when:** three to five criteria are listed with a weight each — must-have, nice-to-have, or don't care — and the user confirms the list.

3. **Check the market's clock before naming models.** Search for the category's current generation, typical refresh cycle, and whether a new model, a sale or a clearance is imminent. Record today's date. Confirm which model codes are sold in the user's country.

   **Done when:** you can state the current generation, the typical refresh window and whether now is a sane time to buy — each with a source and a date, or marked "could not verify".

4. **Build the shortlist from current, dated sources.** Two to four models that meet the must-haves. Prefer the manufacturer's spec page, an independent test lab, and a professional review that states its method. At least two independent sources per model. Record price with currency and an "as of" date. Drop anything discontinued or unavailable locally.

   **Done when:** two to four models are listed, each with a spec source, a price with an as-of date and local availability; anything unverified is labelled "unverified".

5. **Build one comparison table.** Columns are the models; rows are the user's criteria in their own words, then price, availability, warranty, and running or consumable cost where relevant. Score plainly — best / ok / poor, or a tick / tilde / cross — with a one-line evidence note per row. Do not average scores into a decimal; say which criteria decide the choice.

   **Done when:** the table covers every shortlisted model against every agreed criterion, and every cell traces to a dated source or is marked "unverified".

6. **Recommend, with the limits built in.** Name one pick, or a conditional ("A if you mostly do X, B if Y"). State confidence — high, medium or low — and why. Name the single fact that would most change the recommendation, and the runner-up's one real advantage.

   **Done when:** the recommendation names a model, gives a confidence level with a reason, names one change-my-mind fact, and contradicts nothing in the table.

7. **Say when not to buy, when it applies.** An imminent refresh, a known sales season, first-generation risk, a price that historically drops, or end-of-life stock. If waiting is clearly better, give the date to wait for. If there is no reason to wait, say that too, with the evidence.

   **Done when:** a dated "wait until" note exists, or an explicit "no reason to wait" with the evidence, and it agrees with the market check in step 3.

8. **Hand over the buy step.** Exact model and configuration string, the price to expect and its date, what to check in the first week (return window, warranty registration, model code on the box), and what to skip — extra warranty, accessories, upsells — only where the evidence supports skipping.

   **Done when:** the user has one configuration to order, a price with a date, and a check and return window.

9. **Offer to save the work.** Write the table and its sources to a file only if the user wants it. The default is chat only.

   **Done when:** the user has the file path, or has declined and the answer stands in chat.

## Gotchas

- A price without a date and a country is not a price. State both or mark it unknown.
- Review scores are not comparable across sites and should never be averaged. Quote the method, not only the number.
- Specs the user did not ask for are noise. A bigger number on a criterion they marked "don't care" is not a reason to recommend a model.
- Affiliate listicles rank by commission. Prefer a test lab with a published method, the manufacturer's own spec sheet, or a reviewer who shows their measurements.
- Model codes differ by country. The "same" appliance can have a different spec and a different price.
- Never invent a model number, a price or a release date. Write "unverified" and say what to check locally.
- If search is unavailable or returns nothing current, say so and fall back to criteria plus a checklist for what to verify in a shop — do not fill the gap from memory.
- A discount is only a discount against a dated baseline. "Was 800, now 600" needs the date of the 800.
- Refurbished and used change the ranking: warranty, battery health and return rights matter more than model year.
- The best model is not the best buy if it is out of stock everywhere or arrives after the deadline.

## Output

- **In chat:** the criteria round, then the comparison table, then a short recommendation — pick or conditional, confidence and why, the one fact that would change it, the runner-up's advantage, and the when-not-to-buy line.
- **`purchase-comparison-<category>.md`** (Markdown) only when asked — the same table plus a source list where every entry carries a URL and a date.
- **Every claim shows its source and date.** Unverified rows are labelled, not smoothed over.
