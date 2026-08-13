# Automaticity Product Contract

**Project:** English Automaticity  
**Status:** Active product contract  
**Contract version:** 1.0.0  
**Date:** 2026-08-13  
**Scope:** This contract governs product claims, evidence handling, mastery logic, data protection, validation, and release requirements for the existing English Automaticity application. It does not authorize redesign of the current visual interface or creation of a new application.

---

## 1. Purpose

This contract prevents the product from presenting practice completion, self-reported confidence, or unverified application activity as proof that a learner has achieved language automaticity, CEFR certification, or independently verified proficiency.

The product may support structured language practice, active recall, writing, speaking, repair, spaced review, delayed retrieval, and transfer tasks. Any claim about automaticity must be limited to the exact skill, task, evidence, time period, and validation method recorded by the system.

---

## 2. Non-negotiable rules

1. No transcript, evaluation, provider result, score, audio artifact, or verification status may be fabricated, hard-coded, simulated, or silently substituted.
2. If a required provider, microphone permission, recording, evaluation, or network dependency is unavailable, the product must explicitly show an unavailable or not-assessed state. It must not create, store, or display an estimated score as if it were measured.
3. Existing user files, recordings, transcripts, learning history, progress, settings, backups, and legacy data must not be deleted by a feature change, migration, update, repair operation, or installer.
4. Raw audio, raw transcript, learner-reviewed transcript, and evaluation outputs are separate artifacts. They must remain distinguishable and traceable.
5. Completing a task is not evidence that a skill is automatic.
6. A learner self-rating is confidence data only. It must not increase mastery, automaticity, verification, or CEFR status.
7. Every final release must include a new installer and successful Install, Update, and Repair verification.
8. Every release must reference this contract, its version, and the acceptance criteria it satisfies.
9. The application must preserve the current visual design unless a separately approved scope change explicitly authorizes UI redesign.
10. All learner-facing claims must be narrower than or equal to the available evidence.

---

## 3. Claim policy

### 3.1 Allowed claims before effectiveness validation

Before a completed validation cycle, the product may state that it:

- Supports structured English practice.
- Records practice evidence for specified tasks.
- Supports active recall, production, feedback, repair, spaced review, and scheduled delayed practice.
- Helps learners organize practice aimed at fluency and automaticity.
- Provides task-specific progress indicators based on recorded evidence.

### 3.2 Prohibited claims before effectiveness validation

Before independent, delayed, and transfer-based evidence exists, the product must not state or imply that it:

- Makes a learner automatic in English.
- Proves language automaticity.
- Certifies or verifies CEFR level.
- Measures pronunciation, prosody, fluency, or speaking quality when the relevant audio-based assessment was not performed.
- Establishes real-world speaking competence solely from in-app completion or self-rating.

### 3.3 Conditional claims after validation

The phrase `Automatic for this skill` may be shown only when the learner meets the defined, task-specific requirements for:

- Valid performance evidence.
- Delayed retrieval.
- Transfer to a new prompt or situation.
- Required accuracy and fluency thresholds.
- Evidence freshness.

Any such claim must identify the skill and scope, for example:

> Automatic for this skill: independent A2 spoken restaurant-ordering responses.

The product must not generalize this result to overall English proficiency.

---

## 4. Learner-status vocabulary

The following labels have fixed meanings:

| Status | Meaning | Must not imply |
|---|---|---|
| Practised | The learner completed an activity. | Correctness, retention, fluency, transfer, or automaticity. |
| Evidence captured | A traceable text, audio, or mixed artifact and relevant metadata were stored. | Provider or human verification unless stated. |
| Stable | Valid evidence has met the defined delayed-performance rules for a specific skill. | Broad automaticity or CEFR certification. |
| Transfer demonstrated | The learner performed the target skill in a sufficiently new prompt or situation. | Long-term retention unless delayed criteria are also met. |
| Automatic for this skill | Task-specific delayed and transfer criteria are satisfied with valid evidence. | Automaticity in all English skills or situations. |
| Independently verified | An approved external or human evaluation was completed and recorded. | CEFR certification unless the independent process explicitly provides it. |

The terms `Verified CEFR`, `CEFR verified`, or equivalent language must not be displayed unless a separately defined independent CEFR assessment process supports that claim.

---

## 5. Evidence integrity

