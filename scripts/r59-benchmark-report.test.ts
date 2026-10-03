import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { hash, writingMetrics } from "../research/assessment-benchmark/core";
import { completionDiagnostics } from "../research/assessment-benchmark/edit-decoding";
import { editDiagnostics, editScopeDiagnostics, loadEditCandidate } from "./r59-benchmark-report";

test("false corrections and disagreements are distinct from abstention and false acceptance", () => {
  const assessment = (verdict: "correct" | "incorrect", correction: string) => ({ verdict, correction, edits: [] });
  const phases = (a: ReturnType<typeof assessment> | null, b: ReturnType<typeof assessment> | null) => [a, b].map(value => ({ assessment: value, raw: null, failure: value ? null : "invalid", requestStarted: true }));
  const diagnostic = editDiagnostics([
    { language: "en", label: "clean", verdict: "incorrect", phases: phases(assessment("incorrect", "x"), assessment("incorrect", "x")) },
    { language: "en", label: "clean", verdict: "uncertain", phases: phases(assessment("incorrect", "x"), assessment("correct", "y")) },
    { language: "en", label: "error", verdict: "correct", phases: phases(assessment("correct", "z"), assessment("correct", "z")) },
    { language: "en", label: "clean", verdict: "uncertain", phases: phases(null, assessment("incorrect", "x")) },
    { language: "de", label: "error", verdict: "uncertain", phases: phases(assessment("incorrect", "a"), assessment("incorrect", "b")) },
  ]);
  expect(diagnostic.en).toEqual({ falseCorrections: 1, firstFalseCorrections: 2, reviewFalseCorrections: 2, reviewDisagreements: 1 });
  expect(diagnostic.de).toEqual({ falseCorrections: 0, firstFalseCorrections: 0, reviewFalseCorrections: 0, reviewDisagreements: 1 });
});

test("scope diagnostics retain context-only and no-op evidence without salvaging invalid edits", () => {
  const result = editScopeDiagnostics([
    { target: "A cat and a cat.", before: "bad context", after: "later", content: JSON.stringify({ edits: [
      { original: "bad context", replacement: "better context" },
      { original: "cat", replacement: "cat" },
      { original: "A cat", replacement: "A cat " },
      { original: "absent", replacement: "new" },
    ] }) },
    { target: "ok", before: "", after: "", content: undefined },
  ]);
  expect(result).toEqual({ quotedEdits: 4, uniqueTargetQuotes: 1, ambiguousTargetQuotes: 1, contextOnlyQuotes: 1, absentQuotes: 1, unchangedEdits: 2, unreadablePhases: 1 });
});

async function reportFixture(withCompletionDiagnostics = false) {
  const root = await mkdtemp(join(tmpdir(), "r59-report-test-"));
  const benchmark = join(root, "research/assessment-benchmark");
  const run = "synthetic-development", directory = join(benchmark, "runs", run);
  await mkdir(directory, { recursive: true });
  await mkdir(join(benchmark, "runs/writing-context-data-v2"), { recursive: true });
  const parser = await Bun.file(new URL("../research/assessment-benchmark/edit-assessment.ts", import.meta.url)).text();
  await Bun.write(join(benchmark, "edit-assessment.ts"), parser);
  await Bun.write(join(directory, "edit-assessment.ts.snapshot"), parser);
  const cases = [
    { id: "a", language: "en" as const, label: "clean" as const, text: "The door is open.", before: "", after: "", types: [] },
    { id: "b", language: "de" as const, label: "error" as const, text: "Er gehen.", before: "", after: "", types: ["R:VERB:SVA"] },
    { id: "c", language: "en" as const, label: "clean" as const, text: "It may rain.", before: "", after: "", types: [] },
  ];
  const successful = (target: string, uncertain = false) => ({
    assessment: { verdict: uncertain ? "uncertain" as const : "correct" as const, correction: target, edits: [] },
    raw: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ status: uncertain ? "uncertain" : "complete", edits: [] }) } }] },
    failure: null, requestStarted: true,
  });
  const rows = [
    { ...cases[0]!, verdict: "correct" as const, correction: cases[0]!.text, phases: [successful(cases[0]!.text), successful(cases[0]!.text)], elapsedMs: 10 },
    { ...cases[1]!, verdict: "uncertain" as const, correction: "", phases: [successful(cases[1]!.text, true), { assessment: null, raw: null, failure: "The operation timed out.", requestStarted: false }], elapsedMs: 90 },
    { ...cases[2]!, verdict: "correct" as const, correction: cases[2]!.text, phases: [successful(cases[2]!.text), successful(cases[2]!.text)], elapsedMs: 50 },
  ];
  const dataset = cases.map(row => JSON.stringify(row)).join("\n") + "\n";
  const predictions = rows.map(row => JSON.stringify(row)).join("\n") + "\n";
  const config = { codeHashes: { "edit-assessment.ts": hash(parser) }, split: "development", mode: "direct", candidateFingerprint: "a".repeat(64), selectionSha256: hash(dataset) };
  const phases = rows.flatMap(row => row.phases);
  const report = {
    split: config.split, mode: config.mode, candidateFingerprint: config.candidateFingerprint,
    configSha256: hash(JSON.stringify(config)), selectionSha256: config.selectionSha256, predictionsSha256: hash(predictions),
    count: 3, attemptedPhases: 6, requestsStarted: 5, structurallyValidCalls: 5,
    latencyMs: { median: 50, p95: 90 }, failures: { "The operation timed out.": 1 },
    languages: Object.fromEntries((["en", "de"] as const).map(language => {
      const subset = rows.filter(row => row.language === language);
      const metrics = (index?: number) => writingMetrics(subset.map(row => ({ label: row.label, verdict: index === undefined ? row.verdict : row.phases[index]!.assessment?.verdict ?? "uncertain" })));
      return [language, { candidate: metrics(), firstPass: metrics(0), reviewPass: metrics(1) }];
    })),
    ...(withCompletionDiagnostics ? { completionDiagnostics: completionDiagnostics(phases), explicitUncertaintyCalls: 1, bothPhasesAssessed: 2 } : {}),
  };
  await Bun.write(join(benchmark, "runs/writing-context-data-v2/development.jsonl"), dataset);
  await Bun.write(join(directory, "predictions.jsonl"), predictions);
  await Bun.write(join(directory, "config.json"), JSON.stringify(config));
  await Bun.write(join(directory, "public-report.json"), JSON.stringify(report));
  return { root, run, directory, report, config };
}

