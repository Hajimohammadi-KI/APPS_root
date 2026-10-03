# R36: real-data evaluation contract

The product decision is whether an assessment may count toward independent grammar evidence. General proofreading, transcription, pronunciation and fluency are separate targets. A public corpus label never implicitly approves an app task or claims a learner will achieve 90% accuracy.

## Before running candidates

- Download original releases with URLs, SHA-256 and licence records. Keep all raw research data outside app/public and deployment staging.
- Use W&I+LOCNESS for non-commercial research diagnostics only; never ship its text or a trained derivative without resolving its terms. Falko and MERLIN retain their separate attribution/share-alike notices. SpeechOcean762 uses CC BY 4.0.
- Writing unit: original sentence, reference edits, document/source group, published split. Preserve alternative annotators. Absence of annotated edits is a reference label, not proof of universal correctness.
- Audio unit: recording, source speaker, published split, reference transcript and independent ratings. Confirm sample format, audio hash, actual duration, no duplicate speakers across train/test. Do not infer pronunciation from a transcript.
- Freeze selection and model configuration before inspecting test predictions. Public benchmark exposure during model pretraining is unknown; results are external diagnostics, not a clean holdout qualification.
- Human corpus labels are imported as source annotations, never fabricated as our own independent reviewer approvals. Existing app content/evaluator release gates remain intact.

## Diagnostics and acceptance

Writing: report false acceptance of erroneous sentences, rejection of reference-correct sentences, abstention coverage, category/language counts, confusion matrix and Wilson intervals. A useful candidate must both reject errors and accept valid variants; accepting everything is a failed baseline. A preliminary deployment screen requires the upper 95% bound on false acceptance <=5%, lower bound on correct acceptance >=90%, and at least 100 cases of each class per language. Passing that screen is still insufficient for task meaning/target, speech, CEFR or curriculum approval.

Audio: preserve the official speaker split. Measure MAE and Pearson correlation against pronunciation/fluency ratings separately, and against a training-mean predictor. A preliminary screen requires MAE <=1 on the 0–10 scale and correlation >=0.8, but neither grants grammar/automaticity credit. An English/Mandarin-L1 read-speech dataset cannot approve German, Persian-L1 or spontaneous speech. Low signal, malformed audio, missing labels and unsupported domains must abstain.

Fallback: preserve all current practice data and leave unsupported scopes unapproved. Publish measured coverage and limitations in the existing apps, with the original fixed URLs. A microphone test requires a connected browser and explicit microphone permission; dataset audio tests are reported separately.

## Review amendment after v1 diagnostics

The original v1 writing report and predictions remain unchanged. Review identified contradictory verdict/correction pairs; `sensitivity.json` separately measures abstaining on those pairs. Future writing runs reject them. Protocol v2 additionally requires the lower 95% bound of error detection to be at least 90%; abstaining on every erroneous case must not pass. This amendment is stricter and is not an independent retest or threshold optimization.

Audio reporting must match every frozen test ID and speaker, require complete coverage of 2,500 utterances / 125 speakers, reject duplicate IDs and report range violations. Pairwise regression utility screens require at least 100 pairs. Published HuBERT weights were evaluated on the official test set during development, so this run is a diagnostic using the published checkpoint, not independent model qualification. Inference uses one unpadded recording at a time; metrics may differ from padded batch inference. The model card has no explicit weight licence: weights stay local and are not deployed.

## R55 zero-observed-error policy and second review

Protocol v3 requires **zero observed false accepts**, in addition to all v2 sample-size, Wilson-bound, correct-acceptance and error-detection requirements. One false accept fails even if the interval would have passed v2. Zero observed errors is not a population guarantee, and withholding all results cannot pass.

The app candidate now reviews a proposed pass with a second prompt on the original task/response, without seeing the first judgment. A second pass is necessary; disagreement, uncertainty, malformed output, timeout or transport failure produces an unscored assessment. Both calls share one deadline. Both prompts, deterministic sampling and the combination policy are bound into the configuration hash; existing approvals cannot migrate to the changed candidate. No new approval is generated.

`run-writing-pass-review.ts` freezes its configuration and attests model identity before reusing the 453 public-report cases. This is development diagnostics on already-used data, not an independent holdout. Two prompts on one model are correlated, not two independent validators. The task is generic proofreading, so it does not qualify construction use, task meaning, speech or the curriculum. The comparison includes changes to prompts, sampling and aggregation; it cannot isolate the second review's causal effect. All cases, including failures and abstentions, remain in the denominator. Original v1 reports remain intact.

The two-task-review experiment failed: 26/101 erroneous English cases and 38/128 German cases passed. Its outcomes are retained. A third, text-only proofreading check now vetoes a retained pass unless its `correct` verdict preserves the original text (NFC/whitespace normalization only). It sees no task or earlier judgments, cannot award credit or issue corrections, and shares the overall deadline. Its prompt/schema/sampling and the three-stage policy are also pinned into the configuration fingerprint.

`run-writing-text-check.ts` resumes the frozen two-stage outcomes and runs this extra check on every retained pass, leaving all other outcomes unchanged. This is explicitly an offline staged diagnostic, not a full latency retest. The original and failed intermediate outcomes remain available alongside final coverage, correct acceptance and false acceptance. The v1 intermediate report initially hashed an empty cached `BunFile`; the original report is preserved as `public-report.initial.json`, and the corrected report documents a fresh-file hash and verification of every row and aggregate.
