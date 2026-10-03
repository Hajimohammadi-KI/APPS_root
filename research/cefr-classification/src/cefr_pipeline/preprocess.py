"""Learner-text cleaning that preserves the mistakes the models must learn from."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import unicodedata
from dataclasses import replace
from pathlib import Path
from typing import Iterable

from .schema import CorpusApproval, DataContractError, LearnerTextRecord


_WHITESPACE_RE = re.compile(r"[\t\f\v ]+")
_BLANK_LINES_RE = re.compile(r"\n{3,}")
_EMAIL_RE = re.compile(r"(?<![\w.+-])[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?![\w.-])")
_PHONE_RE = re.compile(r"(?<!\w)(?:\+?\d[\d ().-]{7,}\d)(?!\w)")


def clean_learner_text(text: str, *, redact_basic_pii: bool = True) -> str:
    """Normalise encoding and spacing without fixing grammar, spelling, or case.

    NFKC removes visually inconsistent compatibility forms, while line breaks
    remain available as writing-structure evidence. Automatic spell checking,
    translation, lowercasing, and punctuation repair are intentionally forbidden.
    """

    cleaned = unicodedata.normalize("NFKC", text.replace("\r\n", "\n").replace("\r", "\n"))
    cleaned = "\n".join(_WHITESPACE_RE.sub(" ", line).strip() for line in cleaned.split("\n"))
    cleaned = _BLANK_LINES_RE.sub("\n\n", cleaned).strip()
    if redact_basic_pii:
        cleaned = _EMAIL_RE.sub("[EMAIL]", cleaned)
        cleaned = _PHONE_RE.sub("[PHONE]", cleaned)
    return cleaned


def canonical_text_fingerprint(text: str) -> str:
    """Hash a conservative comparison form used to keep duplicates in one split."""

    comparison = unicodedata.normalize("NFKC", text).casefold()
    comparison = " ".join(comparison.split())
    return hashlib.sha256(comparison.encode("utf-8")).hexdigest()


def load_corpus_inventory(path: Path) -> dict[str, CorpusApproval]:
    """Load corpus decisions; an absent corpus remains blocked by design."""

    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("corpora", [])
    approvals = {item.corpus_id: item for item in map(CorpusApproval.from_mapping, rows)}
    if not approvals:
        raise DataContractError("Corpus inventory contains no decisions")
    return approvals


def read_approved_csv(
    csv_path: Path,
    inventory_path: Path,
    *,
    required_use: str = "training",
) -> list[LearnerTextRecord]:
    """Read, validate, clean, and licence-gate records before model code sees them."""

    requested_use = required_use.lower().strip()
    if not requested_use:
        raise DataContractError("required_use must not be empty")

    approvals = load_corpus_inventory(inventory_path)
    records: list[LearnerTextRecord] = []
    document_ids: set[str] = set()
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        for line_number, row in enumerate(csv.DictReader(handle), start=2):
            try:
                record = LearnerTextRecord.from_mapping(row)
            except DataContractError as error:
                raise DataContractError(f"{csv_path}:{line_number}: {error}") from error
            approval = approvals.get(record.corpus_id)
            if approval is None or not approval.permits_use(requested_use):
                raise DataContractError(
                    f"Corpus {record.corpus_id!r} is not approved for {requested_use} in {inventory_path}"
                )
            if record.is_fixture != approval.is_fixture:
                raise DataContractError(
                    f"Fixture status mismatch for corpus {record.corpus_id!r} at line {line_number}"
                )
            if record.document_id in document_ids:
                raise DataContractError(f"Duplicate document_id: {record.document_id!r}")
            document_ids.add(record.document_id)
            cleaned = clean_learner_text(record.text)
            if not cleaned:
                raise DataContractError(f"Empty text after cleaning at line {line_number}")
            records.append(replace(record, text=cleaned))
    if not records:
        raise DataContractError(f"No records found in {csv_path}")
    return records


def write_records_csv(records: Iterable[LearnerTextRecord], path: Path) -> None:
    """Write deterministic UTF-8 split files without mutating source corpora."""

    rows = [record.to_dict() for record in records]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
