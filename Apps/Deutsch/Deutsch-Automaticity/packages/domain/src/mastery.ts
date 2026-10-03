export const MASTERY_STATUSES = [
  "new",
  "learning",
  "usable",
  "stable",
  "automatic",
] as const;

export type MasteryStatus = (typeof MASTERY_STATUSES)[number];

export const MASTERY_MODES = [
  "recognition",
  "writing",
  "speaking",
  "repair",
  "transfer",
] as const;

export type MasteryMode = (typeof MASTERY_MODES)[number];

export interface MasteryScores {
  readonly recognition: number;
  readonly writing: number;
  readonly speaking: number;
  readonly repair: number;
  readonly transfer: number;
  readonly automaticity: number;
}

export interface MasteryRecord {
  readonly status: MasteryStatus;
  readonly scores: MasteryScores;
  readonly successfulReviews: number;
  readonly activeCriticalErrors: number;
  readonly responseLatenciesMs: readonly number[];
  readonly completedAt?: number;
  readonly lastSuccessAt?: number;
  /**
   * Legacy compatibility flags. They remain readable during the v20.8
   * migration but never grant the new `automatic` status by themselves.
   */
  readonly controlled: boolean;
  readonly free: boolean;
  readonly spoken?: boolean;
}

export interface MasteryAttempt {
  readonly mode: MasteryMode;
  readonly accuracyScore: number;
  readonly targetHit: boolean;
  readonly latencyMs?: number;
  readonly createdAt?: number;
}

export const AUTOMATICITY_LATENCY_THRESHOLD_MS = 8_000;

const SCORE_THRESHOLDS = {
  recognition: 85,
  writing: 80,
  speaking: 80,
  repair: 80,
  transfer: 75,
} as const;

function clampScore(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle]!;
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + upper) / 2)
    : upper;
}

export function calculateAutomaticityScore(
  scores: Omit<MasteryScores, "automaticity">,
  successfulReviews: number,
  activeCriticalErrors: number,
  responseLatenciesMs: readonly number[],
): number {
  const skillScore =
    scores.recognition * 0.15 +
    scores.writing * 0.25 +
    scores.speaking * 0.25 +
    scores.repair * 0.2 +
    scores.transfer * 0.15;
  const reviewBonus = Math.min(10, successfulReviews * 5);
  const latency = median(responseLatenciesMs);
  const latencyAdjustment =
    latency === null
      ? 0
      : latency <= AUTOMATICITY_LATENCY_THRESHOLD_MS
        ? 5
        : -5;
  const errorPenalty = Math.min(25, activeCriticalErrors * 10);

  return clampScore(
    skillScore + reviewBonus + latencyAdjustment - errorPenalty,
  );
}

export function calculateMasteryStatus(
  scores: MasteryScores,
  successfulReviews: number,
  activeCriticalErrors: number,
  responseLatenciesMs: readonly number[],
): MasteryStatus {
  const latency = median(responseLatenciesMs);
  const allAutomaticThresholdsMet =
    scores.recognition >= SCORE_THRESHOLDS.recognition &&
    scores.writing >= SCORE_THRESHOLDS.writing &&
    scores.speaking >= SCORE_THRESHOLDS.speaking &&
    scores.repair >= SCORE_THRESHOLDS.repair &&
    scores.transfer >= SCORE_THRESHOLDS.transfer;

  if (
    allAutomaticThresholdsMet &&
    successfulReviews >= 2 &&
    activeCriticalErrors === 0 &&
    latency !== null &&
    latency <= AUTOMATICITY_LATENCY_THRESHOLD_MS
  ) {
    return "automatic";
  }

  if (
    scores.writing >= SCORE_THRESHOLDS.writing &&
    scores.speaking >= SCORE_THRESHOLDS.speaking &&
    scores.transfer >= SCORE_THRESHOLDS.transfer &&
    successfulReviews >= 1
  ) {
    return "stable";
  }

  if (
    scores.recognition >= 70 &&
    (scores.writing >= 70 || scores.speaking >= 70)
  ) {
    return "usable";
  }

  if (
    scores.recognition > 0 ||
    scores.writing > 0 ||
    scores.speaking > 0 ||
    scores.repair > 0 ||
    scores.transfer > 0
  ) {
    return "learning";
  }

  return "new";
}

