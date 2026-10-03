import { isRecord } from "./contracts";

export interface PracticeSession {
  version: 2;
  taskId: string;
  taskVersion: string;
  draft: string;
  startedAt: string;
  hintCount: number;
  solutionRevealed: boolean;
  exampleSeen: boolean;
  selfReportedAssistance: boolean;
  previousAttemptId: string | null;
  submittedId: string | null;
  audioId: string | null;
}

type SessionState = Pick<PracticeSession, "draft" | "submittedId" | "audioId"> &
  Partial<
    Pick<
      PracticeSession,
      | "hintCount"
      | "solutionRevealed"
      | "exampleSeen"
      | "selfReportedAssistance"
    >
  >;

/** Help is part of an attempt even before the learner starts writing. */
export function hasUnfinishedPractice(session: SessionState): boolean {
  return (
    !session.submittedId &&
    !!(
      session.draft.trim() ||
      session.audioId ||
      (session.hintCount ?? 0) > 0 ||
      session.solutionRevealed ||
      session.exampleSeen ||
      session.selfReportedAssistance
    )
  );
}

export function shouldResumeSavedPractice(
  session: SessionState,
  context: "general" | "explicit_task" | "review",
  paused = false,
): boolean {
  return context !== "general" || paused || hasUnfinishedPractice(session);
}

/** Invalid stored data is reported, never silently replaced with an empty answer. */
export function parseSavedPracticeSession(
  raw: string | null,
): PracticeSession | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("unreadable_session");
  }
  if (
    !isRecord(parsed) ||
    parsed.version !== 2 ||
    typeof parsed.taskId !== "string" ||
    !parsed.taskId ||
    typeof parsed.taskVersion !== "string" ||
    !parsed.taskVersion ||
    typeof parsed.draft !== "string" ||
    typeof parsed.startedAt !== "string" ||
    !Number.isFinite(Date.parse(parsed.startedAt)) ||
    !Number.isSafeInteger(parsed.hintCount) ||
    (parsed.hintCount as number) < 0 ||
    ["solutionRevealed", "exampleSeen", "selfReportedAssistance"].some(
      (key) => typeof parsed[key] !== "boolean",
    ) ||
    ["submittedId", "previousAttemptId", "audioId"].some(
      (key) => parsed[key] !== null && typeof parsed[key] !== "string",
    )
  )
    throw new Error("invalid_session");
  return parsed as unknown as PracticeSession;
}

/** A task switch resumes unfinished work; an explicit different repair starts separately. */
export function preparePracticeSession(
  task: { id: string; version: string },
  saved: PracticeSession | null,
  startedAt: string,
  previousAttemptId: string | null = null,
): {
  session: PracticeSession;
  resumed: boolean;
  archive: PracticeSession | null;
} {
  if (
    saved &&
    hasUnfinishedPractice(saved) &&
    saved.taskId === task.id &&
    saved.taskVersion === task.version &&
    (previousAttemptId === null ||
      previousAttemptId === saved.previousAttemptId)
  )
    return { session: { ...saved }, resumed: true, archive: null };
  return {
    session: {
      version: 2,
      taskId: task.id,
      taskVersion: task.version,
      draft: "",
      startedAt,
      hintCount: 0,
      solutionRevealed: false,
      exampleSeen: false,
      selfReportedAssistance: false,
      previousAttemptId,
      submittedId: null,
      audioId: null,
    },
    resumed: false,
    archive: saved && hasUnfinishedPractice(saved) ? saved : null,
  };
}