### 5.1 Required distinction between artifacts

For speaking and mixed tasks, the data model must distinguish at least:

- `audioId`: identifier of the original learner recording.
- `rawTranscript`: immutable transcript generated from, or manually anchored to, the original audio.
- `reviewedTranscript`: learner-edited transcript used for writing reflection or repair.
- `speakingAssessment`: results derived from the original audio only.
- `textAssessment`: grammar, spelling, or style results derived from the relevant transcript version.
- `provider`: provider name, version where available, request identifier, execution time, and result status.

Editing `reviewedTranscript` must not overwrite `rawTranscript`, alter the original audio, or modify an existing audio-based speaking score.

### 5.2 Immutability and lineage

- Raw audio and raw transcripts must be immutable after a successful save.
- A corrected or improved response must create a new attempt, not overwrite the previous attempt.
- Related attempts must preserve lineage through prior/superseding attempt identifiers.
- Every assessment must identify the artifact and assessment version used.
- Evidence must record creation time, content version, prompt version, application version, and schema version.

### 5.3 Provider failure

If an assessment provider fails, is unavailable, returns incomplete data, or cannot validate an artifact:

- Store the provider status and diagnostic information where safe to do so.
- Mark the relevant assessment as `not_assessed`, `failed`, or `unavailable`.
- Do not synthesize an equivalent score.
- Do not promote mastery based on the missing assessment.
- Permit a transparent retry that creates or links to a new assessment event without falsifying the original failure.

---

## 6. Unified evidence requirement

Automaticity Mission, Conversation Studio, Review, Error Workshop, Writing, Speaking, and Transfer flows must create traceable records in a unified evidence system.

Separate local storage may be used for temporary drafts, cached artifacts, or resilience, but it is not sufficient as the final source of truth for progress or mastery if those records are not integrated into the unified evidence system.

At minimum, each evidence record must identify:

- Learner, task, skill, topic, and attempt.
- Evidence kind: recognition, recall, writing, speaking, grammar repair, review, or transfer.
- Modality: text, audio, or mixed.
- Mode: guided, controlled, independent, or transfer.
- Creation time and relevant content/prompt/app versions.
- Validation level.
- Evidence state.
- Source flow: mission, studio, review, or error workshop.
- Links to all relevant artifacts and assessments.

---

## 7. Validation levels

Validation is not a Boolean field. The system must distinguish:

| Validation level | Meaning | Eligible for mastery promotion? |
|---|---|---:|
| `unverified` | Activity exists but has no qualifying assessment. | No |
| `self_reported` | Learner supplied confidence or self-rating. | No |
| `provider_verified` | A qualifying provider assessed the correct original artifact successfully. | Only where the skill rule explicitly permits it |
| `human_verified` | An approved human evaluator assessed the artifact using a recorded rubric. | Yes, subject to skill-specific rules |

A record may carry multiple assessments. The strongest applicable assessment must not erase weaker assessments or raw artifacts.

---

## 8. Mastery and automaticity rules

### 8.1 General rule

Mastery may be computed only from evidence that is valid, traceable, relevant to the target skill, and eligible under the published rule for that skill.

### 8.2 Explicit exclusions

The following must not independently increase a mastery, automaticity, or verification score:

- Pressing `I got it right` or any equivalent self-rating control.
- Opening, viewing, replaying, or dismissing a review card.
- Saving a transcript without a valid task result.
- A hard-coded, fallback, placeholder, or unavailable provider result.
- A transcript edited by the learner when the measure concerns the original spoken performance.
- Evidence that is expired, invalid, or disconnected from its underlying artifact.

### 8.3 Transfer requirement

A transfer attempt must be a real task generated by a distinct, accessible user flow. It must be stored with `mode: "transfer"` and cannot be inferred solely from a normal guided or controlled exercise.

Transfer prompts must require use of the same target skill in a sufficiently new situation, wording, or communicative goal. They must not reveal the reference answer before the learner submits an independent response.

### 8.4 Evidence freshness

Evidence used for mastery must have a documented freshness policy. Evidence may weaken or expire as time passes, but the application must:

- Explain why the status changed.
- Preserve historical evidence.
- Allow status recovery through new valid evidence.
- Never delete learner history merely because evidence is old.

### 8.5 Explainability

