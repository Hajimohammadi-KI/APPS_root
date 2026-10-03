# R64 — different-family writing evaluator

Registered before candidate predictions. User goal: reduce invalid grammatical approvals while preserving useful acceptance and correction coverage for English and German. General production qualification remains a separate, stronger requirement.

## Baseline and hypothesis

R61 repeated five of six prior source-edited acceptances and raised median two-review latency from22.2s to214.9s. A different model family may make different linguistic errors; a mixture-of-experts model may use the local hardware more effectively. Neither accuracy nor speed is assumed from architecture or marketing benchmarks.

Candidate: Gemma4-26B-A4B-it, GGUF Q4_0 from the llama.cpp maintainers, derived from Google's model. Repository `ggml-org/gemma-4-26B-A4B-it-GGUF`, revision `bb4531cda34d1ea09d9814959ed4d5833cf2a4c8`; artifact `gemma-4-26B-A4B-it-Q4_0.gguf`,14618145824bytes, SHA256 `d208665ab1cd3a69f7a9a4bc59430e8448c8093d9b06334f566ac59d6d504a03`. Apache2.0 metadata checked2026-10-03. This is a candidate evaluation, not a claim that new model weights were trained by this project.

Sources: https://huggingface.co/ggml-org/gemma-4-26B-A4B-it-GGUF ; https://ai.google.dev/gemma/docs/capabilities/thinking . Official guidance notes that larger Gemma4 models use an empty thought block with thinking disabled; the pinned template and smoke test must verify compatible final-answer parsing.

## Frozen comparison

- Same128 development cases, original labels, context and target-last prompts as R59/R61. Unchanged anchored-edit parser and exact two-review combination. No benchmark-derived prompt examples or label edits.
- Direct non-thinking generation: temperature0, top_p1, top_k0, min_p0, presence0, repeat1, seed59, max_tokens900. Two fresh original-only reviews. Shared240s case deadline retained for comparable diagnostic coverage; latency is reported separately and does not establish online suitability.
- Same pinned llama.cpp b11146 runtime if architecture/template support is confirmed. Four slots, total context16384, loopback authentication, no public model endpoint. GPU placement may be adjusted only for memory feasibility before the first dataset request, then launch hash frozen. Operational smoke uses independently authored sentences and is never part of accuracy scores.
- All128 results including errors/timeouts retained. No quality-selected retry, source relabeling, cherry-picked hybrid with prior predictions or post-hoc relaxation of exact correction agreement.
- Development gate unchanged: zero accepted source-edited cases and at least29/32 accepted source-clean and29/32 detected source-edited in BOTH languages. Only after this gate passes may the reserved final set be accessed through the selection guard. General app-task/meaning qualification and actual independent review remain required afterward.
- Save hashes, complete outputs locally, pre/post runtime identity, source snapshots, coverage, correction disagreement, invalid-output reasons and latency. Publish aggregates only. Unknown public pretraining exposure and correlated within-model reviews remain limitations.

## Evidence expansion

R65 prepares a blinded development adjudication packet, with source corrections and model verdicts excluded from each initial reviewer form. Original corpus outcomes remain immutable. Empty reviewer identities and decisions stay empty until genuine reviews arrive; model-generated suggestions cannot become human review evidence. This development packet neither consumes nor qualifies the reserved final set.

Decision after completion: report all outcomes. A failed candidate stays inactive. A passed development candidate proceeds to the unchanged holdout process, never directly to production. No claim of100% accuracy for arbitrary future language follows from any finite benchmark.

## Protocol and launch freeze before the development run

The pinned 14,618,145,824-byte artifact passed full SHA256 verification. The b11146 runtime loaded the registered architecture with 31 GPU layers, flash attention on, total context 16384, four slots, explicit reasoning off, reasoning budget 768 and `deepseek` final/reasoning field separation. The latter is the runtime's generic output representation, not a claim that Gemma uses Qwen's internal thought tokens. This combination passed six independently authored protocol requests: system-role/empty-edit transport, an exact Unicode-preserving anchor edit, and both unchanged assessment prompts in each language. All six ended with `stop`, were accepted by the unchanged parser and produced no nonempty reasoning field. These examples are not dataset cases or human-reviewed accuracy evidence.

Evidence: `runs/gemma4-protocol-smoke-v1/report.json`, SHA256 `be4de3b5e3c69a590211f8e6485db2576a9e736edfb567b5d288eb46401ee312`; raw protocol responses and source snapshots are retained beside it. Stable pre/post launch PID 16408; executable SHA256 `7b886298b688509ced3e92b420edd57dd3d665da72c1fc207d7a537be5870352`; arguments SHA256 `cb1dcf7ac6ee1641aca81f7343e3e4e814fcf19bb4cbbd39f201ff4b5b583458`; embedded template SHA256 `6a1015c47ccfcfa67c3b772385bccee357a4d37c3cda37bd202e9047f391ab82`. Observed GPU memory after smoke: 15,628/16,311 MiB. Initial shader/prompt setup caused 12.0s and 23.6s requests; later single-slot protocol requests took 0.7–1.0s. None of these timings establishes full four-slot dataset or online latency.

Focused parser/input/decoding/selection tests passed (9 tests, 53 assertions), report reconstruction/selection tests passed (7 tests, 40 assertions), and the runner/smoke builds passed. Independent code review found no actionable defects. The full registered development run is `writing-edits-gemma4-26b-development-direct-v1`; all results will be retained without quality-selected retry. No final-set case has been accessed.
