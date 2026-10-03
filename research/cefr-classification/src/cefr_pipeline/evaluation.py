"""Ordinal and calibration-aware evaluation for CEFR predictions."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path
from typing import Mapping, Sequence

from .schema import CEFR_LEVELS, DataContractError


def _validate_labels(labels: Sequence[str], field_name: str) -> None:
    """Reject unknown labels so metric code cannot silently change the task."""

    unknown = sorted(set(labels) - set(CEFR_LEVELS))
    if unknown:
        raise DataContractError(f"Unknown {field_name} CEFR labels: {unknown}")


def confusion_matrix(y_true: Sequence[str], y_pred: Sequence[str]) -> list[list[int]]:
    """Return an A1-to-C2 matrix with true labels on rows and predictions on columns."""

    index = {level: position for position, level in enumerate(CEFR_LEVELS)}
    matrix = [[0 for _ in CEFR_LEVELS] for _ in CEFR_LEVELS]
    for truth, predicted in zip(y_true, y_pred, strict=True):
        matrix[index[truth]][index[predicted]] += 1
    return matrix


def _per_level_metrics(matrix: list[list[int]]) -> dict[str, dict[str, float | int]]:
    """Calculate precision, recall, F1, and support without optional dependencies."""

    result: dict[str, dict[str, float | int]] = {}
    for level_index, level in enumerate(CEFR_LEVELS):
        true_positive = matrix[level_index][level_index]
        false_positive = sum(row[level_index] for row in matrix) - true_positive
        false_negative = sum(matrix[level_index]) - true_positive
        support = sum(matrix[level_index])
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        result[level] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": support,
        }
    return result


def quadratic_weighted_kappa(matrix: list[list[int]]) -> float:
    """Penalise distant CEFR errors more than adjacent-level errors."""

    sample_count = sum(sum(row) for row in matrix)
    if sample_count == 0:
        return 0.0
    true_histogram = [sum(row) for row in matrix]
    predicted_histogram = [sum(matrix[row][column] for row in range(len(CEFR_LEVELS))) for column in range(len(CEFR_LEVELS))]
    denominator_scale = float((len(CEFR_LEVELS) - 1) ** 2)
    observed = 0.0
    expected = 0.0
    for row in range(len(CEFR_LEVELS)):
        for column in range(len(CEFR_LEVELS)):
            weight = ((row - column) ** 2) / denominator_scale
            observed += weight * matrix[row][column]
            expected_count = true_histogram[row] * predicted_histogram[column] / sample_count
            expected += weight * expected_count
    return 1.0 - observed / expected if expected else 1.0


def expected_calibration_error(
    y_true: Sequence[str],
    y_pred: Sequence[str],
    probabilities: Sequence[Mapping[str, float]],
    *,
    bin_count: int = 10,
) -> float:
    """Compare confidence with empirical correctness across fixed-width bins."""

    if len(probabilities) != len(y_true):
        raise DataContractError("Probability row count does not match predictions")
    bins: list[list[tuple[float, bool]]] = [[] for _ in range(bin_count)]
    for truth, predicted, row in zip(y_true, y_pred, probabilities, strict=True):
        missing = [level for level in CEFR_LEVELS if level not in row]
        if missing:
            raise DataContractError(f"Probability row is missing levels: {missing}")
        numeric = [float(row[level]) for level in CEFR_LEVELS]
        if any(value < 0 or value > 1 or not math.isfinite(value) for value in numeric):
            raise DataContractError("Probabilities must be finite values between 0 and 1")
        if abs(sum(numeric) - 1.0) > 1e-4:
            raise DataContractError("Each probability row must sum to 1")
        confidence = float(row[predicted])
        bin_index = min(int(confidence * bin_count), bin_count - 1)
        bins[bin_index].append((confidence, truth == predicted))
    total = max(len(y_true), 1)
    error = 0.0
    for bucket in bins:
        if not bucket:
            continue
        average_confidence = sum(item[0] for item in bucket) / len(bucket)
        accuracy = sum(1 for item in bucket if item[1]) / len(bucket)
        error += len(bucket) / total * abs(accuracy - average_confidence)
    return error


def evaluate_predictions(
    y_true: Sequence[str],
    y_pred: Sequence[str],
    probabilities: Sequence[Mapping[str, float]] | None = None,
) -> dict[str, object]:
    """Compute the complete minimum metric set for one traceable test run."""

    if not y_true or len(y_true) != len(y_pred):
        raise DataContractError("Truth and prediction labels must be non-empty and equal in length")
    _validate_labels(y_true, "truth")
    _validate_labels(y_pred, "predicted")
    matrix = confusion_matrix(y_true, y_pred)
    per_level = _per_level_metrics(matrix)
    sample_count = len(y_true)
    accuracy = sum(truth == predicted for truth, predicted in zip(y_true, y_pred, strict=True)) / sample_count
    weighted_f1 = sum(
        float(per_level[level]["f1"]) * int(per_level[level]["support"]) for level in CEFR_LEVELS
    ) / sample_count
    macro_f1 = sum(float(per_level[level]["f1"]) for level in CEFR_LEVELS) / len(CEFR_LEVELS)
    ordinal_index = {level: index for index, level in enumerate(CEFR_LEVELS)}
    adjacent_accuracy = sum(
        abs(ordinal_index[truth] - ordinal_index[predicted]) <= 1
        for truth, predicted in zip(y_true, y_pred, strict=True)
    ) / sample_count
    return {
        "sample_count": sample_count,
        "accuracy": accuracy,
        "weighted_f1": weighted_f1,
        "macro_f1": macro_f1,
        "quadratic_weighted_kappa": quadratic_weighted_kappa(matrix),
        "adjacent_level_accuracy": adjacent_accuracy,
        "expected_calibration_error": (
            expected_calibration_error(y_true, y_pred, probabilities) if probabilities is not None else None
        ),
        "labels": list(CEFR_LEVELS),
        "confusion_matrix": matrix,
        "per_level": per_level,
    }


def write_evaluation_bundle(
    output_dir: Path,
    document_ids: Sequence[str],
    y_true: Sequence[str],
    y_pred: Sequence[str],
    probabilities: Sequence[Mapping[str, float]] | None,
) -> dict[str, object]:
    """Write auditable predictions beside their aggregate evaluation."""

    if len(document_ids) != len(y_true):
        raise DataContractError("Document ID count does not match evaluation rows")
    metrics = evaluate_predictions(y_true, y_pred, probabilities)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "evaluation.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    fieldnames = ["document_id", "true_label", "predicted_label", *[f"p_{level}" for level in CEFR_LEVELS]]
    with (output_dir / "predictions.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for index, (document_id, truth, predicted) in enumerate(
            zip(document_ids, y_true, y_pred, strict=True)
        ):
            row: dict[str, object] = {
                "document_id": document_id,
                "true_label": truth,
                "predicted_label": predicted,
            }
            if probabilities is not None:
                row.update({f"p_{level}": probabilities[index][level] for level in CEFR_LEVELS})
            writer.writerow(row)
    return metrics

