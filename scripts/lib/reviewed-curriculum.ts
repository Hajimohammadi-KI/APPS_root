import {
  isRecord,
  validDate,
} from "../../shared/learning-core/src/automaticity/contracts";
import {
  activePracticeTasks,
  type CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import {
  parseReviewLedger,
  sha256,
  unitDigest,
  validateReleaseReviews,
  type CellReview,
  type CoverageCell,
} from "./automaticity-release-reviews";
import {
  validateReviewEvidence,
  type EvaluatorScope,
  type ReviewerRecord,
} from "./curriculum-review-evidence";

const key = (row: {
  language: string;
  constructionId: string;
  stage: string;
  modality: string;
}) => [row.language, row.constructionId, row.stage, row.modality].join(":");
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
function reviewer(value: Record<string, unknown>, now: string): ReviewerRecord {
  if (
    !nonempty(value.reviewerId) ||
    !nonempty(value.role) ||
    !validDate(value.reviewedAt) ||
    Date.parse(value.reviewedAt) > Date.parse(now) ||
    value.decision !== "approved"
  )
    throw Error(
      "An actual dated approved review with reviewer identity and role is required",
    );
  return {
    reviewerId: value.reviewerId,
    role: value.role,
    reviewedAt: value.reviewedAt,
    decision: "approved",
  };
}

/** Prepare new review records without changing the canonical catalog or a prior review. */
export function prepareCurriculumReviewImport(
  input: unknown,
  packs: ReadonlyMap<string, CurriculumPack>,
  cells: readonly CoverageCell[],
  existing: readonly CellReview[],
  folder: string,
  now: string,
) {
  if (
    !validDate(now) ||
    !/^artifacts\/curriculum-review-import\/[a-zA-Z0-9_-]+$/.test(folder)
  )
    throw Error("Invalid review import destination or date");
  if (
    !isRecord(input) ||
    input.schemaVersion !== 1 ||
    !Array.isArray(input.contentReviews) ||
    !input.contentReviews.length ||
    !Array.isArray(input.evaluatorReviews)
  )
    throw Error(
      "Provide completed contentReviews and evaluatorReviews; blank packets cannot approve content",
    );
  const reviews = structuredClone([...existing]),
    files: { path: string; contents: string }[] = [],
    added = new Map<string, CellReview>();
  const byKey = new Map(cells.map((cell) => [key(cell), cell]));
  const context = (value: unknown) => {
    if (
      !isRecord(value) ||
      !isRecord(value.scope) ||
      !["language", "constructionId", "stage", "modality"].every((field) =>
        nonempty(
          value.scope && (value.scope as Record<string, unknown>)[field],
        ),
      )
    )
      throw Error("Missing exact review scope");
    const cell = byKey.get(key(value.scope as unknown as CoverageCell)),
      pack = packs.get(String(value.scope.language));
    const constructionId = value.scope.constructionId;
    const unit = pack?.units.find((unit) => unit.id === constructionId);
    if (!cell || !pack || !unit)
      throw Error("Review scope is not in the active curriculum");
    const tasks = activePracticeTasks(unit).filter((task) =>
      cell.taskIds.includes(task.id),
    );
    const scope = {
      language: pack.language,
      constructionId: unit.id,
      stage: cell.stage,
      modality: cell.modality,
      contentVersion: pack.version,
      mappingVersion: pack.mappingVersion,
      unitSha256: unitDigest(unit),
    };
    return { value, cell, pack, unit, tasks, scope };
  };
  const reference = (document: unknown) => {
    const contents = JSON.stringify(document, null, 2) + "\n",
      hash = sha256(contents),
      path = `${folder}/evidence/${hash}.json`;
    if (!files.some((file) => file.path === path))
      files.push({ path, contents });
    return { path, sha256: hash };
  };
  for (const value of input.contentReviews) {
    const ctx = context(value),
      identity = reviewer(ctx.value, now),
      id = key(ctx.cell);
    if (added.has(id) || existing.some((row) => key(row) === id))
      throw Error(
        `A review already exists for ${id}; preserve it and resolve replacement explicitly`,
      );
    validateReviewEvidence(value, identity, ctx.scope, ctx.tasks);
    const row: CellReview = {
      id: `review-${sha256(JSON.stringify(ctx.scope)).slice(0, 20)}`,
      ...ctx.scope,
      contentReview: { ...identity, evidence: reference(value) },
      evaluators: [],
    };
    added.set(id, row);
    reviews.push(row);
  }
  for (const value of input.evaluatorReviews) {
    const ctx = context(value),
      record = added.get(key(ctx.cell)),
      identity = reviewer(ctx.value, now);
    if (!record)
      throw Error(
        "Evaluator import must accompany the exact newly reviewed content cell",
      );
    const raw = ctx.value.evaluator;
    if (
      !isRecord(raw) ||
      !nonempty(raw.id) ||
      !nonempty(raw.version) ||
      raw.kind !== "human" ||
      raw.benchmarkInput !== null ||
      !Array.isArray(raw.taskIds) ||
      !Array.isArray(raw.rubricVersions)
    )
      throw Error(
        "This importer accepts documented human evaluators only; automated scopes use the frozen model qualification compiler",
      );
    if (
      raw.taskIds.some((id) => typeof id !== "string") ||
      raw.rubricVersions.some((id) => typeof id !== "string")
    )
      throw Error("Invalid evaluator tasks or rubrics");
    const evaluator = raw as unknown as EvaluatorScope;
    const tasks = ctx.tasks.filter((task) =>
      evaluator.taskIds.includes(task.id),
    );
    if (
      !tasks.length ||
      new Set(evaluator.taskIds).size !== evaluator.taskIds.length ||
      tasks.length !== evaluator.taskIds.length ||
      tasks.some(
        (task) => !evaluator.rubricVersions.includes(task.rubricVersion),
      ) ||
      Date.parse(identity.reviewedAt) <
        Date.parse(record.contentReview.reviewedAt)
    )
      throw Error("Incomplete, duplicate or premature evaluator scope");
    if (
      record.evaluators.some((old) =>
        old.taskIds.some((id) => evaluator.taskIds.includes(id)),
      )
    )
      throw Error("Duplicate evaluator assignment");
    validateReviewEvidence(value, identity, ctx.scope, tasks, evaluator);
    record.evaluators.push({
      ...evaluator,
      kind: "human",
      review: { ...identity, evidence: reference(value) },
    });
  }
  parseReviewLedger({ schemaVersion: 1, reviews });
  return { reviews, files, addedCells: added.size };
}

/** Flags follow validated records, never the other way round. Input packs and cells are immutable. */
export async function applyCurriculumReviews(
  root: string,
  originalPacks: ReadonlyMap<string, CurriculumPack>,
  originalCells: readonly CoverageCell[],
  reviews: readonly CellReview[],
  now = new Date().toISOString(),
) {
  const packs = new Map(
      [...originalPacks].map(([lang, pack]) => [lang, structuredClone(pack)]),
    ),
    cells = structuredClone([...originalCells]);
  // Strip review claims before validating records against their original task content.
  for (const pack of packs.values())
    for (const unit of pack.units) {
      unit.review = "authored";
      for (const task of activePracticeTasks(unit))
        task.contentReview = "authored";
    }
  for (const cell of cells) {
    cell.humanReview = "pending";
    cell.releaseEligible = false;
  }
  await validateReleaseReviews(root, cells, packs, reviews, now);
  for (const review of reviews) {
    const cell = cells.find((cell) => key(cell) === key(review))!,
      pack = packs.get(review.language)!,
      unit = pack.units.find((unit) => unit.id === review.constructionId)!;
    unit.review = "human_reviewed";
    for (const task of activePracticeTasks(unit))
      if (cell.taskIds.includes(task.id)) task.contentReview = "human_reviewed";
    cell.humanReview = "complete";
    const approved = new Set(
      review.evaluators.flatMap((evaluator) => evaluator.taskIds),
    );
    cell.releaseEligible = cell.taskIds.every((id) => approved.has(id));
  }
  const verification = await validateReleaseReviews(
    root,
    cells,
    packs,
    reviews,
    now,
  );
  return { packs, cells, ...verification };
}
