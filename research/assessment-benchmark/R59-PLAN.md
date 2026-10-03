# R59: necessary edits and fresh review

Product decision: decide whether learner writing can be assessed without false approval or needless correction. Existing general models remain unapproved. Corpus diagnostics do not qualify exercise meaning, target use or speech.

Observed failure: 147 of the 640 R56 outputs violated the response contract. The direct 9B run also marked nearly every clean target incorrect. Both structural invalidity and real classification error must be measured; fixing JSON alone is not learning-quality improvement.

Changes declared before inference:

1. Return exact original quotations and replacements, with an error category and reason. Application code reconstructs the minimally changed target. A clean target has no edits; it need not be echoed. No post-hoc conversion of unchanged/invalid edits to a correct verdict.
2. A separate fresh review sees only the original target and original context, never the first correction. Compare first-pass and two-pass metrics. Disagreement or invalid output yields uncertain, never an automatic correct verdict. Same-model agreement is correlated, not independent validation.
3. Compare the pinned Qwen3-14B Q5 with Unsloth Qwen3.5-27B Q4, hash and revision fixed before inference. Use deterministic non-thinking decoding and the same prompts. The latter is a hypothesis about capacity, not a proven improvement. Original R56 outputs stay immutable.

Data: the same frozen 128 development cases (32 clean + 32 corrected per language). Keep all original edit labels including spelling/punctuation/word use. No removals based on model results. Holdout 512 remains untouched until a predeclared candidate has zero false accepts, >=29/32 clean accepts and >=29/32 detected errors in BOTH languages. A passing development result is not release approval. Final gate retains >=100 distinct cases/class, zero false acceptance, both coverage lower 95% bounds >=0.9, false-acceptance upper bound <=0.05, and independent human/task review.

Run provenance: model hash, runtime and real server launch identity, code snapshots, config hash, dataset hash, per-call raw result, both phases, failure reasons, latency. Missing outputs stay in denominators. Runtime settings and offload are recorded and differ by capacity; the comparison does not isolate architecture alone.

Risks: noisy/all-edit corpus labels, unknown pretraining contamination, correlated cases and models, stricter agreement lowering correct acceptance. A vetoed correction cannot erase the first call's uncertainty. Model rankings and corpus counts are not guarantees of 90% user fluency.

R58 application change: require a fresh agreeing review for proposed repairs, preserve meaning and non-null target judgments, clear disputed feedback. This changes configuration identity and needs new qualification; production activation is not inferred from tests.

Operational amendment before inspecting 27B quality metrics: the 48-GPU-layer v1 launch used 12,878 of 16,311 MiB and generated only about 4.2 tokens/second per slot. Its incomplete raw outputs are preserved with an interruption record, not used for model selection. Restart v2 with 58 GPU layers; prompts, examples, labels, sampling and quality criteria remain identical. This changes the recorded launch fingerprint. The full v2 result must be reported irrespective of quality.

Conditional follow-up declared while v2 is running: only if the completed 27B run still has context-quotation or no-op failures, test a new development candidate with read-only context first and editable target last. Add explicit no-op/target-only wording and one independently authored correct-target example with erroneous context (`target-writing-input.ts`). Model, sampling, schema, parser, deadline, both original-only reviews, all 128 cases and selection criteria stay unchanged. Compare structural scope errors as well as final quality/coverage; preserve the full baseline. Never salvage invalid edits, convert a veto into approval, change labels, or use holdout to tune this candidate. The helper is prepared but is not part of the running v2 experiment.

Follow-up condition confirmed after v2 completed: 80 of 456 quoted edits came only from context; 40 proposed edits were no-ops. Only 189/256 calls passed the structural parser. Final correct acceptance was 16/32 English and 1/32 German, with false acceptance 1/32 and 0/32. Both languages failed selection. Run v3 with the `target-last` input profile on the same unchanged 58-layer model server. The helper and profile are included in the configuration fingerprint and source snapshots; no raw v2 results are changed.
