"""Generate bilingual contract-test rows; never use these as CEFR evidence."""

from __future__ import annotations

import csv
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = PROJECT_ROOT / "tests" / "fixtures" / "synthetic-learner-texts.csv"


# Templates intentionally include a range of sentence shapes so tokenisation and
# feature extraction execute realistic code paths. Their CEFR labels are assigned
# for software testing only and have not been rated by teachers or examiners.
TEMPLATES: dict[str, dict[str, str]] = {
    "A1": {
        "en": "I am {name}. I live in {city}. I like tea and music.",
        "de": "Ich heiße {name}. Ich wohne in {city}. Ich mag Tee und Musik.",
    },
    "A2": {
        "en": "Yesterday I went to {place} because I needed {item}. Then I met my friend.",
        "de": "Gestern ging ich nach {place}, weil ich {item} brauchte. Dann traf ich meinen Freund.",
    },
    "B1": {
        "en": "Although the journey to {place} was tiring, I learned that planning ahead makes unexpected problems easier to solve.",
        "de": "Obwohl die Reise nach {place} anstrengend war, habe ich gelernt, dass eine gute Planung unerwartete Probleme leichter macht.",
    },
    "B2": {
        "en": "The proposal about {topic} appears practical; however, its long-term effect depends on whether participants receive clear feedback and enough time to adapt.",
        "de": "Der Vorschlag zum Thema {topic} wirkt zwar praktikabel; seine langfristige Wirkung hängt jedoch davon ab, ob die Beteiligten klares Feedback und genügend Zeit zur Anpassung erhalten.",
    },
    "C1": {
        "en": "Evaluating {topic} requires more than comparing immediate outcomes: the analysis must also account for hidden assumptions, uneven evidence, and consequences that emerge only gradually.",
        "de": "Eine Bewertung des Themas {topic} erfordert mehr als den Vergleich unmittelbarer Ergebnisse: Die Analyse muss ebenso verborgene Annahmen, eine ungleichmäßige Beweislage und erst allmählich erkennbare Folgen berücksichtigen.",
    },
    "C2": {
        "en": "However compelling the prevailing account of {topic} may seem, its explanatory elegance should not obscure the methodological compromises through which ambiguity is converted into apparent certainty.",
        "de": "So überzeugend die vorherrschende Darstellung des Themas {topic} auch erscheinen mag, ihre erklärerische Eleganz darf nicht über jene methodischen Kompromisse hinwegtäuschen, durch die Mehrdeutigkeit in scheinbare Gewissheit überführt wird.",
    },
}


NAMES = ("Ava", "Noah", "Mina", "Leon", "Sara", "Omid")
CITIES = ("Berlin", "Bonn", "Hamburg", "Leipzig", "Köln", "Bremen")
PLACES = ("the library", "the station", "the market", "the museum", "the park", "the course")
ITEMS = ("a book", "a ticket", "fresh food", "new information", "some rest", "help")
TOPICS = ("online learning", "public transport", "language feedback", "local research", "digital privacy", "teacher planning")


def build_rows() -> list[dict[str, object]]:
    """Create six independent rows per level and language with stable IDs."""

    rows: list[dict[str, object]] = []
    for level, language_templates in TEMPLATES.items():
        for language, template in language_templates.items():
            for variant in range(6):
                document_id = f"fixture-{language}-{level.lower()}-{variant + 1:02d}"
                text = template.format(
                    name=NAMES[variant],
                    city=CITIES[variant],
                    place=PLACES[variant],
                    item=ITEMS[variant],
                    topic=TOPICS[variant],
                )
                rows.append(
                    {
                        "document_id": document_id,
                        "corpus_id": "synthetic-contract-fixture",
                        "text": text,
                        "cefr_level": level,
                        "language": language,
                        "genre": "generated-contract-test",
                        "learner_id": f"synthetic-learner-{language}-{level.lower()}-{variant + 1:02d}",
                        "prompt_id": f"synthetic-prompt-{language}-{level.lower()}-{variant + 1:02d}",
                        "source_group_id": document_id,
                        "licence_id": "repository-generated",
                        "source_url": "",
                        "is_fixture": True,
                    }
                )
    return rows


def main() -> int:
    """Write deterministic UTF-8 CSV output and report its non-research status."""

    rows = build_rows()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} fixture-only rows to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

