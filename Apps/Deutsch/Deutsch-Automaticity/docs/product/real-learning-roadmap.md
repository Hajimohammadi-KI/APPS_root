# Real-learning roadmap

## Why this exists

`docs/product/beta-scope.md` defers teacher dashboards, LLM-based evaluation,
and automatic pronunciation scoring. `docs/ROADMAP-V10.08.2026.md` sequences
Neon persistence and a full AI-evaluation provider ahead of any check on
whether the existing loop actually raises the learner's German. This document
is the missing piece: how to prove the app produces automaticity, not just
software, before adding more software.

## What already works — do not rebuild this

- `docs/AUTOMATICITY-METHODOLOGY.md`: retrieve → controlled use → free write →
  speak/transfer → delayed review at 1/3/7/14/30 days. This sequence matches
  established skill-acquisition and spaced-retrieval research.
- `packages/domain/src/mastery.ts`: `automatic` status already requires
  `latencyMs <= AUTOMATICITY_LATENCY_THRESHOLD_MS` (8000ms) **and** two passed
  delayed reviews. This is a real timed-retrieval gate, not a participation
  badge.
- `apps/api/src/evaluation/evaluation.service.ts`: LanguageTool is already
  wired into the conversation-studio evaluate route, giving an
  evaluator-independent-of-the-app-itself signal for grammar errors.

The engine is more sound than it looks from the outside. The gap is not "the
pedagogy is fake" — it is "nothing yet confirms the pedagogy is working for
the one real learner, and the roadmap keeps growing before that check runs."

## The actual gap

1. No periodic, external checkpoint. Every signal in
   `features/progress/progress-evidence.tsx` (`automaticTopics`,
   `unstableTopics`, `dueReviews`) is internal to the app's own gates. Nothing
   samples "can I actually do this today" against an outside yardstick.
2. No adherence signal. Automaticity comes from repetition frequency over
   weeks. The dashboard shows mastery counts, not practice-day streaks — the
   one number that predicts whether any of this works.
3. Pronunciation and fluency are unmeasured (deferred by design). The speaking
   gate scores the transcript, not the sound.
4. Scope keeps growing (Neon sync, a full AI-evaluation provider, a Windows
   installer, and up to eight sibling apps queued in `Apps-For-Integeration`)
   ahead of any evidence the current loop, used daily, moves the needle.

## Phase 0 — Freeze and baseline (this week)

- Freeze: no new sibling-app integration, no Neon migration, no new
  installer work, no new AI-provider abstraction until Phase 2's exit
  criteria are met.
- Baseline, saved outside the app (dated files in a folder, not app state):
  one unprepared ~3-minute speaking recording and one unprepared short
  written paragraph, no dictionary, no prep.
- Pick a fixed 10–15 item CEFR can-do checklist at your target level (a
  public Goethe-Institut/Europarat self-assessment grid works) and mark what
  is true today.

## Phase 1 — Make adherence visible (1–2 weeks)

- Add one small dashboard tile next to `automaticTopics`/`dueReviews`:
  practice-day streak and days-since-last-`automatic`-item. Reuse the
  existing `progress-evidence.tsx` pattern; this is a metric addition, not a
  new feature surface.
- Log daily minutes and weekly practice days for 4 weeks. If this number is
  zero, nothing else below matters yet.

## Phase 2 — Close the external-validation loop (2–4 weeks)

- Every 2 weeks, repeat the exact same unprepared speaking + writing task
  from Phase 0. Run the writing (and the speaking transcript) through the
  already-wired LanguageTool evaluation endpoint for an objective error-count
  diff against baseline.
- Re-check the can-do checklist. Only tick an item when it is doable
  unprepared and under time pressure — the same standard the in-app 8-second
  latency gate already applies.
- Exit criteria to move on: one full 4-week cycle completed with saved
  before/after evidence.

## Phase 3 — Decide, with evidence

- Error count trending down and new can-do items ticked: the pedagogy works
  for you. Scope can reopen — Neon sync, installer polish, one sibling-app
  merge at a time — each still gated by "does this cost me practice time."
- No movement: the fix is frequency and task design (more retrieval reps,
  harder transfer contexts, a real conversation partner), not more software.
  Pause the software roadmap and redesign the daily loop instead of adding to
  it.

## Phase 4 — Only after Phase 3 shows gains: pronunciation and fluency

Add real pronunciation feedback next, since it is the one dimension the
current LanguageTool-based text evaluation cannot see, and it was correctly
deferred until the rest of the loop is proven.

## Standing guardrail

Before any new feature: "does this get me more practice reps, or does it
just let me keep building?" If the honest answer is the second, defer it
until a Phase 3 review says otherwise.
