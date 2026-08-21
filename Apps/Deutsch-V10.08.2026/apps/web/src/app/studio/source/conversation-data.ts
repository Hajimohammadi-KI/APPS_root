import { speakingTopics as curriculumTopics } from "@grammar/content";

export type StudioLanguage = "de";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ConversationTopic {
  readonly id: string;
  readonly language: StudioLanguage;
  readonly path: "Komplettes Deutsch";
  readonly level: CefrLevel;
  readonly skill: string;
  readonly category: string;
  readonly topic: string;
  readonly task: string;
  readonly goal: string;
  readonly targetForm: string;
  readonly contentVersion: string;
  readonly sourceId: string;
}

const levels = new Set<CefrLevel>(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const conversationTopics: readonly ConversationTopic[] =
  curriculumTopics.map((topic, index) => {
    const normalizedLevel = topic.level === "B2-C1" ? "B2" : topic.level;

    if (!levels.has(normalizedLevel as CefrLevel)) {
      throw new Error(
        `Nicht unterstütztes GER-Niveau im Gesprächskatalog: ${topic.level}`,
      );
    }

    return {
      id: `de-${normalizedLevel.toLowerCase()}-${String(index + 1).padStart(3, "0")}`,
      language: "de",
      path: "Komplettes Deutsch",
      level: normalizedLevel as CefrLevel,
      skill: topic.skill,
      category: topic.category,
      topic: topic.topic,
      task: topic.task,
      goal: `Bewältige diese Kann-Aufgabe auf Niveau ${normalizedLevel} selbstständig und verwende die Zielsprache korrekt: ${topic.targetGrammar}.`,
      targetForm: topic.targetGrammar,
      contentVersion: `20.8.23-${normalizedLevel.toLowerCase()}-runtime`,
      sourceId: "deutsch-authored-conversation-curriculum-v20",
    };
  });

export const speechLocale: Readonly<Record<StudioLanguage, string>> = {
  de: "de-DE",
};

export const copy = {
  de: {
    title: "Gesprächsstudio",
    subtitle: "Sprechen, verbessern und Sicherheit gewinnen",
    filterTitle: "Gespräch auswählen",
    labels: ["Lernpfad", "Niveau", "Fertigkeit", "Kategorie", "Thema"],
    all: "Alle",
    ready: "Bereit",
    recording: "Deine Antwort wird aufgenommen…",
    recorded: "Deine Aufnahme ist bereit",
    record: "Antwort aufnehmen",
    transcript: "Dein Transkript",
    transcriptPlaceholder:
      "Deine gesprochene Antwort erscheint hier. Erkennungsfehler kannst du vor der Auswertung korrigieren.",
    evaluate: "Antwort auswerten",
    evaluating: "LanguageTool prüft…",
    saved: "Sitzung wurde auf diesem Gerät gespeichert.",
    providerUnavailable:
      "LanguageTool ist nicht erreichbar. Es wurde keine Auswertung erfunden; bitte versuche es erneut.",
    pronunciation:
      "Nicht ausgewertet — dafür ist eine Audioanalyse erforderlich.",
  },
} as const;
