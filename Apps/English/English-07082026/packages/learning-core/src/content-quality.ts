import type { ContentUnit, LearningLanguage } from "./index";
import { validateContentUnit } from "./index";

export const CONTENT_QUALITY_RUBRIC_VERSION = "1.0.0" as const;
export const CONTENT_AGREEMENT_METHOD = "quadratic-weighted-kappa" as const;
export const CONTENT_AGREEMENT_THRESHOLD = 0.6 as const;

export type ContentReviewRole = "native-speaker" | "language-pedagogy";
export type ContentReviewDecision = "approve" | "revise" | "reject";
export type ContentReviewStatus =
  "awaiting-human-review" | "in-review" | "approved" | "rejected";
export type OrdinalRubricScore = 1 | 2 | 3 | 4;

export interface ContentRubricScores {
  readonly naturalness: OrdinalRubricScore;
  readonly cefrFit: OrdinalRubricScore;
  readonly taskValidity: OrdinalRubricScore;
  readonly culturalSafety: OrdinalRubricScore;
}

export interface ContentHumanReview {
  /** Pseudonymous identifier; never an email address or learner identifier. */
  readonly reviewerId: string;
  readonly roles: readonly ContentReviewRole[];
  readonly reviewedAt: string;
  readonly decision: ContentReviewDecision;
  readonly scores: ContentRubricScores;
}

export interface ContentReviewAdjudication {
  readonly adjudicatorId: string;
  readonly adjudicatedAt: string;
  readonly decision: Exclude<ContentReviewDecision, "revise">;
  readonly rationale: string;
}

export interface ContentQualityRecord {
  readonly rubricVersion: typeof CONTENT_QUALITY_RUBRIC_VERSION;
  readonly status: ContentReviewStatus;
  readonly reviews: readonly ContentHumanReview[];
  readonly adjudication?: ContentReviewAdjudication;
}

export type MediationActivity =
  | "relaying-specific-information"
  | "explaining-data"
  | "processing-text"
  | "facilitating-collaboration";

export interface MediationContentPilotItem extends ContentUnit {
  readonly language: LearningLanguage;
  readonly cefrLevel: "B1";
  readonly mediation: {
    readonly activity: MediationActivity;
    readonly sourceText: string;
    readonly guidedPrompt: string;
    readonly independentPrompt: string;
    readonly novelTransferPrompt: string;
  };
  readonly quality: ContentQualityRecord;
}

export interface ContentReleaseAssessment {
  readonly readyForDailyPlan: boolean;
  readonly agreement: {
    readonly method: typeof CONTENT_AGREEMENT_METHOD;
    readonly threshold: typeof CONTENT_AGREEMENT_THRESHOLD;
    readonly value: number | null;
    readonly status: "pass" | "fail" | "not-available";
  };
  readonly errors: readonly string[];
}

const SCORE_KEYS: readonly (keyof ContentRubricScores)[] = [
  "naturalness",
  "cefrFit",
  "taskValidity",
  "culturalSafety",
];

function normalizedTokens(value: string): readonly string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean);
}

