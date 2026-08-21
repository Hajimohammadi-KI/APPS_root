import {
  differenceInLocalDays,
  emptyStreakState,
  localDateKey,
  normalizeStreakState,
} from "./streak";
import type {
  AdherenceKeyValueStorage,
  AdherenceMigrationOptions,
  AdherenceProfileV1,
  ImplementationIntention,
  ShadowEntry,
  StreakStateV1,
} from "./types";

export const ADHERENCE_PROFILE_STORAGE_KEY = "adherence-core-v1" as const;
export const ADHERENCE_SHADOW_STORAGE_KEY = "adherence-core-shadow-v1" as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function asDateKey(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

function asIntentions(value: unknown): readonly ImplementationIntention[] {
  if (!Array.isArray(value)) return [];
  const intentions: ImplementationIntention[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate)) continue;
    const trigger = candidate.trigger;
    const action = candidate.action;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.triggerLabel !== "string" ||
      !(
        trigger === "time" ||
        trigger === "after_event" ||
        trigger === "context" ||
        trigger === "feeling"
      ) ||
      !(
        action === "full_session" ||
        action === "review_only" ||
        action === "booster" ||
        action === "skip_ok"
      ) ||
      typeof candidate.active !== "boolean"
    ) {
      continue;
    }
    intentions.push({
      id: candidate.id,
      trigger,
      triggerLabel: candidate.triggerLabel,
      action,
      active: candidate.active,
    });
  }
  return intentions.slice(0, 5);
}

function normalizeSessionDates(
  values: readonly string[],
  today: string,
): readonly string[] {
  return [
    ...new Set(values.filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))),
  ]
    .filter((value) => {
      const age = differenceInLocalDays(value, today);
      return age >= 0 && age <= 365;
    })
    .sort();
}

function streakFromSessionDates(
  sessionDates: readonly string[],
  today: string,
): Pick<
  StreakStateV1,
  "totalActiveDays" | "currentPracticeStreak" | "lastPracticeDate"
> {
  if (sessionDates.length === 0) {
    return {
      totalActiveDays: 0,
      currentPracticeStreak: 0,
      lastPracticeDate: null,
    };
  }
  const lastPracticeDate = sessionDates.at(-1)!;
  const daysSinceLastPractice = differenceInLocalDays(lastPracticeDate, today);
  let currentPracticeStreak = daysSinceLastPractice <= 1 ? 1 : 0;
  if (currentPracticeStreak > 0) {
    for (let index = sessionDates.length - 2; index >= 0; index -= 1) {
      const nextDate = sessionDates[index + 1]!;
      const date = sessionDates[index]!;
      if (differenceInLocalDays(date, nextDate) !== 1) break;
      currentPracticeStreak += 1;
    }
  }
  return {
    totalActiveDays: sessionDates.length,
    currentPracticeStreak,
    lastPracticeDate,
  };
}

function legacyStreak(row: Record<string, unknown>): Record<string, unknown> {
  return isRecord(row.streak) ? row.streak : row;
}

export function createDefaultAdherenceProfile(
  options: AdherenceMigrationOptions,
): AdherenceProfileV1 {
  const now = new Date(options.now);
  if (Number.isNaN(now.getTime())) throw new RangeError("now must be valid");
  return {
    version: 1,
    updatedAt: now.toISOString(),
    streak: emptyStreakState(now, options.timeZone),
    intentions: [],
    nudgeOptIn: false,
  };
}

