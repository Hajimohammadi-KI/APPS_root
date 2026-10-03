import { test, expect } from "bun:test";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
  type PracticeTask,
} from "./curriculum";
const original: PracticeTask = {
  id: "old",
  version: "1",
  constructionId: "en.c.001",
  familyId: "G01",
  itemFamily: "old",
  contextId: "old",
  rubricVersion: "open-review-v1",
  stage: "retrieve",
  modality: "writing",
  partition: "practice",
  transferCondition: "none",
  contentReview: "authored",
  prompt: "An old task",
  answerPolicy: "open",
  responseKind: "free_output",
  acceptedAnswers: [],
  hints: [],
  solution: null,
  normalisation: {
    nfc: true,
    whitespace: true,
    terminalFullStop: true,
    preserveCase: true,
  },
  sourceId: "fixture",
};
const pack = (): CurriculumPack => ({
  version: "2",
  mappingVersion: "1",
  language: "en",
  units: [
    {
      id: "en.c.001",
      language: "en",
      title: "Fixture",
      level: "A1",
      familyIds: ["G01"],
      prerequisites: [],
      lessonAlias: "fixture",
      rule: "Fixture",
      examples: [],
      commonError: "Fixture",
      review: "authored",
      sources: [],
      tasks: [
        structuredClone(original),
        { ...original, id: "new", version: "2", prompt: "A replacement task" },
      ],
      retiredTasks: [
        {
          taskId: "old",
          replacementTaskId: "new",
          reason: "The old prompt exposed the answer.",
          retiredOn: "2026-09-05",
        },
      ],
    },
  ],
});
test("selection excludes a retired task without changing its historical definition", () => {
  const p = pack(),
    before = JSON.stringify(p.units[0]!.tasks[0]);
  expect(validateCurriculum(p)).toEqual([]);
  expect(activePracticeTasks(p.units[0]!).map((task) => task.id)).toEqual([
    "new",
  ]);
  expect(JSON.stringify(p.units[0]!.tasks[0])).toBe(before);
});
for (const mode of [
  "missing-original",
  "missing-replacement",
  "different-mode",
  "different-stage",
  "self",
  "chain",
  "duplicate",
]) {
  test(`invalid retirement rejected: ${mode}`, () => {
    const p = pack(),
      unit = p.units[0]!,
      retired = unit.retiredTasks![0]!;
    if (mode === "missing-original") retired.taskId = "absent";
    if (mode === "missing-replacement") retired.replacementTaskId = "absent";
    if (mode === "different-mode") unit.tasks[1]!.modality = "speaking";
    if (mode === "different-stage") unit.tasks[1]!.stage = "repair";
    if (mode === "self") retired.replacementTaskId = "old";
    if (mode === "chain")
      unit.retiredTasks!.push({
        ...retired,
        taskId: "new",
        replacementTaskId: "old",
      });
    if (mode === "duplicate") unit.retiredTasks!.push({ ...retired });
    expect(
      validateCurriculum(p).some((issue) =>
        issue.includes("Invalid retired task"),
      ),
    ).toBe(true);
  });
}
