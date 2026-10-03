# R59 results — 2026-10-03

Three complete development configurations were run on the SAME 128 frozen sentences, with two fresh original-only calls per case: 768 requests, not 768 independent sentences. The earlier 27B v1 operational attempt is incomplete and explicitly excluded from selection; its files and interruption record are preserved. No model passed development and the 512-case held-out set remains unused.

| Configuration | Language | Accepted source-edited | Accepted source-clean | Detected source-edited | Changed source-clean | Abstained |
| --- | --- | --- | --- | --- | --- | --- |
| 14B baseline | en | 0/32 | 2/32 | 11/32 | 2/32 | 49/64 |
| 14B baseline | de | 0/32 | 1/32 | 7/32 | 1/32 | 55/64 |
| 27B baseline | en | 1/32 | 16/32 | 12/32 | 2/32 | 33/64 |
| 27B baseline | de | 0/32 | 1/32 | 14/32 | 12/32 | 37/64 |
| 27B target-last | en | 5/32 | 30/32 | 13/32 | 1/32 | 15/64 |
| 27B target-last | de | 1/32 | 15/32 | 16/32 | 7/32 | 25/64 |

## Actual improvements and remaining failures

- Separating read-only context from the editable target reduced context-only edit proposals from 80 to 0. No-op proposals fell from 40 to 11. These count proposals, can overlap, and are not independent sentences.
- Structurally valid calls rose from 189/256 to 232/256. The median paired-call latency fell from 35.7s to 22.2s; p95 remained 115.6s. This is a local 4-slot diagnostic, not online production latency.
- Source-clean acceptance improved, but accepted source-edited targets increased to 5/32 English and 1/32 German. The new candidate is NOT a general accuracy improvement and is NOT approved.
- Two reviews can repeat a linguistic misconception. They reduce some unconfirmed corrections but do not provide independent model validation. The final German candidate still changes 7 source-clean targets and accepts only 15/32 source-clean targets.
- Scope/parser guards are software checks. Valid JSON, exact quotations, agreement, and zero observed acceptance achieved through abstention do not establish linguistic validity.

## Reference scope — R60

The source labels count all annotated edits. Final accepted source-edited cases have these original annotation types (no relabeling):

- de: R:ORTH
- en: M:DET
- en: R:ADJ
- en: M:PUNCT, R:DET
- en: R:VERB
- en: M:NOUN, R:VERB:TENSE

Some reference edits involve word choice, discourse or editorial preference rather than a demonstrably ungrammatical sentence. A genuine missing-article error is also present. The original labels and all denominators remain unchanged. It would be misleading to call all six disagreements six established grammar mistakes, or to delete them and claim zero. Independent adjudication of task/meaning/grammar labels remains outstanding; this report is diagnostic, not that adjudication.

## Provenance and execution

- 14B: Qwen3-14B Q5_K_M, 99 GPU layers; 27B: Unsloth Qwen3.5-27B Q4_K_M, 58 GPU layers. Model hashes, runtime identity before/after, real launch hash, source snapshots, configuration fingerprints and raw outputs are preserved in each run directory.
- The target-last profile changes only original-input segmentation, scope wording and one independently authored example; sampling, labels, parser, schema, shared deadline and two-review policy are unchanged from the completed 27B baseline.
- Report preparation verifies config/prediction/data/snapshot hashes, reconstructs successful responses from raw JSON and recomputes first/review/final metrics. No licensed learner text is included in public app assets.
- R58 repair-review regression: 47 tests / 213 assertions passed; English check/build and German verify passed. Additional contract/policy/report/cache tests passed. Mobile 390 CSS px and tablet 768 CSS px report tables fit without horizontal overflow.
- Release 2026.10.03.10 published on both existing canonical projects. Both release markers, 11 static asset hashes per app and 5 routes per app verified successfully; local proof: artifacts/language-audit-20261003/release-verification-r59-first.json. General model evaluation remains disabled.
