import { localDateKey } from "./streak";
import type {
  AdherenceKeyValueStorage,
  AdherenceProfileV1,
  ImplementationIntention,
  NudgeEvaluation,
  NudgeEvaluationInput,
  NudgeEventType,
  NudgeEventV1,
  NudgeGuardCode,
  NudgePolicy,
} from "./types";

export const ADHERENCE_NUDGE_EVENT_STORAGE_KEY =
  "adherence-nudge-events-v1" as const;

export const DEFAULT_NUDGE_POLICY: NudgePolicy = {
  eligibleWindowMinutes: 30,
  perTriggerCooldownHours: 72,
  quietHoursStartMinute: 21 * 60,
  quietHoursEndMinute: 8 * 60,
  minimumReadiness: 0.35,
  reviewBacklogCap: 40,
  dailyCap: 1,
  weeklyCap: 3,
} as const;

const NUDGE_EVENT_RETENTION_DAYS = 90;
const MAX_NUDGE_EVENTS = 500;

function asDate(value: Date | string): Date {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new RangeError("Invalid date");
  return parsed;
}

function localMinutes(now: Date | string, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(asDate(now));
  const part = (type: "hour" | "minute"): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? 0);
  return part("hour") * 60 + part("minute");
}

function weekKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  const dayOfWeek = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

