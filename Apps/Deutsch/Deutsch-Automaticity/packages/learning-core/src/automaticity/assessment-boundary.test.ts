import { expect, test } from "bun:test";
import { assessControlledTask } from "./assessment";
import type { AttemptEvent, TaskIdentity } from "./contracts";
import type { PracticeTask } from "./curriculum";
const at = "2026-09-05T10:00:00.000Z";
const task: PracticeTask = {
  id: "en.c.001.retrieve.1.writing",
  version: "1",
  constructionId: "en.c.001",
  familyId: "G01",
  itemFamily: "family",
  contextId: "context",
  rubricVersion: "closed-1",
  stage: "retrieve",
  modality: "writing",
  partition: "practice",
  transferCondition: "none",
  contentReview: "authored",
  prompt: "Complete the sentence.",
  answerPolicy: "closed",
  responseKind: "cloze",
  acceptedAnswers: ["works"],
  hints: [],
  solution: "works",
  normalisation: {
    nfc: true,
    whitespace: true,
    terminalFullStop: true,
    preserveCase: true,
  },
  sourceId: "synthetic-test",
};
function attempt(overrides: Partial<TaskIdentity> = {}): AttemptEvent {
  return {
    version: 2,
    type: "attempt",
    id: "attempt",
    language: "en",
    at,
    task: { ...task, ...overrides },
    response: {
      text: "works",
      sha256: "a".repeat(64),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: at,
      activeMs: null,
      firstInputMs: null,
      source: "unavailable",
    },
    assistance: {
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
    },
    audio: null,
    previousAttemptId: null,
  };
}
test("closed-answer assessment requires matching task context, version, language and review status", () => {
  expect(assessControlledTask(attempt(), task, at, "match").verdict).toBe(
    "pass",
  );
  for (const change of [
    { id: "other" },
    { version: "other" },
    { constructionId: "en.c.002" },
    { contextId: "other" },
    { itemFamily: "other" },
    { rubricVersion: "other" },
    { contentReview: "human_reviewed" },
    { stage: "repair" },
    { modality: "speaking" },
    { partition: "evaluation" },
    { transferCondition: "free" },
    { familyId: "G02" },
  ] as Partial<TaskIdentity>[]) {
    const result = assessControlledTask(attempt(change), task, at, "mismatch");
    expect(result.verdict).toBe("not_assessed");
    expect(result.evaluator.scopeApproved).toBe(false);
  }
  expect(
    assessControlledTask({ ...attempt(), language: "de" }, task, at, "language")
      .verdict,
  ).toBe("not_assessed");
});
test("W10 English cloze accepts initial capital only; German and internal case stay strict", () => {
  expect(
    assessControlledTask(
      { ...attempt(), response: { ...attempt().response, text: "Works" } },
      task,
      at,
      "capital",
    ).verdict,
  ).toBe("pass");
  expect(
    assessControlledTask(
      { ...attempt(), response: { ...attempt().response, text: "WORKS" } },
      task,
      at,
      "all-capitals",
    ).verdict,
  ).not.toBe("pass");
  const germanTask = {
    ...task,
    constructionId: "de.c.001",
    acceptedAnswers: ["ihnen"],
  };
  const germanAttempt = {
    ...attempt(),
    language: "de" as const,
    task: germanTask,
    response: { ...attempt().response, text: "Ihnen" },
  };
  expect(
    assessControlledTask(germanAttempt, germanTask, at, "German").verdict,
  ).not.toBe("pass");
});
test("even an accidentally closed speaking task cannot grade its typed transcript", () => {
  const speaking = { ...task, modality: "speaking" as const };
  const result = assessControlledTask(
    attempt({ modality: "speaking" }),
    speaking,
    at,
    "speech",
  );
  expect(result.verdict).toBe("not_assessed");
  expect(result.uncertainty).toBe(true);
});

test.each([
  ["Are you ready?.", "Are you ready?"],
  ["You are ready!.", "You are ready!"],
  ["You are ready...", "You are ready."],
  ["You are ready. .", "You are ready."],
  ["You are ready... .", "You are ready..."],
])(
  "optional full stop does not erase malformed punctuation: %s",
  (text, expected) => {
    const response = attempt();
    response.response.text = text;
    const currentTask = {
      ...task,
      acceptedAnswers: [expected],
      solution: expected,
    };
    expect(
      assessControlledTask(response, currentTask, at, "punctuation").verdict,
    ).toBe("not_assessed");
  },
);

test.each([
  ["You are ready", "You are ready."],
  ["You are ready.", "You are ready"],
  ["Are you ready?", "Are you ready?"],
  ["You are ready!", "You are ready!"],
  ["You are ready...", "You are ready..."],
])(
  "accepts optional plain full stop and unchanged punctuation: %s",
  (text, expected) => {
    const response = attempt();
    response.response.text = text;
    const currentTask = {
      ...task,
      acceptedAnswers: [expected],
      solution: expected,
    };
    expect(
      assessControlledTask(response, currentTask, at, "punctuation").verdict,
    ).toBe("pass");
  },
);
