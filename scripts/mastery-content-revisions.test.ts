import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { reviseMasteryContent } from "./lib/mastery-content-revisions";
import { reviseVariationTasks } from "./lib/variation-revisions";
import { assessControlledTask } from "../shared/learning-core/src/automaticity/assessment";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import {
  auditClosedTask,
  auditUnitAnswers,
} from "../shared/learning-core/src/automaticity/curriculum-audit";
import { assertWritingPrecision } from "../shared/learning-core/src/writing-precision";
test("W33 both legacy labs use repaired prompts while raw historical catalogs remain intact", async () => {
  const english =
    await import("../Apps/English/English-Automaticity/packages/content/src/index");
  const german =
    await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index");
  const en = english.grammarUnits.find(
    (unit) => unit.title === "Layered subordination",
  )!;
  const de = german.grammarUnits.find(
    (unit) => unit.title === "Feine Bedeutungsunterschiede im Modus",
  )!;
  expect(en.exercises[0]![0]).not.toContain(
    "Stacked clauses with unclear reference",
  );
  expect(en.commonError).toContain("pattern that emerge was");
  expect(de.exercises[0]![0]).not.toContain(
    "Die Maßnahme hat sicher keine Folgen",
  );
  expect(de.commonError).toContain("Es wären denkbar");
  expect(
    english.legacyGrammarUnits.find((unit) => unit.title === en.title)!
      .commonError,
  ).toBe("Stacked clauses with unclear reference.");
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

const built = (language: "en" | "de") =>
  reviseMasteryContent(
    reviseVariationTasks(
      JSON.parse(
        readFileSync(
          new URL(
            `../shared/learning-core/content/curriculum-${language}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      ) as CurriculumPack,
    ),
  );
// Every definition shipped in 2026-10-31.1, sorted by id: learners' saved
// attempts point at these hashes, so a repair may only add and retire tasks.
const shippedDefinitions = {
  en: "8c7da4da64cc6784529319b4bb84eaaf158b64879f0067a27c5a6c3b7a313195",
  de: "e9d645004aff584bc2828b060dc09993655720753178b0b22af48cf6b0ce3a8c",
};
for (const language of ["en", "de"] as const) {
  test(`W33 ${language}: no active closed task in the built curriculum fails the content audit`, () => {
    const issues = built(language)
      .units.flatMap((unit) => [
        ...activePracticeTasks(unit).flatMap(auditClosedTask),
        ...auditUnitAnswers(unit, activePracticeTasks(unit)),
      ])
      .filter((issue) => issue.severity === "error");
    expect(issues).toEqual([]);
  });
  test(`W33 ${language}: repairs keep every earlier task definition byte-identical`, () => {
    const pack = built(language);
    const earlier = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version < "2026-11-01")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(earlier.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(shippedDefinitions[language]);
    expect(validateCurriculum(pack)).toEqual([]);
  });
}
test("W33 the complete corrected sentence earns the controlled pass, typed apostrophe included", () => {
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  for (const [language, source, answer] of [
    ["de", "Das Buch liegt auf den Tisch.", "Das Buch liegt auf dem Tisch."],
    ["de", "Ich gehe in der Schule.", "Ich gehe in die Schule."],
    ["en", "I don’t have some time.", "I don't have any time."],
    ["en", "You’re ready, isn’t it?", "You're ready, aren't you?"],
  ] as const) {
    const task = built(language)
      .units.flatMap(activePracticeTasks)
      .find(
        (row) =>
          row.answerPolicy === "closed" &&
          row.modality === "writing" &&
          row.prompt.includes(source),
      );
    expect(task?.prompt).toBeDefined();
    const verdict = assessControlledTask(
      {
        language,
        id: "attempt",
        task: { ...task! },
        response: { text: answer, sha256: sha(answer) },
      } as never,
      task!,
      "2026-11-01T10:00:00.000Z",
      "assessment",
    ).verdict;
    expect(`${source} → ${answer}: ${verdict}`).toBe(
      `${source} → ${answer}: pass`,
    );
    for (const wrong of [source, source.replace(/[.?]$/u, "")]) {
      const result = assessControlledTask(
        {
          language,
          id: "attempt",
          task: { ...task! },
          response: { text: wrong, sha256: sha(wrong) },
        } as never,
        task!,
        "2026-11-01T10:00:00.000Z",
        "assessment",
      );
      expect(result.verdict).not.toBe("pass");
    }
  }
});
test("W33 both Grammar Labs ship no defective closed exercise", async () => {
  const labs = [
    (
      await import("../Apps/English/English-Automaticity/packages/content/src/index")
    ).grammarUnits,
    (
      await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index")
    ).grammarUnits,
  ];
  const issues = labs.flatMap((units) =>
    units.flatMap((unit) =>
      unit.exercises.flatMap(([prompt, answer], index) =>
        auditClosedTask({
          id: `${unit.title}#${index}`,
          answerPolicy: "closed",
          responseKind: /^(Correct|Repair|Korrigiere)/u.test(prompt)
            ? "correction"
            : "transformation",
          prompt,
          acceptedAnswers: [answer],
          solution: answer,
        }),
      ),
    ),
  );
  expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
});