function parseTimeLabel(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function isWithinQuietHours(minutes: number, policy: NudgePolicy): boolean {
  const start = policy.quietHoursStartMinute;
  const end = policy.quietHoursEndMinute;
  return start < end
    ? minutes >= start && minutes < end
    : minutes >= start || minutes < end;
}

function isEligibleTimeTrigger(
  intention: ImplementationIntention | null,
  now: Date | string,
  timeZone: string,
  policy: NudgePolicy,
): intention is ImplementationIntention {
  if (
    !intention?.active ||
    intention.trigger !== "time" ||
    intention.action === "skip_ok"
  ) {
    return false;
  }
  const plannedMinute = parseTimeLabel(intention.triggerLabel);
  if (plannedMinute === null) return false;
  const elapsed = localMinutes(now, timeZone) - plannedMinute;
  return elapsed >= 0 && elapsed <= policy.eligibleWindowMinutes;
}

export function findEligibleTimeIntention(
  intentions: readonly ImplementationIntention[],
  now: Date | string,
  timeZone: string,
  policy: NudgePolicy = DEFAULT_NUDGE_POLICY,
): ImplementationIntention | null {
  return (
    intentions.find((intention) =>
      isEligibleTimeTrigger(intention, now, timeZone, policy),
    ) ?? null
  );
}

function shownHistory(
  history: readonly NudgeEventV1[],
): readonly NudgeEventV1[] {
  return history.filter((event) => event.type === "shown");
}

function result(
  code: NudgeGuardCode,
  triggerId: string | null,
  now: Date,
): NudgeEvaluation {
  return {
    eligible: code === "eligible",
    code,
    triggerId,
    evaluatedAt: now.toISOString(),
    learningOutcome: "not-evaluated",
  };
}

/**
 * Pure, first-failure evaluator. Guard order is part of the public contract.
 * It decides whether an in-app prompt may be shown; it never proves learning.
 */
export function evaluateNudge(input: NudgeEvaluationInput): NudgeEvaluation {
  const now = asDate(input.now);
  const policy = input.policy ?? DEFAULT_NUDGE_POLICY;
  const triggerId = input.trigger?.id ?? null;
  if (!isEligibleTimeTrigger(input.trigger, now, input.timeZone, policy)) {
    return result("ineligible-trigger", triggerId, now);
  }

  const shown = shownHistory(input.history);
  const cooldownSince =
    now.getTime() - policy.perTriggerCooldownHours * 3_600_000;
  if (
    shown.some(
      (event) =>
        event.triggerId === input.trigger!.id &&
        Date.parse(event.occurredAt) >= cooldownSince,
    )
  ) {
    return result("trigger-cooldown", triggerId, now);
  }

  if (isWithinQuietHours(localMinutes(now, input.timeZone), policy)) {
    return result("quiet-hours", triggerId, now);
  }
  if (
    !Number.isFinite(input.readiness) ||
    input.readiness < policy.minimumReadiness
  ) {
    return result("low-readiness", triggerId, now);
  }
  if (
    !Number.isFinite(input.reviewBacklog) ||
    input.reviewBacklog > policy.reviewBacklogCap
  ) {
    return result("review-backlog-cap", triggerId, now);
  }
  if (!input.optedIn) return result("opted-out", triggerId, now);

  const today = localDateKey(now, input.timeZone);
  const thisWeek = weekKey(today);
  if (
    shown.filter(
      (event) => localDateKey(event.occurredAt, input.timeZone) === today,
    ).length >= policy.dailyCap
  ) {
    return result("daily-cap", triggerId, now);
  }
  if (
    shown.filter(
      (event) =>
        weekKey(localDateKey(event.occurredAt, input.timeZone)) === thisWeek,
    ).length >= policy.weeklyCap
  ) {
    return result("weekly-cap", triggerId, now);
  }
  return result("eligible", triggerId, now);
}

export function replaceNudgeOptIn(
  profile: AdherenceProfileV1,
  optedIn: boolean,
  now: Date | string,
): AdherenceProfileV1 {
  return {
    ...profile,
    updatedAt: asDate(now).toISOString(),
    nudgeOptIn: optedIn,
  };
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

export function createNudgeEvent(input: {
  readonly type: NudgeEventType;
  readonly triggerId: string;
  readonly occurredAt: Date | string;
  readonly timeZone: string;
  readonly decision: NudgeGuardCode;
}): NudgeEventV1 {
  const occurredAt = asDate(input.occurredAt).toISOString();
  const localDate = localDateKey(occurredAt, input.timeZone);
  const source = `${input.type}|${input.triggerId}|${occurredAt}|${input.decision}`;
  return {
    version: 1,
    id: `nudge-${stableHash(source)}`,
    type: input.type,
    triggerId: input.triggerId,
    occurredAt,
    localDate,
    localWeek: weekKey(localDate),
    decision: input.decision,
    engagementOnly: true,
    learningOutcome: "not-evaluated",
  };
}

function isNudgeEvent(value: unknown): value is NudgeEventV1 {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const event = value as Partial<NudgeEventV1>;
  return (
    event.version === 1 &&
    typeof event.id === "string" &&
    typeof event.triggerId === "string" &&
    typeof event.occurredAt === "string" &&
    Number.isFinite(Date.parse(event.occurredAt)) &&
    typeof event.localDate === "string" &&
    typeof event.localWeek === "string" &&
    (event.type === "evaluated" ||
      event.type === "shown" ||
      event.type === "accepted" ||
      event.type === "dismissed") &&
    (event.decision === "eligible" ||
      event.decision === "ineligible-trigger" ||
      event.decision === "trigger-cooldown" ||
      event.decision === "quiet-hours" ||
      event.decision === "low-readiness" ||
      event.decision === "review-backlog-cap" ||
      event.decision === "opted-out" ||
      event.decision === "daily-cap" ||
      event.decision === "weekly-cap") &&
    event.engagementOnly === true &&
    event.learningOutcome === "not-evaluated"
  );
}

export function readNudgeEvents(
  storage: AdherenceKeyValueStorage,
  now: Date | string = new Date(),
  key = ADHERENCE_NUDGE_EVENT_STORAGE_KEY,
): readonly NudgeEventV1[] {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const cutoff =
      asDate(now).getTime() - NUDGE_EVENT_RETENTION_DAYS * 86_400_000;
    return parsed
      .filter(isNudgeEvent)
      .filter((event) => Date.parse(event.occurredAt) >= cutoff)
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .slice(-MAX_NUDGE_EVENTS);
  } catch {
    return [];
  }
}

export function logNudgeEvent(
  storage: AdherenceKeyValueStorage,
  event: NudgeEventV1,
  key = ADHERENCE_NUDGE_EVENT_STORAGE_KEY,
): readonly NudgeEventV1[] {
  if (!isNudgeEvent(event)) throw new RangeError("Invalid nudge event");
  const next = [
    ...readNudgeEvents(storage, event.occurredAt, key).filter(
      (candidate) => candidate.id !== event.id,
    ),
    event,
  ].slice(-MAX_NUDGE_EVENTS);
  storage.setItem(key, JSON.stringify(next));
  return next;
}
