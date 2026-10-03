# Step-by-step CEFR classifier implementation guide

## 1. Product and research decision

Use separate bounded systems:

1. **CEFR text classifier** — estimates the difficulty of one text as A1–C2 probabilities.
2. **Grammar/error analyzer** — identifies only high-confidence, teachable errors and proposes a repair task.
3. **Exercise generator** — retrieves approved rules/examples, generates structured exercises, and publishes only validator-approved output.
4. **Learner model** — combines repeated Reading, Writing, Grammar, Vocabulary, Speaking, recall, and teacher evidence over time.

Do not train one LLM to perform all four jobs. Do not display “you are B1” after one writing sample. The product response should state a range, confidence, and whether more evidence is needed.

## 2. Model portfolio and selection order

| Candidate | Language role | Approximate size | Context | Decision |
| --- | --- | ---: | ---: | --- |
| TF-IDF + style Logistic Regression | English, German, pooled | fitted vocabulary | N/A | Required transparent baseline |
| `answerdotai/ModernBERT-base` | English | 149M official | 8,192 | Primary English candidate |
| `FacebookAI/roberta-base` | English | ~125M derived | 512 | Established English comparator |
| `deepset/gbert-base` | German | ~110M derived | 512 | Primary German candidate |
| `FacebookAI/xlm-roberta-base` | 94 listed languages | ~278M derived | 512 | Broad multilingual baseline |
| `microsoft/mdeberta-v3-base` | 16 listed languages | 276M official components | 512 | Focused multilingual comparator |

Parameter sources and the distinction between official facts and architecture-derived approximations are stored in `catalog/model-catalog.json`.

### mDeBERTa-v3 versus XLM-RoBERTa

Both are large base encoders because their approximately 250k-token vocabularies dominate the embedding matrix. XLM-R lists much broader language coverage (94 languages on its current model page); mDeBERTa lists 16, including English and German, and combines an 86M backbone with about 190M embedding parameters. That does **not** prove either is better for learner CEFR text.

Run both on the same immutable English/German split manifests and compare:

- weighted and macro F1;
- per-level F1, especially A1/A2 and C1/C2;
- quadratic weighted kappa and adjacent-level accuracy;
- calibration error and abstention coverage;
- English/German and genre slices;
- training time, peak memory, and inference latency.

Select XLM-R when broad cross-lingual transfer is the product requirement and measured CEFR results justify the cost. Select mDeBERTa when its focused multilingual pretraining and disentangled attention produce a reproducible advantage. If GBERT wins German and ModernBERT wins English, keep separate production models; operational simplicity is not worth a measured learning-quality regression.

## 3. Corpus approval before download

Every source must receive a row in `catalog/corpus-inventory.json` with:

- exact corpus and version/snapshot identity;
- source URL and original publisher;
- licence, attribution, redistribution, derivative-model, and commercial-use assessment;
- permitted project uses;
- learner consent/privacy status and PII handling;
- language, genre, prompt, learner, and label provenance;
- explicit `approval_status=approved` only after review.

The loader requires `approval_status=approved`, `licence_status=verified`, and `allowed_uses` containing `training`. Missing or ambiguous information blocks ingestion. Candidate status today:

- MERLIN German is a strong learner-writing candidate, but project approval and attribution/share-alike handling are still required.
- UniversalCEFR is an index; approve each underlying corpus separately.
- Kaggle CEFR Levelled English Texts remains blocked until every source and label path is audited.
- TOEFL-CEFR vocabulary and CEFR-J are support resources, not substitutes for learner-writing test data.
- DAFlex may support German lexical features after its download/redistribution terms are verified.

## 4. Input data contract

Required CSV fields:

| Field | Meaning |
| --- | --- |
| `document_id` | Stable unique text identifier |
| `corpus_id` | Exact inventory key |
| `text` | Original learner writing |
| `cefr_level` | A1, A2, B1, B2, C1, or C2 |
| `language` | `en` or `de` |

Recommended leakage/control fields:

| Field | Meaning |
| --- | --- |
| `learner_id` | Pseudonymous writer group |
| `prompt_id` | Writing task group |
| `source_group_id` | Source document/session/exam group |
| `genre` | Email, essay, short answer, narrative, etc. |
| `licence_id` | Licence/provenance reference |
| `source_url` | Publisher evidence |
| `is_fixture` | Must be true only for generated tests |

