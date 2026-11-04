import { expect, test } from "bun:test";
import {
  prepareLearnerRepair,
  practiceFeedbackCategory,
} from "./repair-session";
import type { AssessmentEvent, AttemptEvent } from "./contracts";
import type { PracticeSession } from "./practice-session";

const original = {
  id: "a",
  task: { id: "t", version: "v1" },
  response: { text: "Ich aufstehe früh." },
} as AttemptEvent;
const session: PracticeSession = {
  version: 2,
  taskId: "t",
  taskVersion: "v1",
  draft: "",
  startedAt: "2026-11-04T10:00:00Z",
  hintCount: 0,
  solutionRevealed: false,
  exampleSeen: false,
  selfReportedAssistance: false,
  previousAttemptId: "a",
  submittedId: null,
  audioId: null,
};
test("repair copies the learner's original error, never a model, into a distinct response", () => {
  const before = JSON.stringify(original);
  expect(prepareLearnerRepair(session, original).draft).toBe(
    "Ich aufstehe früh.",
  );
  expect(session.draft).toBe("");
  expect(JSON.stringify(original)).toBe(before);
});
test("a stored draft, completed response or different task is never overwritten", () => {
  for (const change of [
    { draft: "My explicit new choice" },
    { draft: " " },
    { submittedId: "done" },
    { taskVersion: "v2" },
    { taskId: "other" },
    { previousAttemptId: "other" },
  ]) {
    const saved = { ...session, ...change };
    expect(prepareLearnerRepair(saved, original)).toBe(saved);
  }
});
const assessment = (
  verdict: AssessmentEvent["verdict"],
  dimensions: Partial<AssessmentEvent["dimensions"]> = {},
  uncertainty = false,
) =>
  ({
    verdict,
    uncertainty,
    dimensions: {
      grammar: "unknown",
      target: "unknown",
      relevance: "unknown",
      opportunities: null,
      ...dimensions,
    },
  }) as AssessmentEvent;
test("practice categories distinguish unknown, grammar, target, context and accepted form", () => {
  expect(practiceFeedbackCategory(assessment("not_assessed"))).toBe("unscored");
  expect(
    practiceFeedbackCategory(assessment("needs_repair", { grammar: "fail" })),
  ).toBe("grammar");
  expect(
    practiceFeedbackCategory(
      assessment("target_not_observed", { grammar: "pass" }),
    ),
  ).toBe("target");
  expect(
    practiceFeedbackCategory(
      assessment("needs_repair", { grammar: "pass", relevance: "fail" }),
    ),
  ).toBe("context");
  expect(
    practiceFeedbackCategory(assessment("pass", { grammar: "pass" })),
  ).toBe("accepted");
  expect(
    practiceFeedbackCategory(assessment("pass", { grammar: "pass" }, true)),
  ).toBe("unscored");
  expect(practiceFeedbackCategory(null)).toBe("unscored");
});
