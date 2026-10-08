import {
  isRecord,
  validDate,
  validHash,
  type Language,
  type AutomaticityEvent,
} from "./contracts";
import { activePracticeTasks, type CurriculumPack } from "./curriculum";
import {
  reduceAutomaticityEvents,
  type ConstructionProgress,
} from "./evidence";
import type { LocalStore } from "./storage";
import { sha256 } from "./backup";
import { qualifyHumanReview } from "./human-review";

export interface PilotTarget {
  taskId: string;
  definitionSha256: string;
  constructionId: string;
  sourceAttemptId: string;
  sourceAssessmentId: string;
  arm: "baseline" | "fsrs";
  baselineDueAt: string;
  candidateDueAt: string;
}
export interface SchedulerPilotPlan {
  schemaVersion: 1;
  language: Language;
  id: string;
  version: string;
  curriculumSha256: string;
  approvedAt: string;
  startsAt: string;
  endsAt: string;
  reviewerId: string;
  evidenceSha256: string;
  shadowSha256: string;
  description: string;
  outcome: string;
  stoppingRule: string;
  targets: PilotTarget[];
}
export interface PilotEnrollment {
  schemaVersion: 1;
  id: string;
  planSha256: string;
  at: string;
  baseline: ConstructionProgress[];
}
export interface PilotCard extends PilotTarget {
  dueAt: string;
  state: "waiting" | "due" | "completed" | "interrupted";
  responseId: string | null;
}
const text = (value: unknown): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= 2000;
const stamp = (value: string) => Date.parse(value);
export function parseSchedulerPilotPlan(
  raw: unknown,
  language: Language,
): SchedulerPilotPlan {
  if (
    !isRecord(raw) ||
    raw.schemaVersion !== 1 ||
    raw.language !== language ||
    ![
      "id",
      "version",
      "reviewerId",
      "description",
      "outcome",
      "stoppingRule",
    ].every((key) => text(raw[key])) ||
    !["curriculumSha256", "evidenceSha256", "shadowSha256"].every((key) =>
      validHash(raw[key]),
    ) ||
    !["approvedAt", "startsAt", "endsAt"].every((key) => validDate(raw[key])) ||
    stamp(String(raw.approvedAt)) > stamp(String(raw.startsAt)) ||
    stamp(String(raw.endsAt)) <= stamp(String(raw.startsAt)) ||
    stamp(String(raw.endsAt)) - stamp(String(raw.startsAt)) > 30 * 86400000 ||
    !Array.isArray(raw.targets) ||
    raw.targets.length < 2 ||
    raw.targets.length > 12
  )
    throw Error("Invalid bounded scheduler comparison");
  const identities = new Set<string>(),
    constructions = new Set<string>(),
    arms = new Set<string>();
  for (const target of raw.targets) {
    if (
      !isRecord(target) ||
      ![
        "taskId",
        "constructionId",
        "sourceAttemptId",
        "sourceAssessmentId",
      ].every((key) => text(target[key])) ||
      !validHash(target.definitionSha256) ||
      !["baseline", "fsrs"].includes(String(target.arm)) ||
      !validDate(target.baselineDueAt) ||
      !validDate(target.candidateDueAt) ||
      [target.baselineDueAt, target.candidateDueAt].some(
        (at) =>
          stamp(at) < stamp(String(raw.startsAt)) ||
          stamp(at) > stamp(String(raw.endsAt)),
      ) ||
      identities.has(String(target.taskId)) ||
      constructions.has(String(target.constructionId))
    )
      throw Error("Invalid or repeated comparison target");
    identities.add(String(target.taskId));
    constructions.add(String(target.constructionId));
    arms.add(String(target.arm));
  }
  if (arms.size !== 2)
    throw Error("Both baseline and candidate dates must be represented");
  return raw as unknown as SchedulerPilotPlan;
}
/** A shipped plan still needs the exact reviewed catalog and current original judgments. */
export async function validateSchedulerPilotPlan(
  raw: unknown,
  pack: CurriculumPack,
  approvals: unknown,
  events: readonly AutomaticityEvent[],
  now: string,
): Promise<SchedulerPilotPlan> {
  const plan = parseSchedulerPilotPlan(raw, pack.language);
  if (
    !validDate(now) ||
    stamp(plan.approvedAt) > stamp(now) ||
    (await sha256(JSON.stringify(pack) + "\n")) !== plan.curriculumSha256
  )
    throw Error("Comparison approval or curriculum is stale");
  const rows = reduceAutomaticityEvents(events, pack.language, now).attempts;
  for (const target of plan.targets) {
    const task = pack.units
      .flatMap(activePracticeTasks)
      .find((task) => task.id === target.taskId);
    const row = rows.find((row) => row.attempt.id === target.sourceAttemptId);
    if (
      !task ||
      task.constructionId !== target.constructionId ||
      task.modality !== "writing" ||
      !["retrieve", "retain"].includes(task.stage) ||
      task.partition !== "practice" ||
      task.transferCondition !== "none" ||
      task.contentReview !== "human_reviewed" ||
      (await sha256(JSON.stringify(task))) !== target.definitionSha256 ||
      !row?.eligibleForMastery ||
      !row.delayed ||
      row.assessment?.id !== target.sourceAssessmentId ||
      row.attempt.task.definitionSha256 !== target.definitionSha256 ||
      row.attempt.task.id !== task.id ||
      stamp(row.assessment.at) > stamp(plan.approvedAt) ||
      row.assessment.evaluator.kind !== "human"
    )
      throw Error(
        "Comparison target lacks an exact qualified familiar-item review",
      );
    const scopes =
      isRecord(approvals) && Array.isArray(approvals.scopes)
        ? approvals.scopes
        : [];
    const scope = scopes.find(
      (scope) =>
        isRecord(scope) &&
        scope.taskId === task.id &&
        scope.reviewId === row.assessment!.evaluator.reviewId &&
        scope.evaluatorId === row.assessment!.evaluator.id &&
        scope.evaluatorVersion === row.assessment!.evaluator.version,
    );
    if (
      !isRecord(scope) ||
      typeof scope.reviewerName !== "string" ||
      !(await qualifyHumanReview(
        row.attempt,
        pack,
        approvals,
        scope.reviewerName,
        row.assessment.at,
      ))
    )
      throw Error("Comparison evaluator approval is unavailable");
  }
  return plan;
}
const prefix = (language: Language) =>
  `automaticity:v2:${language}:scheduler-pilot:`;