Do not put names, email addresses, phone numbers, student numbers, or raw institutional IDs into version control.

## 5. Preprocessing learner text for BERT-family models

The pipeline performs only transformations that do not erase learning evidence:

1. Decode UTF-8 and normalize Unicode with NFKC.
2. Normalize line endings and repeated horizontal whitespace.
3. Preserve meaningful paragraph boundaries.
4. Redact basic email and phone patterns.
5. Reject empty text and invalid language/CEFR values.
6. Preserve spelling errors, grammar errors, punctuation, capitalization, word order, and code-switching.
7. Create a conservative normalized fingerprint to group duplicate texts.

Never auto-correct, translate, lowercase the stored source, remove stop words, stem, or lemmatize before Transformer tokenization. Those operations can delete exactly the evidence a learner-text classifier needs.

Tokenization occurs after splitting:

```python
tokenizer(batch["text"], truncation=True, max_length=384)
```

Padding is dynamic per batch through `DataCollatorWithPadding`; do not pad the entire corpus to a fixed maximum in advance. The initial benchmark uses 384 tokens so all encoder candidates receive the same information and memory comparison. Run a separate documented long-text experiment before using ModernBERT’s 8,192-token limit.

Record truncation rate and original/tokenized length distributions in the first real corpus audit. If important genres are frequently truncated, compare chunk aggregation or a longer maximum as a new experiment rather than silently changing the benchmark.

## 6. Leakage-safe train/dev/test partitioning

The default split is 80/10/10 with seed 42. Connected-component grouping keeps records together when they share:

- `learner_id`;
- `prompt_id`;
- `source_group_id`;
- canonical text fingerprint.

The algorithm then balances group size and CEFR distribution. It refuses to continue if leakage controls leave fewer than three independent groups or any partition is empty. `split-manifest.json` records ratios, seed, counts, CEFR distribution, group fields, fixture state, and overlap audit.

For cross-corpus evaluation, train on approved corpora A+B and keep corpus C untouched as an external test set. Do not tune hyperparameters on the cross-corpus test result.

## 7. Required feature baseline

The CPU baseline combines:

- word TF-IDF 1–2 grams;
- character-within-word TF-IDF 3–5 grams;
- character count, word count, words per sentence, characters per word;
- lexical diversity and long-word ratio;
- uppercase, digit, and punctuation ratios;
- balanced one-vs-rest Logistic Regression.

This baseline detects data leakage and proves whether expensive models add value. A Transformer that cannot reproducibly exceed it on cross-corpus and calibration evidence should not ship merely because it is newer.

## 8. Fine-tuning ModernBERT for CEFR

Use `configs/english-modernbert.json`:

```powershell
.\.venv\Scripts\cefr-pipeline.exe train-transformer `
  --config configs\english-modernbert.json `
  --splits data\processed\approved-english-v1 `
  --output runs\english-modernbert-seed42 `
  --repo-root D:\APPS_root_new `
  --run-id english-modernbert-seed42
