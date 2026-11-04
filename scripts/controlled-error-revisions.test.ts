import { describe, expect, test } from "bun:test";
import {
  CONTROLLED_ERROR_FORMS,
  controlledErrorsForTask,
  controlledErrorsForAnswer,
  controlledErrorTaskId,
} from "../shared/learning-core/src/controlled-error-forms";
import { grammarUnits as englishLabs } from "../Apps/English/English-Automaticity/packages/content/src/index";
import { grammarUnits as germanLabs } from "../Apps/Deutsch/Deutsch-Automaticity/packages/content/src/index";
import { normalizeText } from "../shared/learning-core/src/text";
import { checkClosedAnswer } from "../shared/learning-core/src/automaticity/closed-answer";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
  type PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import { applyControlledErrorRevisions } from "./lib/controlled-error-revisions";

test("both Grammar Labs carry the same definite errors and never accept an unknown response", () => {
  for (const spec of CONTROLLED_ERROR_FORMS) {
    const labs = spec.language === "en" ? englishLabs : germanLabs;
    const item = labs
      .flatMap((unit) => unit.exercises)
      .find(
        ([, answer, metadata]) =>
          normalizeText(answer) === normalizeText(spec.acceptedAnswers[0]!) &&
          spec.rejectedAnswers.every((wrong) =>
            metadata?.rejectedAnswers?.some(
              (row) => row.answer === wrong.answer,
            ),
          ),
      );
    expect(item).toBeDefined();
    const [prompt, answer, metadata] = item!;
    const task = {
      prompt,
      responseKind: "cloze" as const,
      modality: "writing" as const,
      terminalFullStop: true,
      acceptedAnswers: [answer, ...(metadata?.acceptedAnswers ?? [])],
      rejectedAnswers: metadata?.rejectedAnswers ?? [],
    };
    for (const wrong of spec.rejectedAnswers)
      expect(checkClosedAnswer(task, wrong.answer, spec.language).verdict).toBe(
        "needs_repair",
      );
    expect(
      checkClosedAnswer(task, "Uncovered learner wording", spec.language)
        .verdict,
    ).toBe("not_assessed");
  }
});

const check = (task: PracticeTask, response: string, language: "en" | "de") =>
  checkClosedAnswer(
    { ...task, terminalFullStop: task.normalisation.terminalFullStop },
    response,
    language,
  );

