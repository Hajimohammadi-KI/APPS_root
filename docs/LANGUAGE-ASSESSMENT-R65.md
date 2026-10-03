# R65 — independent development review and task-linked evidence

R65 prepares evidence collection. It does **not** supply human judgments, qualify a model, change existing corpus labels, or establish 90% learner accuracy. The initial packet contains **128 existing development sentences: 64 English and 64 German**. Human reviews completed at generation: **0**. Task-linked cases collected: **0**. Production model approval remains unchanged.

## Decision and boundaries

The product needs to distinguish a necessary correction from a valid alternative without approving errors or changing a learner's meaning. Corpus annotations and repeated calls to the same model are insufficient independent evidence. This work makes an independent human review auditable before any later candidate-selection decision.

The fixed input is `research/assessment-benchmark/runs/writing-context-data-v2/development.jsonl`, SHA-256 `d1c6c63f7e5e3a2a5c0e8fba0d4647aa7845276c35bb36769102c65721187e1c`. It is the same already-used R59/R61 development set. Preparation reads this file and the new generator's implementation sources only. It does not read held-out sentences or model outputs, change their runners, or overwrite source labels/results. Further judgments remain a separate development analysis; they must not retroactively improve an original run's reported corpus score.

The source material is Write & Improve, Falko and MERLIN. Existing dataset receipts, citations and licence restrictions remain in `research/assessment-benchmark/README.md`. This workflow does not grant redistribution rights. Original context can contain identifying text; treat all review forms as private. Public output contains only aggregate counts, dataset/code hashes and limitations.

## Prepare the private packet

From the workspace root:

```powershell
bun scripts/prepare-r65-human-review.ts development-v1
```

The command creates `artifacts/r65-human-review/development-v1/`, which is already Git-ignored by the workspace's `artifacts/` rule. An existing destination is refused. Use another output name for a later generation; never replace completed human reviews.

| File | Audience and purpose |
|---|---|
| `reviewers/reviewer-a.html`, `reviewer-b.html` | Separate offline human review forms. All identity, judgment and correction fields start blank. |
| `reviewers/packet.json` | Original target and original before/after context, opaque case identifiers and exact case hashes. |
| `reviewers/reviewer-a.json`, `reviewer-b.json` | Blank equivalent JSON forms for reviewers who prefer structured files. |
| `coordinator/mapping.json` | Private map from opaque case IDs to original source IDs and row hashes. Do not send to initial reviewers. |
| `coordinator/adjudication-template.json` | Blank later adjudication form. No disagreement or decision is invented. |
| `task-intake-template.json` | Separate blank intake for real app tasks and original responses; corpus sentences are not automatically inserted. |
| `public-summary.json` | The only packet output suitable for aggregate publication after ordinary review. It contains no sentences or reviewer identifiers. |

The HTML embeds only whitelisted original content. It renders learner text with `textContent`, escapes script delimiters and blocks network connections with a content-security policy. It does not save drafts automatically. Reviewers should download their completed or partial labels before closing. Case order is shuffled by opaque identifiers generated from a fresh packet identifier; neither source label grouping nor original case names are exposed.

Blinding is a distribution procedure, not an access-control guarantee. Give each reviewer only their own initial form and this rubric, keep coordinator files separate, and do not share another reviewer's decisions before initial review. Someone who already inspected these exact annotations or model outputs should disclose that exposure and should not attest to a blinded initial review.

## Corpus review rubric

Judge only the target sentence. Before/after text supplies context and may itself contain errors. Keep the original target immutable.

- **Acceptable:** the wording is grammatical and contextually defensible. Do not treat stylistic preference, a more elegant sentence or a valid regional alternative as a necessary repair.
- **Needs repair:** give the smallest necessary correction and explain the grammatical, orthographic, punctuation or unacceptable-word-use error. Preserve names, facts, polarity, time reference and intended meaning. The exported correction is bound to its exact UTF-8 SHA-256; unchanged or whitespace-only corrections are rejected.
- **Uncertain:** context does not resolve the reading, an acceptable interpretation remains unclear, or the reviewer's competence is insufficient. Insufficient context cannot be recorded as a definite acceptable/repair judgment.

The corpus packet has no actual exercise target or independently supplied intended meaning. It cannot establish task compliance, spontaneous transfer, pronunciation, fluency, or any learner's mastery. Do not translate `acceptable` into the application's task-qualified `pass` label.

