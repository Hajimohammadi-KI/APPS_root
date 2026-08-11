export type DailyWorkMode = "rescue" | "light" | "full";

export const DAILY_WORK_MODES = {
  rescue: {
    label: "12-Minuten-Rettung",
    shortLabel: "Rettung",
    totalMinutes: 12,
    taskMinutes: [4, 4, 4] as const,
    description: "Nur den nächsten sinnvollen Schritt sichern; die Qualitätskriterien bleiben gleich.",
  },
  light: {
    label: "70 Minuten leicht",
    shortLabel: "Leicht",
    totalMinutes: 70,
    taskMinutes: [25, 25, 20] as const,
    description: "Drei kurze Fokusblöcke mit einer Pause. Offene Arbeit bleibt für den nächsten Tag erhalten.",
  },
  full: {
    label: "210 Minuten vollständig",
    shortLabel: "Vollständig",
    totalMinutes: 210,
    taskMinutes: [70, 90, 50] as const,
    description: "Der vollständige Forschungstag mit zwei Pausen und allen vorgesehenen Ergebnissen.",
  },
} as const;

export function normalizeDailyWorkMode(value: unknown): DailyWorkMode {
  return value === "rescue" || value === "light" || value === "full" ? value : "light";
}

export function workModeTaskMinutes(mode: DailyWorkMode, taskIndex: number): number {
  return DAILY_WORK_MODES[mode].taskMinutes[taskIndex] ?? DAILY_WORK_MODES[mode].taskMinutes.at(-1)!;
}
