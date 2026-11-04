import { describe, expect, test } from "bun:test";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import { checkClosedAnswer } from "../shared/learning-core/src/automaticity/closed-answer";
import {
  REPRESENTATIVE_SCOPES,
  representativeTasks,
} from "../shared/learning-core/src/automaticity/representative-tasks";
import {
  CONTROLLED_ERROR_FORMS,
  controlledErrorTaskId,
} from "../shared/learning-core/src/controlled-error-forms";
import {
  LEARNING_CYCLES,
  LEARNING_CYCLE_VERSION,
} from "../shared/learning-core/src/learning-cycles";
import { normalizeText } from "../shared/learning-core/src/text";
import { applyLearningCycles } from "./lib/learning-cycle-revisions";

test("records the historical scenario-reuse defect without changing historical tasks", () => {
  for (const scope of REPRESENTATIVE_SCOPES) {
    const tasks = representativeTasks(scope).filter(
      (task) => task.modality === "writing",
    );
    expect(tasks.find((task) => task.stage === "produce")!.prompt).toBe(
      tasks.find((task) => task.stage === "transfer")!.prompt,
    );
    expect(tasks.find((task) => task.stage === "vary")!.contextId).toBe(
      tasks.find((task) => task.stage === "retain")!.contextId,
    );
  }
});

test("the authored scope is exactly six selected units per language", () => {
  expect(LEARNING_CYCLES.map((spec) => spec.constructionId)).toEqual([
    "en.c.001",
    "en.c.015",
    "en.c.034",
    "en.c.048",
    "en.c.058",
    "en.c.072",
    "de.c.001",
    "de.c.015",
    "de.c.033",
    "de.c.043",
    "de.c.057",
    "de.c.071",
  ]);
});