async function removeReportFixture(root: string) {
  const absolute = resolve(root);
  if (dirname(absolute) !== resolve(tmpdir()) || !basename(absolute).startsWith("r59-report-test-")) throw Error("Unexpected test fixture path");
  await rm(absolute, { recursive: true, force: true });
}

test("loader rejects tampered operational totals and latency, including old reports without completion diagnostics", async () => {
  const fixture = await reportFixture();
  try {
    await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).resolves.toBeDefined();
    for (const change of [
      { attemptedPhases: 5 }, { requestsStarted: 6 }, { structurallyValidCalls: 6 },
      { latencyMs: { median: 10, p95: 90 } }, { latencyMs: { median: 50, p95: 50 } },
      { failures: {} },
    ]) {
      await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify({ ...fixture.report, ...change }));
      await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).rejects.toThrow("Operational diagnostics mismatch");
    }
  } finally { await removeReportFixture(fixture.root); }
});

test("loader binds report identity, mode and development selection to the hashed config", async () => {
  const fixture = await reportFixture();
  try {
    for (const change of [{ candidateFingerprint: "b".repeat(64) }, { mode: "thinking" }, { split: "holdout" }, { selectionSha256: "b".repeat(64) }]) {
      await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify({ ...fixture.report, ...change }));
      await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).rejects.toThrow("Report/config identity mismatch");
    }
    // Keep the config's own hash valid: the missing check was its link to the actual selected data.
    const config = { ...fixture.config, selectionSha256: "b".repeat(64) };
    await Bun.write(join(fixture.directory, "config.json"), JSON.stringify(config));
    await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify({ ...fixture.report, configSha256: hash(JSON.stringify(config)) }));
    await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).rejects.toThrow("Report/config identity mismatch");
  } finally { await removeReportFixture(fixture.root); }
});

test("loader verifies new completion diagnostics without excluding uncertain or unstarted phases", async () => {
  const fixture = await reportFixture(true);
  try {
    await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).resolves.toBeDefined();
    for (const change of [{ explicitUncertaintyCalls: 0 }, { bothPhasesAssessed: 3 }, { completionDiagnostics: {} }]) {
      await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify({ ...fixture.report, ...change }));
      await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).rejects.toThrow("Completion diagnostics mismatch");
    }
    const config = { ...fixture.config, mode: "thinking" };
    const report = { ...fixture.report, mode: config.mode, configSha256: hash(JSON.stringify(config)) };
    await Bun.write(join(fixture.directory, "config.json"), JSON.stringify(config));
    await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify(report));
    await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).resolves.toBeDefined();
    const { completionDiagnostics: _completion, explicitUncertaintyCalls: _uncertainty, bothPhasesAssessed: _both, ...withoutDiagnostics } = report;
    await Bun.write(join(fixture.directory, "public-report.json"), JSON.stringify(withoutDiagnostics));
    await expect(loadEditCandidate(fixture.root, fixture.run, "synthetic")).rejects.toThrow("Completion diagnostics mismatch");
  } finally { await removeReportFixture(fixture.root); }
});
