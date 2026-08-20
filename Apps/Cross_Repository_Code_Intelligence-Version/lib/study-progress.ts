export type ProgressDay = {
  // Days inside the 2026-08-19..2026-09-07 NLP course window: technical tasks
  // stay visible but must not count toward progress %, backlog, or streak.
  optionalDuringCourse?: boolean;
  tasks: Array<{ items: Array<{ id: string }> }>;
};

export function countCompletedItems(day: ProgressDay, completed: ReadonlySet<string>) {
  return day.tasks.reduce(
    (count, task) => count + task.items.filter((item) => completed.has(item.id)).length,
    0,
  );
}

export function countCompletedOutputs(day: ProgressDay, completed: ReadonlySet<string>) {
  return day.tasks.filter((task) => task.items.every((item) => completed.has(item.id))).length;
}

export function outputTotal(day: ProgressDay) {
  return day.tasks.length;
}

export function requiredOutputTotal(day: ProgressDay) {
  return day.optionalDuringCourse ? 0 : outputTotal(day);
}

export function countRequiredCompletedOutputs(
  day: ProgressDay,
  completed: ReadonlySet<string>,
) {
  return day.optionalDuringCourse ? 0 : countCompletedOutputs(day, completed);
}

export function getDayOutputStatus(day: ProgressDay, completed: ReadonlySet<string>) {
  const done = countCompletedOutputs(day, completed);
  const total = outputTotal(day);
  if (day.optionalDuringCourse && done < total) return "optional" as const;
  if (done === 0) return "open" as const;
  if (done === total) return "done" as const;
  return "started" as const;
}

export function getDayStatus(day: ProgressDay, completed: ReadonlySet<string>, itemsPerDay = 9) {
  const count = countCompletedItems(day, completed);
  if (day.optionalDuringCourse && count < itemsPerDay) return "optional" as const;
  if (count === 0) return "open" as const;
  if (count === itemsPerDay) return "done" as const;
  return "started" as const;
}

// Excludes optional-during-course days from the denominator so their unfinished
// tasks don't drag down phase/week/overall completion percentages.
export function requiredItemTotal(day: ProgressDay) {
  return day.optionalDuringCourse
    ? 0
    : day.tasks.reduce((total, task) => total + task.items.length, 0);
}

// Mirrors requiredItemTotal: work done on an optional day still saves, but
// doesn't count toward the completed-items totals used for progress/streak.
export function countRequiredCompletedItems(
  day: ProgressDay,
  completed: ReadonlySet<string>,
) {
  return day.optionalDuringCourse ? 0 : countCompletedItems(day, completed);
}

export function percentComplete(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, completed) / total) * 100);
}

export function estimatedLearningHours(completedItems: number, itemsPerDay = 9, hoursPerDay = 4) {
  if (itemsPerDay <= 0 || hoursPerDay < 0) return 0;
  return Math.round((Math.max(0, completedItems) / itemsPerDay) * hoursPerDay * 10) / 10;
}
