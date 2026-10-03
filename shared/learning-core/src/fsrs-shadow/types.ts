export type FsrsShadowLanguage = "en" | "de";
export type FsrsShadowRating = 1 | 2 | 3 | 4;

export interface FsrsShadowFeatureFlags {
  readonly fsrs_shadow_v1?: boolean;
}

export interface LegacyReviewScheduleSnapshot {
  readonly dueAt: number;
  readonly state: string;
  readonly successStreak: number;
  readonly stabilityScore: number;
  readonly lastSuccessAt?: number;
}

export interface FsrsShadowReviewEvent {
  readonly version: 1;
  readonly eventId: string;
  readonly language: FsrsShadowLanguage;
  readonly reviewId: string;
  readonly sourceId: string;
  readonly reviewedAt: string;
  readonly rating: FsrsShadowRating;
  readonly legacyBefore: LegacyReviewScheduleSnapshot;
  readonly legacyAfter: LegacyReviewScheduleSnapshot;
}

export interface FsrsCandidateSchedule {
  readonly dueAt: string;
  readonly scheduledDays: number;
  readonly stability: number;
  readonly difficulty: number;
  readonly retrievability: number;
}

export interface LegacyMigrationAssessment {
  readonly historyCompleteness: "none" | "aggregate-only";
  readonly seedEligible: false;
  readonly missingFields: readonly string[];
  readonly reason: string;
}

export interface FsrsShadowComparison {
  readonly legacyDueAt: number;
  readonly fsrsDueAt: string;
  readonly deltaDays: number;
}

export interface FsrsShadowRecord {
  readonly version: 1;
  readonly algorithm: typeof import("./scheduler").FSRS_SHADOW_ALGORITHM;
  readonly language: FsrsShadowLanguage;
  readonly cardId: string;
  readonly reviewId: string;
  readonly sourceId: string;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly historyOrigin: "prospective-after-opt-in";
  readonly legacyMigration: LegacyMigrationAssessment;
  readonly events: readonly FsrsShadowReviewEvent[];
  readonly candidate: FsrsCandidateSchedule;
  readonly comparison: FsrsShadowComparison;
  readonly learnerScheduleApplied: false;
  readonly rolloutEligible: false;
  readonly learningOutcome: "not-evaluated";
}

export interface RecordFsrsShadowReviewInput {
  readonly storage: Pick<Storage, "getItem" | "setItem">;
  readonly event: FsrsShadowReviewEvent;
  readonly featureFlagStorageKey?: string;
  readonly shadowStorageKey?: string;
}

export type RecordFsrsShadowReviewResult =
  | {
      readonly status: "disabled";
      readonly persisted: false;
      readonly record: null;
    }
  | {
      readonly status: "invalid-event";
      readonly persisted: false;
      readonly record: null;
    }
  | {
      readonly status: "storage-unavailable";
      readonly persisted: false;
      readonly record: FsrsShadowRecord;
    }
  | {
      readonly status: "capacity-reached";
      readonly persisted: false;
      readonly record: FsrsShadowRecord | null;
    }
  | {
      readonly status: "recorded" | "duplicate";
      readonly persisted: true;
      readonly record: FsrsShadowRecord;
    };

export interface FsrsDueCountComparison {
  readonly horizonDays: number;
  readonly recordCount: number;
  readonly legacyDueCount: number;
  readonly fsrsDueCount: number;
  readonly absoluteDueCountDelta: number;
}
