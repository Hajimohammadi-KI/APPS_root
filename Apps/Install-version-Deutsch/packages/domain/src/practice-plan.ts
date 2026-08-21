export interface DailyPracticeStep {
  readonly id: "grammar" | "read_aloud" | "coach_conversation";
  readonly label: string;
  readonly description: string;
  readonly minutes: number;
}

export const DAILY_PRACTICE_STEPS = [
  {
    id: "grammar",
    label: "Aktivieren & anwenden",
    description:
      "Rufe die Struktur ohne Hilfe ab und nutze sie in einem eigenen Satz.",
    minutes: 3,
  },
  {
    id: "read_aloud",
    label: "Laut automatisieren",
    description:
      "Lies den korrigierten Satz zweimal mit natürlichem Rhythmus laut vor.",
    minutes: 4,
  },
  {
    id: "coach_conversation",
    label: "Frei übertragen",
    description:
      "Gib eine persönliche Antwort ohne Vorlage und speichere den Sprechnachweis.",
    minutes: 5,
  },
] as const satisfies readonly DailyPracticeStep[];
