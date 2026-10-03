"""Fetch and normalize pinned UniversalCEFR ELG evaluation corpora."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
CEFR_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}
SOURCES = (
    {
        "corpus_id": "universalcefr-elg-en",
        "language": "en",
        "revision": "5bcca039738fa3e611847964741234b73405718d",
        "filename": "elg-cefr-en.json",
        "expected_source_count": 712,
        "expected_sha256": "5F748AE566C6470389681DBB1F3959DCF990B08A718E7BC81A176ED95EEE2B98",
        "source_name": "elg-cefr-en",
    },
    {
        "corpus_id": "universalcefr-elg-de",
        "language": "de",
        "revision": "5f6d8ba9b068906a1df217c756ce2fb6a0b05f84",
        "filename": "elg-cefr-de.json",
        "expected_source_count": 509,
        "expected_sha256": "3063DE6C199B593BA90E9C6C6F93ACB474F1E878302887914B8722586C14C9EF",
        "source_name": "elg-cefr-de",
    },
)


def main() -> int:
    raw_dir = PROJECT_ROOT / "data" / "raw" / "universalcefr-elg-v1"
    output_dir = PROJECT_ROOT / "data" / "processed" / "external-evaluation-v1"
    raw_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "schema_version": 1,
        "purpose": "evaluation_only",
        "domain": "CEFR-labelled reference documents",
        "licence_id": "CC-BY-NC-SA-4.0",
        "sources": [],
    }
    for source in SOURCES:
        repository = f"UniversalCEFR/{str(source['source_name']).replace('-', '_')}"
        url = (
            f"https://huggingface.co/datasets/{repository}/resolve/"
            f"{source['revision']}/{source['filename']}"
        )
        with urlopen(url) as response:  # noqa: S310 - immutable HTTPS source above
            raw_bytes = response.read()
        raw_sha256 = hashlib.sha256(raw_bytes).hexdigest().upper()
        if raw_sha256 != source["expected_sha256"]:
            raise RuntimeError(
                f"SHA-256 mismatch for {source['corpus_id']}: {raw_sha256}"
            )
        raw_path = raw_dir / str(source["filename"])
        raw_path.write_bytes(raw_bytes)
        rows = json.loads(raw_bytes.decode("utf-8"))
        if len(rows) != source["expected_source_count"]:
            raise RuntimeError(f"Unexpected source count for {source['corpus_id']}: {len(rows)}")
        normalized: list[dict[str, object]] = []
        excluded_levels: dict[str, int] = {}
        for source_index, row in enumerate(rows):
            level = str(row.get("cefr_level", "")).upper().strip()
            if level not in CEFR_LEVELS:
                excluded_levels[level] = excluded_levels.get(level, 0) + 1
                continue
            if row.get("lang") != source["language"]:
                raise RuntimeError(f"Language mismatch in {source['corpus_id']}")
            if row.get("source_name") != source["source_name"]:
                raise RuntimeError(f"Source-name mismatch in {source['corpus_id']}")
            if row.get("category") != "reference":
                raise RuntimeError(f"Category mismatch in {source['corpus_id']}")
            if row.get("license") != "CC BY-NC-SA 4.0":
                raise RuntimeError(f"Licence mismatch in {source['corpus_id']}")
            text_hash = hashlib.sha256(str(row["text"]).encode("utf-8")).hexdigest()[:16]
            source_title = str(row.get("title", "")).strip()
            normalized.append(
                {
                    "document_id": (
                        f"{source['corpus_id']}:{source_index:04d}:{text_hash}"
                    ),
                    "corpus_id": source["corpus_id"],
                    "text": row["text"],
                    "cefr_level": level,
                    "language": source["language"],
                    "genre": "reference-document",
                    "learner_id": "",
                    "prompt_id": "",
                    "source_group_id": source_title if source_title.lower() != "na" else text_hash,
                    "licence_id": "CC-BY-NC-SA-4.0",
                    "source_url": url,
                    "is_fixture": False,
                }
            )
        output_path = output_dir / f"{source['corpus_id']}.csv"
        with output_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(normalized[0]))
            writer.writeheader()
            writer.writerows(normalized)
        manifest["sources"].append(
            {
                **source,
                "url": url,
                "sha256": raw_sha256,
                "source_count": len(rows),
                "evaluation_count": len(normalized),
                "excluded_noncanonical_levels": excluded_levels,
                "output": str(output_path.relative_to(PROJECT_ROOT)),
            }
        )
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
