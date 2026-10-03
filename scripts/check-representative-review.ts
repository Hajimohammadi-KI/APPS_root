import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  REPRESENTATIVE_SCOPES,
  representativeTasks,
} from "../shared/learning-core/src/automaticity/representative-tasks";
import { resolveRepresentativeTask } from "../shared/learning-core/src/automaticity/representative-tasks";
import type { CurriculumPack } from "../shared/learning-core/src/automaticity/curriculum";
import {
  parseReviewLedger,
  validateReleaseReviews,
  type CoverageCell,
} from "./lib/automaticity-release-reviews";
const root = resolve(import.meta.dir, "..");
const ledgerPath =
  Bun.argv.find((a) => a.startsWith("--reviews="))?.slice(10) ??
  "docs/automaticity-representative-reviews.json";
const reviews = parseReviewLedger(
  JSON.parse(await readFile(resolve(root, ledgerPath), "utf8")),
);
const packs = new Map<string, CurriculumPack>(),
  cells: CoverageCell[] = [];
for (const language of ["en", "de"] as const) {
  const app =
    language === "en"
      ? "Apps/English/English-Automaticity"
      : "Apps/Deutsch-Automaticity";
  const pack = JSON.parse(
    await readFile(
      resolve(
        root,
        `${app}/apps/web/public/learning-core/curriculum-${language}.json`,
      ),
      "utf8",
    ),
  ) as CurriculumPack;
  const units = REPRESENTATIVE_SCOPES.filter((row) =>
    row.rule.startsWith(language + "."),
  ).map((scope) => {
    const original = pack.units.find(
      (unit) => unit.id === scope.constructionId,
    );
    if (!original)
      throw Error(`Missing representative unit ${scope.constructionId}`);
    const tasks = original.tasks.filter((task) => task.constructionAssessment);
    if (
      tasks.length !== representativeTasks(scope).length ||
      tasks.some((task) => !resolveRepresentativeTask(task))
    )
      throw Error(`Stale representative tasks ${scope.constructionId}`);
    // These flags exist only in the projected review view. The shared gate
    // validates the actual evidence and hashes below before counting a claim.
    // No full-curriculum source flags or runtime evaluator are modified.
    const claimed = tasks.map((task) => ({
      ...task,
      contentReview: reviews.some(
        (review) =>
          review.language === language &&
          review.constructionId === original.id &&
          review.stage === task.stage &&
          review.modality === task.modality,
      )
        ? ("human_reviewed" as const)
        : ("authored" as const),
    }));
    return {
      ...original,
      review: "human_reviewed" as const,
      tasks: claimed,
      retiredTasks: [],
    };
  });
  packs.set(language, { ...pack, units });
  for (const unit of units)
    for (const task of unit.tasks) {
      // Review flags may change only with separately recorded and validated evidence.
      const reviewed =
        unit.review === "human_reviewed" &&
        task.contentReview === "human_reviewed";
      cells.push({
        language,
        constructionId: unit.id,
        contentVersion: pack.version,
        mappingVersion: pack.mappingVersion,
        stage: task.stage,
        modality: task.modality,
        taskIds: [task.id],
        evaluator: "human-review-required",
        humanReview: reviewed ? "complete" : "pending",
        releaseEligible: reviewed,
      });
    }
}
const result = await validateReleaseReviews(root, cells, packs, reviews);
const verified =
  result.reviewedCells === 168 && result.evaluatorApprovedCells === 168;
const report = {
  at: new Date().toISOString(),
  status: verified ? "verified" : "pending_independent_review",
  requiredCells: 168,
  ...result,
  scope:
    "L01 representative subset only; full-curriculum coverage and seven-day learner outcomes are separate gates.",
};
await writeFile(
  resolve(root, "artifacts/l01-assessment/review-gate.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
if (Bun.argv.includes("--release") && !verified) process.exitCode = 2;
