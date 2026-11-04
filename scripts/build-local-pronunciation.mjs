// Bun build for the local-only worker; model bytes stay in the canonical browser directory.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { localModelAssetManifest } from "../shared/learning-core/src/pronunciation-assessment.ts";
const root = resolve(import.meta.dirname, "..");
const engineSource = readFileSync(
  resolve(root, "shared/learning-core/src/vendor/hama-js/engine.js"),
);
if (
  createHash("sha256").update(engineSource).digest("hex") !==
  "89d38ad2791c3f758b9dd0bffe01f457e3c9233d9360ec475f25fc049f3ed693"
)
  throw new Error("Pinned hama-js runtime source changed.");
for (const item of localModelAssetManifest) {
  const bytes = readFileSync(
    resolve(
      root,
      "shared/learning-core/browser/local-phoneme/assets",
      item.file,
    ),
  );
  if (
    bytes.length !== item.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== item.sha256
  )
    throw new Error(`Invalid pinned model asset: ${item.file}`);
}
const result = await Bun.build({
  entrypoints: [
    resolve(root, "shared/learning-core/src/local-pronunciation-worker.ts"),
  ],
  outdir: resolve(root, "shared/learning-core/browser"),
  naming: "local-pronunciation-worker.js",
  target: "browser",
  format: "esm",
  minify: true,
});
if (!result.success)
  throw new AggregateError(
    result.logs,
    "Local pronunciation worker build failed",
  );
console.log(
  "Built local-only pronunciation worker with verified pinned assets.",
);
