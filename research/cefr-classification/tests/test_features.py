"""Dependency-free checks for the interpretable baseline feature definitions."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.features import text_style_features


class FeatureTests(unittest.TestCase):
    def test_style_features_are_finite_and_fixed_width(self) -> None:
        values = text_style_features("I have went home. Warum ist das so?")
        self.assertEqual(len(values), 9)
        self.assertTrue(all(value >= 0 for value in values))

    def test_empty_text_does_not_divide_by_zero(self) -> None:
        values = text_style_features("")
        self.assertEqual(len(values), 9)
        self.assertTrue(all(value == 0 for value in values))


if __name__ == "__main__":
    unittest.main()

