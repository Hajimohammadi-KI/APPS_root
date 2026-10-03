import type {
  CurriculumPack,
  ConstructionUnit,
} from "../../shared/learning-core/src/automaticity/curriculum";
import { unitDigest } from "./automaticity-release-reviews";
import { activePracticeTasks } from "../../shared/learning-core/src/automaticity/curriculum";
import { createReviewEvidenceDraft } from "./curriculum-review-evidence";

export function createContentReviewPacket(
  pack: CurriculumPack,
  unit: ConstructionUnit,
) {
  const cells = [
    ...new Set(activePracticeTasks(unit).map((task) => `${task.stage}:${task.modality}`)),
  ];
  return {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    status: "awaiting_actual_human_review",
    instructions: [
      "Retired task definitions are included only to preserve historical work. Review the active tasks listed in reviewDrafts; retired tasks must not receive new release approval.",
      "Review the construction, sources, accepted alternatives, prerequisites and every task. Check that retrieval elicits the target without copying an exposed answer; check that writing and speaking tasks match their modality.",
      "The contentEvidenceDraft records construction checks and one judgment per task. Record specific findings, reviewer identity, role, date and decision only after actual review. Set provenance to human_review only for an actual human review. Blank fields and unresolved checks cannot pass.",
      "Save each completed evidence document as a separate workspace JSON file. Put its path and SHA-256, with the matching reviewer identity, date and decision, in the corresponding ledger entry. A generic note or a packet file is not accepted as evidence.",
      "The manualEvaluatorEvidenceDraft is a blank form for a documented human assessment procedure. Fill its evaluator ID and version and review every scoped task. Copy that exact evaluator scope and matching review reference into evaluators. Rules and Transformers also need qualified, hash-pinned final benchmark evidence.",
      "If any content changes, generate a new packet and review the changed unit. Only actual approved records belong in docs/automaticity-release-reviews.json. Update source review flags through a reviewed content change, then run the coverage gate.",
      "Generation preserves existing reviewer files. This packet is not curriculum approval, learner evidence or model activation.",
    ],
    content: unit,
    reviewDrafts: cells.map((key) => {
      const [stage, modality] = key.split(":") as [string, string];
      const tasks = activePracticeTasks(unit).filter(
        (task) => task.stage === stage && task.modality === modality,
      );
      const scope = {
        language: pack.language,
        constructionId: unit.id,
        stage,
        modality,
        contentVersion: pack.version,
        mappingVersion: pack.mappingVersion,
        unitSha256: unitDigest(unit),
      };
      const taskIds = tasks.map((task) => task.id);
      return {
        id: `review-${unit.id}-${stage}-${modality}`,
        ...scope,
        contentReview: {
          reviewerId: null,
          role: null,
          reviewedAt: null,
          decision: null,
          evidence: { path: null, sha256: null },
        },
        tasksNeedingEvaluatorApproval: tasks.map((task) => ({
          id: task.id,
          rubricVersion: task.rubricVersion,
          answerPolicy: task.answerPolicy,
        })),
        evaluators: [],
        contentEvidenceDraft: createReviewEvidenceDraft(scope, tasks),
        manualEvaluatorEvidenceDraft: createReviewEvidenceDraft(scope, tasks, {
          id: "",
          version: "",
          kind: "human",
          taskIds,
          rubricVersions: [...new Set(tasks.map((task) => task.rubricVersion))],
          benchmarkInput: null,
        }),
      };
    }),
  };
}
