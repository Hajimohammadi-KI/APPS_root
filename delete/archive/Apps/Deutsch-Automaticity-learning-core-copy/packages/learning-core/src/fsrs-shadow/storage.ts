import {
  FSRS_SHADOW_ALGORITHM,
  assessLegacyReviewMigration,
  replayFsrsShadowEvents,
} from "./scheduler";
import type {
  FsrsShadowFeatureFlags,
  FsrsShadowRecord,
  FsrsShadowReviewEvent,
  RecordFsrsShadowReviewInput,
  RecordFsrsShadowReviewResult,
} from "./types";

export const FSRS_SHADOW_FLAG = "fsrs_shadow_v1" as const;
export const AUTOMATICITY_FEATURE_FLAGS_STORAGE_KEY =
  "automaticity-feature-flags-v1" as const;
export const FSRS_SHADOW_STORAGE_KEY = "automaticity-fsrs-shadow-v1" as const;
export const MAX_FSRS_SHADOW_RECORDS = 500;
export const MAX_FSRS_EVENTS_PER_REVIEW = 128;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLegacyScheduleSnapshot(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.dueAt === "number" &&
    Number.isFinite(value.dueAt) &&
    typeof value.state === "string" &&
    value.state.length > 0 &&
    typeof value.successStreak === "number" &&
    Number.isFinite(value.successStreak) &&
    value.successStreak >= 0 &&
    typeof value.stabilityScore === "number" &&
    Number.isFinite(value.stabilityScore) &&
    value.stabilityScore >= 0 &&
    value.stabilityScore <= 100 &&
    (value.lastSuccessAt === undefined ||
      (typeof value.lastSuccessAt === "number" &&
        Number.isFinite(value.lastSuccessAt)))
  );
}

function isEvent(value: unknown): value is FsrsShadowReviewEvent {
  if (!isRecord(value)) return false;
  return (
    value.version === 1 &&
    typeof value.eventId === "string" &&
    value.eventId.length > 0 &&
    (value.language === "en" || value.language === "de") &&
    typeof value.reviewId === "string" &&
    value.reviewId.length > 0 &&
    typeof value.sourceId === "string" &&
    value.sourceId.length > 0 &&
    typeof value.reviewedAt === "string" &&
    Number.isFinite(Date.parse(value.reviewedAt)) &&
    (value.rating === 1 ||
      value.rating === 2 ||
      value.rating === 3 ||
      value.rating === 4) &&
    isLegacyScheduleSnapshot(value.legacyBefore) &&
    isLegacyScheduleSnapshot(value.legacyAfter)
  );
}

function isShadowRecord(value: unknown): value is FsrsShadowRecord {
  if (!isRecord(value)) return false;
  const events = value.events;
  const algorithm = value.algorithm;
  const candidate = value.candidate;
  const comparison = value.comparison;
  return (
    value.version === 1 &&
    isRecord(algorithm) &&
    algorithm.package === FSRS_SHADOW_ALGORITHM.package &&
    algorithm.packageVersion === FSRS_SHADOW_ALGORITHM.packageVersion &&
    algorithm.algorithmVersion === FSRS_SHADOW_ALGORITHM.algorithmVersion &&
    typeof value.reviewId === "string" &&
    typeof value.sourceId === "string" &&
    (value.language === "en" || value.language === "de") &&
    value.cardId === `${value.language}:${value.sourceId}` &&
    typeof value.startedAt === "string" &&
    Number.isFinite(Date.parse(value.startedAt)) &&
    typeof value.updatedAt === "string" &&
    Number.isFinite(Date.parse(value.updatedAt)) &&
    Array.isArray(events) &&
    events.length > 0 &&
    events.length <= MAX_FSRS_EVENTS_PER_REVIEW &&
    events.every(
      (event) =>
        isEvent(event) &&
        event.language === value.language &&
        event.sourceId === value.sourceId,
    ) &&
    isRecord(candidate) &&
    typeof candidate.dueAt === "string" &&
    Number.isFinite(Date.parse(candidate.dueAt)) &&
    typeof candidate.scheduledDays === "number" &&
    Number.isFinite(candidate.scheduledDays) &&
    isRecord(comparison) &&
    typeof comparison.legacyDueAt === "number" &&
    Number.isFinite(comparison.legacyDueAt) &&
    typeof comparison.fsrsDueAt === "string" &&
    Number.isFinite(Date.parse(comparison.fsrsDueAt)) &&
    value.learnerScheduleApplied === false &&
    value.rolloutEligible === false &&
    value.learningOutcome === "not-evaluated"
  );
}

