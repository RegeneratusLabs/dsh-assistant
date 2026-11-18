---
name: elder-care
description: Coordinate ongoing care for an aging parent or relative with one appointment log, a pharmacist-confirmed medication schedule, a before-the-call checklist, and a plain-language family summary. Use when the user is juggling a parent's care across time — an appointments log piling up, care home staff questions, helping a parent manage medication from several clinicians. Not for preparing one appointment (that is appointment-prep) or planning meals (meal-plan-groceries).
---

## When to use

- "Mum's appointments are piling up, I need one place for them".
- "Care home questions to ask on the phone" or "the care home called and I forgot what they said".
- "Helping dad manage his medication, I keep losing track".
- "Care coordination between me and my brother" or a family meeting.
- "What should I ask the pharmacist about her pills?".
- "I need a summary of dad's care to send my sister".
- Keeping a log of what carers, nurses, or doctors actually said.
- A relative who cannot easily track their own care.

## When not to use

- **The user's own appointments or medication**: use `appointment-prep`.
- **Planning meals for the relative**: use `meal-plan-groceries`. Clinician dietary instructions can be recorded here, but this skill does not design a diet.
- **Gift ideas for the relative**: use `gift-registry`.
- **Choosing a care home, comparing fees, benefits, wills, or legal powers**: out of scope. Offer a question checklist and point the user to local advice services; do not rule on eligibility.
- **Interpreting a diagnosis, scan, or behaviour, or deciding whether to stop a medicine**: only the treating clinician or pharmacist can.
- **Urgent symptoms**: emergency services now, not a call log.
- **Sending the summary to family, a care home, or a doctor**: the assistant never sends anything. It prepares text the user sends.

## Procedure

1. **Set the privacy and consent frame.** Ask who the older adult is (relationship only), whether they can take part in decisions, and who else is in the loop: siblings, other relatives, paid carers. State plainly that the notes stay in a local folder on the user's device, nothing is uploaded or sent, and the family summary is the one document designed to be shared by the user.
   **Done when:** the user has confirmed who is in the loop and that a local folder is the right place for the details.

2. **Open or create the four files.** In `elder-care/`: `appointments.md`, `medications.md`, `call-checklist.md`, `family-summary.md`. Read anything that already exists before writing.
   **Done when:** all four files exist or are confirmed current, and you have read each one.

3. **Log every appointment in one table** in `appointments.md`: date, time, clinician or service, who attended, reason, what was said in plain words, outcome, next step, owner, and due date. Add rows; never delete history. If a detail is unknown, write "not recorded" rather than guessing.
   **Done when:** the latest appointment has a row with an outcome and a next step with an owner, and earlier rows are unchanged.

4. **Build the medication schedule from the labels, not from memory.** In `medications.md`: medicine, dose as printed, times, with or without food, prescriber, start date, refill due, and a "confirmed with pharmacist on" column. Do not calculate doses, do not advise starting, stopping, or changing anything. Prepare a short script for the pharmacy's phone line: read the whole list back, ask about interactions, timing, missed doses, and refills, and write down the answers. Record the confirmation date and what the pharmacist said. If the call has not happened, leave it marked "not yet confirmed".
   **Done when:** every medicine is either confirmed with a pharmacist (with a date) or explicitly marked unconfirmed, and no dose advice came from the assistant.

5. **Fill the before-the-call checklist** in `call-checklist.md` before any conversation with care staff: one short paragraph on current status, the three questions that matter most, changes to report (falls, appetite, mood, sleep, new symptoms, hospital visits), decisions needed, who will follow up, and an opening line. Leave space to write the answers.
   **Done when:** the checklist has a status paragraph, three questions, and at least one change to report, and the user could make the call from that page alone.

6. **Log the call afterwards.** Record the date, who spoke, what was agreed, and the next step with an owner and a due date. Add it under the matching appointment or as a dated call note in `appointments.md`, then update the family summary.
   **Done when:** the call has a dated outcome, the next step has an owner and date, and the family summary reflects the change.

7. **Write the family summary in plain language, one page.** Sections: what is happening, the current plan, upcoming dates, who is doing what, what we are waiting on, and open questions for the care team. Use only what a clinician or the care staff actually said. Write "the team has not said" when something is unknown. No speculation, no diagnosis beyond a stated one, no financial details, no ID or account numbers, no blame, no private contact details. Ask before including anything the older adult might not want shared.
   **Done when:** a relative with no background can read it and know the facts, and nothing in it is a guess.

8. **Hand off, do not send.** Give the user the family summary as text they can copy or a file they can share. State in one line that the assistant has sent nothing and will send nothing; sharing is the user's decision. If document tools are available and the user asks, also produce a PDF of the one-page summary.
   **Done when:** the user has the summary and has been told plainly that no message or upload happened.

9. **Keep it current.** At the end of each session, update the family summary's "last updated" date and list what is overdue: refills, follow-ups, unanswered questions, appointments without an outcome.
   **Done when:** the last-updated date is today and every overdue item is named with an owner.

## Gotchas

- Never advise starting, stopping, or changing a medicine. Never call a symptom "just aging".
- For urgent symptoms, tell the user to contact emergency services now. Do not wait for a care call and do not try to assess severity.
- Quote care staff rather than paraphrasing into false certainty. "They said she seemed brighter" is not "she is improving".
- One source of truth. If a sibling keeps separate notes, merge them into these four files rather than starting a fifth list.
- Consent and decision-making capacity are not for the assistant to decide. Ask what the clinician has said and record it.
- Keep the family summary free of addresses, account numbers, and ID numbers. It is the document most likely to be forwarded.
- Never paste health details into a web form, search query, or third-party service. The files stay local; the assistant sends nothing.
- Do not put the older adult's private worries in the family summary unless they agree.
- If the user is one of several siblings, make ownership explicit; "the family will sort it" is not an owner.

## Output

Files, relative to the user's working folder:

- `elder-care/appointments.md` — one table of appointments and calls, with outcomes and next steps.
- `elder-care/medications.md` — medication schedule with pharmacist confirmation dates.
- `elder-care/call-checklist.md` — the next care-call preparation page.
- `elder-care/family-summary.md` — one plain-language page for the family, with a last-updated date.
- Optional `family-summary.pdf` if document tools exist and the user asks.

In chat:

- The latest appointment row and its next step.
- Medication confirmation status, naming anything still unconfirmed.
- The three questions for the next call.
- The family summary text inline, ready to copy.
- Overdue items with owners.
- One line stating that nothing was sent anywhere.
- No medical judgment, no diagnosis, and no claim that a care decision has been made.
