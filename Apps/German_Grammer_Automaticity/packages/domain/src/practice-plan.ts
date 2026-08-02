export interface DailyPracticeStep {
  readonly id: "grammar" | "read_aloud" | "coach_conversation";
  readonly label: string;
  readonly description: string;
  readonly minutes: number;
}

export const DAILY_PRACTICE_STEPS = [
  {
    id: "grammar",
    label: "Grammatik",
    description: "Schreibe einen eigenen Satz aus einer realen Situation.",
    minutes: 8,
  },
  {
    id: "read_aloud",
    label: "Laut lesen",
    description: "Lies den korrigierten Satz deutlich laut vor.",
    minutes: 10,
  },
  {
    id: "coach_conversation",
    label: "Coach-Gespräch",
    description: "Gib eine kurze Antwort im Studio und erhalte Feedback.",
    minutes: 12,
  },
] as const satisfies readonly DailyPracticeStep[];
