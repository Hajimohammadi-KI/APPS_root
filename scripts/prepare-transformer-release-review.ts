import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { isRecord } from "../shared/learning-core/src/automaticity/contracts";
import {
  parseBenchmarkInput,
  qualifyCandidate,
} from "../shared/learning-core/src/automaticity/qualification";
import {
  transformerConfigurationSha256,
  type TransformerConfig,
} from "../shared/learning-core/src/automaticity/transformer";
import {
  digest,
  evidenceFile,
  validateEvaluationEvidence,
  type BenchmarkDraft,
  type PredictionRun,
} from "./lib/model-benchmark";
const root = resolve(import.meta.dir, ".."),
  [inputPath, outputPath] = Bun.argv.slice(2);
if (!inputPath || !outputPath)
  throw Error(
    "Usage: bun scripts/prepare-transformer-release-review.ts qualification-input.json NEW-packet.json",
  );
const text = await readFile(resolve(root, inputPath), "utf8"),
  value: unknown = JSON.parse(text),
  input = parseBenchmarkInput(value);
await validateEvaluationEvidence(root, input);
if (
  !qualifyCandidate(input.cases, input.predictions, input.candidate)
    .eligibleForReleaseReview
)
  throw Error("No qualified final scopes are ready for release review");
const refs = value as {
  evaluationEvidence: { run: { path: string; sha256: string } };
};
const run = JSON.parse(
  await evidenceFile(root, refs.evaluationEvidence.run),
) as PredictionRun;
const config = JSON.parse(
  await readFile(
    resolve(root, "docs/model-evaluation/transformer-candidate.json"),
    "utf8",
  ),
) as TransformerConfig;
const configurationSha256 = await transformerConfigurationSha256(config);
if (
  input.candidate.id !== config.candidateId ||
  input.candidate.version !== config.version ||
  run.configuration?.providerConfigurationSha256 !== configurationSha256
)
  throw Error("Evaluated candidate differs from the current configuration");
const rows = input.cases.filter(
  (row) => row.partition === "final",
) as BenchmarkDraft[];
if (!run.outputObservations || run.outputObservations.length !== rows.length)
  throw Error("Every raw final model output must be retained in the run");
const contexts = rows.map((row) => {
  const output = run.outputObservations!.find(
    (value) => isRecord(value) && value.caseId === row.id,
  );
  if (!output) throw Error("Missing raw model output");
  return {
    caseId: row.id,
    language: row.language,
    prompt: row.prompt,
    originalResponse: row.response,
    reviewedVerdict: row.expected,
    modelOutput: output,
    outputSha256: digest(JSON.stringify(output)),
  };
});
const packet = {
  schemaVersion: 1,
  kind: "transformer-release-review-packet",
  status: "awaiting_actual_independent_review",
  candidate: input.candidate,
  instructions: [
    "Read every original response, model verdict, explanation, correction and style proposal. Scores alone do not prove that feedback is suitable for a learner.",
    "Fill reviewDraft with your actual judgments and save that object in a separate review JSON file. Use null for correction checks when no correction was proposed. A negative judgment prevents release.",
    "Reviewer identity, role, date, decision and notes must describe a real independent review. Empty fields are intentional. This packet is not approval and does not activate the model.",
  ],
  contexts,
  reviewDraft: {
    schemaVersion: 1,
    decision: null,
    reviewerId: null,
    role: null,
    note: "",
    reviewedAt: null,
    qualificationSha256: digest(text),
    configurationSha256,
    outputReviews: contexts.map((row) => ({
      caseId: row.caseId,
      outputSha256: row.outputSha256,
      verdictAppropriate: null,
      explanationAccurate: null,
      correctionCorrect: null,
      correctionPreservesMeaning: null,
      styleSeparated: null,
      note: "",
    })),
  },
};
const target = resolve(root, outputPath);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify(packet, null, 2) + "\n", { flag: "wx" });
console.log(
  JSON.stringify({ target, cases: contexts.length, approved: false }),
);
