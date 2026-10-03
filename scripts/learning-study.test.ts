import { expect, test } from "bun:test";
import {
  evaluateLearningStudy as evaluateWithReview,
  parseLearningStudy,
  wilsonInterval,
  type LearningStudy,
} from "./lib/learning-study";
import { sha256 } from "./lib/automaticity-release-reviews";
import type {
  AssessmentEvent,
  AttemptEvent,
  AutomaticityEvent,
} from "../shared/learning-core/src/automaticity/contracts";
import type {
  CurriculumPack,
  PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
const now = "2026-09-12T12:00:00.000Z";
// Only the explicit synthetic reviewer tuple below is authorized in these fixtures.
const evaluateLearningStudy = (
  study: LearningStudy,
  events: AutomaticityEvent[],
  packs: CurriculumPack[],
  at: string,
  audio: ReadonlyMap<string, Uint8Array> = new Map(),
) =>
  evaluateWithReview(
    study,
    events,
    packs,
    at,
    audio,
    new Set(
      events
        .filter(
          (event) =>
            event.type === "assessment" &&
            event.evaluator.id === "test-reviewer" &&
            event.evaluator.version === "1" &&
            event.evaluator.reviewId === "synthetic-only",
        )
        .map((event) => event.id),
    ),
  );
function fixture(kind: "baseline" | "retention" | "transfer" = "baseline") {
  const task: PracticeTask = {
    id: "probe",
    version: "1",
    constructionId: "en.c.001",
    familyId: "G01",
    itemFamily: "held-out",
    contextId: "novel",
    rubricVersion: "1",
    stage: "transfer",
    modality: "writing",
    partition: "evaluation",
    transferCondition: "elicited",
    contentReview: "human_reviewed",
    prompt: "Synthetic engineering fixture",
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
    sourceId: "test",
  };
  const pack: CurriculumPack = {
    language: "en",
    version: "1",
    mappingVersion: "1",
    units: [
      {
        id: task.constructionId,
        language: "en",
        title: "Test",
        level: "A1",
        familyIds: ["G01"],
        prerequisites: [],
        lessonAlias: "test",
        rule: "test",
        examples: [],
        commonError: "test",
        review: "human_reviewed",
        sources: [],
        tasks: [task],
      },
    ],
  };
  const study: LearningStudy = {
    schemaVersion: 1,
    id: "synthetic-study",
    createdAt: "2026-09-01T00:00:00Z",
    interventionAt: "2026-09-03T00:00:00Z",
    consent: {
      participantKey: "synthetic-participant",
      at: "2026-09-01T00:00:00Z",
    },
    probes: [
      {
        id: "probe-plan",
        language: "en",
        constructionId: task.constructionId,
        modality: "writing",
        taskId: task.id,
        definitionSha256: sha256(JSON.stringify(task)),
        kind,
        delayHours: kind === "baseline" ? 0 : 168,
        opensAt:
          kind === "baseline" ? "2026-09-02T00:00:00Z" : "2026-09-10T00:00:00Z",
        closesAt:
          kind === "baseline" ? "2026-09-02T23:59:59Z" : "2026-09-11T23:59:59Z",
      },
    ],
  };
  const at =
    kind === "baseline" ? "2026-09-02T12:00:00Z" : "2026-09-10T12:00:00Z";
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "answer",
    language: "en",
    at,
    task: { ...task, definitionSha256: sha256(JSON.stringify(task)) },
    response: {
      text: "Test answer",
      sha256: sha256("Test answer"),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: at,
      activeMs: 800,
      firstInputMs: 400,
      source: "monotonic_visible",
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
  const assessment: AssessmentEvent = {
    version: 2,
    type: "assessment",
    id: "judge",
    language: "en",
    at,
    attemptId: attempt.id,
    responseSha256: attempt.response.sha256,
    taskVersion: "1",
    rubricVersion: "1",
    verdict: "pass",
    dimensions: {
      grammar: "pass",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      id: "test-reviewer",
      version: "1",
      kind: "human",
      scopeApproved: true,
      reviewId: "synthetic-only",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic engineering fixture only",
    correction: null,
    spans: [],
    supersedes: null,
  };
  const prior: AttemptEvent = {
    ...structuredClone(attempt),
    id: "prior",
    at: "2026-09-03T00:00:00Z",
    timing: { ...attempt.timing, startedAt: "2026-09-03T00:00:00Z" },
    task: {
      ...attempt.task,
      id: "practice",
      itemFamily: "familiar",
      contextId: "familiar",
      stage: "produce",
      partition: "practice",
    },
  };
  return { task, pack, study, attempt, assessment, prior };
}
test("baseline, seven-day retention and novel transfer use qualified first responses without mutating input", () => {
  for (const kind of ["baseline", "retention", "transfer"] as const) {
    const f = fixture(kind),
      events =
        kind === "baseline"
          ? [f.attempt, f.assessment]
          : [f.prior, f.attempt, f.assessment],
      before = JSON.stringify(events);
    const result = evaluateLearningStudy(f.study, events, [f.pack], now);
    expect(result.groups[0]!.successes).toBe(1);
    expect(result.groups[0]!.medianFirstInputMs).toBe(400);
    expect(result.automaticMasteryGranted).toBe(false);
    expect(JSON.stringify(events)).toBe(before);
  }
});
test("a scopeApproved flag without a verified review procedure cannot qualify study evidence", () => {
  const f = fixture();
  expect(
    evaluateWithReview(f.study, [f.attempt, f.assessment], [f.pack], now)
      .groups[0]!.excluded,
  ).toBe(1);
  f.assessment.evaluator.id = "unapproved reviewer";
  expect(
    evaluateLearningStudy(f.study, [f.attempt, f.assessment], [f.pack], now)
      .groups[0]!.excluded,
  ).toBe(1);
});
test("partial target-opportunity counts stay separate from whole-response success and reject inconsistent counts", () => {
  const f = fixture();
  f.assessment.verdict = "needs_repair";
  f.assessment.dimensions.grammar = "fail";
  f.assessment.dimensions.opportunities = 2;
  const score = {
    assessmentId: f.assessment.id,
    responseSha256: f.attempt.response.sha256,
    definitionSha256: f.attempt.task.definitionSha256!,
    reviewedAt: f.assessment.at,
    checked: 2,
    correct: 1,
  };
  const run = (scores: (typeof score)[]) =>
    evaluateWithReview(
      f.study,
      [f.attempt, f.assessment],
      [f.pack],
      now,
      new Map(),
      new Set([f.assessment.id]),
      scores,
    ).groups[0]!;
  expect(run([score]).accuracy).toBe(0);
  expect(run([score]).targetOpportunityAccuracy).toBe(0.5);
  expect(run([]).targetOpportunityAccuracy).toBeNull();
  expect(run([]).unscoredOpportunityResponses).toBe(1);
  for (const scores of [
    [{ ...score, correct: 3 }],
    [{ ...score, responseSha256: "a".repeat(64) }],
    [score, score],
  ])
    expect(() => run(scores)).toThrow();
});
test("negative target evidence remains a failure; a later correct retry cannot replace it", () => {
  const f = fixture();
  f.assessment.verdict = "target_not_observed";
  f.assessment.dimensions.target = "not_observed";
  const retry = { ...f.attempt, id: "retry", at: "2026-09-02T13:00:00Z" },
    judge = {
      ...f.assessment,
      id: "retry-judge",
      at: retry.at,
      attemptId: retry.id,
      verdict: "pass" as const,
    };
  const result = evaluateLearningStudy(
    f.study,
    [f.attempt, f.assessment, retry, judge],
    [f.pack],
    now,
  );
  expect(result.groups[0]!.failures).toBe(1);
  expect(result.groups[0]!.accuracy).toBe(0);
  expect(result.probes[0]!.retries).toBe(1);
});
test("two preplanned unseen baseline observations can be compared; actual prior practice excludes baseline", () => {
  const f = fixture(),
    other = {
      ...f.task,
      id: "baseline-two",
      itemFamily: "held-out-two",
      contextId: "novel-two",
    };
  f.pack.units[0]!.tasks.push(other);
  f.study.probes.push({
    ...f.study.probes[0]!,
    id: "second",
    taskId: other.id,
    definitionSha256: sha256(JSON.stringify(other)),
  });
  const second = {
      ...f.attempt,
      id: "second-answer",
      at: "2026-09-02T13:00:00Z",
      task: { ...other, definitionSha256: sha256(JSON.stringify(other)) },
    },
    review = {
      ...f.assessment,
      id: "second-review",
      at: second.at,
      attemptId: second.id,
    };
  expect(
    evaluateLearningStudy(
      f.study,
      [f.attempt, f.assessment, second, review],
      [f.pack],
      now,
    ).groups[0]!.successes,
  ).toBe(2);
  f.prior.at = "2026-09-01T12:00:00Z";
  f.prior.timing.startedAt = f.prior.at;
  expect(
    evaluateLearningStudy(
      f.study,
      [f.prior, f.attempt, f.assessment],
      [f.pack],
      now,
    ).groups[0]!.excluded,
  ).toBe(1);
});
test("missing and pending follow-ups are separate from failures and do not create accuracy", () => {
  const f = fixture("retention");
  expect(
    evaluateLearningStudy(f.study, [], [f.pack], now).groups[0]!.missing,
  ).toBe(1);
  const pending = evaluateLearningStudy(
    f.study,
    [],
    [f.pack],
    "2026-09-05T00:00:00Z",
  ).groups[0]!;
  expect(pending.pending).toBe(1);
  expect(pending.accuracy).toBeNull();
  expect(pending.wilson95).toBeNull();
  expect(wilsonInterval(0, 1)![1]).toBeGreaterThan(0.7);
});
test("assistance, changed hashes, unapproved assessment and short actual delay are excluded", () => {
  for (const change of [
    (f: ReturnType<typeof fixture>) => {
      f.attempt.assistance.hintCount = 1;
    },
    (f: ReturnType<typeof fixture>) => {
      f.attempt.response.sha256 = "a".repeat(64);
      f.assessment.responseSha256 = f.attempt.response.sha256;
    },
    (f: ReturnType<typeof fixture>) => {
      f.attempt.task.definitionSha256 = "a".repeat(64);
    },
    (f: ReturnType<typeof fixture>) => {
      f.assessment.evaluator.scopeApproved = false;
    },
    (f: ReturnType<typeof fixture>) => {
      f.prior.at = "2026-09-10T11:00:00Z";
      f.prior.timing.startedAt = f.prior.at;
    },
  ]) {
    const f = fixture("retention");
    change(f);
    expect(
      evaluateLearningStudy(
        f.study,
        [f.prior, f.attempt, f.assessment],
        [f.pack],
        now,
      ).groups[0]!.excluded,
    ).toBe(1);
  }
});
test("old probe exposure cannot be hidden by waiting more than one day", () => {
  const f = fixture("transfer"),
    exposure: AutomaticityEvent = {
      version: 2,
      type: "exposure",
      id: "exposed",
      language: "en",
      at: "2026-09-01T00:00:00Z",
      constructionId: f.task.constructionId,
      taskId: f.task.id,
      itemFamily: f.task.itemFamily,
      kind: "solution",
    };
  const result = evaluateLearningStudy(
    f.study,
    [exposure, f.prior, f.attempt, f.assessment],
    [f.pack],
    now,
  );
  expect(result.groups[0]!.excluded).toBe(1);
  expect(result.probes[0]!.reason).toContain("already attempted or exposed");
});
test("speech requires original recording bytes and independent audio review", () => {
  const f = fixture(),
    bytes = new Uint8Array([1, 2, 3]);
  f.task.modality = "speaking";
  f.study.probes[0]!.modality = "speaking";
  f.study.probes[0]!.definitionSha256 = sha256(JSON.stringify(f.task));
  f.attempt.task = {
    ...f.task,
    definitionSha256: f.study.probes[0]!.definitionSha256,
  };
  f.attempt.response.originalTranscriptSha256 = f.attempt.response.sha256;
  f.attempt.audio = {
    id: "recording",
    sha256: sha256(bytes),
    bytes: 3,
    durationMs: 1000,
    mime: "audio/webm",
    persisted: true,
  };
  expect(
    evaluateLearningStudy(f.study, [f.attempt, f.assessment], [f.pack], now)
      .groups[0]!.excluded,
  ).toBe(1);
  expect(
    evaluateLearningStudy(
      f.study,
      [f.attempt, f.assessment],
      [f.pack],
      now,
      new Map([[sha256(bytes), bytes]]),
    ).groups[0]!.successes,
  ).toBe(1);
});
test("withdrawn consent, retrospective plans, reused probes and changed definitions fail before analysis", () => {
  for (const change of [
    (f: ReturnType<typeof fixture>) => {
      f.study.consent.withdrawnAt = now;
    },
    (f: ReturnType<typeof fixture>) => {
      f.study.createdAt = now;
    },
    (f: ReturnType<typeof fixture>) => {
      f.study.probes.push({ ...f.study.probes[0]!, id: "second" });
    },
    (f: ReturnType<typeof fixture>) => {
      f.task.prompt += " changed";
    },
    (f: ReturnType<typeof fixture>) => {
      f.task.contentReview = "authored";
    },
  ]) {
    const f = fixture();
    change(f);
    expect(() => parseLearningStudy(f.study, [f.pack], now)).toThrow();
  }
});
