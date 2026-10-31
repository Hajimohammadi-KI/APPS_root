import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { reviseMasteryContent } from "./lib/mastery-content-revisions";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import { auditClosedTask } from "../shared/learning-core/src/automaticity/curriculum-audit";
import { assertWritingPrecision } from "../shared/learning-core/src/writing-precision";
test("W33 both legacy labs use repaired prompts while raw historical catalogs remain intact", async () => {
  const english = await import("../Apps/English/English-Automaticity/packages/content/src/index");
  const german = await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index");
  const en = english.grammarUnits.find(unit => unit.title === "Layered subordination")!;
  const de = german.grammarUnits.find(unit => unit.title === "Feine Bedeutungsunterschiede im Modus")!;
  expect(en.exercises[0]![0]).not.toContain("Stacked clauses with unclear reference");
  expect(en.commonError).toContain("pattern that emerge was");
  expect(de.exercises[0]![0]).not.toContain("Die Maßnahme hat sicher keine Folgen");
  expect(de.commonError).toContain("Es wären denkbar");
  expect(english.legacyGrammarUnits.find(unit => unit.title === en.title)!.commonError).toBe("Stacked clauses with unclear reference.");
});
for (const language of ["en", "de"] as const)
  test(`W33 ${language}: preserve original definitions, replace invalid corrections, and add real target practice in A1–C2`, () => {
    const source = JSON.parse(
      readFileSync(
        new URL(
          `../shared/learning-core/content/curriculum-${language}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ) as CurriculumPack;
    const snapshot = JSON.stringify(source);
    const revised = reviseMasteryContent(source);
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(validateCurriculum(revised)).toEqual([]);
    const retiredId =
      language === "en"
        ? "en.c.072.repair.0.writing"
        : "de.c.071.repair.0.writing";
    const old = source.units
      .flatMap((u) => u.tasks)
      .find((t) => t.id === retiredId)!;
    expect(
      revised.units.flatMap((u) => u.tasks).find((t) => t.id === retiredId),
    ).toEqual(old);
    expect(
      revised.units
        .flatMap(activePracticeTasks)
        .some((t) => t.id === retiredId),
    ).toBe(false);
    const added = revised.units
      .flatMap(activePracticeTasks)
      .filter((t) => t.id.includes("mastery-20261031"));
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      const units = revised.units.filter((u) => u.level === level);
      expect(
        units
          .flatMap(activePracticeTasks)
          .filter(
            (t) => t.id.includes("mastery-20261031") && t.stage === "retrieve",
          ),
      ).toHaveLength(2);
    }
    for (const t of added) {
      expect(t.contentReview).toBe("authored");
      expect(t.transferCondition).toBe("none");
      expect(auditClosedTask(t).filter((i) => i.severity === "error")).toEqual(
        [],
      );
      expect(t.prompt.match(/___/g)?.length ?? 0).toBeLessThanOrEqual(1);
    }
    assertWritingPrecision(
      added.flatMap((t) => t.acceptedAnswers),
      language,
    );
    expect(JSON.stringify(reviseMasteryContent(revised))).toBe(
      JSON.stringify(revised),
    );
  });
