import { expect, test } from "bun:test";
import { developmentCandidateReady, isPinnedDevelopmentRun } from "./holdout-policy";
test("development must have zero false passes and useful acceptance/detection in both languages", () => {
  const metric = { errors: 32, clean: 32, falseAccept: 0, trueAccept: 29, detectedErrors: 29 };
  const report = { split: "development", count: 128, languages: { en: { candidate: metric }, de: { candidate: metric } } };
  expect(developmentCandidateReady(report)).toBe(true);
  for (const change of [{ falseAccept: 1 }, { trueAccept: 28 }, { detectedErrors: 0 }, { trueAccept: 33 }, { errors: 31 }]) expect(developmentCandidateReady({ ...report, languages: { ...report.languages, en: { candidate: { ...metric, ...change } } } })).toBe(false);
  expect(developmentCandidateReady({ ...report, split: "holdout" })).toBe(false);
});

test("Gemma development identity is narrow and cannot authorize a different split or profile", () => {
  for (const run of ["writing-edits-gemma4-26b-development-direct-v1", "writing-edits-gemma4-26b-development-direct-v12", "writing-edits-27b-development-thinking-v1", "writing-context-development-direct-v1", "writing-qwen35-evidence-development-thinking-v1"])
    expect(isPinnedDevelopmentRun(run)).toBe(true);
  for (const run of ["writing-edits-gemma4-26b-development-thinking-v1", "writing-edits-gemma4-26b-holdout-direct-v1", "writing-edits-gemma4-26b-development-direct-v1/../../holdout", "../writing-edits-gemma4-26b-development-direct-v1", "writing-edits-gemma4-26b-development-direct-v1.json", "writing-edits-gemma4-27b-development-direct-v1", null])
    expect(isPinnedDevelopmentRun(run)).toBe(false);
});
