import {
  activePracticeTasks,
  type CurriculumPack,
  type ConstructionUnit,
  type PracticeTask,
} from "./curriculum";
import {
  unresolvedRepairs,
  type ConstructionProgress,
  type EvidenceReduction,
} from "./evidence";
import type { AttemptEvent } from "./contracts";
import { constructionTargetMet } from "./learning-target";
export { shouldResumeSavedPractice } from "./practice-session";
export interface DailySelection {
  focus: ConstructionUnit[];
  repairs: ConstructionProgress[];
  reason: "due_review" | "repair" | "diagnostic" | "continued_practice";
}
export interface TaskRecommendation {
  task: PracticeTask | null;
  previousAttemptId: string | null;
  reason: DailySelection["reason"];
}

/** Resolve a historical repair to a current practice item in the same response mode. */
export function repairTaskForAttempt(
  unit: ConstructionUnit,
  original: AttemptEvent,
): PracticeTask | null {
  if (
    unit.id !== original.task.constructionId ||
    unit.language !== original.language
  )
    return null;
  const tasks = activePracticeTasks(unit).filter(
    (task) =>
      task.partition === "practice" && task.modality === original.task.modality,
  );
  const replacementId = unit.retiredTasks?.find(
    (row) => row.taskId === original.task.id,
  )?.replacementTaskId;
  return (
    tasks.find((task) => task.id === replacementId) ??
    tasks.find(
      (task) =>
        task.id === original.task.id && task.version === original.task.version,
    ) ??
    tasks.find((task) => task.stage === "repair") ??
    tasks.find((task) => task.stage === "retrieve") ??
    null
  );
}

/** Open the recommended mode and stage; held-out evaluation items stay out of daily practice. */
export function selectDailyTask(
  unit: ConstructionUnit,
  state: EvidenceReduction,
  now: string,
): TaskRecommendation {
  const tasks = activePracticeTasks(unit).filter(
    (task) => task.partition === "practice",
  );
  const rows = state.progress.filter((row) => row.constructionId === unit.id);
  const due = rows
    .filter(
      (row) =>
        row.nextReviewAt && Date.parse(row.nextReviewAt) <= Date.parse(now),
    )
    .sort((a, b) => Date.parse(a.nextReviewAt!) - Date.parse(b.nextReviewAt!));
  const repairs = rows.filter((row) => row.repairNeeded);
  const history = state.attempts.filter(
    (row) => row.attempt.task.constructionId === unit.id,
  );
  const pending = unresolvedRepairs(history);
  const rankedTasks = (candidates: PracticeTask[]) =>
    candidates
      .map((candidate) => {
        const tried = history.filter(
          (row) =>
            row.attempt.task.id === candidate.id &&
            row.attempt.task.version === candidate.version,
        );
        return {
          task: candidate,
          count: tried.length,
          last: Math.max(0, ...tried.map((row) => Date.parse(row.attempt.at))),
        };
      })
      .sort(
        (a, b) =>
          a.count - b.count ||
          a.last - b.last ||
          a.task.id.localeCompare(b.task.id),
      );
  // Try every urgent modality. A missing speaking task must not hide a due writing task.
  for (const row of [...repairs, ...due.filter((row) => !row.repairNeeded)]) {
    const reason = row.repairNeeded ? "repair" : "due_review";
    const original = row.repairNeeded
      ? pending.find((item) => item.attempt.task.modality === row.modality)
          ?.attempt
      : undefined;
    const originalTask = original
      ? repairTaskForAttempt(unit, original)
      : undefined;
    const stage = row.repairNeeded ? "repair" : "retain";
    const selected =
      originalTask ??
      rankedTasks(
        tasks.filter(
          (candidate) =>
            candidate.modality === row.modality && candidate.stage === stage,
        ),
      )[0]?.task ??
      rankedTasks(
        tasks.filter(
          (candidate) =>
            candidate.modality === row.modality &&
            candidate.stage === "retrieve",
        ),
      )[0]?.task;
    if (selected)
      return {
        task: selected,
        previousAttemptId: original?.id ?? null,
        reason,
      };
  }
  if (repairs.length || due.length)
    return {
      task: null,
      previousAttemptId: null,
      reason: repairs.length ? "repair" : "due_review",
    };
  // Order opportunities by stage, not catalog size. Completing a response is
  // practice; its assessment and independence still determine mastery separately.
  const cycle = ["retrieve", "vary", "produce", "transfer"];
  const candidates = tasks.filter((task) => cycle.includes(task.stage));
  const currentHistory = history.filter((row) =>
    candidates.some(
      (candidate) =>
        candidate.id === row.attempt.task.id &&
        candidate.version === row.attempt.task.version,
    ),
  );
  const ranked = candidates
    .map((task) => {
      const tried = history.filter(
        (row) =>
          row.attempt.task.id === task.id &&
          row.attempt.task.version === task.version,
      );
      return {
        task,
        stageCount: currentHistory.filter(
          (row) =>
            row.attempt.task.stage === task.stage &&
            row.attempt.task.modality === task.modality,
        ).length,
        count: tried.length,
        last: Math.max(0, ...tried.map((row) => Date.parse(row.attempt.at))),
      };
    })
    .sort(
      (a, b) =>
        a.stageCount - b.stageCount ||
        Number(a.task.modality === "speaking") -
          Number(b.task.modality === "speaking") ||
        cycle.indexOf(a.task.stage) - cycle.indexOf(b.task.stage) ||
        a.count - b.count ||
        a.last - b.last,
    );
  return {
    task: ranked[0]?.task ?? tasks[0] ?? null,
    previousAttemptId: null,
    reason: history.length ? "continued_practice" : "diagnostic",
  };
}
const seed = (value: string) =>
  [...value].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    2166136261,
  );
