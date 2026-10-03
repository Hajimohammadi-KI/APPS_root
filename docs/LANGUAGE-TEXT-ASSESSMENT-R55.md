# R55 — Text false-acceptance audit (2026-10-03)

## Outcome
The candidate remains **unqualified and disabled**. Zero false acceptance was not achieved. Conservative checks remove some false passes, but reduce correct acceptance and produce many abstentions. Do not describe this as a validated general grammar model or evidence for 90% automaticity.

| Language | Original false accepts | Two task reviews (failed) | With text check | Correct accepts, original → final | Final unscored |
|---|---:|---:|---:|---:|---:|
| English | 19/101 | 26/101 | 14/101 | 67/96 → 55/96 | 128/197 |
| German | 19/128 | 38/128 | 17/128 | 87/128 → 70/128 | 169/256 |

The final candidate issued no valid repair verdicts on erroneous corpus sentences: evidence/contract checks rejected repair proposals. This is another failed utility criterion, not a successful error detector. Both languages fail the acceptance screen.

## Implementation
- A passing task assessment needs a second task review and a separate text-only check that preserves the original text. Disagreement, malformed output, changed correction, provider failure and shared-deadline exhaustion withhold the pass. No correction from the veto-only checker is shown to the learner.
- All prompts, schemas, sampling and combination policy are pinned into the qualification fingerprint; old approvals cannot carry over. No release approvals were added, no model was activated, and no learner records were modified.
- Diagnostic protocol v3 requires zero observed false accepts **and** the existing sample-size, correct-acceptance, error-detection and confidence-bound minimums. Abstaining on everything cannot pass. Zero sample errors would still not guarantee zero population errors.

## Evidence and limits
The same 453 public-report corpus sentences were reused (197 English, 256 German). The failed two-stage results are retained. The final experiment resumes those exact frozen outcomes and runs the added text check on all 225 retained passes, using the remaining timeout budget. It is an offline staged diagnostic, not an independent holdout or end-to-end latency validation. All calls use Qwen3-4B; their errors are correlated. Reference labels include spelling, punctuation and word choice, not only grammar. These sentences do not validate app task meaning/construction use. English clean-case count is below the 100-case minimum.

Every output ID, aggregate metric, configuration hash and prediction hash was checked. An initial intermediate-report empty hash caused by a cached BunFile handle was corrected from a fresh handle; the original report and correction note remain available. Original datasets and predictions stay local; deployed reports contain aggregates only.

Reports: research/assessment-benchmark/runs/writing-pass-review-v1/public-report.json and research/assessment-benchmark/runs/writing-text-check-v1/public-report.json. Model identity was attested before and after both runs.

## Checks
Four failing regressions reproduced the earlier gaps; all 48 focused tests now pass. English check/build, German verify, shared-core sync checks and eight service-worker tests pass. Production publication is recorded in the roadmap only after canonical release/hash verification.

## Remaining work
A materially stronger text evaluator must pass an independent task-aligned benchmark with sufficient correct alternatives and error cases, including the zero-observed-false-acceptance gate, then obtain real scope review before activation. No such approved evaluator is configured. R36 remains open; speech validation is outside this focused text change.
