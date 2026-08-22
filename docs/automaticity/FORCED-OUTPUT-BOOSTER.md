# Forced Output Booster

## Status and boundary

The Forced Output Booster is an optional, local-first practice mode for the
English and German daily journeys. It is disabled by default and mounts only
when both conditions are true:

1. `booster_mode` is explicitly set to `true` in
   `automaticity-feature-flags-v1`.
2. The daily route contains `?mode=booster`.

The feature provides practice feedback only. A booster round cannot grant
mastery, change a CEFR level, or prove automaticity. Every saved result carries
`masteryEligible: false`, `automaticityClaim:
"insufficient-longitudinal-evidence"`, and `learningOutcome: "not-evaluated"`.

## Daily-plan allocation

The booster does not add a sixth daily-plan block. It consumes time already
assigned to the `automatization` block:

| Allocated automatization time | Rounds | Round duration | Source block     |
| ----------------------------- | -----: | -------------: | ---------------- |
| 2–5 minutes                   |      3 |  30–90 seconds | `automatization` |
| 6–8 minutes                   |      4 |  30–90 seconds | `automatization` |
| 9+ minutes                    |      5 |  30–90 seconds | `automatization` |

The exact round count and duration are calculated from the current 15-, 30-, or
45-minute plan's existing automatization allocation, including short
transitions between rounds. Therefore the two languages may use a different
round count when their authored daily allocations differ; the overall selected
session duration never changes.

## Evidence and storage

- Speaking mode requires a real non-empty `MediaRecorder` recording, detected
  production onset, a corrected transcript, and at least one second of work.
- Typing is an explicit fallback and never becomes speaking evidence.
- Empty, abandoned, audio-free speaking, or malformed attempts create no
  evidence.
- Checked structure uses require authored language-specific patterns inside a
  complete response segment. A bare keyword never counts as a checked use.
- Metrics are normalized to `0..1`: target-structure use, production count,
  onset latency, practice pace, and a composite practice score.
- Attempt, round, plan, and target IDs remain linked.
- Only bounded metadata is kept in `localStorage` for at most 180 days and 250
  attempts. Raw response text and audio are not stored there.
- Audio blobs are stored locally in IndexedDB (`automaticity-booster-audio-v1`)
  and are not uploaded by this feature.

## Verification status

Automated contract and browser tests cover feature-flag defaults, plan
allocation, score bounds, empty/abandoned/audio-free attempts, typed fallback,
linked metadata, English/German copy, keyword rejection, local data minimization,
keyboard-accessible controls, and 800×1280 / 412×915 layouts.

Real microphone capture quality, real speech-onset latency, ASR accuracy, and
learning effectiveness remain **N/A — not sufficiently verified** until tested
with real hardware and consented human participants.

## Future A/B evaluation (documentation only)

An evaluation may compare the ordinary automatization block with the booster,
but only after the vertical-slice and consent gates. Randomization, cohort
assignment, minimum sample size, outcomes, adverse-event checks, and analysis
must be preregistered. No cohort or effectiveness result exists yet.
