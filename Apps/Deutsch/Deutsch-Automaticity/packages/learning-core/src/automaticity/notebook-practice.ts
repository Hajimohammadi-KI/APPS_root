import {
  activePracticeTasks,
  type ConstructionUnit,
  type CurriculumPack,
  type PracticeTask,
} from "./curriculum";
import type { ReducedAttempt } from "./evidence";

/** Items written from the learner's own error notebook carry this source. */
const NOTEBOOK_SOURCE = "learner-notebook-";
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const isNotebookTask = (task: Pick<PracticeTask, "sourceId">) =>
  task.sourceId.startsWith(NOTEBOOK_SOURCE);

export interface NotebookProgress {
  total: number;
  passed: number;
  next: {
    unit: ConstructionUnit;
    task: PracticeTask;
    /** The latest attempt the next item repairs, if it was tried before. */
    previousAttemptId: string | null;
  } | null;
}

/** The active error-notebook items in level order. An item counts once it has
 * a passing attempt. The next item is one not yet tried; once all were tried,
 * one still not passed, as a repair of its latest attempt. */
export function notebookProgress(
  pack: CurriculumPack,
  attempts: readonly ReducedAttempt[],
): NotebookProgress {
  const items = pack.units
    .map((unit, order) => ({ unit, order }))
    .sort(
      (a, b) =>
        LEVELS.indexOf(a.unit.level) - LEVELS.indexOf(b.unit.level) ||
        a.order - b.order,
    )
    .flatMap(({ unit }) =>
      activePracticeTasks(unit)
        .filter(isNotebookTask)
        .map((task) => ({ unit, task })),
    );
  const latest = new Map<string, ReducedAttempt>();
  const passed = new Set<string>();
  for (const row of attempts) {
    const id = row.attempt.task.id;
    if (row.assessment?.verdict === "pass") passed.add(id);
    const known = latest.get(id);
    if (!known || known.attempt.at <= row.attempt.at) latest.set(id, row);
  }
  const open = items.filter(({ task }) => !passed.has(task.id));
  const next = open.find(({ task }) => !latest.has(task.id)) ?? open[0] ?? null;
  return {
    total: items.length,
    passed: items.length - open.length,
    next: next && {
      ...next,
      previousAttemptId: latest.get(next.task.id)?.attempt.id ?? null,
    },
  };
}
