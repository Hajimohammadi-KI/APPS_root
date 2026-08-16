import { grammarUnits, speakingTopics as curriculumTopics } from "@grammar/content";

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
  // Real link into the grammar catalog, not just the shared CEFR level --
  // speakingTopics.targetGrammar in the raw data is literally just the
  // level string, no reference to a specific grammar point. Assigned
  // deterministically by rotating through that level's 24 grammarUnits in
  // catalog order, so every conversation topic points at a genuine,
  // existing unit (never invented) and the 24 units at a level get even
  // coverage across that level's ~13 topics.
  readonly relatedGrammar: string | null;
}

const levels = new Set<CefrLevel>(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const conversationTopics: readonly ConversationTopic[] = (() => {
  const seenPerLevel = new Map<CefrLevel, number>();
  return curriculumTopics.map((topic, index) => {
    const normalizedLevel = (
      topic.level === "B2-C1" ? "B2" : topic.level
    ) as CefrLevel;

    if (!levels.has(normalizedLevel)) {
      throw new Error(
        `Nicht unterstütztes GER-Niveau im Gesprächskatalog: ${topic.level}`,
      );
    }

    const levelUnits = grammarUnits.filter(
      (unit) => unit.level === normalizedLevel,
    );
    const seq = seenPerLevel.get(normalizedLevel) ?? 0;
    seenPerLevel.set(normalizedLevel, seq + 1);
    const relatedUnit = levelUnits.length
      ? levelUnits[seq % levelUnits.length]
      : undefined;

    return {
      id: `de-${normalizedLevel.toLowerCase()}-${String(index + 1).padStart(3, "0")}`,
      language: "de",
      path: "Komplettes Deutsch",
      level: normalizedLevel,
      skill: topic.skill,
      category: topic.category,
      topic: topic.topic,
      task: topic.task,
      relatedGrammar: relatedUnit?.title ?? null,
      goal: relatedUnit
        ? `Bewältige diese Kann-Aufgabe auf Niveau ${normalizedLevel} selbstständig und verwende dabei „${relatedUnit.title}“ korrekt.`
        : `Bewältige diese Kann-Aufgabe auf Niveau ${normalizedLevel} selbstständig und verwende die Zielsprache korrekt: ${topic.targetGrammar}.`,
    };
  });
})();

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
