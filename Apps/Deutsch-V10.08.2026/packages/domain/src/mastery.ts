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

export type MasteryAttemptCounts = Readonly<Record<MasteryMode, number>>;

export const EMPTY_MASTERY_ATTEMPT_COUNTS: MasteryAttemptCounts = {
  recognition: 0,
  writing: 0,
  speaking: 0,
  repair: 0,
  transfer: 0,
};

export interface MasteryRecord {
  readonly status: MasteryStatus;
  readonly scores: MasteryScores;
  readonly successfulReviews: number;
  readonly activeCriticalErrors: number;
  readonly responseLatenciesMs: readonly number[];
  /**
   * Same rolling-last-10 shape as responseLatenciesMs, but only ever
   * receives writing/transfer latencies -- composing an original sentence
   * realistically takes far longer than the ~8s recall speed
   * responseLatenciesMs gates on. Before this field existed, saveWriting's
   * latencyMs was pushed into responseLatenciesMs itself: a single verified
   * writing attempt (routinely 30-90s to compose) could push the pooled
   * median above AUTOMATICITY_LATENCY_THRESHOLD_MS and silently block
   * "automatic" status on recognition/speaking speed alone. See
   * WRITING_LATENCY_THRESHOLD_MS below; mirrors English's
   * medianWritingLatencyMs / WRITING_LATENCY_THRESHOLD_MS in app-store.tsx.
   */
  readonly writingLatenciesMs: readonly number[];
  /**
   * How many verified attempts have been recorded per mode. Gates
   * "automatic"/"stable" status so a single lucky attempt cannot reach
   * them -- mirrors English's MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC.
   */
  readonly attemptCounts: MasteryAttemptCounts;
  readonly completedAt?: number;
  readonly lastSuccessAt?: number;
  /**
   * True once at least one verified mode:"transfer" attempt has been
   * recorded from the delayed-review flow (review-center.tsx's
   * TRANSFER_CHECKPOINT_STAGE), as opposed to only the same-session
   * Grammatik-Labor transfer step. Before this field existed,
   * "automatic" status only required attemptCounts.transfer >= 3 with no
   * check on *where* those attempts came from -- review-center.tsx never
   * tagged its transfer-checkpoint attempts with mode:"transfer" at all
   * (see the mode computation in checkReview(), fixed alongside this
   * field), so a learner could reach "automatic" from same-session bursts
   * of activity alone, never having demonstrated the pattern again after a
   * real delay in a genuinely new context. Monotonic like controlled/free/
   * spoken -- once real delayed-transfer evidence exists it is never
   * un-earned by later attempts.
   */
  readonly hasDelayedTransferEvidence: boolean;
  /**
   * Legacy compatibility flags. They remain readable during the v20.8
   * migration but never grant the new `automatic` status by themselves.
   */
  readonly controlled: boolean;
  readonly free: boolean;
  readonly spoken?: boolean;
  /**
   * Three-stage timed-practice model for controlled practice (Grammatik-
   * Labor step 1): 1 = untimed accuracy, 2 = light timing (~8-10s/item),
   * 3 = real-time production (~3-5s/item). Set directly via setMastery() in
   * automaticity-lab.tsx's checkPractice() after each round -- independent
   * of recordVerifiedMasteryAttempt's verified-only gate, since a stage
   * regression must be able to fire on an unverified (wrong-answer) round
   * too. Mirrors English's TopicMastery.practiceStage.
   */
  readonly practiceStage: 1 | 2 | 3;
}

export interface MasteryAttempt {
  readonly mode: MasteryMode;
  readonly accuracyScore: number;
  readonly targetHit: boolean;
  readonly latencyMs?: number;
  readonly createdAt?: number;
  /** True only for a mode:"transfer" attempt recorded by the delayed-review
   * flow (review-center.tsx) rather than a same-session Mission step. Feeds
   * MasteryRecord.hasDelayedTransferEvidence. */
  readonly fromDueReview?: boolean;
}

