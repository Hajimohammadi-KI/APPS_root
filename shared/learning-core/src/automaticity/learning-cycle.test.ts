import { expect, test } from "bun:test";
import {
  REPRESENTATIVE_SCOPES,
  representativeTasks,
} from "./representative-tasks";
import { activePracticeTasks, type ConstructionUnit } from "./curriculum";
import { learningCycleTask } from "./learning-cycle";

function fixture(): ConstructionUnit {
  const scope = REPRESENTATIVE_SCOPES[0]!;
  const unit: ConstructionUnit = {
    id: scope.constructionId,
    language: "en",
    title: "Fixture",
    level: "A1",
    familyIds: [scope.familyId],
    prerequisites: [],
    lessonAlias: "fixture",
    rule: "Fixture",
    examples: [],
    commonError: "Fixture",
    review: "authored",
    sources: [],
    tasks: representativeTasks(scope),
  };
  const first = unit.tasks.find(
    (task) => task.stage === "retrieve" && task.modality === "writing",
  )!;
  unit.tasks.push({ ...structuredClone(first), id: first.id + ".cycle" });
  const candidates = unit.tasks.filter(
    (row) => row.stage === "retrieve" && row.modality === "writing",
  );
  const chosen = candidates.at(-1)!;
  unit.learningCycle = {
    version: "fixture",
    goals: { form: "Form", meaning: "Meaning", use: "Use" },
    steps: [{ stage: "retrieve", taskId: chosen.id, purpose: "Retrieve" }],
  };
  return unit;
}

test("cycle navigation uses the mapped definition, not the first task at that stage", () => {
  const unit = fixture();
  expect(learningCycleTask(unit, "retrieve", "writing")?.id).toBe(
    unit.learningCycle!.steps[0]!.taskId,
  );
});

test("a missing or retired mapped definition never silently falls back", () => {
  const unit = fixture();
  const id = unit.learningCycle!.steps[0]!.taskId;
  unit.tasks = unit.tasks.filter((task) => task.id !== id);
  expect(learningCycleTask(unit, "retrieve", "writing")).toBeUndefined();
  const retired = fixture();
  retired.retiredTasks = [
    {
      taskId: id,
      replacementTaskId: retired.tasks[0]!.id,
      reason: "fixture",
      retiredOn: "2026-11-04",
    },
  ];
  expect(learningCycleTask(retired, "retrieve", "writing")).toBeUndefined();
});

test("unmapped speech and legacy units retain their active stage behavior without mutating content", () => {
  const unit = fixture();
  const before = JSON.stringify(unit);
  const expected = activePracticeTasks(unit).find(
    (task) => task.stage === "retrieve" && task.modality === "speaking",
  );
  expect(learningCycleTask(unit, "retrieve", "speaking")?.id).toBe(
    expected?.id,
  );
  expect(JSON.stringify(unit)).toBe(before);
  delete unit.learningCycle;
  expect(learningCycleTask(unit, "retrieve", "writing")?.id).toBe(
    activePracticeTasks(unit).find(
      (task) => task.stage === "retrieve" && task.modality === "writing",
    )?.id,
  );
});

test("modality switches never offer a writing task as speaking", () => {
  const unit = fixture();
  unit.tasks = unit.tasks.filter((task) => task.modality !== "speaking");
  expect(learningCycleTask(unit, "retrieve", "speaking")).toBeUndefined();
  expect(learningCycleTask(unit, "retrieve", "speaking", true)?.modality).toBe(
    "writing",
  );
});