/** Pure, deterministic, and idempotent for already-valid v1 profiles. */
export function migrateAdherenceProfile(
  value: unknown,
  options: AdherenceMigrationOptions,
): AdherenceProfileV1 {
  const now = new Date(options.now);
  if (Number.isNaN(now.getTime())) throw new RangeError("now must be valid");
  const today = localDateKey(now, options.timeZone);
  const row = isRecord(value) ? value : {};

  if (row.version === 1 && isRecord(row.streak)) {
    const streakRow = row.streak;
    const streak = normalizeStreakState(
      {
        totalActiveDays: asNonNegativeInteger(streakRow.totalActiveDays),
        currentPracticeStreak: asNonNegativeInteger(
          streakRow.currentPracticeStreak,
        ),
        lastPracticeDate: asDateKey(streakRow.lastPracticeDate),
        continuityProtectedUntil: asDateKey(streakRow.continuityProtectedUntil),
        comebackStartedAt: asDateKey(streakRow.comebackStartedAt),
        longestComebackStreak: asNonNegativeInteger(
          streakRow.longestComebackStreak,
        ),
        freezesUsedThisMonth: asNonNegativeInteger(
          streakRow.freezesUsedThisMonth,
        ),
        freezeMonthKey:
          typeof streakRow.freezeMonthKey === "string"
            ? streakRow.freezeMonthKey
            : today.slice(0, 7),
      },
      today,
    );
    return {
      version: 1,
      updatedAt:
        typeof row.updatedAt === "string" ? row.updatedAt : now.toISOString(),
      streak,
      intentions: asIntentions(row.intentions),
      nudgeOptIn: row.nudgeOptIn === true,
    };
  }

  const sessionDates = normalizeSessionDates(options.sessionDates ?? [], today);
  const seeded = streakFromSessionDates(sessionDates, today);
  const previous = legacyStreak(row);
  const empty = emptyStreakState(now, options.timeZone);
  const previousTotal = asNonNegativeInteger(previous.totalActiveDays);
  const previousCurrent = asNonNegativeInteger(previous.currentPracticeStreak);

  return {
    version: 1,
    updatedAt: now.toISOString(),
    streak: {
      ...empty,
      totalActiveDays: Math.max(previousTotal, seeded.totalActiveDays),
      currentPracticeStreak:
        sessionDates.length > 0
          ? seeded.currentPracticeStreak
          : previousCurrent,
      lastPracticeDate:
        seeded.lastPracticeDate ?? asDateKey(previous.lastPracticeDate),
      continuityProtectedUntil: asDateKey(previous.continuityProtectedUntil),
      comebackStartedAt: asDateKey(previous.comebackStartedAt),
      longestComebackStreak: asNonNegativeInteger(
        previous.longestComebackStreak,
      ),
      freezesUsedThisMonth: Math.min(
        2,
        asNonNegativeInteger(previous.freezesUsedThisMonth),
      ),
    },
    intentions: asIntentions(row.intentions),
    nudgeOptIn: row.nudgeOptIn === true,
  };
}

export function loadProfile(
  storage: AdherenceKeyValueStorage,
  options: AdherenceMigrationOptions,
  key = ADHERENCE_PROFILE_STORAGE_KEY,
): AdherenceProfileV1 {
  try {
    const raw = storage.getItem(key);
    return migrateAdherenceProfile(raw ? JSON.parse(raw) : null, options);
  } catch {
    return createDefaultAdherenceProfile(options);
  }
}

export function saveProfile(
  storage: AdherenceKeyValueStorage,
  profile: AdherenceProfileV1,
  key = ADHERENCE_PROFILE_STORAGE_KEY,
): void {
  storage.setItem(key, JSON.stringify(profile));
}

function isShadowEntry(value: unknown): value is ShadowEntry {
  if (!isRecord(value) || !isRecord(value.blockWeights)) return false;
  return (
    typeof value.date === "string" &&
    (value.planDuration === 15 ||
      value.planDuration === 30 ||
      value.planDuration === 45) &&
    typeof value.readiness === "number" &&
    value.readiness >= 0.15 &&
    value.readiness <= 1 &&
    typeof value.predictedCompletion === "boolean" &&
    typeof value.actualCompletion === "boolean" &&
    [
      value.blockWeights.grammar,
      value.blockWeights.mixed_practice,
      value.blockWeights.conversation_studio,
      value.blockWeights.review,
      value.blockWeights.automatization,
    ].every((weight) => typeof weight === "number" && Number.isFinite(weight))
  );
}

export function readShadowComparisons(
  storage: AdherenceKeyValueStorage,
  key = ADHERENCE_SHADOW_STORAGE_KEY,
): readonly ShadowEntry[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter(isShadowEntry) : [];
  } catch {
    return [];
  }
}

export function logShadowComparison(
  storage: AdherenceKeyValueStorage,
  entry: ShadowEntry,
  key = ADHERENCE_SHADOW_STORAGE_KEY,
): readonly ShadowEntry[] {
  if (!isShadowEntry(entry)) {
    throw new RangeError("Invalid shadow comparison entry");
  }
  const identifier = `${entry.date}:${entry.planDuration}`;
  const next = [
    ...readShadowComparisons(storage, key).filter(
      (candidate) =>
        `${candidate.date}:${candidate.planDuration}` !== identifier,
    ),
    entry,
  ].slice(-400);
  storage.setItem(key, JSON.stringify(next));
  return next;
}