export const AUTOMATICITY_LATENCY_THRESHOLD_MS = 8_000;

// Deliberately more generous than the recall-speed threshold above --
// composing several original sentences is not a quick-recall task. Mirrors
// English's WRITING_LATENCY_THRESHOLD_MS (app-store.tsx) exactly, so the
// same real-world writing pace is required in both apps.
export const WRITING_LATENCY_THRESHOLD_MS = 90_000;

// Three-stage timed-practice model. Stage 1 is untimed (target >=90%
// accuracy). Stage 2 gives a light per-item time budget (~8-10s/item; the
// roadmap's number, 9s used as the midpoint by the UI) at >=85%. Stage 3
// gives a real-time budget (~3-5s/item; 4s midpoint); the roadmap states this
// stage's bar as "accurate responses without long hesitation" rather than a
// number -- 85% is reused here as the nearest defensible reading, called out
// explicitly rather than silently assumed. Mirrors English's
// STAGE_TARGET_ACCURACY / STAGE_REGRESSION_MARGIN in automaticity-screen.tsx.
export const PRACTICE_STAGE_TARGET_ACCURACY: Readonly<
  Record<1 | 2 | 3, number>
> = {
  1: 90,
  2: 85,
  3: 85,
};
// A regression needs to be a clear collapse, not routine variance between
// rounds -- 20 points below target is the line.
export const PRACTICE_STAGE_REGRESSION_MARGIN = 20;

/**
 * Pure stage-transition rule for the timed-practice model. An open-book
 * round (rule visible) is real practice but not retrieval evidence -- see
 * `verified` at the recordAttempt call site in automaticity-lab.tsx -- so it
 * must never move the timing gate either way.
 */
export function nextPracticeStage(
  currentStage: 1 | 2 | 3,
  scorePercent: number,
  openBook: boolean,
): 1 | 2 | 3 {
  if (openBook) return currentStage;
  const target = PRACTICE_STAGE_TARGET_ACCURACY[currentStage];
  if (scorePercent >= target && currentStage < 3) {
    return (currentStage + 1) as 1 | 2 | 3;
  }
  if (
    scorePercent < target - PRACTICE_STAGE_REGRESSION_MARGIN &&
    currentStage > 1
  ) {
    return (currentStage - 1) as 1 | 2 | 3;
  }
  return currentStage;
}

const SCORE_THRESHOLDS = {
  recognition: 85,
  writing: 80,
  speaking: 80,
  repair: 80,
  transfer: 75,
} as const;