export function readFsrsShadowFeatureFlags(
  storage: Pick<Storage, "getItem">,
  key: string = AUTOMATICITY_FEATURE_FLAGS_STORAGE_KEY,
): Required<FsrsShadowFeatureFlags> {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "{}");
    return {
      fsrs_shadow_v1: isRecord(parsed) && parsed.fsrs_shadow_v1 === true,
    };
  } catch {
    return { fsrs_shadow_v1: false };
  }
}

export function readFsrsShadowRecords(
  storage: Pick<Storage, "getItem">,
  key: string = FSRS_SHADOW_STORAGE_KEY,
): readonly FsrsShadowRecord[] {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isShadowRecord).slice(-MAX_FSRS_SHADOW_RECORDS);
  } catch {
    return [];
  }
}

export function clearFsrsShadowRecords(
  storage: Pick<Storage, "removeItem">,
  key: string = FSRS_SHADOW_STORAGE_KEY,
): void {
  storage.removeItem(key);
}

export function recordFsrsShadowReview(
  input: RecordFsrsShadowReviewInput,
): RecordFsrsShadowReviewResult {
  const flags = readFsrsShadowFeatureFlags(
    input.storage,
    input.featureFlagStorageKey,
  );
  if (!flags.fsrs_shadow_v1) {
    return { status: "disabled", persisted: false, record: null };
  }
  if (!isEvent(input.event)) {
    return { status: "invalid-event", persisted: false, record: null };
  }

  const records = [
    ...readFsrsShadowRecords(input.storage, input.shadowStorageKey),
  ];
  const cardId = `${input.event.language}:${input.event.sourceId}`;
  const existingIndex = records.findIndex((record) => record.cardId === cardId);
  const existing = existingIndex >= 0 ? (records[existingIndex] ?? null) : null;
  if (existing?.events.some((event) => event.eventId === input.event.eventId)) {
    return { status: "duplicate", persisted: true, record: existing };
  }

  if (
    (!existing && records.length >= MAX_FSRS_SHADOW_RECORDS) ||
    (existing?.events.length ?? 0) >= MAX_FSRS_EVENTS_PER_REVIEW
  ) {
    return {
      status: "capacity-reached",
      persisted: false,
      record: existing,
    };
  }

  const events = [...(existing?.events ?? []), input.event].sort(
    (left, right) =>
      Date.parse(left.reviewedAt) - Date.parse(right.reviewedAt) ||
      left.eventId.localeCompare(right.eventId),
  );
  const candidate = replayFsrsShadowEvents(events);
  const firstEvent = events[0];
  if (!firstEvent)
    throw new RangeError("At least one review event is required");
  const legacyDueAt = input.event.legacyAfter.dueAt;
  const updated: FsrsShadowRecord = {
    version: 1,
    algorithm: FSRS_SHADOW_ALGORITHM,
    language: input.event.language,
    cardId,
    reviewId: input.event.reviewId,
    sourceId: input.event.sourceId,
    startedAt: existing?.startedAt ?? firstEvent.reviewedAt,
    updatedAt: input.event.reviewedAt,
    historyOrigin: "prospective-after-opt-in",
    legacyMigration:
      existing?.legacyMigration ??
      assessLegacyReviewMigration(input.event.legacyBefore),
    events,
    candidate,
    comparison: {
      legacyDueAt,
      fsrsDueAt: candidate.dueAt,
      deltaDays: Number(
        ((Date.parse(candidate.dueAt) - legacyDueAt) / 86_400_000).toFixed(4),
      ),
    },
    learnerScheduleApplied: false,
    rolloutEligible: false,
    learningOutcome: "not-evaluated",
  };
  if (existingIndex >= 0) records.splice(existingIndex, 1);
  records.push(updated);
  try {
    input.storage.setItem(
      input.shadowStorageKey ?? FSRS_SHADOW_STORAGE_KEY,
      JSON.stringify(records.slice(-MAX_FSRS_SHADOW_RECORDS)),
    );
  } catch {
    return { status: "storage-unavailable", persisted: false, record: updated };
  }
  return { status: "recorded", persisted: true, record: updated };
}
