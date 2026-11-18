---
name: teach-me
description: Tutor the user across sessions on a topic they actually want to learn, keeping a small workspace with a MISSION.md that records why they care, their current level and the goal in their own words, plus a lesson log; every session reads both, teaches one bounded thing with a worked example, sets a small practice task between sessions, and appends to the log. Use when someone says "teach me", "help me learn", "I want to understand" or "explain it like I'll need to use it".
---

# Teach me

Learning takes more than one answer. This skill keeps the reason and the progress in files, so a session next month starts where the last one stopped instead of at the beginning.

## When to use

- "Teach me X" / "Help me learn X" / "I want to understand X properly."
- "Explain it like I'll need to use it" — they intend to apply it, not just hear it.
- "I keep forgetting how this works" — a returning learner.
- "Where were we?" / "Let's carry on with X" — a workspace may already exist.
- A layered topic they will use: budgeting, a language, photography, statistics, cooking techniques, gardening, public speaking, a musical instrument, spreadsheets.
- A goal with a horizon: "I want to read a balance sheet by spring."
- They ask for a learning plan or curriculum for themselves.

## When not to use

- **A one-off factual question** — "what's the capital of…", "how tall is…". Answer it; offering a course is annoying.
- **A single explanation with no follow-up intended** — "quickly, what's a deductible?" Answer, offer the workspace once, and accept no.
- **Drilling or practice with no learning goal** — "quiz me on these 20 words I already know". Run the drill.
- **Doing the work for them** — homework, an essay, a work deliverable. Teach the method if asked; do not produce the answer.
- **Deciding whether to learn something, or which course to buy** — `decision-grill` or `big-purchase`.
- **Checking a fact or a claim** — `claim-check`.
- **A topic that needs a licensed professional for their case** — medical, legal, tax, mental health. Teach the general concept if useful, and point to a professional for their situation.
- **A topic the user already knows better than you** — say so; a wrong lesson costs more than no lesson.

## Procedure

1. **Find or create the workspace.** Look for `teach/<subject>/` in the workspace, with a lowercase-hyphen subject name. If the user names a folder, use theirs. Create the folder with `MISSION.md` and `LESSONS.md` if it is new. If there is no file access, keep both in chat and say the files were not written.

   **Done when:** the workspace path exists and holds both files, or you have said where the mission and log will live instead.

2. **Write the mission in their words.** Ask, in one batched message of four questions or fewer: why now; what they want to be able to do; where they are starting from; how much time per week. Read it back in their phrasing, not yours.

   **Done when:** `MISSION.md` has Why, Goal (their words), Starting level, Time per week and "done looks like", and the user has said it is right.

3. **Open every session by reading the mission and the log.** Say in one line what you are picking up from last time and which goal it serves. On session one, say what the mission commits to.

   **Done when:** your first message quotes the goal and either the last log entry or "first session", and names today's objective.

4. **Choose ONE bounded thing.** Pick the next step that is hard enough to be worth doing and small enough to finish in the session — the gap between what they can do now and what the goal needs. State why this, why now, and what they will be able to do at the end.

   **Done when:** the objective is one sentence, it names one thing rather than a topic area, and the user agrees or does not object.

5. **Teach with a worked example.** A short explanation (roughly 300 words or less), then one example worked end to end with the reasoning shown, then a second example where the user does the next step and you respond. Use their context — their budget, their garden, their photos, their spreadsheet. Cite one strong source with a link and date, or say the lesson is from general knowledge.

   **Done when:** the worked example is shown in full, the user has done at least one step themselves (or asked to watch this time), and the citation or the "general knowledge" note is present.

6. **Check understanding by retrieval, not by asking "does that make sense?"** Ask two or three questions from memory, or ask them to redo one step without looking. Name what they got right and the single thing to fix; re-teach only the gap.

   **Done when:** the user has answered at least one recall question or attempted the step, and you have named one thing that worked and one to fix.

7. **Set a small practice task for between sessions.** Something doable in 10–20 minutes in their real life, with a way for them to tell whether they got it right. One task, not a list.

   **Done when:** the task states what to do, how long it should take, and how they will know it worked.

8. **Update the lesson log.** Append a dated entry: objective, what was covered, what they grasped, what to revisit, the practice task, and the next step. Keep one format throughout, newest last.

   **Done when:** `LESSONS.md` has a new entry with all six fields and a "next" line that a future session could act on without you.

9. **Close the session without starting the next one.** Say what they can now do, the practice task, and when to come back. Do not teach ahead.

   **Done when:** a closing message names one win, one task and one next step, and the session stops there.

## Gotchas

- One bounded thing per session. Two topics means neither sticks, and the log becomes a summary nobody uses.
- Ground every lesson in the stated goal. If the goal has changed, ask before rewriting the mission, then record the change in the log.
- Don't re-teach what the log says they have. Do revisit what it says they missed — that is the point of keeping it.
- A wall of text is not teaching. Explanation, example, their turn; if you have not handed over a step, you have lectured.
- "Does that make sense?" earns a polite yes. Ask them to do it, or to say it back without notes.
- Respect the stated time per week. A 90-minute lesson for someone with 20 minutes kills the habit faster than a boring one.
- Don't quiz on trivia unrelated to the goal, however interesting.
- Never shame a wrong answer; name the step that broke, not the person.
- Retrieval should feel slightly effortful. If it is too easy, the practice is not building anything.
- One source per session is enough. A reading list is often a way of not teaching.

## Output

- **In chat:** today's objective and why, the short explanation, the worked example, two or three recall questions, the practice task, and one line on what comes next.
- **`teach/<subject>/MISSION.md`** — Why, Goal in the user's words, Starting level, Time per week, Done looks like. Revised only with the user's agreement, with the change noted in the log.
- **`teach/<subject>/LESSONS.md`** — one dated entry per session with objective, covered, grasped, to revisit, practice task and next step.
- **No certificate, no course dump, no second lesson in one session.**
