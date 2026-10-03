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
