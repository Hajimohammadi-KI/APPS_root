"""Dashboard tests enforce the boundary between catalog facts and measured results."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cefr_pipeline.dashboard import build_dashboard_artifact


class DashboardTests(unittest.TestCase):
    def test_empty_runs_are_partial_and_metrics_are_not_invented(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            artifact = build_dashboard_artifact(
                model_catalog_path=PROJECT_ROOT / "catalog" / "model-catalog.json",
                corpus_inventory_path=PROJECT_ROOT / "catalog" / "corpus-inventory.json",
                run_root=Path(directory),
            )
        self.assertEqual(artifact["snapshot"]["status"], "partial")
        rows = artifact["snapshot"]["datasets"]["model-comparison"]
        self.assertTrue(all(row["accuracy"] is None for row in rows))
        self.assertTrue(all(row["result_status"].startswith("N/A") for row in rows))
        self.assertEqual(artifact["snapshot"]["datasets"]["summary"][0]["measured_models"], 0)

    def test_fixture_run_is_excluded_from_dashboard(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            run_root = Path(directory)
            fixture_dir = run_root / "fixture"
            fixture_dir.mkdir()
            (fixture_dir / "run.json").write_text(
                json.dumps(
                    {
                        "run_id": "fixture-run",
                        "status": "fixture",
                        "created_at": "2026-08-30T00:00:00+00:00",
                        "model": {"catalog_id": "modernbert-base"},
                        "metrics": {"accuracy": 1.0}
                    }
                ),
                encoding="utf-8",
            )
            artifact = build_dashboard_artifact(
                model_catalog_path=PROJECT_ROOT / "catalog" / "model-catalog.json",
                corpus_inventory_path=PROJECT_ROOT / "catalog" / "corpus-inventory.json",
                run_root=run_root,
            )
        summary = artifact["snapshot"]["datasets"]["summary"][0]
        self.assertEqual(summary["measured_models"], 0)


if __name__ == "__main__":
    unittest.main()

