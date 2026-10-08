export type StudioLanguage = "en" | "de";

export interface ConversationTopic {
  readonly id: string;
  readonly language: StudioLanguage;
  readonly path: string;
  readonly level: "A1" | "A2" | "B1" | "B2" | "C1";
  readonly skill: string;
  readonly category: string;
  readonly topic: string;
  readonly task: string;
  readonly goal: string;
}

export const conversationTopics: readonly ConversationTopic[] = [
  {
    id: "en-introducing-yourself",
    language: "en",
    path: "Complete English",
    level: "A1",
    skill: "Speaking",
    category: "Introducing yourself",
    topic: "Introduce yourself with confidence",
    task: "Give four short sentences about yourself and ask one question.",
    goal: "Use am, live, work or study, and one question naturally.",
  },
  {
    id: "en-daily-routine",
    language: "en",
    path: "Complete English",
    level: "A2",
    skill: "Speaking",
    category: "Daily life",
    topic: "Describe your weekday routine",
    task: "Describe a normal weekday, include three time expressions, and explain which part you enjoy.",
    goal: "Keep the present simple accurate while connecting ideas.",
  },
  {
    id: "en-recent-experience",
    language: "en",
    path: "Complete English",
    level: "B1",
    skill: "Conversation",
    category: "Experiences",
    topic: "Talk about a recent achievement",
    task: "Describe something you have recently achieved, how you did it, and why it matters now.",
    goal: "Use the present perfect for the result and the past simple for details.",
  },
  {
    id: "en-problem-solving",
    language: "en",
    path: "Complete English",
    level: "B2",
    skill: "Conversation",
    category: "Work and study",
    topic: "Solve a problem with a colleague",
    task: "Explain a realistic problem, suggest two solutions, and politely ask your colleague for an opinion.",
    goal: "Use diplomatic language and make the alternatives clear.",
  },
  {
    id: "en-opinion-technology",
    language: "en",
    path: "Complete English",
    level: "C1",
    skill: "Fluency",
    category: "Opinions",
    topic: "Evaluate technology in education",
    task: "Give a balanced opinion on technology in education, support it with an example, and address one counterargument.",
    goal: "Maintain a clear argument with precise connectors and register.",
  },
  {
    id: "de-vorstellen",
    language: "de",
    path: "Complete German",
    level: "A1",
    skill: "Sprechen",
    category: "Sich vorstellen",
    topic: "Sich sicher vorstellen",
    task: "Stell dich in vier kurzen Sätzen vor und stelle danach eine Frage.",
    goal: "Verwende heißen, wohnen, arbeiten oder studieren und eine Frage korrekt.",
  },
  {
    id: "de-tagesablauf",
    language: "de",
    path: "Complete German",
    level: "A2",
    skill: "Sprechen",
    category: "Alltag",
    topic: "Einen Wochentag beschreiben",
    task: "Beschreibe einen normalen Wochentag, nenne drei Zeitangaben und erkläre, welchen Teil du gern magst.",
    goal: "Halte das Präsens stabil und verbinde deine Aussagen.",
  },
  {
    id: "de-erfahrung",
    language: "de",
    path: "Complete German",
    level: "B1",
    skill: "Gespräch",
    category: "Erfahrungen",
    topic: "Über einen aktuellen Erfolg sprechen",
    task: "Erzähle von etwas, das du kürzlich geschafft hast, wie du es geschafft hast und warum es jetzt wichtig ist.",
    goal: "Verwende das Perfekt für das Erlebnis und klare Zeitangaben.",
  },
  {
    id: "de-problemloesung",
    language: "de",
    path: "Complete German",
    level: "B2",
    skill: "Gespräch",
    category: "Arbeit und Studium",
    topic: "Ein Problem gemeinsam lösen",
    task: "Erkläre ein realistisches Problem, schlage zwei Lösungen vor und frage höflich nach der Meinung deines Gegenübers.",
    goal: "Formuliere diplomatisch und stelle die Alternativen deutlich gegenüber.",
  },
  {
    id: "de-meinung-technologie",
    language: "de",
    path: "Complete German",
    level: "C1",
    skill: "Flüssigkeit",
    category: "Meinungen",
    topic: "Technologie in der Bildung bewerten",
    task: "Äußere eine ausgewogene Meinung zu Technologie in der Bildung, nenne ein Beispiel und gehe auf ein Gegenargument ein.",
    goal: "Baue eine klare Argumentation mit präzisen Konnektoren auf.",
  },
] as const;

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
    transcriptPlaceholder: "Your spoken answer will appear here. You can review recognition errors before evaluation.",
    evaluate: "Evaluate my answer",
    evaluating: "Checking with LanguageTool…",
    saved: "Session saved on this device.",
    providerUnavailable: "LanguageTool is unavailable. No evaluation was invented; please try again.",
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
    transcriptPlaceholder: "Deine gesprochene Antwort erscheint hier. Erkennungsfehler kannst du vor der Auswertung korrigieren.",
    evaluate: "Antwort auswerten",
    evaluating: "LanguageTool prüft…",
    saved: "Sitzung wurde auf diesem Gerät gespeichert.",
    providerUnavailable: "LanguageTool ist nicht erreichbar. Es wurde keine Auswertung erfunden; bitte versuche es erneut.",
    pronunciation: "Nicht ausgewertet — dafür ist eine Audioanalyse erforderlich.",
  },
} as const;
