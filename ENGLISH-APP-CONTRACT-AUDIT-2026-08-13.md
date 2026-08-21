# English Automaticity — Contract Compliance Audit

**Audited against:** `AUTOMATICITY_PRODUCT_CONTRACT.md` v1.0.0
**Audit date:** 2026-08-13
**Method:** Direct code inspection with file:line evidence — not a restatement of the contract, an independent check of what the code actually does.
**Scope:** `Apps/English/English-07082026` only, per the contract's own stated scope.

**Update, same day:** F1–F6 below were implemented following this audit (all six, per explicit instruction to proceed with all of them). Typecheck, full production build, and the existing test suite (47 tests, `bun run test`) all pass. Verified present in the actual compiled installer output before shipping — not just in source. See the "Implemented" note under each finding.

---

## Executive summary

The contract's own draft roadmap (in the Persian summary) already correctly identified several problems from the outside ("Missions record verified:false", "no real transfer path exists", "self-rating can raise Review score"). This audit confirms all three **with code evidence**, and finds the actual root cause is narrower and more fixable than the draft's 6-phase "Unified Evidence Engine" framing suggests:

**The assessment layer already does the right thing. It just isn't connected to the mastery layer.**

`lib/assessment.ts`'s `evaluateResponse()` already computes `masteryEligible = correction.online && pass` — a real, contract-compliant, provider-verified signal (Section 5.3 and 7 compliant: doesn't fabricate scores offline, explicitly distinguishes "the service responded" from "the answer is correct"). It is wired into exactly **one** of the app's four attempt-recording call sites (Error Workshop repair). The other three (Mission recognition, Mission writing, Mission speaking) hardcode `verified: false` regardless of what the same function returns.

The practical consequence, confirmed by tracing `recalculateMastery()`: **no topic can structurally ever reach `"stable"` or `"automatic"` status**, because those thresholds require `writingScore`/`speakingScore`/`transferScore` above 70–80, and `scoreFor()` only counts `verified === true` attempts — a set that is permanently empty for three of the five score components. This is not a "not yet verified" state; it is a dead end. The feature does not silently overclaim (good, and contract-compliant), but it also cannot ever deliver its core promise through normal daily use.

---

## Confirmed findings, with evidence

### F1 — Mission attempts (recognition, writing, speaking) never verify, ever
**Severity: Critical — this alone blocks Release 1's mastery-logic gate.**

- `features/screens/automaticity-screen.tsx:316` (recognition), `:468` (writing), `:580` (speaking) — all three `recordAttempt()` calls hardcode `verified: false`.
- `features/store/app-store.tsx:643` — `scoreFor()` filters `attempt.verified === true` before averaging.
- Full-codebase search: `verified: true` / `verified:true` appears **nowhere** in `features/`.
- One conditional exception exists: `features/screens/errors-screen.tsx:274` sets `verified: result.masteryEligible`, sourced from `lib/assessment.ts:601`'s `masteryEligible = correction.online && pass`.

