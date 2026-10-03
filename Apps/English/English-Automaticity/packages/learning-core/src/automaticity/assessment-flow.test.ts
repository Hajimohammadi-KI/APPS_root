import { expect, test } from "bun:test";
import { fullRecordingPlayed } from "./audio-review";
import {
  parseAutomaticityEvent,
  type AttemptEvent,
  type AssessmentEvent,
} from "./contracts";
import { reduceAutomaticityEvents } from "./evidence";
import {
  parseGrammarProvider,
  parseGrammarFeedback,
  grammarFeedbackAssessment,
} from "./grammar-feedback";
import { handleGrammarFeedback } from "./grammar-feedback-route";
import { responseExposure } from "./response-exposure";

const hash = "a".repeat(64),
  audioHash = "b".repeat(64),
  at = "2026-10-03T00:00:00Z";
function fixture() {
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "response",
    language: "en",
    at,
    task: {
      id: "fixture",
      version: "1",
      constructionId: "en.c.001",
      familyId: "G01",
      itemFamily: "one",
      contextId: "one",
      rubricVersion: "1",
      stage: "produce",
      modality: "speaking",
      partition: "practice",
      transferCondition: "none",
      contentReview: "human_reviewed",
    },
    response: {
      text: "I is ready.",
      sha256: hash,
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
      exampleSeen: false,
      solutionRevealed: false,
      selfReportedAssistance: false,
    },
    audio: {
      id: "audio",
      sha256: audioHash,
      bytes: 100,
      durationMs: 4000,
      mime: "audio/webm",
      persisted: true,
    },
    previousAttemptId: null,
  };
  const assessment: AssessmentEvent = {
    version: 2,
    type: "assessment",
    id: "review",
    language: "en",
    at,
    attemptId: attempt.id,
    responseSha256: hash,
    taskVersion: "1",
    rubricVersion: "1",
    verdict: "needs_repair",
    dimensions: {
      grammar: "fail",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      id: "synthetic-reviewer",
      version: "1",
      kind: "human",
      scopeApproved: true,
      reviewId: "synthetic-test-only",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic engineering fixture",
    correction: null,
    spans: [],
    supersedes: null,
    audioReview: {
      audioSha256: audioHash,
      transcriptSha256: hash,
      transcriptVerified: true,
    },
  };
  return { attempt, assessment };
}
test("qualified audio review binds a manually entered verbatim transcript without altering the original", () => {
  const { attempt, assessment } = fixture(),
    before = JSON.stringify(attempt);
  const state = reduceAutomaticityEvents([attempt, assessment], "en", at);
  expect(state.rejected).toEqual([]);
  expect(state.attempts[0]!.eligibleForMastery).toBe(true);
  expect(state.attempts[0]!.success).toBe(false);
  expect(JSON.stringify(attempt)).toBe(before);
  expect(attempt.response.originalTranscriptSha256).toBeNull();
});
test("audio review cannot bypass missing audio, edits, help or evaluator approval", () => {
  for (const change of [
    "missing",
    "edited",
    "helped",
    "unapproved",
    "absent",
  ]) {
    const { attempt, assessment } = fixture();
    if (change === "missing") attempt.audio = null;
    if (change === "edited") attempt.response.transcriptEdited = true;
    if (change === "helped") attempt.assistance.hintCount = 1;
    if (change === "unapproved") assessment.evaluator.scopeApproved = false;
    if (change === "absent") delete assessment.audioReview;
    expect(
      reduceAutomaticityEvents([attempt, assessment], "en", at).attempts[0]!
        .eligibleForMastery,
    ).toBe(false);
  }
});
test("wrong audio or transcript hashes and text-only reviews are rejected", () => {
  for (const field of ["audioSha256", "transcriptSha256"] as const) {
    const { attempt, assessment } = fixture();
    assessment.audioReview![field] = "c".repeat(64);
    expect(
      reduceAutomaticityEvents([attempt, assessment], "en", at).rejected,
    ).toHaveLength(1);
  }
  const { attempt, assessment } = fixture();
  attempt.task.modality = "writing";
  expect(
    reduceAutomaticityEvents([attempt, assessment], "en", at).rejected,
  ).toHaveLength(1);
  assessment.evaluator.kind = "self";
  expect(() => parseAutomaticityEvent(assessment)).toThrow("audio review");
});
test("invalidating an audio review removes its qualification", () => {
  const { attempt, assessment } = fixture();
  const state = reduceAutomaticityEvents(
    [
      attempt,
      assessment,
      {
        version: 2,
        type: "invalidation",
        id: "undo",
        language: "en",
        at,
        assessmentId: "review",
        reason: "review_overturned",
      },
    ],
    "en",
    at,
  );
  expect(state.attempts[0]!.eligibleForMastery).toBe(false);
});
test("playback coverage excludes seeking to the end and large gaps", () => {
  expect(fullRecordingPlayed([[0, 10]], 10)).toBe(true);
  expect(
    fullRecordingPlayed(
      [
        [0, 4],
        [4, 10],
      ],
      10,
    ),
  ).toBe(true);
  expect(fullRecordingPlayed([[9, 10]], 10)).toBe(false);
  expect(
    fullRecordingPlayed(
      [
        [0, 3],
        [5, 10],
      ],
      10,
    ),
  ).toBe(false);
  expect(fullRecordingPlayed([], 10)).toBe(false);
  expect(fullRecordingPlayed([[0, 10]], Infinity)).toBe(false);
  expect(fullRecordingPlayed([[0, NaN]], 10)).toBe(false);
});
const match = {
  message: "Use am with I.",
  offset: 2,
  length: 2,
  replacements: [{ value: "am" }],
  rule: { id: "AGREEMENT", category: { name: "Grammar" } },
};
test("proofreading preserves offsets and the original, including Unicode and whitespace", () => {
  const text = "  I is ready.  ";
  const result = parseGrammarProvider(
    { matches: [{ ...match, offset: 4 }] },
    text,
  );
  expect(result.corrected).toBe("  I am ready.  ");
  expect(result.original).toBe(text);
  const unicode = parseGrammarProvider(
    { matches: [{ ...match, offset: 5 }] },
    "😀 I is ready.",
  );
  expect(unicode.corrected).toBe("😀 I am ready.");
  expect(parseGrammarFeedback(result, text)).toMatchObject(result);
});
test("missing, malformed and out-of-range results cannot become a clean check", () => {
  for (const raw of [
    {},
    { matches: null },
    { matches: [{ ...match, offset: -1 }] },
    { matches: [{ ...match, length: 99 }] },
    { matches: [{ ...match, replacements: [null] }] },
  ])
    expect(() => parseGrammarProvider(raw, "I is ready.")).toThrow();
  const result = parseGrammarProvider({ matches: [] }, "I am ready.");
  expect(() => parseGrammarFeedback(result, "Another answer")).toThrow();
  expect(() =>
    parseGrammarFeedback({ ...result, corrected: "wrong" }, result.original),
  ).toThrow();
});
test("proofreading never establishes target mastery or assesses speech", () => {
  const { attempt } = fixture();
  const result = parseGrammarProvider(
    { matches: [match] },
    attempt.response.text,
  );
  const before = JSON.stringify(attempt);
  const spoken = grammarFeedbackAssessment(
    attempt,
    result,
    at,
    "transcript-check",
    null,
  );
  expect(spoken.feedback).toContain("typed transcript only");
  expect(spoken.evaluator.id).toBe("languagetool-transcript");
  expect(spoken.audioReview).toBeUndefined();
  const spokenState = reduceAutomaticityEvents([attempt, spoken], "en", at);
  expect(spokenState.rejected).toEqual([]);
  expect(spokenState.attempts[0]!.eligibleForMastery).toBe(false);
  expect(spokenState.attempts[0]!.checked).toBe(false);
  expect(JSON.stringify(attempt)).toBe(before);
  attempt.task.modality = "writing";
  attempt.audio = null;
  const assessment = grammarFeedbackAssessment(
    attempt,
    result,
    at,
    "check",
    null,
  );
  expect(assessment.correction).toBe("I am ready.");
  expect(parseAutomaticityEvent(assessment)).toEqual(assessment);
  const state = reduceAutomaticityEvents([attempt, assessment], "en", at);
  expect(state.rejected).toEqual([]);
  expect(state.attempts[0]!.eligibleForMastery).toBe(false);
  expect(state.attempts[0]!.checked).toBe(false);
});
test("viewing feedback on a later day resets retention and prevents same-family independent credit", () => {
  const { attempt: original, assessment: first } = fixture();
  original.task.modality = "writing";
  original.audio = null;
  delete first.audioReview;
  first.verdict = "pass";
  first.dimensions.grammar = "pass";
  const secondAt = "2026-10-05T12:00:00Z";
  const later = {
    ...original,
    id: "later",
    at: secondAt,
    task: { ...original.task, stage: "retain" as const },
  };
  const review = {
    ...first,
    id: "later-review",
    at: secondAt,
    attemptId: later.id,
  };
  const before = JSON.stringify(original);
  const exposure = responseExposure(original, "2026-10-05T11:59:00Z", "view");
  const without = reduceAutomaticityEvents(
    [original, first, later, review],
    "en",
    secondAt,
  );
  expect(without.attempts[1]!.delayed).toBe(true);
  const withView = reduceAutomaticityEvents(
    [original, first, exposure, later, review],
    "en",
    secondAt,
  );
  expect(withView.attempts[0]!.eligibleForMastery).toBe(true);
  expect(withView.attempts[1]!.delayed).toBe(false);
  expect(withView.attempts[1]!.eligibleForMastery).toBe(false);
  later.task = { ...later.task, id: "different", itemFamily: "different" };
  const varied = reduceAutomaticityEvents(
    [original, first, exposure, later, review],
    "en",
    secondAt,
  );
  expect(varied.attempts[1]!.independent).toBe(true);
  expect(varied.attempts[1]!.delayed).toBe(false);
  expect(JSON.stringify(original)).toBe(before);
});
test("same-millisecond feedback display cannot invalidate the original independent response", () => {
  const { attempt, assessment } = fixture();
  const exposure = responseExposure(attempt, attempt.at, "view");
  expect(Date.parse(exposure.at)).toBe(Date.parse(attempt.at) + 1);
  const result = reduceAutomaticityEvents(
    [attempt, assessment, exposure],
    "en",
    exposure.at,
  );
  expect(result.attempts[0]!.eligibleForMastery).toBe(true);
});
const request = (body: unknown) =>
  new Request("http://localhost/api/conversation/evaluate", {
    method: "POST",
    body: JSON.stringify(body),
  });
