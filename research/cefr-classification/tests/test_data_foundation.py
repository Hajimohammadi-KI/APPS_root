"""Fast tests for data safety; no downloaded corpus or model is required."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.preprocess import canonical_text_fingerprint, clean_learner_text
from cefr_pipeline.schema import CorpusApproval, DataContractError, LearnerTextRecord
from cefr_pipeline.split import SplitConfig, split_records


def make_record(index: int, level: str, group: int) -> LearnerTextRecord:
    """Create synthetic records that exercise contracts without claiming model quality."""

    return LearnerTextRecord(
        document_id=f"fixture-{index}",
        corpus_id="synthetic-contract-fixture",
        text=f"Synthetic learner sentence number {index} at {level}.",
        cefr_level=level,
        language="en" if index % 2 == 0 else "de",
        learner_id=f"learner-{group}",
        prompt_id=f"prompt-{group}",
        source_group_id=f"source-{group}",
        licence_id="generated-fixture",
        is_fixture=True,
    )


class PreprocessingTests(unittest.TestCase):
    def test_cleaning_preserves_errors_and_redacts_basic_pii(self) -> None:
        raw = "  I has  a problem.\r\nEmail me@example.org or +49 170 1234567.  "
        cleaned = clean_learner_text(raw)
        self.assertIn("I has a problem.", cleaned)
        self.assertIn("[EMAIL]", cleaned)
        self.assertIn("[PHONE]", cleaned)

    def test_fingerprint_ignores_spacing_and_compatibility_case(self) -> None:
        self.assertEqual(
            canonical_text_fingerprint("Ａ learner   Text"),
            canonical_text_fingerprint("a learner text"),
        )

    def test_schema_rejects_non_cefr_label(self) -> None:
        with self.assertRaises(DataContractError):
            LearnerTextRecord.from_mapping(
                {"document_id": "1", "corpus_id": "x", "text": "Text", "cefr": "B3", "language": "en"}
            )

    def test_corpus_permissions_are_use_specific(self) -> None:
        evaluation_only = CorpusApproval.from_mapping(
            {
                "corpus_id": "external",
                "approval_status": "approved",
                "licence_status": "verified",
                "allowed_uses": ["research", "evaluation"],
            }
        )
        self.assertTrue(evaluation_only.permits_evaluation())
        self.assertFalse(evaluation_only.permits_training())


class SplitTests(unittest.TestCase):
    def test_group_identifiers_never_cross_partitions(self) -> None:
        levels = ("A1", "A2", "B1", "B2", "C1", "C2")
        rows = [make_record(index, levels[index % len(levels)], index // 2) for index in range(36)]
        partitions, manifest = split_records(rows, SplitConfig(seed=7))
        self.assertTrue(manifest["leakage_audit"]["passed"])
        self.assertEqual(sum(map(len, partitions.values())), len(rows))
        self.assertTrue(all(partitions.values()))

    def test_duplicate_texts_are_connected_even_for_different_ids(self) -> None:
        rows = [make_record(index, ("A1", "A2", "B1")[index % 3], index) for index in range(12)]
        rows[1] = LearnerTextRecord(
            document_id=rows[1].document_id,
            corpus_id=rows[1].corpus_id,
            text=rows[0].text.upper(),
            cefr_level=rows[1].cefr_level,
            language=rows[1].language,
            learner_id=rows[1].learner_id,
            prompt_id=rows[1].prompt_id,
            source_group_id=rows[1].source_group_id,
            licence_id=rows[1].licence_id,
            is_fixture=True,
        )
        partitions, _ = split_records(rows, SplitConfig(seed=11))
        locations = {
            record.document_id: name for name, records in partitions.items() for record in records
        }
        self.assertEqual(locations[rows[0].document_id], locations[rows[1].document_id])


if __name__ == "__main__":
    unittest.main()
