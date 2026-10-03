import type { AppState } from "@/features/store/app-store";

export interface TeacherReviewQueueItem {
  readonly id: string;
  readonly learner: string;
  readonly task: string;
  readonly evidenceType: string;
  readonly confidence: string;
  readonly correctionNeed: string;
  readonly recommendedNextStep: string;
  readonly href: string;
  readonly priority: "now" | "planned";
}

export function buildTeacherReviewQueue(
  state: AppState,
  now: number,
): readonly TeacherReviewQueueItem[] {
  const learner = state.learner.displayName.trim() || "Local learner";

  // Only saved learner evidence enters the queue. Repetition/stability labels
  // describe automated signals and never claim human verification.
  const errorItems = state.errors
    .filter((error) => error.repairStatus !== "fixed")
    .map<TeacherReviewQueueItem>((error) => ({
      id: `error-${error.id}`,
      learner,
      task: error.grammarTitle || error.topic,
      evidenceType: "Correction record",
      confidence:
        error.occurrenceCount > 1
          ? `Repeated ${error.occurrenceCount} times · automated signal`
          : "Single occurrence · teacher check needed",
      correctionNeed:
        error.originalText && error.correctedText
          ? `${error.originalText} → ${error.correctedText}`
          : "Review the saved correction and explanation.",
      recommendedNextStep:
        error.nextRepairAt <= now
          ? "Review the correction, then assign repair practice now."
          : "Keep the scheduled repair and check the next attempt.",
      href: "/?screen=errors",
      priority: error.nextRepairAt <= now ? "now" : "planned",
    }));

  const reviewItems = state.reviews
    .filter((review) => review.status !== "done")
    .map<TeacherReviewQueueItem>((review) => ({
      id: `review-${review.id}`,
      learner,
      task: review.topic,
      evidenceType: "Spaced-recall review",
      confidence: `${review.stabilityScore}% stability · automated signal`,
      correctionNeed:
        review.original && review.corrected && review.original !== review.corrected
          ? `${review.original} → ${review.corrected}`
          : "No new correction recorded; inspect recall evidence.",
      recommendedNextStep:
        review.dueAt <= now
          ? "Run the due recall task before new material."
          : "Leave scheduled; compare the next delayed-recall result.",
      href: "/?screen=progress",
      priority: review.dueAt <= now ? "now" : "planned",
    }));

  return [...errorItems, ...reviewItems]
    .sort((left, right) => Number(left.priority !== "now") - Number(right.priority !== "now"))
    .slice(0, 8);
}
