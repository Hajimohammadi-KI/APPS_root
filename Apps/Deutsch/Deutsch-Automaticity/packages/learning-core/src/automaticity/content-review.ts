import { sha256 } from "./backup";
import {
  activePracticeTasks,
  type ConstructionUnit,
  type CurriculumPack,
  type PracticeTask,
} from "./curriculum";

/** The checks of scripts/lib/curriculum-review-evidence.ts, in its order. */
export const CONTENT_CHECKS = [
  "formAccurate",
  "meaningAccurate",
  "useAppropriate",
  "contrastsAccurate",
  "alternativesAccurate",
  "prerequisitesAppropriate",
  "sourcesChecked",
] as const;
export const CONTENT_TASK_CHECKS = [
  "promptClear",
  "targetElicited",
  "stageAppropriate",
  "modalityAppropriate",
  "answerPolicyAppropriate",
  "acceptedAnswersAccurate",
  "exposureHandled",
] as const;
export type ContentCheck = (typeof CONTENT_CHECKS)[number];
export type ContentTaskCheck = (typeof CONTENT_TASK_CHECKS)[number];

/** What one reviewer recorded for one unit in the review page. */
export interface UnitReviewForm {
  reviewerId: string;
  role: string;
  reviewedAt: string;
  checks: Partial<Record<ContentCheck, boolean>>;
  note: string;
  tasks: Record<
    string,
    { checks: Partial<Record<ContentTaskCheck, boolean>>; note: string }
  >;
}

const stable = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [
              key,
              stable((value as Record<string, unknown>)[key]),
            ]),
        )
      : value;
/** The digest that pins a review to the exact unit content (unitDigest of the
 * release-review scripts): review flags are left out, everything else counts. */
export async function unitContentDigest(unit: ConstructionUnit) {
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

/** The unit's active tasks by stage and modality: one reviewed cell each. */
export function reviewCells(unit: ConstructionUnit) {
  const cells = new Map<string, PracticeTask[]>();
  for (const task of activePracticeTasks(unit)) {
    const key = `${task.stage}:${task.modality}`;
    cells.set(key, [...(cells.get(key) ?? []), task]);
  }
  return [...cells.values()].map((tasks) => ({
    stage: tasks[0]!.stage,
    modality: tasks[0]!.modality,
    tasks,
  }));
}

/** Resolve only installed unit IDs. Query parameters never alter stored review work. */
export function contentReviewSelection(
  pack: CurriculumPack,
  search: string,
): { unit: ConstructionUnit | undefined; cycleOnly: boolean } {
  const query = new URLSearchParams(search);
  const unit =
    pack.units.find((row) => row.id === query.get("unit")) ?? pack.units[0];
  return {
    unit,
    cycleOnly: query.get("focus") === "cycle" && !!unit?.learningCycle,
  };
}

/** Display exact mapped practice tasks first without dropping the rest of the unit's approval scope. */
export function reviewTaskGroups(unit: ConstructionUnit) {
  const active = activePracticeTasks(unit);
  const cycle = (unit.learningCycle?.steps ?? []).flatMap((step) => {
    const task = active.find(
      (task) =>
        task.id === step.taskId &&
        task.stage === step.stage &&
        task.modality === "writing",
    );
    return task ? [task] : [];
  });
  const ids = new Set(cycle.map((task) => task.id));
  return { cycle, other: active.filter((task) => !ids.has(task.id)) };
}

export function safeReviewSource(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

const longEnough = (note: string) => note.trim().length >= 20;
/** Everything still missing before the unit can be approved; empty when ready.
 * The import applies the same rules, so an approval here imports as is. */
export function reviewProblems(
  unit: ConstructionUnit,
  form: UnitReviewForm,
  now = new Date().toISOString(),
): string[] {
  const problems: string[] = [];
  if (!form.reviewerId.trim() || !form.role.trim()) problems.push("reviewer");
  if (/codex|chatgpt|synthetic|fixture|automated/iu.test(form.reviewerId))
    problems.push("reviewer-not-human");
  if (
    !Number.isFinite(Date.parse(form.reviewedAt)) ||
    Date.parse(form.reviewedAt) > Date.parse(now)
  )
    problems.push("date");
  for (const check of CONTENT_CHECKS)
    if (form.checks[check] !== true) problems.push(`unit:${check}`);
  if (!longEnough(form.note)) problems.push("unit:note");
  for (const task of activePracticeTasks(unit)) {
    const row = form.tasks[task.id];
    for (const check of CONTENT_TASK_CHECKS)
      if (row?.checks[check] !== true) problems.push(`${task.id}:${check}`);
    if (!row || !longEnough(row.note)) problems.push(`${task.id}:note`);
  }
  return problems;
}

/** One approved review document per cell, the import's input format. */
export async function approvedReviewDocuments(
  pack: CurriculumPack,
  unit: ConstructionUnit,
  form: UnitReviewForm,
  now = new Date().toISOString(),
) {
  const problems = reviewProblems(unit, form, now);
  if (problems.length)
    throw new Error(`The review is not complete: ${problems.join(", ")}`);
  const unitSha256 = await unitContentDigest(unit);
  return reviewCells(unit).map(({ stage, modality, tasks }) => ({
    schemaVersion: 2,
    kind: "curriculum-content-review",
    provenance: "human_review",
    reviewerId: form.reviewerId.trim(),
    role: form.role.trim(),
    reviewedAt: form.reviewedAt,
    decision: "approved",
    scope: {
      language: pack.language,
      constructionId: unit.id,
      stage,
      modality,
      contentVersion: pack.version,
      mappingVersion: pack.mappingVersion,
      unitSha256,
    },
    evaluator: null,
    checks: Object.fromEntries(CONTENT_CHECKS.map((check) => [check, true])),
    note: form.note.trim(),
    taskReviews: tasks.map((task) => ({
      taskId: task.id,
      taskVersion: task.version,
      rubricVersion: task.rubricVersion,
      checks: Object.fromEntries(
        CONTENT_TASK_CHECKS.map((check) => [check, true]),
      ),
      note: form.tasks[task.id]!.note.trim(),
    })),
  }));
}

/** The file scripts/import-curriculum-review.ts takes. */
export const contentReviewBundle = (
  documents: readonly Awaited<
    ReturnType<typeof approvedReviewDocuments>
  >[number][],
) => ({ schemaVersion: 1, contentReviews: documents, evaluatorReviews: [] });

/** Problems a reviewer found, for the owner to author a fix: every check that
 * is not confirmed, with the reviewer's notes. Findings approve nothing. */
export function contentReviewFindings(
  pack: CurriculumPack,
  unit: ConstructionUnit,
  form: UnitReviewForm,
) {
  return {
    kind: "curriculum-content-findings",
    schemaVersion: 1,
    language: pack.language,
    constructionId: unit.id,
    title: unit.title,
    contentVersion: pack.version,
    reviewerId: form.reviewerId.trim(),
    role: form.role.trim(),
    reviewedAt: form.reviewedAt,
    unconfirmed: CONTENT_CHECKS.filter((check) => form.checks[check] !== true),
    note: form.note.trim(),
    tasks: activePracticeTasks(unit).flatMap((task) => {
      const row = form.tasks[task.id];
      const unconfirmed = CONTENT_TASK_CHECKS.filter(
        (check) => row?.checks[check] !== true,
      );
      return unconfirmed.length
        ? [
            {
              taskId: task.id,
              prompt: task.prompt,
              unconfirmed,
              note: row?.note.trim() ?? "",
            },
          ]
        : [];
    }),
  };
}
