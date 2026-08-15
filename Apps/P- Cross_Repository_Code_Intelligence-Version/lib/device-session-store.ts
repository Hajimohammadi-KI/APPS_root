export type TimedSessionStatus = "running" | "paused" | "completed";
export type TimedSessionAction = "pause" | "resume" | "finish";

export type TimedSessionState = {
  status: TimedSessionStatus;
  lastStartedAt: string | null;
  endedAt: string | null;
};

type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

function availableStorage(storage?: KeyValueStorage) {
  if (storage) return storage;
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function isTimedSessionState(value: unknown): value is TimedSessionState {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return ["running", "paused", "completed"].includes(String(session.status))
    && (typeof session.lastStartedAt === "string" || session.lastStartedAt === null)
    && (typeof session.endedAt === "string" || session.endedAt === null);
}

export function readDeviceSessions<T>(
  key: string,
  isSession: (value: unknown) => value is T,
  storage?: KeyValueStorage,
): T[] {
  try {
    const target = availableStorage(storage);
    if (!target) return [];
    const value: unknown = JSON.parse(target.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(isSession).slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function writeDeviceSessions<T>(
  key: string,
  sessions: readonly T[],
  storage?: KeyValueStorage,
) {
  try {
    const target = availableStorage(storage);
    if (!target) return false;
    target.setItem(key, JSON.stringify(sessions.slice(0, 30)));
    return true;
  } catch {
    return false;
  }
}

export function currentSessionSeconds(
  session: Pick<TimedSessionState, "status" | "lastStartedAt">,
  storedSeconds: number,
  now = Date.now(),
) {
  if (session.status !== "running" || !session.lastStartedAt) return storedSeconds;
  const startedAt = new Date(session.lastStartedAt).getTime();
  if (!Number.isFinite(startedAt)) return storedSeconds;
  return storedSeconds + Math.max(0, Math.floor((now - startedAt) / 1_000));
}

export function transitionTimedSession(
  session: TimedSessionState,
  action: TimedSessionAction,
  storedSeconds: number,
  now = new Date(),
) {
  const timestamp = now.toISOString();
  return {
    status: action === "finish" ? "completed" as const : action === "pause" ? "paused" as const : "running" as const,
    storedSeconds: currentSessionSeconds(session, storedSeconds, now.getTime()),
    lastStartedAt: action === "resume" ? timestamp : null,
    endedAt: action === "finish" ? timestamp : null,
  };
}
