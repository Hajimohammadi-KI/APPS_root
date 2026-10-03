import type { CurriculumPack } from "../../shared/learning-core/src/automaticity/curriculum";
import type { HumanReviewManifest } from "../../shared/learning-core/src/automaticity/human-review";
import { sha256, type CellReview } from "./automaticity-release-reviews";
/** Call only after validateReleaseReviews; compilation does not supply review judgments. */
export function buildHumanReviewManifest(
  pack: CurriculumPack,
  reviews: readonly CellReview[],
): HumanReviewManifest {
  return {
    schemaVersion: 1,
    language: pack.language,
    contentVersion: pack.version,
    mappingVersion: pack.mappingVersion,
    curriculumSha256: sha256(JSON.stringify(pack) + "\n"),
    scopes: reviews
      .filter((review) => review.language === pack.language)
      .flatMap((review) =>
        review.evaluators
          .filter((evaluator) => evaluator.kind === "human")
          .flatMap((evaluator) =>
            evaluator.taskIds.map((taskId) => {
              const task = pack.units
                .find((unit) => unit.id === review.constructionId)
                ?.tasks.find((task) => task.id === taskId);
              if (!task || task.contentReview !== "human_reviewed")
                throw Error("Human review scope has no reviewed task");
              return {
                taskId,
                taskVersion: task.version,
                rubricVersion: task.rubricVersion,
                definitionSha256: sha256(JSON.stringify(task)),
                reviewerName: evaluator.review.reviewerId,
                evaluatorId: evaluator.id,
                evaluatorVersion: evaluator.version,
                reviewId: review.id,
                approvedAt: evaluator.review.reviewedAt,
              };
            }),
          ),
      ),
  };
}
