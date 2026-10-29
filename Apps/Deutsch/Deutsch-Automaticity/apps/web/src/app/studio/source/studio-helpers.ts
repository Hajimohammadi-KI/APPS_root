import type { SpeechRecognitionLike } from "@automaticity/learning-core/speech";
export type { SpeechRecognitionLike } from "@automaticity/learning-core/speech";
import { conversationTopics } from "./conversation-data";
import type { StoredEvaluationIssue } from "./conversation-storage";

export type RecordingState = "idle" | "recording" | "paused";
export type PracticeMode = "guided" | "challenge" | "pronunciation";

export interface EvaluationResponse {
  readonly original: string;
  readonly corrected: string;
  readonly provider: "LanguageTool";
  readonly checkedAt: string;
  readonly issues: readonly StoredEvaluationIssue[];
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

export function recognitionConstructor():
  SpeechRecognitionConstructor | undefined {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition
  );
}

export function isEvaluationResponse(
  value: unknown,
): value is EvaluationResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.original === "string" &&
    typeof candidate.corrected === "string" &&
    candidate.provider === "LanguageTool" &&
    typeof candidate.checkedAt === "string" &&
    Array.isArray(candidate.issues)
  );
}

export function unique(values: readonly string[]) {
  return [...new Set(values)];
}

export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function countWords(value: string) {
  return value.trim().match(/[\p{L}\p{N}'’-]+/gu)?.length ?? 0;
}

export interface IssueSegment {
  readonly text: string;
  /** Index into the issue list, or null for unflagged text. */
  readonly issue: number | null;
}

/** Splits the checked text so each flagged span can be highlighted where it occurs. */
export function issueSegments(
  original: string,
  issues: readonly StoredEvaluationIssue[],
): IssueSegment[] {
  const spans = issues
    .map((issue, index) => ({ ...issue, index }))
    .filter(
      (issue) =>
        issue.length > 0 &&
        issue.offset >= 0 &&
        issue.offset + issue.length <= original.length,
    )
    .sort((a, b) => a.offset - b.offset || a.index - b.index);
  const segments: IssueSegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.offset < cursor) continue;
    if (span.offset > cursor)
      segments.push({ text: original.slice(cursor, span.offset), issue: null });
    segments.push({
      text: original.slice(span.offset, span.offset + span.length),
      issue: span.index,
    });
    cursor = span.offset + span.length;
  }
  if (cursor < original.length)
    segments.push({ text: original.slice(cursor), issue: null });
  return segments;
}

/** The recording is persisted only when the learner opted in to storing audio. */
export function studioAudioToStore(
  audio: Blob,
  storeAudio: boolean,
  attemptId: string,
): { readonly audio: Blob | null; readonly audioReferenceId?: string } {
  return storeAudio && audio.size > 0
    ? { audio, audioReferenceId: attemptId }
    : { audio: null };
}

export function safeSameOriginPath(
  value: string | null,
  fallback: string,
  origin = window.location.origin,
) {
  if (!value) return fallback;
  try {
    const candidate = new URL(value, origin);
    if (candidate.origin !== origin) return fallback;
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}

export function returnToPriorContext(returnPath: string) {
  const safePath = safeSameOriginPath(returnPath, "/");
  const target = new URL(safePath, window.location.origin);
  const referrer = document.referrer
    ? new URL(document.referrer, window.location.origin)
    : null;
  const referrerMatches =
    referrer?.origin === target.origin &&
    referrer.pathname === target.pathname &&
    (!target.search || referrer.search === target.search);

  // Use real history when possible so the learner returns to the exact daily
  // context without creating a second entry; direct links keep a safe fallback.
  if (referrerMatches && window.history.length > 1) window.history.back();
  else window.location.assign(safePath);
}

export interface DailyEntry {
  readonly activity: number;
  readonly returnPath: string;
  readonly level: string | null;
  readonly topicId: string | null;
}

/** Reads the Daily deep link (`?from=daily`) the studio was opened with, if any. */
export function readStudioEntry(
  search: string,
  origin = window.location.origin,
): DailyEntry | null {
  const params = new URLSearchParams(search);
  if (params.get("from") !== "daily") return null;
  const activity = Number(params.get("activity"));
  const requestedLevel = params.get("level");
  const requestedTopic = params.get("topic")?.toLowerCase();
  const matching =
    conversationTopics.find(
      (topic) =>
        (!requestedLevel || topic.level === requestedLevel) &&
        (!requestedTopic ||
          topic.topic.toLowerCase().includes(requestedTopic) ||
          requestedTopic.includes(topic.topic.toLowerCase())),
    ) ??
    conversationTopics.find(
      (topic) => !requestedLevel || topic.level === requestedLevel,
    );
  return {
    activity: Number.isFinite(activity) ? activity : 2,
    returnPath: safeSameOriginPath(params.get("return"), "/heute", origin),
    level: requestedLevel,
    topicId: matching?.id ?? null,
  };
}
