"""Traceable experiment metadata consumed by the comparison dashboard."""

from __future__ import annotations

import json
import platform
import subprocess
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Mapping


def collect_hardware_inventory() -> dict[str, object]:
    """Collect useful local facts without requiring PyTorch or vendor utilities."""

    inventory: dict[str, object] = {
        "platform": platform.platform(),
        "processor": platform.processor() or "unknown",
        "python": platform.python_version(),
        "cuda_available": False,
        "gpu": "not detected",
    }
    try:
        import torch  # type: ignore[import-not-found]

        inventory["torch"] = torch.__version__
        inventory["cuda_available"] = bool(torch.cuda.is_available())
        if torch.cuda.is_available():
            inventory["gpu"] = torch.cuda.get_device_name(0)
            inventory["gpu_memory_bytes"] = torch.cuda.get_device_properties(0).total_memory
    except ImportError:
        inventory["torch"] = "not installed"
    return inventory


def current_git_revision(repository_root: Path) -> str:
    """Record the exact code revision; return an explicit value outside Git."""

    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=repository_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip() if result.returncode == 0 else "unavailable"


def create_run_artifact(
    *,
    run_id: str,
    model: Mapping[str, Any],
    dataset: Mapping[str, Any],
    training: Mapping[str, Any],
    metrics: Mapping[str, Any],
    repository_root: Path,
    fixture_only: bool,
) -> dict[str, object]:
    """Create the versioned row contract that forbids fixture results in research views."""

    return {
        "schema_version": 1,
        "run_id": run_id,
        "status": "fixture" if fixture_only else "measured",
        "created_at": datetime.now(UTC).isoformat(),
        "code_revision": current_git_revision(repository_root),
        "model": dict(model),
        "dataset": dict(dataset),
        "training": dict(training),
        "hardware": collect_hardware_inventory(),
        "metrics": dict(metrics),
    }


def write_run_artifact(path: Path, artifact: Mapping[str, Any]) -> None:
    """Persist one complete experiment record atomically enough for local research."""

    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)

