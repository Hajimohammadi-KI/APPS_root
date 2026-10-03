import {
  isRecord,
  type Language,
  type Modality,
  type Verdict,
} from "./contracts";
/** The same policy is hashed into frozen evaluations and enforced below. */
export const qualificationPolicy = Object.freeze({
  version: "grammar-qualification-2026-10-03.3",
  reportVersion: 2,
  minimumPerCategory: Object.freeze({
    correct_alternative: 100,
    grammar_error: 100,
    ambiguous: 20,
    off_target: 20,
    asr_corruption: 20,
  }),
  maximumConsequentialErrors: 0,
  maximumSupportedAbstentionRate: 0.2,
  minimumCorrectAcceptanceLower95: 0.9,
  minimumErrorDetectionLower95: 0.9,
  maximumFalseAcceptanceUpper95: 0.05,
  confidenceMethod: "Wilson two-sided 95%",
  confidenceZ: 1.959963984540054,
  coverageDenominator: "all original cases in each primary class",
  duplicateContent: "reject within the same scope and partition",
  automaticallyApprove: false,
} as const);
export interface BenchmarkCase {
  id: string;
  language: Language;
  modality: Modality;
  contentVersion: string;
  sourceId: string;
  license: string;
  constructionId: string;
  rubricVersion: string;
  partition: "development" | "calibration" | "final";
  itemFamily: string;
  sourceGroup: string;
  templateFamily: string;
  learnerGroup: string | null;
  contentFingerprint: string;
  category:
    | "correct_alternative"
    | "grammar_error"
    | "ambiguous"
    | "off_target"
    | "asr_corruption";
  expected: Verdict;
  humanReviewIds: string[];
  adjudicated: boolean;
}
export interface CandidatePrediction {
  caseId: string;
  verdict: Verdict;
  latencyMs: number;
  meaningPreserved: boolean | null;
  targetObserved: boolean | null;
  cost: number | null;
}
export interface QualificationReport {
  version: 1;
  policyVersion: 2;
  candidate: { id: string; version: string };
  eligibleForReleaseReview: boolean;
  automaticallyApproved: false;
  reasons: string[];
  scopes: {
    language: Language;
    modality: Modality;
    contentVersion: string;
    constructionId: string;
    rubricVersion: string;
    sampleSize: number;
    falseCorrections: number;
    correctAlternativeCases: number;
    falseCorrectionRate: number | null;
    falseCorrectionUpper95: number | null;
    missedErrors: number;
    grammarErrorCases: number;
    missedErrorRate: number | null;
    falseAcceptanceUpper95: number | null;
    correctAcceptances: number;
    correctAcceptanceLower95: number | null;
    detectedErrors: number;
    errorDetectionLower95: number | null;
    abstentions: number;
    meaningChanges: number;
    unsafePasses: number;
    targetContradictions: number;
    assessedCoverage: number | null;
    p95LatencyMs: number | null;
    medianLatencyMs: number | null;
    reportedCost: number | null;
  }[];
}
const categories: BenchmarkCase["category"][] = [
  "correct_alternative",
  "grammar_error",
  "ambiguous",
  "off_target",
  "asr_corruption",
];
function upperWilson(errors: number, total: number): number | null {
  if (!total) return null;
  const p = errors / total,
    z = qualificationPolicy.confidenceZ,
    z2 = z * z;
  return Math.min(
    1,
    (p +
      z2 / (2 * total) +
      z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) /
      (1 + z2 / total),
  );
}
/** Evaluation never trains on held-out items and never approves its own model. */
export function qualifyCandidate(
  cases: readonly BenchmarkCase[],
  predictions: readonly CandidatePrediction[],
  candidate: { id: string; version: string },
): QualificationReport {
  const reasons: string[] = [];
  if (!candidate.id.trim() || !candidate.version.trim())
    reasons.push("A pinned candidate identity is required.");
  const ids = new Set<string>(),
    families = new Map<string, string>(),
    scopedContents = new Set<string>();
  for (const row of cases) {
    if (
      !["writing", "speaking"].includes(row.modality) ||
      !row.contentVersion?.trim() ||
      !row.sourceId?.trim() ||
      !row.license?.trim()
    )
      reasons.push(
        `Missing modality, content version or source rights ${row.id}`,
      );
    if (ids.has(row.id)) reasons.push(`Duplicate case ${row.id}`);
    ids.add(row.id);
    const scopedContent = `${row.language}:${row.modality}:${row.constructionId}:${row.contentVersion}:${row.rubricVersion}:${row.partition}:${row.contentFingerprint}`;
    if (scopedContents.has(scopedContent))
      reasons.push(`Duplicate content within assessment scope ${row.id}`);
    scopedContents.add(scopedContent);
    if (
      !row.sourceGroup?.trim() ||
      !row.templateFamily?.trim() ||
      !/^[a-f0-9]{64}$/.test(row.contentFingerprint) ||
      (row.learnerGroup !== null && !row.learnerGroup?.trim())
    )
      reasons.push(`Missing partition provenance ${row.id}`);
    for (const family of [
      `item:${row.itemFamily}`,
      `source:${row.sourceGroup}`,
      `template:${row.templateFamily}`,
      `content:${row.contentFingerprint}`,
      ...(row.learnerGroup ? [`learner:${row.learnerGroup}`] : []),
    ]) {
      const partition = families.get(family);
      if (partition && partition !== row.partition)
        reasons.push(`Partition leakage ${family}`);
      families.set(family, row.partition);
    }
    if (
      row.humanReviewIds.filter((value) => value.trim()).length < 2 ||
      new Set(row.humanReviewIds).size < 2 ||
      !row.adjudicated
    )
      reasons.push(`Human review incomplete ${row.id}`);
  }
  const byId = new Map<string, CandidatePrediction>();
  for (const row of predictions) {
    if (
      byId.has(row.caseId) ||
      !ids.has(row.caseId) ||
      !Number.isFinite(row.latencyMs) ||
      row.latencyMs < 0 ||
      !(
        [
          "pass",
          "needs_repair",
          "target_not_observed",
          "not_assessed",
        ] as string[]
      ).includes(row.verdict) ||
      (row.cost !== null && (!Number.isFinite(row.cost) || row.cost < 0))
    )
      reasons.push(`Invalid prediction ${row.caseId}`);
    else byId.set(row.caseId, row);
  }
  const final = cases.filter((row) => row.partition === "final");
  if (!final.length) reasons.push("No reviewed final-test cases.");
  const groups = new Map<string, BenchmarkCase[]>();
  for (const row of final) {
    const key = `${row.language}:${row.modality}:${row.constructionId}:${row.contentVersion}:${row.rubricVersion}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const scopes = [...groups.values()].map((rows) => {
    const first = rows[0]!;
    for (const category of categories)
      if (
        rows.filter((row) => row.category === category).length <
        qualificationPolicy.minimumPerCategory[category]
      )
        reasons.push(
          `Insufficient ${category} coverage for ${first.constructionId}`,
        );
    if (rows.some((row) => !byId.has(row.id)))
      reasons.push(`Missing predictions for ${first.constructionId}`);
    const available = rows.flatMap((row) => {
      const prediction = byId.get(row.id);
      return prediction ? [{ row, prediction }] : [];
    });
    const falseCorrections = available.filter(
      ({ row, prediction }) =>
        row.category === "correct_alternative" &&
        prediction.verdict === "needs_repair",
    ).length;
    const missedErrors = available.filter(
      ({ row, prediction }) =>
        row.category === "grammar_error" && prediction.verdict === "pass",
    ).length;
    const correctAlternativeCases = rows.filter(
      (row) => row.category === "correct_alternative",
    ).length;
    const grammarErrorCases = rows.filter(
      (row) => row.category === "grammar_error",
    ).length;
    const correctAcceptances = available.filter(
      ({ row, prediction }) =>
        row.category === "correct_alternative" && prediction.verdict === "pass",
    ).length;
    const detectedErrors = available.filter(
      ({ row, prediction }) =>
        row.category === "grammar_error" &&
        prediction.verdict === "needs_repair",
    ).length;
    // Missing and unassessed predictions remain in the original class totals.
    // These sentence bounds are descriptive: clustered cases need separate review.
    const correctAcceptanceUpperFailure = upperWilson(
      correctAlternativeCases - correctAcceptances,
      correctAlternativeCases,
    );
    const errorDetectionUpperFailure = upperWilson(
      grammarErrorCases - detectedErrors,
      grammarErrorCases,
    );
    const correctAcceptanceLower95 =
      correctAcceptanceUpperFailure === null
        ? null
        : 1 - correctAcceptanceUpperFailure;
    const errorDetectionLower95 =
      errorDetectionUpperFailure === null
        ? null
        : 1 - errorDetectionUpperFailure;
    const falseAcceptanceUpper95 = upperWilson(missedErrors, grammarErrorCases);
    if (
      correctAcceptanceLower95 === null ||
      correctAcceptanceLower95 <
        qualificationPolicy.minimumCorrectAcceptanceLower95 ||
      errorDetectionLower95 === null ||
      errorDetectionLower95 <
        qualificationPolicy.minimumErrorDetectionLower95 ||
      falseAcceptanceUpper95 === null ||
      falseAcceptanceUpper95 > qualificationPolicy.maximumFalseAcceptanceUpper95
    )
      reasons.push(
        `Insufficient reliable correct acceptance or error detection for ${first.constructionId}`,
      );
    const meaningChanges = available.filter(
      ({ prediction }) => prediction.meaningPreserved === false,
    ).length;
    const riskyPasses = available.filter(
      ({ row, prediction }) =>
        ["ambiguous", "off_target", "asr_corruption"].includes(row.category) &&
        prediction.verdict === "pass",
    ).length;
    const disagreements = available.filter(
      ({ row, prediction }) =>
        row.expected !== prediction.verdict &&
        prediction.verdict !== "not_assessed",
    ).length;
    const targetContradictions = available.filter(
      ({ prediction }) =>
        prediction.verdict === "pass" && prediction.targetObserved !== true,
    ).length;
    if (
      Math.max(
        falseCorrections,
        missedErrors,
        meaningChanges,
        riskyPasses,
        targetContradictions,
        disagreements,
      ) > qualificationPolicy.maximumConsequentialErrors
    )
      reasons.push(`Consequential judgment errors in ${first.constructionId}`);
    const abstentions = available.filter(
      ({ prediction }) => prediction.verdict === "not_assessed",
    ).length;
    const supported = available.filter(({ row }) =>
      ["correct_alternative", "grammar_error"].includes(row.category),
    );
    if (
      !supported.length ||
      supported.filter(
        ({ prediction }) => prediction.verdict === "not_assessed",
      ).length /
        supported.length >
        qualificationPolicy.maximumSupportedAbstentionRate
    )
      reasons.push(
        `Insufficient assessed coverage for ${first.constructionId}`,
      );
    if (
      supported
        .filter(({ prediction }) => prediction.verdict !== "not_assessed")
        .some(
          ({ prediction }) =>
            prediction.meaningPreserved === null ||
            prediction.targetObserved === null,
        )
    )
      reasons.push(
        `Missing meaning or target judgments for ${first.constructionId}`,
      );
    const times = available
      .map(({ prediction }) => prediction.latencyMs)
      .sort((a, b) => a - b);
    return {
      language: first.language,
      modality: first.modality,
      contentVersion: first.contentVersion,
      constructionId: first.constructionId,
      rubricVersion: first.rubricVersion,
      sampleSize: rows.length,
      falseCorrections,
      correctAlternativeCases,
      falseCorrectionRate: available.filter(
        ({ row }) => row.category === "correct_alternative",
      ).length
        ? falseCorrections /
          available.filter(({ row }) => row.category === "correct_alternative")
            .length
        : null,
      falseCorrectionUpper95: upperWilson(
        falseCorrections,
        available.filter(({ row }) => row.category === "correct_alternative")
          .length,
      ),
      missedErrors,
      grammarErrorCases,
      falseAcceptanceUpper95,
      correctAcceptances,
      correctAcceptanceLower95,
      detectedErrors,
      errorDetectionLower95,
      missedErrorRate: available.filter(
        ({ row }) => row.category === "grammar_error",
      ).length
        ? missedErrors /
          available.filter(({ row }) => row.category === "grammar_error").length
        : null,
      abstentions,
      meaningChanges,
      unsafePasses: riskyPasses,
      targetContradictions,
      assessedCoverage: supported.length
        ? supported.filter(
            ({ prediction }) => prediction.verdict !== "not_assessed",
          ).length / supported.length
        : null,
      p95LatencyMs: times.length
        ? times[Math.ceil(times.length * 0.95) - 1]!
        : null,
      medianLatencyMs: times.length
        ? times.length % 2
          ? times[Math.floor(times.length / 2)]!
          : (times[times.length / 2 - 1]! + times[times.length / 2]!) / 2
        : null,
      reportedCost: available.some(({ prediction }) => prediction.cost === null)
        ? null
        : available.reduce(
            (sum, { prediction }) => sum + (prediction.cost ?? 0),
            0,
          ),
    };
  });
  return {
    version: 1,
    policyVersion: qualificationPolicy.reportVersion,
    candidate,
    eligibleForReleaseReview: reasons.length === 0,
    automaticallyApproved: false,
    reasons: [...new Set(reasons)],
    scopes,
  };
}

export function parseBenchmarkInput(value: unknown): {
  cases: BenchmarkCase[];
  predictions: CandidatePrediction[];
  candidate: { id: string; version: string };
} {
  if (
    !isRecord(value) ||
    !isRecord(value.candidate) ||
    typeof value.candidate.id !== "string" ||
    typeof value.candidate.version !== "string" ||
    !Array.isArray(value.cases) ||
    !Array.isArray(value.predictions)
  )
    throw new Error("Invalid benchmark input");
  for (const row of value.cases)
    if (
      !isRecord(row) ||
      ![
        "id",
        "constructionId",
        "rubricVersion",
        "itemFamily",
        "contentVersion",
        "sourceId",
        "license",
        "sourceGroup",
        "templateFamily",
        "contentFingerprint",
      ].every((key) => typeof row[key] === "string" && row[key]) ||
      !["en", "de"].includes(String(row.language)) ||
      !["writing", "speaking"].includes(String(row.modality)) ||
      !["development", "calibration", "final"].includes(
        String(row.partition),
      ) ||
      !categories.includes(row.category as BenchmarkCase["category"]) ||
      !["pass", "needs_repair", "target_not_observed", "not_assessed"].includes(
        String(row.expected),
      ) ||
      !Array.isArray(row.humanReviewIds) ||
      row.humanReviewIds.some((id) => typeof id !== "string") ||
      typeof row.adjudicated !== "boolean" ||
      (row.learnerGroup !== null && typeof row.learnerGroup !== "string")
    )
      throw new Error("Invalid benchmark case");
  for (const row of value.predictions)
    if (
      !isRecord(row) ||
      typeof row.caseId !== "string" ||
      typeof row.latencyMs !== "number" ||
      (row.cost !== null && typeof row.cost !== "number") ||
      ![true, false, null].includes(row.meaningPreserved as boolean | null) ||
      ![true, false, null].includes(row.targetObserved as boolean | null)
    )
      throw new Error("Invalid candidate prediction");
  return value as unknown as {
    cases: BenchmarkCase[];
    predictions: CandidatePrediction[];
    candidate: { id: string; version: string };
  };
}
