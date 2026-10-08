import type { BlockWeightAdjustment, PlanDuration } from "./types";

const RECOVERY_WEIGHTS: readonly [number, number, number, number, number] = [
  0.1, 0.16, 0.2, 0.34, 0.2,
];

const STANDARD_WEIGHTS: Record<
  PlanDuration,
  readonly [number, number, number, number, number]
> = {
  15: [0.2, 0.2, 4 / 15, 2 / 15, 0.2],
  30: [0.2, 0.2, 4 / 15, 2 / 15, 0.2],
  45: [0.2, 2 / 9, 4 / 15, 1 / 9, 0.2],
};

function clampReadiness(value: number): number {
  if (!Number.isFinite(value)) return 0.15;
  return Math.min(1, Math.max(0.15, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Reweights the existing five blocks. It does not add, remove, or rename a
 * block, which keeps the first shadow rollout compatible with both apps.
 */
export function computeBlockWeights(
  readiness: number,
  planDuration: PlanDuration,
): BlockWeightAdjustment {
  const standard = STANDARD_WEIGHTS[planDuration];
  const interpolation = (clampReadiness(readiness) - 0.15) / 0.85;
  const values = RECOVERY_WEIGHTS.map((recovery, index) =>
    round(recovery + (standard[index]! - recovery) * interpolation),
  );

  // Assign the rounding residual to the final block so the public invariant
  // remains exact to six decimal places.
  values[4] = round(
    1 - values.slice(0, 4).reduce((sum, value) => sum + value, 0),
  );

  return {
    grammar: values[0]!,
    mixed_practice: values[1]!,
    conversation_studio: values[2]!,
    review: values[3]!,
    automatization: values[4]!,
  };
}
