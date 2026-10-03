import {
  isRecord,
  validDate,
  validHash,
  type AttemptEvent,
  type Language,
  type Verdict,
} from "./contracts";
import type { LocalStore } from "./storage";

export interface ReviewDraft {
  version: 1;
  attemptId: string;
  responseSha256: string;
  baseAssessmentId: string | null;
  reviewerKind: "self" | "human";
  reviewerName: string;
  verdict: Verdict;
  opportunities: string;
  feedback: string;
  correction: string;
  updatedAt: string;
}
export const reviewDraftKey = (language: Language, attemptId: string) =>
  `automaticity:v2:${language}:review-draft:${encodeURIComponent(attemptId)}`;
export const reviewSelectionKey = (language: Language) =>
  `automaticity:v2:${language}:review-selection`;

export function parseReviewDraft(
  raw: string,
  attempt: AttemptEvent,
): ReviewDraft {
  const row: unknown = JSON.parse(raw);
  const bounded = (value: unknown, max: number) =>
    typeof value === "string" && value.length <= max;
  if (
    !isRecord(row) ||
    row.version !== 1 ||
    row.attemptId !== attempt.id ||
    !validHash(row.responseSha256) ||
    row.responseSha256 !== attempt.response.sha256 ||
    !(
      row.baseAssessmentId === null ||
      (typeof row.baseAssessmentId === "string" &&
        !!row.baseAssessmentId.trim())
    ) ||
    !["self", "human"].includes(String(row.reviewerKind)) ||
    !["not_assessed", "pass", "needs_repair", "target_not_observed"].includes(
      String(row.verdict),
    ) ||
    !bounded(row.reviewerName, 150) ||
    !bounded(row.opportunities, 12) ||
    !bounded(row.feedback, 10000) ||
    !bounded(row.correction, 100000) ||
    !validDate(row.updatedAt)
  )
    throw new Error(
      "Saved review draft does not match its original response or format.",
    );
  return row as unknown as ReviewDraft;
}

/** Keep corrupt or externally changed bytes. Never overwrite a newer draft silently. */
export function saveReviewDraft(
  storage: LocalStore,
  language: Language,
  attempt: AttemptEvent,
  draft: ReviewDraft,
  expectedRaw: string | null,
): string {
  if (attempt.language !== language)
    throw new Error("Wrong review draft language.");
  const key = reviewDraftKey(language, attempt.id),
    current = storage.getItem(key);
  if (current !== expectedRaw)
    throw new Error(
      "This review draft changed in another tab. Download your draft before reloading.",
    );
  if (current !== null) parseReviewDraft(current, attempt);
  const raw = JSON.stringify(draft);
  parseReviewDraft(raw, attempt);
  storage.setItem(key, raw);
  if (storage.getItem(key) !== raw)
    throw new Error(
      "The review draft could not be saved. Download it before leaving.",
    );
  return raw;
}
