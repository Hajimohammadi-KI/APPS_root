import { isRecord, validDate } from "./contracts";

/** A learner's comment on one checked answer, sent only after a fresh consent
 * for the exact preview. It is review material for the app owner: neither the
 * comment nor the learner's claim changes a grade or becomes a training label
 * until the owner decides. */
export const LEARNER_FEEDBACK_POLICY = "learner-feedback-2026-11-01";
export const LEARNER_FEEDBACK_CATEGORIES = [
  "answer_correct",
  "feedback_unclear",
  "exercise_wrong",
  "other",
] as const;
export type LearnerFeedbackCategory =
  (typeof LEARNER_FEEDBACK_CATEGORIES)[number];
export const LEARNER_FEEDBACK_DECISIONS = [
  "accept_answer",
  "known_wrong",
  "fix_exercise",
  "no_change",
] as const;
export type LearnerFeedbackDecisionKind =
  (typeof LEARNER_FEEDBACK_DECISIONS)[number];
export type LearnerFeedbackState =
  | "received"
  | "answer_accepted"
  | "answer_rejected"
  | "exercise_fix_planned"
  | "no_change"
  | "withdrawn";

export interface LearnerFeedback {
  readonly kind: "automaticity.learner-feedback";
  readonly version: 1;
  readonly language: "en" | "de";
  readonly contentVersion: string;
  readonly release: string | null;
  readonly task: {
    readonly id: string;
    readonly version: string;
    readonly constructionId: string;
    readonly prompt: string;
    readonly acceptedAnswers: readonly string[];
  };
  readonly response: string;
  readonly check: {
    readonly verdict: string;
    readonly evaluator: string;
    readonly feedback: string;
  };
  readonly category: LearnerFeedbackCategory;
  readonly comment: string;
  readonly consent: {
    readonly policy: typeof LEARNER_FEEDBACK_POLICY;
    readonly at: string;
  };
}
export interface LearnerFeedbackDecision {
  readonly decision: LearnerFeedbackDecisionKind;
  /** The exact form accepted or rejected; empty for the other decisions. */
  readonly answer: string;
  /** Shown to future learners who give a rejected form. */
  readonly explanation: string;
  /** Shown only to the learner who sent the comment. */
  readonly reply: string;
  readonly decidedAt: string;
}

const LIMITS = {
  prompt: 1000,
  answer: 500,
  answers: 10,
  response: 2000,
  feedback: 2000,
  comment: 1000,
  explanation: 500,
  reply: 1000,
};
const token = /^[A-Za-z0-9._-]{1,40}$/u;
function text(
  value: unknown,
  max: number,
  label: string,
  required = true,
): string {
  if (typeof value !== "string") throw Error(`${label} is required.`);
  const trimmed = value.trim();
  if (required && !trimmed) throw Error(`${label} is required.`);
  if (trimmed.length > max)
    throw Error(`${label} is longer than ${max} characters.`);
  return trimmed;
}
const oneOf = <T extends string>(
  value: unknown,
  options: readonly T[],
  label: string,
): T => {
  if (!options.includes(value as T)) throw Error(`${label} is not supported.`);
  return value as T;
};

/** Keeps only the previewed fields; anything else a client adds is dropped. */
export function parseLearnerFeedback(raw: unknown): LearnerFeedback {
  if (!isRecord(raw) || raw.kind !== "automaticity.learner-feedback")
    throw Error("Learner feedback is required.");
  if (raw.version !== 1) throw Error("Unsupported learner feedback version.");
  const language = oneOf(raw.language, ["en", "de"] as const, "Language");
  const task = isRecord(raw.task) ? raw.task : {};
  const check = isRecord(raw.check) ? raw.check : {};
  const consent = isRecord(raw.consent) ? raw.consent : {};
  if (consent.policy !== LEARNER_FEEDBACK_POLICY || !validDate(consent.at))
    throw Error("Separate, current consent for this comment is required.");
  const id = text(task.id, 120, "Task id");
  if (!new RegExp(`^${language}\\.c\\.\\d{3}\\.[A-Za-z0-9._-]+$`, "u").test(id))
    throw Error("The task does not belong to this language.");
  const constructionId = text(task.constructionId, 20, "Construction");
  if (!id.startsWith(`${constructionId}.`))
    throw Error("The task does not belong to this construction.");
  const version = text(task.version, 40, "Task version");
  const contentVersion = text(raw.contentVersion, 40, "Content version");
  if (!token.test(version) || !token.test(contentVersion))
    throw Error("Invalid version.");
  if (
    raw.release !== null &&
    !(typeof raw.release === "string" && /^\d{4}\.\d{2}\.\d{2}\.\d+$/u.test(raw.release))
  )
    throw Error("Invalid release.");
  if (
    !Array.isArray(task.acceptedAnswers) ||
    task.acceptedAnswers.length > LIMITS.answers
  )
    throw Error("Stored answers are required.");
  return {
    kind: "automaticity.learner-feedback",
    version: 1,
    language,
    contentVersion,
    release: raw.release,
    task: {
      id,
      version,
      constructionId,
      prompt: text(task.prompt, LIMITS.prompt, "Prompt"),
      acceptedAnswers: task.acceptedAnswers.map((answer) =>
        text(answer, LIMITS.answer, "Stored answer"),
      ),
    },
    response: text(raw.response, LIMITS.response, "Answer"),
    check: {
      verdict: text(check.verdict, 40, "Verdict"),
      evaluator: text(check.evaluator, 80, "Evaluator"),
      feedback: text(check.feedback, LIMITS.feedback, "Feedback", false),
    },
    category: oneOf(raw.category, LEARNER_FEEDBACK_CATEGORIES, "Category"),
    comment: text(raw.comment, LIMITS.comment, "Comment", false),
    consent: { policy: LEARNER_FEEDBACK_POLICY, at: consent.at as string },
  };
}

