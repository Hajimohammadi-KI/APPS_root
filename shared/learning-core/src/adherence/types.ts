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

export interface AdherenceProfileV1 {
  readonly version: 1;
  readonly updatedAt: string;
  readonly streak: StreakStateV1;
  readonly intentions: readonly ImplementationIntention[];
  readonly nudgeOptIn: boolean;
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

export interface AdherenceKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
