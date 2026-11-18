---
name: appointment-prep
description: Prepare a clinician-ready one-page summary, a question list with answer space, and a since-last-visit list for a doctor, dentist, or specialist appointment. Use when the user says they have a doctor's appointment, asks what to ask the doctor, or wants help getting ready for an appointment.
---

## When to use

- "I have a doctor's appointment" and the user wants to get ready.
- "What should I ask the doctor?" or "I always forget what to say".
- A specialist, dentist, follow-up, annual check, or results discussion.
- "Help me get ready for my appointment" or "write down my symptoms".
- A carer preparing for someone else's visit: "I'm taking my dad to his cardiology appointment".
- The user wants a medication list or a one-page hand-over for the clinician.

## When not to use

- **Medical research or "what causes X"**: this skill does not answer it. If the user asks directly, use the `claim-check` skill if it is installed; otherwise follow the claim-check steps in Gotchas. Then put the question on the clinician list.
- **"Is this serious?" or "what do these results mean?"**: never interpret. Only the clinician who examines the user can judge.
- **Booking, moving, or cancelling an appointment**: scheduling, not preparation.
- **Ongoing care coordination, medication schedules, care-home calls**: use `elder-care`.
- **A second opinion on a diagnosis or a scan report**: out of scope; route to the treating clinician.
- **Job interviews, school meetings, legal appointments**: not a health visit.
- **Someone else's appointment** when the user has not said they are the carer: ask first, then use the same procedure addressed to the carer.

## Procedure

1. **Safety check first.** Scan for urgent signals: chest pain, trouble breathing, fainting, sudden weakness or confusion, heavy bleeding, a severe allergic reaction, thoughts of harming self or others, or a child who is very unwell. If one is present, stop the preparation and tell the user to contact emergency services or an urgent care line now. Do not assess how serious it is. Offer to continue afterwards.
   **Done when:** either no urgent signal is present, or the user has been told plainly to get urgent help and the preparation is paused.

2. **Set the frame in one question.** Establish who the appointment is for (the user or someone they care for), the kind of clinician, the date, whether it is in person or phone/video, and the one thing the user most wants from the visit. In carer mode, ask what the person can report themselves versus what the user has observed.
   **Done when:** the appointment details and the single main goal are written down, and carer mode is either on or off.

3. **Interview for the summary, one topic at a time, in the user's words.** Cover: the main concern and its timeline (when first noticed, pattern, what makes it better or worse, what has been tried); other symptoms; medications including over-the-counter and supplements (name, dose, how often, since when, who prescribed); allergies; other conditions and past treatment; recent tests and whether the user has the report; what has changed since the last visit. "I don't know" is a valid answer. Write "not sure" rather than filling a gap.
   **Done when:** every topic has an answer or an explicit "not sure", and no clinical term has been added that the user did not use.

4. **Write the one-page summary in clinician reading order.** Roughly 350–450 words, short labelled lines or a small table rather than prose paragraphs. Order: (1) who, date, clinician, and reason for the visit; (2) main concern with a dated timeline; (3) current medications and allergies; (4) other conditions and recent results; (5) one line pointing to the separate since-last-visit list; (6) what the user hopes to leave with. Label it "Prepared by the patient" or "Prepared by <relationship> on behalf of the patient".
   **Done when:** the file fits one printed page, every section is present in that order, and it contains no diagnosis, no interpretation of results, and no treatment advice.

5. **Write the question list with room for answers.** Five to eight questions in the user's voice, most important first, each followed by three or four blank lines. End with a "next steps, follow-up, and what to watch for" block. Useful shapes: "What could be causing this?", "What would make this urgent?", "What should change if it doesn't improve?", "Do I need any test before the next visit?", "What are the options and their trade-offs?". Remove any question that asks the assistant to choose a treatment.
   **Done when:** the file has five to eight answerable questions with answer space and a next-steps block, and none of them asks the assistant to make a clinical decision.

6. **Write the since-last-visit list.** Two short lists. First, changes the user noticed: symptoms, sleep, appetite, mood, weight, side effects, new medicines, falls, hospital visits. Second, changes in circumstances: a move, a bereavement, a new carer, money or transport problems. Date each item where known.
   **Done when:** both lists exist, each item is dated or marked "date unknown", and the summary points to this file.

7. **Assemble what to bring and choose the format.** Bring-list: medication boxes or a list, recent results and letters, glasses and hearing aids, ID or insurance card if the clinic asks for one, the summary, and a pen. Ask whether the user wants a printable document; if document tools are available, also produce a PDF or Word copy of the three files. If they are not, say the Markdown files print as-is.
   **Done when:** the user has a bring-list and knows whether they are getting Markdown only or also a printable document.

8. **Rehearse in one message.** Give a 30-second opening line to read aloud: "I'm here about ___. It started ___. I've tried ___. My main question is ___." Then repeat the top three questions.
   **Done when:** the opening line is short enough to say in one breath and the user has confirmed it sounds like them.

## Gotchas

- Never diagnose. Never say "it's probably nothing" or "that sounds normal". Never label a result normal or abnormal; only the clinician with the full picture can.
- Never discourage the visit, even if the complaint sounds minor to you.
- Do not invent doses or fill medication gaps from memory. "Not sure" is safer and is itself useful to the clinician.
- One page means one page. If the interview runs long, cut adjectives, not facts.
- Carer mode changes who the summary is addressed to, not the standard. Mark what is observed versus what is reported.
- **Claim-check pattern** when a medical research question is unavoidable: state the claim being checked, look at one or two authoritative sources, report where they agree and disagree, name what is still uncertain, and put the question on the clinician list. Never convert it into personal advice.
- Keep the question list off the page handed to the clinician unless the user wants it there. Questions are for the user.
- The assistant does not email, upload, or send the summary anywhere. The user decides who sees it.
- If the user is preparing for a child or an older adult, record who will speak in the room and whether the patient can answer for themselves.

## Output

Folder `appointment-prep/<YYYY-MM-DD>-<visit-type>/` in the user's working folder:

- `summary.md` — one printed page in clinician reading order, ready to hand over verbatim.
- `questions.md` — five to eight questions, blank answer space, next-steps block.
- `since-last-visit.md` — dated changes and circumstances.
- Optional `summary.pdf` or `summary.docx` if the user asks and document tools exist; otherwise state that the Markdown files are the only format.

In chat:

- The three file paths, or the combined printable path if one was requested.
- The 30-second opening line.
- The top three questions.
- The bring-list.
- One line naming what was left as "not sure" and why that is useful to the clinician.
- No diagnosis, no result interpretation, and no claim that the visit is unnecessary.
