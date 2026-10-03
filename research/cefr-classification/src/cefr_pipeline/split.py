"""Deterministic, group-aware train/dev/test partitioning with leakage audits."""

from __future__ import annotations

import json
import random
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from .preprocess import canonical_text_fingerprint, write_records_csv
from .schema import CEFR_LEVELS, DataContractError, LearnerTextRecord


@dataclass(frozen=True, slots=True)
class SplitConfig:
    """Ratios and identifiers that are forbidden to cross split boundaries."""

    train_ratio: float = 0.80
    dev_ratio: float = 0.10
    test_ratio: float = 0.10
    seed: int = 42
    group_fields: tuple[str, ...] = ("learner_id", "prompt_id", "source_group_id")

    def validate(self) -> None:
        """Reject ambiguous ratios before any files are written."""

        if min(self.train_ratio, self.dev_ratio, self.test_ratio) <= 0:
            raise DataContractError("All split ratios must be positive")
        if abs(self.train_ratio + self.dev_ratio + self.test_ratio - 1.0) > 1e-9:
            raise DataContractError("Split ratios must add to 1.0")


class _DisjointSet:
    """Small union-find helper for connected learner/prompt/source/duplicate groups."""

    def __init__(self, size: int) -> None:
        self.parent = list(range(size))

    def find(self, item: int) -> int:
        while self.parent[item] != item:
            self.parent[item] = self.parent[self.parent[item]]
            item = self.parent[item]
        return item

    def union(self, left: int, right: int) -> None:
        left_root, right_root = self.find(left), self.find(right)
        if left_root != right_root:
            self.parent[right_root] = left_root


def _connected_groups(
    records: list[LearnerTextRecord], group_fields: tuple[str, ...]
) -> list[list[LearnerTextRecord]]:
    """Keep all shared identifiers and canonical duplicate texts in one partition."""

    sets = _DisjointSet(len(records))
    first_seen: dict[tuple[str, str], int] = {}
    for index, record in enumerate(records):
        identifiers = [(field, str(getattr(record, field))) for field in group_fields]
        identifiers.append(("text_fingerprint", canonical_text_fingerprint(record.text)))
        for field, value in identifiers:
            # Missing IDs provide no grouping evidence and must not connect unrelated rows.
            if not value:
                continue
            key = (field, value)
            if key in first_seen:
                sets.union(index, first_seen[key])
            else:
                first_seen[key] = index
    grouped: dict[int, list[LearnerTextRecord]] = defaultdict(list)
    for index, record in enumerate(records):
        grouped[sets.find(index)].append(record)
    return list(grouped.values())


def split_records(
    records: Iterable[LearnerTextRecord], config: SplitConfig = SplitConfig()
) -> tuple[dict[str, list[LearnerTextRecord]], dict[str, object]]:
    """Greedily balance connected groups by size and CEFR label distribution."""

    config.validate()
    rows = list(records)
    if len(rows) < 3:
        raise DataContractError("At least three records are required for train/dev/test")
    groups = _connected_groups(rows, config.group_fields)
    if len(groups) < 3:
        raise DataContractError(
            "Leakage controls leave fewer than three independent groups; revise the corpus, not the audit"
        )

    rng = random.Random(config.seed)
    rng.shuffle(groups)
    groups.sort(key=len, reverse=True)
    names = ("train", "dev", "test")
    ratios = {"train": config.train_ratio, "dev": config.dev_ratio, "test": config.test_ratio}
    targets = {name: len(rows) * ratios[name] for name in names}
    overall_labels = Counter(record.cefr_level for record in rows)
    label_targets = {
        name: {level: overall_labels[level] * ratios[name] for level in CEFR_LEVELS} for name in names
    }
    partitions: dict[str, list[LearnerTextRecord]] = {name: [] for name in names}
    label_counts: dict[str, Counter[str]] = {name: Counter() for name in names}

    for group in groups:
        group_labels = Counter(record.cefr_level for record in group)

        def placement_cost(name: str) -> tuple[float, float, int]:
            size_after = len(partitions[name]) + len(group)
            size_error = abs(size_after - targets[name]) / max(targets[name], 1.0)
            label_error = sum(
                abs(label_counts[name][level] + group_labels[level] - label_targets[name][level])
                / max(label_targets[name][level], 1.0)
                for level in CEFR_LEVELS
            )
            # Stable name order resolves exact ties reproducibly.
            return (size_error + label_error, size_error, names.index(name))

        selected = min(names, key=placement_cost)
        partitions[selected].extend(group)
        label_counts[selected].update(group_labels)

    if any(not partitions[name] for name in names):
        raise DataContractError("A partition is empty after group-aware splitting")
    audit = audit_split_leakage(partitions, config.group_fields)
    if not audit["passed"]:
        raise DataContractError(f"Split leakage detected: {audit['overlaps']}")
    manifest: dict[str, object] = {
        "schema_version": 1,
        "seed": config.seed,
        "ratios": ratios,
        "group_fields": list(config.group_fields),
        "record_count": len(rows),
        "connected_group_count": len(groups),
        "split_counts": {name: len(partitions[name]) for name in names},
        "label_counts": {name: dict(label_counts[name]) for name in names},
        "leakage_audit": audit,
        "fixture_only": all(record.is_fixture for record in rows),
    }
    return partitions, manifest


def audit_split_leakage(
    partitions: dict[str, list[LearnerTextRecord]], group_fields: tuple[str, ...]
) -> dict[str, object]:
    """Report any shared learner/prompt/source/duplicate identifier between splits."""

    fields = (*group_fields, "text_fingerprint")
    values: dict[str, dict[str, set[str]]] = {
        name: {field: set() for field in fields} for name in partitions
    }
    for name, records in partitions.items():
        for record in records:
            for field in group_fields:
                value = str(getattr(record, field))
                if value:
                    values[name][field].add(value)
            values[name]["text_fingerprint"].add(canonical_text_fingerprint(record.text))
    overlaps: dict[str, dict[str, list[str]]] = {}
    names = list(partitions)
    for left_index, left in enumerate(names):
        for right in names[left_index + 1 :]:
            pair = f"{left}:{right}"
            pair_overlaps = {
                field: sorted(values[left][field] & values[right][field]) for field in fields
            }
            material = {field: found for field, found in pair_overlaps.items() if found}
            if material:
                overlaps[pair] = material
    return {"passed": not overlaps, "overlaps": overlaps}


def write_split_bundle(
    partitions: dict[str, list[LearnerTextRecord]], manifest: dict[str, object], output_dir: Path
) -> None:
    """Persist immutable split inputs and an auditable manifest together."""

    output_dir.mkdir(parents=True, exist_ok=True)
    for name, records in partitions.items():
        write_records_csv(records, output_dir / f"{name}.csv")
    (output_dir / "split-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

