import { expect, test } from "bun:test";
import { developmentCandidateReady } from "./holdout-policy";
test("development must have zero false passes and useful acceptance/detection in both languages", () => {
  const metric = { errors: 32, clean: 32, falseAccept: 0, trueAccept: 29, detectedErrors: 29 };
  const report = { split: "development", count: 128, languages: { en: { candidate: metric }, de: { candidate: metric } } };
  expect(developmentCandidateReady(report)).toBe(true);
  for (const change of [{ falseAccept: 1 }, { trueAccept: 28 }, { detectedErrors: 0 }, { trueAccept: 33 }, { errors: 31 }]) expect(developmentCandidateReady({ ...report, languages: { ...report.languages, en: { candidate: { ...metric, ...change } } } })).toBe(false);
  expect(developmentCandidateReady({ ...report, split: "holdout" })).toBe(false);
});