/** Detects solution leakage through a shared contiguous phrase. */
export function hasVerbatimPhraseOverlap(
  source: string,
  candidate: string,
  phraseLength = 6,
): boolean {
  const sourceTokens = normalizedTokens(source);
  const candidateTokens = normalizedTokens(candidate);
  if (
    phraseLength < 2 ||
    sourceTokens.length < phraseLength ||
    candidateTokens.length < phraseLength
  ) {
    return false;
  }

  const sourcePhrases = new Set<string>();
  for (let index = 0; index <= sourceTokens.length - phraseLength; index += 1) {
    sourcePhrases.add(
      sourceTokens.slice(index, index + phraseLength).join(" "),
    );
  }
  for (
    let index = 0;
    index <= candidateTokens.length - phraseLength;
    index += 1
  ) {
    if (
      sourcePhrases.has(
        candidateTokens.slice(index, index + phraseLength).join(" "),
      )
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Quadratic weighted Cohen's kappa for two independent ordinal raters.
 * Returns null when the arrays are unusable; no agreement is inferred.
 */
export function calculateQuadraticWeightedKappa(
  first: readonly OrdinalRubricScore[],
  second: readonly OrdinalRubricScore[],
): number | null {
  if (first.length === 0 || first.length !== second.length) return null;

  const size = 4;
  const observed = Array.from({ length: size }, () =>
    Array<number>(size).fill(0),
  );
  const firstCounts = Array<number>(size).fill(0);
  const secondCounts = Array<number>(size).fill(0);

  for (let index = 0; index < first.length; index += 1) {
    const row = first[index]! - 1;
    const column = second[index]! - 1;
    observed[row]![column] = (observed[row]![column] ?? 0) + 1;
    firstCounts[row] = (firstCounts[row] ?? 0) + 1;
    secondCounts[column] = (secondCounts[column] ?? 0) + 1;
  }

  let observedDisagreement = 0;
  let expectedDisagreement = 0;
  const denominator = (size - 1) ** 2;
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const weight = (row - column) ** 2 / denominator;
      observedDisagreement += weight * (observed[row]![column]! / first.length);
      expectedDisagreement +=
        weight *
        ((firstCounts[row]! * secondCounts[column]!) / first.length ** 2);
    }
  }

  if (expectedDisagreement === 0) {
    return observedDisagreement === 0 ? 1 : null;
  }
  return Math.max(
    -1,
    Math.min(1, 1 - observedDisagreement / expectedDisagreement),
  );
}

function rubricValues(
  review: ContentHumanReview,
): readonly OrdinalRubricScore[] {
  return SCORE_KEYS.map((key) => review.scores[key]);
}

function requiresAdjudication(reviews: readonly ContentHumanReview[]): boolean {
  const [first, second] = reviews;
  if (!first || !second) return false;
  if (first.decision !== second.decision) return true;
  return SCORE_KEYS.some(
    (key) => Math.abs(first.scores[key] - second.scores[key]) >= 2,
  );
}

export function assessMediationContentRelease(
  item: MediationContentPilotItem,
): ContentReleaseAssessment {
  const errors = [...validateContentUnit(item)];
  const reviews = item.quality.reviews;
  const uniqueReviewerIds = new Set(
    reviews.map((review) => review.reviewerId.trim()).filter(Boolean),
  );
  const roles = new Set(reviews.flatMap((review) => review.roles));

  if (item.cefrLevel !== "B1") errors.push("pilot cefrLevel must be B1");
  if (!item.modes.includes("mediation"))
    errors.push("mediation mode is required");
  if (!item.modes.includes("transfer"))
    errors.push("transfer mode is required");
  if (!item.mediation.sourceText.trim())
    errors.push("mediation.sourceText is required");
  if (!item.mediation.guidedPrompt.trim())
    errors.push("mediation.guidedPrompt is required");
  if (!item.mediation.independentPrompt.trim())
    errors.push("mediation.independentPrompt is required");
  if (!item.mediation.novelTransferPrompt.trim())
    errors.push("mediation.novelTransferPrompt is required");
  if (
    hasVerbatimPhraseOverlap(
      item.mediation.sourceText,
      item.mediation.novelTransferPrompt,
    )
  ) {
    errors.push("novel transfer prompt leaks a source phrase");
  }
  if (item.quality.rubricVersion !== CONTENT_QUALITY_RUBRIC_VERSION)
    errors.push("unsupported content rubric version");
  if (item.quality.status !== "approved")
    errors.push("content quality status is not approved");
  if (!item.provenance.humanReviewed)
    errors.push("provenance is not human-reviewed");
  if (reviews.length !== 2 || uniqueReviewerIds.size !== 2)
    errors.push("two independent reviewers are required");
  if (!roles.has("native-speaker"))
    errors.push("a native-speaker review is required");
  if (!roles.has("language-pedagogy"))
    errors.push("a language-pedagogy review is required");
  if (
    reviews.some(
      (review) =>
        review.decision !== "approve" ||
        SCORE_KEYS.some((key) => review.scores[key] < 3),
    )
  ) {
    errors.push("all rubric criteria and reviewer decisions must pass");
  }
  if (
    requiresAdjudication(reviews) &&
    item.quality.adjudication?.decision !== "approve"
  ) {
    errors.push("review disagreement requires approving adjudication");
  }

  const first = reviews[0];
  const second = reviews[1];
  const agreementValue =
    first && second
      ? calculateQuadraticWeightedKappa(
          rubricValues(first),
          rubricValues(second),
        )
      : null;
  const agreementStatus =
    agreementValue === null
      ? "not-available"
      : agreementValue >= CONTENT_AGREEMENT_THRESHOLD
        ? "pass"
        : "fail";
  if (agreementStatus !== "pass")
    errors.push("inter-rater agreement has not passed");

  return {
    readyForDailyPlan: errors.length === 0,
    agreement: {
      method: CONTENT_AGREEMENT_METHOD,
      threshold: CONTENT_AGREEMENT_THRESHOLD,
      value: agreementValue,
      status: agreementStatus,
    },
    errors,
  };
}

export function filterDailyPlanEligibleMediationContent(
  items: readonly MediationContentPilotItem[],
): readonly MediationContentPilotItem[] {
  return items.filter(
    (item) => assessMediationContentRelease(item).readyForDailyPlan,
  );
}
