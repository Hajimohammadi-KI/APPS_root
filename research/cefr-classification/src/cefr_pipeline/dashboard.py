"""Build a source-backed dashboard artifact from catalogs and real run records."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable

from .schema import CEFR_LEVELS, DataContractError


REPOSITORY_URL = "https://github.com/Hajimohammadi-KI/APPS_root_new"


def _read_json(path: Path) -> dict[str, Any]:
    """Read one governed input with a clear error at the artifact boundary."""

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise DataContractError(f"Cannot read dashboard input {path}: {error}") from error


def _load_measured_runs(run_root: Path) -> list[dict[str, Any]]:
    """Include real measured runs only; fixture scores never enter research views."""

    measured: list[dict[str, Any]] = []
    if not run_root.exists():
        return measured
    for path in sorted(run_root.glob("**/run.json")):
        artifact = _read_json(path)
        if artifact.get("status") == "fixture":
            continue
        if artifact.get("status") != "measured":
            raise DataContractError(f"Unsupported run status in {path}: {artifact.get('status')!r}")
        artifact["_artifact_path"] = path.as_posix()
        measured.append(artifact)
    return measured


def _latest_by_catalog_id(runs: Iterable[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Choose the newest traceable run per model for the comparison matrix."""

    latest: dict[str, dict[str, Any]] = {}
    for run in runs:
        catalog_id = str(run.get("model", {}).get("catalog_id", ""))
        if not catalog_id:
            raise DataContractError(f"Run {run.get('run_id')} has no model.catalog_id")
        if catalog_id not in latest or str(run.get("created_at", "")) > str(latest[catalog_id].get("created_at", "")):
            latest[catalog_id] = run
    return latest


