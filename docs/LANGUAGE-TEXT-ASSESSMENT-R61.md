# R61 — completed bounded-reasoning development review

Reviewed after completion on 2026-10-03. This is an engineering reconstruction of local development evidence, not independent human linguistic adjudication or production approval.

## Result

The bounded-reasoning candidate did not pass the unchanged development gate. It does not justify consuming the reserved final set or activating a general evaluator.

| Language / configuration | Accepted source-edited | Accepted source-clean | Detected source-edited | Changed source-clean | Abstained |
| --- | ---: | ---: | ---: | ---: | ---: |
| English / R59 target-last | 5/32 | 30/32 | 13/32 | 1/32 | 15/64 |
| English / R61 | 5/32 | 27/32 | 8/32 | 2/32 | 22/64 |
| German / R59 target-last | 1/32 | 15/32 | 16/32 | 7/32 | 25/64 |
| German / R61 | 1/32 | 15/32 | 4/32 | 2/32 | 42/64 |

Both configurations used the same 128 development cases and original labels. Repeated calls are not additional independent samples. The gate remains zero accepted source-edited cases plus at least 29/32 source-clean acceptances and 29/32 detected source-edited cases in each language. Both languages failed.

## What changed in the disagreements

- Five of the six final source-edited acceptances persisted: four English cases and the German orthography case.
- The earlier English missing-article case now received the same necessary article insertion from both passes, with no other text change.
- A different English case, previously unassessed because of disagreement, was accepted by both passes. Its source annotations cover punctuation, preposition choice and noun number. The total therefore stayed at five English and one German acceptance; it is not the identical six-case set.
- The retained English annotation groups include adjective/verb substitutions, punctuation/article choice, and a noun/tense combination. Source-edited does not mean every disagreement is a proven intrinsic grammar error. Source-clean also does not prove universal correctness. No official label or denominator was changed, and these observations are not independent adjudication.
- German source-clean changes fell from seven to two, but source-clean acceptances stayed at fifteen while abstentions rose. This cannot be reported as a general accuracy improvement. English source-clean changes increased from one to two; both new retained changes were punctuation edits.
- R61 had 33 disagreements between structurally valid, definite reviews: 14 English and 19 German. Twenty were different corrected texts after two incorrect verdicts; thirteen were verdict disagreements. Exact agreement remained a conservative software guard, not proof that either repair was valid.

## Completeness, provenance and runtime

`loadEditCandidate` reconstructed both completed runs from their stored raw final answers, checked configuration/prediction/source-snapshot hashes, linked report identity to configuration and the frozen development selection, and recomputed linguistic counts, operational totals, failure counts, latency and completion diagnostics. The R61 candidate fingerprint was also independently recomputed from settings and recorded launch/template/default evidence.

- R61: 128 unique selected cases, 256 attempted phases and 256 requests started. All failures remain in the original denominators.
- 217/256 calls were structurally valid, versus 232/256 in R59 target-last. Both phases were assessed for 97/128 cases.
- 24 requests timed out: six English and eighteen German, affecting 24 cases. The other fifteen invalid calls comprised five uncertain outputs containing edits, six overlapping-edit outputs, two no-op outputs and two absent/ambiguous quotations.
- All 232 returned responses recorded `finish_reason: stop` and a nonempty reasoning field. No returned response recorded the output-length limit. None of the 217 structurally valid answers explicitly selected uncertainty. Reasoning presence and its length do not establish correctness; reasoning text remains local.
- The preregistered R61 runtime used a 768-token reasoning budget, 1,800-token output cap and four 4,096-token slots. These constrained local limits are not a reproduction of the publisher's general benchmark conditions.
- Median paired-call latency rose from 22,157 ms to 214,904 ms; p95 rose from 115,577 ms to 240,016 ms. The latter includes small timing overhead around the shared 240-second deadline. This four-slot local diagnostic is not an online service-latency qualification.
- Matching recorded model hash/revision, executable hash, chat-template hash, default server settings, prompts, schema, parser hash, target-input helper hash, combination policy, data selection and shared deadline were confirmed. R61 pre/post launch identity was stable. The launch-arguments hash differs between the two runs and is preserved; cross-run launch equivalence is not inferred from the matching executable alone.
- Reasoning mode, sampling, seed and output budget changed together. These outcomes do not isolate the causal effect of thinking, nor prove that every implementation of this model would fail identically. They reject this pinned local configuration.

Evidence paths (raw learner text and reasoning remain local):

- `research/assessment-benchmark/runs/writing-edits-27b-development-thinking-v1/`
- `research/assessment-benchmark/runs/writing-edits-27b-development-direct-v3/`
- `research/assessment-benchmark/runs/writing-context-data-v2/development.jsonl`
- `research/assessment-benchmark/R61-PLAN.md`

R61 candidate fingerprint: `d6fb0e07b040fd7beba66e0e12f02233bd90676e7081c0279f5fe972b5c0036d`.

Development-selection SHA-256: `d1c6c63f7e5e3a2a5c0e8fba0d4647aa7845276c35bb36769102c65721187e1c`.

The holdout-consumed marker was absent during this review. No held-out cases were read. Known limitations remain: reused development data, unknown public-pretraining exposure, correlated same-model reviews, document clustering and unavailable German author identity beyond document IDs.

## Next concrete requirement

Keep the failed configuration inactive and preserve the untouched final set. Before another broad qualification claim, establish independently adjudicated, task-aligned evidence for a narrowly specified writing scope, including acceptable alternatives, obligatory errors, ambiguity, target compliance and meaning preservation. Existing corpus results stay unchanged alongside that separate evidence.

The current product policy requires at least 100 correct-alternative and 100 grammar-error final cases plus 20 each ambiguous, off-target and ASR-corruption cases per scope, two distinct human reviews and adjudication, sufficient confidence/coverage and zero consequential errors. It also requires reviewed meaning/target judgments and does not automatically approve a candidate. No such approved general evaluator is established by R61. Define a production latency limit before a future serving trial; the current qualification code records latency without imposing an acceptance ceiling.

No statement here qualifies pronunciation, fluency, independent learning transfer or a 90% learner-outcome guarantee. Publication of this ledger or application fixes is separate from evaluator approval.
