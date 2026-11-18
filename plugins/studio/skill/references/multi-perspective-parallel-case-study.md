# Multi-perspective parallel experiment · Case Study

> huashu-md-html v2.0 launch film project · 2026-05-11
> A parallel director's-notes + HTML + keyframe experiment across six artists' perspectives

---

## Background

When the user asked for "a 30-second upgrade launch film for huashu-md-html v2.0", the main thread first produced a v5 baseline (Anthropic / Penguin Classics publishing-house taste). The user believed it could be better and gave a critical instruction:

> "Call different subagents and have each generate six completely different modes of expression and visual design. Try enabling different directors and artists. Then, when they're all done, judge and review them."

This was the first systematic "multi-perspective parallel director's notes" experiment, and it validated a reusable workflow.

---

## How the six perspectives were chosen

Don't pick six designers at random — they must be **visually very far apart** so they don't converge.

The final set: the v5 baseline plus six new perspectives (with the reasoning):

| Perspective | School | Aesthetic anchor | How it differs from the others |
|------|------|---------|----------------|
| **v5 baseline** | modern publishing house | Anthropic terracotta orange + Penguin Classics serifs + Vignelli grid | the safe "taste" choice |
| **v5a Wes Anderson** | filmic chapter aesthetic | The French Dispatch magazine feel + 1960 Olivetti industrial catalogue | symmetrical composition + chapter cards + decorative frames |
| **v5b Saul Bass** | 60s film title art | cut-paper + Trajan caps + flowing geometry | cut-paper silhouettes + big type + strong diagonals |
| **v5c Wong Kar-wai** | Hong Kong new wave | *In the Mood for Love* / *2046* letterboxing + Chinese serif | slow pacing + hazy glow + Chinese-first |
| **v5d Massimo Vignelli** | 1970 modernism | Knoll identity manual + NYC Subway map | strict grid + 3-color iron rule + refuses decoration |
| **v5e Kenya Hara** | minimal Japanese | MUJI posters + *White* | empty-space philosophy + no chrome + ma |
| **v5f Yayoi Kusama** | installation art | Infinity Mirror Rooms + Polka Dot Obsession | obsessive repetition + a single intense color + polka dots |

**Selection principles**:
1. **Three different geographic cultures** (Western film / Japanese design / Hong Kong Chinese)
2. **Three different eras** (1960s / 1970s / 2010s+)
3. **Three different media** (film / graphic design / installation art)
4. **Each has a visual signature that is the exact opposite of the generic SaaS aesthetic in the training corpus**

---

## Execution

### Step 1 · Write an independent brief for each perspective (~15 minutes)

Each brief carries the same 8 fixed fields:

```
1. Project background (identical for all)
2. Required reading (the same v5-director-notes.md as the methodology template)
3. What you have to do (a 4-item deliverable list)
4. That artist's DNA (6 core fields):
   - Palette (specific HEX)
   - Type (specific names + fallbacks)
   - Visual language (the core few)
   - Signature elements (identifiable signatures)
   - Rhythm (what separates it from the other perspectives)
   - A reinforced anti-AI-slop list (the forbidden zone inside that style)
5. 30-second structure reference (4-6 sketched shots)
6. Destination cards design requirements (keep them real and readable)
7. Hard constraints (30s / 1920×1080 / file:// / Google Fonts CDN)
8. Output verification checklist + completion report format
```

**Key**: every brief must stress "**do not repeat v5's aesthetic**" — otherwise the subagent gets pulled toward the v5 director notes and converges.

### Step 2 · Launch 6 subagents in parallel (6 Agent tool calls in the same message)

```js
Agent({ subagent_type: "general-purpose", run_in_background: true, name: "v5a-anderson", ... })
Agent({ subagent_type: "general-purpose", run_in_background: true, name: "v5b-bass", ... })
// ... all 6
```

Run them in the background; expect 30-60 minutes.

### Step 3 · Idle work while waiting

Don't poll agent status. Subagents fire a task-notification when they finish. While waiting, do:

