import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { validateEvaluationEvidence } from "./lib/model-benchmark";
import {
  parseBenchmarkInput,
  qualifyCandidate,
} from "../shared/learning-core/src/automaticity/qualification";
const inputPath = Bun.argv[2];
if (!inputPath)
  throw new Error(
    "Usage: bun scripts/qualify-automaticity-model.ts <reviewed-cases-and-predictions.json>",
  );
const input = parseBenchmarkInput(
  JSON.parse(await readFile(resolve(inputPath), "utf8")),
);
const report = qualifyCandidate(
  input.cases,
  input.predictions,
  input.candidate,
);
try { await validateEvaluationEvidence(resolve(import.meta.dir,".."),input); }
catch(error) { report.eligibleForReleaseReview=false; report.reasons.push(String(error)); }
const target = resolve(
  import.meta.dir,
  `../artifacts/model-qualification/${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(report, null, 2));
console.log(target);
console.log(
  report.eligibleForReleaseReview
    ? "Ready for an independent release review. No model was activated."
    : `Not qualified: ${report.reasons.join("; ")}`,
);
if (!report.eligibleForReleaseReview) process.exitCode = 2;
