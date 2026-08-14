# English Automaticity: Evidence, Task Versioning, and Migration Roadmap

Date: 2026-08-14  
Status: frozen implementation sequence  
Principle: preserve history; strengthen future evidence; never manufacture missing provenance

## Target outcome

English Automaticity must compute an explainable skill status from immutable attempts, artifacts, assessments, task versions, and rule versions. Published task definitions remain readable forever. Legacy data remains visible but cannot qualify for stronger status than its real evidence supports.

## Scope boundaries

- Preserve the existing application and visual shell.
- Delete no source, legacy task, attempt, transcript, audio, or learner progress.
- Do not rewrite published task definitions or immutable events.
- Do not treat typed/edited transcripts as raw speaking evidence.
- Do not activate `Automatic for this skill` until the later evidence releases satisfy the full audio, transfer, repair, and retention contract.
- Each app payload change requires a rebuilt and verified English installer, including Install/Update/Repair and learner-data preservation.

## Phase 0 — Freeze and inventory

Deliverables:

- current source and worktree inventory;
- current Attempt, Review, Mastery, audio, transcript, and task shapes;
- task catalog snapshot with checksums and legacy provenance;
- current installer/version/checksum baseline;
- compatibility and risk register.

Acceptance gates:

- no user change overwritten;
- no legacy version guessed when it cannot be proven;
- build/test baseline captured before semantic cutover;
- rollback target identified.

## Phase 1 — Versioning foundation

Deliverables:

- semantic version primitives;
- immutable `TaskDefinition`/`TaskVersion` contracts;
- versioned task lifecycle state machine;
- Task Catalog with exact historical and latest-published resolvers;
- lifecycle transition guards and append-only events;
- PostgreSQL lifecycle monitoring views for state duration, stuck Tasks, and actor-attributed history;
- versioned event envelope;
- pure, deterministic V1-to-V2 upcaster registry and chain;
- de-identified historical fixtures and golden tests.

Acceptance gates:

- published task definitions cannot be edited in place;
- historical attempts resolve exact versions;
- deprecated/retired/blocked tasks cannot create new attempts;
- upcasting never mutates stored input or invents provenance;
- repeated replay with the same input produces the same output.
- dashboard queries derive from the append-only ledger rather than mutable summary fields.

## Phase 2 — Dual read and shadow projection

Deliverables:

- tolerant legacy/current reader;
- versioned evidence ledger;
- deterministic `SkillStatusProjection(asOf, ruleVersion)`;
- isolated shadow projection namespace;
- projection hashes, rejection reasons, and blue/green delta report;
- compatibility matrix by task and rule version.

Acceptance gates:

- legacy and current records replay together;
- status is rebuilt rather than stored as truth;
- self-rating, completion, and word count cannot increase Mastery;
- any downgrade or reassessment has an explainable reason.

## Phase 3 — Safe backfill

Deliverables:

- structural dry-run and manifest;
- artifact metadata/hash backfill for existing artifacts only;
- consent-gated assessment backfill for real retained audio;
- checkpointed, rate-limited, resumable batches;
- idempotency keys and reconciliation report;
- shadow projection rebuild from backfilled assessments.

Acceptance gates:

- missing audio remains missing;
- legacy unknown transcript remains `legacy_unknown`;
- recording duration is never relabeled active speech;
- failed/unavailable providers create no passing score;
- outputs can be excluded by `backfillRunId` without deleting audit history.

## Phase 4 — Blue/green migration and rollback

Deliverables:

- immutable release/config/task-catalog manifests;
- green runtime and green projection namespace;
- overlap-compatibility checks;
- staged traffic/read-alias switch;
- automatic stop thresholds;
- rehearsed traffic, task, rule, projection, and config rollback;
- environment change log across local, test, staging, and production.

Acceptance gates:

- blue and green can read every event written during overlap;
- config and secret versions are pinned and startup-validated;
- rollback never rewrites the event store;
- exact task history remains resolvable before and after rollback.

## Phase 5 — Trustworthy evidence (Release 1)

Deliverables:

- one central Evidence Engine for Mission, Studio, Review, and Transfer;
- immutable audio/raw transcript and versioned reviewed transcript;
- objective review result separated from learner confidence;
- invalid/provider-unavailable evidence excluded from Mastery;
- learner-visible `Practised`, `Usable`, and pending-requirement explanations.

Acceptance gates:

- typed transcript creates no speaking evidence;
- reference-visible review creates no independent recall evidence;
- Conversation Studio evidence is traceable to the original artifact;
- no new pronunciation or fluency claim is made in this release.

## Phase 6 — Audio fluency and Automatic rubric (Release 2)

Deliverables:

- speech onset, active speech, syllable/speech rate;
- silent/filled pause metrics with configurable threshold above 250 ms;
- mid-clause versus end-clause pause rate per 100 syllables;
- repetition, correction, restart, and reformulation metrics;
- pronunciation, intelligibility, and prosody when a valid provider exists;
- structured speed/breakdown/repair rubric and validation checklist.

Acceptance gates:

- every metric identifies source audio, algorithm, and threshold version;
- all three fluency dimensions must pass their calibrated gates;
- no composite average can hide failure in one required dimension;
- thresholds are marked provisional until pilot and blind human calibration.

## Phase 7 — Transfer, review, interaction, and retention (Releases 3–4)

Deliverables:

- scenario-specific spoken and written Transfer Lab;
- follow-up, clarification, misunderstanding, and repair turns;
- objective recall before reference reveal;
- Day 1/3/7/14/30 windows;
- evidence weakening, expiry, and refresh tasks;
- real listening-assessment mode, interaction, and mediation.

Acceptance gates:

- at least two novelty dimensions per transfer;
- at least two distinct transfer scenarios for Automatic eligibility;
- one-session success cannot produce Stable or Automatic;
- missed or invalid evidence remains transparent and actionable.

## Phase 8 — Content depth and effectiveness validation (Release 5)

Deliverables:

- human-reviewed A1/A2 task set with task-specific scenarios;
- task lifecycle workflow: Draft → Review → Approved → Published → Deprecated/Retired/Blocked/Archived;
- baseline, novel post-task, Day-14, and Day-30 protocol;
- blind human rating and outcome reporting.

Acceptance gates:

- published versions are checksum-locked;
- task lifecycle transitions are guarded and auditable;
- no CEFR or outcome claim is enabled without independent evidence;
- template repetition is rejected by content quality gates.

## Phase 9 — Release and recovery

Deliverables:

- updated app and installer version;
- current Install/Update/Repair payloads;
- migration and rollback manifests;
- verified fresh install, upgrade from legacy data, repair, startup, and recovery;
- exact final installer path and SHA-256.

Acceptance gates:

- audio, attempts, transcripts, reviews, ledger, and progress survive Update/Repair;
- partial/offline migration resumes safely;
- rollback and reinstall do not duplicate events or derived records;
- final runtime and E2E evidence are recorded.

## First implementation slice

Work begins with Phase 0 and the reversible portion of Phase 1:

1. inventory current contracts and release state;
2. add version and lifecycle domain types;
3. add immutable catalog/resolvers;
4. add pure upcasting chain;
5. add historical fixtures and tests;
6. verify no current learning behavior or learner data is changed;
7. rebuild the English release artifact because application payloads changed.

Semantic Mastery cutover, data backfill, and Automatic status activation remain disabled until their later phase acceptance gates pass.