- Fix bugs in the main thread's v5 baseline
- Write the review framework (the scoring dimensions / Q&A each version gets)
- Distill the methodology into the skill (this is exactly where this case study came from)
- Draft the skeleton of the final summary document

### Step 4 · Handling failures (~16% failure rate, acceptable)

Field observation: about 1 of the 6 subagents fails on network or token limits (Bass hit a socket error in the first round). Handling:

1. When the completion notification arrives, **check that agent's output folder immediately**
2. Key deliverable missing → restart that agent (same brief; you can annotate "failed last time, please rerun")
3. Partial completion (e.g. html but no screenshots) → the main thread fills in the Playwright screenshots; don't restart the agent

### Step 5 · Systematic review once all 6 versions land

Review framework (5 dimensions + 3 top-level questions + use-case assignment):

```
5-dimension scoring (1-10 each):
- Distinctiveness — visual differentiation
- Coherence — aesthetic consistency
- Anti-slop — how well AI slop is avoided
- Story arc — pacing and story arc
- Pause-and-look — density of detail

3 top-level questions:
- Q1 Would someone screenshot and share it? (can it make someone stop scrolling on social platforms)
- Q2 Does one sentence stick? (does it leave a thesis-level memory)
- Q3 Does it cross eras? (does it still not look cheap five years from now)

Use-case assignment (by platform and audience):
- WeChat official account / X / Bilibili / WeChat Moments / Dribbble / client presentation / private channel / ...
```

