// Imports the owner's decisions on learner comments from the private GitHub
// repository into shared/learning-core/content/learner-decisions-{en,de}.json.
// Only accepted answers and reviewed wrong forms are imported; "fix exercise"
// requests are listed for authoring. Run the curriculum build afterwards.
//
// Usage (PowerShell, from the repository root):
//   $env:LEARNER_FEEDBACK_GITHUB_TOKEN = "<token>"
//   $env:LEARNER_FEEDBACK_GITHUB_REPO = "<owner>/<repository>"
//   bun scripts/import-learner-decisions.ts [--check]
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  learnerFeedbackConfig,
  readDecidedLearnerFeedback,
} from "../shared/learning-core/src/automaticity/learner-feedback-server";
import {
  appendDecisionBatch,
  learnerDecisionRows,
  type LearnerDecisionFile,
} from "./lib/learner-decisions";

const config = learnerFeedbackConfig(process.env);
if (!config)
  throw Error(
    "Set LEARNER_FEEDBACK_GITHUB_TOKEN and LEARNER_FEEDBACK_GITHUB_REPO first.",
  );
const checkOnly = process.argv.includes("--check");
const rows = learnerDecisionRows(await readDecidedLearnerFeedback(config));
const today = new Date().toISOString().slice(0, 10);
let stale = false;
for (const language of ["en", "de"] as const) {
  const path = resolve(
    import.meta.dir,
    `../shared/learning-core/content/learner-decisions-${language}.json`,
  );
  const current = JSON.parse(
    await readFile(path, "utf8"),
  ) as LearnerDecisionFile;
  // A new batch per import; the date keeps task versions after earlier releases.
  const used = current.batches
    .map((batch) => batch.version)
    .filter((version) => version.startsWith(today)).length;
  const next = appendDecisionBatch(
    current,
    rows[language],
    `${today}.${used + 1}`,
  );
  if (next === current) {
    console.log(`${language}: no new decisions.`);
    continue;
  }
  stale = true;
  const added = next.batches.at(-1)!;
  if (!checkOnly) await writeFile(path, JSON.stringify(next, null, 2) + "\n");
  console.log(
    `${language}: ${added.decisions.length} new decisions ${checkOnly ? "not yet imported" : `written as batch ${added.version}`}.`,
  );
}
for (const fix of rows.fixes)
  console.log(
    `Fix requested (#${fix.issue}, ${fix.language}, ${fix.taskId}): ${fix.prompt}`,
  );
if (checkOnly && stale) process.exit(1);
