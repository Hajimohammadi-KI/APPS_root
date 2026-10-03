"""Optional end-to-end baseline test when free scikit dependencies are installed."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = PROJECT_ROOT.parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.preprocess import read_approved_csv
from cefr_pipeline.split import SplitConfig, split_records, write_split_bundle
from cefr_pipeline.train_feature import train_feature_baseline


@unittest.skipUnless(importlib.util.find_spec("sklearn"), "baseline extra is not installed")
class FeatureTrainingTests(unittest.TestCase):
    def test_fixture_training_writes_complete_excluded_run(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            records = read_approved_csv(
                PROJECT_ROOT / "tests" / "fixtures" / "synthetic-learner-texts.csv",
                PROJECT_ROOT / "catalog" / "corpus-inventory.json",
            )
            partitions, manifest = split_records(records, SplitConfig(seed=42))
            split_dir = temporary / "splits"
            write_split_bundle(partitions, manifest, split_dir)
            output_dir = temporary / "run"
            artifact = train_feature_baseline(
                split_dir=split_dir,
                output_dir=output_dir,
                repository_root=REPOSITORY_ROOT,
                run_id="unit-fixture-feature",
            )
            saved = json.loads((output_dir / "run.json").read_text(encoding="utf-8"))
            self.assertEqual(artifact["status"], "fixture")
            self.assertEqual(saved["status"], "fixture")
            self.assertTrue((output_dir / "model.joblib").exists())
            self.assertTrue((output_dir / "test" / "predictions.csv").exists())
            self.assertEqual(saved["metrics"]["sample_count"], manifest["split_counts"]["test"])


if __name__ == "__main__":
    unittest.main()

