import { sha256 } from "../../shared/learning-core/src/automaticity/backup";
import { reduceAutomaticityEvents } from "../../shared/learning-core/src/automaticity/evidence";
import type {
  AutomaticityEvent,
  AttemptEvent,
  AssessmentEvent,
  Language,
} from "../../shared/learning-core/src/automaticity/contracts";
import type {
  CurriculumPack,
  PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
import type { HumanReviewManifest } from "../../shared/learning-core/src/automaticity/human-review";
import type { LocalStore } from "../../shared/learning-core/src/automaticity/storage";
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
} from "../../shared/learning-core/src/automaticity/scheduler-pilot";
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
export async function fixture(language: Language = "en") {
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
