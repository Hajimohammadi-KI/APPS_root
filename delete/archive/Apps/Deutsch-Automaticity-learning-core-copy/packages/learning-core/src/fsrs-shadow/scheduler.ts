import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

import type {
  FsrsCandidateSchedule,
  FsrsDueCountComparison,
  FsrsShadowRecord,
  FsrsShadowReviewEvent,
  LegacyMigrationAssessment,
  LegacyReviewScheduleSnapshot,
} from "./types";

export const FSRS_SHADOW_ALGORITHM = Object.freeze({
  package: "ts-fsrs",
  packageVersion: "5.4.1",
  algorithmVersion: "FSRS-6.0",
  upstreamCommit: "d26af4d93b8c17cce2513433576587a2750bc80b",
  requestRetention: 0.9,
  maximumIntervalDays: 36_500,
  enableShortTerm: true,
  enableFuzz: false,
} as const);

const DAY_MS = 86_400_000;

function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

function requireDate(value: string | number | Date): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid review date");
  return date;
}

function toGrade(rating: FsrsShadowReviewEvent["rating"]): Grade {
  switch (rating) {
    case 1:
      return Rating.Again;
    case 2:
      return Rating.Hard;
    case 3:
      return Rating.Good;
    case 4:
      return Rating.Easy;
  }
}

function createScheduler() {
  return fsrs({
    request_retention: FSRS_SHADOW_ALGORITHM.requestRetention,
    maximum_interval: FSRS_SHADOW_ALGORITHM.maximumIntervalDays,
    enable_short_term: FSRS_SHADOW_ALGORITHM.enableShortTerm,
    enable_fuzz: FSRS_SHADOW_ALGORITHM.enableFuzz,
  });
}

export function assessLegacyReviewMigration(
  snapshot: LegacyReviewScheduleSnapshot,
): LegacyMigrationAssessment {
  const hasAggregateHistory =
    snapshot.successStreak > 0 ||
    snapshot.stabilityScore > 0 ||
    snapshot.lastSuccessAt !== undefined;
  return {
    historyCompleteness: hasAggregateHistory ? "aggregate-only" : "none",
    seedEligible: false,
    missingFields: [
      "timestamped-ratings",
      "per-review-elapsed-days",
      "card-state-before-each-review",
    ],
    reason: hasAggregateHistory
      ? "The legacy state contains aggregate progress but not the timestamped ratings required to reconstruct FSRS memory state."
      : "The legacy state contains no review history that can seed an FSRS memory state.",
  };
}

export function replayFsrsShadowEvents(
  events: readonly Pick<
    FsrsShadowReviewEvent,
    "eventId" | "reviewedAt" | "rating"
  >[],
): FsrsCandidateSchedule {
  if (events.length === 0)
    throw new RangeError("At least one review event is required");
  const ordered = [...events].sort(
    (left, right) =>
      Date.parse(left.reviewedAt) - Date.parse(right.reviewedAt) ||
      left.eventId.localeCompare(right.eventId),
  );
  const firstEvent = ordered[0];
  if (!firstEvent)
    throw new RangeError("At least one review event is required");
  const firstDate = requireDate(firstEvent.reviewedAt);
  const scheduler = createScheduler();
  let card: Card = createEmptyCard(firstDate);
  for (const event of ordered) {
    const reviewedAt = requireDate(event.reviewedAt);
    if (reviewedAt.getTime() < firstDate.getTime()) {
      throw new RangeError("Review events must not predate the shadow history");
    }
    card = scheduler.next(card, reviewedAt, toGrade(event.rating)).card;
  }
  const lastReviewAt = requireDate(ordered.at(-1)?.reviewedAt ?? firstDate);
  return {
    dueAt: requireDate(card.due).toISOString(),
    scheduledDays: Math.max(0, finite(card.scheduled_days)),
    stability: Math.max(0, finite(card.stability)),
    difficulty: Math.min(10, Math.max(1, finite(card.difficulty, 1))),
    retrievability: Math.min(
      1,
      Math.max(
        0,
        finite(scheduler.get_retrievability(card, lastReviewAt, false)),
      ),
    ),
  };
}

