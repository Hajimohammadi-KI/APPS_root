"""Confidence-based abstention: decline a prediction instead of reporting a false exact level.

Phase 5 requires that short or uncertain texts receive a range or a request for
more evidence, not a fabricated exact CEFR level. This module turns that
requirement into a threshold rule validated against held-out predictions,
rather than an unmeasured policy statement.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence

from .schema import CEFR_LEVELS, DataContractError


@dataclass(frozen=True, slots=True)
class AbstentionPolicy:
    """Abstain when the model's own top probability falls below the threshold."""

    confidence_threshold: float

    def __post_init__(self) -> None:
        if not 0.0 <= self.confidence_threshold <= 1.0:
            raise DataContractError("confidence_threshold must be in [0, 1]")

    def decide(self, probabilities: Mapping[str, float]) -> str | None:
        """Return the top predicted level, or None to abstain and request more evidence."""

        unknown = sorted(set(probabilities) - set(CEFR_LEVELS))
        if unknown:
            raise DataContractError(f"Unknown CEFR levels in probabilities: {unknown}")
        best_level = max(probabilities, key=lambda level: probabilities[level])
        if probabilities[best_level] < self.confidence_threshold:
            return None
        return best_level


def evaluate_policy(
    y_true: Sequence[str],
    probabilities: Sequence[Mapping[str, float]],
    policy: AbstentionPolicy,
) -> dict[str, object]:
    """Report coverage and accuracy split between retained and abstained predictions."""

    if len(y_true) != len(probabilities):
        raise DataContractError("y_true and probabilities must have the same length")
    if not y_true:
        raise DataContractError("At least one example is required to evaluate a policy")

    retained_correct = 0
    retained_total = 0
    abstained_total = 0
    abstained_would_have_been_correct = 0
    for truth, row in zip(y_true, probabilities, strict=True):
        decision = policy.decide(row)
        best_level = max(row, key=lambda level: row[level])
        if decision is None:
            abstained_total += 1
            if best_level == truth:
                abstained_would_have_been_correct += 1
        else:
            retained_total += 1
            if decision == truth:
                retained_correct += 1

    total = len(y_true)
    return {
        "confidence_threshold": policy.confidence_threshold,
        "sample_count": total,
        "coverage": retained_total / total,
        "retained_count": retained_total,
        "retained_accuracy": (retained_correct / retained_total) if retained_total else None,
        "abstained_count": abstained_total,
        "abstained_rate": abstained_total / total,
        # What accuracy would have looked like on the abstained slice if the model
        # had been forced to answer anyway; a large gap versus retained_accuracy is
        # the evidence that abstaining there was the right call, not overcaution.
        "abstained_accuracy_if_forced": (
            (abstained_would_have_been_correct / abstained_total) if abstained_total else None
        ),
    }


def select_threshold(
    y_true: Sequence[str],
    probabilities: Sequence[Mapping[str, float]],
    *,
    min_retained_accuracy: float,
    min_coverage: float,
    step: float = 0.01,
) -> tuple[AbstentionPolicy, dict[str, object]]:
    """Pick the lowest threshold that meets an accuracy floor without abstaining on everything.

    Lower thresholds keep more predictions (higher coverage) at the cost of
    accuracy among what's retained. This scans candidate thresholds and picks
    the most permissive one that still clears both floors, so the policy is
    the loosest one the evidence actually supports rather than an arbitrary
    round number.
    """

    if not 0.0 < min_retained_accuracy <= 1.0:
        raise DataContractError("min_retained_accuracy must be in (0, 1]")
    if not 0.0 < min_coverage <= 1.0:
        raise DataContractError("min_coverage must be in (0, 1]")

    candidates = [round(step * index, 4) for index in range(int(round(1.0 / step)) + 1)]
    qualifying: list[tuple[float, dict[str, object]]] = []
    for threshold in candidates:
        policy = AbstentionPolicy(threshold)
        report = evaluate_policy(y_true, probabilities, policy)
        accuracy = report["retained_accuracy"]
        if accuracy is not None and accuracy >= min_retained_accuracy and report["coverage"] >= min_coverage:
            qualifying.append((threshold, report))

    if not qualifying:
        raise DataContractError(
            f"No threshold in [0, 1] reaches {min_retained_accuracy:.0%} retained accuracy "
            f"with at least {min_coverage:.0%} coverage on this data"
        )

    threshold, report = min(qualifying, key=lambda item: item[0])
    return AbstentionPolicy(threshold), report
