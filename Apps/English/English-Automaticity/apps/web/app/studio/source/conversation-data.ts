import { containsTokenPhrase } from "@automaticity/learning-core/text";
import { conversationTopics as curriculumTopics } from "@grammar/content";
import type { SpokenChunk } from "@grammar/content";

export type StudioLanguage = "en" | "de";
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ConversationTopic {
  readonly id: string;
  readonly language: StudioLanguage;
  readonly path: "Complete English";
  readonly level: CefrLevel;
  readonly skill: string;
  readonly category: string;
  readonly topic: string;
  readonly task: string;
  readonly goal: string;
  readonly targetForm: string;
  readonly spokenChunks: readonly SpokenChunk[];
  readonly contentVersion: string;
  readonly sourceId: string;
}

const levels = new Set<CefrLevel>(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const conversationTopics: readonly ConversationTopic[] =
  curriculumTopics.map((topic, index) => {
    if (!levels.has(topic.level as CefrLevel)) {
      throw new Error(
        `Unsupported CEFR level in conversation curriculum: ${topic.level}`,
      );
    }

    return {
      id: `en-${topic.level.toLowerCase()}-${String(index + 1).padStart(3, "0")}`,
      language: "en",
      path: "Complete English",
      level: topic.level as CefrLevel,
      skill: topic.skill,
      category: topic.category,
      topic: topic.topic,
      task: topic.task,
      goal: `Complete this ${topic.level} can-do task independently, use the target language accurately, and include at least two natural spoken chunks.`,
      targetForm:
        topic.targetGrammar === topic.level
          ? `${topic.level} ${topic.skill} can-do production`
          : topic.targetGrammar,
      spokenChunks: topic.spokenChunks,
      contentVersion: `27.3.21-${topic.level.toLowerCase()}-spoken-chunks`,
      sourceId: "english-authored-conversation-curriculum-v27",
    };
  });

export function spokenChunksUsed(
  transcript: string,
  chunks: readonly SpokenChunk[],
): readonly SpokenChunk[] {
  return chunks.filter((chunk) => containsTokenPhrase(transcript, chunk.text));
}

export const speechLocale: Readonly<Record<StudioLanguage, string>> = {
  en: "en-US",
  de: "de-DE",
};

export const copy = {
  en: {
    title: "Speaking Studio",
    subtitle: "Speak, improve, and build confidence",
    filterTitle: "Choose your conversation",
    labels: ["Learning path", "Level", "Skill", "Category", "Topic"],
    all: "All",
    ready: "Ready",
    recording: "Recording your answer…",
    recorded: "Your recording is ready",
    record: "Record answer",
    transcript: "Your transcript",
    transcriptPlaceholder:
      "Your spoken answer will appear here. You can review recognition errors before evaluation.",
    evaluate: "Evaluate my answer",
    evaluating: "Checking with LanguageTool…",
    saved: "Session saved on this device.",
    savedWithoutAudio:
      "Session saved on this device without the recording. To keep recordings, turn on “Save my recordings” in Settings.",
    consentNotice:
      "Evaluation sends your transcript (never the recording) to LanguageTool (languagetool.org). Online checks are off, so nothing has been sent.",
    allowOnline: "Allow online checks and evaluate",
    flagged: "Flagged",
    providerUnavailable:
      "LanguageTool is unavailable. No evaluation was invented; please try again.",
    pronunciation: "Not evaluated — an audio-analysis provider is required.",
  },
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
    savedWithoutAudio:
      "Sitzung ohne Aufnahme auf diesem Gerät gespeichert. Um Aufnahmen zu behalten, aktiviere „Save my recordings“ in den Einstellungen.",
    consentNotice:
      "Die Auswertung sendet dein Transkript (nie die Aufnahme) an LanguageTool (languagetool.org). Online-Prüfungen sind aus, daher wurde nichts gesendet.",
    allowOnline: "Online-Prüfung erlauben und auswerten",
    flagged: "Markiert",
    providerUnavailable:
      "LanguageTool ist nicht erreichbar. Es wurde keine Auswertung erfunden; bitte versuche es erneut.",
    pronunciation:
      "Nicht ausgewertet — dafür ist eine Audioanalyse erforderlich.",
  },
} as const;