Two distinct qualified language reviewers should judge independently. Record reviewer identifiers, language-review roles and actual dates only after real work. Each person attests to independent human review without source corrections or model predictions. Identities and qualifications are locally recorded, **not externally authenticated**.

## Validate a real completed corpus review

Save the person's exported file inside the packet's ignored private directory, then run:

```powershell
bun scripts/validate-r65-human-review.ts artifacts/r65-human-review/development-v1/reviewers/packet.json artifacts/r65-human-review/development-v1/reviewers/completed-a.json validated-a-v1
```

The command validates hashes, case membership, duplication, filled judgments, timestamp ordering, blinding attestations and correction hashes. It writes a private receipt in a new ignored directory and refuses blank forms. It preserves partial-review counts without pretending they cover all 128 cases. A single receipt explicitly leaves independent-pair and adjudication status false. This command does not import adjudication forms or choose a winning label; coordinator reconciliation and independently completed adjudication are still required. No actual human review is generated by the tooling.

Keep original reviews unchanged. Reconcile all 128 cases, retain disagreements and missing judgments, and obtain a third distinct reviewer for unresolved cases. Preserve the original corpus outcome alongside any later human judgment. Report selection/coverage denominators and unresolved cases; never exclude inconvenient sentences or use this repeatedly inspected development set as a final test.

## Separate actual-task intake and two-stage rubric

Fill the blank intake only from an actual recorded app task and original learner answer. Required fields include the exact task ID/definition SHA-256, content version, response and response SHA-256, intended meaning and its provenance/hash, source/rights/consent evidence, and the proposed correction plus its hash when a correction exists. Missing actual task/meaning evidence is a collection gap, not a reason to invent a task for a corpus sentence.

`taskDevelopmentManifest(intake, task, contentVersion)` in `scripts/lib/r65-review-packets.ts` rejects changed bindings, incomplete intake and non-writing/non-practice tasks. The resulting manifest is always development, initially `not_assessed`, with no human review IDs or approval.

Use `taskReviewMaterials(...)` to produce separate stages:

1. **Original stage:** give the reviewer the exact task prompt/target identity, original response and independently recorded intended meaning. Hide proposed corrections, accepted-answer lists and model verdicts. Record `verdict`, `targetObserved`, `meaningPreserved` and a specific note. Save this original-stage evidence file before revealing a proposed correction.
2. **Correction stage:** reveal only the correction bound by `correctionSha256`. Separately judge whether it is grammatical, preserves the intended meaning, expresses the requested target and is minimal rather than an optional rewrite. Use `null` where uncertain. No correction means these correction judgments remain null, with an explanatory note.
3. **Combined evidence:** fill `blankTaskReview(...)` from the same person's real judgments, retaining an `originalJudgmentEvidence` file/hash reference. Do not rewrite the saved initial judgment to agree with the correction. A separate independent reviewer follows the same procedure.

`validateTaskReviews(root, intake, task, contentVersion, reviewRefs, adjudicationRef, now)` verifies both stages and reuses the existing `evidenceFile` and `reviewedManifest` contracts from `scripts/lib/model-benchmark.ts`. It requires two distinct reviewers, rejects self-authorship and changed/stale evidence, and requires a third reviewer for disagreement in either the original-response label or correction judgment. Original-stage content and label must match its sealed evidence; adjudication cannot predate the reviewed judgments.

The adapter always returns `approved: false`. Its reviewed development manifest is not a release artefact or production approval. A final evaluator still needs a separately frozen, independent evaluation covering actual app tasks, valid alternatives, meaning/polarity changes, uncertainty, corrected-output quality and both languages. Speech requires separate audio-grounded human evidence and validation.

## Verification and remaining evidence gaps

Run the synthetic transport/security regressions with:

```powershell
bun test ./scripts/r65-review-packets.test.ts
```

Tests use explicitly synthetic text and reviewer identifiers solely to verify validation paths. They are never included in the real packet or counted as human evidence. Coverage includes label/model-reference blinding, script-injection escaping, immutable hashes, stale/duplicate/blank review rejection, missing task/meaning evidence, exact correction binding, saved original-stage evidence, two independent reviewers and third-person adjudication.

Still missing: actual qualified reviewers and their completed judgments, adjudication of their disagreements, actual task-linked learner intake and consent, final independent evaluation, pronunciation/fluency validation, and evidence that learners achieve the requested outcomes. Preparing these forms does not close those gaps.