export const pilotActiveKey = (language: Language) =>
  prefix(language) + "active";
const enrollmentKey = (plan: SchedulerPilotPlan) =>
  prefix(plan.language) +
  "enrollment:" +
  encodeURIComponent(plan.id + ":" + plan.version);
function persist(store: LocalStore, key: string, value: string) {
  store.setItem(key, value);
  if (store.getItem(key) !== value)
    throw Error("Comparison record was not saved");
}
export function readPilotEnrollment(
  store: LocalStore,
  plan: SchedulerPilotPlan,
  planSha256: string,
): PilotEnrollment | null {
  try {
    const key = enrollmentKey(plan);
    if (store.getItem(pilotActiveKey(plan.language)) !== key) return null;
    const value: unknown = JSON.parse(store.getItem(key) ?? "null");
    if (
      !isRecord(value) ||
      value.schemaVersion !== 1 ||
      !text(value.id) ||
      value.planSha256 !== planSha256 ||
      !validDate(value.at) ||
      !Array.isArray(value.baseline)
    )
      return null;
    return value as unknown as PilotEnrollment;
  } catch {
    return null;
  }
}
export function hasPilotEnrollment(
  store: LocalStore,
  plan: SchedulerPilotPlan,
): boolean {
  return store.getItem(enrollmentKey(plan)) !== null;
}
export function enrollSchedulerPilot(
  store: LocalStore,
  plan: SchedulerPilotPlan,
  planSha256: string,
  events: readonly AutomaticityEvent[],
  at: string,
): PilotEnrollment {
  if (
    !validDate(at) ||
    !validHash(planSha256) ||
    stamp(at) < stamp(plan.approvedAt) ||
    stamp(at) > stamp(plan.endsAt) ||
    plan.targets.some(
      (target) =>
        stamp(
          target.arm === "fsrs" ? target.candidateDueAt : target.baselineDueAt,
        ) <= stamp(at),
    ) ||
    hasPilotEnrollment(store, plan) ||
    store.getItem(pilotActiveKey(plan.language)) !== null
  )
    throw Error("Comparison is not available for prospective enrolment");
  const state = reduceAutomaticityEvents(events, plan.language, at);
  for (const target of plan.targets) {
    const progress = state.progress.find(
      (row) =>
        row.constructionId === target.constructionId &&
        row.modality === "writing",
    );
    const latest = state.attempts
      .filter(
        (row) => row.attempt.task.constructionId === target.constructionId,
      )
      .sort((a, b) => stamp(b.attempt.at) - stamp(a.attempt.at))[0];
    if (
      progress?.nextReviewAt !== target.baselineDueAt ||
      progress.repairNeeded ||
      latest?.attempt.id !== target.sourceAttemptId ||
      latest.assessment?.id !== target.sourceAssessmentId ||
      !latest.eligibleForMastery ||
      events.some(
        (event) =>
          event.type === "exposure" &&
          event.constructionId === target.constructionId &&
          stamp(event.at) > stamp(latest.attempt.at),
      )
    )
      throw Error("Baseline changed; a new reviewed comparison is required");
  }
  const record: PilotEnrollment = {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    planSha256,
    at,
    baseline: structuredClone(state.progress),
  };
  // The immutable baseline is saved first; only the final pointer enables the bounded overlay.
  persist(store, enrollmentKey(plan), JSON.stringify(record));
  persist(store, pilotActiveKey(plan.language), enrollmentKey(plan));
  return record;
}
export function stopSchedulerPilot(
  store: LocalStore,
  language: Language,
  at: string,
): void {
  const key = store.getItem(pilotActiveKey(language));
  // Removing the overlay never rewrites the baseline or loses new learner responses.
  store.removeItem(pilotActiveKey(language));
  if (store.getItem(pilotActiveKey(language)) !== null)
    throw Error("Could not stop the comparison");
  if (key)
    persist(
      store,
      prefix(language) + "withdrawal:" + crypto.randomUUID(),
      JSON.stringify({ at, enrollment: key }),
    );
}
export function schedulerPilotCards(
  plan: SchedulerPilotPlan,
  enrollment: PilotEnrollment | null,
  events: readonly AutomaticityEvent[],
  at: string,
): PilotCard[] {
  if (
    !enrollment ||
    !validDate(at) ||
    stamp(at) < stamp(enrollment.at) ||
    stamp(at) > stamp(plan.endsAt)
  )
    return [];
  const state = reduceAutomaticityEvents(events, plan.language, at);
  return plan.targets.map((target) => {
    const dueAt =
      target.arm === "fsrs" ? target.candidateDueAt : target.baselineDueAt;
    const later = events
      .filter(
        (event) =>
          event.language === plan.language &&
          stamp(event.at) > stamp(enrollment.at) &&
          stamp(event.at) <= stamp(at) &&
          ((event.type === "attempt" &&
            event.task.constructionId === target.constructionId) ||
            (event.type === "exposure" &&
              event.constructionId === target.constructionId)),
      )
      .sort((a, b) => stamp(a.at) - stamp(b.at));
    const first = later[0],
      source = state.attempts.find(
        (row) => row.attempt.id === target.sourceAttemptId,
      );
    const intact =
      source?.eligibleForMastery &&
      source.assessment?.id === target.sourceAssessmentId;
    const completed =
      first?.type === "attempt" &&
      first.task.id === target.taskId &&
      first.task.definitionSha256 === target.definitionSha256 &&
      stamp(first.at) >= stamp(dueAt) &&
      !first.previousAttemptId &&
      !first.assistance.hintCount &&
      !first.assistance.exampleSeen &&
      !first.assistance.solutionRevealed &&
      !first.assistance.selfReportedAssistance;
    return {
      ...target,
      dueAt,
      state: !intact
        ? "interrupted"
        : first
          ? completed
            ? "completed"
            : "interrupted"
          : stamp(at) >= stamp(dueAt)
            ? "due"
            : "waiting",
      responseId: first?.type === "attempt" ? first.id : null,
    };
  });
}
export function recordPilotDelivery(
  store: LocalStore,
  plan: SchedulerPilotPlan,
  enrollment: PilotEnrollment,
  card: PilotCard,
  at: string,
): void {
  if (
    card.state !== "due" ||
    stamp(at) < stamp(card.dueAt) ||
    stamp(at) > stamp(plan.endsAt) ||
    store.getItem(pilotActiveKey(plan.language)) !== enrollmentKey(plan)
  )
    throw Error("Comparison item is not due or enrolment ended");
  const key =
    prefix(plan.language) +
    "delivery:" +
    enrollment.id +
    ":" +
    encodeURIComponent(card.taskId);
  if (store.getItem(key) === null)
    persist(
      store,
      key,
      JSON.stringify({
        at,
        planId: plan.id,
        planVersion: plan.version,
        enrollmentId: enrollment.id,
        taskId: card.taskId,
        definitionSha256: card.definitionSha256,
        arm: card.arm,
        baselineDueAt: card.baselineDueAt,
        candidateDueAt: card.candidateDueAt,
        deliveredDueAt: card.dueAt,
      }),
    );
}
export function outsidePilotPack(
  pack: CurriculumPack,
  cards: readonly PilotCard[],
): CurriculumPack {
  const reserved = new Set(
    cards
      .filter((card) => card.state === "waiting" || card.state === "due")
      .map((card) => card.constructionId),
  );
  return {
    ...pack,
    units: pack.units.filter((unit) => !reserved.has(unit.id)),
  };
}
