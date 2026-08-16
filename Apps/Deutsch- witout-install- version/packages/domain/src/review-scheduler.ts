const DAY_IN_MILLISECONDS = 86_400_000;

export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_IN_MILLISECONDS);
}

export function getReviewSchedule(completedAt: Date): readonly Date[] {
  return REVIEW_INTERVAL_DAYS.map((days) => addUtcDays(completedAt, days));
}

export function getNextReviewDate(
  completedAt: Date,
  completedReviews: number,
): Date | null {
  const interval = REVIEW_INTERVAL_DAYS[completedReviews];

  return interval === undefined ? null : addUtcDays(completedAt, interval);
}

export interface ReviewProgress {
  readonly stage: number;
  readonly dueAt: Date | null;
}

export type ReviewConfidence = "hard" | "good" | "easy";

export function getReviewProgressAfterResult(
  completedReviews: number,
  successful: boolean,
  now = new Date(),
  confidence: ReviewConfidence = "good",
): ReviewProgress {
  const successfulAdvance =
    confidence === "easy" ? 2 : confidence === "hard" ? 0 : 1;
  const stage = successful
    ? Math.min(
        REVIEW_INTERVAL_DAYS.length,
        completedReviews + successfulAdvance,
      )
    : Math.max(0, completedReviews - 1);
  return {
    stage,
    dueAt: getNextReviewDate(now, stage),
  };
}
