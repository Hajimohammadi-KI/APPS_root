import { buildReviewedTransformerRelease } from "./lib/transformer-release";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  parseBenchmarkInput,
  qualifyCandidate,
} from "../shared/learning-core/src/automaticity/qualification";
import {
  transformerConfigurationSha256,
  type TransformerConfig,
} from "../shared/learning-core/src/automaticity/transformer";
import { validateTransformerRelease } from "../shared/learning-core/src/automaticity/transformer-route";
import {
  digest,
  evidenceFile,
  validateEvaluationEvidence,
  type PredictionRun,
} from "./lib/model-benchmark";
const root = resolve(import.meta.dir, ".."),
  [inputPath, reviewPath, outputPath] = Bun.argv.slice(2);
if (!inputPath || !reviewPath || !outputPath)
  throw Error(
    "Usage: bun scripts/compile-transformer-release.ts qualification-input.json independent-release-review.json NEW-release.json",
  );
const inputText = await readFile(resolve(root, inputPath), "utf8"),
  input = parseBenchmarkInput(JSON.parse(inputText));
await validateEvaluationEvidence(root, input);
const qualification = qualifyCandidate(
  input.cases,
  input.predictions,
  input.candidate,
);
if (!qualification.eligibleForReleaseReview)
  throw Error(
    `Candidate cannot be released: ${qualification.reasons.join("; ")}`,
  );
const config = JSON.parse(
  await readFile(
    resolve(root, "docs/model-evaluation/transformer-candidate.json"),
    "utf8",
  ),
) as TransformerConfig;
const configurationSha256 = await transformerConfigurationSha256(config);
if (
  config.candidateId !== input.candidate.id ||
  config.version !== input.candidate.version
)
  throw Error("Different model/configuration than the evaluated candidate");
const value = JSON.parse(inputText) as {
  evaluationEvidence: { run: { path: string; sha256: string } };
};
const run = JSON.parse(
  await evidenceFile(root, value.evaluationEvidence.run),
) as PredictionRun;
if (run.configuration?.providerConfigurationSha256 !== configurationSha256)
  throw Error("Final benchmark did not pin this provider configuration");
const release = await buildReviewedTransformerRelease(
  input,
  inputText,
  run,
  config,
  await readFile(resolve(root, reviewPath), "utf8"),
);
await validateTransformerRelease(release);
const output = resolve(root, outputPath);
await mkdir(dirname(output), { recursive: true });
const text = JSON.stringify(release, null, 2) + "\n";
await writeFile(output, text, { flag: "wx" });
console.log(
  JSON.stringify({
    output,
    sha256: digest(text),
    scopes: release.approvals.reduce((sum, row) => sum + row.scopes.length, 0),
    activated: false,
    instruction:
      "Set AUTOMATICITY_TRANSFORMER_RELEASE and AUTOMATICITY_TRANSFORMER_RELEASE_SHA256 on the server to this reviewed release. This command does not change settings.",
  }),
);