Every learner-facing mastery or automaticity status must have an inspectable explanation showing:

- Which evidence records contributed.
- Which requirements are met.
- Which requirements remain unmet.
- The dates, task versions, validation levels, and evidence states involved.

---

## 9. Speaking assessment policy

### 9.1 Required conditions

When a task claims to assess speaking performance:

- Original learner audio is required.
- The raw transcript must be retained separately from any learner edits.
- The system must use the original audio for pronunciation, prosody, pause, latency, fluency, and speech-repair measures.
- The application must not infer pronunciation or prosody from text alone.
- If the required audio-analysis provider is unavailable, the relevant speaking dimension must remain not assessed.

### 9.2 Measurements

Where a validated provider and approved method are available, the system may record task-specific measures such as:

- Response latency from prompt availability to speech onset.
- Active speech duration excluding non-speech pauses.
- Articulation rate or comparable active-speech rate.
- Pause frequency and duration.
- Restart, repetition, reformulation, and self-repair indicators.
- Pronunciation and prosody measures.
- Task-specific intelligibility or communicative-completion measures.

The application must show the method and units sufficiently clearly to avoid presenting a vague composite score as objective truth.

### 9.3 Improvement attempts

When the learner improves a response:

- The improved response must be recorded as a new attempt.
- The original response remains available unless the learner explicitly deletes the underlying artifact.
- Comparisons must reference the actual prior attempt and state which measures are comparable.
- A better edited transcript alone must not be presented as improved speech.

---

## 10. Delayed retention and transfer protocol

The product must distinguish immediate success from retained and transferable performance.

For skills eligible for `Stable` or `Automatic for this skill`, the applicable protocol must include delayed tasks scheduled at appropriate intervals. The initial standard protocol is:

- Day 1: early retrieval.
- Day 3: reduced-support retrieval.
- Day 7: delayed retrieval with a new or less familiar prompt.
- Day 14: near-transfer task.
- Day 30: independent delayed production in a new situation.

A missed task must not erase evidence. It may affect eligibility for a status until a new valid task is completed.

Each skill must define:

- The acceptable response format.
- The required level of independence.
- The required validation level.
- Accuracy and fluency thresholds where applicable.
- The definition of a sufficiently new transfer context.
- The evidence-expiry rule.

---

## 11. Content quality policy

### 11.1 Content sequence

Content reconstruction begins with A1 and A2 depth and quality before broad expansion to higher CEFR-aligned levels.

### 11.2 Lesson requirements

Each published lesson must include, where relevant:

1. Meaning in a real communicative context.
2. Recall without multiple-choice support.
3. Controlled production.
4. Timed speaking or timed writing.
5. Error recognition and repair.
6. Spaced review.
7. Transfer in a new situation.
8. Delayed independent spoken or written production.

### 11.3 Vocabulary and chunk requirements

Published vocabulary or chunks should include the relevant subset of:

- Meaning in context.
- Pronunciation support and approved human audio where available.
- Inflection or grammatical pattern.
- Preposition or verb pattern.
- Collocations.
- Word family.
- Natural example.
- Common learner error.
- Recall and productive-use activity.
- Transfer opportunity.

### 11.4 Template prohibition

A topic cannot be considered substantively unique merely because a generic template replaced a topic name. Published content must have a topic-specific communicative goal, context, vocabulary, follow-up behavior, and quality review.

All published content must pass technical checks and documented human content review.

---

## 12. Data, privacy, and recovery

### 12.1 Preservation

Install, Update, Repair, migration, and rollback processes must preserve learner data unless the learner explicitly requests deletion.

### 12.2 Migration

Every migration must provide:

- A schema version.
- A migration identifier and log.
- A pre-migration backup or equivalent recoverable state.
- Idempotent behavior where applicable.
- A tested rollback or recovery path.

### 12.3 Export and import

The product must support a documented export/import process for learner data. Audio export may be separate because of size and privacy implications. Imports must not silently overwrite existing records.

### 12.4 Selective deletion

The learner must be able to request deletion of selected audio artifacts. Deleting an audio artifact must not silently rewrite history; the linked evidence should preserve a transparent state such as `artifact_deleted_by_user` and must no longer support audio-dependent claims.

### 12.5 Privacy transparency

