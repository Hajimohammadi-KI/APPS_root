import {
  parseAutomaticityEvent,
  type AssessmentEvent,
  type AttemptEvent,
  type AutomaticityEvent,
  type TaskIdentity,
} from "./contracts";
import { reduceAutomaticityEvents } from "./evidence";
import { sha256 } from "./backup";
import type { CurriculumPack, PracticeTask } from "./curriculum";
import { appendAutomaticityEvent, type LocalStore } from "./storage";

export interface AssessmentFeedbackCase {
  id: string;
  task: PracticeTask;
  taskSha256: string;
  attempt: AttemptEvent;
  automated: AssessmentEvent;
  review: AssessmentEvent;
  history: AssessmentEvent[];
  disagreement: boolean;
}
export interface AssessmentFeedback {
  kind: "automaticity.assessment-feedback";
  version: 1;
  language: CurriculumPack["language"];
  contentVersion: string;
  createdAt: string;
  purpose: "local_feedback_development_only";
  independentReviewEstablished: false;
  cases: AssessmentFeedbackCase[];
  excluded: { attemptId: string; reason: string }[];
}
const identityKeys = [
  "id",
  "version",
  "constructionId",
  "familyId",
  "itemFamily",
  "contextId",
  "rubricVersion",
  "stage",
  "modality",
  "partition",
  "transferCondition",
] as const;
const matchesTask = (a: TaskIdentity, b: TaskIdentity) =>
  identityKeys.every((key) => a[key] === b[key]);

/** Write the abstention first: an interrupted second write cannot leave a disputed pass current. */
export function persistFeedbackAssessment(
  storage: LocalStore,
  proposal: AssessmentEvent,
  guard: AssessmentEvent | null,
): void {
  if (guard) {
    if (
      guard.supersedes !== proposal.id ||
      guard.attemptId !== proposal.attemptId ||
      guard.verdict !== "not_assessed"
    )
      throw new Error("Feedback guard does not match its original judgment.");
    appendAutomaticityEvent(storage, guard);
  }
  appendAutomaticityEvent(storage, proposal);
}

/** Local reviewer feedback is evidence of a reported disagreement, not a qualified gold label. */
export async function collectAssessmentFeedback(
  raw: readonly unknown[],
  pack: CurriculumPack,
  now: string,
): Promise<AssessmentFeedback> {
  const reduced = reduceAutomaticityEvents(raw, pack.language, now);
  const rejected = new Set(reduced.rejected.map((row) => row.id));
  const events = new Map<string, AutomaticityEvent>();
  for (const value of raw) {
    try {
      const event = parseAutomaticityEvent(value, pack.language);
      if (!rejected.has(event.id)) events.set(event.id, event);
    } catch {
      /* Malformed history is preserved by storage and cannot teach the checker. */
    }
  }
  const result: AssessmentFeedback = {
    kind: "automaticity.assessment-feedback",
    version: 1,
    language: pack.language,
    contentVersion: pack.version,
    createdAt: now,
    purpose: "local_feedback_development_only",
    independentReviewEstablished: false,
    cases: [],
    excluded: [],
  };
  const tasks = pack.units.flatMap((unit) => unit.tasks);
  for (const row of reduced.attempts) {
    const review = row.assessment;
    if (!review || review.evaluator.kind !== "human") continue;
    const exclude = (reason: string) =>
      result.excluded.push({ attemptId: row.attempt.id, reason });
    if (row.attempt.task.modality !== "writing") {
      exclude(
        "Original audio requires its own review; transcript feedback is not reusable speech assessment.",
      );
      continue;
    }
    if (
      review.uncertainty ||
      review.verdict === "not_assessed" ||
      !review.evaluator.reviewId ||
      !review.feedback.trim()
    ) {
      exclude(
        "A definite, identified reviewer judgment and reason are required.",
      );
      continue;
    }
    const task = tasks.find((task) => matchesTask(task, row.attempt.task));
    if (!task) {
      exclude("The original task version is not in the current curriculum.");
      continue;
    }
    const taskSha256 = await sha256(JSON.stringify(task));
    if (row.attempt.task.definitionSha256 !== taskSha256) {
      exclude(
        "The original task definition is missing or has changed; this feedback cannot be reused automatically.",
      );
      continue;
    }
    if (
      (await sha256(row.attempt.response.text)) !== row.attempt.response.sha256
    ) {
      exclude("The original response hash does not match its text.");
      continue;
    }
    const history = [review];
    let parent = review.supersedes ? events.get(review.supersedes) : undefined;
    while (
      parent?.type === "assessment" &&
      parent.attemptId === row.attempt.id &&
      !history.some((event) => event.id === parent!.id)
    ) {
      history.unshift(parent);
      if (
        (parent.evaluator.kind === "rule" ||
          parent.evaluator.kind === "transformer") &&
        parent.evaluator.id !== "feedback-memory"
      )
        break;
      parent = parent.supersedes ? events.get(parent.supersedes) : undefined;
    }
    if (
      !parent ||
      parent.type !== "assessment" ||
      !["rule", "transformer"].includes(parent.evaluator.kind) ||
      parent.evaluator.id === "feedback-memory"
    ) {
      exclude("No valid earlier automated judgment is linked to this review.");
      continue;
    }
    result.cases.push({
      id: review.id,
      task,
      taskSha256,
      attempt: row.attempt,
      automated: parent,
      review,
      history,
      disagreement: parent.verdict !== review.verdict,
    });
  }
  return result;
}

