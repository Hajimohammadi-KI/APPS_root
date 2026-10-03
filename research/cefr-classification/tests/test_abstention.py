"""Abstention tests use hand-checkable confidence rows rather than synthetic model output."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.abstention import AbstentionPolicy, evaluate_policy, select_threshold
from cefr_pipeline.schema import CEFR_LEVELS, DataContractError


def _row(best_level: str, confidence: float) -> dict[str, float]:
    remainder = (1.0 - confidence) / (len(CEFR_LEVELS) - 1)
    row = {level: remainder for level in CEFR_LEVELS}
    row[best_level] = confidence
    return row


class AbstentionPolicyTests(unittest.TestCase):
    def test_confident_prediction_is_retained(self) -> None:
        policy = AbstentionPolicy(0.5)
        self.assertEqual(policy.decide(_row("B1", 0.9)), "B1")

    def test_uncertain_prediction_abstains(self) -> None:
        policy = AbstentionPolicy(0.5)
        self.assertIsNone(policy.decide(_row("B1", 0.3)))

    def test_threshold_out_of_range_rejected(self) -> None:
        with self.assertRaises(DataContractError):
            AbstentionPolicy(1.5)

    def test_unknown_level_rejected(self) -> None:
        policy = AbstentionPolicy(0.1)
        with self.assertRaises(DataContractError):
            policy.decide({"A1": 0.5, "Z9": 0.5})


class EvaluatePolicyTests(unittest.TestCase):
    def test_perfect_confident_predictions_have_full_coverage_and_accuracy(self) -> None:
        y_true = ["A1", "B2", "C1"]
        probabilities = [_row(level, 0.95) for level in y_true]
        report = evaluate_policy(y_true, probabilities, AbstentionPolicy(0.5))
        self.assertEqual(report["coverage"], 1.0)
        self.assertEqual(report["retained_accuracy"], 1.0)
        self.assertEqual(report["abstained_count"], 0)
        self.assertIsNone(report["abstained_accuracy_if_forced"])

    def test_low_confidence_examples_abstain_and_are_tracked_separately(self) -> None:
        y_true = ["A1", "B2"]
        probabilities = [_row("A1", 0.95), _row("B2", 0.3)]
        report = evaluate_policy(y_true, probabilities, AbstentionPolicy(0.5))
        self.assertEqual(report["coverage"], 0.5)
        self.assertEqual(report["retained_accuracy"], 1.0)
        self.assertEqual(report["abstained_count"], 1)
        # The abstained example's top guess (B2) was actually correct, so forced
        # accuracy on that slice is 1.0 even though the policy declined to answer.
        self.assertEqual(report["abstained_accuracy_if_forced"], 1.0)

    def test_mismatched_lengths_rejected(self) -> None:
        with self.assertRaises(DataContractError):
            evaluate_policy(["A1"], [], AbstentionPolicy(0.5))

    def test_empty_input_rejected(self) -> None:
        with self.assertRaises(DataContractError):
            evaluate_policy([], [], AbstentionPolicy(0.5))


class SelectThresholdTests(unittest.TestCase):
    def test_picks_lowest_threshold_meeting_both_floors(self) -> None:
        # Four confident-and-correct rows, one confident-and-wrong outlier at 0.6.
        y_true = ["A1", "A1", "A1", "A1", "B2"]
        probabilities = [
            _row("A1", 0.95),
            _row("A1", 0.9),
            _row("A1", 0.85),
            _row("A1", 0.8),
            _row("C1", 0.6),
        ]
        policy, report = select_threshold(
            y_true, probabilities, min_retained_accuracy=0.99, min_coverage=0.5, step=0.05
        )
        # Excluding the 0.6-confidence wrong row requires a threshold above it.
        self.assertGreater(policy.confidence_threshold, 0.6)
        self.assertEqual(report["retained_accuracy"], 1.0)

    def test_impossible_floor_raises(self) -> None:
        y_true = ["A1", "B2"]
        probabilities = [_row("A1", 0.99), _row("C1", 0.99)]
        with self.assertRaises(DataContractError):
            select_threshold(y_true, probabilities, min_retained_accuracy=1.0, min_coverage=1.0, step=0.1)


if __name__ == "__main__":
    unittest.main()
