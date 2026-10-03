"""Metric tests use hand-checkable labels rather than synthetic performance claims."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.evaluation import evaluate_predictions
from cefr_pipeline.schema import CEFR_LEVELS, DataContractError


class EvaluationTests(unittest.TestCase):
    def test_perfect_predictions_score_one(self) -> None:
        probabilities = [
            {candidate: 1.0 if candidate == level else 0.0 for candidate in CEFR_LEVELS}
            for level in CEFR_LEVELS
        ]
        metrics = evaluate_predictions(CEFR_LEVELS, CEFR_LEVELS, probabilities)
        self.assertEqual(metrics["accuracy"], 1.0)
        self.assertEqual(metrics["weighted_f1"], 1.0)
        self.assertEqual(metrics["macro_f1"], 1.0)
        self.assertEqual(metrics["quadratic_weighted_kappa"], 1.0)
        self.assertEqual(metrics["adjacent_level_accuracy"], 1.0)
        self.assertEqual(metrics["expected_calibration_error"], 0.0)

    def test_adjacent_accuracy_distinguishes_near_and_far_errors(self) -> None:
        metrics = evaluate_predictions(("A1", "B1", "C2"), ("A2", "C2", "C1"))
        self.assertAlmostEqual(metrics["adjacent_level_accuracy"], 2 / 3)
        self.assertIsNone(metrics["expected_calibration_error"])

    def test_invalid_probability_distribution_fails(self) -> None:
        invalid = [{level: 0.2 for level in CEFR_LEVELS}]
        with self.assertRaises(DataContractError):
            evaluate_predictions(("A1",), ("A1",), invalid)


if __name__ == "__main__":
    unittest.main()

