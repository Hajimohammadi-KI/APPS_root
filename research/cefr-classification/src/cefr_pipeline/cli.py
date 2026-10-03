"""Command-line entry point for auditable local CEFR experiments."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from .dashboard import build_dashboard_artifact, write_dashboard_artifact
from .external_evaluate import evaluate_saved_run
from .preprocess import read_approved_csv
from .split import SplitConfig, split_records, write_split_bundle
from .train_feature import train_feature_baseline
from .train_transformer import TransformerConfig, train_transformer


def _existing_path(value: str) -> Path:
    """Fail during argument parsing instead of deep inside a training run."""

    path = Path(value).resolve()
    if not path.exists():
        raise argparse.ArgumentTypeError(f"Path does not exist: {path}")
    return path


def build_parser() -> argparse.ArgumentParser:
    """Describe the pipeline as explicit, independently reproducible stages."""

    parser = argparse.ArgumentParser(
        prog="cefr-pipeline",
        description="Evidence-first English/German CEFR text-classification pipeline",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare", help="Validate, clean, licence-gate, and split a corpus")
    prepare.add_argument("--input", required=True, type=_existing_path, help="Source CSV matching the data contract")
    prepare.add_argument("--inventory", required=True, type=_existing_path, help="Corpus approval inventory JSON")
    prepare.add_argument("--output", required=True, type=Path, help="New immutable split directory")
    prepare.add_argument("--seed", type=int, default=42)
    prepare.add_argument("--train-ratio", type=float, default=0.80)
    prepare.add_argument("--dev-ratio", type=float, default=0.10)
    prepare.add_argument("--test-ratio", type=float, default=0.10)
    prepare.add_argument(
        "--group-fields",
        default="learner_id,prompt_id,source_group_id",
        help=(
            "Comma-separated record fields that must not cross split boundaries, "
            "in addition to exact-duplicate text. Default keeps every leakage "
            "control; drop a field (e.g. prompt_id) only when reusing it across "
            "many unrelated learners is not a real leakage risk for this corpus."
        ),
    )

    feature = subparsers.add_parser("train-feature", help="Train the required interpretable baseline")
    feature.add_argument("--splits", required=True, type=_existing_path)
    feature.add_argument("--output", required=True, type=Path)
    feature.add_argument("--repo-root", required=True, type=_existing_path)
    feature.add_argument("--run-id", required=True)
    feature.add_argument("--seed", type=int, default=42)

    transformer = subparsers.add_parser("train-transformer", help="Fine-tune one encoder configuration")
    transformer.add_argument("--config", required=True, type=_existing_path)
    transformer.add_argument("--splits", required=True, type=_existing_path)
    transformer.add_argument("--output", required=True, type=Path)
    transformer.add_argument("--repo-root", required=True, type=_existing_path)
    transformer.add_argument("--run-id", required=True)

    external = subparsers.add_parser(
        "external-evaluate", help="Evaluate one immutable saved model on an evaluation-only corpus"
    )
    external.add_argument("--run", required=True, type=_existing_path)
    external.add_argument("--input", required=True, type=_existing_path)
    external.add_argument("--inventory", required=True, type=_existing_path)
    external.add_argument("--output", required=True, type=Path)
    external.add_argument("--batch-size", type=int, default=16)

    dashboard = subparsers.add_parser("build-dashboard", help="Build canonical dashboard JSON from catalogs and runs")
    dashboard.add_argument("--models", required=True, type=_existing_path)
    dashboard.add_argument("--corpora", required=True, type=_existing_path)
    dashboard.add_argument("--runs", required=True, type=_existing_path)
    dashboard.add_argument("--output", required=True, type=Path)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    """Run exactly one stage and print a compact machine-readable receipt."""

    args = build_parser().parse_args(argv)
    if args.command == "prepare":
        records = read_approved_csv(args.input, args.inventory)
        group_fields = tuple(field.strip() for field in args.group_fields.split(",") if field.strip())
        config = SplitConfig(
            train_ratio=args.train_ratio,
            dev_ratio=args.dev_ratio,
            test_ratio=args.test_ratio,
            seed=args.seed,
            group_fields=group_fields,
        )
        partitions, manifest = split_records(records, config)
        output = args.output.resolve()
        write_split_bundle(partitions, manifest, output)
        receipt = {"stage": "prepare", "status": "passed", "output": str(output), **manifest}
    elif args.command == "train-feature":
        artifact = train_feature_baseline(
            split_dir=args.splits,
            output_dir=args.output.resolve(),
            repository_root=args.repo_root,
            run_id=args.run_id,
            random_seed=args.seed,
        )
        receipt = {
            "stage": "train-feature",
            "status": artifact["status"],
            "run_id": artifact["run_id"],
            "output": str(args.output.resolve()),
        }
    elif args.command == "train-transformer":
        config = TransformerConfig.from_json(args.config)
        artifact = train_transformer(
            config=config,
            split_dir=args.splits,
            output_dir=args.output.resolve(),
            repository_root=args.repo_root,
            run_id=args.run_id,
        )
        receipt = {
            "stage": "train-transformer",
            "status": artifact["status"],
            "run_id": artifact["run_id"],
            "output": str(args.output.resolve()),
        }
    elif args.command == "external-evaluate":
        artifact = evaluate_saved_run(
            run_dir=args.run,
            input_path=args.input,
            inventory_path=args.inventory,
            output_dir=args.output.resolve(),
            batch_size=args.batch_size,
        )
        receipt = {
            "stage": "external-evaluate",
            "status": artifact["status"],
            "run_id": artifact["run_id"],
            "sample_count": artifact["metrics"]["sample_count"],
            "output": str(args.output.resolve()),
        }
    else:
        artifact = build_dashboard_artifact(
            model_catalog_path=args.models,
            corpus_inventory_path=args.corpora,
            run_root=args.runs,
        )
        output = args.output.resolve()
        write_dashboard_artifact(output, artifact)
        receipt = {
            "stage": "build-dashboard",
            "status": artifact["snapshot"]["status"],
            "measured_models": artifact["snapshot"]["datasets"]["summary"][0]["measured_models"],
            "output": str(output),
        }
    print(json.dumps(receipt, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
