"""Fine-tune encoder Transformers for ordinal CEFR text classification.

This module uses lazy imports so data validation and dashboard generation remain
available on CPU-only machines that do not have the Transformer stack installed.
"""

from __future__ import annotations

import csv
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from .evaluation import evaluate_predictions, write_evaluation_bundle
from .run_artifact import create_run_artifact, write_run_artifact
from .schema import CEFR_LEVELS, DataContractError, LearnerTextRecord


@dataclass(frozen=True, slots=True)
class TransformerConfig:
    """Reproducible fine-tuning settings shared by all encoder comparisons."""

    catalog_id: str
    model_id: str
    language_scope: str
    revision: str = "main"
    max_length: int = 384
    learning_rate: float = 2e-5
    train_batch_size: int = 8
    eval_batch_size: int = 16
    gradient_accumulation_steps: int = 2
    epochs: float = 4.0
    weight_decay: float = 0.01
    warmup_ratio: float = 0.10
    early_stopping_patience: int = 2
    random_seed: int = 42
    use_class_weights: bool = True
    gradient_checkpointing: bool = False

    @classmethod
    def from_json(cls, path: Path) -> "TransformerConfig":
        """Load only declared fields so misspelled hyperparameters fail loudly."""

        return cls(**json.loads(path.read_text(encoding="utf-8")))

    def validate(self) -> None:
        """Keep the default search space safe for small learner corpora."""

        if not 32 <= self.max_length <= 8192:
            raise DataContractError("max_length must be between 32 and 8192 tokens")
        if not 0 < self.learning_rate <= 1e-3:
            raise DataContractError("learning_rate must be in (0, 1e-3]")
        if self.train_batch_size < 1 or self.eval_batch_size < 1:
            raise DataContractError("Batch sizes must be positive")
        if not 1 <= self.epochs <= 20:
            raise DataContractError("epochs must be between 1 and 20")
        if not 0 <= self.warmup_ratio < 1:
            raise DataContractError("warmup_ratio must be in [0, 1)")


def _read_split(path: Path) -> list[LearnerTextRecord]:
    """Read the immutable split contract produced by the data stage."""

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [LearnerTextRecord.from_mapping(row) for row in csv.DictReader(handle)]


def _softmax(logits: Any) -> Any:
    """Compute stable probabilities for saved predictions and calibration metrics."""

    import numpy as np  # type: ignore[import-not-found]

    values = np.asarray(logits, dtype=float)
    values = values - values.max(axis=1, keepdims=True)
    exponentials = np.exp(values)
    return exponentials / exponentials.sum(axis=1, keepdims=True)


def _class_weights(records: list[LearnerTextRecord]) -> list[float]:
    """Use inverse-frequency weights while preserving the canonical label order."""

    counts = {level: 0 for level in CEFR_LEVELS}
    for record in records:
        counts[record.cefr_level] += 1
    missing = [level for level, count in counts.items() if count == 0]
    if missing:
        raise DataContractError(f"Training split is missing CEFR levels: {missing}")
    total = len(records)
    return [total / (len(CEFR_LEVELS) * counts[level]) for level in CEFR_LEVELS]


