"""Train the mandatory TF-IDF plus writing-style Logistic Regression baseline."""

from __future__ import annotations

import csv
import json
import time
from pathlib import Path
from typing import Any

from .evaluation import write_evaluation_bundle
from .features import TextStyleTransformer
from .run_artifact import create_run_artifact, write_run_artifact
from .schema import CEFR_LEVELS, DataContractError, LearnerTextRecord


def _read_split(path: Path) -> list[LearnerTextRecord]:
    """Read a previously approved split without repeating the ingestion gate."""

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [LearnerTextRecord.from_mapping(row) for row in csv.DictReader(handle)]


def _probability_rows(classes: list[str], matrix: Any) -> list[dict[str, float]]:
    """Expand model probabilities to the complete A1-C2 dashboard contract."""

    rows: list[dict[str, float]] = []
    for probabilities in matrix:
        row = {level: 0.0 for level in CEFR_LEVELS}
        row.update({label: float(value) for label, value in zip(classes, probabilities, strict=True)})
        rows.append(row)
    return rows


def train_feature_baseline(
    *,
    split_dir: Path,
    output_dir: Path,
    repository_root: Path,
    run_id: str,
    random_seed: int = 42,
    maximum_word_features: int = 30_000,
    maximum_character_features: int = 30_000,
) -> dict[str, object]:
    """Fit on train only, inspect dev, and publish final metrics from test only."""

    try:
        import joblib  # type: ignore[import-not-found]
        from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore[import-not-found]
        from sklearn.linear_model import LogisticRegression  # type: ignore[import-not-found]
        from sklearn.multiclass import OneVsRestClassifier  # type: ignore[import-not-found]
        from sklearn.pipeline import FeatureUnion, Pipeline  # type: ignore[import-not-found]
        from sklearn.preprocessing import MaxAbsScaler  # type: ignore[import-not-found]
    except ImportError as error:
        raise RuntimeError("Install with: python -m pip install -e '.[baseline]'") from error

    manifest_path = split_dir / "split-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not manifest.get("leakage_audit", {}).get("passed"):
        raise DataContractError("Training is blocked because the split leakage audit did not pass")
    train_records = _read_split(split_dir / "train.csv")
    dev_records = _read_split(split_dir / "dev.csv")
    test_records = _read_split(split_dir / "test.csv")
    observed_train_labels = {record.cefr_level for record in train_records}
    if observed_train_labels != set(CEFR_LEVELS):
        missing = sorted(set(CEFR_LEVELS) - observed_train_labels)
        raise DataContractError(f"Training split is missing CEFR levels: {missing}")

    # Word n-grams capture lexical/syntactic fragments; character n-grams remain
    # useful for learner spelling and morphology without auto-correcting the input.
    features = FeatureUnion(
        [
            (
                "word_tfidf",
                TfidfVectorizer(
                    analyzer="word",
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=maximum_word_features,
                    sublinear_tf=True,
                    lowercase=True,
                ),
            ),
            (
                "character_tfidf",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=2,
                    max_features=maximum_character_features,
                    sublinear_tf=True,
                    lowercase=True,
                ),
            ),
            ("style", Pipeline([("extract", TextStyleTransformer()), ("scale", MaxAbsScaler())])),
        ]
    )
    # OneVsRestClassifier makes the intended six-head strategy explicit and
    # avoids the removed multi_class constructor argument in scikit-learn 1.9+.
    classifier = OneVsRestClassifier(
        LogisticRegression(
            max_iter=2_000,
            class_weight="balanced",
            random_state=random_seed,
            solver="liblinear",
        )
    )
    pipeline = Pipeline([("features", features), ("classifier", classifier)])
    started = time.perf_counter()
    pipeline.fit([record.text for record in train_records], [record.cefr_level for record in train_records])
    elapsed_seconds = time.perf_counter() - started
    output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, output_dir / "model.joblib")

    classes = [str(label) for label in pipeline.named_steps["classifier"].classes_]
    evaluations: dict[str, dict[str, object]] = {}
    for name, records in (("dev", dev_records), ("test", test_records)):
        texts = [record.text for record in records]
        predictions = [str(label) for label in pipeline.predict(texts)]
        probabilities = _probability_rows(classes, pipeline.predict_proba(texts))
        evaluations[name] = write_evaluation_bundle(
            output_dir / name,
            [record.document_id for record in records],
            [record.cefr_level for record in records],
            predictions,
            probabilities,
        )

    artifact = create_run_artifact(
        run_id=run_id,
        model={
            "catalog_id": "feature-logreg",
            "model_id": "tfidf-style-logistic-regression",
            "architecture": "feature-based",
            "parameter_count": None,
        },
        dataset={
            "split_manifest": str(manifest_path.resolve()),
            "record_count": manifest["record_count"],
            "languages": sorted({record.language for record in (*train_records, *dev_records, *test_records)}),
            "corpora": sorted({record.corpus_id for record in (*train_records, *dev_records, *test_records)}),
        },
        training={
            "random_seed": random_seed,
            "elapsed_seconds": elapsed_seconds,
            "word_feature_limit": maximum_word_features,
            "character_feature_limit": maximum_character_features,
            "class_weight": "balanced",
        },
        metrics=evaluations["test"],
        repository_root=repository_root,
        fixture_only=bool(manifest.get("fixture_only", False)),
    )
    # Dev metrics remain available for model selection but the dashboard headline
    # always reads the untouched test metrics in the top-level run artifact.
    artifact["dev_metrics"] = evaluations["dev"]
    write_run_artifact(output_dir / "run.json", artifact)
    return artifact
