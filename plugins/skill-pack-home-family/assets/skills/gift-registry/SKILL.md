---
name: gift-registry
description: Keep a running gift-idea file for each person, log hints with dates, and propose three budget-fit options before an occasion without repeating a gift already given. Use when the user asks for a gift idea, says a birthday is coming up, mentions someone wanting something, or asks what to get.
---

## When to use

- "Gift idea for my mother / partner / friend" or "what should I get them?".
- "Her birthday is coming up" and the user has nothing yet.
- "He mentioned wanting ___" — the user wants it remembered for later.
- Anniversaries, weddings, housewarmings, holidays, new babies, thank-yous.
- "Don't let me buy the same thing twice" or "I can never remember what I've given".
- Keeping a year-round list instead of scrambling the week before.

## When not to use

- **The user's own wish list**: that is a task note, not a gift file.
- **Corporate or bulk gifting** (office Secret Santa, client gifts, 30 staff): out of scope.
- **Choosing a restaurant, menu, or party plan for the occasion**: use `meal-plan-groceries` or answer directly.
- **Writing the card, invitation, or thank-you note**: a separate writing task. Offer it after the gift is chosen.
- **Buying, paying for, or shipping the gift**: no accounts, no payments, no orders.
- **Product safety or age-appropriateness questions** ("is this safe for a two-year-old"): route to the manufacturer or a health professional, not this skill.
- **An occasion for the user themselves** (their own birthday): the file can note it, but this skill does not plan their party.

## Procedure

1. **Resolve the person and open their file.** List `gift-ideas/*.md`. If the user named a relationship, open that file. If two could match, or no file exists, ask once for the relationship label and the occasion date. Create `gift-ideas/<relationship>.md` only after the user confirms which person it is.
   **Done when:** exactly one file path is chosen and the user has confirmed which person it represents.

2. **Mine the conversation before asking anything new.** Every hint becomes a dated line: "mentioned wanting X (2026-11-17)", "size M", "no more mugs", "saving for a trip". Put a stated preference under Interests, a stated dislike under Avoid, and a possible purchase under Ideas. If the user says nothing new, skip this step.
   **Done when:** every hint from the current conversation is logged with a date, and nothing is logged twice.

3. **Ask at most four gap-filling questions.** Occasion and date, budget range, sizes/colors/allergies, and "what does this person already have too much of". Never ask the recipient, and never ask the user to contact the recipient on the assistant's behalf. If the answer is unknown, record "unknown" and continue.
   **Done when:** budget, occasion date, and at least one interest are in the file or explicitly marked unknown.

4. **Check the history before proposing.** Read every entry marked "given" and the Avoid section. Drop any idea that matches a past gift by name or obvious equivalence: same book, same scent, same model, same voucher.
   **Done when:** you can name at least one past gift that will not be proposed again, or the Given list is confirmed empty, and the Avoid list has been applied.

5. **Propose exactly three options spread across the budget.** One at the lower end, one in the middle, one at the top, or three inside a narrow range. For each: what it is, a rough price band with the date checked, where it is typically sold, and one line on why it fits this person's logged interests. Add a practical note on size, delivery time, or personalisation. Use web search only to confirm that a product exists or to find a typical price band; never present a scraped price as exact or guaranteed.
   **Done when:** three options are on the table, each tied to a logged interest, each inside the budget, and none duplicates a given item.

6. **Offer one low-cost or handmade fallback.** A photo book, a batch of something they like, an outing, or a favour they would value. This matters most when the budget is tight or the person "has everything".
   **Done when:** the user has a fourth option they could make or do instead of buying, or has said they do not want one.

7. **Wait for the choice, then record the truth.** Do not buy or message anyone. On a pick, log the idea with status "chosen". When the user buys it, mark "bought". After the occasion, ask once how it went and mark "given" with a short note. If they reject all three, log why under Avoid and offer three replacements.
   **Done when:** the file reflects the real status (idea, chosen, bought, given) and no purchase, message, or order has been made by the assistant.

8. **Close the loop.** Put the occasion date in the file and say when to look again (for example, two weeks before). If a calendar tool is available, offer to add a reminder; otherwise state plainly that no reminder was set.
   **Done when:** the occasion date is in the file and the user knows whether a reminder exists.

## Gotchas

- A hint is not a promise. Log "mentioned", not "wants".
- Never contact the recipient, their family, or a shop on the user's behalf.
- Do not record sensitive guesses about health, money, or relationships unless the user asks. A gift file can be seen by other people.
- Prices move. Give a band and the date checked.
- Duplicate risk is highest with books, scents, candles, and vouchers. Check those categories twice.
- If the occasion is today, lead with something available locally now, then log it for next time.
- One file per person, named for the relationship, not a shared "presents" list. Shared lists cause duplicates.
- If the user is choosing for someone in the same household, suggest a neutral file name and a private folder.

## Output

File, relative to the user's working folder:

- `gift-ideas/<relationship>.md` — one file per person, Markdown. Sections: Basics (occasion dates, sizes, interests, avoid, budget), Ideas (date, idea, hint or source, estimated price, status), Given (date, item, occasion, note). No other files.

In chat:

- The file path and what changed in it.
- Three options with a price band, where to buy, and the one-line "why it fits this person".
- A line naming the past gift that was deliberately avoided.
- One handmade or low-cost fallback.
- The occasion date and the reminder status.
- No purchase, booking, message, or contact with the recipient.
