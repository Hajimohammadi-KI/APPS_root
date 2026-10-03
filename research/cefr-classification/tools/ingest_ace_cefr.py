"""Convert the raw Ace-CEFR stratified CSV into the repository's data contract."""

from __future__ import annotations

import csv
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


def normalise_level(bin_string: str) -> str:
    """Fold the dataset's nine half-point bins onto the six CEFR bands the schema supports."""

    return bin_string.strip().rstrip("+")


def convert(input_path: Path, output_path: Path) -> int:
    with input_path.open("r", encoding="utf-8-sig", newline="") as src:
        rows = list(csv.DictReader(src))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as dst:
        writer = csv.DictWriter(dst, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "document_id": row["passage_id"],
                    "corpus_id": "ace-cefr",
                    "text": row["text"],
                    "cefr_level": normalise_level(row["cefr_bin_string"]),
                    "language": "en",
                    "genre": "conversational",
                    "learner_id": "",
                    "prompt_id": "",
                    "source_group_id": "",
                    "licence_id": "CC0-1.0",
                    "source_url": "https://arxiv.org/abs/2506.14046",
                    "is_fixture": "false",
                }
            )
    return len(rows)


if __name__ == "__main__":
    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    count = convert(input_path, output_path)
    print(f"wrote {count} rows to {output_path}")
