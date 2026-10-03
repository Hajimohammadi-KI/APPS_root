# CEFR learner-text classification

This workspace implements the Phase 5 strategy in the APPS_root Product Quality Roadmap. It trains **text-difficulty classifiers** for English and German learner writing; it does not infer a learner's complete proficiency from one text.

## Current evidence state

- Data contract, conservative cleaning, corpus approval gate, group-aware splitting, leakage audit, feature baseline, Transformer trainer, ordinal/calibration metrics, run artifacts, and dashboard generator are implemented.
- Seven saved checkpoints covering all six catalog model types are measured on approved Ace-CEFR and MERLIN data.
- Independent, evaluation-only UniversalCEFR ELG corpora were pinned for English and German. Nine saved-checkpoint/language evaluations are published in `dashboard/external-evaluation-summary.json`; every result shows a large reference-domain generalisation loss, so product integration is blocked by evidence rather than merely unfinished.
- `tests/fixtures/synthetic-learner-texts.csv` is generated test scaffolding. Its scores are labelled `fixture` and excluded from the dashboard.
- No paid API is required. The feature baseline runs on CPU. Transformer experiments use local open-source checkpoints and can be run on owned hardware or a free GPU session when available.

Read [the implementation guide](docs/IMPLEMENTATION-GUIDE.md) before approving or downloading a corpus.

## Quick start

```powershell
cd D:\APPS_root_new\research\cefr-classification
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[baseline]"

# This source is fixture-only and proves software behavior, not model quality.
.\.venv\Scripts\cefr-pipeline.exe prepare `
  --input tests\fixtures\synthetic-learner-texts.csv `
  --inventory catalog\corpus-inventory.json `
  --output data\processed\fixture-v1 `
  --seed 42

.\.venv\Scripts\cefr-pipeline.exe train-feature `
  --splits data\processed\fixture-v1 `
  --output runs\fixture-feature-v1 `
  --repo-root D:\APPS_root_new `
  --run-id fixture-feature-v1
```

Transformer dependencies are deliberately separate:

```powershell
# Install the official PyTorch build appropriate for CPU or CUDA first.
.\.venv\Scripts\python.exe -m pip install -e ".[transformer]"

.\.venv\Scripts\cefr-pipeline.exe train-transformer `
  --config configs\english-modernbert.json `
  --splits data\processed\approved-english-v1 `
  --output runs\english-modernbert-seed42 `
  --repo-root D:\APPS_root_new `
  --run-id english-modernbert-seed42
```

## Independent external evaluation

The external datasets are reference documents, not learner writing. They test
cross-corpus and cross-domain robustness and must not be described as learner
proficiency validation. Raw data, predictions, and weights stay ignored; the
checked-in summary contains only provenance and aggregate metrics.

```powershell
python scripts\fetch_external_corpora.py

cefr-pipeline external-evaluate `
  --run runs\english-roberta-seed42 `
  --input data\processed\external-evaluation-v1\universalcefr-elg-en.csv `
  --inventory catalog\corpus-inventory.json `
  --output runs\english-roberta-seed42\external\universalcefr-elg-en

# Re-run the product abstention gate over every external prediction file.
python scripts\evaluate_external_abstention.py
```

## Repository contract

- `catalog/corpus-inventory.json`: approval and licence gate. Unknown means blocked.
- `catalog/model-catalog.json`: official facts, derived parameter estimates, and clearly labelled hardware estimates.
- `configs/`: identical fine-tuning recipes for the encoder comparison.
- `src/cefr_pipeline/`: preprocessing, splitting, training, evaluation, run, and dashboard code.
- `runs/**/run.json`: one traceable non-fixture experiment record. Model weights and predictions remain local and ignored by Git.
- `dashboard/artifact.json`: canonical source-backed snapshot. It shows `N/A` until measured runs exist.
- `dashboard/external-evaluation-summary.json`: pinned external-corpus provenance, aggregate metrics, and the evidence-based no-ship decision.
- `dashboard/cefr-model-dashboard.html`: self-contained, responsive dashboard built from the exact canonical payload.

## Package and verify the dashboard

The packaging wrapper reuses the free Data Analytics portable builder and its
official browser verifier. Its small CSS compatibility layer only contains the
shared reader inside narrow Windows viewports; it does not alter evidence or
dashboard interactions.

```powershell
node --test tests\package_dashboard.test.mjs
node tools\package_dashboard.mjs `
  --input dashboard\artifact.json `
  --output dashboard\cefr-model-dashboard.html `
  --plugin-root "C:\Users\Elahe\.codex\plugins\cache\openai-curated-remote\data-analytics\0.2.8-13ceeea1f599"
```

Do not publish a candidate unless the receipt says `ok: true` and reports both
desktop (`1440`) and mobile (`390`) viewports.
