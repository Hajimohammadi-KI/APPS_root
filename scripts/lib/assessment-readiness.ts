import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  activePracticeTasks,
  type CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import type { HumanReviewManifest } from "../../shared/learning-core/src/automaticity/human-review";
import {
  sha256,
  type CellReview,
  type CoverageCell,
} from "./automaticity-release-reviews";
import type { ReviewOutput } from "./review-output-transaction";

/** Reconstruct only actual active cells; this function cannot create approvals. */
export function deriveAssessmentCoverage(
  packs: readonly CurriculumPack[],
  reviews: readonly CellReview[],
): CoverageCell[] {
  return packs.flatMap((pack) =>
    pack.units.flatMap((unit) => {
      const active = activePracticeTasks(unit);
      return [
        ...new Set(active.map((task) => `${task.stage}:${task.modality}`)),
      ].map((key) => {
        const [stage, modality] = key.split(":") as [string, string];
        const tasks = active.filter(
          (task) => task.stage === stage && task.modality === modality,
        );
        const review = reviews.find(
          (row) =>
            row.language === pack.language &&
            row.constructionId === unit.id &&
            row.stage === stage &&
            row.modality === modality,
        );
        const approved = new Set(
          review?.evaluators.flatMap((row) => row.taskIds) ?? [],
        );
        const reviewed =
          !!review &&
          tasks.every((task) => task.contentReview === "human_reviewed");
        return {
          language: pack.language,
          constructionId: unit.id,
          contentVersion: pack.version,
          mappingVersion: pack.mappingVersion,
          stage,
          modality,
          taskIds: tasks.map((task) => task.id),
          humanReview: reviewed ? "complete" : "pending",
          evaluator: tasks.some((task) => task.answerPolicy === "closed")
            ? "closed-nfc-case-v1"
            : "human-review-required",
          releaseEligible:
            reviewed && tasks.every((task) => approved.has(task.id)),
        };
      });
    }),
  );
}

/** Include canonical build inputs in the same transaction as installed review outputs. */
export async function canonicalReviewOutputs(
  root: string,
  pack: CurriculumPack,
  manifest: HumanReviewManifest,
): Promise<ReviewOutput[]> {
  const values = [
    {
      path: `shared/learning-core/content/curriculum-${pack.language}.json`,
      contents: JSON.stringify(pack) + "\n",
    },
    {
      path: `shared/learning-core/content/review-approvals-${pack.language}.json`,
      contents: JSON.stringify(manifest, null, 2) + "\n",
    },
  ];
  if (
    manifest.curriculumSha256 !== sha256(values[0]!.contents) ||
    manifest.language !== pack.language ||
    manifest.contentVersion !== pack.version
  )
    throw new Error(
      "Canonical review manifest does not match the reviewed content",
    );
  return Promise.all(
    values.map(async (value) => ({
      ...value,
      expectedSha256: sha256(await readFile(resolve(root, value.path))),
    })),
  );
}
