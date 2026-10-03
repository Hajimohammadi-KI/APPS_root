import assert from "node:assert/strict";
import {
  isRecord,
  validDate,
  type AutomaticityEvent,
} from "../../shared/learning-core/src/automaticity/contracts";
import {
  schedulerPilotCards,
  validateSchedulerPilotPlan,
  type PilotEnrollment,
} from "../../shared/learning-core/src/automaticity/scheduler-pilot";
import { reduceAutomaticityEvents } from "../../shared/learning-core/src/automaticity/evidence";
import {
  qualifyHumanReview,
  type HumanReviewManifest,
} from "../../shared/learning-core/src/automaticity/human-review";
import type { CurriculumPack } from "../../shared/learning-core/src/automaticity/curriculum";
import { sha256 } from "./automaticity-release-reviews";
/** Call with a validated backup and independently validated release ledger. */
export async function evaluateSchedulerPilot(
  pack: CurriculumPack,
  approvals: HumanReviewManifest,
  rawPlan: unknown,
  events: AutomaticityEvent[],
  entries: Map<string, string>,
  at: string,
) {
  const prefix = `automaticity:v2:${pack.language}:`;
  const plan = await validateSchedulerPilotPlan(
      rawPlan,
      pack,
      approvals,
      events,
      at,
    ),
    planSha256 = sha256(JSON.stringify(plan)),
    enrollmentKey =
      prefix +
      "scheduler-pilot:enrollment:" +
      encodeURIComponent(plan.id + ":" + plan.version);
  const raw: unknown = JSON.parse(entries.get(enrollmentKey) ?? "null");
  assert(
    isRecord(raw) &&
      raw.schemaVersion === 1 &&
      typeof raw.id === "string" &&
      raw.planSha256 === planSha256 &&
      validDate(raw.at) &&
      Array.isArray(raw.baseline),
  );
  const enrollment = raw as unknown as PilotEnrollment;
  assert(
    Date.parse(enrollment.at) >= Date.parse(plan.approvedAt) &&
      plan.targets.every(
        (target) =>
          Date.parse(
            target.arm === "fsrs"
              ? target.candidateDueAt
              : target.baselineDueAt,
          ) > Date.parse(enrollment.at),
      ),
  );
  assert.deepEqual(
    enrollment.baseline,
    reduceAutomaticityEvents(
      events.filter(
        (event) => Date.parse(event.at) <= Date.parse(enrollment.at),
      ),
      pack.language,
      enrollment.at,
    ).progress,
    "Baseline snapshot does not match original events",
  );
  const withdrawals = [...entries]
    .filter(([key]) => key.startsWith(prefix + "scheduler-pilot:withdrawal:"))
    .map(([, value]) => JSON.parse(value))
    .filter((value) => value.enrollment === enrollmentKey);
  for (const withdrawal of withdrawals)
    assert(
      validDate(withdrawal.at) &&
        Date.parse(withdrawal.at) >= Date.parse(enrollment.at),
    );
  const withdrewAt = withdrawals.length
    ? new Date(
        Math.min(...withdrawals.map((value) => Date.parse(value.at))),
      ).toISOString()
    : null;
  const analysisAt = new Date(
    Math.min(
      Date.parse(at),
      Date.parse(plan.endsAt),
      withdrewAt ? Date.parse(withdrewAt) : Infinity,
    ),
  ).toISOString();
  const state = reduceAutomaticityEvents(events, pack.language, at),
    cards = schedulerPilotCards(plan, enrollment, events, analysisAt),
    observations: {
      taskId: string;
      arm: "baseline" | "fsrs";
      dueAt: string;
      deliveredAt: string | null;
      responseId: string | null;
      outcome: string;
      activeWritingMs: number | null;
    }[] = [];
  const missingWithdrawalTime =
    entries.get(prefix + "scheduler-pilot:active") !== enrollmentKey &&
    withdrawals.length === 0;
  for (const card of cards) {
    const deliveryRaw = entries.get(
        prefix +
          "scheduler-pilot:delivery:" +
          enrollment.id +
          ":" +
          encodeURIComponent(card.taskId),
      ),
      delivery = deliveryRaw ? JSON.parse(deliveryRaw) : null;
    if (delivery)
      assert(
        validDate(delivery.at) &&
          Date.parse(delivery.at) >= Date.parse(card.dueAt) &&
          Date.parse(delivery.at) <= Date.parse(analysisAt) &&
          delivery.enrollmentId === enrollment.id &&
          delivery.taskId === card.taskId &&
          delivery.definitionSha256 === card.definitionSha256 &&
          delivery.arm === card.arm &&
          delivery.deliveredDueAt === card.dueAt,
        "Invalid delivery record",
      );
    const row = state.attempts.find(
        (row) => row.attempt.id === card.responseId,
      ),
      assessment = row?.assessment;
    const scope = assessment
      ? approvals.scopes.find(
          (scope: {
            taskId: string;
            evaluatorId: string;
            evaluatorVersion: string;
            reviewId: string;
          }) =>
            scope.taskId === card.taskId &&
            scope.evaluatorId === assessment.evaluator.id &&
            scope.evaluatorVersion === assessment.evaluator.version &&
            scope.reviewId === assessment.evaluator.reviewId,
        )
      : null;
    const qualified = !!(
      row &&
      assessment &&
      row.eligibleForMastery &&
      assessment.evaluator.kind === "human" &&
      scope &&
      (await qualifyHumanReview(
        row.attempt,
        pack,
        approvals,
        scope.reviewerName,
        assessment.at,
      ))
    );
    const outcome = missingWithdrawalTime
      ? "withdrawal_time_unknown"
      : card.state === "interrupted"
        ? "excluded"
        : card.state === "completed"
          ? !delivery || Date.parse(delivery.at) > Date.parse(row!.attempt.at)
            ? "unlogged_response"
            : qualified
              ? row!.success
                ? "pass"
                : "fail"
              : "unassessed"
          : withdrewAt
            ? "withdrawn"
            : Date.parse(at) > Date.parse(plan.endsAt)
              ? "missing"
              : "pending";
    observations.push({
      taskId: card.taskId,
      arm: card.arm,
      dueAt: card.dueAt,
      deliveredAt: delivery?.at ?? null,
      responseId: card.responseId,
      outcome,
      activeWritingMs:
        row?.attempt.timing.source === "monotonic_visible"
          ? row.attempt.timing.activeMs
          : null,
    });
  }
  return {
    status: "descriptive_comparison_only",
    planSha256,
    observations,
    arms: ["baseline", "fsrs"].map((arm) => {
      const rows = observations.filter((row) => row.arm === arm),
        assessed = rows.filter((row) => ["pass", "fail"].includes(row.outcome));
      return {
        arm,
        targets: rows.length,
        delivered: rows.filter((row) => row.deliveredAt).length,
        assessed: assessed.length,
        passes: assessed.filter((row) => row.outcome === "pass").length,
        accuracy: assessed.length
          ? assessed.filter((row) => row.outcome === "pass").length /
            assessed.length
          : null,
        missing: rows.filter((row) => row.outcome === "missing").length,
        unassessed: rows.filter((row) => row.outcome === "unassessed").length,
      };
    }),
    causalBenefitEstablished: false,
    automaticMasteryGranted: false,
    limit:
      "Small within-person descriptive comparison. Independent analysis of uncertainty, missingness, contamination and the predeclared benefit criteria is required. Delivered items are counted; no study-time burden is inferred from clicks.",
  };
}
