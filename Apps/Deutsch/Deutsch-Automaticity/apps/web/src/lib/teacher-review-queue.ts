import type { LearnerState } from "@grammar/domain";

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
  state: LearnerState,
  now: number,
): readonly TeacherReviewQueueItem[] {
  const learner = state.learner.displayName.trim() || "Lokale lernende Person";

  // Nur gespeicherte Lernnachweise kommen in die Warteschlange. Wiederholung
  // und Stabilität bleiben klar als automatische, ungeprüfte Signale benannt.
  const errorItems = state.errors
    .filter((error) => error.repairStatus !== "fixed")
    .map<TeacherReviewQueueItem>((error) => ({
      id: `error-${error.id}`,
      learner,
      task: error.topic,
      evidenceType: "Korrektur-Nachweis",
      confidence:
        error.occurrenceCount > 1
          ? `${error.occurrenceCount}-mal wiederholt · automatisches Signal`
          : "Einmal aufgetreten · Lehrkraftprüfung nötig",
      correctionNeed:
        error.original && error.corrected
          ? `${error.original} → ${error.corrected}`
          : "Gespeicherte Korrektur und Erklärung prüfen.",
      recommendedNextStep:
        error.nextRepairAt <= now
          ? "Korrektur prüfen und jetzt eine Reparaturübung zuweisen."
          : "Geplante Reparatur beibehalten und nächsten Versuch prüfen.",
      href: "/fehler",
      priority: error.nextRepairAt <= now ? "now" : "planned",
    }));

  const reviewItems = state.reviews
    .filter((review) => !review.mastered)
    .map<TeacherReviewQueueItem>((review) => ({
      id: `review-${review.id}`,
      learner,
      task: review.topic,
      evidenceType: "Verzögerter Abruf",
      confidence: `${review.stabilityScore}% Stabilität · automatisches Signal`,
      correctionNeed:
        review.original &&
        review.corrected &&
        review.original !== review.corrected
          ? `${review.original} → ${review.corrected}`
          : "Keine neue Korrektur; Abruf-Nachweis prüfen.",
      recommendedNextStep:
        review.due <= now
          ? "Fälligen Abruf vor neuem Lernstoff durchführen."
          : "Geplant lassen und nächsten verzögerten Abruf vergleichen.",
      href: "/wiederholungen",
      priority: review.due <= now ? "now" : "planned",
    }));

  return [...errorItems, ...reviewItems]
    .sort(
      (left, right) =>
        Number(left.priority !== "now") - Number(right.priority !== "now"),
    )
    .slice(0, 8);
}
