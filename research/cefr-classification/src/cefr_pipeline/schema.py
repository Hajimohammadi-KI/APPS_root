"""Shared data contracts for English and German learner-text experiments.

The schema deliberately separates text difficulty from learner proficiency. A
single record can support a text-level CEFR classifier, but it is not enough to
declare the writer's overall language level.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Mapping


# CEFR is ordinal, so this order is reused by splitting and distance-aware metrics.
CEFR_LEVELS: tuple[str, ...] = ("A1", "A2", "B1", "B2", "C1", "C2")
SUPPORTED_LANGUAGES: frozenset[str] = frozenset({"en", "de"})


class DataContractError(ValueError):
    """Raised when a corpus row cannot be used without inventing missing evidence."""


@dataclass(frozen=True, slots=True)
class LearnerTextRecord:
    """One source-backed CEFR-labelled text and its leakage-control identifiers."""

    document_id: str
    corpus_id: str
    text: str
    cefr_level: str
    language: str
    genre: str = "unknown"
    learner_id: str = ""
    prompt_id: str = ""
    source_group_id: str = ""
    licence_id: str = ""
    source_url: str = ""
    is_fixture: bool = False

    @classmethod
    def from_mapping(cls, row: Mapping[str, Any]) -> "LearnerTextRecord":
        """Validate aliases once so every later stage receives the same contract."""

        values = {
            "document_id": str(row.get("document_id", "")).strip(),
            "corpus_id": str(row.get("corpus_id", "")).strip(),
            "text": str(row.get("text", "")),
            "cefr_level": str(row.get("cefr_level", row.get("cefr", ""))).upper().strip(),
            "language": str(row.get("language", "")).lower().strip(),
            "genre": str(row.get("genre", "unknown")).strip() or "unknown",
            "learner_id": str(row.get("learner_id", "")).strip(),
            "prompt_id": str(row.get("prompt_id", "")).strip(),
            "source_group_id": str(row.get("source_group_id", "")).strip(),
            "licence_id": str(row.get("licence_id", "")).strip(),
            "source_url": str(row.get("source_url", "")).strip(),
            "is_fixture": str(row.get("is_fixture", "false")).lower().strip() in {"1", "true", "yes"},
        }
        missing = [name for name in ("document_id", "corpus_id", "text") if not values[name]]
        if missing:
            raise DataContractError(f"Missing required fields: {', '.join(missing)}")
        if values["cefr_level"] not in CEFR_LEVELS:
            raise DataContractError(f"Unsupported CEFR level: {values['cefr_level']!r}")
        if values["language"] not in SUPPORTED_LANGUAGES:
            raise DataContractError(f"Unsupported language: {values['language']!r}; expected en or de")
        return cls(**values)

    def to_dict(self) -> dict[str, Any]:
        """Return a stable JSON/CSV-friendly representation."""

        return asdict(self)


@dataclass(frozen=True, slots=True)
class CorpusApproval:
    """Repository-local decision about whether a corpus may enter experiments."""

    corpus_id: str
    approval_status: str
    licence_status: str
    allowed_uses: tuple[str, ...]
    is_fixture: bool = False

    @classmethod
    def from_mapping(cls, row: Mapping[str, Any]) -> "CorpusApproval":
        """Parse an inventory row without silently treating unknown rights as approval."""

        return cls(
            corpus_id=str(row.get("corpus_id", "")).strip(),
            approval_status=str(row.get("approval_status", "blocked")).lower().strip(),
            licence_status=str(row.get("licence_status", "unverified")).lower().strip(),
            allowed_uses=tuple(str(value).lower() for value in row.get("allowed_uses", [])),
            is_fixture=bool(row.get("is_fixture", False)),
        )

    def permits_training(self) -> bool:
        """Require affirmative approval and an explicit training permission."""

        return self.permits_use("training")

    def permits_evaluation(self) -> bool:
        """Require affirmative approval and an explicit evaluation permission."""

        return self.permits_use("evaluation")

    def permits_use(self, use: str) -> bool:
        """Fail closed unless the inventory explicitly permits the requested use."""

        return (
            self.approval_status == "approved"
            and self.licence_status == "verified"
            and use.lower().strip() in self.allowed_uses
        )