```

The trainer:

1. verifies the split leakage audit;
2. resolves `main` to an immutable Hugging Face commit SHA;
3. loads `AutoModelForSequenceClassification` with six ordered labels;
4. tokenizes with truncation and dynamic padding;
5. applies inverse-frequency class weights;
6. evaluates dev after each epoch;
7. early-stops on weighted F1 and retains at most two checkpoints;
8. predicts the untouched test split once;
9. writes probabilities, per-document predictions, metrics, model revision, Git revision, time, and hardware.

ModernBERT requires Transformers 4.48 or newer. Flash Attention is optional, hardware-dependent, and not part of the reproducible baseline. Do not enable it unless the environment supports it and the run artifact records the change.

## 9. ModernBERT versus RoBERTa protocol

Keep every variable fixed except the model configuration:

- same corpus snapshot and split manifest;
- same maximum length (384);
- learning rate 2e-5;
- batch size 8, evaluation batch size 16;
- gradient accumulation 2 (effective train batch 16 per device);
- 4 epochs maximum;
- weight decay 0.01;
- warmup ratio 0.10;
- early stopping patience 2;
- class weighting enabled;
- seeds 42, 43, and 44 for the final comparison.

Report mean and standard deviation across seeds after the first pipeline validation. ModernBERT’s longer context is a capability, not a fair-comparison advantage unless both the task and experiment explicitly test long writing.

## 10. LLaMA/LoRA decision

Do not use a decoder-only LLaMA model as the first CEFR classifier. It requires more memory, slower training/inference, more complex calibration, and a separate licence/model-access review. Encoder models are a better fit for bounded six-class classification.

Add a LLaMA QLoRA benchmark only after:

- the feature and encoder baselines are stable;
- a suitable open model and licence are approved;
- a 4-bit CUDA environment is reproducible;
- output logits are calibrated on dev without touching test;
- its added cost is compared against measurable cross-corpus improvement.

LLaMA-style models are more promising later for retrieval-grounded explanation and exercise generation, with JSON schemas, grammar validators, CEFR constraints, source citations, and teacher approval.

## 11. Evaluation and decision thresholds

Every run records:

- exact accuracy;
- weighted F1 and macro F1;
- per-level precision, recall, F1, and support;
- A1–C2 confusion matrix;
- quadratic weighted kappa;
- adjacent-level accuracy;
- expected calibration error;
- training time and hardware.

Also aggregate per language, corpus, genre, prompt family, and text-length band. Never claim generalization from one within-corpus split.

Initial product abstention policy (tune on dev, then freeze):

- fewer than 30 words: request a longer sample;
- maximum probability below 0.55: return “uncertain”;
- top-two probability gap below 0.12: return a range such as B1–B2;
- otherwise return predicted text level, probability distribution, confidence label, and evidence limitations.

These are starting policy values, not validated truths. Record coverage versus accuracy as thresholds change.

## 12. Dashboard workflow

Generate canonical dashboard JSON:

```powershell
.\.venv\Scripts\cefr-pipeline.exe build-dashboard `
  --models catalog\model-catalog.json `
  --corpora catalog\corpus-inventory.json `
  --runs runs `
  --output dashboard\artifact.json
```

The dashboard includes:

- source-backed parameter/language/context/licence comparison;
- planning hardware clearly separated from measured hardware;
- sortable accuracy, weighted F1, training time, and per-level F1 tables;
- corpus approval and licence decisions;
- visible partial/access notices;
- automatic fixture-run exclusion.

Package the self-contained HTML and run the same official browser verifier:

```powershell
node --test tests\package_dashboard.test.mjs
node tools\package_dashboard.mjs `
  --input dashboard\artifact.json `
  --output dashboard\cefr-model-dashboard.html `
  --plugin-root "C:\Users\Elahe\.codex\plugins\cache\openai-curated-remote\data-analytics\0.2.8-13ceeea1f599"
```

The wrapper calls the official portable builder, chart extractor, and verifier.
It adds one bounded CSS compatibility rule for an 8px shared-reader overflow on
Windows Chromium; it does not rewrite the canonical payload. The checked-in
artifact passed source-dialog keyboard interaction and responsive checks at
1440px and 390px. Real benchmark metrics still remain `N/A` until an approved,
non-fixture corpus is trained.

## 13. English and German rollout

1. Approve English learner-writing corpora and run the feature baseline.
2. Compare ModernBERT and RoBERTa across three seeds.
3. Hold out a different English corpus for external testing.
4. Approve MERLIN-DE (and any second German corpus) with attribution/share-alike handling.
5. Run German feature baseline and GBERT.
6. Compare pooled English+German XLM-R and mDeBERTa on identical splits and language slices.
7. Select separate or shared production models from measured quality/cost evidence.
8. Add calibration and abstention to a versioned prediction API.
9. Run teacher review of explanations and learner comprehension before product release.
10. Only then start the German grammar coach for article/gender, case, case-governing prepositions, and main/subordinate-clause verb position.

## 14. Sources

- ModernBERT model card: <https://huggingface.co/answerdotai/ModernBERT-base>
- RoBERTa model card: <https://huggingface.co/FacebookAI/roberta-base>
- GBERT model card: <https://huggingface.co/deepset/gbert-base>
- XLM-RoBERTa model card: <https://huggingface.co/FacebookAI/xlm-roberta-base>
- mDeBERTa-v3 model card: <https://huggingface.co/microsoft/mdeberta-v3-base>
- UniversalCEFR: <https://universalcefr.github.io/>
- MERLIN: <https://www.merlin-platform.eu/>
- CEFR-J: <https://github.com/openlanguageprofiles/olp-en-cefrj>
- DAFlex: <https://cental.uclouvain.be/cefrlex/daflex/>
