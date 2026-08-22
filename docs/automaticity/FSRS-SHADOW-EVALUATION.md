# FSRS-6 shadow evaluation

Status: implemented behind an opt-in shadow flag; not learner-visible and not eligible to replace the current scheduler.

## Pinned implementation

- Package: `ts-fsrs@5.4.1`
- Algorithm reported by the package: `FSRS-6.0`
- Upstream tag commit: `d26af4d93b8c17cce2513433576587a2750bc80b`
- Request retention: `0.9`
- Maximum interval: `36,500` days
- Short-term scheduling: enabled
- Fuzz: disabled for deterministic comparison
- License: MIT

The canonical core reproduces the upstream FSRS-6 interval vector `[0, 2, 11, 46, 163, 498, 0, 0, 2, 4, 7, 12, 21]`. The upstream source is `open-spaced-repetition/ts-fsrs`, tag `v5.4.1`, test file `packages/fsrs/__tests__/FSRS-6.test.ts`.

## Safety boundary

The existing English and German review dates remain the source of truth. The shadow scheduler:

- is disabled unless `automaticity-feature-flags-v1.fsrs_shadow_v1 === true`;
- writes only to `automaticity-fsrs-shadow-v1`;
- records candidate dates and old/new deltas, but always emits `learnerScheduleApplied: false` and `rolloutEligible: false`;
- stores identifiers, ratings, timestamps and schedule metadata only—never learner response text or audio;
- can be rolled back by deleting its own storage key without changing learner state.

## Legacy-history finding

Both applications retain aggregate review state (stage or interval, streak, stability score and sometimes last-success time), but they do not retain timestamped ratings and card state for every prior review. Those aggregates cannot reconstruct a valid FSRS memory state. The core therefore reports `historyCompleteness: aggregate-only` (or `none`) and `seedEligible: false`; it does not fabricate past ratings.

When the flag is enabled, English and German begin a separate prospective history from the next real review. Existing due dates continue unchanged. This lets us compare future old/new schedules using real interactions without silently migrating old data.

The shadow card is keyed by language and authored source ID, so a renewed legacy review ID continues the same prospective FSRS history instead of silently starting a new card.

## Verification

- pinned upstream vector test;
- default-off and no-write test;
- idempotent event replay;
- explicit migration-loss test;
- rating mapping test with no SM-2 ease factor;
- isolated rollback test preserving unrelated learner storage;
- deterministic replay of 1,000 bilingual representative histories;
- due-count comparison and bounded replay latency benchmark.

Real learner retention, real workload, optimal request retention, and migration eligibility remain **N/A — not sufficiently verified** until enough prospective histories and the external human pilot exist. A learner-visible rollout requires a separate decision and feature flag after those gates pass.
