import { isRecord, type AttemptEvent, type Language } from "./contracts";
import type { LocalStore } from "./storage";

export const RESPONSE_GOALS = [3, 5, 8] as const;
export interface DailyPracticePlan {
  version: 1;
  day: string;
  responseGoal: (typeof RESPONSE_GOALS)[number];
  paused: boolean;
}
/** The learner's local calendar day, independent of language and UTC midnight. */
export function practiceDay(at: string): string {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Invalid practice date");
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dailyPlanKey(language: Language, day: string): string {
  return `automaticity:v2:${language}:daily-plan:${day}`;
}
function parsePlan(raw: string, day: string): DailyPracticePlan | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      isRecord(value) &&
      value.version === 1 &&
      value.day === day &&
      RESPONSE_GOALS.includes(
        value.responseGoal as DailyPracticePlan["responseGoal"],
      ) &&
      typeof value.paused === "boolean"
    )
      return value as unknown as DailyPracticePlan;
  } catch {
    /* Retain unreadable bytes; the caller gets a safe new plan. */
  }
  return null;
}
export function loadDailyPlan(
  store: LocalStore,
  language: Language,
  at: string,
): { plan: DailyPracticePlan; unreadable: boolean } {
  const day = practiceDay(at),
    raw = store.getItem(dailyPlanKey(language, day));
  const parsed = raw === null ? null : parsePlan(raw, day);
  return {
    plan: parsed ?? { version: 1, day, responseGoal: 3, paused: false },
    unreadable: raw !== null && parsed === null,
  };
}
export function saveDailyPlan(
  store: LocalStore,
  language: Language,
  plan: DailyPracticePlan,
): void {
  const bytes = JSON.stringify(plan);
  if (!parsePlan(bytes, plan.day) || !/^\d{4}-\d{2}-\d{2}$/.test(plan.day))
    throw new Error("Invalid daily practice plan");
  const key = dailyPlanKey(language, plan.day),
    previous = store.getItem(key);
  if (previous !== null && !parsePlan(previous, plan.day)) {
    const archive = `${key}:unreadable:${crypto.randomUUID()}`;
    store.setItem(archive, previous);
    if (store.getItem(archive) !== previous)
      throw new Error("Original daily plan could not be preserved");
  }
  store.setItem(key, bytes);
  if (store.getItem(key) !== bytes)
    throw new Error("Daily practice plan was not saved");
}
/** Practice effort only. No correctness, independence or mastery is inferred. */
export function dailyResponseCount(
  attempts: readonly AttemptEvent[],
  language: Language,
  at: string,
): number {
  const day = practiceDay(at),
    deadline = Date.parse(at);
  return new Set(
    attempts
      .filter(
        (attempt) =>
          attempt.language === language &&
          Number.isFinite(Date.parse(attempt.at)) &&
          Date.parse(attempt.at) <= deadline &&
          practiceDay(attempt.at) === day,
      )
      .map((attempt) => attempt.id),
  ).size;
}
