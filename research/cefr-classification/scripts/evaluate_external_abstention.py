"""Check the existing 80%-accuracy/30%-coverage gate on external predictions."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.abstention import select_threshold
from cefr_pipeline.schema import CEFR_LEVELS, DataContractError


def main() -> int:
    results: list[dict[str, object]] = []
    paths = sorted((PROJECT_ROOT / "runs").glob("*/external/*/predictions.csv"))
    if not paths:
        raise RuntimeError("No external predictions found; run external-evaluate first")
    for path in paths:
        with path.open("r", encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        truth = [row["true_label"] for row in rows]
        probabilities = [
            {level: float(row[f"p_{level}"]) for level in CEFR_LEVELS} for row in rows
        ]
        result: dict[str, object] = {
            "run_id": path.parents[2].name,
            "corpus": path.parent.name,
            "sample_count": len(rows),
            "required_retained_accuracy": 0.8,
            "required_coverage": 0.3,
        }
        try:
            policy, report = select_threshold(
                truth,
                probabilities,
                min_retained_accuracy=0.8,
                min_coverage=0.3,
            )
            result.update(
                {
                    "status": "threshold_found",
                    "confidence_threshold": policy.confidence_threshold,
                    "coverage": report["coverage"],
                    "retained_accuracy": report["retained_accuracy"],
                }
            )
        except DataContractError as error:
            result.update({"status": "target_unreachable", "reason": str(error)})
        results.append(result)
    print(json.dumps({"external_abstention_gate": results}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