// A single lucky attempt in a mode used to be able to set that mode's score
// straight to a passing value (recordMasteryAttempt has no smoothing on the
// very first attempt) and, combined with two spaced reviews, reach
// "automatic" off essentially one real practice event per mode. Requiring
// this many verified attempts per mode before "automatic"/"stable" can be
// reached closes that gap -- matches English's
// MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC.
const MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS = 3;

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
  attemptCounts: MasteryAttemptCounts = EMPTY_MASTERY_ATTEMPT_COUNTS,
  writingLatenciesMs: readonly number[] = [],
  hasDelayedTransferEvidence = false,
): MasteryStatus {
  const latency = median(responseLatenciesMs);
  // No measured writing/transfer latency yet (writingLatenciesMs empty)
  // must not default to "fast enough" -- a topic that has never had a timed
  // writing attempt has not demonstrated writing speed, the same policy
  // English's hasFastEnoughWriting already applies.
  const writingLatency = median(writingLatenciesMs);
  const hasFastEnoughWriting =
    writingLatency !== null && writingLatency <= WRITING_LATENCY_THRESHOLD_MS;
  const allAutomaticThresholdsMet =
    scores.recognition >= SCORE_THRESHOLDS.recognition &&
    scores.writing >= SCORE_THRESHOLDS.writing &&
    scores.speaking >= SCORE_THRESHOLDS.speaking &&
    scores.repair >= SCORE_THRESHOLDS.repair &&
    scores.transfer >= SCORE_THRESHOLDS.transfer;
  const allAutomaticAttemptsMet =
    attemptCounts.recognition >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.writing >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.speaking >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.repair >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.transfer >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS;

  if (
    allAutomaticThresholdsMet &&
    allAutomaticAttemptsMet &&
    successfulReviews >= 2 &&
    activeCriticalErrors === 0 &&
    latency !== null &&
    latency <= AUTOMATICITY_LATENCY_THRESHOLD_MS &&
    hasFastEnoughWriting &&
    hasDelayedTransferEvidence
  ) {
    return "automatic";
  }

  if (
    scores.writing >= SCORE_THRESHOLDS.writing &&
    scores.speaking >= SCORE_THRESHOLDS.speaking &&
    scores.transfer >= SCORE_THRESHOLDS.transfer &&
    attemptCounts.writing >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.speaking >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
    attemptCounts.transfer >= MINIMUM_ATTEMPTS_FOR_ADVANCED_STATUS &&
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
    writingLatenciesMs: [],
    attemptCounts: EMPTY_MASTERY_ATTEMPT_COUNTS,
    controlled: false,
    free: false,
    practiceStage: 1,
    hasDelayedTransferEvidence: false,
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
      record.attemptCounts,
      record.writingLatenciesMs,
      record.hasDelayedTransferEvidence,
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
  // Writing/transfer latency goes into its own pool (writingLatenciesMs,
  // gated at WRITING_LATENCY_THRESHOLD_MS) instead of the fast-recall pool
  // below -- composing a sentence and recalling a form are different speed
  // claims, and mixing them let one slow writing attempt block "automatic"
  // on recognition/speaking speed alone.
  const isWritingLatency =
    attempt.mode === "writing" || attempt.mode === "transfer";
  const roundedLatency =
    attempt.latencyMs === undefined
      ? undefined
      : Math.max(0, Math.round(attempt.latencyMs));
  const latencies =
    roundedLatency === undefined || isWritingLatency
      ? record.responseLatenciesMs
      : [...record.responseLatenciesMs, roundedLatency].slice(-10);
  const writingLatencies =
    roundedLatency === undefined || !isWritingLatency
      ? record.writingLatenciesMs
      : [...record.writingLatenciesMs, roundedLatency].slice(-10);

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
    attemptCounts: {
      ...record.attemptCounts,
      [attempt.mode]: (record.attemptCounts[attempt.mode] ?? 0) + 1,
    },
    responseLatenciesMs: latencies,
    writingLatenciesMs: writingLatencies,
    controlled:
      record.controlled ||
      (attempt.mode === "recognition" && attempt.targetHit),
    free:
      record.free ||
      (attempt.mode === "writing" && attempt.targetHit) ||
      (attempt.mode === "transfer" && attempt.targetHit),
    hasDelayedTransferEvidence:
      record.hasDelayedTransferEvidence ||
      (attempt.mode === "transfer" &&
        attempt.targetHit &&
        attempt.fromDueReview === true),
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

export interface VerifiableMasteryAttempt extends MasteryAttempt {
  /**
   * Whether the underlying evaluation was actually confirmed correct (e.g.
   * the online LanguageTool check succeeded) rather than a best-effort
   * offline fallback or self-report. Only verified attempts may progress
   * mastery toward "stable"/"automatic" status.
   */
  readonly verified: boolean;
}

/**
 * Applies a mastery attempt only when its evaluation was verified. This is
 * the single gate that decides whether practice counts toward the
 * "Automaticity" mission: offline fallbacks and unverified self-reports
 * still let the learner practice, but they must not silently advance
 * mastery scores or unlock "stable"/"automatic" status. Unverified attempts
 * leave the record unchanged (practice happens, nothing is graded).
 */
export function recordVerifiedMasteryAttempt(
  current: MasteryRecord | undefined,
  attempt: VerifiableMasteryAttempt,
): MasteryRecord | undefined {
  if (!attempt.verified) {
    return current;
  }
  return recordMasteryAttempt(current, attempt);
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
  automatic: "Automatisiert",
};
