import { expect, test } from "bun:test";
import { auditClosedTask } from "./curriculum-audit";
const task = {
  id: "fixture",
  answerPolicy: "closed" as const,
  responseKind: "cloze" as const,
  prompt: "Fill the blank: She ___ here.",
  acceptedAnswers: ["She is here."],
  solution: "She is here.",
};
test("W33 build audit finds missing solutions, duplicate alternatives and ambiguous gaps", () => {
  expect(auditClosedTask(task)).toEqual([]);
  expect(
    auditClosedTask({ ...task, solution: "She are here." })[0]?.severity,
  ).toBe("error");
  expect(
    auditClosedTask({
      ...task,
      acceptedAnswers: ["She is here.", " She is here. "],
    }).some((i) => i.code === "duplicate-answer"),
  ).toBe(true);
  expect(
    auditClosedTask({ ...task, prompt: "Fill: She ___ ___ here." }).some(
      (i) => i.code === "multiple-gaps",
    ),
  ).toBe(true);
});