export function compareFsrsShadowDueCounts(
  records: readonly FsrsShadowRecord[],
  now: Date,
  horizonDays: number,
): FsrsDueCountComparison {
  if (!Number.isFinite(horizonDays) || horizonDays < 0) {
    throw new RangeError("horizonDays must be a non-negative finite number");
  }
  const start = requireDate(now).getTime();
  const end = start + horizonDays * DAY_MS;
  const within = (value: number) => value >= start && value <= end;
  const legacyDueCount = records.filter((record) =>
    within(record.comparison.legacyDueAt),
  ).length;
  const fsrsDueCount = records.filter((record) =>
    within(Date.parse(record.comparison.fsrsDueAt)),
  ).length;
  return {
    horizonDays,
    recordCount: records.length,
    legacyDueCount,
    fsrsDueCount,
    absoluteDueCountDelta: Math.abs(legacyDueCount - fsrsDueCount),
  };
}

/** Predict each later familiar-item review before observing that review's rating. */
export function evaluateFsrsShadowHistory(
  events: readonly Pick<
    FsrsShadowReviewEvent,
    "eventId" | "reviewedAt" | "rating"
  >[],
) {
  const ordered = [...events].sort(
    (a, b) =>
      Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt) ||
      a.eventId.localeCompare(b.eventId),
  );
  const scheduler = createScheduler(),
    seen = new Set<string>();
  let card: Card | null = null,
    previous = -Infinity;
  const predictions: {
    eventId: string;
    at: string;
    probability: number;
    outcome: 0 | 1;
    squaredError: number;
    logLoss: number;
  }[] = [];
  for (const event of ordered) {
    const at = requireDate(event.reviewedAt),
      stamp = at.getTime();
    if (
      !event.eventId.trim() ||
      seen.has(event.eventId) ||
      stamp <= previous ||
      ![1, 2, 3, 4].includes(event.rating)
    )
      throw Error("Invalid, repeated or simultaneous shadow review");
    seen.add(event.eventId);
    previous = stamp;
    if (card) {
      const probability = Math.max(
          0,
          Math.min(1, scheduler.get_retrievability(card, at, false)),
        ),
        outcome = event.rating === 1 ? 0 : 1;
      if (!Number.isFinite(probability))
        throw Error("Invalid FSRS recall prediction");
      const bounded = Math.max(1e-15, Math.min(1 - 1e-15, probability));
      predictions.push({
        eventId: event.eventId,
        at: at.toISOString(),
        probability,
        outcome,
        squaredError: (probability - outcome) ** 2,
        logLoss: -(
          outcome * Math.log(bounded) +
          (1 - outcome) * Math.log(1 - bounded)
        ),
      });
    }
    card = scheduler.next(
      card ?? createEmptyCard(at),
      at,
      toGrade(event.rating),
    ).card;
  }
  return {
    algorithm: FSRS_SHADOW_ALGORITHM,
    predictions,
    predictedBeforeOutcome: true as const,
    learnerScheduleApplied: false as const,
    learnerBenefitEstablished: false as const,
    brierScore: predictions.length
      ? predictions.reduce((sum, row) => sum + row.squaredError, 0) /
        predictions.length
      : null,
    logLoss: predictions.length
      ? predictions.reduce((sum, row) => sum + row.logLoss, 0) /
        predictions.length
      : null,
  };
}

export function fsrsShadowRatingFromResult(
  successful: boolean,
  confidence: "hard" | "good" | "easy" = "good",
): FsrsShadowReviewEvent["rating"] {
  if (!successful) return 1;
  if (confidence === "hard") return 2;
  if (confidence === "easy") return 4;
  return 3;
}
