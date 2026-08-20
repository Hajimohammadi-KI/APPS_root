export type DailyWorkMode = "rescue" | "light" | "full";

export const DAILY_WORK_MODES = {
  rescue: {
    label: "12-Minuten-Rettung",
    shortLabel: "Rettung",
    totalMinutes: 12,
    taskMinutes: [0, 0, 12] as const,
    requiredTaskIndexes: [2] as const,
    description: "Ein kleines Tagesergebnis sichern. Die zwei übrigen Ergebnisse sind heute ausdrücklich optional und erzeugen keinen Rückstand.",
  },
  light: {
    label: "70 Minuten leicht",
    shortLabel: "Leicht",
    totalMinutes: 70,
    taskMinutes: [25, 0, 45] as const,
    requiredTaskIndexes: [0, 2] as const,
    description: "Ein Verständnis- und ein Tagesergebnis. Die formale Vertiefung bleibt optional und wird nicht als Rückstand gewertet.",
  },
  full: {
    label: "210 Minuten vollständig",
    shortLabel: "Vollständig",
    totalMinutes: 210,
    taskMinutes: [70, 90, 50] as const,
    requiredTaskIndexes: [0, 1, 2] as const,
    description: "Der vollständige Forschungstag mit zwei Pausen und allen vorgesehenen Ergebnissen.",
  },
} as const;

export function normalizeDailyWorkMode(value: unknown): DailyWorkMode {
  return value === "rescue" || value === "light" || value === "full" ? value : "light";
}

export function workModeTaskMinutes(mode: DailyWorkMode, taskIndex: number): number {
  return DAILY_WORK_MODES[mode].taskMinutes[taskIndex] ?? DAILY_WORK_MODES[mode].taskMinutes.at(-1)!;
}

export function workModeRequiredTaskIndexes(mode: DailyWorkMode): readonly number[] {
  return DAILY_WORK_MODES[mode].requiredTaskIndexes;
}

export function isTaskRequiredForMode(mode: DailyWorkMode, taskIndex: number): boolean {
  return workModeRequiredTaskIndexes(mode).includes(taskIndex as never);
}

export function effectivePlanHours(mode: DailyWorkMode, plannedDays: number): number {
  return Math.round((Math.max(0, plannedDays) * DAILY_WORK_MODES[mode].totalMinutes / 60) * 10) / 10;
}
