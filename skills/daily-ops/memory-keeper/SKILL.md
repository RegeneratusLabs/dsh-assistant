---
name: memory-keeper
description: Curate what the assistant durably knows about the user, in two tiers — a short always-visible profile block (name forms, key people and relationships, standing preferences, communication tone) and dated memory notes for everything else — including decoding the user's own shorthand and nicknames, asking once about people the profile is missing, and removing anything on request. Use when the user says "remember that", "what do you know about me", "forget I said that", "update my profile", or shares a lasting fact about themselves.
---

# Memory keeper

Two files, two jobs. `PROFILE.md` is read at the start of every conversation and
must stay short enough to read in twenty seconds. `MEMORY.md` is the dated log for
everything else, newest first. Both are plain text the user can open and edit;
their edits win.

## When to use

- "Remember that I take my coffee black." / "Make a note that I…" / "Keep in mind that I…"
- "What do you know about me?" / "Read me my profile." / "What have you got saved about me?"
- "Forget I said that." / "Delete the thing about my old job." / "Forget everything."
- "Update my profile — I go by Sam now." / "Add this to what you know about me."
- The user uses a nickname, abbreviation or in-joke you cannot decode, and it keeps coming up.
- They mention a person, place or routine the profile does not contain.
- They state a standing preference unprompted ("I never take calls before ten") — offer once to keep it.

## When not to use

- **A to-do** — "remember to buy milk", "remind me to call the vet". That is `task-board`; a task is not a fact about a person.
- **A session finding** — "remember the supplier's quote was 400". That belongs in the handoff or the notes, not the profile.
- **A calendar event** — "note that the meeting moved to 3pm". That is a calendar item, dated and single-use.
- **Passwords, card numbers, bank details, PINs, ID or passport numbers, health record numbers.** Never stored, even when asked directly; offer the alternative in step 5.
- **Facts about other people volunteered in passing** — a colleague's illness, a neighbour's finances. Do not keep them; they are not the user's to file.
- **Summarising a chat or a document.** That is the handoff or an ordinary summary.
- **Interviewing the user.** This is not a questionnaire; one short question at a time, and only when it blocks the work.

## Procedure

1. **Read what already exists.** Open `PROFILE.md` and `MEMORY.md` in the working folder. If either is missing, say so once and create it in step 6.

   **Done when:** you can state in one line how many profile lines and how many dated notes exist, or that the files are absent.

2. **Sort the new fact into exactly one tier.** Profile: name and the forms they use, key people (relationship plus a one-word note), standing preferences, communication tone. Notes: everything else — a fact with a shelf life, a one-off context, a detail that will be stale in a month.

   **Done when:** every new fact is assigned to one tier and you can say why the other tier was rejected.

3. **Decode shorthand before it is written.** A nickname, an abbreviation, "the cabin", "the usual" — write the expansion out in full ("when they say *the usual*, they mean the Tuesday order at the café on Main"). If you cannot decode it, ask once.

   **Done when:** no stored line contains a term a stranger could not decode, or the undecoded term is listed as a question in chat.

4. **Ask once about an unknown person.** If the user mentions someone the profile does not know, ask one short question: "Who is Dana, in a line?" If they decline or ignore it, note nothing and do not ask again in this session.

   **Done when:** each unknown person is either added with a relationship, or explicitly left out after a single ask.

5. **Apply the hard rule before writing.** No secrets: no passwords, PINs, card or bank or account numbers, ID or passport numbers, or health identifiers (diagnoses, prescriptions, record numbers). These are not stored even when asked, unless the user explicitly asks for that specific fact and it is not a credential. If they ask for a credential, decline once, suggest a password manager, and offer the useful substitute ("I can remind you to change it, without keeping it").

   **Done when:** every stored line can be shown to the user, traced to their own words, and none of it is a credential.

6. **Write minimally.** `PROFILE.md` stays under about 20 lines, grouped as Name, People, Preferences, Tone. `MEMORY.md` gets dated notes, newest first, one fact per line, in the user's words where possible. If the profile starts to grow, move the detail into a note.

   **Done when:** the profile is under 20 lines and every new note carries today's date.

7. **Forget on request.** Remove the fact from every place it appears — profile line and notes. Leave one dated tombstone with no content so it is not re-learned: "removed 2026-03-05 at the user's request — do not re-add". "Forget everything" empties both files down to their headings plus one dated cleared note.

   **Done when:** a search of both files for the fact's words returns nothing but the tombstone, and neither file still implies the fact.

8. **Report the change in one line.** What was added, changed or removed, and which file holds it. Do not repeat sensitive content back.

   **Done when:** the chat reply names the file and the fact's topic, and the user can confirm or correct it in one message.

## Gotchas

- A profile line must be readable by a stranger: "Dana — sister — calls on Sundays", not "D. (sis)".
- Preferences belong in the user's own words. A paraphrase drifts, and a drifted preference is worse than none.
- Do not record guesses as facts. Mark anything inferred "assumed — please confirm".
- If the user says "don't remember this" mid-conversation, honour it and write nothing, even if the fact is harmless.
- Two notes that contradict each other: keep both with their dates and ask which is current. Do not silently pick one.
- Never claim to remember something that is not in the files. If they are missing, say so plainly.
- The profile is loaded every session, so a line that is merely interesting costs attention every time. Keep only what changes how you reply.
- Do not ask permission before every save. Offer once when the fact first appears; silence means no.
- A nickname for a *person* and a nickname for a *thing* are different — file the person under People, the thing under Preferences.

## Output

- **`PROFILE.md`** — the short always-visible block: name forms, key people, standing preferences, tone. Under about 20 lines.
- **`MEMORY.md`** — dated notes, newest first, one fact per line, plus dated tombstones for anything removed.
- **In chat:** one line per change ("Saved to `MEMORY.md`: you prefer calls after ten."). When asked what you know, read the profile back in plain language, section by section. Print the raw file only if they ask for it.