for (const [language, app] of [
  ["en", "English/English-Automaticity"],
  ["de", "Deutsch/Deutsch-Automaticity"],
] as const) {
  const shipped = (await Bun.file(
    `Apps/${app}/apps/web/public/learning-core/curriculum-${language}.json`,
  ).json()) as CurriculumPack;
  // Read the stable pre-cycle input even after generated browser packs are rebuilt.
  const source = structuredClone(shipped);
  for (const unit of source.units) {
    unit.tasks = unit.tasks.filter(
      (task) => !task.id.includes(".cycle-202611042."),
    );
    delete unit.learningCycle;
  }
  const revised = applyLearningCycles(source);
  const units = revised.units.filter((unit) => unit.learningCycle);
  describe(`${language} authored learning cycles`, () => {
    test("selected units provide seven exact, active, ordered writing steps", () => {
      expect(units).toHaveLength(6);
      expect(validateCurriculum(revised)).toEqual([]);
      for (const unit of units) {
        const cycle = unit.learningCycle!;
        expect(cycle.version).toBe(LEARNING_CYCLE_VERSION);
        expect(
          Object.values(cycle.goals).every((value) => value.trim().length > 15),
        ).toBe(true);
        expect(cycle.steps.map((step) => step.stage)).toEqual([
          "notice",
          "retrieve",
          "vary",
          "produce",
          "repair",
          "transfer",
          "retain",
        ]);
        expect(new Set(cycle.steps.map((step) => step.taskId)).size).toBe(7);
        const original = source.units.find((row) => row.id === unit.id)!;
        expect(unit.tasks).toHaveLength(original.tasks.length + 6);
        for (const step of cycle.steps) {
          const task = activePracticeTasks(unit).find(
            (row) => row.id === step.taskId,
          )!;
          expect(task).toBeDefined();
          expect(task.stage).toBe(step.stage);
          expect(task.modality).toBe("writing");
          expect(task.partition).toBe("practice");
          expect(task.contentReview).toBe("authored");
          expect(step.purpose.length).toBeGreaterThan(20);
        }
      }
    });
    test("preserves every old task, source pack and repeated application", () => {
      const before = JSON.stringify(source);
      expect(applyLearningCycles(revised)).toEqual(revised);
      expect(applyLearningCycles(source)).toEqual(revised);
      expect(JSON.stringify(source)).toBe(before);
      for (const original of source.units) {
        const current = revised.units.find((row) => row.id === original.id)!;
        for (const task of original.tasks)
          expect(current.tasks.find((row) => row.id === task.id)).toEqual(task);
        expect(current.retiredTasks).toEqual(original.retiredTasks);
      }
    });
    test("separates production, new-situation practice and fresh retention without automatic open grading", () => {
      for (const unit of units) {
        const tasks = unit.learningCycle!.steps.map((step) =>
          unit.tasks.find((task) => task.id === step.taskId)!,
        );
        const produce = tasks[3]!,
          transfer = tasks[5]!,
          retain = tasks[6]!;
        expect(produce.prompt).not.toBe(transfer.prompt);
        expect(produce.contextId).not.toBe(transfer.contextId);
        expect(produce.itemFamily).not.toBe(transfer.itemFamily);
        expect(unit.learningCycle!.steps[3]!.purpose).not.toBe(
          unit.learningCycle!.steps[5]!.purpose,
        );
        for (const task of [produce, transfer, tasks[0]!]) {
          expect(task.acceptedAnswers).toEqual([]);
          expect(task.solution).toBeNull();
          expect(task.constructionAssessment).toBeUndefined();
          expect(task.rejectedAnswers).toBeUndefined();
          expect(task.answerPolicy).toBe(
            task.stage === "notice" ? "reflection" : "open",
          );
        }
        expect(transfer.transferCondition).toBe("elicited");
        expect(transfer.prompt).not.toMatch(
          /present continuous|conditional|inversion|relative clause|Konjunktiv|Partizip|Modalverb|Relativsatz|würde|\bUse (?:the|a)\b|\bVerwende\b/u,
        );
        for (const other of tasks.slice(0, 6)) {
          expect(retain.contextId).not.toBe(other.contextId);
          expect(retain.prompt).not.toBe(other.prompt);
        }
        for (const task of [tasks[2]!, tasks[4]!, retain]) {
          expect(task.acceptedAnswers.length).toBeGreaterThan(0);
          expect(task.constructionAssessment).toBeUndefined();
          for (const accepted of task.acceptedAnswers) {
            expect(task.prompt.includes(accepted)).toBe(false);
            expect(
              checkClosedAnswer(
                { ...task, terminalFullStop: true },
                accepted,
                language,
              ).verdict,
            ).toBe("pass");
            expect(
              task.rejectedAnswers?.some(
                (row) => normalizeText(row.answer) === normalizeText(accepted),
              ) ?? false,
            ).toBe(false);
          }
          for (const rejected of task.rejectedAnswers ?? [])
            expect(
              checkClosedAnswer(
                { ...task, terminalFullStop: true },
                rejected.answer,
                language,
              ).verdict,
            ).toBe("needs_repair");
          expect(
            checkClosedAnswer(
              { ...task, terminalFullStop: true },
              "Uncovered learner wording",
              language,
            ).verdict,
          ).toBe("not_assessed");
        }
        expect(tasks[4]!.contextId).toBe(tasks[1]!.contextId);
        expect(tasks[4]!.itemFamily).toBe(tasks[1]!.itemFamily);
      }
    });
    test("fails closed for missing, changed, retired and conflicting scopes", () => {
      const spec = CONTROLLED_ERROR_FORMS.find(
        (row) => row.language === language,
      )!;
      for (const change of [
        "missing",
        "prompt",
        "answers",
        "inactive",
        "conflict",
      ] as const) {
        const altered = structuredClone(source),
          unit = altered.units.find((row) => row.id === spec.constructionId)!;
        const task = unit.tasks.find(
          (row) => row.id === controlledErrorTaskId(spec.taskId),
        )!;
        if (change === "missing")
          altered.units = altered.units.filter(
            (row) => row.id !== spec.constructionId,
          );
        if (change === "prompt") task.prompt += " Changed";
        if (change === "answers")
          task.acceptedAnswers.push("Unapproved alternative");
        if (change === "inactive")
          (unit.retiredTasks ??= []).push({
            taskId: task.id,
            replacementTaskId: "other",
            reason: "fixture",
            retiredOn: "2026-11-04",
          });
        if (change === "conflict")
          unit.tasks.push({
            ...task,
            id: `${unit.id}.cycle-202611042.notice.writing`,
          });
        expect(() => applyLearningCycles(altered)).toThrow(/learning-cycle/u);
      }
      for (const change of ["metadata", "task", "inactive-cycle"] as const) {
        const altered = structuredClone(revised),
          unit = altered.units.find((row) => row.id === spec.constructionId)!;
        if (change === "metadata") unit.learningCycle!.goals.use = "Changed";
        else if (change === "task")
          unit.tasks.find(
            (row) => row.stage === "transfer" && row.id.includes(".cycle-"),
          )!.prompt += " Changed";
        else
          (unit.retiredTasks ??= []).push({
            taskId: unit.learningCycle!.steps[0]!.taskId,
            replacementTaskId: unit.learningCycle!.steps[1]!.taskId,
            reason: "fixture",
            retiredOn: "2026-11-04",
          });
        expect(() => applyLearningCycles(altered)).toThrow(
          "Changed learning-cycle definition",
        );
      }
    });
  });
}