See REVIEW.md in the same directory as `assets/director-notes-samples/launch-film-30s-sample.md` (author's local file, not distributed with the repo).

---

## Experiment output (facts)

### Document volume

- v5 baseline director's notes: 11500 characters
- Director's notes for the 6 perspectives: 4000-12000 characters each
- Total document volume: about 55000-70000 characters
- All 5 major sections present: 6/6 versions

### HTML implementation

- A standalone animation.html per version, 30 seconds, 1920×1080
- File size 28-74KB
- All open over file:// (no server needed)

### Keyframes

- 10-18 PNGs per version, covering the full 30-second story arc
- 80+ screenshots total
- Average PNG size: 100-200KB

### Duration

- 6 subagents in parallel: about 12-15 minutes (per duration_ms)
- The main thread's parallel idle work (fixing v5 + writing the methodology): finished in the same window
- End to end, "from launching the 6 perspectives to all deliverables in place": about 60 minutes

---

## Key insights (for the studio's future users)

### Insight 1 · The "write ten-thousand-character director's notes first" methodology is **fully reproducible**

All 6 subagents produced a complete 4000-12000-character spec following the 5-section structure, and all reached marketing-ready quality in the HTML implementation. That proves the methodology doesn't depend on any single executor's talent — **as long as the brief is clear, multiple independent executors produce consistently high-quality results**.

### Insight 2 · A "perspective" must be pinned to "work + year"

Every brief lists specific works to hold a conversation with:
- Anderson → *The French Dispatch* (2021) + *Moonrise Kingdom* (2012) + Penguin Classics dust jackets + 1960s Olivetti catalogues
- WKW → *In the Mood for Love* (2000) + *2046* (2004)
- Vignelli → 1972 NYC Subway map + Knoll identity manual + *The Vignelli Canon*
- Hara → MUJI brand 1995-2023 + *White* + Junya Ishigami transparency
- Kusama → Infinity Mirrored Rooms (2013-2023) + Polka Dot Obsession installation

**Result in practice**: every subagent captured that work's core visual DNA, not the school's "average".

### Insight 3 · The "style-reinforced version" of anti-AI-slop is what matters

Generic anti-slop (purple gradients / emoji / SVG people) applies to every version. But **each style also needs its own anti-slop list**:

- Bass: no Helvetica (too clean; Bass is coarse)
- Vignelli: no rounded corners (every corner 90°)
- Hara: no gradients at all + no sans display
- Kusama: no modern SaaS look
- Anderson: no cyber palette
- WKW: no Inter (WKW uses serif)

With these added, all 6 versions had very high stylistic purity, and not one converged on another.

### Insight 4 · The real value of multiple perspectives is not "picking a winner"

The initial idea was an A/B test to pick the best version. In review it turned out that **all 6 versions have a clear use case**:
- v5 baseline → product page / WeRead (high information density)
- Anderson → WeChat long-form article header (strong magazine-flip feel)
- WKW → Bilibili / Chinese-culture audiences (nostalgic warmth)
- Vignelli → design circles / Dribbble (every frame is a printed poster)
- Hara → client presentations / static screenshots (minimalist philosophy)
- Kusama → X short video / viral spread (visual impact)

**Conclusion**: marketing isn't single-shot, it's platform-specific multiplex. The real value of 6 parallel perspectives is **giving one project 6 differentiated weapons**, not making 5 versions unpresentable.

### Insight 5 · A ~16% subagent failure rate is acceptable

1 of 6 failed (Bass, socket error in the first round). The cost of handling it: a restart + a 5-minute simplified brief, then another 12-15 minute wait. **Compared with running 6 versions sequentially on 1 agent (90+ minutes)** — parallel plus retry is clearly more economical.

### Insight 6 · The main thread must do substantive idle work while it waits

Subagents take 12-15 minutes. The main thread must never idle during that time:

- **Fix main-version bugs** (the ones the user has already reported)
- **Write the review framework** (to fill in at review time)
- **Distill the methodology into the skill** (like this case study)
- **Prepare the final summary** (so everything is obvious when the user comes back)

This is the main thread's job in a parallel multi-agent workflow — not a PM waiting for results, but an orchestrator advancing in step.

---

## When to turn on "multi-perspective parallel"

| Scenario | Enable? | Why |
|------|---------|------|
| The user explicitly says "I want to see different directions" / "make a few more versions" | ✅ immediately | direct request |
| The first version lands and the user is unhappy but can't say what they want | ✅ enable | A/B selection beats "I'll guess what you want" |
| The project is heading for multi-platform distribution (X / WeChat official account / Bilibili / WeChat Moments) | ✅ enable | one version per platform |
| The client hasn't settled on a style but has budget (time + tokens) | ✅ enable | endless revisions = 5× the cost |
| The user already gave a clear style reference and wants only 1 version | ❌ don't | waste |
| The task is a simple motion graphic / icon animation | ❌ don't | over-engineering |
| Time is tight, < 30 minutes | ❌ don't | the subagents won't finish |

---

## The full methodology flow

```
User brief (with quality expectations)
       ↓
[main thread] write the v5 baseline director's notes (5 sections, ten-thousand-character scale)
       ↓
[main thread] implement the v5 HTML + capture keyframes (marketing baseline)
       ↓
[decision point] turn on multi-perspective?
       ↓ YES
[main thread] pick 6 differentiated perspectives + write 6 independent briefs (8 fields each)
       ↓
[6 subagents in parallel]
   ├── v5a brief → director-notes + html + keyframes + README
   ├── v5b brief → ...
   ├── v5c brief → ...
   ├── v5d brief → ...
   ├── v5e brief → ...
   └── v5f brief → ...
       ↓
[main thread, concurrently] fix v5 bugs · write review framework · distill the methodology
       ↓
[all 6 notifications in]
       ↓
[main thread] failure detection + retry / fill in screenshots
       ↓
[main thread] 5-dimension scoring + 3 top-level questions + use-case assignment
       ↓
[main thread] write the final REVIEW.md
       ↓
[deliver] 6 complete versions + review + platform distribution recommendation
```

---

## Related documents

- Full methodology: `references/launch-film-director-notes.md`
- Single-perspective sample: `assets/director-notes-samples/launch-film-30s-sample.md` (v5 baseline)
- Where the real project lives: the author's local demos directory (the complete set for 6 + 1 perspectives, not distributed with the repo)
- Review: the author's local REVIEW.md (not distributed with the repo)

---

*Last updated: 2026-05-11*
*Real case study: huashu-md-html v2.0 launch film 6-perspective parallel experiment*