def train_transformer(
    *,
    config: TransformerConfig,
    split_dir: Path,
    output_dir: Path,
    repository_root: Path,
    run_id: str,
) -> dict[str, object]:
    """Fine-tune one encoder with dynamic padding and an untouched final test set."""

    config.validate()
    try:
        import numpy as np  # type: ignore[import-not-found]
        import torch  # type: ignore[import-not-found]
        import torch.nn.functional as functional  # type: ignore[import-not-found]
        from datasets import Dataset  # type: ignore[import-not-found]
        from huggingface_hub import HfApi  # type: ignore[import-not-found]
        from transformers import (  # type: ignore[import-not-found]
            AutoModelForSequenceClassification,
            AutoTokenizer,
            DataCollatorWithPadding,
            EarlyStoppingCallback,
            Trainer,
            TrainingArguments,
            set_seed,
        )
    except ImportError as error:
        raise RuntimeError(
            "Install a matching PyTorch build, then: python -m pip install -e '.[transformer]'"
        ) from error

    manifest_path = split_dir / "split-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not manifest.get("leakage_audit", {}).get("passed"):
        raise DataContractError("Training is blocked because the split leakage audit did not pass")
    records_by_split = {
        name: _read_split(split_dir / f"{name}.csv") for name in ("train", "dev", "test")
    }
    label_to_id = {level: index for index, level in enumerate(CEFR_LEVELS)}
    id_to_label = {index: level for level, index in label_to_id.items()}
    set_seed(config.random_seed)

    # Resolve the floating branch to an immutable Hub SHA and record it in run.json.
    resolved_revision = HfApi().model_info(config.model_id, revision=config.revision).sha
    tokenizer = AutoTokenizer.from_pretrained(config.model_id, revision=resolved_revision)
    model = AutoModelForSequenceClassification.from_pretrained(
        config.model_id,
        revision=resolved_revision,
        num_labels=len(CEFR_LEVELS),
        label2id=label_to_id,
        id2label=id_to_label,
        trust_remote_code=False,
    )
    if config.gradient_checkpointing:
        model.gradient_checkpointing_enable()

    def make_dataset(records: list[LearnerTextRecord]) -> Any:
        """Tokenize with explicit truncation; batch padding is deferred to the collator."""

        dataset = Dataset.from_list(
            [
                {
                    "document_id": record.document_id,
                    "text": record.text,
                    "labels": label_to_id[record.cefr_level],
                }
                for record in records
            ]
        )

        def tokenize(batch: dict[str, list[Any]]) -> dict[str, Any]:
            return tokenizer(batch["text"], truncation=True, max_length=config.max_length)

        tokenized = dataset.map(tokenize, batched=True, desc="Tokenising learner text")
        model_columns = [column for column in ("input_ids", "attention_mask", "token_type_ids", "labels") if column in tokenized.column_names]
        return tokenized.with_format("torch", columns=model_columns, output_all_columns=True)

    datasets = {name: make_dataset(records) for name, records in records_by_split.items()}

    def compute_metrics(prediction: Any) -> dict[str, float]:
        """Expose selection metrics during training without consuming the test set."""

        logits, label_ids = prediction
        predicted_ids = np.argmax(logits, axis=1)
        metrics = evaluate_predictions(
            [id_to_label[int(value)] for value in label_ids],
            [id_to_label[int(value)] for value in predicted_ids],
        )
        return {
            "accuracy": float(metrics["accuracy"]),
            "weighted_f1": float(metrics["weighted_f1"]),
            "macro_f1": float(metrics["macro_f1"]),
            "quadratic_weighted_kappa": float(metrics["quadratic_weighted_kappa"]),
            "adjacent_level_accuracy": float(metrics["adjacent_level_accuracy"]),
        }

    weight_tensor = torch.tensor(_class_weights(records_by_split["train"]), dtype=torch.float32)

    class WeightedTrainer(Trainer):
        """Apply optional class weighting without changing checkpoint architecture."""

        def compute_loss(
            self,
            model: Any,
            inputs: dict[str, Any],
            return_outputs: bool = False,
            num_items_in_batch: Any = None,
        ) -> Any:
            labels = inputs["labels"]
            outputs = model(**inputs)
            weights = weight_tensor.to(outputs.logits.device) if config.use_class_weights else None
            loss = functional.cross_entropy(outputs.logits, labels, weight=weights)
            return (loss, outputs) if return_outputs else loss

    use_cuda = bool(torch.cuda.is_available())
    use_bf16 = bool(use_cuda and torch.cuda.is_bf16_supported())
    arguments = TrainingArguments(
        output_dir=str(output_dir / "checkpoints"),
        learning_rate=config.learning_rate,
        per_device_train_batch_size=config.train_batch_size,
        per_device_eval_batch_size=config.eval_batch_size,
        gradient_accumulation_steps=config.gradient_accumulation_steps,
        num_train_epochs=config.epochs,
        weight_decay=config.weight_decay,
        warmup_ratio=config.warmup_ratio,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_strategy="steps",
        logging_steps=25,
        load_best_model_at_end=True,
        metric_for_best_model="weighted_f1",
        greater_is_better=True,
        save_total_limit=2,
        seed=config.random_seed,
        data_seed=config.random_seed,
        fp16=use_cuda and not use_bf16,
        bf16=use_bf16,
        report_to=[],
    )
    trainer = WeightedTrainer(
        model=model,
        args=arguments,
        train_dataset=datasets["train"],
        eval_dataset=datasets["dev"],
        processing_class=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=config.early_stopping_patience)],
    )
    started = time.perf_counter()
    training_result = trainer.train()
    elapsed_seconds = time.perf_counter() - started
    trainer.save_model(str(output_dir / "model"))
    tokenizer.save_pretrained(str(output_dir / "model"))

    test_output = trainer.predict(datasets["test"], metric_key_prefix="test")
    test_probabilities = _softmax(test_output.predictions)
    predicted_ids = np.argmax(test_probabilities, axis=1)
    probability_rows = [
        {level: float(row[index]) for index, level in enumerate(CEFR_LEVELS)}
        for row in test_probabilities
    ]
    test_records = records_by_split["test"]
    metrics = write_evaluation_bundle(
        output_dir / "test",
        [record.document_id for record in test_records],
        [record.cefr_level for record in test_records],
        [id_to_label[int(value)] for value in predicted_ids],
        probability_rows,
    )
    parameter_count = sum(parameter.numel() for parameter in model.parameters())
    artifact = create_run_artifact(
        run_id=run_id,
        model={
            "catalog_id": config.catalog_id,
            "model_id": config.model_id,
            "architecture": model.config.model_type,
            "requested_revision": config.revision,
            "resolved_revision": resolved_revision,
            "parameter_count": parameter_count,
            "language_scope": config.language_scope,
        },
        dataset={
            "split_manifest": str(manifest_path.resolve()),
            "record_count": manifest["record_count"],
            "languages": sorted(
                {record.language for records in records_by_split.values() for record in records}
            ),
            "corpora": sorted(
                {record.corpus_id for records in records_by_split.values() for record in records}
            ),
        },
        training={
            **asdict(config),
            "elapsed_seconds": elapsed_seconds,
            "best_checkpoint": trainer.state.best_model_checkpoint,
            "best_metric": trainer.state.best_metric,
            "training_loss": training_result.training_loss,
        },
        metrics=metrics,
        repository_root=repository_root,
        fixture_only=bool(manifest.get("fixture_only", False)),
    )
    write_run_artifact(output_dir / "run.json", artifact)
    return artifact
