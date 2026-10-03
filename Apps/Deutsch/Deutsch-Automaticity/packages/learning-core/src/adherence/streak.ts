import type { StreakStateV1 } from "./types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function nonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function asDate(value: Date | string): Date {
  const parsed =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new RangeError("now must be a valid date");
  }
  return parsed;
}

export function localDateKey(now: Date | string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(asDate(now));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function monthKeyForDate(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function dateKeyToEpochDay(dateKey: string): number {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new RangeError(`Invalid local date key: ${dateKey}`);
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
}

export function differenceInLocalDays(from: string, to: string): number {
  return dateKeyToEpochDay(to) - dateKeyToEpochDay(from);
}

export function addLocalDays(dateKey: string, days: number): string {
  const next = new Date((dateKeyToEpochDay(dateKey) + days) * 86_400_000);
  return next.toISOString().slice(0, 10);
}

export function emptyStreakState(
  now: Date | string,
  timeZone: string,
): StreakStateV1 {
  const today = localDateKey(now, timeZone);
  return {
    totalActiveDays: 0,
    currentPracticeStreak: 0,
    lastPracticeDate: null,
    continuityProtectedUntil: null,
    comebackStartedAt: null,
    longestComebackStreak: 0,
    freezesUsedThisMonth: 0,
    freezeMonthKey: monthKeyForDate(today),
  };
}

function validDateKey(value: string | null): string | null {
  return value && DATE_KEY_PATTERN.test(value) ? value : null;
}

export function normalizeStreakState(
  state: StreakStateV1,
  today: string,
): StreakStateV1 {
  const currentMonth = monthKeyForDate(today);
  const sameFreezeMonth = state.freezeMonthKey === currentMonth;
  return {
    totalActiveDays: nonNegativeInteger(state.totalActiveDays),
    currentPracticeStreak: nonNegativeInteger(state.currentPracticeStreak),
    lastPracticeDate: validDateKey(state.lastPracticeDate),
    continuityProtectedUntil: validDateKey(state.continuityProtectedUntil),
    comebackStartedAt: validDateKey(state.comebackStartedAt),
    longestComebackStreak: nonNegativeInteger(state.longestComebackStreak),
    freezesUsedThisMonth: sameFreezeMonth
      ? Math.min(2, nonNegativeInteger(state.freezesUsedThisMonth))
      : 0,
    freezeMonthKey: currentMonth,
  };
}

export function updateStreak(
  state: StreakStateV1,
  hadSession: boolean,
  now: Date | string,
  timeZone: string,
): StreakStateV1 {
  const today = localDateKey(now, timeZone);
  const current = normalizeStreakState(state, today);
  if (!hadSession) return current;

  const lastPracticeDate = current.lastPracticeDate;
  if (lastPracticeDate === today) return current;
  if (lastPracticeDate && differenceInLocalDays(lastPracticeDate, today) < 0) {
    return current;
  }

  const gap = lastPracticeDate
    ? differenceInLocalDays(lastPracticeDate, today)
    : null;
  const isComeback = gap !== null && gap >= 2;
  const protectedThroughGap =
    isComeback &&
    current.continuityProtectedUntil !== null &&
    differenceInLocalDays(
      addLocalDays(today, -1),
      current.continuityProtectedUntil,
    ) >= 0;

  const nextPracticeStreak =
    gap === 1 || protectedThroughGap
      ? Math.max(1, current.currentPracticeStreak + 1)
      : 1;
  const comebackStartedAt = isComeback ? today : current.comebackStartedAt;
  const comebackLength =
    comebackStartedAt && differenceInLocalDays(comebackStartedAt, today) >= 0
      ? differenceInLocalDays(comebackStartedAt, today) + 1
      : 0;

  return {
    ...current,
    totalActiveDays: current.totalActiveDays + 1,
    currentPracticeStreak: nextPracticeStreak,
    lastPracticeDate: today,
    comebackStartedAt,
    longestComebackStreak: Math.max(
      current.longestComebackStreak,
      comebackLength,
    ),
  };
}

/** Grants at most two one-day continuity protections per local month. */
export function requestContinuityFreeze(
  state: StreakStateV1,
  now: Date | string,
  timeZone: string,
): StreakStateV1 {
  const today = localDateKey(now, timeZone);
  const current = normalizeStreakState(state, today);
  if (current.freezesUsedThisMonth >= 2) return current;
  return {
    ...current,
    continuityProtectedUntil: today,
    freezesUsedThisMonth: current.freezesUsedThisMonth + 1,
  };
}
