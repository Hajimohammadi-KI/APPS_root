"""External-evaluation contracts stay use-specific and language-safe."""

from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.external_evaluate import _validate_languages
from cefr_pipeline.preprocess import read_approved_csv
from cefr_pipeline.schema import DataContractError, LearnerTextRecord


class ExternalEvaluationTests(unittest.TestCase):
    def test_evaluation_only_corpus_cannot_enter_training(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            inventory = root / "inventory.json"
            inventory.write_text(
                json.dumps(
                    {
                        "corpora": [
                            {
                                "corpus_id": "external",
                                "approval_status": "approved",
                                "licence_status": "verified",
                                "allowed_uses": ["research", "evaluation"],
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            source = root / "external.csv"
            with source.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=[
                        "document_id",
                        "corpus_id",
                        "text",
                        "cefr_level",
                        "language",
                    ],
                )
                writer.writeheader()
                writer.writerow(
                    {
                        "document_id": "external-1",
                        "corpus_id": "external",
                        "text": "Independent evaluation text.",
                        "cefr_level": "A1",
                        "language": "en",
                    }
                )
            self.assertEqual(
                len(read_approved_csv(source, inventory, required_use="evaluation")), 1
            )
            with self.assertRaises(DataContractError):
                read_approved_csv(source, inventory)

    def test_saved_run_rejects_an_untrained_language(self) -> None:
        record = LearnerTextRecord(
            document_id="de-1",
            corpus_id="external-de",
            text="Ein Text.",
            cefr_level="A1",
            language="de",
        )
        with self.assertRaises(DataContractError):
            _validate_languages(
                {"run_id": "english-only", "dataset": {"languages": ["en"]}}, [record]
            )


if __name__ == "__main__":
    unittest.main()
