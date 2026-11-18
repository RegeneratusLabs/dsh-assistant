---
name: bill-triage
description: Audit every recurring bill and subscription the user has — from statements, screenshots, PDFs, or a list from memory — into one table of provider, amount, cadence and renewal date, then flag increases, duplicates and forgotten subscriptions, sort them into keep/negotiate/cancel, and draft the cancellation letters for the user to send. Use when someone says "go through my bills", "what am I subscribed to", "is this charge right", "audit my subscriptions", or "why did my bill go up".
---

# Bill triage

This is arithmetic and evidence, not advice. Every row comes from a document the user gave you or a line
they said out loud, and anything missing stays `unknown` rather than becoming an estimate. Nothing here
sends a letter, cancels a service, or touches an account — the drafts are handed over for the user to send.

## When to use

- "Go through my bills and tell me what I can cut."
- "What am I actually subscribed to?" — usually after a statement, a renewal email, or a card charge they don't recognise.
- "Is this charge right? It's higher than last month." / "Why did my bill go up?"
- "Audit my subscriptions — I think I'm paying for the same thing twice."
- "Find subscriptions I forgot about."
- They hand over a statement PDF, a set of screenshots, a renewal notice, or just list things from memory.
- A renewal is coming up and they want to decide before it charges.
- They want a cancellation written, not sent — "draft it and I'll send it."

## When not to use

- **One-off purchase decision** — "should I buy this one or the cheaper one", "is this deal good". A purchase-research task owns that; nothing here recurs.
- **Business bookkeeping** — categorising receipts for tax, reconciling accounts, expense claims, VAT. That is accounting, even when the rows look like bills.
- **A consumer dispute about one charge** — "they charged me for a service I never received", "they charged me twice and won't refund". That is a complaint case; go to `complaint-escalation`.
- **Making sense of one confusing document** — "explain this insurance renewal letter". Go to `explain-this-document`.
- **Filling in a form for a new supplier or a direct debit mandate** — go to `paperwork-forms`.
- **Spending analysis** — "how much did I spend on groceries last month". That is a budget report, not recurring commitments.
- **Anything that requires logging into the user's bank, card or provider account.** This skill never does that and never moves money.

## Procedure

1. **Collect what the user has.** Ask for statements, screenshots, PDFs, renewal emails, or a straight list from memory. Accept partial material — a memory list with amounts missing is still workable. Never ask for logins. If they offer documents, list the ones you actually read and the pages you skipped.

   **Done when:** every document or memory item the user offered is listed by name (or "from memory"), and each is marked read or skipped.

2. **Extract one row per recurring provider.** Columns: Provider | What it is | Amount | Currency | Cadence | Last charged | Next renewal. Keep the provider's own wording for "what it is" — do not translate it into a guess. Normalise nothing at this stage; record what the document says.

   **Done when:** the table has one row per distinct provider, every amount carries a currency, and every row names a cadence or says "unknown".

3. **Normalise so rows can be compared.** Convert each row to a monthly and an annual figure. Mark anything where the cadence was inferred rather than stated, and anything where the amount changes month to month (usage-based bills).

   **Done when:** every row has a monthly and an annual figure, or is explicitly marked "cannot be normalised" with the reason.

4. **Flag what is off.** Look for four things and name the row for each:
   - **Increase** — current amount against the previous amount, with the difference and the percentage.
   - **Duplicate** — the same service billed twice, or two providers doing the same job.
   - **Forgotten** — no use in months, a free trial about to convert, a service the user has replaced.
   - **Anomaly** — a charge that does not match the plan described, an unexplained fee, a cadence that changed.

   **Done when:** each flag names the row or rows, states the evidence (document line, screenshot, or "user said"), and says how confident you are.

5. **Sort every row into keep / negotiate / cancel.** Keep = used and reasonably priced. Negotiate = needed but overpriced, out of contract, or a known retention situation. Cancel = unused, duplicate, forgotten, or replaced. Exactly one bucket per row — no "maybe" column.

   **Done when:** every row has one bucket, and the table shows the count in each bucket.

6. **Do the arithmetic.** Total monthly and annual spend; savings if every cancel happens; savings if every negotiate succeeds; a realistic combined figure. Keep them separate — a "negotiate" saving is not money yet.

   **Done when:** monthly and annual totals are shown and each is the sum of the rows above it, recomputable by hand.

7. **Draft the letters — one per provider in negotiate and cancel.** Include: the account or reference placeholder, the service named exactly, the effective date requested, a request to stop future charges, a request for written confirmation, and the user's contact placeholder. Put every unknown in square brackets — `[ACCOUNT NUMBER]`, `[YOUR NAME]`. For a negotiate letter, add the specific ask (a price, a term, a downgrade) and a deadline.

   **Done when:** there is one draft per negotiate/cancel row, each draft has a bracket placeholder for everything the user must fill, and each asks for written confirmation.

8. **Hand over with an order of operations.** Sort the actions by next renewal date — the ones about to charge come first. List the three actions worth the most money. State plainly that nothing has been sent or cancelled.

   **Done when:** the file exists, the chat reply lists the drafts, the three highest-value actions, and the words that nothing was sent.

## Gotchas

- A missing amount is `unknown`, never an estimate. One invented number poisons the whole table.
- Annual charges look small monthly and hurt once a year — always show both, and say which renewals land in the next 60 days.
- Duplicates hide under different names: the same app after a rename, a bundle that already includes a service billed separately. Compare what the service does, not the name.
- A free trial is a bill with a start date. Treat it as a renewal, not a footnote.
- Don't tell the user a price is "wrong" from memory. Published prices change by region and by offer. Only check a published price if they ask, using a live lookup, and cite where it came from.
- Usage-based bills (energy, water, phone data) do not have a fixed amount — show the range or the last three amounts and label it.
- If a statement is longer than you can read, say which pages or months you covered. A partial audit presented as complete is worse than a small one.
- This skill drafts and never sends, cancels, logs in, or pays. If the user asks you to just do it, say the drafts are ready and they send them.

## Output

- **`bills-review.md`** — the full table, the flags, the keep/negotiate/cancel grouping, the three savings figures, then one cancellation or negotiation draft per provider underneath. If the user has many rows and asks for a spreadsheet, the same content as `bills-review.xlsx` instead.
- **In chat:** a five-line summary — monthly total, annual total, the three highest-value actions in priority order, the single biggest flag, and how many drafts are waiting, ending with a plain statement that nothing has been sent.
