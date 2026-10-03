import { describe, expect, test } from "bun:test";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import { reviseVariationTasks } from "./lib/variation-revisions";

for (const language of ["en", "de"] as const) {
  const baseline = (await Bun.file(
    `shared/learning-core/content/curriculum-${language}.json`,
  ).json()) as CurriculumPack;
  describe(`${language} variation curriculum`, () => {
    test("all old task definitions, lesson IDs and evaluation items survive unchanged", () => {
      const result = reviseVariationTasks(baseline);
      expect(validateCurriculum(result)).toEqual([]);
      expect(result.units.map((unit) => unit.id)).toEqual(
        baseline.units.map((unit) => unit.id),
      );
      for (const unit of baseline.units) {
        const changed = result.units.find((row) => row.id === unit.id)!;
        for (const task of unit.tasks)
          expect(changed.tasks.find((row) => row.id === task.id)).toEqual(task);
        expect(
          changed.tasks.filter((task) => task.partition !== "practice"),
        ).toEqual(unit.tasks.filter((task) => task.partition !== "practice"));
      }
    });
    test("fallback questions become concrete variation with honest open assessment", () => {
      const result = reviseVariationTasks(baseline);
      let replacements = 0;
      for (const unit of result.units) {
        const active = activePracticeTasks(unit);
        expect(
          active.some((task) => task.id === `${unit.id}.vary.99.writing`),
        ).toBe(false);
        for (const task of active.filter((task) =>
          task.id.includes(".vary.pattern-20261002."),
        )) {
          replacements++;
          expect(task.prompt).toContain(unit.examples[0]!);
          expect(task.prompt).toContain(
            language === "en" ? "two new versions" : "zwei neue Fassungen",
          );
          expect(task.acceptedAnswers).toEqual([]);
          expect(task.contentReview).toBe("authored");
          expect(task.partition).toBe("practice");
          expect(task.transferCondition).toBe("none");
        }
      }
      expect(replacements).toBeGreaterThan(100);
    });
    test("generation is idempotent and does not mutate the source", () => {
      const before = JSON.stringify(baseline);
      const once = reviseVariationTasks(baseline);
      expect(reviseVariationTasks(once)).toEqual(once);
      expect(JSON.stringify(baseline)).toBe(before);
    });
  });
}
