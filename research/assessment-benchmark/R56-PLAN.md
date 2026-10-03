# R56 iteration compact — 2026-10-03

Goal: zero observed false acceptance for both English and German, without rejecting or abstaining on all valid language. The product decision is whether a saved learner response may receive a correctness assessment; no model may approve its own release.

Baseline: R55 final offline diagnostic: EN 14/101 false accepts, 55/96 correct accepts; DE 17/128 false accepts, 70/128 correct accepts. Original results stay intact. The three checks use one 4B model and share errors.

Hypotheses: (1) a larger pinned model improves actual grammar discrimination; (2) missing document context contributes to disagreement with corpus corrections; (3) treating every editorial change as a self-contained grammar error misstates the target. Changes to task framing or slices must be explicit and cannot erase the original all-edit metric.

First candidate: official Qwen3-14B Q5_K_M (Apache-2.0), pinned publisher revision and SHA-256, local llama.cpp b11146. No learner data sent externally, no paid service provisioned. Development and untouched evaluation documents must be disjoint from earlier inspected documents; duplicate surfaces must not cross sets. Labels, gold corrections and reference text are never sent to the model. Only original uncorrected context may be supplied.

Gate, fixed before results: existing protocol v3 — 0 false accepts; at least 100 erroneous and 100 clean sentences per language; false-acceptance Wilson upper 95% bound <=5%; correct-acceptance and error-detection lower bounds >=90%. Abstentions and transport failures stay in the denominator. Report grammar-category slices in addition to all-edit results, never in place of them. Public pretraining exposure is unknown. An untouched split is not proof of uncontaminated model training. Corpus results cannot approve app task meaning or independently learned automaticity.

Error analysis: inspect the 31 residual false accepts and their supplied annotations; distinguish intrinsic grammar, orthography, context, and possible editorial ambiguity. Model-authored observations are not human adjudication; original labels stay unchanged.

Serving: failed candidates remain inactive. Changed prompts/model/config need new qualification. Keep both fixed production URLs; publish updated roadmap/results after checks. Learner records are preserved.

Development selection (recorded before the Qwen3.5 comparison): require zero observed false accepts in both languages and at least 29/32 correct accepts and 29/32 detected edited cases in each. This is a preliminary point-estimate screen, not final qualification. If no candidate meets it, do not consume the 512-case holdout. Keep it untouched for a genuinely improved candidate instead of measuring a known failure again. The official all-edit labels remain unchanged.

Second model: Qwen3.5-9B Q5_K_M, Unsloth quantization of the official Qwen3.5-9B base (Apache-2.0), publisher revision `3885219b6810b007914f3a7950a8d1b469d598a5`, SHA-256 `dc2a39aef291f91a9116ad214058da0d86eb648743a124bd8c333787c4b9c91c`. This is not an official Qwen GGUF. Test both direct and thinking modes on the same frozen development sentences, using the publisher's general-task sampling suggestions and an attested 768-token reasoning budget. Separate candidate files preserve the 14B experiment implementations and snapshots.

R57 software change: align the product qualification gate with the stronger sample and confidence requirements, including rejection of duplicate content within an assessment scope. This does not approve any model or establish a universal zero error rate.

Fifth development configuration: after the Qwen3.5 direct run rejected almost every clean sentence, test correction/evidence fields before the verdict, four independently authored short examples, explicit genre/style handling, temperature 0 and no presence penalty in non-thinking mode. Hypothesis: early verdict commitment and repetition penalties are unsuitable for copying minimally corrected text and exact evidence. This is a new candidate and exploratory development tuning; it must not inherit any prior qualification. All-edits labels and the reserved final set stay unchanged.
