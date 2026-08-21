import type { ReadinessSignals } from "./types";

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Estimates practice readiness, not language ability or a medical state.
 * The bounded score is suitable for shadow calibration and plan weighting only.
 */
export function computeReadiness(signals: ReadinessSignals): number {
  const completion = clamp(signals.completionRate7d, 0, 1);
  const daysSinceLastSession = clamp(signals.daysSinceLastSession, 0, 365);
  const backlog = clamp(signals.srsReviewBacklog, 0, 10_000);
  const streak = clamp(signals.currentPracticeStreak, 0, 365);

  const recency = Math.max(0, 1 - daysSinceLastSession / 14);
  const backlogCapacity = 1 / (1 + backlog / 20);
  const durationFit =
    signals.planDuration === 15 ? 1 : signals.planDuration === 30 ? 0.9 : 0.8;
  const streakSupport = Math.min(1, streak / 14);

  const evidence =
    completion * 0.45 +
    recency * 0.25 +
    backlogCapacity * 0.15 +
    durationFit * 0.1 +
    streakSupport * 0.05;

  return round(clamp(0.15 + evidence * 0.85, 0.15, 1));
}