/** Small, explainable baseline policy. No reward model chooses learning evidence. */
function rankDailyFocus(
  pack: CurriculumPack,
  progress: readonly ConstructionProgress[],
  now: string,
  level: string,
) {
  const known = new Set(
    pack.units
      .filter((unit) => unit.language === pack.language)
      .map((unit) => unit.id),
  );
  const scopedProgress = progress.filter((row) =>
    known.has(row.constructionId),
  );
  const newLearner = !scopedProgress.some((row) => row.attempts > 0);
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
    );
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
    .map((unit, curriculumOrder) => {
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
        curriculumOrder,
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
        (newLearner ? a.curriculumOrder - b.curriculumOrder : 0) ||
        a.score - b.score ||
        a.unit.id.localeCompare(b.unit.id),
    );
  return { ranked, repairs };
}

export function selectDailyFocus(
  pack: CurriculumPack,
  progress: readonly ConstructionProgress[],
  now: string,
  level: string,
  limit = 2,
): DailySelection {
  const { ranked, repairs } = rankDailyFocus(pack, progress, now, level);
  const selected = ranked.slice(0, Math.max(1, Math.min(2, limit)));
  return {
    focus: selected.map((row) => row.unit),
    repairs: repairs.slice(0, 5),
    reason: selected.some((row) => row.due)
      ? "due_review"
      : selected.some((row) => row.repair)
        ? "repair"
        : selected.some((row) => !row.tried)
          ? "diagnostic"
          : "continued_practice",
  };
}

/** One next-step policy across entry, today's focus and post-response continuation. */
export function selectNextLearningTask(
  pack: CurriculumPack,
  state: EvidenceReduction,
  now: string,
  level: string,
  preferredUnitId?: string,
): (TaskRecommendation & { unit: ConstructionUnit }) | null {
  const { ranked } = rankDailyFocus(pack, state.progress, now, level);
  const preferred = pack.units.find(
    (unit) => unit.id === preferredUnitId && unit.language === pack.language,
  );
  const unfinished = ranked.filter(
    (row) => !constructionTargetMet(state, row.unit),
  );
  const candidates = [
    ...ranked.filter((row) => row.due || row.repair).map((row) => row.unit),
    ...(preferred && !constructionTargetMet(state, preferred)
      ? [preferred]
      : []),
    ...unfinished.map((row) => row.unit),
    ...ranked.map((row) => row.unit),
  ];
  const seen = new Set<string>();
  for (const unit of candidates) {
    if (seen.has(unit.id) || unit.language !== pack.language) continue;
    seen.add(unit.id);
    const choice = selectDailyTask(unit, state, now);
    if (choice.task) return { unit, ...choice };
  }
  return null;
}
