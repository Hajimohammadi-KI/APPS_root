import { isRecord } from "../../shared/learning-core/src/automaticity/contracts";
import type { PracticeTask } from "../../shared/learning-core/src/automaticity/curriculum";

export interface ReviewScope {
  language: string;
  constructionId: string;
  stage: string;
  modality: string;
  contentVersion: string;
  mappingVersion: string;
  unitSha256: string;
}
export interface ReviewerRecord {
  reviewerId: string;
  role: string;
  reviewedAt: string;
  decision: "approved";
}
export interface EvaluatorScope {
  id: string;
  version: string;
  kind: string;
  taskIds: string[];
  rubricVersions: string[];
  benchmarkInput: { path: string; sha256: string } | null;
}
export const CONTENT_CHECKS = [
  "formAccurate",
  "meaningAccurate",
  "useAppropriate",
  "contrastsAccurate",
  "alternativesAccurate",
  "prerequisitesAppropriate",
  "sourcesChecked",
] as const;
export const CONTENT_TASK_CHECKS = [
  "promptClear",
  "targetElicited",
  "stageAppropriate",
  "modalityAppropriate",
  "answerPolicyAppropriate",
  "acceptedAnswersAccurate",
  "exposureHandled",
] as const;
export const EVALUATOR_TASK_CHECKS = [
  "criteriaMatchTarget",
  "alternativesHandled",
  "meaningChecked",
  "abstentionHandled",
  "exposureHandled",
] as const;
const scopeFields = [
  "language",
  "constructionId",
  "stage",
  "modality",
  "contentVersion",
  "mappingVersion",
  "unitSha256",
] as const;
const emptyChecks = (keys: readonly string[]) =>
  Object.fromEntries(keys.map((key) => [key, null]));
const sameMembers = (value: unknown, expected: readonly string[]) =>
  Array.isArray(value) &&
  value.every((item) => typeof item === "string") &&
  value.length === expected.length &&
  new Set(value).size === value.length &&
  expected.every((item) => value.includes(item));
const reviewedNote = (value: unknown) =>
  typeof value === "string" && value.trim().length >= 20;

/** A blank form only. No identity, decision or judgment is supplied by generation. */
export function createReviewEvidenceDraft(
  scope: ReviewScope,
  tasks: readonly PracticeTask[],
  evaluator: EvaluatorScope | null = null,
) {
  return {
    schemaVersion: 2,
    kind: evaluator
      ? "curriculum-evaluator-review"
      : "curriculum-content-review",
    provenance: null,
    reviewerId: null,
    role: null,
    reviewedAt: null,
    decision: null,
    scope: Object.fromEntries(scopeFields.map((key) => [key, scope[key]])),
    evaluator: evaluator
      ? {
          ...evaluator,
          taskIds: [...evaluator.taskIds],
          rubricVersions: [...evaluator.rubricVersions],
        }
      : null,
    checks: evaluator ? null : emptyChecks(CONTENT_CHECKS),
    note: "",
    taskReviews: tasks.map((task) => ({
      taskId: task.id,
      taskVersion: task.version,
      rubricVersion: task.rubricVersion,
      checks: emptyChecks(
        evaluator ? EVALUATOR_TASK_CHECKS : CONTENT_TASK_CHECKS,
      ),
      note: "",
    })),
  };
}

/** Checks the recorded evidence, not the real-world identity or competence of its author. */
export function validateReviewEvidence(
  value: unknown,
  reviewer: ReviewerRecord,
  scope: ReviewScope,
  tasks: readonly PracticeTask[],
  evaluator: EvaluatorScope | null = null,
): void {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 2 ||
    value.kind !==
      (evaluator
        ? "curriculum-evaluator-review"
        : "curriculum-content-review") ||
    value.provenance !== "human_review"
  )
    throw new Error("Structured human review evidence version 2 is required");
  if (
    ["reviewerId", "role", "reviewedAt", "decision"].some(
      (key) => value[key] !== reviewer[key as keyof ReviewerRecord],
    ) ||
    /codex|chatgpt|synthetic|fixture|automated/i.test(reviewer.reviewerId)
  )
    throw new Error(
      "Human review evidence identity does not match a recorded human reviewer",
    );
  const recordedScope = value.scope;
  if (
    !isRecord(recordedScope) ||
    scopeFields.some((key) => recordedScope[key] !== scope[key])
  )
    throw new Error(
      "Human review evidence does not cover this exact cell and content hash",
    );
  if (!reviewedNote(value.note))
    throw new Error("Human review needs a specific review note");
  if (evaluator) {
    const recorded = value.evaluator;
    if (
      !isRecord(recorded) ||
      ["id", "version", "kind"].some(
        (key) => recorded[key] !== evaluator[key as "id" | "version" | "kind"],
      ) ||
      !sameMembers(recorded.taskIds, evaluator.taskIds) ||
      !sameMembers(recorded.rubricVersions, evaluator.rubricVersions) ||
      (evaluator.benchmarkInput === null
        ? recorded.benchmarkInput !== null
        : !isRecord(recorded.benchmarkInput) ||
          recorded.benchmarkInput.path !== evaluator.benchmarkInput.path ||
          recorded.benchmarkInput.sha256 !== evaluator.benchmarkInput.sha256)
    )
      throw new Error(
        "Human review evidence does not cover this evaluator and benchmark",
      );
  } else {
    const checks = value.checks;
    if (
      value.evaluator !== null ||
      !isRecord(checks) ||
      CONTENT_CHECKS.some((key) => checks[key] !== true)
    )
      throw new Error("Content review has unresolved construction checks");
  }
  if (
    !Array.isArray(value.taskReviews) ||
    value.taskReviews.length !== tasks.length
  )
    throw new Error(
      "Human review evidence must cover every scoped task exactly once",
    );
  const seen = new Set<string>();
  for (const judgment of value.taskReviews) {
    if (
      !isRecord(judgment) ||
      typeof judgment.taskId !== "string" ||
      seen.has(judgment.taskId)
    )
      throw new Error("Duplicate or invalid reviewed task");
    const task = tasks.find((task) => task.id === judgment.taskId);
    if (
      !task ||
      judgment.taskVersion !== task.version ||
      judgment.rubricVersion !== task.rubricVersion
    )
      throw new Error(
        "Stale or unrelated task identity in human review evidence",
      );
    const checks = judgment.checks;
    if (
      !isRecord(checks) ||
      (evaluator ? EVALUATOR_TASK_CHECKS : CONTENT_TASK_CHECKS).some(
        (key) => checks[key] !== true,
      ) ||
      !reviewedNote(judgment.note)
    )
      throw new Error(`Unresolved task review judgments: ${task.id}`);
    seen.add(task.id);
  }
}
