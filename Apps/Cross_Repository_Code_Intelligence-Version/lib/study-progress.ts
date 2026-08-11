export type ProgressDay = {
  tasks: Array<{ items: Array<{ id: string }> }>;
};

export function countCompletedItems(day: ProgressDay, completed: ReadonlySet<string>) {
  return day.tasks.reduce(
    (count, task) => count + task.items.filter((item) => completed.has(item.id)).length,
    0,
  );
}

export function getDayStatus(day: ProgressDay, completed: ReadonlySet<string>, itemsPerDay = 9) {
  const count = countCompletedItems(day, completed);
  if (count === 0) return "open" as const;
  if (count === itemsPerDay) return "done" as const;
  return "started" as const;
}

export function percentComplete(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, completed) / total) * 100);
}

export function estimatedLearningHours(completedItems: number, itemsPerDay = 9, hoursPerDay = 4) {
  if (itemsPerDay <= 0 || hoursPerDay < 0) return 0;
  return Math.round((Math.max(0, completedItems) / itemsPerDay) * hoursPerDay * 10) / 10;
}
