---
name: explain-this-document
description: Explain a document the user received — bill, insurance letter, lease, contract, official-looking notice — in plain language: what it says, what they must do and by when, what happens if they ignore it, a glossary of the five terms most likely to confuse them, and clauses worth checking. Use when someone says "what does this letter mean", "explain this contract", "explain this bill or notice", or "is this saying what I think".
---

# Explain this document

The document is the only source. What it says gets quoted, what it does not say is marked
`not stated in the document`, and the reader is left with what to do, by when, and what happens if they
don't. Anything with serious consequences is sent to a professional, and the same boundary line appears
every time so the user learns to expect it.

## When to use

- "What does this letter mean? It looks official."
- "Explain this contract / lease / insurance letter / notice before I deal with it."
- "Is this saying what I think it's saying?" — the user has a reading and wants it confirmed or corrected.
- "Am I in trouble?" / "Do I have to pay this?" / "Is this a final warning or just a reminder?"
- "What's the deadline in here?" — the user is not sure the document has one.
- A document arrived that they don't recognise and they need to know if it's urgent before they do anything else.
- They are about to sign, ignore, or pay something and want the consequences spelled out first.

## When not to use

- **The user wrote the document** and wants it improved, shortened or made more professional. That is editing, not explaining.
- **They want a reply written** — a complaint, a cancellation, a refusal. Go to `complaint-escalation` or `bill-triage`.
- **They want the form filled in** — go to `paperwork-forms`.
- **They only want a translation** into another language, with no explanation. That is translation, and an uncertified one at that; say so.
- **Summarising the user's own notes, meeting minutes or research.** Nothing was sent to them and there is no action or deadline to extract.
- **Calculating what they owe** from a tax bill, a settlement or a final account. Arithmetic on official figures is accounting or tax work, not explanation.
- **Deciding for them** — "should I sign, just say yes or no". This skill lays out the choice and the consequences; the decision is theirs.

## Procedure

1. **Read the whole document before saying anything.** Identify the document type, the sender, the date printed on it, and any reference or account number. If it is images or a scan, read every page; if a page is unreadable, cropped or missing, name it.

   **Done when:** you can state the document type, sender, printed date and reference in one line, and you have listed any page you could not read.

2. **Find the ask.** Extract the single thing the recipient is required to do — or establish that nothing is required. Quote the sentence that says it, so the user can see it themselves.

   **Done when:** the required action is stated as an action, or as the explicit words "nothing — this is for information only", with the quoted source line.

3. **Find every date that matters.** Put them in order and say what each one is for. Separate the printed date from a deadline, and a deadline from the date something takes effect — they are rarely the same and are often confused.

   **Done when:** a dated timeline exists with the next relevant date marked, or the file states plainly that no date appears in the document.

4. **Find the consequences.** What happens if it is ignored — a charge, a cancellation, a lapse, a late fee, an escalation, a default. If the document does not say, write "not stated in the document" rather than inferring a penalty.

   **Done when:** each consequence either quotes the document or is marked "not stated in the document".

5. **Write the plain summary — 150 words maximum.** What it is, what they must do, by when, what happens if they don't. Second person, present tense, no hedging, no jargon beyond what the glossary covers.

   **Done when:** the summary is 150 words or fewer, contains all four parts, and uses no term that is not defined in the glossary.

6. **Build the glossary of five terms.** Choose the five terms most likely to change the reader's understanding — the ones that decide whether they act, not the most obscure ones. For each: the term as it appears, what it means here, and why it matters in this document.

   **Done when:** exactly five terms, each quoted from the document, each with a one-line plain meaning and a one-line "why it matters here".

7. **List what is worth checking.** Odd, one-sided, unusual or auto-renewing clauses; anything that limits a right, adds a fee, extends a term, or binds them beyond what they expected; anything that appears not to apply to their situation. Quote or cite the clause, say why it deserves a look, and phrase it as a question to put to the sender or a professional — not as a verdict.

   **Done when:** every item cites the clause or section, says why it is worth a look, and is phrased as a check rather than a conclusion.

8. **State the boundary and hand over.** The deliverable and the chat reply both carry this line, word for word:

   > This is an explanation, not legal advice. Anything with serious consequences should be read by a professional before you act on it.

   Then name the kind of professional that fits this document type — a lawyer, a tenant advice service, an insurance adviser, an accountant, a consumer advice service — and say which parts of this document are the ones they should look at.

   **Done when:** the disclaimer appears verbatim in both the file and the reply, and the reply names the professional type appropriate to this document.

## Gotchas

- Quote, don't soften. An explanation that makes a clause sound friendlier than it is does more damage than no explanation.
- "Not stated" is a real answer and often the most useful one. Guessing a penalty makes people panic or relax at the wrong moment.
- The date on the letter is usually the print date, not the deadline. Hunt for "by", "before", "within", "no later than".
- Auto-renewal and notice periods are the most common expensive surprise. Check them even when the user didn't ask.
- A document can require nothing at all. Say so plainly instead of manufacturing an action to look useful.
- Where pages are missing or the copy is cut off, the explanation is conditional. Say which page you could not see and what would change if it said something different.
- Documents from another country, or in another language, carry different assumptions. Explain but flag that the local meaning may differ, and that a translation you produce is not certified.
- Do not repeat, quote or summarise personal identifiers (account numbers, full addresses, identity numbers) beyond what the user needs to recognise their own document.
- Serious matters — a court date, an eviction, a benefits appeal deadline, a criminal matter, a medical decision — get the explanation and an immediate, unambiguous instruction to speak to a professional today, not next week.

## Output

- **`document-explained.md`** with five short sections in this order: Summary (≤150 words) · What you must do, and by when · Glossary (five terms) · Worth checking · The boundary line above.
- **In chat:** four lines — what the document is, what they must do, the next date that matters, and what happens if they ignore it — followed by the disclaimer line and the file name.