for (const language of ["en", "de"] as const) {
  const app =
    language === "en"
      ? "English/English-Automaticity"
      : "Deutsch/Deutsch-Automaticity";
  const pack = (await Bun.file(
    `Apps/${app}/apps/web/public/learning-core/curriculum-${language}.json`,
  ).json()) as CurriculumPack;
  const specs = CONTROLLED_ERROR_FORMS.filter(
    (row) => row.language === language,
  );
  const revised = applyControlledErrorRevisions(pack);
  describe(`${language} authored controlled errors`, () => {
    test("reproduces the shipped historical gap and changes only listed definite errors to repair", () => {
      for (const spec of specs) {
        const old = pack.units
          .find((unit) => unit.id === spec.constructionId)!
          .tasks.find((task) => task.id === spec.taskId)!;
        const current = revised.units
          .find((unit) => unit.id === spec.constructionId)!
          .tasks.find(
            (task) => task.id === controlledErrorTaskId(spec.taskId),
          )!;
        for (const row of spec.rejectedAnswers) {
          // The A1 English be distractors were already wrong via option matching;
          // the other 24 forms reproduce the previous unassessed gap.
          expect(check(old, row.answer, language).verdict).toBe(
            spec.constructionId === "en.c.001"
              ? "needs_repair"
              : "not_assessed",
          );
          const result = check(current, row.answer, language);
          expect(result.verdict).toBe("needs_repair");
          expect(result.reason).toBe("rejected");
          expect(result.feedback).toContain(row.explanation);
          expect(row.explanation).not.toContain(current.acceptedAnswers[0]!);
        }
        expect(current.acceptedAnswers).toEqual(old.acceptedAnswers);
        for (const answer of old.acceptedAnswers)
          expect(check(current, answer, language).verdict).toBe("pass");
      }
    });

    test("preserves all original task definitions and evaluation items byte for byte", () => {
      expect(validateCurriculum(revised)).toEqual([]);
      for (const unit of pack.units) {
        const current = revised.units.find((row) => row.id === unit.id)!;
        for (const original of unit.tasks)
          expect(
            JSON.stringify(current.tasks.find((row) => row.id === original.id)),
          ).toBe(JSON.stringify(original));
        expect(
          current.tasks.filter((row) => row.partition !== "practice"),
        ).toEqual(unit.tasks.filter((row) => row.partition !== "practice"));
      }
      for (const spec of specs) {
        const unit = revised.units.find(
          (row) => row.id === spec.constructionId,
        )!;
        const active = activePracticeTasks(unit);
        expect(active.some((row) => row.id === spec.taskId)).toBe(false);
        expect(
          active.some((row) => row.id === controlledErrorTaskId(spec.taskId)),
        ).toBe(true);
        expect(
          unit.tasks.find(
            (row) => row.id === controlledErrorTaskId(spec.taskId),
          )!.contentReview,
        ).toBe("authored");
      }
    });

    test("is pure and idempotent", () => {
      const before = JSON.stringify(pack);
      expect(applyControlledErrorRevisions(revised)).toEqual(revised);
      applyControlledErrorRevisions(pack);
      expect(JSON.stringify(pack)).toBe(before);
    });

    test("fails closed when a source prompt or accepted-answer fingerprint changes", () => {
      for (const field of ["prompt", "acceptedAnswers"] as const) {
        const altered = structuredClone(pack);
        const spec = specs[0]!;
        const task = altered.units
          .find((row) => row.id === spec.constructionId)!
          .tasks.find((row) => row.id === spec.taskId)!;
        if (field === "prompt") task.prompt += " Changed.";
        else task.acceptedAnswers.push("An unreviewed extra accepted form.");
        expect(() => applyControlledErrorRevisions(altered)).toThrow(
          "Changed controlled-error task scope",
        );
        expect(controlledErrorsForTask(language, task)).toEqual([]);
      }
      const spec = specs[0]!;
      expect(
        controlledErrorsForTask(language, {
          id: "different.id",
          prompt: spec.prompt,
          acceptedAnswers: spec.acceptedAnswers,
        }),
      ).toEqual([]);
    });

    test("does not turn any previously wrong or unassessed response into a pass", () => {
      for (const spec of specs) {
        const old = pack.units
          .find((unit) => unit.id === spec.constructionId)!
          .tasks.find((task) => task.id === spec.taskId)!;
        const current = revised.units
          .find((unit) => unit.id === spec.constructionId)!
          .tasks.find(
            (task) => task.id === controlledErrorTaskId(spec.taskId),
          )!;
        const probes = [
          ...spec.rejectedAnswers.map((row) => row.answer),
          ...(old.rejectedAnswers ?? []).map((row) => row.answer),
          "unlisted response",
          "",
          old.prompt,
        ];
        for (const response of probes) {
          if (check(old, response, language).verdict !== "pass")
            expect(check(current, response, language).verdict).not.toBe("pass");
        }
      }
    });

    test("authoring helpers require the exact accepted forms and construction", () => {
      for (const spec of specs) {
        expect(controlledErrorsForTask(language, spec)).toEqual(
          spec.rejectedAnswers,
        );
        expect(
          controlledErrorsForAnswer(
            language,
            spec.constructionId,
            spec.acceptedAnswers,
          ),
        ).toEqual(spec.rejectedAnswers);
        expect(
          controlledErrorsForAnswer(
            language,
            "different.construction",
            spec.acceptedAnswers,
          ),
        ).toEqual([]);
        expect(
          controlledErrorsForAnswer(language, spec.constructionId, [
            ...spec.acceptedAnswers,
            "extra",
          ]),
        ).toEqual([]);
      }
    });
  });

  test(`${language}: grammatical alternatives and unknown forms stay unassessed`, () => {
    const spec = specs.find(
      (row) =>
        row.constructionId === (language === "en" ? "en.c.015" : "de.c.086"),
    )!;
    const current = revised.units
      .find((unit) => unit.id === spec.constructionId)!
      .tasks.find((task) => task.id === controlledErrorTaskId(spec.taskId))!;
    for (const response of language === "en"
      ? ["She studies for her exam.", "She is preparing for her exam."]
      : [
          "Ich stehe auf jeden Morgen um sieben Uhr.",
          "Jeden Morgen stehe ich um sieben Uhr auf.",
        ])
      expect(check(current, response, language).verdict).toBe("not_assessed");
  });
}

test("bounded authoring scope is 26 forms on 13 written tasks", () => {
  expect(CONTROLLED_ERROR_FORMS).toHaveLength(13);
  expect(
    CONTROLLED_ERROR_FORMS.flatMap((row) => row.rejectedAnswers),
  ).toHaveLength(26);
});
