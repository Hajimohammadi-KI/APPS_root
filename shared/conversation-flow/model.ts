export type Language = "en" | "de";
export type Stage = "prepare" | "speak" | "feedback";
export type AttemptKind = "initial" | "immediate-retry" | "delayed-new-context";
export type CaptureState = "recording" | "paused" | "stopped" | "interrupted";

export interface Topic {
  readonly id: string;
  readonly level: string;
  readonly topic: string;
  readonly task: string;
  readonly category: string;
  readonly targetForm: string;
  readonly contentVersion: string;
  readonly hints: readonly string[];
}
export interface Issue {
  readonly message: string;
  readonly offset: number;
  readonly length: number;
  readonly replacements: readonly string[];
  readonly ruleId: string;
  readonly category: string;
}
export interface Evaluation {
  readonly original: string;
  readonly corrected: string;
  readonly provider: "LanguageTool";
  readonly checkedAt: string;
  readonly issues: readonly Issue[];
}
export interface Attempt {
  readonly id: string;
  readonly sessionId: string;
  readonly topicId: string;
  readonly language: Language;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly kind: AttemptKind;
  readonly parentId?: string | undefined;
  readonly reviewId?: string | undefined;
  readonly task: string;
  readonly contentVersion: string;
  readonly hintsUsed: readonly string[];
  readonly audio: Blob;
  readonly captureState: CaptureState;
  readonly durationMs: number;
  // Original recognition is frozen when capture stops. Editing never rewrites it.
  readonly rawTranscript: string;
  readonly transcriptSource: "browser-asr" | "unavailable";
  readonly editedTranscript: string;
  readonly confirmedAt?: string | undefined;
  readonly evaluation?: Evaluation | undefined;
  readonly completedAt?: string | undefined;
  readonly errorNote: string;
  readonly contrastNote: string;
}
export interface Review {
  readonly id: string;
  readonly sourceAttemptId: string;
  readonly sessionId: string;
  readonly topicId: string;
  readonly language: Language;
  readonly day: 1 | 3 | 7 | 14;
  readonly dueAt: string;
  readonly task: string;
  readonly responseId?: string;
  readonly completedAt?: string;
}

export function editTranscript(attempt: Attempt, text: string): Attempt {
  return {
    ...attempt,
    editedTranscript: text,
    confirmedAt: undefined,
    evaluation: undefined,
    updatedAt: new Date().toISOString(),
  };
}
export function confirmTranscript(
  attempt: Attempt,
  now = new Date().toISOString(),
): Attempt {
  if (!attempt.editedTranscript.trim())
    throw new Error("A transcript is required.");
  return { ...attempt, confirmedAt: now, updatedAt: now };
}
export function attachEvaluation(attempt: Attempt, value: unknown): Attempt {
  if (
    !attempt.confirmedAt ||
    !isEvaluation(value, attempt.editedTranscript.trim())
  )
    throw new Error("Evaluation does not match the confirmed transcript.");
  return { ...attempt, evaluation: value, updatedAt: new Date().toISOString() };
}
export function isEvaluation(
  value: unknown,
  text: string,
): value is Evaluation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.original === text &&
    typeof v.corrected === "string" &&
    v.provider === "LanguageTool" &&
    typeof v.checkedAt === "string" &&
    Number.isFinite(Date.parse(v.checkedAt)) &&
    Array.isArray(v.issues) &&
    v.issues.every((issue: unknown) => {
      if (!issue || typeof issue !== "object") return false;
      const i = issue as Record<string, unknown>;
      return (
        typeof i.message === "string" &&
        typeof i.ruleId === "string" &&
        typeof i.category === "string" &&
        typeof i.offset === "number" &&
        Number.isInteger(i.offset) &&
        i.offset >= 0 &&
        typeof i.length === "number" &&
        Number.isInteger(i.length) &&
        i.length >= 0 &&
        i.offset + i.length <= text.length &&
        Array.isArray(i.replacements) &&
        i.replacements.every((r: unknown) => typeof r === "string")
      );
    })
  );
}
export function wordCount(text: string): number {
  return text.trim().match(/[\p{L}\p{N}'’-]+/gu)?.length ?? 0;
}
export function speechMeasurements(attempt: Attempt) {
  const count =
    attempt.transcriptSource === "browser-asr"
      ? wordCount(attempt.rawTranscript)
      : null;
  // This is an ASR estimate over recording time (excluding manual pauses), never a fluency score.
  return {
    words: count,
    wordsPerMinute:
      count !== null && count > 0 && attempt.durationMs > 0
        ? Math.round((count * 60000) / attempt.durationMs)
        : null,
  };
}
export function makeReview(
  attempt: Attempt,
  day: Review["day"],
  now = new Date(),
): Review {
  const due = new Date(now);
  due.setDate(due.getDate() + day);
  const variation =
    attempt.language === "de"
      ? "Neue Situation: Sprich mit einer Person, die dich noch nicht kennt. Verwende ein anderes konkretes Beispiel und stelle eine passende Rückfrage."
      : "New situation: speak to someone who does not know you. Use a different concrete example and ask a relevant follow-up question.";
  return {
    id: `${attempt.sessionId}:day-${day}`,
    sessionId: attempt.sessionId,
    sourceAttemptId: attempt.id,
    topicId: attempt.topicId,
    language: attempt.language,
    day,
    dueAt: due.toISOString(),
    task: `${attempt.task}\n${variation}`,
  };
}
export function microphoneProblem(error: unknown): string {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "blocked";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "device";
  return "unsupported";
}

export function priorityIssues(issues: readonly Issue[]): Issue[] {
  const surface = (issue: Issue) =>
    /punctuation|typograph|casing|spelling|rechtschreib|zeichensetzung|groß.*klein/i.test(
      `${issue.category} ${issue.ruleId}`,
    )
      ? 1
      : 0;
  return [...issues].sort((left, right) => surface(left) - surface(right));
}
