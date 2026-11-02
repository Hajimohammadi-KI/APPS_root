import { expect, test } from "bun:test";
import { markedAnswer } from "./answer-alignment";
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
test("W33 historical links to a known invalid correction stay unscored", () => {
  const withdrawn = {
    ...task,
    responseKind: "correction" as const,
    prompt: "Correct the sentence: Stacked clauses with unclear reference.",
  };
  const response = { ...attempt(), task: withdrawn };
  expect(
    assessControlledTask(response, withdrawn, at, "withdrawn").verdict,
  ).toBe("not_assessed");
});
test("an owner-approved wrong form is marked for repair with its explanation", () => {
  const reviewed: PracticeTask = {
    ...task,
    rejectedAnswers: [
      { answer: "work", explanation: "He needs the -s form: works." },
    ],
  };
  const response = { ...attempt(), task: reviewed };
  response.response.text = "work.";
  const result = assessControlledTask(response, reviewed, at, "rejected");
  expect(result.verdict).toBe("needs_repair");
  expect(result.uncertainty).toBe(false);
  expect(result.feedback).toContain("He needs the -s form: works.");
  response.response.text = "works";
  expect(assessControlledTask(response, reviewed, at, "accepted").verdict).toBe(
    "pass",
  );
});
test("R100 a paused exercise saves even the stored answer without a score", () => {
  const response = { ...attempt(), task };
  response.response.text = "works";
  const result = assessControlledTask(response, task, at, "paused", {
    paused: true,
  });
  expect(result.verdict).toBe("not_assessed");
  expect(result.feedback).toBe(
    "Saved without a score: several learners reported this exercise as wrong, so it is paused until it is reviewed.",
  );
  expect(assessControlledTask(response, task, at, "running").verdict).toBe(
    "pass",
  );
});
test("an unchanged copy of the sentence to correct is marked for repair", () => {
  const correction: PracticeTask = {
    ...task,
    responseKind: "correction",
    prompt:
      "Correct the preposition and write the full sentence: The keys are in the table.",
    acceptedAnswers: ["The keys are on the table."],
    solution: "The keys are on the table.",
  };
  const response = { ...attempt(), task: correction };
  for (const text of [
    "The keys are in the table.",
    "The keys are in the table",
  ]) {
    response.response.text = text;
    const result = assessControlledTask(response, correction, at, "unchanged");
    expect(result.verdict).toBe("needs_repair");
    expect(result.feedback).toContain("still the sentence to correct");
  }
  // A reformulation task starts from acceptable language; copying it is not an error.
  const transformation = {
    ...correction,
    responseKind: "transformation" as const,
  };
  response.task = transformation;
  response.response.text = "The keys are in the table.";
  expect(
    assessControlledTask(response, transformation, at, "copy").verdict,
  ).toBe("not_assessed");
});
test("another offered option in the gap is marked for repair; an unoffered form stays unscored", () => {
  const options: PracticeTask = {
    ...task,
    prompt:
      "Complete with am, is or are. Write the full sentence: I ___ ready for the lesson.",
    acceptedAnswers: ["I am ready for the lesson."],
    solution: "I am ready for the lesson.",
  };
  const response = { ...attempt(), task: options };
  response.response.text = "I is ready for the lesson.";
  const wrong = assessControlledTask(response, options, at, "option");
  expect(wrong.verdict).toBe("needs_repair");
  expect(wrong.feedback).toContain("not the one that fits");
  response.response.text = "I was ready for the lesson.";
  expect(assessControlledTask(response, options, at, "other").verdict).toBe(
    "not_assessed",
  );
});
test("an unmatched answer gets one sentence naming the different word, marked in the learner's own text", () => {
  const options: PracticeTask = {
    ...task,
    prompt: "Complete the sentence: I ___ ready for the lesson.",
    acceptedAnswers: ["I am ready for the lesson."],
    solution: "I am ready for the lesson.",
  };
  const response = { ...attempt(), task: options };
  response.response.text = "I was ready for the lesson.";
  const one = assessControlledTask(response, options, at, "one");
  expect(one.verdict).toBe("not_assessed");
  expect(one.feedback).toBe(
    "Saved without a score: the stored answer has “am” where you wrote “was”.",
  );
  expect(
    one.spans.map((span) => response.response.text.slice(span.start, span.end)),
  ).toEqual(["was"]);
  expect(markedAnswer(response.response.text, one.spans)).toEqual([
    { text: "I " },
    { text: "was", note: "The stored answer has “am” where you wrote “was”." },
    { text: " ready for the lesson." },
  ]);
  response.response.text = "We were ready for a lesson.";
  const many = assessControlledTask(response, options, at, "many");
  expect(many.feedback).toBe(
    "Saved without a score: it differs from the stored answer in 3 places, marked in your answer.",
  );
  expect(many.feedback.split(/(?<=[.!?])\s/u)).toHaveLength(1);
  const german = {
    ...response,
    language: "de" as const,
    task: { ...response.task, constructionId: "de.c.001" },
  };
  german.response = { ...response.response, text: "Ich bin bereit." };
  const de = assessControlledTask(
    german,
    {
      ...options,
      constructionId: "de.c.001",
      acceptedAnswers: ["Ich war bereit."],
      solution: "Ich war bereit.",
    },
    at,
    "de",
  );
  expect(de.feedback).toBe(
    "Ohne Bewertung gespeichert: Die gespeicherte Antwort hat „war“, wo du „bin“ geschrieben hast.",
  );
  // A missing word is marked where it belongs.
  expect(
    markedAnswer("I ready.", [{ start: 2, end: 2, explanation: "x" }]),
  ).toEqual([{ text: "I " }, { text: "", note: "x" }, { text: "ready." }]);
});
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
    // Never a pass; the same words with a malformed mark are certainly wrong.
    // A key ending in an ellipsis is withheld as content needing repair (W33).
    const result = assessControlledTask(
      response,
      currentTask,
      at,
      "punctuation",
    );
    if (expected.endsWith("...")) {
      expect(result.verdict).toBe("not_assessed");
      return;
    }
    expect(result.verdict).toBe("needs_repair");
    expect(result.feedback).toStartWith("Check the punctuation");
  },
);

test.each([
  ["You are ready", "You are ready."],
  ["You are ready.", "You are ready"],
  ["Are you ready?", "Are you ready?"],
  ["You are ready!", "You are ready!"],
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

test("W33 a key that ends in a placeholder ellipsis is withheld as content needing repair", () => {
  const response = attempt();
  response.response.text = "You are ready...";
  const result = assessControlledTask(
    response,
    {
      ...task,
      acceptedAnswers: ["You are ready..."],
      solution: "You are ready...",
    },
    at,
    "punctuation",
  );
  expect(result.verdict).toBe("not_assessed");
  expect(result.feedback).toContain("needs content repair");
});