test("route validates input and rejects unsuccessful or malformed providers", async () => {
  const mock = (async () => Response.json({ matches: [] })) as typeof fetch;
  for (const body of [
    { text: "", language: "en" },
    { text: "hello", language: "fa" },
    { text: "x".repeat(8001), language: "en" },
  ])
    expect(
      (await handleGrammarFeedback(request(body), "http://fixture", mock))
        .status,
    ).toBe(400);
  for (const mockResponse of [
    Response.json({}),
    new Response("bad", { status: 503 }),
    new Response("not json"),
  ]) {
    const response = await handleGrammarFeedback(
      request({ text: "I is ready.", language: "en" }),
      "http://fixture",
      (async () => mockResponse) as typeof fetch,
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  }
});
test("route handles an interactive request without fabricating a grade", async () => {
  let submitted = "";
  const response = await handleGrammarFeedback(
    request({ text: "  I is ready.  ", language: "en" }),
    "http://fixture",
    (async (_url, init) => {
      submitted = String(init?.body);
      return Response.json({ matches: [{ ...match, offset: 4 }] });
    }) as typeof fetch,
  );
  expect(response.status).toBe(200);
  expect(new URLSearchParams(submitted).get("text")).toBe("  I is ready.  ");
  expect(await response.json()).toMatchObject({
    original: "  I is ready.  ",
    corrected: "  I am ready.  ",
  });
});
