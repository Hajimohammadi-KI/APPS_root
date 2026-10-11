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

interface RecognitionAlternativeLike {
  readonly transcript: string;
}

interface RecognitionResultLike {
  readonly isFinal: boolean;
  readonly 0: RecognitionAlternativeLike;
}

export interface RecognitionEventLike {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResultLike>;
}

export interface RecognitionErrorLike {
  readonly error: string;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorLike) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

export function recognitionConstructor():
  | SpeechRecognitionConstructor
  | undefined {
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
