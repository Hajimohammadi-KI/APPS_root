import { expect, test } from "bun:test";
import { r56BenchmarkSection, type NamedCandidate } from "./r56-benchmark-report";
const metric = { count: 64, errors: 32, clean: 32, falseAccept: 0, trueAccept: 32, detectedErrors: 32, abstentions: 0, diagnosticScreenPassed: false };
const good: NamedCandidate = { name: "Candidate", report: { count: 128, mode: "thinking", latencyMs: { median: 100, p95: 200 }, languages: { en: { candidate: metric, groups: 64 }, de: { candidate: metric, groups: 64 } }, releaseEligible: false } };
test("no completed report does not imply failed development or an untouched holdout", () => {
  const pending = r56BenchmarkSection([good], null, "unused");
  expect(pending).toContain("یک تنظیم شرط اولیه");
  expect(pending).not.toContain("هیچ تنظیمی");
  expect(r56BenchmarkSection([good], null, "interrupted")).toContain("دیگر دست‌نخورده محسوب نمی‌شود");
  expect(() => r56BenchmarkSection([good], null, "completed")).toThrow();
});
