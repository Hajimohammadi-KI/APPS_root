import { expect, test } from "bun:test";
import {
  collectAssessmentFeedback,
  guardAssessmentWithFeedback,
  persistFeedbackAssessment,
} from "./assessment-feedback";
import { assessControlledTask } from "./assessment";
import { sha256 } from "./backup";
import type {
  AssessmentEvent,
  AttemptEvent,
  AutomaticityEvent,
} from "./contracts";
import type { CurriculumPack } from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import {
  REPRESENTATIVE_SCOPES,
  representativeTasks,
} from "./representative-tasks";
import {
  appendAutomaticityEvent,
  readAutomaticityEvents,
  type LocalStore,
} from "./storage";
const at = "2026-09-05T10:00:00.000Z",
  later = "2026-09-05T10:10:00.000Z";
async function fixture(language: "en" | "de" = "en") {
  const scope = REPRESENTATIVE_SCOPES.find(
    (row) => row.rule === `${language}.inflection`,
  )!;
  const task = representativeTasks(scope).find(
    (row) => row.stage === "retrieve" && row.modality === "writing",
  )!;
  const pack = {
    language,
    version: "synthetic-feedback-pack",
    units: [{ id: scope.constructionId, tasks: [task] }],
  } as CurriculumPack;
  const text = scope.scenarios[0].example;
  const attempt: AttemptEvent = {
    version: 2,
    type: "attempt",
    id: "a",
    language,
    at,
    task: { ...task, definitionSha256: await sha256(JSON.stringify(task)) },
    response: {
      text,
      sha256: await sha256(text),
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
  const automated = assessControlledTask(
    attempt,
    task,
    "2026-09-05T10:00:01.000Z",
    "machine",
  );
  const review: AssessmentEvent = {
    ...automated,
    id: "review",
    at: "2026-09-05T10:01:00.000Z",
    verdict: "needs_repair",
    dimensions: {
      grammar: "fail",
      target: "observed",
      relevance: "unknown",
      opportunities: 1,
    },
    evaluator: {
      id: "local-review:Synthetic reviewer",
      version: "1",
      kind: "human",
      reviewId: "synthetic-only",
      scopeApproved: false,
    },
    feedback:
      "Synthetic disagreement to verify transport, not a real linguistic judgment.",
    correction: "Synthetic correction only.",
    supersedes: automated.id,
  };
  const events: AutomaticityEvent[] = [attempt, automated, review];
  const next = {
    ...attempt,
    id: "b",
    at: later,
    timing: { ...attempt.timing, startedAt: later },
  };
  const proposal = assessControlledTask(next, task, later, "next-machine");
  return {
    scope,
    task,
    pack,
    attempt,
    automated,
    review,
    events,
    next,
    proposal,
  };
}
for (const language of ["en", "de"] as const)
  test(`${language}: remembered disagreement abstains, preserves original judgments and cannot grant mastery`, async () => {
    const f = await fixture(language),
      original = JSON.stringify(f.events);
    const report = await collectAssessmentFeedback(f.events, f.pack, later);
    expect(report.cases).toHaveLength(1);
    expect(report.cases[0]!.disagreement).toBe(true);
    expect(report.independentReviewEstablished).toBe(false);
    const guard = await guardAssessmentWithFeedback(
      f.next,
      f.task,
      f.proposal,
      report,
      later,
      "guard",
    );
    expect(guard?.verdict).toBe("not_assessed");
    expect(guard?.correction).toBe(f.review.correction);
    expect(guard?.supersedes).toBe(f.proposal.id);
    const state = reduceAutomaticityEvents(
      [...f.events, f.next, f.proposal, guard],
      language,
      "2026-09-05T10:11:00.000Z",
    );
    expect(state.attempts.at(-1)?.assessment?.id).toBe("guard");
    expect(state.attempts.at(-1)?.eligibleForMastery).toBe(false);
    expect(JSON.stringify(f.events)).toBe(original);
  });
test("self-checks, uncertain reviews and invalidated reviews cannot teach the checker", async () => {
  const f = await fixture();
  for (const review of [
    {
      ...f.review,
      evaluator: { ...f.review.evaluator, kind: "self" as const },
      supersedes: null,
    },
    { ...f.review, uncertainty: true },
    { ...f.review, supersedes: "missing" },
  ]) {
    expect(
      (
        await collectAssessmentFeedback(
          [f.attempt, f.automated, review],
          f.pack,
          later,
        )
      ).cases,
    ).toHaveLength(0);
  }
  expect(
    (
      await collectAssessmentFeedback(
        [
          ...f.events,
          {
            version: 2,
            type: "invalidation",
            id: "invalidate",
            language: "en",
            at: "2026-09-05T10:02:00.000Z",
            assessmentId: f.review.id,
            reason: "review_overturned",
          },
        ],
        f.pack,
        later,
      )
    ).cases,
  ).toHaveLength(0);
});
test("malformed hashes, conflicting IDs, future reviews and unlinked feedback are excluded", async () => {
  const f = await fixture();
  for (const rows of [
    [
      { ...f.attempt, response: { ...f.attempt.response, text: "edited" } },
      f.automated,
      f.review,
    ],
    [...f.events, { ...f.review, feedback: "Conflicting duplicate" }],
    [f.attempt, f.automated, { ...f.review, at: "2099-01-01T00:00:00.000Z" }],
    [f.attempt, f.automated, { ...f.review, supersedes: null }],
  ])
    expect(
      (await collectAssessmentFeedback(rows, f.pack, later)).cases,
    ).toHaveLength(0);
});
test("a later review can retract the disagreement without deleting history", async () => {
  const f = await fixture();
  const corrected = {
    ...f.review,
    id: "re-review",
    at: "2026-09-05T10:02:00.000Z",
    verdict: "pass" as const,
    dimensions: f.automated.dimensions,
    supersedes: f.review.id,
  };
  const report = await collectAssessmentFeedback(
    [...f.events, corrected],
    f.pack,
    later,
  );
  expect(report.cases[0]?.disagreement).toBe(false);
  expect(report.cases[0]?.history).toHaveLength(3);
  expect(
    await guardAssessmentWithFeedback(
      f.next,
      f.task,
      f.proposal,
      report,
      later,
      "guard",
    ),
  ).toBeNull();
});
test("conflicting reviews of identical responses abstain without selecting a correction", async () => {
  const f = await fixture();
  const a2 = { ...f.attempt, id: "other-a" },
    m2 = { ...f.automated, id: "other-m", attemptId: a2.id };
  const r2 = {
    ...f.review,
    id: "other-r",
    attemptId: a2.id,
    supersedes: m2.id,
    verdict: "pass" as const,
    dimensions: m2.dimensions,
  };
  const report = await collectAssessmentFeedback(
    [...f.events, a2, m2, r2],
    f.pack,
    later,
  );
  const guard = await guardAssessmentWithFeedback(
    f.next,
    f.task,
    f.proposal,
    report,
    later,
    "guard",
  );
  expect(guard?.feedback).toContain("disagree");
  expect(guard?.correction).toBeNull();
});
test("feedback does not generalize to other input, tasks, versions or evaluators", async () => {
  const f = await fixture(),
    report = await collectAssessmentFeedback(f.events, f.pack, later);
  for (const task of [
    { ...f.task, version: "new" },
    { ...f.task, prompt: "Changed prompt" },
    { ...f.task, modality: "speaking" as const },
  ]) {
    expect(
      await guardAssessmentWithFeedback(
        { ...f.next, task },
        task,
        f.proposal,
        report,
        later,
        "guard",
      ),
    ).toBeNull();
  }
  for (const evaluator of [
    { ...f.proposal.evaluator, version: "new" },
    { ...f.proposal.evaluator, id: "other-checker" },
  ])
    expect(
      await guardAssessmentWithFeedback(
        f.next,
        f.task,
        { ...f.proposal, evaluator },
        report,
        later,
        "guard",
      ),
    ).toBeNull();
  const text = f.next.response.text + " ";
  const changed = {
    ...f.next,
    response: { ...f.next.response, text, sha256: await sha256(text) },
  };
  expect(
    await guardAssessmentWithFeedback(
      changed,
      f.task,
      { ...f.proposal, responseSha256: changed.response.sha256 },
      report,
      later,
      "guard",
    ),
  ).toBeNull();
});
test("a new curriculum task version cannot reinterpret old feedback", async () => {
  const f = await fixture();
  f.pack.units[0]!.tasks = [{ ...f.task, version: "new" }];
  const report = await collectAssessmentFeedback(f.events, f.pack, later);
  expect(report.cases).toHaveLength(0);
  expect(report.excluded).toHaveLength(1);
});
test("legacy task identities and a silently changed prompt cannot inherit feedback", async () => {
  const f = await fixture();
  const old = {
    ...f.attempt,
    task: { ...f.attempt.task, definitionSha256: undefined },
  };
  expect(
    (
      await collectAssessmentFeedback(
        [old, f.automated, f.review],
        f.pack,
        later,
      )
    ).cases,
  ).toHaveLength(0);
  f.pack.units[0]!.tasks = [
    { ...f.task, prompt: "Changed without a version bump" },
  ];
  expect(
    (await collectAssessmentFeedback(f.events, f.pack, later)).cases,
  ).toHaveLength(0);
});
test("interruption during guarded persistence never leaves the disputed pass current", async () => {
  const f = await fixture(),
    report = await collectAssessmentFeedback(f.events, f.pack, later);
  const guard = await guardAssessmentWithFeedback(
    f.next,
    f.task,
    f.proposal,
    report,
    later,
    "guard",
  );
  for (const failAt of [1, 2, 3]) {
    const data = new Map<string, string>();
    let writes = 0;
    const store: LocalStore = {
      get length() {
        return data.size;
      },
      key: (i) => [...data.keys()][i] ?? null,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => {
        if (++writes === failAt + 1) throw Error("quota");
        data.set(k, v);
      },
      removeItem: (k) => {
        data.delete(k);
      },
    };
    appendAutomaticityEvent(store, f.next);
    try {
      persistFeedbackAssessment(store, f.proposal, guard);
    } catch {
      /* Expected interruption. */
    }
    const reduced = reduceAutomaticityEvents(
      readAutomaticityEvents(store, "en").events,
      "en",
      "2026-09-05T10:11:00.000Z",
    );
    expect(reduced.attempts[0]?.assessment?.verdict).not.toBe("pass");
  }
});
