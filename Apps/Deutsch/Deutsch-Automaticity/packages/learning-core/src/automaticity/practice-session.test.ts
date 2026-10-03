import { describe, expect, test } from "bun:test";
import {
  parseSavedPracticeSession,
  preparePracticeSession,
  shouldResumeSavedPractice,
  type PracticeSession,
} from "./practice-session";

const task = { id: "task", version: "1" };
const at = "2026-10-02T10:00:00.000Z";
const saved: PracticeSession = {
  version: 2,
  taskId: task.id,
  taskVersion: task.version,
  draft: "My unfinished answer",
  startedAt: at,
  hintCount: 0,
  solutionRevealed: false,
  exampleSeen: false,
  selfReportedAssistance: false,
  previousAttemptId: null,
  submittedId: null,
  audioId: null,
};

describe("practice session continuity", () => {
  test("returning to a task restores its draft and original help state", () => {
    const assisted = { ...saved, hintCount: 2, exampleSeen: true };
    const restored = preparePracticeSession(
      task,
      assisted,
      "2026-10-02T11:00:00Z",
    );
    expect(restored.resumed).toBe(true);
    expect(restored.session).toEqual(assisted);
    expect(restored.archive).toBeNull();
  });
  test("every kind of help preserves even a blank session on general entry", () => {
    for (const help of [
      { hintCount: 1 },
      { solutionRevealed: true },
      { exampleSeen: true },
      { selfReportedAssistance: true },
    ]) {
      const assisted = { ...saved, draft: "", ...help };
      expect(shouldResumeSavedPractice(assisted, "general")).toBe(true);
      expect(preparePracticeSession(task, assisted, at).session).toEqual(
        assisted,
      );
    }
  });
  test("a recording alone is unfinished work and retains its audio identity", () => {
    const spoken = { ...saved, draft: "", audioId: "recording-1" };
    expect(preparePracticeSession(task, spoken, at).session.audioId).toBe(
      "recording-1",
    );
  });
  test("an empty untouched session starts with a fresh clock", () => {
    const result = preparePracticeSession(
      task,
      { ...saved, draft: "" },
      "2026-10-02T11:00:00Z",
    );
    expect(result.resumed).toBe(false);
    expect(result.session.startedAt).toBe("2026-10-02T11:00:00Z");
  });
  test("a completed response remains reviewable but is not reused as a fresh answer", () => {
    const completed = { ...saved, submittedId: "attempt-1" };
    expect(shouldResumeSavedPractice(completed, "explicit_task")).toBe(true);
    expect(shouldResumeSavedPractice(completed, "general")).toBe(false);
    const next = preparePracticeSession(task, completed, at);
    expect(next.resumed).toBe(false);
    expect(next.session.draft).toBe("");
    expect(next.session.submittedId).toBeNull();
  });
  test("a new repair archives a different unfinished answer before replacing it", () => {
    const result = preparePracticeSession(task, saved, at, "failed-1");
    expect(result.resumed).toBe(false);
    expect(result.archive).toEqual(saved);
    expect(result.session.previousAttemptId).toBe("failed-1");
    expect(result.session.draft).toBe("");
  });
  test("resuming the same repair keeps its draft and original response link", () => {
    const repair = { ...saved, previousAttemptId: "failed-1" };
    expect(
      preparePracticeSession(task, repair, at, "failed-1").session,
    ).toEqual(repair);
  });
  test("a changed task version preserves the old draft without using it for the new prompt", () => {
    const result = preparePracticeSession({ ...task, version: "2" }, saved, at);
    expect(result.archive).toEqual(saved);
    expect(result.session.taskVersion).toBe("2");
    expect(result.session.draft).toBe("");
  });
  test("task identity cannot leak another prompt's answer", () => {
    const result = preparePracticeSession(
      { ...task, id: "another" },
      saved,
      at,
    );
    expect(result.resumed).toBe(false);
    expect(result.session.taskId).toBe("another");
    expect(result.archive).toEqual(saved);
  });
  test("saved sessions are validated without silently discarding corrupt data", () => {
    expect(parseSavedPracticeSession(null)).toBeNull();
    expect(parseSavedPracticeSession(JSON.stringify(saved))).toEqual(saved);
    expect(() => parseSavedPracticeSession("{")).toThrow();
    expect(() =>
      parseSavedPracticeSession(JSON.stringify({ ...saved, hintCount: -1 })),
    ).toThrow();
    expect(() =>
      parseSavedPracticeSession(JSON.stringify({ ...saved, audioId: 3 })),
    ).toThrow();
    expect(() =>
      parseSavedPracticeSession(
        JSON.stringify({ ...saved, startedAt: "not a date" }),
      ),
    ).toThrow();
  });
});
