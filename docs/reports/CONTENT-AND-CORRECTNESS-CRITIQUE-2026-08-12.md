# Content and correctness critique — English & German — 2026-08-12

## The actual test

Both apps are named "Automaticity." The stated goal, in the user's own words: after daily practice through a level, a learner should be able to **speak and write correctly, without having to memorize** — genuine automatic production, not recall of a stored phrase. This document tests the apps against exactly that, not against whether the code builds or tests pass. It found a real mechanism-level contradiction of the goal, not just weak content.

---

## 1. The grading mechanism itself works against the goal

### English: exact-string-match rewards memorization directly

`apps/web/features/screens/automaticity-screen.tsx:296` grades most Grammar Lab exercises with:

```ts
practiceAnswerMatches(answer, exercises[index]?.expected ?? "")
```

`practiceAnswerMatches` (`lib/automaticity-analysis.ts`) is a normalized **exact string match** against one single stored answer. A learner who writes a grammatically correct sentence phrased differently than the stored string is marked wrong. A learner who has simply memorized and reproduced the stored string verbatim is marked correct, whether or not they understand it. This is the literal inverse of "correct without memorizing" — the mechanism rewards memorizing.

The one place real analysis exists — `analyzePresentPerfect()` — is hardcoded to a single grammar point (present perfect) and checks only two specific error types (subject-verb agreement on have/has, unfinished sentences). It is not a general correctness checker; it is a demo-scale special case.

### German: correctness verification is thin, and mastery advances without it anyway

`packages/domain/src/evaluation.ts` marks a report `verified: true` only when the online LanguageTool API actually responded (`languageTool.online`). Offline, correctness checking falls back to exactly **four** hardcoded regex fixes (`OFFLINE_CORRECTIONS`): `ich habe gegangen`, `mit der Mann`, `ich würde gegangen`, `mehr besser`. Everything else offline goes uncaught.

Separately, `targetEvidencePresent()` — which gates whether the required grammar structure was "used" — only checks that words *matching a shape* appear somewhere in the text (e.g. for Perfekt: an auxiliary verb and something ending in `-iert` or starting `ge-`, anywhere in the sentence). It does not check the grammar is actually correctly formed. `"Ich habe gegehen den Apfel"` (wrong participle, wrong word order) would still register as target evidence present.

The mastery-scoring thresholds themselves (`mastery.ts`) are genuinely well-designed in principle — five independent skill scores, a review count, a latency ceiling, exponential smoothing so one lucky attempt can't fast-track status. But the input feeding that good design is `targetHit`/`accuracyScore` from the evaluation above, and **nothing in `recordMasteryAttempt` checks `verified` before letting an attempt count toward mastery**. A learner practicing offline — a real, intended scenario for a local-first app — can advance toward "automatic" status without a single one of their sentences being genuinely confirmed correct.

**Being fixed now** (dispatched, in progress): German — gate mastery progression on `verified`; English — replace pure exact-match with structure-aware grading modeled on the existing `analyzePresentPerfect` pattern.

---

## 2. Content quality: strong hand-authored core, weak generated layer

Both apps split cleanly into two tiers, and the split matters:

**Hand-authored grammar explanations (both apps): genuinely good.** German's explanation files are drawn from real textbooks (sourcing declared in `explanations/schema.ts`: "Begegnungen A1", "Erkundungen B2") and are linguistically accurate through C2 — separable-verb position, N-Deklination, Genitiv, all correctly and appropriately scoped. English's `grammar-pedagogy.ts` and `cefr-supplement.ts` explanations are similarly sound (*"Have got usually describes possession or a present state, not a repeated action"* — accurate, well-hedged). This tier is not the problem.

**Auto-generated exercises and conversation content (both apps): templated, and in German's case, actually wrong.**

- German conversation topics (`packages/content/src/data/topics.json`) are mad-libs, not authored dialogue, and contain real grammar errors that will teach a learner incorrect German: *"Meiner Meinung nach hat soziale medien im alltag Vor- und Nachteile"* — subject-verb agreement error (plural *Medien* needs *haben*) and missing capitalization; *"zu soziale medien im alltag"* — wrong case after `zu` (needs dative: *zu sozialen Medien im Alltag*), the exact kind of English-influenced case error a German course should be preventing, not producing. The A1 template *"Ich möchte über sich vorstellen sprechen"* is ungrammatical. The same generator skeleton is reused from A1 through C2 with only vocabulary swapped in — so "C2 dialogue" is structurally identical to A1, just longer words, not genuinely nuanced register.

- English exercises show the same templating, with fabricated rather than grammatical errors: some "Correct the sentence" prompts don't contain an error to correct at all (`generated/grammar.ts:3080`: prompt labeled "Unclear pronoun reference," stored answer is the incomplete fragment *"This limitation..."*), and one entry leaks raw template syntax into what's shown to the learner (`generated/grammar.ts:2799`: *"Type another model sentence: vs What do you mean?"*). `curriculum.ts`'s `ensureSixExercises` pads every unit to exactly 6 exercises regardless of whether real content exists — this is almost certainly the source of the malformed entries. English's 72 conversation topics show the same pattern: every C1 "opinion" topic reuses one fixed sentence frame with only the topic noun changed — no topic-specific vocabulary or content.

**Being fixed now**: the specific quoted German template errors, and the `ensureSixExercises` root cause behind English's malformed entries.

## 3. Level calibration: two real mislabeling bugs, one per app

- German: `grammar-supplement.ts` teaches adjective-ending declension and basic relative clauses at **A2**; `explanations/b1.ts` reintroduces the identical points as fresh fundamentals at **B1** — two content sources disagree on when a topic is first taught, so a learner's actual level progression doesn't match either source's claim.
- English: phrasal-verb word order ("Turn it down" vs "Turn down it") is labeled **C1** in `cefr-supplement.ts:531` — that's standard B1/B2 material, not advanced. Separately, two C2 units link to resources explicitly path-labeled `/grammar-points/b2/...`.

**Being fixed now**: both mislabelings and the broken resource paths.

## Bottom line

The apps are not fake — the underlying practice loop (recall → automate aloud → transfer → delayed review) is real, the mastery-scoring design is thoughtful, and the hand-written grammar explanations are accurate. But two things stood between the current build and the stated goal: a grading mechanism that in English rewarded memorized exact phrasing over correct free production, and in German let progress advance without real verification — plus a generated content layer thin enough to contain actual grammar errors a learner would absorb as correct German. Both classes of problem are now being fixed at the source (mechanism + template), not patched by hand one exercise at a time, since the generated catalog is thousands of entries deep and hand-patching wouldn't prevent recurrence.
