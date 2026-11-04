import type { AssessmentEvent, AttemptEvent } from "./contracts";
import type { PracticeSession } from "./practice-session";

/** Called only after the learner requests a repair. The old response is immutable;
 * an existing draft is the learner's choice and must never be replaced. */
export function prepareLearnerRepair(
  session: PracticeSession,
  original: AttemptEvent,
): PracticeSession {
  if (
    session.draft.length ||
    session.submittedId ||
    session.previousAttemptId !== original.id ||
    session.taskId !== original.task.id ||
    session.taskVersion !== original.task.version
  )
    return session;
  return { ...session, draft: original.response.text };
}

/** Feedback about a practice response is separate from approved mastery evidence. */
export function practiceFeedbackCategory(
  assessment: Pick<
    AssessmentEvent,
    "verdict" | "dimensions" | "uncertainty"
  > | null,
): "unscored" | "grammar" | "target" | "context" | "accepted" {
  if (
    !assessment ||
    assessment.uncertainty ||
    assessment.verdict === "not_assessed"
  )
    return "unscored";
  if (assessment.verdict === "pass") return "accepted";
  if (assessment.dimensions.grammar === "fail") return "grammar";
  if (assessment.dimensions.relevance === "fail") return "context";
  if (assessment.verdict === "target_not_observed") return "target";
  return "unscored";
}
