import type { AssessmentFeedback } from "./assessment-feedback";
import type { CurriculumPack } from "./curriculum";
import { sha256 } from "./backup";
import { validDate } from "./contracts";

export const TRAINING_CONTRIBUTION_POLICY =
  "selected-written-example-2026-10-31";
export const MASTERY_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export interface TrainingCandidateInput {
  readonly caseId: string;
  readonly responseText: string;
  readonly reviewText: string;
  readonly contributionId: string;
  readonly at: string;
  readonly consent: {
    readonly granted: boolean;
    readonly purpose: "assessment-model-development";
    readonly policyVersion: string;
  };
}

/** A local contribution is untrusted development material. Neither the user's
 * review nor the recorded model judgment qualifies a label or mastery event.
 * Raw histories, people identifiers, recordings and original redacted text are
 * deliberately absent. This does not claim the remaining text is anonymous. */
export async function prepareTrainingCandidate(
  report: AssessmentFeedback,
  pack: CurriculumPack,
  input: TrainingCandidateInput,
) {
  const consent = input?.consent;
  if (
    !consent ||
    consent.granted !== true ||
    consent.purpose !== "assessment-model-development" ||
    consent.policyVersion !== TRAINING_CONTRIBUTION_POLICY
  )
    throw Error("Separate, current training contribution consent is required.");
  if (
    !validDate(input.at) ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/iu.test(
      input.contributionId,
    )
  )
    throw Error("Invalid contribution receipt.");
  if (
    typeof input.responseText !== "string" ||
    !input.responseText.trim() ||
    input.responseText.length > 8000 ||
    typeof input.reviewText !== "string" ||
    input.reviewText.length > 4000
  )
    throw Error("Review the selected text before contributing it.");
  if (
    report.kind !== "automaticity.assessment-feedback" ||
    report.language !== pack.language ||
    report.contentVersion !== pack.version
  )
    throw Error(
      "The feedback does not match the current language and content.",
    );
  const selected = report.cases.find((row) => row.id === input.caseId);
  const unit = pack.units.find(
    (row) => row.id === selected?.task.constructionId,
  );
  const task = unit?.tasks.find(
    (row) =>
      row.id === selected?.task.id && row.version === selected.task.version,
  );
  if (
    !selected ||
    !unit ||
    !task ||
    !MASTERY_LEVELS.some((level) => level === unit.level) ||
    selected.attempt.language !== pack.language ||
    selected.attempt.task.modality !== "writing" ||
    task.modality !== "writing" ||
    selected.review.evaluator.kind !== "human" ||
    selected.review.uncertainty
  )
    throw Error("A supported, selected written review is required.");
  const taskHash = await sha256(JSON.stringify(task));
  if (
    taskHash !== selected.taskSha256 ||
    taskHash !== selected.attempt.task.definitionSha256 ||
    (await sha256(selected.attempt.response.text)) !==
      selected.attempt.response.sha256
  )
    throw Error("The original response or task version has changed.");
  const responseHash = await sha256(input.responseText);
  return {
    kind: "automaticity.training-candidate" as const,
    version: 1 as const,
    contributionId: input.contributionId,
    createdAt: input.at,
    language: pack.language,
    level: unit.level as (typeof MASTERY_LEVELS)[number],
    contentVersion: pack.version,
    purpose: "human-review-for-assessment-model-development" as const,
    status: "candidate_only" as const,
    partition: "unassigned" as const,
    learnerGroupVerified: false as const,
    independentReviewEstablished: false as const,
    readyForTraining: false as const,
    label: null,
    consent: {
      purpose: consent.purpose,
      policyVersion: consent.policyVersion,
      grantedAt: input.at,
      scope: "this-selected-written-preview-only" as const,
    },
    task: {
      id: task.id,
      version: task.version,
      definitionSha256: taskHash,
      constructionId: task.constructionId,
      familyId: task.familyId,
      itemFamily: task.itemFamily,
      rubricVersion: task.rubricVersion,
      stage: task.stage,
      modality: "writing" as const,
    },
    response: { text: input.responseText, sha256: responseHash },
    originalJudgment: {
      verdict: selected.automated.verdict,
      evaluatorId: selected.automated.evaluator.id,
      evaluatorVersion: selected.automated.evaluator.version,
      appliesToPreview: responseHash === selected.attempt.response.sha256,
    },
    unverifiedFeedback: {
      text: input.reviewText,
      reportedVerdict: selected.review.verdict,
    },
    requiredBeforeTraining: [
      "rights-and-privacy-review",
      "independent-human-adjudication",
      "verified-learner-group",
      "frozen-partition-assignment",
    ] as const,
  };
}
