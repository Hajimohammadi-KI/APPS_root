"""Convert the raw MERLIN German plain-text corpus into the repository's data contract."""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

FIELDNAMES = [
    "document_id",
    "corpus_id",
    "text",
    "cefr_level",
    "language",
    "genre",
    "learner_id",
    "prompt_id",
    "source_group_id",
    "licence_id",
    "source_url",
    "is_fixture",
]

_RATING_RE = re.compile(r"^Overall CEFR rating:\s*(\S+)", re.MULTILINE)
_TASK_RE = re.compile(r"^Task\s*:\s*(.+?)\s*-\s*ID:\s*(\S+)", re.MULTILINE)
_AUTHOR_RE = re.compile(r"^Author ID:\s*(\S+)", re.MULTILINE)


def convert(meta_dir: Path, plain_dir: Path, output_path: Path) -> tuple[int, int]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    written = 0
    skipped = 0
    with output_path.open("w", encoding="utf-8", newline="") as dst:
        writer = csv.DictWriter(dst, fieldnames=FIELDNAMES)
        writer.writeheader()
        for meta_path in sorted(meta_dir.glob("*.txt")):
            meta_text = meta_path.read_text(encoding="utf-8", errors="strict")
            rating_match = _RATING_RE.search(meta_text)
            author_match = _AUTHOR_RE.search(meta_text)
            plain_path = plain_dir / meta_path.name
            if not rating_match or not author_match or not plain_path.exists():
                skipped += 1
                continue
            level = rating_match.group(1).strip().rstrip("+")
            author_id = author_match.group(1).strip()
            body = plain_path.read_text(encoding="utf-8", errors="strict").strip()
            if not body:
                skipped += 1
                continue
            task_match = _TASK_RE.search(meta_text)
            genre = task_match.group(1).strip() if task_match else "unknown"
            prompt_id = task_match.group(2).strip() if task_match else ""
            writer.writerow(
                {
                    "document_id": author_id,
                    "corpus_id": "merlin-de",
                    "text": body,
                    "cefr_level": level,
                    "language": "de",
                    "genre": genre,
                    "learner_id": author_id,
                    "prompt_id": prompt_id,
                    "source_group_id": "",
                    "licence_id": "CC-BY-SA-4.0",
                    "source_url": "https://www.merlin-platform.eu/",
                    "is_fixture": "false",
                }
            )
            written += 1
    return written, skipped


if __name__ == "__main__":
    meta_dir = Path(sys.argv[1])
    plain_dir = Path(sys.argv[2])
    output_path = Path(sys.argv[3])
    written, skipped = convert(meta_dir, plain_dir, output_path)
    print(f"wrote {written} rows to {output_path}; skipped {skipped}")
