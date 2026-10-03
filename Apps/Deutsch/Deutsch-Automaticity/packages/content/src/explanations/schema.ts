export interface GrammarExplanation {
  readonly overview: string;
  readonly formation: readonly string[];
  readonly usage: readonly string[];
  readonly wordOrder: readonly string[];
  readonly specialCases: readonly string[];
  readonly memoryTip: string;
}

export type GrammarExplanationMap = Readonly<
  Record<string, GrammarExplanation>
>;

export function defineExplanations<const T extends GrammarExplanationMap>(
  explanations: T,
): T {
  return explanations;
}

export interface GrammarMaterialSource {
  readonly title: string;
  readonly levels: readonly string[];
  readonly contribution: string;
}

export const grammarMaterialFolderUrl =
  "https://drive.google.com/drive/folders/1isE3OWBFZcr9eRDwWvNXHWb5vo0qmGAF?usp=drive_link";

export const grammarMaterialSources: readonly GrammarMaterialSource[] = [
  {
    title: "Begegnungen A1",
    levels: ["A1"],
    contribution:
      "Grundformen, Satzklammer, Kasusaufbau und alltagsnahe Progression.",
  },
  {
    title: "Begegnungen A2",
    levels: ["A2"],
    contribution:
      "Zeitformen, Nebensätze, Rektion, Vergleich und kommunikative Anwendung.",
  },
  {
    title: "Begegnungen B1+",
    levels: ["B1", "B2"],
    contribution:
      "Tempuskontraste, Passiv, Konjunktiv, Relativsätze und systematische Übersichten.",
  },
  {
    title: "Erkundungen B2 - Kurs- und Übungsbuch",
    levels: ["B2"],
    contribution:
      "B2-Satzbau, Textverknüpfung, Wortschatzarbeit und systematische Grammatikpraxis.",
  },
  {
    title: "B2 - Finde die Fehler",
    levels: ["B2", "C1", "C2"],
    contribution:
      "Typische Lernerfehler bei Kasus, Kongruenz, Wortstellung und Verbrektion.",
  },
  {
    title: "B2–C1 Grammatiktraining · vier 30-Tage-Teile",
    levels: ["B2", "C1"],
    contribution:
      "Progressive Tagesfolgen mit Fehlersuche, Sprachbausteinen, Tests und Transferaufgaben.",
  },
  {
    title: "Redewendungen, Sprichwörter, Zitate - B2 bis C2",
    levels: ["B2", "C1", "C2"],
    contribution:
      "Idiomatizität, Kollokationen, pragmatische Wirkung und stilistische Feinheiten.",
  },
  {
    title: "Diskussionen meistern auf Niveau C1",
    levels: ["C1", "C2"],
    contribution:
      "Perspektivwechsel, erweiterte Redemittel, Gesprächsstruktur und Audio-Vergleich.",
  },
  {
    title: "German Perfekt overview",
    levels: ["A2"],
    contribution:
      "Kontrast zwischen abgeschlossenem Ergebnis im Perfekt und noch andauernden Zuständen mit seit im Präsens.",
  },
] as const;
