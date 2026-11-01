import { expect, test } from "bun:test";
import {
  LEARNER_FEEDBACK_POLICY,
  learnerFeedbackDecisionComment,
  learnerFeedbackIssue,
  learnerFeedbackState,
  parseLearnerFeedback,
  parseLearnerFeedbackDecision,
  parseLearnerFeedbackIssue,
} from "./learner-feedback";

const feedback = {
  kind: "automaticity.learner-feedback",
  version: 1,
  language: "en",
  contentVersion: "2026-11-01.1",
  release: "2026.11.01.1",
  task: {
    id: "en.c.013.repair.content-20261101.writing",
    version: "2026-11-01.1",
    constructionId: "en.c.013",
    prompt:
      "Correct the preposition and write the full sentence: The keys are in the table.",
    acceptedAnswers: ["The keys are on the table."],
  },
  response: "The keys are lying on the table.",
  check: {
    verdict: "not_assessed",
    evaluator: "controlled-answer@1.0.0",
    feedback: "Your answer differs from the stored forms.",
  },
  category: "answer_correct",
  comment: "Lying is also natural here.",
  consent: { policy: LEARNER_FEEDBACK_POLICY, at: "2026-11-01T10:00:00.000Z" },
};

test("learner feedback keeps only the previewed fields and requires current consent", () => {
  const parsed = parseLearnerFeedback({
    ...feedback,
    name: "Mina",
    email: "mina@example.org",
  });
  expect(parsed).toEqual(feedback as never);
  expect(JSON.stringify(parsed)).not.toContain("Mina");
  for (const broken of [
    { ...feedback, consent: { policy: "older", at: feedback.consent.at } },
    { ...feedback, consent: undefined },
    { ...feedback, language: "fr" },
    { ...feedback, category: "spam" },
    { ...feedback, response: " " },
    { ...feedback, response: "x".repeat(2001) },
    { ...feedback, comment: "x".repeat(1001) },
    {
      ...feedback,
      task: { ...feedback.task, id: "de.c.013.repair.0.writing" },
    },
    { ...feedback, release: "latest" },
  ])
    expect(() => parseLearnerFeedback(broken)).toThrow();
});

test("an issue never turns learner text into mentions, links or markup", () => {
  const hostile = parseLearnerFeedback({
    ...feedback,
    response: "@octocat ``` <img src=x> [click](https://evil.example)",
    comment: "@team please ~~~ fix",
  });
  const issue = learnerFeedbackIssue(hostile, "a".repeat(64));
  expect(issue.title).not.toContain("@");
  expect(issue.title).toContain("en.c.013");
  expect(issue.labels).toEqual([
    "learner-feedback",
    "app:en",
    "category:answer_correct",
  ]);
  // Learner-written text sits only inside code fences longer than any run in it.
  const outside = issue.body.replace(
    /(`{4,})[^\n]*\n[\s\S]*?\n\1(?=\n|$)/g,
    "",
  );
  expect(outside).not.toContain("@");
  expect(outside).not.toContain("<img");
  expect(outside).not.toContain("evil.example");
  const parsed = parseLearnerFeedbackIssue(issue.body);
  expect(parsed?.feedback).toEqual(hostile);
  expect(parsed?.receipt).toBe("a".repeat(64));
  expect(parseLearnerFeedbackIssue("Opened by hand.")).toBeNull();
});

test("the learner sees a state derived only from decision labels", () => {
  expect(learnerFeedbackState(["learner-feedback"], "open")).toBe("received");
  expect(
    learnerFeedbackState(
      ["learner-feedback", "decision:accept_answer"],
      "closed",
    ),
  ).toBe("answer_accepted");
  expect(learnerFeedbackState(["decision:known_wrong"], "closed")).toBe(
    "answer_rejected",
  );
  expect(learnerFeedbackState(["decision:fix_exercise"], "closed")).toBe(
    "exercise_fix_planned",
  );
  expect(learnerFeedbackState(["decision:no_change"], "closed")).toBe(
    "no_change",
  );
  expect(learnerFeedbackState(["withdrawn"], "closed")).toBe("withdrawn");
});

test("an owner decision round-trips and a wrong form always carries an explanation", () => {
  const decided = learnerFeedbackDecisionComment({
    decision: "known_wrong",
    answer: "The keys are in the table.",
    explanation: "On is used for a surface.",
    reply: "@you thanks!",
    decidedAt: "2026-11-02T09:00:00.000Z",
  });
  expect(parseLearnerFeedbackDecision(decided)).toEqual({
    decision: "known_wrong",
    answer: "The keys are in the table.",
    explanation: "On is used for a surface.",
    reply: "@you thanks!",
    decidedAt: "2026-11-02T09:00:00.000Z",
  });
  expect(() =>
    learnerFeedbackDecisionComment({
      decision: "known_wrong",
      answer: "x",
      explanation: " ",
      reply: "",
      decidedAt: "2026-11-02T09:00:00.000Z",
    }),
  ).toThrow();
  expect(parseLearnerFeedbackDecision("A normal comment.")).toBeNull();
});