export function createEmptyMasteryRecord(): MasteryRecord {
  return {
    status: "new",
    scores: {
      recognition: 0,
      writing: 0,
      speaking: 0,
      repair: 0,
      transfer: 0,
      automaticity: 0,
    },
    successfulReviews: 0,
    activeCriticalErrors: 0,
    responseLatenciesMs: [],
    controlled: false,
    free: false,
  };
}

function refreshMasteryRecord(
  record: Omit<MasteryRecord, "status" | "scores"> & {
    readonly scores: Omit<MasteryScores, "automaticity">;
  },
): MasteryRecord {
  const automaticity = calculateAutomaticityScore(
    record.scores,
    record.successfulReviews,
    record.activeCriticalErrors,
    record.responseLatenciesMs,
  );
  const scores = { ...record.scores, automaticity };

  return {
    ...record,
    scores,
    status: calculateMasteryStatus(
      scores,
      record.successfulReviews,
      record.activeCriticalErrors,
      record.responseLatenciesMs,
    ),
  };
}

export function recordMasteryAttempt(
  current: MasteryRecord | undefined,
  attempt: MasteryAttempt,
): MasteryRecord {
  const record = current ?? createEmptyMasteryRecord();
  const attemptedScore = clampScore(
    attempt.targetHit
      ? attempt.accuracyScore
      : Math.min(attempt.accuracyScore, 59),
  );
  const previousScore = record.scores[attempt.mode];
  const nextScore =
    previousScore === 0
      ? attemptedScore
      : clampScore(previousScore * 0.6 + attemptedScore * 0.4);
  const latencies =
    attempt.latencyMs === undefined
      ? record.responseLatenciesMs
      : [
          ...record.responseLatenciesMs,
          Math.max(0, Math.round(attempt.latencyMs)),
        ].slice(-10);

  return refreshMasteryRecord({
    ...record,
    scores: {
      recognition:
        attempt.mode === "recognition" ? nextScore : record.scores.recognition,
      writing: attempt.mode === "writing" ? nextScore : record.scores.writing,
      speaking:
        attempt.mode === "speaking" ? nextScore : record.scores.speaking,
      repair: attempt.mode === "repair" ? nextScore : record.scores.repair,
      transfer:
        attempt.mode === "transfer" ? nextScore : record.scores.transfer,
    },
    responseLatenciesMs: latencies,
    controlled:
      record.controlled ||
      (attempt.mode === "recognition" && attempt.targetHit),
    free:
      record.free ||
      (attempt.mode === "writing" && attempt.targetHit) ||
      (attempt.mode === "transfer" && attempt.targetHit),
    ...(record.spoken || attempt.mode === "speaking"
      ? { spoken: record.spoken || attempt.targetHit }
      : {}),
    ...(attempt.targetHit
      ? {
          lastSuccessAt: attempt.createdAt ?? Date.now(),
        }
      : {}),
  });
}

export function recordMasteryReview(
  current: MasteryRecord | undefined,
  successful: boolean,
): MasteryRecord {
  const record = current ?? createEmptyMasteryRecord();

  return refreshMasteryRecord({
    ...record,
    successfulReviews: successful
      ? record.successfulReviews + 1
      : Math.max(0, record.successfulReviews - 1),
    scores: {
      recognition: record.scores.recognition,
      writing: record.scores.writing,
      speaking: record.scores.speaking,
      repair: record.scores.repair,
      transfer: record.scores.transfer,
    },
    ...(successful ? { lastSuccessAt: Date.now() } : {}),
  });
}

export function setMasteryCriticalErrors(
  current: MasteryRecord | undefined,
  activeCriticalErrors: number,
): MasteryRecord {
  const record = current ?? createEmptyMasteryRecord();
  return refreshMasteryRecord({
    ...record,
    activeCriticalErrors: Math.max(0, Math.floor(activeCriticalErrors)),
    scores: {
      recognition: record.scores.recognition,
      writing: record.scores.writing,
      speaking: record.scores.speaking,
      repair: record.scores.repair,
      transfer: record.scores.transfer,
    },
  });
}

export const masteryStatusLabels: Readonly<Record<MasteryStatus, string>> = {
  new: "Neu",
  learning: "Im Aufbau",
  usable: "Anwendbar",
  stable: "Stabil",
  automatic: "Übungsschwelle erreicht",
};
