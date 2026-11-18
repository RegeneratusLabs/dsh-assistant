---
name: claim-check
description: Check whether a specific claim, rumor or forwarded story someone else made is true before the user repeats or shares it — restate the claim precisely, trace it to its origin, find at least two independent dated sources, grade it solid, contested, unproven or false with the reason, and write a short verdict the user can quote — while medical and financial claims point to the official source and never become personal advice. Use when the user brings a specific claim to check: "is it true that", "this sounds off", "check this", "did X really happen". Not for open research questions ("what do studies say") or comparing products — answer those directly or with big-purchase.
---

# Claim check

> **Health and money:** when a claim touches medical treatment, money, law or safety, the verdict names the official or professional body and stops there. It is never personal advice, even if the user asks "so should I stop taking it?".

## When to use

- "Is it true that…" / "Is it real that…"
- "This sounds off" — a forwarded message, screenshot, voice note or link they are unsure about.
- "Did X really happen?" — an event, a recall, a law change, a resignation, a record.
- "Can you fact-check this?" before they share, quote or act on it.
- A statistic or quote they plan to repeat in a meeting, an essay or an argument.
- A health, money or safety claim that is worrying them.
- A story about a company, product recall, local event or public figure they half-remember.
- A claim that has resurfaced and they want to know whether it is still current.

## When not to use

- **Open research** — "what do studies say about sleep and memory", "how does X work". They know they are asking a question; there is no specific claim to grade.
- **A product claim inside a purchase comparison** — "is this laptop's battery claim accurate" while choosing between two. `big-purchase` checks it inline as part of the comparison.
- **A prediction or opinion** — "will prices fall next year", "is this a good government". Not a fact claim; say so and offer a different frame.
- **Something only the user can know** — "did my neighbour really complain". No public record exists; say the check cannot be done.
- **A joke, satire, or clearly labelled opinion** — checking it kills the joke and answers nothing.
- **Deciding what to do about the claim** — "so should I stop taking this". A verdict is not advice; point to the professional.
- **A private dispute** — "did my landlord break the law". That needs a lawyer and their documents, not a public-source check.
- **Writing the correction or the complaint** — a different job; this skill supplies the facts they will use.

## Procedure

1. **Restate the claim in one sentence.** Who, what, when, where, and the number if there is one. Strip the fear and the framing. If two claims are tangled, split them and ask which one matters.

   **Done when:** one sentence with at least one checkable element — a name, date, number, place or event — is on the table, and the user agrees it is the claim.

2. **Ask for the original, once.** If they have the message, link or screenshot, ask for it, and ask where and when it came from. One question, not an interview; proceed without it if they don't have it.

   **Done when:** you have the artifact or the user has said they don't have it, and you have written down what evidence would settle the claim.

3. **Trace it to the origin.** Search the exact distinctive wording, names and numbers. Work backwards from aggregators and screenshots to the earliest version. Check whether it is a reword of an older, already-checked claim, and whether a fact-check already exists.

   **Done when:** you can name the earliest source found with a URL and a date, or state that a documented search found no origin.

4. **Find independent sources.** At least two that do not derive from each other: the primary record (official notice, study, court filing, company statement, public register) and independent reporting or an expert who is not quoting the same press release. Say what each one actually says, not what the headline says.

   **Done when:** two independent sources are listed with dates and a one-line summary each, or you have recorded that only one exists and why the others could not be reached.

5. **Read past the headline.** For a study: sample size, whether it was in humans, peer review, who funded it, whether it has been retracted. For a statistic: the denominator, the period, the base rate. For a quote: full context and whether it was translated. For a law or recall: the official notice and the jurisdiction.

   **Done when:** for every key number or quote you have written what the source says and the caveat the headline dropped, or marked that the source could not be read.

6. **Date everything and check the clock.** A true claim can be stale; a false one can be resurrected. Note each source's date and whether anything newer supersedes it.

   **Done when:** every source carries a date, and you have stated whether the claim is current or out of date.

7. **Grade it, with the reason.** Four grades only: **solid** (independent sources agree and the primary record supports it), **contested** (credible sources disagree), **unproven** (no adequate evidence either way — not the same as false), **false** (a source directly contradicts the core claim). Name the decisive source in the reason.

   **Done when:** the grade is one of the four, the reason names the source that decided it, and the evidence listed earlier supports that grade.

8. **Apply the health-and-money guardrail.** If the claim touches medical treatment, a financial product, the law or safety: quote what the official body or a named professional body says, name it and date it, and add that this is not personal advice and the user should speak to a doctor, qualified adviser or lawyer about their own situation. Do not soften it into "some experts say".

   **Done when:** the verdict names the official source and contains an explicit "not personal advice" line whenever the claim touches health, money, law or safety.

9. **Write the quotable verdict.** One paragraph, 120 words or fewer, plain language: the grade first, then what is true, what is not, the key source and its date. It must read safely out of context.

   **Done when:** the paragraph is in chat, under 120 words, and contains no number that is not in the evidence list.

10. **Offer the file, not the lecture.** Save only if they will reuse it or asked; otherwise the paragraph is the deliverable. Say what new evidence would change the grade.

    **Done when:** the user has the file path or has declined, and knows what would change the verdict.

## Gotchas

- Absence of evidence is "unproven", not "false". Saying false without a contradicting source is the most common way this skill fails.
- Two articles quoting one press release are one source. Count origins, not URLs.
- Screenshots are trivial to fake and easy to crop. Find the original post before judging the screenshot.
- Satire sites and AI-generated "news" pages mimic real outlets. Check the domain, the about page, and whether the byline exists elsewhere.
- A real quote can be true and still mislead. Grade the claim as stated, then note the context it dropped.
- Don't repeat the alarming framing in your restatement. Neutral wording is half the correction.
- Paywalls and removed pages are a real limit: say which sources you could not read and grade with that caveat.
- A retracted study keeps circulating. Search the study title plus "retraction" before relying on it.
- "Some say" and "experts agree" are not sources. Name the person and the body, or drop the claim.
- For health, money, law or safety, the answer is never a verdict on what the user should do — even when they ask directly.

## Output

- **In chat:** the claim in one line; a short evidence list (source, date, what it actually says); the grade with its reason; and a one-paragraph verdict under 120 words that they can paste.
- **`claim-check-<slug>.md`** (Markdown) only when asked or when they will reuse it — the same content with links, plus a "what would change this grade" line.
- **No personal medical, legal or financial advice.** Where the claim touches those, the reply names the professional or official source to consult.
