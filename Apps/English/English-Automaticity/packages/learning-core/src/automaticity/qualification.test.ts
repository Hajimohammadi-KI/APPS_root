import { expect, test } from "bun:test";
import {
  qualifyCandidate,
  parseBenchmarkInput,
  type BenchmarkCase,
  type CandidatePrediction,
} from "./qualification";
const candidate = { id: "synthetic-test-model", version: "1" };
const categories = [
  "correct_alternative",
  "grammar_error",
  "ambiguous",
  "off_target",
  "asr_corruption",
] as const;
const cases: BenchmarkCase[] = categories.flatMap((category, index) =>
  Array.from(
    {
      length:
        category === "correct_alternative" || category === "grammar_error"
          ? 100
          : 20,
    },
    (_, i) => ({
      id: `${index}-${i}`,
      language: "en",
      modality: "writing",
      contentVersion: "synthetic-1",
      sourceId: "synthetic-test-fixture",
      license: "Original synthetic test fixture",
      constructionId: "en.c.001",
      rubricVersion: "1",
      partition: "final",
      itemFamily: `${index}-${i}`,
      sourceGroup: `source-${index}-${i}`,
      templateFamily: `template-${index}-${i}`,
      learnerGroup: null,
      contentFingerprint: `${index}${i.toString(16).padStart(2, "0")}`.padEnd(
        64,
        "a",
      ),
      category,
      expected:
        category === "correct_alternative"
          ? "pass"
          : category === "grammar_error"
            ? "needs_repair"
            : "not_assessed",
      humanReviewIds: ["synthetic-review-A", "synthetic-review-B"],
      adjudicated: true,
    }),
  ),
);
const predictions: CandidatePrediction[] = cases.map((row) => ({
  caseId: row.id,
  verdict: row.expected,
  latencyMs: 20,
  meaningPreserved: true,
  targetObserved: true,
  cost: null,
}));
test("passing synthetic checks still require independent release approval", () => {
  const report = qualifyCandidate(cases, predictions, candidate);
  expect(report.eligibleForReleaseReview).toBe(true);
  expect(report.automaticallyApproved).toBe(false);
  expect(report.scopes[0]?.reportedCost).toBeNull();
  expect(report.scopes[0]?.falseCorrectionUpper95).toBeLessThan(0.05);
  expect(report.scopes[0]?.correctAcceptanceLower95).toBeGreaterThan(0.9);
  expect(report.scopes[0]?.errorDetectionLower95).toBeGreaterThan(0.9);
});
test("small perfect samples and one accepted error cannot qualify", () => {
  const small = cases.filter((row) => Number(row.id.split("-")[1]) < 20);
  const smallIds = new Set(small.map((row) => row.id));
  expect(
    qualifyCandidate(
      small,
      predictions.filter((row) => smallIds.has(row.caseId)),
      candidate,
    ).eligibleForReleaseReview,
  ).toBe(false);
  const errorId = cases.find((row) => row.category === "grammar_error")!.id;
  const changed = predictions.map((row) =>
    row.caseId === errorId ? { ...row, verdict: "pass" as const } : row,
  );
  const report = qualifyCandidate(cases, changed, candidate);
  expect(report.eligibleForReleaseReview).toBe(false);
  expect(report.scopes[0]?.missedErrors).toBe(1);
});
test("duplicating final content cannot manufacture the minimum sample size", () => {
  const duplicated = cases.map((row) => ({
    ...row,
    contentFingerprint: row.id.split("-")[0]!.padEnd(64, "b"),
  }));
  const report = qualifyCandidate(duplicated, predictions, candidate);
  expect(report.eligibleForReleaseReview).toBe(false);
  expect(
    report.reasons.some((reason) => reason.includes("Duplicate content")),
  ).toBe(true);
});
test("abstentions remain in both useful-coverage denominators", () => {
  for (const category of ["correct_alternative", "grammar_error"]) {
    const abstained = new Set(
      cases
        .filter((row) => row.category === category)
        .slice(0, 5)
        .map((row) => row.id),
    );
    const changed = predictions.map((row) =>
      abstained.has(row.caseId)
        ? { ...row, verdict: "not_assessed" as const }
        : row,
    );
    const report = qualifyCandidate(cases, changed, candidate);
    expect(report.eligibleForReleaseReview).toBe(false);
    expect(report.reasons.some((reason) => reason.includes("reliable"))).toBe(
      true,
    );
  }
});
test("writing coverage cannot silently qualify speech or a new content version", () => {
  const mixed = cases.map((row, index) => ({
    ...row,
    modality: index % 2 ? ("speaking" as const) : ("writing" as const),
  }));
  const result = qualifyCandidate(mixed, predictions, candidate);
  expect(result.scopes).toHaveLength(2);
  expect(result.eligibleForReleaseReview).toBe(false);
  expect(
    qualifyCandidate(
      cases.map((row, index) => ({
        ...row,
        contentVersion: index % 2 ? "changed" : "original",
      })),
      predictions,
      candidate,
    ).eligibleForReleaseReview,
  ).toBe(false);
});
test("unreviewed samples and leaked item families cannot qualify a model", () => {
  const report = qualifyCandidate(
    [
      ...cases.map((row) => ({ ...row, humanReviewIds: [] })),
      { ...cases[0]!, id: "development-duplicate", partition: "development" },
    ],
    predictions,
    candidate,
  );
  expect(report.eligibleForReleaseReview).toBe(false);
  expect(report.reasons.some((reason) => reason.includes("leakage"))).toBe(
    true,
  );
});
test("false corrections, missing predictions and indiscriminate abstention fail", () => {
  expect(
    qualifyCandidate(
      cases,
      [
        { ...predictions[0]!, verdict: "needs_repair" },
        ...predictions.slice(1),
      ],
      candidate,
    ).eligibleForReleaseReview,
  ).toBe(false);
  expect(
    qualifyCandidate(cases, predictions.slice(1), candidate)
      .eligibleForReleaseReview,
  ).toBe(false);
  expect(
    qualifyCandidate(
      cases,
      predictions.map((row) => ({ ...row, verdict: "not_assessed" })),
      candidate,
    ).eligibleForReleaseReview,
  ).toBe(false);
});
test("malformed external benchmark records are rejected", () => {
  expect(() =>
    parseBenchmarkInput({
      candidate,
      cases: [{ id: "broken" }],
      predictions: [],
    }),
  ).toThrow();
});
test("a passing prediction with an absent target is rejected", () => {
  const changed = predictions.map((row, index) =>
    index ? row : { ...row, targetObserved: false },
  );
  const report = qualifyCandidate(cases, changed, candidate);
  expect(report.eligibleForReleaseReview).toBe(false);
  expect(report.scopes[0]?.targetContradictions).toBe(1);
});
for (const field of [
  "sourceGroup",
  "templateFamily",
  "learnerGroup",
  "contentFingerprint",
] as const)
  test(`shared ${field} cannot leak across partitions`, () => {
    const final = { ...cases[0]!, learnerGroup: "learner-one" };
    const development = {
      ...cases[1]!,
      id: "development",
      partition: "development" as const,
      learnerGroup: "learner-two",
    };
    development[field] = final[field];
    expect(
      qualifyCandidate(
        [...cases.slice(2), final, development],
        predictions,
        candidate,
      ).reasons.some((reason) => reason.includes("Partition leakage")),
    ).toBe(true);
  });
