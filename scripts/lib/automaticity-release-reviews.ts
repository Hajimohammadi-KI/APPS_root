import { createHash } from "node:crypto";
import { activePracticeTasks } from "../../shared/learning-core/src/automaticity/curriculum";
import { readFile, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import type {
  ConstructionUnit,
  CurriculumPack,
} from "../../shared/learning-core/src/automaticity/curriculum";
import { validateEvaluationEvidence } from "./model-benchmark";
import {
  validateReviewEvidence,
  type ReviewScope,
  type EvaluatorScope,
} from "./curriculum-review-evidence";
import type { PracticeTask } from "../../shared/learning-core/src/automaticity/curriculum";
import {
  isRecord,
  validDate,
} from "../../shared/learning-core/src/automaticity/contracts";
import {
  parseBenchmarkInput,
  qualifyCandidate,
} from "../../shared/learning-core/src/automaticity/qualification";

export interface CoverageCell {
  language: string;
  contentVersion: string;
  mappingVersion: string;
  constructionId: string;
  stage: string;
  modality: string;
  taskIds: string[];
  humanReview: string;
  evaluator: string;
  releaseEligible: boolean;
}
interface ArtifactReference {
  path: string;
  sha256: string;
}
interface HumanReview {
  reviewerId: string;
  role: string;
  reviewedAt: string;
  decision: "approved";
  evidence: ArtifactReference;
}
interface EvaluatorApproval {
  id: string;
  version: string;
  kind: "human" | "rule" | "transformer";
  taskIds: string[];
  rubricVersions: string[];
  review: HumanReview;
  benchmarkInput: ArtifactReference | null;
}
export interface CellReview {
  id: string;
  language: string;
  constructionId: string;
  stage: string;
  modality: string;
  contentVersion: string;
  mappingVersion: string;
  unitSha256: string;
  contentReview: HumanReview;
  evaluators: EvaluatorApproval[];
}
export const sha256 = (text: string | Uint8Array) =>
  createHash("sha256").update(text).digest("hex");
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (isRecord(value))
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stable(value[key])]),
    );
  return value;
}
/** Only review flags are excluded; prompts, variants, source mappings and versions remain pinned. */
export function unitDigest(unit: ConstructionUnit): string {
  const { review: _review, tasks, ...content } = unit;
  return sha256(
    JSON.stringify(
      stable({
        ...content,
        tasks: tasks.map(({ contentReview: _status, ...task }) => task),
      }),
    ),
  );
}
const nonempty = (value: unknown): value is string =>
  typeof value === "string" && !!value.trim();
const validHash = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const cellKey = (cell: {
  language: string;
  constructionId: string;
  stage: string;
  modality: string;
}) => [cell.language, cell.constructionId, cell.stage, cell.modality].join(":");
export function parseReviewLedger(value: unknown): CellReview[] {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.reviews)
  )
    throw new Error("Invalid curriculum review ledger");
  const ids = new Set<string>(),
    cells = new Set<string>();
  return value.reviews.map((row: unknown) => {
    if (
      !isRecord(row) ||
      ![
        "id",
        "language",
        "constructionId",
        "stage",
        "modality",
        "contentVersion",
        "mappingVersion",
      ].every((key) => nonempty(row[key])) ||
      !validHash(row.unitSha256) ||
      !Array.isArray(row.evaluators)
    )
      throw new Error("Invalid curriculum cell review");
    const review = row as unknown as CellReview,
      key = cellKey(review);
    if (ids.has(review.id) || cells.has(key))
      throw new Error(`Duplicate curriculum review ${key}`);
    ids.add(review.id);
    cells.add(key);
    return review;
  });
}
async function artifact(
  root: string,
  reference: ArtifactReference,
): Promise<Buffer> {
  if (
    !isRecord(reference) ||
    !nonempty(reference.path) ||
    isAbsolute(reference.path) ||
    !validHash(reference.sha256)
  )
    throw new Error("Review needs a workspace-relative artifact and SHA-256");
  const base = await realpath(root),
    file = await realpath(resolve(base, reference.path));
  const rel = relative(base, file);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw new Error("Review artifact is outside the workspace");
  const bytes = await readFile(file);
  if (sha256(bytes) !== reference.sha256)
    throw new Error(`Review artifact hash mismatch: ${reference.path}`);
  return bytes;
}
async function humanReview(
  root: string,
  value: HumanReview,
  now: string,
  scope: ReviewScope,
  tasks: readonly PracticeTask[],
  evaluator: EvaluatorScope | null = null,
): Promise<void> {
  if (
    !isRecord(value) ||
    !nonempty(value.reviewerId) ||
    !nonempty(value.role) ||
    value.decision !== "approved" ||
    !validDate(value.reviewedAt) ||
    Date.parse(value.reviewedAt) > Date.parse(now)
  )
    throw new Error(
      "A dated, approved human review with reviewer identity and role is required",
    );
  const bytes = await artifact(root, value.evidence);
  let evidence: unknown;
  try {
    evidence = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error("Structured human review evidence version 2 is required");
  }
  validateReviewEvidence(evidence, value, scope, tasks, evaluator);
}

