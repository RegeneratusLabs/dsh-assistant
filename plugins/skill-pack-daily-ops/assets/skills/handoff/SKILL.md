---
name: handoff
description: Compact a long working session into one short pickup document that a fresh assistant can continue from with zero chat history — what we were doing, what is decided, what is still open, where every file lives, which skill to load next, and the first action. Use when the user says "wrap this up for later", "I'll pick this up tomorrow", "handoff", "save where we are", "I'm starting a new chat", or when a long session ends with work still unfinished.
---

# Handoff

A handoff is a note to the *next* session, not a transcript of this one. It is
read by someone who has never seen this conversation, so every line must stand
alone. One page is the target; two is the limit.

## When to use

- "Wrap this up for later." / "Save where we are."
- "I'll pick this up tomorrow" — or any promise, explicit or implied, to continue later.
- "Handoff" / "write a handoff" / "make a pickup note."
- "I'm starting a new chat — catch the next session up."
- The session has run long and earlier turns are dropping out of view, with work unfinished.
- The user is stopping mid-task and another person or another assistant will continue.

## When not to use

- **The task is finished.** One question answered, one document delivered, nothing open. Say "nothing to hand off" and write no file.
- **A lasting fact about the user** — "remember I prefer mornings". That is `memory-keeper`, not a handoff.
- **One more item on a list** — "add this before I forget". That is `task-board`.
- **Summarising a document or an article.** Do the summary; it is the deliverable, not a pickup note.
- **"Hand this to Pat"** meaning send it to a person. That is a message; this skill writes a file.
- **Planning future work.** If the user wants steps and dates, write the plan first; hand off afterwards only if a session must end.
- **A single open question.** Answer it, or ask it; a one-line question does not need a file.

## Procedure

1. **Read any existing handoff first.** Open `HANDOFF.md` in the working folder. Carry forward the open items that are still true and drop the ones that are finished. If the file is missing, start clean.

   **Done when:** the old file has been read, or its absence confirmed, and you hold a list of items that still apply.

2. **Write the six parts, in this order:** *What we were doing* (one short paragraph: the goal and exactly where it stopped); *Decided* (bullets — the decision, plus a few words of why); *Open* (bullets, each phrased as the question the next session must answer); *Files* (paths only); *Next skill* (one name); *First action* (one step).

   **Done when:** all six headings are present, and each one has either content or the word "none".

3. **Point at files instead of copying them.** Each artifact gets its path, relative to the working folder, and half a line on what it is. Never paste a file's contents into the handoff — the next session can open the file.

   **Done when:** a directory listing confirms every path listed exists, and no file body is quoted inside `HANDOFF.md`.

4. **Name the one skill to load first.** Usually `memory-keeper` to recover who the user is, `task-board` to see what is outstanding, or `daily-brief` for a morning restart. If none applies, write "none — plain conversation".

   **Done when:** exactly one name is given, with a short reason, and the next session could act on it without asking anything.

5. **Give exactly one first action.** Concrete and small: "open `notes/budget.md` and answer Open question 2". No menus, no "you could also…".

   **Done when:** the action names a file or an open question from this document and needs no chat history to begin.

6. **Replace the file; do not append to it.** A dated title, then the six parts, kept to about a page. A growing timeline defeats the purpose.

   **Done when:** `HANDOFF.md` opens with today's date, runs roughly 40–70 lines, and reads cleanly to someone who never saw the chat.

7. **Say one line in chat.** Where the file is and what comes first.

   **Done when:** the reply names `HANDOFF.md` and the first action, and adds nothing else.

## Gotchas

- Write for a stranger. "As discussed" and "the thing we tried" mean nothing after the tab is closed.
- The open list is the valuable part. If it is empty, the task was finished — do not write a handoff.
- Decisions that were reversed: record only the final one, with one clause on why. The history is not useful to the next session.
- Never put secrets, passwords, account numbers or personal identifiers in the file; say where they live instead, e.g. "the key is in the password manager".
- Absolute paths break when the folder moves, and leak a machine's layout if the file is shared. Prefer paths relative to the working folder.
- Do not invent next steps. The first action must come from something actually open in this session.
- If the user says "no file", give them the note in chat and write nothing.
- A long session gets a short handoff, not a long one. Over two pages: cut the narrative, keep the files and the open questions.

## Output

- **`HANDOFF.md`** in the working folder, Markdown, about 40–70 lines, with the six headings above in that order.
- **In chat:** one or two lines — where the file is and what the next session should do first. The file carries everything else.
- No other files: no archive copies, no side notes.
