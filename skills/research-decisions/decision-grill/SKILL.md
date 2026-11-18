---
name: decision-grill
description: Interview the user about a big personal commitment — renovating, moving house, changing jobs, a large outlay — in batched rounds of 3–5 numbered questions, each with a recommended answer they can accept, until the constraints, budget, dealbreakers and the real motivation are explicit, then write a decision brief the user approves. Use when someone says "should I" about a commitment or "help me decide", "thinking about renovating", "I'm torn between". Not for choosing between named products or models — that is big-purchase.
---

# Decision grill

A big decision is not a product question. This skill interviews the user before any research or planning happens, so the brief is built on their constraints instead of your assumptions.

**The user decides. You help them think; you never pick for them.**

## When to use

- "Should I…" about a choice that is expensive, disruptive or hard to undo: renovating, buying a car, changing jobs, moving house or city, taking on a large commitment.
- "I'm torn between…" or "help me decide" — they want a thinking partner, not a product pick.
- The stakes justify ten to twenty minutes of questions and a written record.
- A decision with other people in it — a partner, a parent, an employer — where the user needs their own position clear first.
- A recurring-cost switch or contract choice — "should I switch insurers this year", "should we change energy plans".
- An apparently small ask that turns out to sit inside a big decision: "help me decide whether to move closer to Mum".
- They have already listed options and cannot see how to choose between them.

## When not to use

- **A purchase comparison between named products** — "which laptop", "best mattress", "is this worth the extra money". That is `big-purchase`; it owns the comparison table and dated prices.
- **A small decision answerable in one exchange** — what to eat, which route to take, which of two similar cafés. Answer directly; an interview would be absurd.
- **An open factual or research question** — "how do heat pumps work", "what do studies say about sleep". There is no decision yet.
- **Verifying a claim** — "is it true that…". Go to `claim-check`.
- **Learning a topic** — "teach me how mortgages work". Go to `teach-me`.
- **A decision that is already made** and they want it executed — "I've decided to move, plan it". That is planning, not deciding.
- **Someone else's decision** — "how do I get my partner to agree". That is persuasion or mediation, not the user's choice.
- **Medical, legal, tax or financial advice.** The interview can clarify what they value; it never substitutes for a doctor, lawyer or adviser.

## Procedure

1. **Name the decision and the stakes.** In one sentence: what is being decided, why now, and what makes it hard. Reflect it back and ask for a correction. Do not start researching, even if the question looks factual.

   **Done when:** the user has confirmed or corrected the one-sentence framing, and their version is the one you will use.

2. **Set the interview contract before the first question.** Say: questions come in rounds of three to five, batched, never one at a time; each carries a recommended answer where you have one, and "yes" accepts it; any answer can be "not sure" or "skip"; the interview ends with a brief they approve. Ask whether they want it shorter or longer.

   **Done when:** the user agrees to the process or sets a different limit, and your next message is the first round — not more preamble.

3. **Round 1 — the frame.** Ask three to five questions: what started this now; what a good outcome looks like in twelve months; what happens if they do nothing; who else is affected or has a say; what they are most afraid of getting wrong. Number each question and put a recommended answer under it.

   **Done when:** three to five numbered questions are in ONE message, each has a recommendation where you have one, and you have stopped and are waiting for answers.

4. **Round 2 — constraints.** Ask only what round 1 left open: the all-in money ceiling (fees, permits, insurance, running costs), time available, tolerance for disruption, hard dealbreakers, and what they would refuse to trade even if it made the numbers better.

   **Done when:** the notes hold a budget figure or range, at least one dealbreaker, and at least one constraint they will not trade — each in the user's words.

5. **Round 3 — the options on the table.** Ask what they are actually choosing between, what is already ruled out and why, whether "do nothing" or "wait" is a real option, the worst realistic outcome and whether they could absorb it, and the deadline or the date the choice is forced.

   **Done when:** at least two live options plus "do nothing" are listed, each with a stated main risk, and the deadline is written as a date or "none".

6. **Round 4 — close the frontier.** The frontier is every question whose prerequisites are now settled. Ask the remainder, but only the remainder. If nothing material is missing, say so and skip this round rather than padding it.

   **Done when:** you can name the single open question that still blocks a brief, or state that none remains.

7. **Write the brief.** One page, in this order: Decision; Why now (their words); Constraints (money, time, dealbreakers); Options and trade-offs; What would make each option the right one; Open questions; Recommended next step; What would change the answer. Mark each line "you said" or "my inference". No option gets a verdict.

   **Done when:** the brief is pasted in full, every constraint carries a number or is marked unknown, and no sentence tells the user which option to pick.

8. **Get approval, in a loop.** Ask one question: "What's wrong or missing? Reply yes to accept." Apply edits and show only the changed sections, then ask again. Keep a one-line revision note at the top.

   **Done when:** the user has said yes to a specific version and you have quoted that yes; nothing is saved before then.

9. **Save and offer the next step — do not take it.** Write the approved brief to `decision-brief.md`, or `<topic>-brief.md` when the folder already holds a different brief. Offer research or planning as a separate choice and wait.

   **Done when:** the file exists with the approved text, its path is shown, and the user has chosen whether to continue.

## Gotchas

- One question at a time is the failure this skill exists to prevent. If you catch yourself asking a follow-up before the round is answered, stop.
- More than five questions in a round turns an interview into a form; fewer than three wastes a turn.
- A recommendation is not a decision. Word it so "yes" accepts your suggestion, but record the user's answer, not yours.
- Don't research mid-interview unless a fact blocks a question, such as a legal deadline. Look it up yourself; never ask the user for a fact they asked you to find.
- Don't add options the user did not raise. A brief with six options is a brief that avoids the decision.
- Budget means all-in. Renovation, car and moving costs hide fees, permits, insurance, running costs and the cost of undoing the choice.
- If two answers contradict each other, ask once, plainly, and record the contradiction rather than silently choosing one.
- A decision about health, law, money, safety or someone else's care needs a professional check. The interview clarifies values; it does not clear the decision.
- If the user is in crisis or the decision is forced today, drop the rounds: say what matters most right now and keep the brief to one screen.
- Silence is not approval. The brief is a draft until they say yes.

## Output

- **In chat:** the numbered rounds with recommendations as they happen; the full brief after the last round; one line asking for approval; then, once approved, the file path and a single question about what comes next.
- **`decision-brief.md`** (Markdown, one page) in the workspace — Decision, Why now, Constraints, Options, Open questions, Recommended next step, What would change the answer. Renamed to `<topic>-brief.md` when the folder already holds another brief.
- **No verdict.** If the user says "just tell me what to do", say the brief is theirs to decide and offer the strongest case for each option instead.
