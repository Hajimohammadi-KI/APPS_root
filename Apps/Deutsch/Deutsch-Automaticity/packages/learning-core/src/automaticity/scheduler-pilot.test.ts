import { expect, test } from "bun:test";
import { sha256 } from "./backup";
import { reduceAutomaticityEvents } from "./evidence";
import type {
  AutomaticityEvent,
  AttemptEvent,
  AssessmentEvent,
  Language,
} from "./contracts";
import type { CurriculumPack, PracticeTask } from "./curriculum";
import type { HumanReviewManifest } from "./human-review";
import type { LocalStore } from "./storage";
import {
  parseSchedulerPilotPlan,
  validateSchedulerPilotPlan,
  enrollSchedulerPilot,
  stopSchedulerPilot,
  readPilotEnrollment,
  pilotActiveKey,
  schedulerPilotCards,
  outsidePilotPack,
  recordPilotDelivery,
  type SchedulerPilotPlan,
} from "./scheduler-pilot";
class Store implements LocalStore {
  data = new Map<string, string>();
  fail = false;
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.fail) throw Error("quota");
    this.data.set(k, v);
  }
}
async function fixture(language: Language = "en") {
  const at = "2026-09-06T12:00:00.000Z",
    events: AutomaticityEvent[] = [];
  const pack: CurriculumPack = {
    language,
    version: "1",
    mappingVersion: "1",
    units: [],
  };
  const approvals: HumanReviewManifest = {
    schemaVersion: 1,
    language,
    contentVersion: "1",
    mappingVersion: "1",
    curriculumSha256: "",
    scopes: [],
  };
  const plan: SchedulerPilotPlan = {
    schemaVersion: 1,
    language,
    id: "synthetic-comparison",
    version: "1",
    curriculumSha256: "",
    approvedAt: at,
    startsAt: at,
    endsAt: "2026-09-25T12:00:00.000Z",
    reviewerId: "synthetic-reviewer",
    evidenceSha256: "a".repeat(64),
    shadowSha256: "b".repeat(64),
    description: "Synthetic bounded comparison",
    outcome: "Reviewed delayed accuracy and workload",
    stoppingRule: "Withdraw or stop at end",
    targets: [],
  };
  for (let index = 0; index < 2; index++) {
    const task: PracticeTask = {
      id: `task-${index}`,
      version: "1",
      constructionId: `${language}.c.00${index + 1}`,
      familyId: "G01",
      itemFamily: `family-${index}`,
      contextId: `context-${index}`,
      rubricVersion: "1",
      stage: "retrieve",
      modality: "writing",
      partition: "practice",
      transferCondition: "none",
      contentReview: "human_reviewed",
      prompt: "Synthetic review",
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
    pack.units.push({
      id: task.constructionId,
      language,
      title: `Synthetic ${index}`,
      level: "A1",
      familyIds: ["G01"],
      prerequisites: [],
      lessonAlias: `test-${index}`,
      rule: "test",
      examples: [],
      commonError: "test",
      review: "human_reviewed",
      sources: [],
      tasks: [task],
    });
    const definitionSha256 = await sha256(JSON.stringify(task));
    for (const day of [2, 5]) {
      const time = `2026-09-0${day}T12:00:00.000Z`,
        attempt: AttemptEvent = {
          version: 2,
          type: "attempt",
          id: `attempt-${index}-${day}`,
          language,
          at: time,
          task: { ...task, definitionSha256 },
          response: {
            text: "Synthetic answer",
            sha256: await sha256("Synthetic answer"),
            originalTranscriptSha256: null,
            transcriptEdited: false,
          },
          timing: {
            startedAt: time,
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
      const assessment: AssessmentEvent = {
        version: 2,
        type: "assessment",
        id: `judge-${index}-${day}`,
        language,
        at: time,
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
          id: "synthetic-procedure",
          version: "1",
          kind: "human",
          scopeApproved: true,
          reviewId: `review-${index}`,
        },
        uncertainty: false,
        confidence: null,
        feedback: "Synthetic only",
        correction: null,
        spans: [],
        supersedes: null,
      };
      events.push(attempt, assessment);
    }
    approvals.scopes.push({
      taskId: task.id,
      taskVersion: "1",
      rubricVersion: "1",
      definitionSha256,
      reviewerName: "Synthetic reviewer",
      evaluatorId: "synthetic-procedure",
      evaluatorVersion: "1",
      reviewId: `review-${index}`,
      approvedAt: "2026-09-01T12:00:00.000Z",
    });
    plan.targets.push({
      taskId: task.id,
      definitionSha256,
      constructionId: task.constructionId,
      sourceAttemptId: `attempt-${index}-5`,
      sourceAssessmentId: `judge-${index}-5`,
      arm: index ? "baseline" : "fsrs",
      baselineDueAt: "2026-09-08T12:00:00.000Z",
      candidateDueAt: "2026-09-10T12:00:00.000Z",
    });
  }
  plan.curriculumSha256 = approvals.curriculumSha256 = await sha256(
    JSON.stringify(pack) + "\n",
  );
  return {
    pack,
    plan,
    approvals,
    events,
    at,
    store: new Store(),
    digest: await sha256(JSON.stringify(plan)),
  };
}
for (const language of ["en", "de"] as const)
  test(`${language}: exact approved plan delivers candidate dates and withdrawal restores unchanged baseline`, async () => {
    const f = await fixture(language),
      before = JSON.stringify(f.events);
    await expect(
      validateSchedulerPilotPlan(f.plan, f.pack, f.approvals, f.events, f.at),
    ).resolves.toEqual(f.plan);
    const enrollment = enrollSchedulerPilot(
      f.store,
      f.plan,
      f.digest,
      f.events,
      f.at,
    );
    expect(enrollment.baseline).toEqual(
      reduceAutomaticityEvents(f.events, language, f.at).progress,
    );
    expect(readPilotEnrollment(f.store, f.plan, f.digest)).toEqual(enrollment);
    expect(
      schedulerPilotCards(
        f.plan,
        enrollment,
        f.events,
        "2026-09-09T12:00:00.000Z",
      ).map((card) => card.state),
    ).toEqual(["waiting", "due"]);
    const cards = schedulerPilotCards(
      f.plan,
      enrollment,
      f.events,
      "2026-09-11T12:00:00.000Z",
    );
    expect(cards.every((card) => card.state === "due")).toBe(true);
    expect(outsidePilotPack(f.pack, cards).units).toHaveLength(0);
    recordPilotDelivery(
      f.store,
      f.plan,
      enrollment,
      cards[0]!,
      "2026-09-11T12:00:00.000Z",
    );
    const count = f.store.length;
    recordPilotDelivery(
      f.store,
      f.plan,
      enrollment,
      cards[0]!,
      "2026-09-11T12:00:00.000Z",
    );
    expect(f.store.length).toBe(count);
    stopSchedulerPilot(f.store, language, "2026-09-11T12:00:00.000Z");
    expect(readPilotEnrollment(f.store, f.plan, f.digest)).toBeNull();
    expect(f.store.length).toBeGreaterThan(0);
    expect(JSON.stringify(f.events)).toBe(before);
  });
test("authored content, forged approval, wrong definition and stale source review cannot enable a comparison", async () => {
  const f = await fixture();
  for (const patch of [
    { ...f.plan, curriculumSha256: "c".repeat(64) },
    {
      ...f.plan,
      targets: f.plan.targets.map((target) => ({
        ...target,
        definitionSha256: "c".repeat(64),
      })),
    },
    {
      ...f.plan,
      targets: f.plan.targets.map((target) => ({
        ...target,
        sourceAssessmentId: "wrong",
      })),
    },
  ])
    await expect(
      validateSchedulerPilotPlan(patch, f.pack, f.approvals, f.events, f.at),
    ).rejects.toThrow();
  await expect(
    validateSchedulerPilotPlan(
      f.plan,
      f.pack,
      { ...f.approvals, scopes: [] },
      f.events,
      f.at,
    ),
  ).rejects.toThrow();
  const other = structuredClone(f.pack);
  other.units[0]!.tasks[0]!.contentReview = "authored";
  await expect(
    validateSchedulerPilotPlan(f.plan, other, f.approvals, f.events, f.at),
  ).rejects.toThrow();
});
test("bounded design rejects missing arms, duplicated constructions and excessive or retrospective windows", async () => {
  const f = await fixture();
  for (const patch of [
    { ...f.plan, targets: [f.plan.targets[0], f.plan.targets[0]] },
    { ...f.plan, endsAt: "2027-01-01T00:00:00Z" },
    { ...f.plan, approvedAt: "2026-09-07T00:00:00Z" },
  ])
    expect(() => parseSchedulerPilotPlan(patch, "en")).toThrow();
  expect(() =>
    enrollSchedulerPilot(
      f.store,
      f.plan,
      f.digest,
      f.events,
      "2026-09-09T12:00:00.000Z",
    ),
  ).toThrow();
});
test("new practice, repair or exposure interrupts the comparison without dropping the response", async () => {
  const f = await fixture(),
    enrollment = enrollSchedulerPilot(
      f.store,
      f.plan,
      f.digest,
      f.events,
      f.at,
    ),
    old = f.events.find((event) => event.type === "attempt") as AttemptEvent;
  const late: AttemptEvent = {
    ...old,
    id: "after",
    at: "2026-09-11T12:00:00.000Z",
  };
  expect(
    schedulerPilotCards(f.plan, enrollment, [...f.events, late], late.at)[0]!
      .state,
  ).toBe("completed");
  expect(
    schedulerPilotCards(
      f.plan,
      enrollment,
      [...f.events, { ...late, at: "2026-09-07T12:00:00.000Z" }],
      late.at,
    )[0]!.state,
  ).toBe("interrupted");
  expect(
    schedulerPilotCards(
      f.plan,
      enrollment,
      [
        ...f.events,
        { ...late, assistance: { ...late.assistance, exampleSeen: true } },
      ],
      late.at,
    )[0]!.state,
  ).toBe("interrupted");
  expect(() =>
    enrollSchedulerPilot(
      new Store(),
      f.plan,
      f.digest,
      [...f.events, { ...late, at: f.at }],
      f.at,
    ),
  ).toThrow();
  expect(
    schedulerPilotCards(f.plan, enrollment, f.events, "2026-10-01T00:00:00Z"),
  ).toEqual([]);
});
test("quota failure cannot start a pilot or prevent fail-closed withdrawal; corrupt state stays preserved", async () => {
  const f = await fixture();
  f.store.fail = true;
  expect(() =>
    enrollSchedulerPilot(f.store, f.plan, f.digest, f.events, f.at),
  ).toThrow();
  expect(f.store.getItem(pilotActiveKey("en"))).toBeNull();
  f.store.fail = false;
  enrollSchedulerPilot(f.store, f.plan, f.digest, f.events, f.at);
  f.store.fail = true;
  expect(() => stopSchedulerPilot(f.store, "en", f.at)).toThrow();
  expect(readPilotEnrollment(f.store, f.plan, f.digest)).toBeNull();
  f.store.fail = false;
  f.store.setItem(pilotActiveKey("en"), "corrupt");
  f.store.setItem("corrupt", "{broken");
  expect(readPilotEnrollment(f.store, f.plan, f.digest)).toBeNull();
  expect(f.store.getItem("corrupt")).toBe("{broken");
});
