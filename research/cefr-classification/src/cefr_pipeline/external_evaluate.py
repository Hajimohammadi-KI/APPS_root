"""Evaluate immutable saved models on separately licensed external corpora."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Sequence

from .evaluation import write_evaluation_bundle
from .preprocess import read_approved_csv
from .schema import CEFR_LEVELS, DataContractError, LearnerTextRecord
from .train_feature import _probability_rows


def _load_run(run_dir: Path) -> dict[str, Any]:
    run_path = run_dir / "run.json"
    if not run_path.is_file():
        raise DataContractError(f"Saved run is missing run.json: {run_dir}")
    payload = json.loads(run_path.read_text(encoding="utf-8"))
    if payload.get("status") != "measured":
        raise DataContractError("External evaluation requires a non-fixture measured run")
    return payload


def _validate_languages(run: dict[str, Any], records: Sequence[LearnerTextRecord]) -> None:
    trained_languages = set(run.get("dataset", {}).get("languages", []))
    observed_languages = {record.language for record in records}
    unsupported = sorted(observed_languages - trained_languages)
    if unsupported:
        raise DataContractError(
            f"Run {run.get('run_id')!r} was not trained for external languages: {unsupported}"
        )


def _predict_feature(
    run_dir: Path, records: Sequence[LearnerTextRecord]
) -> tuple[list[str], list[dict[str, float]], str]:
    try:
        import joblib  # type: ignore[import-not-found]
    except ImportError as error:
        raise RuntimeError("Install with: python -m pip install -e '.[baseline]'") from error

    model_path = run_dir / "model.joblib"
    if not model_path.is_file():
        raise DataContractError(f"Saved feature model is missing: {model_path}")
    pipeline = joblib.load(model_path)
    texts = [record.text for record in records]
    predictions = [str(value) for value in pipeline.predict(texts)]
    classes = [str(value) for value in pipeline.named_steps["classifier"].classes_]
    probabilities = _probability_rows(classes, pipeline.predict_proba(texts))
    return predictions, probabilities, "cpu"


def _predict_transformer(
    run_dir: Path,
    records: Sequence[LearnerTextRecord],
    *,
    batch_size: int,
    maximum_length: int,
) -> tuple[list[str], list[dict[str, float]], str]:
    try:
        import torch  # type: ignore[import-not-found]
        from transformers import (  # type: ignore[import-not-found]
            AutoModelForSequenceClassification,
            AutoTokenizer,
        )
    except ImportError as error:
        raise RuntimeError(
            "Install a matching PyTorch build, then: python -m pip install -e '.[transformer]'"
        ) from error

    model_path = run_dir / "model"
    if not model_path.is_dir():
        raise DataContractError(f"Saved Transformer model is missing: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_path,
        local_files_only=True,
        trust_remote_code=False,
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    architecture_limit = int(getattr(model.config, "max_position_embeddings", maximum_length))
    effective_maximum_length = min(architecture_limit, maximum_length)
    id_to_label = {
        int(index): str(label).upper() for index, label in model.config.id2label.items()
    }
    if tuple(id_to_label.get(index) for index in range(len(CEFR_LEVELS))) != CEFR_LEVELS:
        raise DataContractError("Saved Transformer label order does not match A1-C2")
    predictions: list[str] = []
    probabilities: list[dict[str, float]] = []
    with torch.inference_mode():
        for start in range(0, len(records), batch_size):
            batch = records[start : start + batch_size]
            encoded = tokenizer(
                [record.text for record in batch],
                padding=True,
                truncation=True,
                max_length=effective_maximum_length,
                return_tensors="pt",
            )
            encoded = {name: tensor.to(device) for name, tensor in encoded.items()}
            matrix = torch.softmax(model(**encoded).logits, dim=1).detach().cpu().tolist()
            for row in matrix:
                probability_row = {
                    id_to_label[index]: float(value) for index, value in enumerate(row)
                }
                probabilities.append(probability_row)
                predictions.append(max(probability_row, key=probability_row.__getitem__))
    return predictions, probabilities, str(device)


def evaluate_saved_run(
    *,
    run_dir: Path,
    input_path: Path,
    inventory_path: Path,
    output_dir: Path,
    batch_size: int = 16,
) -> dict[str, Any]:
    """Run inference only: no fitting, threshold tuning, or test-set selection."""

    if batch_size < 1:
        raise DataContractError("batch_size must be positive")
    run = _load_run(run_dir)
    records = read_approved_csv(input_path, inventory_path, required_use="evaluation")
    _validate_languages(run, records)
    catalog_id = str(run.get("model", {}).get("catalog_id", ""))
    if catalog_id == "feature-logreg":
        predictions, probabilities, device = _predict_feature(run_dir, records)
    else:
        predictions, probabilities, device = _predict_transformer(
            run_dir,
            records,
            batch_size=batch_size,
            maximum_length=int(run.get("training", {}).get("max_length", 384)),
        )
    metrics = write_evaluation_bundle(
        output_dir,
        [record.document_id for record in records],
        [record.cefr_level for record in records],
        predictions,
        probabilities,
    )
    receipt = {
        "schema_version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "measured_external",
        "run_id": run["run_id"],
        "model": run["model"],
        "trained_corpora": run["dataset"]["corpora"],
        "external_corpora": sorted({record.corpus_id for record in records}),
        "languages": sorted({record.language for record in records}),
        "record_count": len(records),
        "domain_shift": "reference documents; not learner-proficiency validation",
        "selection_rule": "fixed saved checkpoint; no external-set fitting or threshold tuning",
        "device": device,
        "metrics": metrics,
    }
    (output_dir / "external-run.json").write_text(
        json.dumps(receipt, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return receipt