/** Stop a known disputed judgment from recurring. Never promote reviewer text to a general grammar rule. */
export async function guardAssessmentWithFeedback(
  attempt: AttemptEvent,
  task: PracticeTask,
  proposal: AssessmentEvent,
  feedback: AssessmentFeedback,
  at: string,
  id: string,
): Promise<AssessmentEvent | null> {
  if (
    attempt.language !== feedback.language ||
    attempt.task.modality !== "writing" ||
    !matchesTask(attempt.task, task) ||
    proposal.attemptId !== attempt.id ||
    proposal.responseSha256 !== attempt.response.sha256 ||
    (await sha256(attempt.response.text)) !== attempt.response.sha256
  )
    return null;
  const taskHash = await sha256(JSON.stringify(task));
  if (attempt.task.definitionSha256 !== taskHash) return null;
  const cases = feedback.cases.filter(
    (row) =>
      row.taskSha256 === taskHash &&
      row.attempt.response.sha256 === attempt.response.sha256 &&
      row.attempt.response.text === attempt.response.text &&
      row.automated.evaluator.id === proposal.evaluator.id &&
      row.automated.evaluator.version === proposal.evaluator.version &&
      Date.parse(row.review.at) < Date.parse(at),
  );
  if (!cases.some((row) => row.review.verdict !== proposal.verdict))
    return null;
  const conflict = new Set(cases.map((row) => row.review.verdict)).size > 1;
  const previous = [...cases].sort(
    (a, b) => Date.parse(b.review.at) - Date.parse(a.review.at),
  )[0]!;
  const en = attempt.language === "en";
  const message = conflict
    ? en
      ? "Previous reviews of this exact response disagree. Saved for another review; no automatic correctness judgment was repeated."
      : "Frühere Bewertungen dieser exakten Antwort widersprechen sich. Zur erneuten Prüfung gespeichert; keine automatische Richtigkeitsbewertung wiederholt."
    : en
      ? "A previous reviewer disputed the checker's judgment of this exact response. Saved for review. Previous feedback: " +
        previous.review.feedback.slice(0, 4000)
      : "Eine frühere Prüfung widersprach der automatischen Bewertung dieser exakten Antwort. Zur Prüfung gespeichert. Frühere Rückmeldung: " +
        previous.review.feedback.slice(0, 4000);
  return parseAutomaticityEvent(
    {
      ...proposal,
      id,
      at: new Date(
        Math.max(Date.parse(at), Date.parse(proposal.at) + 1),
      ).toISOString(),
      verdict: "not_assessed",
      dimensions: {
        grammar: "unknown",
        target: "unknown",
        relevance: "unknown",
        opportunities: null,
      },
      evaluator: {
        id: "feedback-memory",
        version: "1",
        kind: "rule",
        scopeApproved: false,
        reviewId: previous.review.id,
      },
      uncertainty: true,
      confidence: null,
      feedback: message,
      correction: conflict ? null : previous.review.correction,
      spans: [],
      supersedes: proposal.id,
    },
    attempt.language,
  ) as AssessmentEvent;
}
