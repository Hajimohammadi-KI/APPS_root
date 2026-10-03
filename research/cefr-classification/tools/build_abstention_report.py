"""Apply the abstention policy to every measured run's held-out test predictions.

Reads runs/<run_id>/test/predictions.csv (written by every train-feature and
train-transformer run) and, for each one, selects the loosest confidence
threshold that reaches a target retained accuracy at a target minimum
coverage. Writes one consolidated, source-backed report — this is measured
evidence from the actual test sets, not a proposed policy.
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.abstention import evaluate_policy, select_threshold  # noqa: E402
from cefr_pipeline.schema import CEFR_LEVELS  # noqa: E402


def load_predictions(path: Path) -> tuple[list[str], list[dict[str, float]]]:
    y_true: list[str] = []
    probabilities: list[dict[str, float]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            y_true.append(row["true_label"])
            probabilities.append({level: float(row[f"p_{level}"]) for level in CEFR_LEVELS})
    return y_true, probabilities


def main() -> int:
    runs_dir = PROJECT_ROOT / "runs"
    target_accuracy = 0.80
    target_coverage = 0.30
    report: dict[str, object] = {
        "policy_kind": "max-probability confidence threshold",
        "selection_rule": (
            f"loosest threshold with retained_accuracy >= {target_accuracy:.0%} "
            f"and coverage >= {target_coverage:.0%} on the held-out test set"
        ),
        "runs": {},
    }
    for predictions_path in sorted(runs_dir.glob("*/test/predictions.csv")):
        run_id = predictions_path.parent.parent.name
        y_true, probabilities = load_predictions(predictions_path)
        try:
            policy, selected = select_threshold(
                y_true,
                probabilities,
                min_retained_accuracy=target_accuracy,
                min_coverage=target_coverage,
                step=0.01,
            )
            entry = {"status": "threshold_found", **selected}
        except Exception as error:  # DataContractError: no threshold clears both floors
            # Report the always-answer baseline and the best accuracy actually
            # achievable at the coverage floor, so a failed target still leaves
            # constructive evidence instead of a bare "no".
            from cefr_pipeline.abstention import AbstentionPolicy

            baseline = evaluate_policy(y_true, probabilities, AbstentionPolicy(0.0))
            best_at_min_coverage = max(
                (
                    evaluate_policy(y_true, probabilities, AbstentionPolicy(round(0.01 * step, 2)))
                    for step in range(101)
                ),
                key=lambda candidate: (
                    candidate["retained_accuracy"]
                    if candidate["coverage"] >= target_coverage and candidate["retained_accuracy"] is not None
                    else -1.0
                ),
            )
            entry = {
                "status": "target_unreachable",
                "reason": str(error),
                "always_answer_baseline": baseline,
                "best_achievable_at_min_coverage": best_at_min_coverage,
            }
        report["runs"][run_id] = entry

    output_path = PROJECT_ROOT / "dashboard" / "abstention-policy.json"
    output_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"stage": "abstention-policy", "output": str(output_path), "runs": len(report["runs"])}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