def _model_rows(models: list[dict[str, Any]], latest_runs: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    """Join catalog capabilities to test metrics while keeping missing values null."""

    rows: list[dict[str, Any]] = []
    for model in models:
        run = latest_runs.get(model["catalog_id"])
        metrics = run.get("metrics", {}) if run else {}
        per_level = metrics.get("per_level", {})
        rows.append(
            {
                "catalog_id": model["catalog_id"],
                "model": model["display_name"],
                "family": model["family"],
                "language_scope": model["language_scope"],
                "parameters": model["parameter_count"],
                "parameter_basis": model["parameter_count_kind"],
                "maximum_tokens": model["maximum_tokens"],
                "licence": model["licence"],
                "hardware_estimate": model["hardware_estimate"],
                "role": model["role"],
                "result_status": "Measured" if run else "N/A — no approved-corpus run",
                "dataset": ", ".join(run.get("dataset", {}).get("corpora", [])) if run else "N/A",
                "accuracy": metrics.get("accuracy"),
                "weighted_f1": metrics.get("weighted_f1"),
                "macro_f1": metrics.get("macro_f1"),
                "qwk": metrics.get("quadratic_weighted_kappa"),
                "adjacent_accuracy": metrics.get("adjacent_level_accuracy"),
                "calibration_error": metrics.get("expected_calibration_error"),
                "f1_a1": per_level.get("A1", {}).get("f1"),
                "f1_a2": per_level.get("A2", {}).get("f1"),
                "f1_b1": per_level.get("B1", {}).get("f1"),
                "f1_b2": per_level.get("B2", {}).get("f1"),
                "f1_c1": per_level.get("C1", {}).get("f1"),
                "f1_c2": per_level.get("C2", {}).get("f1"),
                "training_minutes": (
                    float(run.get("training", {}).get("elapsed_seconds", 0.0)) / 60.0 if run else None
                ),
                "measured_hardware": run.get("hardware", {}).get("gpu", "CPU") if run else "N/A",
                "run_id": run.get("run_id", "N/A") if run else "N/A",
            }
        )
    return rows


def _source_specs(generated_at: str) -> list[dict[str, Any]]:
    """Declare complete, safe provenance for every dashboard surface."""

    return [
        {
            "id": "model-catalog-source",
            "label": "Governed CEFR model catalog",
            "href": f"{REPOSITORY_URL}/blob/main/research/cefr-classification/catalog/model-catalog.json",
            "query": {
                "engine": "repository-json",
                "language": "python",
                "query": "json.load(open('research/cefr-classification/catalog/model-catalog.json', encoding='utf-8'))",
                "sql": "SELECT * FROM model_catalog ORDER BY catalog_id;",
                "description": "Read model capabilities, official-source links, and explicitly labelled hardware estimates.",
                "executed_at": generated_at,
                "tables_used": ["research/cefr-classification/catalog/model-catalog.json"],
                "filters": ["No model rows excluded"],
                "metric_definitions": ["Parameter count follows each row's parameter_count_kind; it is not a CEFR score."],
            },
        },
        {
            "id": "run-artifacts-source",
            "label": "Traceable non-fixture experiment runs",
            "href": f"{REPOSITORY_URL}/tree/main/research/cefr-classification/runs",
            "query": {
                "engine": "repository-json",
                "language": "python",
                "query": "glob('research/cefr-classification/runs/**/run.json'); keep status == 'measured'; latest created_at per model.catalog_id",
                "sql": "SELECT * FROM measured_runs WHERE status = 'measured' QUALIFY ROW_NUMBER() OVER (PARTITION BY model_catalog_id ORDER BY created_at DESC) = 1;",
                "description": "Load only measured run artifacts and exclude all synthetic fixture results.",
                "executed_at": generated_at,
                "tables_used": ["research/cefr-classification/runs/**/run.json"],
                "filters": ["status = measured", "latest created_at per catalog_id", "status = fixture excluded"],
                "metric_definitions": [
                    "Accuracy = exact CEFR label matches / test examples.",
                    "Weighted F1 = per-level F1 weighted by test support.",
                    "Training minutes = training.elapsed_seconds / 60.",
                ],
            },
        },
        {
            "id": "corpus-inventory-source",
            "label": "Corpus licence and approval inventory",
            "href": f"{REPOSITORY_URL}/blob/main/research/cefr-classification/catalog/corpus-inventory.json",
            "query": {
                "engine": "repository-json",
                "language": "python",
                "query": "json.load(open('research/cefr-classification/catalog/corpus-inventory.json', encoding='utf-8'))",
                "sql": "SELECT * FROM corpus_inventory ORDER BY corpus_id;",
                "description": "Read corpus provenance, licence review, allowed uses, and project approval state.",
                "executed_at": generated_at,
                "tables_used": ["research/cefr-classification/catalog/corpus-inventory.json"],
                "filters": ["No corpus rows excluded"],
                "metric_definitions": ["Approved real corpus requires approval_status=approved and is_fixture=false."],
            },
        },
    ]


def build_dashboard_artifact(
    *, model_catalog_path: Path, corpus_inventory_path: Path, run_root: Path
) -> dict[str, Any]:
    """Create the canonical dashboard manifest and bounded reviewed snapshot."""

    generated_at = datetime.now(UTC).replace(microsecond=0).isoformat()
    models = _read_json(model_catalog_path).get("models", [])
    corpora = _read_json(corpus_inventory_path).get("corpora", [])
    measured_runs = _load_measured_runs(run_root)
    latest_runs = _latest_by_catalog_id(measured_runs)
    model_rows = _model_rows(models, latest_runs)
    approved_real = [
        corpus for corpus in corpora
        if corpus.get("approval_status") == "approved" and not corpus.get("is_fixture", False)
    ]
    unresolved = [corpus for corpus in corpora if corpus.get("approval_status") != "approved"]
    summary = [
        {
            "planned_models": len(models),
            "measured_models": len(latest_runs),
            "approved_real_corpora": len(approved_real),
            "unresolved_corpora": len(unresolved),
        }
    ]
    parameter_rows = [
        {
            "model": model["display_name"],
            "parameters_millions": model["parameter_count"] / 1_000_000,
            "family": model["family"],
            "language_scope": model["language_scope"],
            "maximum_tokens": model["maximum_tokens"],
        }
        for model in models
        if model.get("parameter_count") is not None
    ]
    sources = _source_specs(generated_at)
    status = "ready" if approved_real and measured_runs else "partial"
    access_issues = []
    if not approved_real:
        access_issues.append(
            {
                "id": "no-approved-real-corpus",
                "scope": "CEFR performance",
                "sourceId": "corpus-inventory-source",
                "dataset": "model-comparison",
                "message": "No real corpus is approved for training yet; model accuracy and F1 remain N/A.",
                "actionLabel": "Review corpus inventory",
                "actionHref": f"{REPOSITORY_URL}/blob/main/research/cefr-classification/catalog/corpus-inventory.json",
            }
        )
    if not measured_runs:
        access_issues.append(
            {
                "id": "no-measured-runs",
                "scope": "CEFR performance",
                "sourceId": "run-artifacts-source",
                "dataset": "model-comparison",
                "message": "No non-fixture experiment run exists; the dashboard does not invent benchmark values.",
                "actionLabel": "Open experiment guide",
                "actionHref": f"{REPOSITORY_URL}/tree/main/research/cefr-classification",
            }
        )

    manifest: dict[str, Any] = {
        "version": 1,
        "surface": "dashboard",
        "title": "CEFR Model Lab",
        "description": "Capabilities, resource planning, and measured learner-text classification results.",
        "generatedAt": generated_at,
        "filters": [
            {
                "id": "model-family",
                "label": "Model family",
                "dataset": "model-comparison",
                "field": "family",
                "includeAll": True,
                "targets": [{"dataset": "model-comparison", "field": "family"}],
            }
        ],
        "sources": sources,
        "cards": [
            {
                "id": "planned-models",
                "description": "Governed candidates in the common benchmark matrix.",
                "dataset": "summary",
                "sourceId": "model-catalog-source",
                "metrics": [{"label": "Planned models", "field": "planned_models", "format": "number"}],
            },
            {
                "id": "measured-models",
                "description": "Models with a latest non-fixture test run.",
                "dataset": "summary",
                "sourceId": "run-artifacts-source",
                "metrics": [{"label": "Measured models", "field": "measured_models", "format": "number"}],
            },
            {
                "id": "approved-corpora",
                "description": "Real corpora approved for training in this project.",
                "dataset": "summary",
                "sourceId": "corpus-inventory-source",
                "metrics": [{"label": "Approved real corpora", "field": "approved_real_corpora", "format": "number"}],
            },
            {
                "id": "unresolved-corpora",
                "description": "Candidate corpora still blocked or awaiting review.",
                "dataset": "summary",
                "sourceId": "corpus-inventory-source",
                "metrics": [{"label": "Corpus decisions open", "field": "unresolved_corpora", "format": "number"}],
            },
        ],
        "charts": [
            {
                "id": "parameter-comparison",
                "title": "Model size comparison",
                "subtitle": "Millions of parameters; catalog facts and architecture-derived approximations are identified in the table.",
                "intent": "comparison",
                "question": "Which encoder candidates have the largest parameter footprint?",
                "rationale": "A horizontal bar makes model labels readable and exposes relative memory pressure before training.",
                "comparisonContext": {"grain": "one model", "unit": "million parameters"},
                "type": "horizontalBar",
                "dataset": "parameter-comparison",
                "sourceId": "model-catalog-source",
                "encodings": {
                    "x": {"field": "model", "type": "nominal", "label": "Model"},
                    "y": {"field": "parameters_millions", "type": "quantitative", "label": "Parameters", "unit": "M"},
                    "tooltip": [
                        {"field": "family", "type": "text", "label": "Family"},
                        {"field": "language_scope", "type": "text", "label": "Language scope"},
                        {"field": "maximum_tokens", "type": "quantitative", "label": "Maximum tokens"}
                    ]
                },
                "valueFormat": "number",
                "unit": "M parameters",
                "layout": "full",
                "maxRows": 10,
                "compatibleTypes": ["bar", "leaderboard"]
            }
        ],
        "tables": [
            {
                "id": "model-matrix",
                "title": "Sortable CEFR benchmark matrix",
                "subtitle": "Null metric cells are intentionally N/A; only non-fixture test runs can populate them.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "weighted_f1", "direction": "desc"},
                "density": "dense",
                "sourceId": "run-artifacts-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "result_status", "label": "Result status", "type": "text"},
                    {"field": "accuracy", "label": "Accuracy", "format": "percent"},
                    {"field": "weighted_f1", "label": "Weighted F1", "format": "percent"}
                ]
            },
            {
                "id": "run-evidence-matrix",
                "title": "Training run evidence",
                "subtitle": "Dataset, elapsed time, hardware, and immutable run identifier for audit.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "training_minutes", "direction": "asc"},
                "density": "dense",
                "sourceId": "run-artifacts-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "dataset", "label": "Dataset", "type": "text"},
                    {"field": "training_minutes", "label": "Training time (min)", "format": "number"},
                    {"field": "measured_hardware", "label": "Measured hardware", "type": "text"}
                ]
            },
            {
                "id": "capability-matrix",
                "title": "Model capability and resource planning",
                "subtitle": "Hardware values are labelled planning estimates, not measured requirements.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "parameters", "direction": "desc"},
                "density": "dense",
                "sourceId": "model-catalog-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "language_scope", "label": "Language support", "type": "text"},
                    {"field": "parameters", "label": "Parameters", "format": "compact"},
                    {"field": "maximum_tokens", "label": "Max tokens", "format": "number"}
                ]
            },
            {
                "id": "resource-matrix",
                "title": "Licence and hardware planning",
                "subtitle": "Parameter and hardware bases show where values are official, derived, or estimated.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "model", "direction": "asc"},
                "density": "dense",
                "sourceId": "model-catalog-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "licence", "label": "Licence", "type": "text"},
                    {"field": "parameter_basis", "label": "Parameter basis", "type": "text"},
                    {"field": "hardware_estimate", "label": "Planning hardware", "type": "text"}
                ]
            },
            {
                "id": "per-level-basic-matrix",
                "title": "Per-level F1 detail · A1-B1",
                "subtitle": "Cells remain N/A until each class has traceable test evidence.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "f1_b1", "direction": "desc"},
                "density": "dense",
                "sourceId": "run-artifacts-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "f1_a1", "label": "F1 A1", "format": "percent"},
                    {"field": "f1_a2", "label": "F1 A2", "format": "percent"},
                    {"field": "f1_b1", "label": "F1 B1", "format": "percent"}
                ]
            },
            {
                "id": "per-level-advanced-matrix",
                "title": "Per-level F1 detail · B2-C2",
                "subtitle": "Cells remain N/A until each class has traceable test evidence.",
                "dataset": "model-comparison",
                "defaultSort": {"field": "f1_b2", "direction": "desc"},
                "density": "dense",
                "sourceId": "run-artifacts-source",
                "layout": "full",
                "columns": [
                    {"field": "model", "label": "Model", "type": "text"},
                    {"field": "f1_b2", "label": "F1 B2", "format": "percent"},
                    {"field": "f1_c1", "label": "F1 C1", "format": "percent"},
                    {"field": "f1_c2", "label": "F1 C2", "format": "percent"}
                ]
            },
            {
                "id": "corpus-decisions",
                "title": "Corpus approval and licence decisions",
                "subtitle": "Only explicitly approved, verified training sources can enter prepare.",
                "dataset": "corpus-inventory",
                "defaultSort": {"field": "approval_status", "direction": "asc"},
                "density": "dense",
                "sourceId": "corpus-inventory-source",
                "layout": "full",
                "columns": [
                    {"field": "name", "label": "Corpus", "type": "text"},
                    {"field": "approval_status", "label": "Approval", "type": "text"},
                    {"field": "licence_status", "label": "Licence review", "type": "text"},
                    {"field": "reason", "label": "Decision rationale", "type": "text"}
                ]
            }
        ],
        "blocks": [
            {
                "id": "decision-note",
                "type": "markdown",
                "layout": "full",
                "sourceId": "run-artifacts-source",
                "body": "## Open-source CEFR model evaluation\nNo architecture can be ranked for CEFR accuracy yet. Compare capability and cost now; approve corpora and run the identical benchmark before selecting a production classifier."
            },
            {"id": "summary-strip", "type": "metric-strip", "layout": "full", "cardIds": ["planned-models", "measured-models", "approved-corpora", "unresolved-corpora"]},
            {"id": "parameter-chart-block", "type": "chart", "layout": "full", "chartId": "parameter-comparison"},
            {"id": "model-table-block", "type": "table", "layout": "full", "tableId": "model-matrix"},
            {"id": "run-evidence-table-block", "type": "table", "layout": "full", "tableId": "run-evidence-matrix"},
            {"id": "capability-table-block", "type": "table", "layout": "full", "tableId": "capability-matrix"},
            {"id": "resource-table-block", "type": "table", "layout": "full", "tableId": "resource-matrix"},
            {"id": "per-level-basic-table-block", "type": "table", "layout": "full", "tableId": "per-level-basic-matrix"},
            {"id": "per-level-advanced-table-block", "type": "table", "layout": "full", "tableId": "per-level-advanced-matrix"},
            {
                "id": "corpus-note",
                "type": "markdown",
                "layout": "full",
                "sourceId": "corpus-inventory-source",
                "body": "## Dataset gate\nA model comparison is valid only when every candidate uses the same immutable, leakage-audited splits. Corpus licences and source provenance are release requirements, not optional documentation."
            },
            {"id": "corpus-table-block", "type": "table", "layout": "full", "tableId": "corpus-decisions"}
        ]
    }
    snapshot = {
        "version": 1,
        "generatedAt": generated_at,
        "status": status,
        "accessIssues": access_issues,
        "datasets": {
            "summary": summary,
            "parameter-comparison": parameter_rows,
            "model-comparison": model_rows,
            "corpus-inventory": [
                {
                    "corpus_id": corpus.get("corpus_id", ""),
                    "name": corpus.get("name", ""),
                    "languages_display": ", ".join(corpus.get("languages", [])),
                    "approval_status": corpus.get("approval_status", "blocked"),
                    "licence_status": corpus.get("licence_status", "unverified"),
                    "licence_id": corpus.get("licence_id", "N/A"),
                    "allowed_uses_display": ", ".join(corpus.get("allowed_uses", [])) or "none",
                    "reason": corpus.get("reason", ""),
                    "source_url": corpus.get("source_url", "N/A"),
                    "is_fixture": bool(corpus.get("is_fixture", False))
                }
                for corpus in corpora
            ]
        }
    }
    return {"surface": "dashboard", "manifest": manifest, "snapshot": snapshot, "sources": sources}


def write_dashboard_artifact(path: Path, artifact: dict[str, Any]) -> None:
    """Persist canonical JSON before the plugin packages self-contained HTML."""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
