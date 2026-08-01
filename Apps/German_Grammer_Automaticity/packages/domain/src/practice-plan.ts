export interface DailyPracticeStep {
  readonly id:
    | "warmup"
    | "recall"
    | "repair"
    | "transfer"
    | "speaking"
    | "reflection"
    | "review";
  readonly label: string;
  readonly description: string;
  readonly minutes: number;
}

export const DAILY_PRACTICE_STEPS = [
  {
    id: "warmup",
    label: "Aufwärmen",
    description: "Aktiviere die Zielstruktur mit einem kurzen Beispiel.",
    minutes: 2,
  },
  {
    id: "recall",
    label: "Abrufen",
    description: "Erinnere die Regel ohne Hilfsmittel.",
    minutes: 3,
  },
  {
    id: "repair",
    label: "Reparieren",
    description: "Finde und verbessere den typischen Fehler.",
    minutes: 4,
  },
  {
    id: "transfer",
    label: "Übertragen",
    description: "Verwende die Struktur in einem neuen Kontext.",
    minutes: 5,
  },
  {
    id: "speaking",
    label: "Sprechen",
    description: "Produziere eine freie Antwort unter leichtem Zeitdruck.",
    minutes: 5,
  },
  {
    id: "reflection",
    label: "Reflektieren",
    description: "Notiere eine Unsicherheit und eine gelungene Formulierung.",
    minutes: 2,
  },
  {
    id: "review",
    label: "Wiederholen",
    description: "Plane die nächste Wiederholung nach dem Lernintervall.",
    minutes: 1,
  },
] as const satisfies readonly DailyPracticeStep[];
