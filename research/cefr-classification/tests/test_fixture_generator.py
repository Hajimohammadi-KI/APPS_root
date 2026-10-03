"""Ensure the generated fixture covers both languages and all CEFR levels."""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = PROJECT_ROOT / "tools" / "generate_synthetic_fixture.py"
SPEC = importlib.util.spec_from_file_location("generate_synthetic_fixture", GENERATOR_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class FixtureGeneratorTests(unittest.TestCase):
    def test_fixture_has_balanced_language_level_cells(self) -> None:
        rows = MODULE.build_rows()
        counts: dict[tuple[str, str], int] = {}
        for row in rows:
            key = (str(row["language"]), str(row["cefr_level"]))
            counts[key] = counts.get(key, 0) + 1
            self.assertTrue(row["is_fixture"])
            self.assertEqual(row["corpus_id"], "synthetic-contract-fixture")
        self.assertEqual(len(rows), 72)
        self.assertEqual(set(counts.values()), {6})


if __name__ == "__main__":
    unittest.main()