/** A fence longer than any backtick run inside, so learner text stays literal:
 * no mentions, links, images or HTML in the rendered issue. */
function fenced(value: string, info = "text"): string {
  const longest = Math.max(
    3,
    ...(value.match(/`+/gu) ?? []).map((run) => run.length),
  );
  const marks = "`".repeat(longest + 1);
  return `${marks}${info}\n${value}\n${marks}`;
}
function fencedJson(body: string): unknown {
  const match = body.match(/(`{4,})json\n([\s\S]*?)\n\1(?=\n|$)/u);
  if (!match) return null;
  try {
    return JSON.parse(match[2]!);
  } catch {
    return null;
  }
}

const CATEGORY_TITLES: Record<LearnerFeedbackCategory, string> = {
  answer_correct: "My answer is correct",
  feedback_unclear: "I don't understand the feedback",
  exercise_wrong: "The exercise is wrong",
  other: "Other",
};
const ISSUE_MARKER = "<!-- automaticity-learner-feedback v1 -->";
const DECISION_MARKER = "<!-- automaticity-learner-feedback-decision v1 -->";

/** Issue text for the owner; `receipt` is the SHA-256 of the learner's secret. */
export function learnerFeedbackIssue(
  feedback: LearnerFeedback,
  receipt: string,
): { title: string; body: string; labels: string[] } {
  if (!/^[a-f0-9]{64}$/u.test(receipt)) throw Error("Invalid receipt.");
  const { task, check } = feedback;
  const body = [
    ISSUE_MARKER,
    `**Category:** ${CATEGORY_TITLES[feedback.category]}`,
    `**Exercise:** ${task.id} (task ${task.version}, content ${feedback.contentVersion}, release ${feedback.release ?? "unknown"})`,
    "**Prompt**",
    fenced(task.prompt),
    "**Stored answers**",
    fenced(task.acceptedAnswers.join("\n") || "(none)"),
    "**Learner answer**",
    fenced(feedback.response),
    `**App check:** ${check.verdict}`,
    fenced(`${check.evaluator}\n${check.feedback}`),
    "**Learner comment**",
    fenced(feedback.comment || "(none)"),
    "<details><summary>Machine-readable data</summary>",
    "",
    fenced(JSON.stringify({ ...feedback, receipt }, null, 2), "json"),
    "",
    "</details>",
  ].join("\n\n");
  return {
    title: `[${feedback.language}] ${feedback.category} · ${task.id}`,
    body,
    labels: [
      "learner-feedback",
      `app:${feedback.language}`,
      `category:${feedback.category}`,
    ],
  };
}

export function parseLearnerFeedbackIssue(
  body: string,
): { feedback: LearnerFeedback; receipt: string } | null {
  if (!body.startsWith(ISSUE_MARKER)) return null;
  const data = fencedJson(body);
  if (!isRecord(data) || typeof data.receipt !== "string") return null;
  if (!/^[a-f0-9]{64}$/u.test(data.receipt)) return null;
  try {
    return { feedback: parseLearnerFeedback(data), receipt: data.receipt };
  } catch {
    return null;
  }
}

export function learnerFeedbackState(
  labels: readonly string[],
  state: "open" | "closed",
): LearnerFeedbackState {
  if (labels.includes("withdrawn")) return "withdrawn";
  if (labels.includes("decision:accept_answer")) return "answer_accepted";
  if (labels.includes("decision:known_wrong")) return "answer_rejected";
  if (labels.includes("decision:fix_exercise")) return "exercise_fix_planned";
  if (labels.includes("decision:no_change")) return "no_change";
  return state === "closed" ? "no_change" : "received";
}

function parseDecision(raw: unknown): LearnerFeedbackDecision {
  if (!isRecord(raw)) throw Error("A decision is required.");
  const decision = oneOf(raw.decision, LEARNER_FEEDBACK_DECISIONS, "Decision");
  const needsAnswer = decision === "accept_answer" || decision === "known_wrong";
  const answer = text(raw.answer ?? "", LIMITS.response, "Answer", needsAnswer);
  const explanation = text(
    raw.explanation ?? "",
    LIMITS.explanation,
    "Explanation",
    decision === "known_wrong",
  );
  if (!validDate(raw.decidedAt)) throw Error("Decision date is required.");
  return {
    decision,
    answer: needsAnswer ? answer : "",
    explanation,
    reply: text(raw.reply ?? "", LIMITS.reply, "Reply", false),
    decidedAt: raw.decidedAt,
  };
}

/** The owner's decision as an issue comment; the reply is shown to the learner. */
export function learnerFeedbackDecisionComment(
  raw: LearnerFeedbackDecision,
): string {
  const decision = parseDecision(raw);
  return [
    DECISION_MARKER,
    `**Decision:** ${decision.decision}`,
    fenced(JSON.stringify(decision, null, 2), "json"),
  ].join("\n\n");
}

export function parseLearnerFeedbackDecision(
  body: string,
): LearnerFeedbackDecision | null {
  if (!body.startsWith(DECISION_MARKER)) return null;
  try {
    return parseDecision(fencedJson(body));
  } catch {
    return null;
  }
}
