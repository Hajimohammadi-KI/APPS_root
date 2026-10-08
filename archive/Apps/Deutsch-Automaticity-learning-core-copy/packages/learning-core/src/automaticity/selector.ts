import {
  activePracticeTasks,
  type CurriculumPack,
  type ConstructionUnit,
  type PracticeTask,
} from "./curriculum";
import type { ConstructionProgress, EvidenceReduction } from "./evidence";
export interface DailySelection {
  focus: ConstructionUnit[];
  repairs: ConstructionProgress[];
  reason: "due_review" | "repair" | "diagnostic" | "continued_practice";
}
/** Open the recommended mode and stage; held-out evaluation items stay out of daily practice. */
export function selectDailyTask(
  unit: ConstructionUnit,
  state: EvidenceReduction,
  now: string,
): {
  task: PracticeTask | null;
  previousAttemptId: string | null;
  reason: "due_review" | "repair" | "diagnostic";
} {
  const tasks = activePracticeTasks(unit).filter(
    (task) => task.partition === "practice",
  );
  const rows = state.progress.filter((row) => row.constructionId === unit.id);
  const due = rows
    .filter(
      (row) =>
        row.nextReviewAt && Date.parse(row.nextReviewAt) <= Date.parse(now),
    )
    .sort(
      (a, b) => Date.parse(a.nextReviewAt!) - Date.parse(b.nextReviewAt!),
    )[0];
  const repair = rows.find((row) => row.repairNeeded);
  // Repair the current error first within a construction, then return to its due mode.
  const mode = (repair ?? due)?.modality ?? "writing";
  const needsRepair = rows.some(
    (row) => row.modality === mode && row.repairNeeded,
  );
  const original = needsRepair
    ? state.attempts
        .filter(
          (row) =>
            row.attempt.task.constructionId === unit.id &&
            row.attempt.task.modality === mode &&
            ["needs_repair", "target_not_observed"].includes(
              row.assessment?.verdict ?? "",
            ),
        )
        .sort((a, b) => Date.parse(b.attempt.at) - Date.parse(a.attempt.at))[0]
        ?.attempt
    : undefined;
  const originalTask = original
    ? tasks.find(
        (task) =>
          task.id === original.task.id &&
          task.version === original.task.version,
      )
    : undefined;
  const reason = needsRepair ? "repair" : due ? "due_review" : "diagnostic";
  const stage =
    reason === "repair"
      ? "repair"
      : reason === "due_review"
        ? "retain"
        : "retrieve";
  return {
    task:
      originalTask ??
      tasks.find((task) => task.modality === mode && task.stage === stage) ??
      tasks.find(
        (task) => task.modality === mode && task.stage === "retrieve",
      ) ??
      null,
    previousAttemptId: original?.id ?? null,
    reason,
  };
}
const seed = (value: string) =>
  [...value].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    2166136261,
  );
/** Small, explainable baseline policy. No reward model chooses learning evidence. */
export function selectDailyFocus(
  pack: CurriculumPack,
  progress: readonly ConstructionProgress[],
  now: string,
  level: string,
  limit = 2,
): DailySelection {
  const known = new Set(
    pack.units
      .filter((unit) => unit.language === pack.language)
      .map((unit) => unit.id),
  );
  const scopedProgress = progress.filter((row) =>
    known.has(row.constructionId),
  );
  const repairs = scopedProgress
    .filter(
      (row) =>
        row.repairNeeded ??
        (row.practiceFailures > 0 ||
          (row.accuracy !== null && row.accuracy < 0.8)),
    )
    .sort(
      (a, b) =>
        b.practiceFailures - a.practiceFailures ||
        (a.accuracy ?? 1) - (b.accuracy ?? 1),
    )
    .filter(
      (row, index, rows) =>
        rows.findIndex(
          (other) => other.constructionId === row.constructionId,
        ) === index,
    )
    .slice(0, 5);
  const byId = new Map<string, ConstructionProgress[]>();
  for (const row of scopedProgress)
    byId.set(row.constructionId, [
      ...(byId.get(row.constructionId) ?? []),
      row,
    ]);
  const familyCounts = new Map<string, number>();
  for (const unit of pack.units)
    for (const family of unit.familyIds)
      familyCounts.set(
        family,
        (familyCounts.get(family) ?? 0) +
          (byId.get(unit.id) ?? []).reduce((n, row) => n + row.attempts, 0),
      );
  const eligible = pack.units.filter(
    (unit) =>
      unit.level === level ||
      repairs.some((row) => row.constructionId === unit.id) ||
      byId
        .get(unit.id)
        ?.some(
          (row) =>
            row.nextReviewAt && Date.parse(row.nextReviewAt) <= Date.parse(now),
        ),
  );
  const ranked = (eligible.length ? eligible : pack.units)
    .map((unit) => {
      const rows = byId.get(unit.id) ?? [];
      const dueDates = rows.flatMap((row) =>
        row.nextReviewAt && Date.parse(row.nextReviewAt) <= Date.parse(now)
          ? [Date.parse(row.nextReviewAt)]
          : [],
      );
      const dueAt = dueDates.length ? Math.min(...dueDates) : null;
      const due = dueAt !== null;
      const repair = repairs.some((row) => row.constructionId === unit.id);
      const tried = rows.reduce((n, row) => n + row.attempts, 0);
      return {
        unit,
        due,
        dueAt,
        repair,
        tried,
        // Suggestions guide a cold start; they never require a mastery claim or lock a topic.
        unexploredPreparation: tried
          ? 0
          : unit.prerequisites.filter(
              (id) => !(byId.get(id) ?? []).some((row) => row.attempts > 0),
            ).length,
        score:
          tried * 50 +
          Math.min(...unit.familyIds.map((id) => familyCounts.get(id) ?? 0)) *
            3 +
          (seed(`${now.slice(0, 10)}:${unit.id}`) % 17),
      };
    })
    .sort(
      (a, b) =>
        Number(b.due) - Number(a.due) ||
        (a.dueAt !== null && b.dueAt !== null ? a.dueAt - b.dueAt : 0) ||
        Number(b.repair) - Number(a.repair) ||
        a.unexploredPreparation - b.unexploredPreparation ||
        a.score - b.score ||
        a.unit.id.localeCompare(b.unit.id),
    );
  const selected = ranked.slice(0, Math.max(1, Math.min(2, limit)));
  return {
    focus: selected.map((row) => row.unit),
    repairs,
    reason: selected.some((row) => row.due)
      ? "due_review"
      : selected.some((row) => row.repair)
        ? "repair"
        : selected.some((row) => !row.tried)
          ? "diagnostic"
          : "continued_practice",
  };
}
