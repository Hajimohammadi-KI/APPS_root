import {
  isRecord,
  validDate,
  type AttemptEvent,
  type Language,
  type Modality,
} from "./contracts";
import { reduceAutomaticityEvents } from "./evidence";
export interface ProspectiveConsent {
  id: string;
  at: string;
  language: Language;
  purpose: "fsrs_shadow";
  revokedAt?: string;
}
export interface ExplicitRecallRating {
  id: string;
  attemptId: string;
  assessmentId: string;
  consentId: string;
  rating: 1 | 2 | 3 | 4;
  recordedAt: string;
}
export interface QualifiedRecall {
  eventId: string;
  attemptId: string;
  assessmentId: string;
  responseSha256: string;
  cardId: string;
  language: Language;
  modality: Modality;
  reviewedAt: string;
  rating: 1 | 2 | 3 | 4;
}
function identifier(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= 500
  );
}
function parseRating(value: unknown): ExplicitRecallRating | null {
  if (
    !isRecord(value) ||
    !identifier(value.id) ||
    !identifier(value.attemptId) ||
    !identifier(value.assessmentId) ||
    !identifier(value.consentId) ||
    ![1, 2, 3, 4].includes(value.rating as number) ||
    !validDate(value.recordedAt)
  )
    return null;
  // Canonical field order makes duplicate detection independent of JSON key order.
  return {
    id: value.id,
    attemptId: value.attemptId,
    assessmentId: value.assessmentId,
    consentId: value.consentId,
    rating: value.rating as ExplicitRecallRating["rating"],
    recordedAt: value.recordedAt,
  };
}
function isRecallTask(attempt: AttemptEvent): boolean {
  return (
    (attempt.task.stage === "retrieve" || attempt.task.stage === "retain") &&
    attempt.task.partition === "practice" &&
    attempt.task.transferCondition === "none"
  );
}
function memoryCardId(attempt: AttemptEvent): string {
  const task = attempt.task;
  // Retrieval and retention may revisit the same cue. Changed cues, versions,
  // contexts, rubrics and modalities must never inherit its memory state.
  return `fsrs-item-v2:${JSON.stringify([
    attempt.language,
    task.constructionId,
    task.familyId,
    task.id,
    task.version,
    task.itemFamily,
    task.contextId,
    task.rubricVersion,
    task.modality,
    task.partition,
    task.definitionSha256,
  ])}`;
}
/** Explicit, prospective familiar-item recall; transfer evidence stays in its own ledger. */
export function qualifyProspectiveReviews(
  events: readonly unknown[],
  language: Language,
  now: string,
  consent: unknown,
  ratings: readonly unknown[],
): { eligible: QualifiedRecall[]; excluded: { id: string; reason: string }[] } {
  const excluded: { id: string; reason: string }[] = [];
  if (
    !isRecord(consent) ||
    consent.language !== language ||
    consent.purpose !== "fsrs_shadow" ||
    !identifier(consent.id) ||
    !validDate(consent.at) ||
    !validDate(now) ||
    Date.parse(consent.at) > Date.parse(now) ||
    // A recorded withdrawal ends calculation. Malformed/future withdrawals
    // also fail closed; opting in again requires a new consent identity.
    consent.revokedAt !== undefined
  )
    return {
      eligible: [],
      excluded: ratings.map((row) => ({
        id: isRecord(row) && identifier(row.id) ? row.id : "unknown",
        reason: "No valid prospective consent",
      })),
    };
  const rows = reduceAutomaticityEvents(events, language, now).attempts;
  const unique = new Map<string, ExplicitRecallRating>(),
    conflicts = new Set<string>(),
    invalidIds = new Set<string>(),
    identities = new Map<string, ExplicitRecallRating>();
  for (const raw of ratings) {
    const rating = parseRating(raw);
    if (!rating) {
      const id = isRecord(raw) && identifier(raw.id) ? raw.id : "unknown";
      excluded.push({ id, reason: "Invalid explicit rating" });
      if (isRecord(raw) && identifier(raw.attemptId))
        conflicts.add(raw.attemptId);
      if (isRecord(raw) && identifier(raw.id)) invalidIds.add(raw.id);
      continue;
    }
    const sameId = identities.get(rating.id);
    if (sameId && JSON.stringify(sameId) !== JSON.stringify(rating)) {
      conflicts.add(sameId.attemptId);
      conflicts.add(rating.attemptId);
    } else identities.set(rating.id, rating);
    const old = unique.get(rating.attemptId);
    if (old && JSON.stringify(old) !== JSON.stringify(rating))
      conflicts.add(rating.attemptId);
    else unique.set(rating.attemptId, rating);
  }
  const eligible: QualifiedRecall[] = [];
  for (const rating of unique.values()) {
    const row = rows.find((row) => row.attempt.id === rating.attemptId);
    let reason: string | null = null;
    if (conflicts.has(rating.attemptId) || invalidIds.has(rating.id))
      reason = "Conflicting ratings require review";
    else if (
      rating.consentId !== consent.id ||
      Date.parse(rating.recordedAt) > Date.parse(now)
    )
      reason = "Invalid explicit rating";
    else if (
      !row?.eligibleForMastery ||
      !row.delayed ||
      !row.assessment ||
      row.assessment.id !== rating.assessmentId
    )
      reason = "No current qualified delayed outcome";
    else if (!isRecallTask(row.attempt))
      reason =
        "Only familiar-item practice retrieval or retention can enter FSRS";
    else if (!row.attempt.task.definitionSha256)
      reason =
        "The original task definition is not pinned; legacy history cannot seed this item";
    else if (
      !rows.some(
        (prior) =>
          Date.parse(prior.attempt.at) < Date.parse(row.attempt.at) &&
          isRecallTask(prior.attempt) &&
          memoryCardId(prior.attempt) === memoryCardId(row.attempt),
      )
    )
      reason =
        "No prior familiar item with this exact task, context, version and modality";
    else if (
      Date.parse(row.attempt.at) < Date.parse(consent.at) ||
      Date.parse(rating.recordedAt) < Date.parse(row.assessment.at)
    )
      reason = "Rating is not prospective";
    else if ((rating.rating === 1) === row.success)
      reason = "Recall rating conflicts with the reviewed outcome";
    if (reason || !row?.assessment) {
      excluded.push({ id: rating.id, reason: reason ?? "Missing assessment" });
      continue;
    }
    eligible.push({
      eventId: rating.id,
      attemptId: row.attempt.id,
      assessmentId: row.assessment.id,
      responseSha256: row.attempt.response.sha256,
      cardId: memoryCardId(row.attempt),
      language,
      modality: row.attempt.task.modality,
      reviewedAt: row.attempt.at,
      rating: rating.rating,
    });
  }
  return {
    eligible: eligible.sort(
      (a, b) =>
        Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt) ||
        a.eventId.localeCompare(b.eventId),
    ),
    excluded,
  };
}