/** Check each claimed cell, including every task's approved evaluator. Never activates a runtime model. */
export async function validateReleaseReviews(
  root: string,
  cells: readonly CoverageCell[],
  packs: ReadonlyMap<string, CurriculumPack>,
  reviews: readonly CellReview[],
  now = new Date().toISOString(),
): Promise<{ reviewedCells: number; evaluatorApprovedCells: number }> {
  if (!validDate(now)) throw new Error("Invalid review validation date");
  const byCell = new Map(reviews.map((review) => [cellKey(review), review]));
  const known = new Set(cells.map(cellKey));
  for (const review of reviews)
    if (!known.has(cellKey(review)))
      throw new Error(`Orphan curriculum review ${review.id}`);
  let reviewedCells = 0,
    evaluatorApprovedCells = 0;
  for (const cell of cells) {
    const pack = packs.get(cell.language),
      unit = pack?.units.find((unit) => unit.id === cell.constructionId),
      key = cellKey(cell);
    if (!pack || !unit)
      throw new Error(`Review cell has no construction ${key}`);
    const tasks = activePracticeTasks(unit).filter(
      (task) => task.stage === cell.stage && task.modality === cell.modality,
    );
    if (
      !tasks.length ||
      cell.contentVersion !== pack.version ||
      cell.mappingVersion !== pack.mappingVersion ||
      JSON.stringify([...cell.taskIds].sort()) !==
        JSON.stringify(tasks.map((task) => task.id).sort())
    )
      throw new Error(`Stale cell task mapping ${key}`);
    // This field describes the draft task policy, not approval to assess the whole cell.
    const expectedEvaluator = tasks.some(
      (task) => task.answerPolicy === "closed",
    )
      ? "closed-nfc-case-v1"
      : "human-review-required";
    if (cell.evaluator !== expectedEvaluator)
      throw new Error(`Stale or invented evaluator mapping ${key}`);
    if (
      !["pending", "complete"].includes(cell.humanReview) ||
      typeof cell.releaseEligible !== "boolean"
    )
      throw new Error(`Invalid review status ${key}`);
    if (cell.releaseEligible && cell.humanReview !== "complete")
      throw new Error(`Release claim without completed content review ${key}`);
    if (
      cell.humanReview === "complete" &&
      (unit.review !== "human_reviewed" ||
        tasks.some((task) => task.contentReview !== "human_reviewed"))
    )
      throw new Error(`Review absent from content pack ${key}`);
    const review = byCell.get(key);
    if (!review) {
      if (cell.humanReview === "complete" || cell.releaseEligible)
        throw new Error(`Missing recorded human review ${key}`);
      continue;
    }
    if (
      review.contentVersion !== pack.version ||
      review.mappingVersion !== pack.mappingVersion ||
      review.unitSha256 !== unitDigest(unit)
    )
      throw new Error(`Stale reviewed content or mapping ${key}`);
    await humanReview(root, review.contentReview, now, review, tasks);
    if (cell.humanReview === "complete") reviewedCells++;
    const taskIds = new Set(tasks.map((task) => task.id)),
      approvedTasks = new Set<string>();
    for (const evaluator of review.evaluators) {
      if (
        !isRecord(evaluator) ||
        !nonempty(evaluator.id) ||
        !nonempty(evaluator.version) ||
        !["human", "rule", "transformer"].includes(evaluator.kind) ||
        !Array.isArray(evaluator.taskIds) ||
        !evaluator.taskIds.length ||
        !Array.isArray(evaluator.rubricVersions)
      )
        throw new Error(`Invalid evaluator approval ${key}`);
      if (
        Date.parse(evaluator.review.reviewedAt) <
        Date.parse(review.contentReview.reviewedAt)
      )
        throw new Error(`Evaluator approval predates content review ${key}`);
      for (const id of evaluator.taskIds) {
        if (!taskIds.has(id) || approvedTasks.has(id))
          throw new Error(`Orphan or duplicate evaluator task ${key}:${id}`);
        const task = tasks.find((task) => task.id === id)!;
        if (!evaluator.rubricVersions.includes(task.rubricVersion))
          throw new Error(`Evaluator rubric not approved ${key}:${id}`);
        approvedTasks.add(id);
      }
      if (evaluator.kind !== "human") {
        if (evaluator.review.reviewerId === evaluator.id)
          throw new Error(`Evaluator cannot approve itself ${key}`);
        if (!evaluator.benchmarkInput)
          throw new Error(
            `Automated evaluator lacks benchmark evidence ${key}`,
          );
        const input = parseBenchmarkInput(
          JSON.parse(
            (await artifact(root, evaluator.benchmarkInput)).toString("utf8"),
          ),
        );
        const qualification = qualifyCandidate(
          input.cases,
          input.predictions,
          input.candidate,
        );
        if (
          !qualification.eligibleForReleaseReview ||
          input.candidate.id !== evaluator.id ||
          input.candidate.version !== evaluator.version
        )
          throw new Error(
            `Evaluator benchmark not qualified for this version ${key}`,
          );
        for (const id of evaluator.taskIds) {
          const task = tasks.find((task) => task.id === id)!;
          if (
            !qualification.scopes.some(
              (scope) =>
                scope.language === cell.language &&
                scope.modality === cell.modality &&
                scope.constructionId === cell.constructionId &&
                scope.contentVersion === pack.version &&
                scope.rubricVersion === task.rubricVersion,
            )
          )
            throw new Error(
              `Evaluator benchmark scope does not cover task ${id}`,
            );
        }
        await validateEvaluationEvidence(root, input);
      } else if (evaluator.benchmarkInput !== null)
        throw new Error(
          `Human evaluator must not imply automated benchmark approval ${key}`,
        );
      await humanReview(
        root,
        evaluator.review,
        now,
        review,
        tasks.filter((task) => evaluator.taskIds.includes(task.id)),
        evaluator,
      );
    }
    if (cell.releaseEligible && approvedTasks.size !== taskIds.size)
      throw new Error(`Evaluator approval missing for tasks ${key}`);
    if (
      cell.releaseEligible &&
      tasks.length &&
      approvedTasks.size === taskIds.size
    )
      evaluatorApprovedCells++;
  }
  return { reviewedCells, evaluatorApprovedCells };
}
