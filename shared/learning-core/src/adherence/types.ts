export type PlanDuration = 15 | 30 | 45;

export type AdherenceBlockId =
  | "grammar"
  | "mixed_practice"
  | "conversation_studio"
  | "review"
  | "automatization";

export interface ReadinessSignals {
  readonly completionRate7d: number;
  readonly daysSinceLastSession: number;
  readonly srsReviewBacklog: number;
  readonly planDuration: PlanDuration;
  readonly currentPracticeStreak: number;
}

export interface BlockWeightAdjustment {
  readonly grammar: number;
  readonly mixed_practice: number;
  readonly conversation_studio: number;
  readonly review: number;
  readonly automatization: number;
}

export interface StreakStateV1 {
  readonly totalActiveDays: number;
  readonly currentPracticeStreak: number;
  /** Required to distinguish a real comeback from a second session today. */
  readonly lastPracticeDate: string | null;
  readonly continuityProtectedUntil: string | null;
  readonly comebackStartedAt: string | null;
  readonly longestComebackStreak: number;
  readonly freezesUsedThisMonth: number;
  readonly freezeMonthKey: string;
}

export type ImplementationIntentionTrigger =
  "time" | "after_event" | "context" | "feeling";

export type ImplementationIntentionAction =
  "full_session" | "review_only" | "booster" | "skip_ok";

export interface ImplementationIntention {
  readonly id: string;
  readonly trigger: ImplementationIntentionTrigger;
  readonly triggerLabel: string;
  readonly action: ImplementationIntentionAction;
  readonly active: boolean;
}

export interface ImplementationIntentionSignal {
  readonly trigger: ImplementationIntentionTrigger;
  /**
   * A local, learner-supplied value. For time triggers this must be HH:MM;
   * other trigger types use a normalized exact label match.
   */
  readonly triggerLabel: string;
}

export type ImplementationIntentionValidationCode =
  "valid" | "active-count" | "duplicate-id" | "invalid-id" | "invalid-label";

export interface ImplementationIntentionValidation {
  readonly valid: boolean;
  readonly code: ImplementationIntentionValidationCode;
  readonly activeCount: number;
}

export interface AdherenceProfileV1 {
  readonly version: 1;
  readonly updatedAt: string;
  readonly streak: StreakStateV1;
  readonly intentions: readonly ImplementationIntention[];
  readonly nudgeOptIn: boolean;
}

export type NudgeGuardCode =
  | "eligible"
  | "ineligible-trigger"
  | "trigger-cooldown"
  | "quiet-hours"
  | "low-readiness"
  | "review-backlog-cap"
  | "opted-out"
  | "daily-cap"
  | "weekly-cap";

export type NudgeEventType = "evaluated" | "shown" | "accepted" | "dismissed";

export interface NudgeEventV1 {
  readonly version: 1;
  readonly id: string;
  readonly type: NudgeEventType;
  readonly triggerId: string;
  readonly occurredAt: string;
  readonly localDate: string;
  readonly localWeek: string;
  readonly decision: NudgeGuardCode;
  readonly engagementOnly: true;
  readonly learningOutcome: "not-evaluated";
}

export interface NudgePolicy {
  readonly eligibleWindowMinutes: number;
  readonly perTriggerCooldownHours: number;
  readonly quietHoursStartMinute: number;
  readonly quietHoursEndMinute: number;
  readonly minimumReadiness: number;
  readonly reviewBacklogCap: number;
  readonly dailyCap: number;
  readonly weeklyCap: number;
}

export interface NudgeEvaluationInput {
  readonly trigger: ImplementationIntention | null;
  readonly now: Date | string;
  readonly timeZone: string;
  readonly readiness: number;
  readonly reviewBacklog: number;
  readonly optedIn: boolean;
  readonly history: readonly NudgeEventV1[];
  readonly policy?: NudgePolicy;
}

export interface NudgeEvaluation {
  readonly eligible: boolean;
  readonly code: NudgeGuardCode;
  readonly triggerId: string | null;
  readonly evaluatedAt: string;
  readonly learningOutcome: "not-evaluated";
}

export interface ShadowEntry {
  readonly date: string;
  readonly planDuration: PlanDuration;
  readonly readiness: number;
  readonly predictedCompletion: boolean;
  readonly actualCompletion: boolean;
  readonly blockWeights: BlockWeightAdjustment;
}

export interface AdherenceMigrationOptions {
  readonly now: Date | string;
  readonly timeZone: string;
  /** Real session dates, normally read from the existing SessionRecord ledger. */
  readonly sessionDates?: readonly string[];
}

export interface AdherenceFeatureFlags {
  readonly adherence_v1_shadow?: boolean;
}

export interface AdherenceBlockMinutes {
  readonly grammar: number;
  readonly mixed_practice: number;
  readonly conversation_studio: number;
  readonly review: number;
  readonly automatization: number;
}

export interface AdherenceCurrentPlan {
  readonly planDuration: PlanDuration;
  readonly blockMinutes: AdherenceBlockMinutes;
}

export interface AdherenceShadowInput {
  readonly flags: AdherenceFeatureFlags;
  readonly currentPlan: AdherenceCurrentPlan;
  readonly readinessSignals: ReadinessSignals;
}

export type AdherenceShadowStatus =
  "disabled" | "computed" | "invalid-current-plan";

/**
 * A comparison-only result. It cannot represent a learner-visible plan change,
 * a persistence operation, or evidence of a learning outcome.
 */
export interface AdherenceShadowResult {
  readonly status: AdherenceShadowStatus;
  readonly featureFlagEnabled: boolean;
  readonly currentPlan: AdherenceCurrentPlan;
  readonly proposedPlan: AdherenceCurrentPlan | null;
  readonly readiness: number | null;
  readonly engagementPrediction: "less-likely" | "more-likely" | null;
  readonly appliedToLearnerPlan: false;
  readonly persisted: false;
  readonly learningOutcome: "not-evaluated";
}

export interface AdherenceKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