**Why this matters more than it looks:** the fix is not "build verification." Verification already exists and is already contract-shaped (Section 7's `provider_verified` tier). It needs to be *called* from the other three sites using the same pattern already proven at `errors-screen.tsx:274`.

**Implemented:** `AutomaticityAnalysis` now carries `masteryEligible` (threaded from `evaluateResponse()`'s existing `masteryEligible` field), and all three sites (`automaticity-screen.tsx`, recognition/writing/speaking `recordAttempt` calls) set `verified: analysis.masteryEligible` instead of hardcoding `false`.

### F2 — No real Transfer flow exists (contract §8.3, §3.3)
**Severity: Critical — blocks the `"Automatic for this skill"` claim entirely, by the contract's own definition.**

- Full-codebase search for `mode: "transfer"` as a value being *assigned* to a new attempt: zero matches anywhere in `apps/web`.
- `AttemptMode`/`ReviewItem.mode` types include `"transfer"` as a possible value, and `recalculateMastery()` reads `scoreFor("transfer")` — but nothing ever writes it.
- Contract §3.3 requires `Transfer to a new prompt or situation` as one of five conditions for the `Automatic for this skill` claim. Structurally impossible today: `transferScore` is permanently `null`/0.

**Implemented:** a distinct Transfer sub-exercise inside the existing Speaking card (not a new top-level Mission step, to avoid rippling into the static daily-plan page's "7 activities" numbering, and per the contract's own instruction not to redesign the visual interface). Uses a genuinely different communicative framing than the writing step's "connected to your life" prompt (picked deterministically per topic from a small set of new-situation templates, since `GrammarUnit.transferTest` turned out to be a generic checklist string, not a real task prompt — real per-unit transfer content remains separately scoped under §11). No reference/model is shown before submission. Records with `mode: "transfer"` and `verified: analysis.masteryEligible`, so `recalculateMastery`'s `transferScore` now reflects real evidence.

### F3 — Speaking "fluency" is a text/time ratio, not an audio measurement (contract §9.1, §9.2)
**Severity: High — a direct contract violation, not just a gap.**

- `automaticity-screen.tsx:574-577`:
  ```
  fluencyScore: Math.min(100, Math.round((analysis.wordCount / Math.max(1, seconds) / 2) * 100))
  ```
  `analysis.wordCount` comes from the *transcribed text* (browser Web Speech API output); `seconds` is total wall-clock recording time, **including pauses** — the opposite of §9.2's "active speech duration excluding non-speech pauses."
- `lib/assessment.ts:530` — `evaluateResponse()`'s network call sends `{ text, language }` only. No audio blob is ever transmitted for assessment.
- Audio *is* recorded and saved locally (`putAudio()` at `automaticity-screen.tsx:587`) — so the raw artifact exists — but it is archived for playback only, never analyzed. No pronunciation, prosody, pause, or latency measurement exists anywhere in the codebase (confirmed by grep for these terms across `lib/` and `features/`).
- This is exactly what §9.1 prohibits: *"The application must not infer pronunciation or prosody from text alone."*

**Implemented, partially — see note.** New `lib/audio-fluency.ts` decodes the actual recorded audio via the Web Audio API and measures amplitude over 50ms windows to separate active speech from silence, giving a real `activeSpeechSeconds` (excluding pauses ≥300ms) instead of the old text/wall-clock-time ratio. `fluencyScore` is now `wordCount / activeSpeechSeconds` scored against a target rate, and falls back to `0` ("not assessed," matching this codebase's existing convention for non-speaking modes) when no audio is available, rather than presenting a text-derived guess as measured. **This is honest amplitude-based pause/pace detection, not pronunciation or prosody analysis** — that remains a genuinely harder problem needing a specialized provider, and is not claimed as solved here.

### F4 — Review self-rating can independently advance scheduling (contract §8.2, item 1)
**Severity: Critical — and this is code I wrote earlier tonight, in this same session.**

- `features/components/due-reviews.tsx` (added tonight, before this contract was shared): the "I got it right" / "I need more practice" buttons call `completeReview(id, wasCorrect)` directly from a self-rated boolean, with no evaluator in between.
- `features/store/app-store.tsx`'s `completeReview` (also added tonight) advances `successStreak`, `stabilityScore`, and `intervalDays` purely from that self-rated flag, and retires an item to `status: "done"` (removing it from the active review queue entirely) after 5 self-rated correct streaks.
- This is a textbook match for the contract's own example: *"Pressing `I got it right` or any equivalent self-rating control"* must not independently increase mastery/automaticity/verification.
- **Disclosure:** I built this earlier in this same conversation, before you shared this contract. It should not have used raw self-rating as the scheduling signal. See the roadmap below for how I'd fix it — it needs the learner's recalled text actually evaluated (the same `evaluateResponse()` pattern already used elsewhere), not just a self-judged button.

**Implemented:** `due-reviews.tsx` rewritten. The "I got it right" / "I need more practice" buttons are gone; the learner's recall attempt is now sent through `evaluateResponse()` and `completeReview(id, evaluation.masteryEligible)` is driven by that result, not a self-rated click. The evaluation's pass/fail and the reference text are both shown after checking, but only after — nothing is revealed before the learner submits their own attempt.

### F5 — Recognition-mode "verification" is a design gap, not a clear violation
**Severity: Medium — worth a decision, not an emergency.**

- `automaticity-screen.tsx:296-317` — recognition-step scoring (`evaluatePracticeAnswer`) is a deterministic exact-match check against a known-correct answer, computed locally (no network call, no self-rating). This doesn't cleanly fit the contract's `provider_verified`/`human_verified`/`self_reported` taxonomy — it's neither AI-graded nor learner-judged, just code comparing two strings.
- Recommendation: the contract should explicitly classify deterministic local pattern-matching (multiple-choice-equivalent correctness) as a legitimate, narrow verification tier, distinct from self-rating. Otherwise recognition-mode evidence can never count either, which seems stricter than the contract's own intent (§7's table implies *some* automated checks should count).

**Implemented:** went with this classification. `checkPractice()`'s `recordAttempt` now sets `verified: results.every(Boolean)` — `evaluatePracticeAnswer` is exact-match against a known-correct answer (with a narrow, explicitly-checked open-production allowance), not self-rated and not a network call, so it stands on its own footing distinct from both `provider_verified` and `self_reported`. `analyzePresentPerfect`'s separate local *heuristic* (regex-based, can misfire) was deliberately left at `masteryEligible: false` — it's a different case from an exact string match and shouldn't be granted the same trust.

### F6 — Evidence integrity fields from contract §5.1 don't exist
**Severity: High for the Speaking claim specifically; Medium generally.**

- `Attempt` (`app-store.tsx:76-89`) has one text field, `inputText`, not the required `rawTranscript` / `reviewedTranscript` split.
- No `audioId` field links an attempt to its saved audio record — the two are stored in entirely separate structures (`attempts[]` vs. a separate `audio-db` keyed store) with no cross-reference. You cannot currently trace "this speaking score came from this exact recording."
- Given F3, this is lower urgency than it would otherwise be — there's no real speaking assessment yet to make traceable — but it will need solving as part of any real fix to F3.

**Implemented:** `Attempt` gained optional `audioId` (linking to the matching `putAudio()` record) and `rawTranscript` (the speech-to-text output snapshotted the instant recording stops, via a ref set in `stopRecording()`, before the learner can edit the review textarea). `inputText` for a speaking attempt now represents the post-edit ("reviewed") version; editing it no longer has any way to touch `rawTranscript` or the saved audio. The `audioId` used for `recordAttempt` and the `id` passed to `putAudio()` are now the same generated value, so a speaking score is traceable to its exact source recording.

### F7 — What's already correct (don't rebuild this)
So the roadmap doesn't over-scope:

- **Provider-failure handling (§5.3) is already compliant.** `assessment.ts` never fabricates a score when the online service is unavailable; it explicitly marks `correction.online = false`, applies a documented penalty, and `masteryEligible` correctly requires the online path. `checkReasons.online` even explains the distinction to the learner in plain language.
- **No overclaiming language found in UI copy.** Grep across `features/` for CEFR-certification or automaticity-proof language found only one match, and it's a correctly-worded disclaimer (`effectiveness-panel.tsx:97`: *"they do not replace an independent CEFR certificate"*).
- **Unified evidence storage structurally exists.** `recordAttempt()` is the single write path from Mission, Error Workshop, and (indirectly) Studio into one `attempts[]` array in `app-store.tsx` — not fragmented per-flow silos. The gap is in what gets *marked verified*, not in where evidence lives.
- **Install/Update/Repair data preservation was independently verified tonight**, unrelated to this contract: `SetupApp.cs`'s installer does an atomic staged directory-swap and keeps `DataRoot` (user data) physically separate from `InstallRoot` (program files) — confirmed by reading the actual `Installer.Install()` method. This satisfies contract §12.1 as currently built.

---

## Roadmap — all of P0 and P1 now done

Reordered from the draft by evidence, not by restating it — the real blocker set was smaller than 10 phases suggested once you see that F1's fix was "wire up an existing function" rather than "build a verification engine." All six items below (F1–F6) are implemented, typechecked, built, tested, and shipped in the rebuilt installer.

### P0 — Unblocks Release 1 ✅ done

1. **Wire `masteryEligible` into Mission's three attempt sites** (fixes F1). At `automaticity-screen.tsx:316/468/580`, replace `verified: false` with the same `evaluation.online && pass`-shaped check already proven at `errors-screen.tsx:274`. This alone unblocks "stable" status becoming reachable for writing/recognition.
2. **Fix my own Review regression** (fixes F4). Replace `due-reviews.tsx`'s raw self-rated buttons with an actual free-text evaluation step: send the recalled text through `evaluateResponse()` (same pattern as Mission), use *its* pass/fail to drive `completeReview`, and keep the self-rating (if you want to keep it at all) as a separate, clearly-labeled "how confident did that feel" signal that never touches scheduling.
3. **Decide F5's classification** — either extend the contract's tier table to name deterministic local checks explicitly, or wire recognition through `evaluateResponse()` too for consistency.

### P1 — Unblocks Release 2 ✅ done

4. **Build a real Transfer flow** (fixes F2). Needs an actual distinct UI step — a new prompt in unfamiliar wording, answer required before any reference is shown, recorded with `mode: "transfer"`. Today there is no code to extend; this is new, not a wiring fix.
5. **Replace the fluency formula with audio-derived measurement, or stop calling it fluency** (fixes F3). Two honest paths: (a) send the audio blob to a provider capable of pause/prosody analysis and gate `speakingScore` on that provider's success the same way `masteryEligible` already gates text assessment, or (b) if that's out of scope for now, rename the metric and its UI label away from "fluency" to something that accurately describes what a word-count/time ratio actually measures, and mark real fluency as `not_assessed` per §5.3 rather than showing a number that looks measured.
6. **Add `audioId` and split `rawTranscript`/`reviewedTranscript`** on `Attempt` (fixes F6) — needed as a prerequisite for #5's option (a).

### P2 — Matches the original draft's later phases as-is
Content reconstruction (§11), delayed-retention scheduling beyond what Review already partially does (§10), data export/import (§12.3), selective audio deletion (§12.4) — the draft's sequencing for these looked reasonable and I found no code evidence changing that assessment; I did not do a full audit of these sections given the scope of this pass.

### Explicitly not re-litigated
Installer Install/Update/Repair data preservation (§12.1) — already verified working tonight through direct testing, not just code reading. No action needed there.

---

## What's still open (P2, not attempted)

Not touched in this pass, per the original roadmap's own sequencing — these are genuinely separate, larger scopes:

- **Content reconstruction (§11).** `GrammarUnit.transferTest` being a generic template rather than real per-unit content (noted under F2) is the concrete symptom; a full pass likely finds the same pattern elsewhere in the catalog.
- **Delayed-retention scheduling beyond Review (§10).** The 1/3/7/14/30-day protocol Review already does partially; the full Day-1/3/7/14/30 cadence with near-transfer and independent-production task *types* at each interval isn't built.
- **Data export/import, selective audio deletion (§12.3, §12.4).**
- **Runtime/accessibility/E2E verification beyond what was manually tested tonight (§13).**

## What changed operationally

The rebuilt installer is what's live. If a "stable"/"automatic" status you see going forward looks wrong, the fastest way to check it is `recalculateMastery()` in `app-store.tsx` plus whichever `recordAttempt` call produced the underlying evidence — every score now traces back to a specific `verified` flag and the function that set it, which is exactly what this document didn't have before today.
