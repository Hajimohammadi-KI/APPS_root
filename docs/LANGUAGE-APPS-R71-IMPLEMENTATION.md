# R71 decision and implementation

On 2026-10-11 the owner chose both actions: prepare independent human review
and temporarily move unassessed free-response tasks out of the main learning
path. No unqualified evaluator may be enabled.

## Main and optional practice

The main practice route should recommend only closed writing tasks with an
available deterministic answer check. Reflection, free writing and speech
remain explicitly optional. Existing task links, recordings, saved answers,
repair history and unfinished drafts must stay accessible. Optional tasks save
responses without promising a correctness check or awarding mastery.

Closed-answer feedback establishes performance on that particular exercise;
it does not prove independent production, transfer or spoken fluency.

## Prepared review materials

Private local packet: `artifacts/r65-human-review/r71-20261011/`.
It contains 128 development cases (64 per language), independent reviewer A
and B forms, a separate coordinator mapping and an actual-task intake template.
Previous review packets were preserved. The frozen final evaluation set was
not read. The packet records **zero completed reviews, zero adjudications and
zero actual-task cases**; its automatic-approval flag is false.

Give each qualified reviewer only their own form and the rubric in
[LANGUAGE-ASSESSMENT-R65.md](LANGUAGE-ASSESSMENT-R65.md). Keep coordinator
files and each person's judgments separate until both initial reviews are
sealed. The private `weekly-plan.json` names the same 20 cases each week for
both reviewers (10 per language); the final week contains the remaining eight.
Dates are proposed working dates, not booked meetings or completed work.

Export partial judgments before closing the offline form. Validate real exports
with the existing `scripts/validate-r65-human-review.ts` command. Missing
judgments stay missing; disagreements require adjudication by another
qualified person. No messages were sent to reviewers.

Corpus review cannot establish actual exercise compliance. Collect real task
definitions, original responses, independently documented intended meaning,
rights/consent and their required hashes using `task-intake-template.json`.
Keep original-response and correction review stages separate. The existing
R65 tooling validates these bindings without issuing production approval.

## Remaining work

Real qualified reviewers must complete the forms and any adjudication. Actual
task-linked intake, independent final evaluation and audio-grounded speech
validation remain necessary before enabling a general evaluator. R71 and R65
therefore remain open even after the temporary routing change is published.

## Validation evidence

`bun test ./scripts/r65-review-packets.test.ts`: 7 tests passed, 61 assertions.
These tests verify packet transport, immutable identities, blinding and review
validation. Synthetic test labels are never counted as human evidence.
