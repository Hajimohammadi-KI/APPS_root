import type { AssessmentEvent, AttemptEvent } from "./contracts";

export interface AudioReviewEvidence {
  audioSha256: string;
  transcriptSha256: string;
  transcriptVerified: true;
}

/** A separate review binds a faithful transcript to the original audio without rewriting the attempt. */
export function hasReviewedAudio(
  attempt: AttemptEvent,
  assessment: AssessmentEvent | null,
): boolean {
  const review = assessment?.audioReview;
  return !!(
    attempt.audio?.persisted &&
    attempt.audio.bytes > 0 &&
    attempt.audio.durationMs > 0 &&
    assessment?.evaluator.kind === "human" &&
    assessment.evaluator.scopeApproved &&
    assessment.evaluator.reviewId &&
    !attempt.response.transcriptEdited &&
    review?.transcriptVerified &&
    review.audioSha256 === attempt.audio.sha256 &&
    review.transcriptSha256 === attempt.response.sha256
  );
}

/** Seeking to the end alone is not evidence of listening to the whole recording. */
export function fullRecordingPlayed(
  ranges: readonly [number, number][],
  duration: number,
): boolean {
  if (!Number.isFinite(duration) || duration <= 0 || !ranges.length)
    return false;
  const tolerance = Math.min(0.25, duration * 0.02);
  let end = 0,
    missed = 0;
  for (const range of [...ranges].sort((a, b) => a[0] - b[0])) {
    if (!range.every(Number.isFinite) || range[0] < 0 || range[1] < range[0])
      return false;
    missed += Math.max(0, range[0] - end);
    if (missed > tolerance) return false;
    end = Math.max(end, range[1]);
  }
  return missed + Math.max(0, duration - end) <= tolerance;
}
