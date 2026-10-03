import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  activePracticeTasks,
  validateCurriculum,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";
import type { HumanReviewManifest } from "../shared/learning-core/src/automaticity/human-review";
import { reviseVariationTasks } from "./lib/variation-revisions";

const root = resolve(import.meta.dir, "..");
const checkOnly = Bun.argv.includes("--check");
const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");
const outputs: { path: string; contents: string }[] = [];
for (const [language, app] of [
  ["en", "Apps/English/English-Automaticity"],
  ["de", "Apps/Deutsch/Deutsch-Automaticity"],
] as const) {
  const source = JSON.parse(
    await readFile(
      resolve(root, `shared/learning-core/content/curriculum-${language}.json`),
      "utf8",
    ),
  ) as CurriculumPack;
  const manifest = JSON.parse(
    await readFile(
      resolve(
        root,
        `shared/learning-core/content/review-approvals-${language}.json`,
      ),
      "utf8",
    ),
  ) as HumanReviewManifest;
  const issues = validateCurriculum(source);
  if (issues.length || source.language !== language)
    throw new Error(`Invalid ${language} source: ${issues.join("; ")}`);
  if (
    manifest.schemaVersion !== 1 ||
    manifest.language !== language ||
    manifest.contentVersion !== source.version ||
    manifest.mappingVersion !== source.mappingVersion ||
    manifest.curriculumSha256 !== sha256(JSON.stringify(source) + "\n") ||
    !Array.isArray(manifest.scopes)
  )
    throw new Error(`Stale ${language} review manifest`);
  const pack = reviseVariationTasks(source);
  const revisedIssues = validateCurriculum(pack);
  if (revisedIssues.length) throw new Error(revisedIssues.join("\n"));
  const active = pack.units.flatMap(activePracticeTasks);
  for (const scope of manifest.scopes) {
    const task = active.find((task) => task.id === scope.taskId);
    if (
      !task ||
      task.contentReview !== "human_reviewed" ||
      task.version !== scope.taskVersion ||
      task.rubricVersion !== scope.rubricVersion ||
      sha256(JSON.stringify(task)) !== scope.definitionSha256
    )
      throw new Error(`Changed human review scope: ${scope.taskId}`);
  }
  const contents = JSON.stringify(pack) + "\n";
  const updatedManifest = {
    ...manifest,
    contentVersion: pack.version,
    curriculumSha256: sha256(contents),
  };
  outputs.push(
    {
      path: resolve(
        root,
        `${app}/apps/web/public/learning-core/curriculum-${language}.json`,
      ),
      contents,
    },
    {
      path: resolve(
        root,
        `${app}/apps/web/public/learning-core/review-approvals-${language}.json`,
      ),
      contents: JSON.stringify(updatedManifest, null, 2) + "\n",
    },
  );
  console.log(
    `${language}: ${pack.units.length} constructions; ${active.filter((task) => task.id.includes(".vary.pattern-20261002.")).length} variation replacements; historical tasks preserved`,
  );
}
// Validate both languages and every pinned review before writing any output.
for (const output of outputs) {
  if (checkOnly) {
    if ((await readFile(output.path, "utf8")) !== output.contents)
      throw new Error(`Stale curriculum: ${output.path}`);
  } else await writeFile(output.path, output.contents);
}
