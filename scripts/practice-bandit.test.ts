import { expect, test } from "bun:test";
import {
  replayPracticeBandit,
  suggestPracticePolicy,
  evaluatePracticePolicy,
  parsePracticeDecision,
  BANDIT_VERSION,
  type PracticeDecision,
} from "./lib/practice-bandit";
import { sha256 } from "../shared/learning-core/src/automaticity/backup";
import type {
  AttemptEvent,
  AssessmentEvent,
  AutomaticityEvent,
} from "../shared/learning-core/src/automaticity/contracts";
import type {
  CurriculumPack,
  PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import {
  REPRESENTATIVE_SCOPES,
  representativeTasks,
} from "../shared/learning-core/src/automaticity/representative-tasks";
const now = "2026-09-05T12:00:00.000Z";
async function fixture() {
  const tasks: PracticeTask[] = representativeTasks(REPRESENTATIVE_SCOPES[0]!)
    .filter((task) => task.modality === "writing")
    .map((task) => ({ ...task, contentReview: "human_reviewed" as const }));
  const retrieve = tasks.find((task) => task.stage === "retrieve")!,
    vary = tasks.find((task) => task.stage === "vary")!;
  const probe: PracticeTask = {
    ...tasks.find((task) => task.stage === "retain")!,
    id: "synthetic-probe",
    itemFamily: "synthetic-new-family",
    contextId: "synthetic-new-context",
    transferCondition: "elicited",
    partition: "calibration",
  };
  tasks.push(probe);
  const pack = {
    language: "en",
    version: "synthetic-bandit",
    units: [{ id: retrieve.constructionId, tasks }],
  } as CurriculumPack;
  const attempt = async (
    task: PracticeTask,
    id: string,
    at: string,
  ): Promise<AttemptEvent> => ({
    version: 2,
    type: "attempt",
    id,
    language: "en",
    at,
    task: { ...task, definitionSha256: await sha256(JSON.stringify(task)) },
    response: {
      text: "Synthetic transport fixture",
      sha256: await sha256("Synthetic transport fixture"),
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
  });
  const practice = await attempt(
      retrieve,
      "practice",
      "2025-01-01T12:01:00.000Z",
    ),
    delayed = await attempt(probe, "probe", "2025-01-03T12:01:00.000Z");
  const assessment: AssessmentEvent = {
    version: 2,
    type: "assessment",
    id: "synthetic-qualified-review",
    language: "en",
    at: "2025-01-03T12:02:00.000Z",
    attemptId: delayed.id,
    taskVersion: probe.version,
    rubricVersion: probe.rubricVersion,
    responseSha256: delayed.response.sha256,
    verdict: "pass",
    dimensions: {
      grammar: "pass",
      target: "observed",
      relevance: "pass",
      opportunities: 1,
    },
    evaluator: {
      id: "synthetic-reviewer-not-real",
      version: "1",
      kind: "human",
      scopeApproved: true,
      reviewId: "synthetic",
    },
    uncertainty: false,
    confidence: null,
    feedback: "Synthetic test fixture only; not human evidence.",
    correction: null,
    spans: [],
    supersedes: null,
  };
  const decision: PracticeDecision = {
    id: "decision",
    at: "2025-01-01T12:00:00.000Z",
    policyVersion: BANDIT_VERSION,
    partition: "development",
    language: "en",
    constructionId: retrieve.constructionId,
    modality: "writing",
    consent: {
      recordedAt: "2025-01-01T11:00:00.000Z",
      policyDevelopment: true,
    },
    options: [
      { taskId: retrieve.id, probability: 0.5 },
      { taskId: vary.id, probability: 0.5 },
    ],
    chosenTaskId: retrieve.id,
    practiceAttemptId: practice.id,
    probeAttemptId: delayed.id,
  };
  return {
    pack,
    retrieve,
    vary,
    probe,
    practice,
    delayed,
    assessment,
    decision,
    events: [practice, delayed, assessment] as AutomaticityEvent[],
  };
}
test("a linked reviewed delayed reward updates the contextual action value only in shadow", async () => {
  const f = await fixture(),
    replay = await replayPracticeBandit([f.decision], f.events, [f.pack], now);
  expect(replay.observations).toHaveLength(1);
  expect(replay.observations[0]?.reward).toBe(1);
  expect(replay.active).toBe(false);
  expect(replay.readiness.readyForLiveUse).toBe(false);
  const policy = suggestPracticePolicy(
    replay,
    replay.observations[0]!.context,
    [
      { taskId: f.retrieve.id, arm: "retrieve" },
      { taskId: f.vary.id, arm: "vary" },
    ],
  );
  expect(policy.options[0]?.probability).toBeCloseTo(0.95);
  expect(policy.options[1]?.probability).toBeCloseTo(0.05);
  expect(
    evaluatePracticePolicy(replay.observations, (row) => row.options).estimate,
  ).toBe(1);
});
test("confirmed errors and missing targets are negative rewards, not missing follow-ups", async () => {
  const f = await fixture();
  for (const verdict of ["needs_repair", "target_not_observed"] as const) {
    const assessment = {
      ...f.assessment,
      verdict,
      dimensions: {
        ...f.assessment.dimensions,
        grammar: "fail" as const,
        target:
          verdict === "target_not_observed"
            ? ("not_observed" as const)
            : ("observed" as const),
      },
    };
    const replay = await replayPracticeBandit(
      [f.decision],
      [f.practice, f.delayed, assessment],
      [f.pack],
      now,
    );
    expect(replay.observations[0]?.reward).toBe(0);
  }
  const missing = await replayPracticeBandit(
    [{ ...f.decision, probeAttemptId: null }],
    f.events,
    [f.pack],
    now,
  );
  expect(missing.observations).toHaveLength(0);
  expect(missing.excluded[0]?.reason).toContain("not a zero reward");
});
test("self-grading, unapproved reviewers, uncertainty and an invalidated reward cannot train", async () => {
  const f = await fixture();
  for (const assessment of [
    {
      ...f.assessment,
      evaluator: { ...f.assessment.evaluator, kind: "self" as const },
    },
    {
      ...f.assessment,
      evaluator: { ...f.assessment.evaluator, scopeApproved: false },
    },
    { ...f.assessment, uncertainty: true },
  ])
    expect(
      (
        await replayPracticeBandit(
          [f.decision],
          [f.practice, f.delayed, assessment],
          [f.pack],
          now,
        )
      ).observations,
    ).toHaveLength(0);
  const events: AutomaticityEvent[] = [
    ...f.events,
    {
      version: 2,
      type: "invalidation",
      id: "withdrawn",
      language: "en",
      at: "2025-01-04T12:00:00.000Z",
      assessmentId: f.assessment.id,
      reason: "review_overturned",
    },
  ];
  expect(
    (await replayPracticeBandit([f.decision], events, [f.pack], now))
      .observations,
  ).toHaveLength(0);
});
test("assistance, short delays, repeated contexts and intervening exposure cannot reward a decision", async () => {
  const f = await fixture();
  for (const delayed of [
    {
      ...f.delayed,
      assistance: { ...f.delayed.assistance, solutionRevealed: true },
    },
    {
      ...f.delayed,
      at: "2025-01-01T13:00:00.000Z",
      timing: { ...f.delayed.timing, startedAt: "2025-01-01T13:00:00.000Z" },
    },
    {
      ...f.delayed,
      task: { ...f.delayed.task, contextId: f.practice.task.contextId },
    },
  ])
    expect(
      (
        await replayPracticeBandit(
          [f.decision],
          [f.practice, delayed, f.assessment],
          [f.pack],
          now,
        )
      ).observations,
    ).toHaveLength(0);
  const exposure: AutomaticityEvent = {
    version: 2,
    type: "exposure",
    id: "intervening",
    language: "en",
    at: "2025-01-02T12:00:00.000Z",
    constructionId: f.retrieve.constructionId,
    taskId: f.retrieve.id,
    itemFamily: f.retrieve.itemFamily,
    kind: "example",
  };
  expect(
    (
      await replayPracticeBandit(
        [f.decision],
        [...f.events, exposure],
        [f.pack],
        now,
      )
    ).observations,
  ).toHaveLength(0);
});
test("final tests, stale task bindings, unauthorised decisions and invalid propensities are rejected", async () => {
  const f = await fixture();
  for (const patch of [
    { partition: "final" },
    { consent: { ...f.decision.consent, policyDevelopment: false } },
    { options: f.decision.options.map((row) => ({ ...row, probability: 1 })) },
  ])
    expect(() => parsePracticeDecision({ ...f.decision, ...patch })).toThrow();
  for (const delayed of [
    {
      ...f.delayed,
      task: { ...f.delayed.task, partition: "evaluation" as const },
    },
    {
      ...f.delayed,
      task: { ...f.delayed.task, definitionSha256: "f".repeat(64) },
    },
    { ...f.delayed, response: { ...f.delayed.response, text: "Changed" } },
  ])
    expect(
      (
        await replayPracticeBandit(
          [f.decision],
          [f.practice, delayed, f.assessment],
          [f.pack],
          now,
        )
      ).observations,
    ).toHaveLength(0);
  f.pack.units[0]!.tasks.forEach((task) => {
    task.contentReview = "authored";
  });
  expect(
    (await replayPracticeBandit([f.decision], f.events, [f.pack], now))
      .observations,
  ).toHaveLength(0);
});
test("idempotent replay does not double-count rewards, and conflicting attribution is excluded", async () => {
  const f = await fixture();
  expect(
    (
      await replayPracticeBandit(
        [f.decision, f.decision],
        f.events,
        [f.pack],
        now,
      )
    ).observations,
  ).toHaveLength(1);
  expect(
    (
      await replayPracticeBandit(
        [f.decision, { ...f.decision, id: "second-credit" }],
        f.events,
        [f.pack],
        now,
      )
    ).observations,
  ).toHaveLength(0);
  expect(
    (
      await replayPracticeBandit(
        [f.decision, { ...f.decision, policyVersion: "conflict" }],
        f.events,
        [f.pack],
        now,
      )
    ).observations,
  ).toHaveLength(0);
});
test("deterministic history cannot evaluate an alternative that was never tried", async () => {
  const f = await fixture();
  f.decision.options[0]!.probability = 1;
  f.decision.options[1]!.probability = 0;
  const replay = await replayPracticeBandit(
    [f.decision],
    f.events,
    [f.pack],
    now,
  );
  const result = evaluatePracticePolicy(replay.observations, (row) =>
    row.options.map((option) => ({ ...option, probability: 0.5 })),
  );
  expect(result.available).toBe(false);
  expect(result.estimate).toBeNull();
  expect(result.reason).toContain("overlap");
});
test("extra copies of a task cannot increase its strategy's exploration share", async () => {
  const replay = await replayPracticeBandit([], [], [], now);
  const policy = suggestPracticePolicy(replay, "en:example:writing", [
    { taskId: "r1", arm: "retrieve" },
    { taskId: "r2", arm: "retrieve" },
    { taskId: "v", arm: "vary" },
  ]);
  expect(
    policy.options[0]!.probability + policy.options[1]!.probability,
  ).toBeCloseTo(0.5);
  expect(policy.options[2]?.probability).toBeCloseTo(0.5);
  expect(() =>
    suggestPracticePolicy(
      replay,
      "context",
      [
        { taskId: "r", arm: "retrieve" },
        { taskId: "v", arm: "vary" },
      ],
      0.5,
    ),
  ).toThrow();
});
