---
name: task-board
description: Keep a plain TASKS.md the user can also edit by hand — capture tasks from chat in their own words, one checkbox per task with a date only when they gave one, check for duplicates before adding, move stale or overdue items into a dated review section instead of deleting them, and tick what is done. Use when the user says "add a task", "put this on my list", "what's on my list", "I keep forgetting to", "mark that done", or "clean up my list".
---

# Task board

`TASKS.md` is a shared file: the user edits it by hand and the assistant edits it
in place. Their wording, their ordering and their extra notes are authoritative.
The assistant never deletes a task and never invents a deadline.

## When to use

- "Add a task: renew the car insurance." / "Put this on my list." / "Note to self: check the boiler filter."
- "I keep forgetting to call the dentist" — a statement of intent to act later.
- "What's on my list?" / "What's left?" / "Show me my open tasks."
- "Mark the bins task done." / "I finished the passport thing." / "Cross that off."
- "Clean up my list — some of it is stale." / "Review my tasks."
- The user mentions an obligation in passing and asks to keep it somewhere.

## When not to use

- **A lasting fact about the user** — "remember I'm vegetarian". That is `memory-keeper`.
- **Something with a time on it** — "meeting Tuesday at 10", "remind me at 4pm". Appointments and timed reminders belong on a calendar; this file has dates but no times.
- **A project with steps and dependencies** — "plan the house move". Write the plan, or a handoff; a single checkbox would swallow it.
- **A one-off list for one occasion** — tonight's shopping, a packing list. Keep it in the conversation; the board is for things that survive the day.
- **A question or research request** — "find out what a boiler service costs". That is a task to do now, not to track.
- **Durable notes, quotes or ideas.** The board is for actions, not storage.

## Procedure

1. **Read the file before writing to it.** Open `TASKS.md`. If it is missing, create it with the three headings `## Open`, `## Review`, `## Done` and say that you did.

   **Done when:** you hold the current open items in front of you, or have confirmed the file is new.

2. **Capture in the user's own words.** One checkbox per task, the action first, and only the detail they actually said. No rewording into project-speak, no added priority tags.

   **Done when:** the new line reads like something the user would say, and nothing on it came from you.

3. **Check for a duplicate.** If a near-identical open task exists, add the new detail to that line instead of creating a second entry.

   **Done when:** no two open lines describe the same action.

4. **Date it only when the user gave a date.** A stated deadline goes on as `due 2026-03-12`; every task gets `added 2026-03-04`. "Soon" is not a date — ask once: "Any particular day, or leave it undated?"

   **Done when:** every date on the line traces to the user's words or to today, with no inferred deadline anywhere.

5. **Write small and leave the rest alone.** Insert the line in the right section, keep the existing shape, and preserve hand edits exactly — their line order, their extra words, their own headings.

   **Done when:** the diff is limited to the lines you meant to change and every pre-existing user edit is still there verbatim.

6. **Triage only when asked.** On "clean up" or "review": move open items that are overdue or older than about two weeks with no progress into `## Review`, under a heading carrying today's date, keeping the original line intact. Read the moved items back to the user.

   **Done when:** nothing has been deleted, and every moved item appears under a review heading dated today.

7. **Complete, don't erase.** A finished task is ticked (`- [x]`), given `done 2026-03-05`, and moved to `## Done`.

   **Done when:** the task is ticked and dated, and no longer counted among the open items.

8. **Say what changed, briefly.** What was added, moved or ticked, and the count left open.

   **Done when:** the reply names the changes and the open count in two lines or fewer.

## Gotchas

- Never invent deadlines, priorities, categories or due dates. An empty date field is honest; a guessed one is a false alarm later.
- Do not reformat or reorder the file wholesale. The user's hand edits are the point of using a plain file.
- Do not "tidy" a task into clearer language without asking; their words are how they recognise it.
- A task with steps is still one checkbox. Put the steps in the reply, not in the file.
- Overdue is not failed. A past date stays on the line until they decide, and the item keeps its own wording.
- A task that survives three reviews untouched is probably wrong or unwanted. Ask whether to drop it; never drop it silently.
- If two lines conflict (same job, different dates), ask which is current rather than picking one.
- The file is plain text with no metadata — do not add frontmatter, tags or tables it did not have.

## Output

- **`TASKS.md`** in the working folder — Markdown, three sections, one checkbox per task, dates only where the user gave them or `added`.
- **In chat:** what changed in one or two lines, plus the open count ("3 added, 14 open, 2 in review"). Full list only when they ask for it.
