import { isAdherenceShadowEnabled } from "./feature-flags";
import { computeBlockWeights } from "./plan-adjustment";
import { computeReadiness } from "./readiness";
import type {
  AdherenceBlockMinutes,
  AdherenceCurrentPlan,
  AdherenceShadowInput,
  AdherenceShadowResult,
  BlockWeightAdjustment,
} from "./types";

const BLOCK_IDS = [
  "grammar",
  "mixed_practice",
  "conversation_studio",
  "review",
  "automatization",
] as const;

function copyPlan(plan: AdherenceCurrentPlan): AdherenceCurrentPlan {
  return {
    planDuration: plan.planDuration,
    blockMinutes: { ...plan.blockMinutes },
  };
}

function isValidCurrentPlan(plan: AdherenceCurrentPlan): boolean {
  const values = BLOCK_IDS.map((id) => plan.blockMinutes[id]);
  return (
    values.every(
      (value) =>
        Number.isInteger(value) && Number.isFinite(value) && value >= 0,
    ) && values.reduce((sum, value) => sum + value, 0) === plan.planDuration
  );
}

function allocateMinutes(
  planDuration: AdherenceCurrentPlan["planDuration"],
  weights: BlockWeightAdjustment,
): AdherenceBlockMinutes {
  const raw = BLOCK_IDS.map((id) => weights[id] * planDuration);
  const minutes = raw.map(Math.floor);
  let remaining = planDuration - minutes.reduce((sum, value) => sum + value, 0);
  const priority = raw
    .map((value, index) => ({ index, remainder: value - minutes[index]! }))
    .sort(
      (left, right) =>
        right.remainder - left.remainder || left.index - right.index,
    );

  for (const candidate of priority) {
    if (remaining <= 0) break;
    minutes[candidate.index]! += 1;
    remaining -= 1;
  }

  return {
    grammar: minutes[0]!,
    mixed_practice: minutes[1]!,
    conversation_studio: minutes[2]!,
    review: minutes[3]!,
    automatization: minutes[4]!,
  };
}

/**
 * Computes a proposal beside the current plan. This pure function never writes
 * storage and never applies its proposal to learner-visible state.
 */
export function runAdherenceShadow(
  input: AdherenceShadowInput,
): AdherenceShadowResult {
  const currentPlan = copyPlan(input.currentPlan);
  const enabled = isAdherenceShadowEnabled(input.flags);
  const boundary = {
    featureFlagEnabled: enabled,
    currentPlan,
    appliedToLearnerPlan: false as const,
    persisted: false as const,
    learningOutcome: "not-evaluated" as const,
  };

  if (!enabled) {
    return {
      ...boundary,
      status: "disabled",
      proposedPlan: null,
      readiness: null,
      engagementPrediction: null,
    };
  }

  if (
    input.readinessSignals.planDuration !== currentPlan.planDuration ||
    !isValidCurrentPlan(currentPlan)
  ) {
    return {
      ...boundary,
      status: "invalid-current-plan",
      proposedPlan: null,
      readiness: null,
      engagementPrediction: null,
    };
  }

  const readiness = computeReadiness(input.readinessSignals);
  return {
    ...boundary,
    status: "computed",
    proposedPlan: {
      planDuration: currentPlan.planDuration,
      blockMinutes: allocateMinutes(
        currentPlan.planDuration,
        computeBlockWeights(readiness, currentPlan.planDuration),
      ),
    },
    readiness,
    // This is an engagement hypothesis only. It is never a mastery signal.
    engagementPrediction: readiness >= 0.5 ? "more-likely" : "less-likely",
  };
}
