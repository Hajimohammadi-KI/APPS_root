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
  auditGapCue,
  auditUnitAnswers,
  optionDistractors,
} from "../shared/learning-core/src/automaticity/curriculum-audit";
import {
  GAP_CUE_REVISIONS,
  gapCueRevisionsFor,
} from "../shared/learning-core/src/content-revisions";
import { gapFill } from "../shared/learning-core/src/text";
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
// Definitions published in 2026.11.01.1, and the accepted forms of 2026.11.01.2.
const releasedNovember = {
  en: "c5b92cd6333c6abdd8edd4d4c792bd1616f5a56b779168fb821f031749b57ea2",
  de: "464ab01e01b8d9c79c9a7530c559e250b150f800863e8973454153cb262ce43d",
};
const releasedForms = {
  en: "6bbe534ab49a4d8bacf37a97e9d72ba341b3d498f645990b7b91d20d8925f6d6",
  de: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};
for (const language of ["en", "de"] as const) {
  test(`W33 ${language}: no active closed task in the built curriculum fails the content audit`, () => {
    const issues = built(language)
      .units.flatMap((unit) => [
        ...activePracticeTasks(unit).flatMap(auditClosedTask),
        ...activePracticeTasks(unit).flatMap((task) =>
          auditGapCue(task, language),
        ),
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
    const released = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version === "2026-11-01.1")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(released.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(releasedNovember[language]);
    const forms = pack.units
      .flatMap((unit) => unit.tasks)
      .filter((task) => task.version === "2026-11-01.2")
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    expect(
      createHash("sha256")
        .update(forms.map((task) => JSON.stringify(task)).join("\n"))
        .digest("hex"),
    ).toBe(releasedForms[language]);
    expect(validateCurriculum(pack)).toEqual([]);
  });
}
test("W33 every cued gap fits its stored answer, and offered options expose the wrong one", () => {
  const active = new Map(
    (["en", "de"] as const).flatMap((language) =>
      built(language)
        .units.flatMap(activePracticeTasks)
        .map((task) => [task.id, task] as const),
    ),
  );
  for (const revision of GAP_CUE_REVISIONS) {
    const task = active.get(
      revision.taskId.replace(/\.writing$/u, ".cues-202611013.writing"),
    );
    expect(task?.prompt).toBe(revision.prompt);
    expect(`${task!.id}: ${gapFill(task!.prompt, task!.solution!)}`).not.toBe(
      `${task!.id}: null`,
    );
    if (/\([^()]*\/[^()]*\)\s*$|\bwith [\p{L}’']+ or [\p{L}’']+:/u.test(task!.prompt))
      expect(`${task!.id}: ${optionDistractors(task!).length}`).not.toBe(
        `${task!.id}: 0`,
      );
  }
  const first = active.get("de.c.086.retrieve.1.cues-202611013.writing")!;
  expect(first.prompt).toEndWith("Ich ___ jeden Morgen um sieben Uhr auf. (aufstehen)");
  expect(first.acceptedAnswers).toEqual(["Ich stehe jeden Morgen um sieben Uhr auf."]);
  expect(
    [...active.values()].some(
      (task) =>
        task.modality === "speaking" &&
        task.id === "de.c.086.retrieve.98.cues-202611013.speaking" &&
        task.prompt.endsWith(first.prompt),
    ),
  ).toBe(true);
});
test("W33 the complete corrected sentence earns the controlled pass, typed apostrophe included", () => {
  const sha = (text: string) => createHash("sha256").update(text).digest("hex");
  for (const [language, source, answer] of [
    ["de", "Das Buch liegt auf den Tisch.", "Das Buch liegt auf dem Tisch."],
    ["de", "Ich gehe in der Schule.", "Ich gehe in die Schule."],
    ["en", "I don’t have some time.", "I don't have any time."],
    ["en", "You’re ready, isn’t it?", "You're ready, aren't you?"],
    ["en", "I ___ ready for the lesson.", "I'm ready for the lesson."],
    ["en", "She doesn’t works.", "She does not work."],
    ["en", "I don’t have some time.", "I do not have any time."],
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
    [
      "en",
      (
        await import("../Apps/English/English-Automaticity/packages/content/src/index")
      ).grammarUnits,
    ],
    [
      "de",
      (
        await import("../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index")
      ).grammarUnits,
    ],
  ] as const;
  const issues = labs.flatMap(([language, units]) =>
    units.flatMap((unit) =>
      unit.exercises.flatMap(([prompt, answer], index) => {
        const task = {
          id: `${unit.title}#${index}`,
          answerPolicy: "closed" as const,
          modality: "writing" as const,
          responseKind: /^(Correct|Repair|Korrigiere)/u.test(prompt)
            ? ("correction" as const)
            : ("transformation" as const),
          prompt,
          acceptedAnswers: [answer],
          solution: answer,
        };
        return [...auditClosedTask(task), ...auditGapCue(task, language)];
      }),
    ),
  );
  expect(issues.filter((issue) => issue.severity === "error")).toEqual([]);
});
test("W33 the Labs find each gap-cue revision under its unit title and exercise number", () => {
  for (const language of ["en", "de"] as const) {
    const pack = built(language);
    for (const revision of GAP_CUE_REVISIONS.filter((row) =>
      row.taskId.startsWith(`${language}.`),
    )) {
      const index = revision.taskId.match(
        /\.retrieve\.(?:content-\d+-)?(\d+)\.(?:forms-\d+\.)?writing$/u,
      )?.[1];
      if (!index) continue;
      const unit = pack.units.find((row) =>
        revision.taskId.startsWith(`${row.id}.`),
      )!;
      expect(gapCueRevisionsFor(language, unit.title).get(Number(index))).toBe(
        revision,
      );
    }
  }
});
