"""Validate Transformer experiment settings without downloading checkpoints."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.schema import DataContractError
from cefr_pipeline.train_transformer import TransformerConfig


class TransformerConfigTests(unittest.TestCase):
    def test_default_research_recipe_is_valid(self) -> None:
        TransformerConfig(
            catalog_id="modernbert-base",
            model_id="answerdotai/ModernBERT-base",
            language_scope="English",
        ).validate()

    def test_excessive_learning_rate_is_rejected(self) -> None:
        with self.assertRaises(DataContractError):
            TransformerConfig(
                catalog_id="test",
                model_id="test/model",
                language_scope="test",
                learning_rate=0.1,
            ).validate()

    def test_short_sequence_limit_is_rejected(self) -> None:
        with self.assertRaises(DataContractError):
            TransformerConfig(
                catalog_id="test",
                model_id="test/model",
                language_scope="test",
                max_length=16,
            ).validate()


if __name__ == "__main__":
    unittest.main()

