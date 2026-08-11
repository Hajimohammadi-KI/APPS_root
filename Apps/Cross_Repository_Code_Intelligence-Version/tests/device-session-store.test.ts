import { describe, expect, test } from "bun:test";
import {
  currentSessionSeconds,
  isTimedSessionState,
  readDeviceSessions,
  transitionTimedSession,
  writeDeviceSessions,
} from "../lib/device-session-store";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("device session storage", () => {
  test("keeps only validated sessions and limits history", () => {
    const storage = memoryStorage();
    const valid = { status: "paused", lastStartedAt: null, endedAt: null } as const;
    storage.setItem("sessions", JSON.stringify([valid, { status: "broken" }]));
    expect(readDeviceSessions("sessions", isTimedSessionState, storage)).toEqual([valid]);
  });

  test("returns a safe empty list for malformed JSON", () => {
    const storage = memoryStorage();
    storage.setItem("sessions", "not-json");
    expect(readDeviceSessions("sessions", isTimedSessionState, storage)).toEqual([]);
  });

  test("calculates and transitions a running timer", () => {
    const session = { status: "running", lastStartedAt: "2026-08-07T10:00:00.000Z", endedAt: null } as const;
    const now = new Date("2026-08-07T10:01:05.000Z");
    expect(currentSessionSeconds(session, 10, now.getTime())).toBe(75);
    expect(transitionTimedSession(session, "finish", 10, now)).toEqual({
      status: "completed",
      storedSeconds: 75,
      lastStartedAt: null,
      endedAt: now.toISOString(),
    });
  });

  test("writes a bounded session history", () => {
    const storage = memoryStorage();
    const sessions = Array.from({ length: 40 }, (_, index) => ({ index }));
    expect(writeDeviceSessions("sessions", sessions, storage)).toBe(true);
    expect(JSON.parse(storage.getItem("sessions") || "[]")).toHaveLength(30);
  });
});
