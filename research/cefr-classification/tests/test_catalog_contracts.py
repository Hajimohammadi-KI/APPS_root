"""Keep model and corpus decisions consistent with executable configuration."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.schema import CorpusApproval
from cefr_pipeline.train_transformer import TransformerConfig


class CatalogContractTests(unittest.TestCase):
    def test_every_transformer_config_resolves_to_catalog_model(self) -> None:
        catalog = json.loads((PROJECT_ROOT / "catalog" / "model-catalog.json").read_text(encoding="utf-8"))
        by_id = {model["catalog_id"]: model for model in catalog["models"]}
        for path in (PROJECT_ROOT / "configs").glob("*.json"):
            config = TransformerConfig.from_json(path)
            config.validate()
            self.assertIn(config.catalog_id, by_id)
            self.assertEqual(config.model_id, by_id[config.catalog_id]["model_id"])

    def test_approval_is_limited_to_reviewed_corpora(self) -> None:
        """Guard against silent approval: every non-fixture approved row must carry a real licence.

        The fixture starts pre-approved by design. Any other corpus_id may only
        appear here once it has gone through the same licence/provenance review
        ace-cefr and merlin-de did (see corpus-inventory.json's own reason
        fields) — approving a corpus is not something a config edit alone
        should be able to do silently.
        """

        inventory = json.loads((PROJECT_ROOT / "catalog" / "corpus-inventory.json").read_text(encoding="utf-8"))
        rows_by_id = {row["corpus_id"]: row for row in inventory["corpora"]}
        approved = [
            CorpusApproval.from_mapping(row)
            for row in inventory["corpora"]
            if CorpusApproval.from_mapping(row).permits_training()
        ]
        approved_ids = {item.corpus_id for item in approved}
        self.assertEqual(approved_ids, {"synthetic-contract-fixture", "ace-cefr", "merlin-de"})
        for item in approved:
            if item.is_fixture:
                continue
            row = rows_by_id[item.corpus_id]
            self.assertTrue(row.get("licence_id"), f"{item.corpus_id} is approved without a recorded licence_id")
            self.assertTrue(row.get("reason"), f"{item.corpus_id} is approved without a recorded review reason")


if __name__ == "__main__":
    unittest.main()

