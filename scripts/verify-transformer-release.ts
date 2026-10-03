import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildReviewedTransformerRelease } from "./lib/transformer-release";
import {
  digest,
  type BenchmarkDraft,
  type PredictionRun,
} from "./lib/model-benchmark";
import {
  transformerConfigurationSha256,
  type TransformerConfig,
} from "../shared/learning-core/src/automaticity/transformer";
import type { CandidatePrediction } from "../shared/learning-core/src/automaticity/qualification";
const root = resolve(import.meta.dir, ".."),
  folder = resolve(
    root,
    `artifacts/transformer-release-gates/${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
await mkdir(folder, { recursive: true });
const checks: string[] = [];
const config: TransformerConfig = {
  candidateId: "unit-test-only",
  version: "fixture-1",
  modelAlias: "fixture",
  modelSha256: "a".repeat(64),
  runtimeFingerprint: "fixture",
  endpoint: "http://127.0.0.1:8083/v1/chat/completions",
  timeoutMs: 1000,
};
const hash = await transformerConfigurationSha256(config);
const source = JSON.parse(
  await readFile(
    resolve(root, "docs/model-evaluation/development.json"),
    "utf8",
  ),
) as { cases: BenchmarkDraft[] };
const rows: BenchmarkDraft[] = Array.from({ length: 100 }, (_, i) => ({
  ...structuredClone(source.cases[i % 5]!),
  id: `synthetic-${i}`,
  partition: "final",
  taskVersion: "test-v1",
  humanReviewIds: ["fixture-A", "fixture-B"],
  adjudicated: true,
  authoredBy: "Unit test author",
  contentFingerprint: digest(String(i)),
}));
const predictions: CandidatePrediction[] = rows.map((row) => ({
  caseId: row.id,
  verdict: row.expected,
  targetObserved:
    row.category === "off_target"
      ? false
      : row.category === "ambiguous" || row.category === "asr_corruption"
        ? null
        : true,
  meaningPreserved: true,
  latencyMs: 1,
  cost: null,
}));
const input = {
    cases: rows,
    predictions,
    candidate: { id: config.candidateId, version: config.version },
  },
  inputText = JSON.stringify(input);
const run: PredictionRun = {
  schemaVersion: 1,
  candidate: input.candidate,
  configurationSha256: "b".repeat(64),
  configuration: { providerConfigurationSha256: hash },
  benchmarkVersion: "synthetic",
  manifestSha256: "c".repeat(64),
  partition: "final",
  startedAt: "2026-09-04T11:00:00Z",
  finishedAt: "2026-09-04T12:00:00Z",
  predictions,
  caseHashes: {},
  limit: "Unit test only; not a real evaluation",
  outputObservations: rows.map((row) => ({
    caseId: row.id,
    proposal: {
      verdict: row.expected,
      minimalCorrection:
        row.expected === "needs_repair" ? row.acceptedAnswers[0] : null,
      feedback:
        "Synthetic explanation for a compiler fixture; not a real assessment.",
    },
  })),
};
const review = {
  schemaVersion: 1,
  decision: "approved",
  reviewerId: "Unit test release reviewer",
  role: "Test-only role",
  note: "Fixture for release validation, not a human review.",
  qualificationSha256: digest(inputText),
  configurationSha256: hash,
  reviewedAt: "2026-09-04T13:00:00Z",
  outputReviews: run.outputObservations!.map((output) => {
    const row = output as { caseId: string; proposal: { verdict: string } };
    const repair = row.proposal.verdict === "needs_repair";
    return {
      caseId: row.caseId,
      outputSha256: digest(JSON.stringify(output)),
      verdictAppropriate: true,
      explanationAccurate: true,
      styleSeparated: true,
      correctionCorrect: repair ? true : null,
      correctionPreservesMeaning: repair ? true : null,
      note: "Synthetic output-review fixture, not a human judgment.",
    };
  }),
};
let status = "running",
  error: string | undefined;
try {
  const result = await buildReviewedTransformerRelease(
    input,
    inputText,
    run,
    config,
    JSON.stringify(review),
  );
  assert.equal(result.approvals[0]!.scopes.length, 1);
  checks.push("Synthetic qualified tuple compiles in memory only");
  for (const [name, change] of [
    ["self approval", { reviewerId: "Codex" }],
    ["same author", { reviewerId: "Unit test author" }],
    ["stale result", { qualificationSha256: "0".repeat(64) }],
    ["stale configuration", { configurationSha256: "0".repeat(64) }],
    ["review before evaluation", { reviewedAt: "2026-09-04T10:00:00Z" }],
    ["missing judgment", { decision: "pending" }],
    ["empty justification", { note: "" }],
    ["missing output review", { outputReviews: [] }],
    [
      "changed model feedback",
      {
        outputReviews: review.outputReviews.map((row, index) =>
          index ? row : { ...row, outputSha256: "0".repeat(64) },
        ),
      },
    ],
    [
      "inaccurate explanation",
      {
        outputReviews: review.outputReviews.map((row, index) =>
          index ? row : { ...row, explanationAccurate: false },
        ),
      },
    ],
    [
      "meaning-changing correction",
      {
        outputReviews: review.outputReviews.map((row, index) =>
          index !== 1 ? row : { ...row, correctionPreservesMeaning: false },
        ),
      },
    ],
  ] as const) {
    await assert.rejects(() =>
      buildReviewedTransformerRelease(
        input,
        inputText,
        run,
        config,
        JSON.stringify({ ...review, ...change }),
      ),
    );
    checks.push(`Rejects ${name}`);
  }
  await assert.rejects(
    () =>
      buildReviewedTransformerRelease(
        input,
        inputText,
        { ...run, configuration: {} },
        config,
        JSON.stringify(review),
      ),
    /pin/,
  );
  checks.push("Missing provider fingerprint rejected");
  const mixed = structuredClone(input);
  mixed.cases[0]!.taskVersion = "untested-v2";
  await assert.rejects(
    () =>
      buildReviewedTransformerRelease(
        mixed,
        JSON.stringify(mixed),
        run,
        config,
        JSON.stringify(review),
      ),
    /Each task version/,
  );
  checks.push("Versions cannot pool sample counts");
  const draft = { ...input, cases: source.cases };
  await assert.rejects(
    () =>
      buildReviewedTransformerRelease(
        draft,
        JSON.stringify(draft),
        run,
        config,
        JSON.stringify(review),
      ),
    /no qualified/,
  );
  checks.push("Actual unreviewed development cannot compile");
  // Exercise the real CLI entry point: scores without immutable evidence never create a release.
  const bare = resolve(folder, "synthetic-bare-input.json"),
    output = resolve(folder, "must-not-exist.json");
  await writeFile(bare, inputText);
  const child = Bun.spawn(
    [
      "bun",
      "scripts/compile-transformer-release.ts",
      bare,
      "not-a-review.json",
      output,
    ],
    { cwd: root, stdout: "pipe", stderr: "pipe" },
  );
  const stderr = await new Response(child.stderr).text();
  assert.notEqual(await child.exited, 0);
  assert.match(stderr, /Missing reviewed/);
  assert.equal(await Bun.file(output).exists(), false);
  checks.push("CLI refuses unbound scores without writing an approval");
  status = "passed";
} catch (caught) {
  status = "failed";
  error = String(caught);
  process.exitCode = 1;
}
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(
    {
      status,
      checks,
      error,
      limit: "Synthetic checks only. No approved release written or activated.",
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ status, checks: checks.length, error, folder }));
