import { expect, test } from "bun:test";
import {
  caseDigest, digest, policy, validateFreeze,
  type BenchmarkDraft, type BenchmarkManifest, type FrozenEvaluation, type PredictionRun,
} from "./model-benchmark";
import { qualificationPolicy } from "../../shared/learning-core/src/automaticity/qualification";

test("frozen evaluations bind to the same current policy as the numerical gate", () => {
  // A transport fixture, not a human-reviewed benchmark or model approval.
  const row: BenchmarkDraft = {
    id: "synthetic-final", language: "en", modality: "writing",
    contentVersion: "fixture", sourceId: "synthetic", license: "original fixture",
    constructionId: "agreement", rubricVersion: "fixture", partition: "final",
    itemFamily: "fixture", sourceGroup: "fixture", templateFamily: "fixture",
    learnerGroup: null, contentFingerprint: "a".repeat(64), category: "correct_alternative",
    expected: "pass", humanReviewIds: [], adjudicated: false,
    prompt: "Write a sentence.", response: "She writes.", acceptedAnswers: ["She writes."],
    taskVersion: "fixture", normalisation: { terminalFullStop: true }, authoredBy: "synthetic",
    reviewStatus: "pending", reviews: [], adjudication: null, audioSha256: null,
  };
  const manifest: BenchmarkManifest = {
    schemaVersion: 1, version: "synthetic", createdAt: "2026-09-01T00:00:00Z",
    purpose: "Policy hash transport regression only", cases: [row],
  };
  const run: PredictionRun = {
    schemaVersion: 1, candidate: { id: "synthetic", version: "1" },
    configurationSha256: "b".repeat(64), benchmarkVersion: manifest.version,
    manifestSha256: digest(JSON.stringify(manifest)), partition: "final",
    startedAt: "2026-09-04T12:00:00Z", finishedAt: "2026-09-04T12:01:00Z",
    predictions: [{ caseId: row.id, verdict: "pass", latencyMs: 1, cost: null,
      meaningPreserved: true, targetObserved: true }],
    caseHashes: { [row.id]: caseDigest(row) }, limit: "Synthetic fixture",
  };
  const freeze: FrozenEvaluation = {
    schemaVersion: 1, benchmarkVersion: manifest.version, manifestSha256: run.manifestSha256,
    policySha256: digest(JSON.stringify(policy)), frozenAt: "2026-09-04T11:00:00Z",
    candidate: run.candidate, configurationSha256: run.configurationSha256,
    calibration: { path: "synthetic.json", sha256: "c".repeat(64) }, finalCaseIds: [row.id],
  };
  expect(policy).toBe(qualificationPolicy);
  expect(() => validateFreeze(manifest, run, freeze)).not.toThrow();
  const previousPolicy = {
    version: "grammar-qualification-2026-09-05.2", minimumPerCategory: 20,
    maximumConsequentialErrors: 0, maximumSupportedAbstentionRate: 0.2, automaticallyApprove: false,
  };
  expect(() => validateFreeze(manifest, run, {
    ...freeze, policySha256: digest(JSON.stringify(previousPolicy)),
  })).toThrow("frozen configuration");
});
