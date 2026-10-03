# R61 — bounded reasoning, fixed language-assessment gate

## Iteration contract (before inference)

User decision: whether writing may be scored as correct or shown a necessary correction. False acceptance, unnecessary correction, and withholding almost every score all harm this learning flow. No production promotion is authorized by a development-only result.

R59 target-last is the baseline: English accepted source-edited 5/32 and source-clean 30/32; German 1/32 and 15/32. Two same-model passes prevented none of these six final reference disagreements. Exact corrected-text disagreement caused abstention on 7 English and 8 German source-edited targets, but also on 2 source-clean German targets. Relaxing that rule is therefore not a safe shortcut. Original annotations are preserved and not independently adjudicated.

Next experiment: same pinned 27B weights, same original-only prompts and target-last input, same edit schema/parser and exact correction agreement. Replace greedy non-thinking decoding with a **bounded reasoning profile**: enable thinking, server budget 768, max_tokens 1800, temperature 1.0, top_p .95, top_k 20, min_p 0, presence_penalty 1.5, repeat_penalty 1, seed 61. The sampling values follow the publisher's general thinking guidance, not a guarantee of linguistic accuracy. This is a joint decoding-profile test, not an attribution to one sampling parameter. No prompt examples derived from evaluation cases will be added.

Source: https://huggingface.co/Qwen/Qwen3.5-27B#best-practices (checked 2026-10-03). Hardware-constrained reasoning/output/context budgets are much smaller than the publisher's broad recommendations; report them explicitly. Do not represent this as a reproduction of the publisher benchmark.

Data: SAME 128 development cases, same labels, two fresh reviews per case. No held-out bytes are read unless the unchanged development gate passes: zero accepted source-edited cases, at least 29/32 source-clean acceptance and 29/32 detected source-edited cases in BOTH languages. No removal, relabeling, reference corrections, IDs or source annotation types in model input. Holdout and separate independent task/meaning qualification remain required afterward.

Execution: pinned llama.cpp b11146, 58 GPU layers, loopback and existing key-file authentication, 4 slots / 4096 tokens per slot, shared 240s per two-pass case. Save all responses, failures, hashes, source snapshots, runtime pre/post attestation and complete aggregate results. Invalid/truncated/timeout responses abstain and remain in denominators. The exact old parser remains immutable. No retries chosen by correctness, best-of sampling, or combining old and new predictions.

Success and reporting: publish all completed outcomes regardless of quality; compare both coverage and errors, correction disagreements, latency and structural failures. Reasoning text is local only and is never claimed as an explanation or proof of linguistic correctness. Same-model reviews remain correlated. A failed candidate stays disabled.
