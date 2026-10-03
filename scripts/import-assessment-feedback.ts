import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { feedbackDevelopmentManifest } from "./lib/assessment-feedback-import";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { digest } from "./lib/model-benchmark";
const root = resolve(import.meta.dir, ".."),
  path = Bun.argv[2];
if (!path)
  throw Error(
    "Pass a locally downloaded checker-feedback JSON file. No learner profile is read automatically.",
  );
const bytes = await readFile(resolve(root, path), "utf8");
if (bytes.length > 20_000_000) throw Error("Feedback export is too large");
const at = new Date().toISOString(),
  runtime = await loadRepresentativeRuntime(root);
const manifest = await feedbackDevelopmentManifest(
  JSON.parse(bytes),
  runtime.packs,
  at,
);
const folder = resolve(
  root,
  `artifacts/assessment-feedback-import/${at.replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, "development.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  { flag: "wx" },
);
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(
    {
      at,
      status: "imported_for_private_development",
      inputSha256: digest(bytes),
      manifestSha256: digest(JSON.stringify(manifest)),
      cases: manifest.cases.length,
      independentReviews: 0,
      approved: false,
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  JSON.stringify({
    folder,
    cases: manifest.cases.length,
    independentReviews: 0,
    approved: false,
  }),
);
