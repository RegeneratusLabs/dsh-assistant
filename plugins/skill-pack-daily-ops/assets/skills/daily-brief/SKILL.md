---
name: daily-brief
description: Assemble a short morning brief from what is actually on disk — open tasks from TASKS.md, anything dated today in the user's plan files, and today's weather for their location looked up on the web — in five sections or fewer, saying plainly what was skipped and why. Use when the user says "good morning", "brief me", "what's today look like", "start my day", "catch me up on today", or "morning, what's on?"
---

# Daily brief

The brief is assembled, not written. Every line comes from a file on disk or a web
result, and anything whose source is missing is named as skipped. There is no
email, calendar or message access: those are always skipped, and saying so is part
of the brief.

## When to use

- "Good morning." / "Morning."
- "Brief me." / "Run my morning brief." / "Give me the rundown."
- "What's today look like?" / "What's on today?" / "What's happening today?"
- "Start my day." / "Catch me up on today."
- "I've been away two days — where am I?"
- "What do I need to know this morning, and what's the weather?"

## When not to use

- **A research request that happens to start in the morning** — "look into heat pumps, I have all morning". That is research, not a brief.
- **"What's on my list?"** — a straight list request belongs to `task-board`; no weather, no assembly.
- **Durable facts about the user** — "remember that I…". That is `memory-keeper`.
- **Ending a long session** — "wrap this up for later". That is `handoff`.
- **World news or a headline roundup.** This brief is personal and local; a news digest is a different request.
- **Detailed day planning** — "plan my whole day hour by hour". That is planning, and needs the user's input, not a summary.
- **An evening review** — "how did today go?" is backwards-looking; this brief only looks forward.

## Procedure

1. **Get the date and a location.** Take today's date from the system, in the user's time zone. For location, read `PROFILE.md` if it exists; otherwise ask once ("Which place should I check the weather for?"). Never guess a city.

   **Done when:** you have both a date string and either a location or an explicit decision to skip weather.

2. **Read the local sources that exist.** `TASKS.md` for open tasks; `PLAN.md`, or any file under a `plans/` folder, for items dated today. Record each source as read or absent.

   **Done when:** every source is either read or listed as absent, with no source assumed to be empty.

3. **Choose at most five tasks.** Overdue first, then due today, then the oldest undated. Lead with the wording already in the file; do not rewrite the tasks.

   **Done when:** at most five tasks appear, ordered by that rule, or the section says there are none open.

4. **Find what is dated today** in the plan files — a meeting, a deadline, a reminder the user wrote. Quote the item and keep its date.

   **Done when:** every item shown carries the date written in the file, or the section states that nothing is dated today.

5. **Look up today's weather** with one web search for the location, plus a word like "forecast" or "today". Read the result and give one line: high and low, chance of rain, anything that changes what they carry. State that it came from a search, and never state a number you did not see.

   **Done when:** the line names the place searched and the day, or weather is marked skipped with the reason.

6. **Skip with notice.** For every absent source, write a plain line in section 5: "no `TASKS.md` in this folder", "no plan files", "email and calendar are not connected, so nothing from appointments". Never fill a section with invented content to avoid an empty one.

   **Done when:** each missing source appears in the "not checked" line, and no filled section lacks a named source.

7. **Write it in chat, in five sections at most:** *Today* (the date, one line), *Tasks*, *Dated today*, *Weather*, *Not checked*. No preamble, no motivational line, no sign-off.

   **Done when:** the reply has five sections or fewer, runs to about 150 words, and every line traces to a file, a search result, or a stated skip.

## Gotchas

- Empty is a valid brief. "Nothing open, nothing dated" beats filler every time.
- Weather from a search can be stale, for the wrong suburb, or for yesterday. Name the place and the day you searched; if the result is ambiguous, say so rather than picking one.
- If the user is travelling, their location may not be home. Ask; do not reuse the profile's city on a day they are away.
- Use the user's local date, not UTC — "today" is their today.
- Do not add news, quotes, encouragement, or a plan you thought up. The brief reports; it does not coach.
- Do not read the whole task file aloud. Five items and a count is the brief; the rest is one click away.
- No file is written unless the user asks for one. The brief is a message.
- Never claim to have checked email, messages or a calendar. There is no connector for them in this setup; skipped is the honest answer.

## Output

- **In chat only:** Markdown, five sections at most — Today, Tasks, Dated today, Weather, Not checked — about 100–150 words, in that order.
- **No file**, unless the user explicitly asks to save the brief; then `brief-YYYY-MM-DD.md` in the working folder.
- One line at most about what was skipped, naming the source, with no apology or explanation beyond it.