The product must explain when audio or text is sent to a provider, which provider is used, and whether provider assessment is unavailable. No external processing may be implied to have occurred when it did not.

---

## 13. Runtime, accessibility, and E2E requirements

Build success is necessary but insufficient for release.

Every release that changes relevant flows must include real browser verification for applicable scenarios:

- Application startup and health checks.
- Microphone permission, recording, stop, playback, save, and retry.
- Provider success, provider failure, and provider-unavailable states.
- Offline behavior, queued work, recovery, and conflict handling.
- Keyboard navigation, focus order, visible focus, and accessible labels.
- Responsive behavior on supported viewport classes.
- Preservation of data after refresh, restart, update, and repair.
- End-to-end evidence creation from each integrated source flow.

No endpoint, provider, recording state, or feature may be marked operational solely because a build or typecheck succeeded.

---

## 14. Release engineering requirements

Every release must include:

- Release version and date.
- Source commit identifier.
- Contract version reference.
- Data schema version and migration information.
- Installer version and SHA-256 checksum.
- Release notes describing learner-visible and data-model changes.
- Test results for unit, integration, E2E, build, typecheck, lint, formatting, and relevant content checks.
- Installer verification for fresh Install, Update from the prior supported version, and Repair.
- Evidence that user data, audio, transcripts, and progress survive Update and Repair.
- A known-limitations section, including unavailable providers or unvalidated claims.

A release must be blocked if a required Install, Update, Repair, data-preservation, or core evidence-integrity test fails.

---

## 15. Release gates

### Release 1 — Trustworthy Evidence

Release 1 may ship only if:

- The baseline inventory and source-of-truth map are complete.
- Mission, Studio, Review, and Error Workshop create traceable unified evidence records.
- Self-rating cannot advance mastery or automaticity.
- A real Transfer Writing and Transfer Speaking flow exist and record `mode: "transfer"`.
- Mastery logic uses only eligible valid evidence.
- Learner-facing labels do not imply CEFR verification or unproven automaticity.
- Install, Update, and Repair preserve existing learner data.

### Release 2 — Real Speaking and Delayed Transfer

Release 2 may ship only if:

- Speaking measures are based on original audio where required.
- Transcript editing cannot modify audio-derived speaking assessment.
- Provider-unavailable states do not create substitute scores.
- Delayed tasks are scheduled and evidence-linked.
- Improved attempts are recorded as new attempts with lineage.

### Release 3 — Content and Daily Flow

Release 3 may ship only if:

- A1 and A2 content passes technical and human review.
- Generic topic-name substitution is not used as a substitute for topic-specific content.
- The daily flow clearly guides Recall → Speaking → Repair → Transfer → Delayed Review.
- Learner-facing explanations distinguish practice, stability, transfer, and automaticity.

### Release 4 — Stable Product

Release 4 may ship only if:

- Migration, export/import, selective deletion, backup, recovery, offline behavior, accessibility, and E2E verification meet their release criteria.
- Runtime topology and application startup are verified in the supported environment.
- Installer Install, Update, Repair, and data-preservation tests pass.

### Validation Cycle — Effectiveness Claim Gate

The product may use outcome-oriented Automaticity claims only after at least 30 days of real data and a documented validation cycle containing:

- Pre-intervention baseline.
- Independent delayed tasks.
- New transfer tasks.
- Measures appropriate to the skill, including response latency, pauses, active speaking rate, accuracy, repair, and task completion where applicable.
- Independent human assessment for a defined sample of speaking and writing.
- Transparent reporting of missing data, failures, dropouts, limitations, and non-improvements.

---

## 16. Change-control procedure

Any change that affects evidence, data retention, mastery, learner-facing claims, recording, assessment, provider usage, installer behavior, or migration must:

1. Identify the applicable clauses of this contract.
2. Update or add acceptance tests before implementation.
3. State whether existing learner data is read, migrated, preserved, or newly created.
4. Document the release-gate impact.
5. Be reviewed against this contract before release.

If a proposed feature conflicts with this contract, the feature must be blocked or the contract must be amended in a versioned change with an explicit rationale and migration plan.

---

## 17. Acceptance statement

By referencing this contract, a release confirms that it does not present unverified activity as verified learning, does not present text-only analysis as speech assessment, does not conflate completion with automaticity, and does not sacrifice learner data during installation, update, repair, or migration.
