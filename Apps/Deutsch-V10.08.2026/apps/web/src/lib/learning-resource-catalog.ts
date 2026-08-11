import { grammarUnits, speakingTopics } from "@grammar/content";

export const RESOURCE_AREAS = [
  "Grammatik",
  "Gesprächsstudio",
  "Prüfung",
] as const;

export const RESOURCE_LEVELS = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "DSH",
  "TestDaF",
] as const;

export type ResourceArea = (typeof RESOURCE_AREAS)[number];
export type ResourceLevel = (typeof RESOURCE_LEVELS)[number];

export interface LearningResource {
  readonly id: string;
  readonly area: ResourceArea;
  readonly level: ResourceLevel;
  readonly skill: string;
  readonly topic: string;
  readonly description: string;
  readonly provider: string;
  readonly href: string;
  readonly external: boolean;
  readonly actionLabel: string;
}

function grammarHref(topic: string): string {
  return `/grammatik?${new URLSearchParams({ topic }).toString()}`;
}

const grammarResources: readonly LearningResource[] = grammarUnits.map(
  (unit, index) => ({
    id: `grammar-${index}-${unit.level}`,
    area: "Grammatik",
    level: unit.level as ResourceLevel,
    skill: "Grammatik",
    topic: unit.title,
    description: unit.rule,
    provider: "Deutsch-App · vollständige Lektion",
    href: grammarHref(unit.title),
    external: false,
    actionLabel: "Erklärung & Übungen öffnen",
  }),
);

function speakingLevel(track: string, level: string): ResourceLevel {
  if (track === "DSH-Vorbereitung") return "DSH";
  if (track === "Digitaler TestDaF") return "TestDaF";
  return level as ResourceLevel;
}

const speakingResources: readonly LearningResource[] = speakingTopics.map(
  (topic, index) => ({
    id: `speaking-${index}`,
    area: "Gesprächsstudio",
    level: speakingLevel(topic.track, topic.level),
    skill: topic.skill,
    topic: topic.topic,
    description: topic.task,
    provider: topic.track,
    href: `/studio?topic=${index}`,
    external: false,
    actionLabel: "Dieses Thema üben",
  }),
);

const examResources: readonly LearningResource[] = [
  {
    id: "exam-dsh",
    area: "Prüfung",
    level: "DSH",
    skill: "Prüfungsaufbau",
    topic: "DSH-Beispielprüfung",
    description:
      "Vollständige Beispielaufgaben und Hinweise für den Hochschulzugang.",
    provider: "Universität Münster",
    href: "https://www.uni-muenster.de/Sprachenzentrum/ldaf/dsh/dshbeispielpruefung.html",
    external: true,
    actionLabel: "Beispielprüfung öffnen",
  },
  {
    id: "exam-testdaf",
    area: "Prüfung",
    level: "TestDaF",
    skill: "Prüfungsvorbereitung",
    topic: "Digitaler TestDaF",
    description:
      "Offizielle Vorbereitung mit Aufgabentypen, Tutorials und Beispielen.",
    provider: "TestDaF-Institut",
    href: "https://www.testdaf.de/de/teilnehmende/der-digitale-testdaf/vorbereitung-auf-den-digitalen-testdaf/",
    external: true,
    actionLabel: "Offizielle Vorbereitung öffnen",
  },
];

const publicCourseExercises: readonly LearningResource[] = [
  {
    id: "schubert-begegnungen-a1",
    area: "Grammatik",
    level: "A1",
    skill: "Online-Übungen",
    topic: "Begegnungen A1+ · öffentliche Übungen",
    description:
      "Frei zugängliche Aufgaben des SCHUBERT-Verlags zu Grammatik, Wortschatz und Hörverstehen auf Niveau A1.",
    provider: "SCHUBERT-Verlag",
    href: "https://www.aufgaben.schubert-verlag.de/uebungen_a1/a1_uebungen_index.htm",
    external: true,
    actionLabel: "Öffentliche Übungen öffnen",
  },
  {
    id: "schubert-begegnungen-a2",
    area: "Grammatik",
    level: "A2",
    skill: "Online-Übungen",
    topic: "Begegnungen A2+ · öffentliche Übungen",
    description:
      "Frei zugängliche Aufgaben des SCHUBERT-Verlags zu Grammatik, Wortschatz und Hörverstehen auf Niveau A2.",
    provider: "SCHUBERT-Verlag",
    href: "https://www.aufgaben.schubert-verlag.de/uebungen_a2/a2_uebungen_index.htm",
    external: true,
    actionLabel: "Öffentliche Übungen öffnen",
  },
];

export const LEARNING_RESOURCES: readonly LearningResource[] = [
  ...grammarResources,
  ...publicCourseExercises,
  ...speakingResources,
  ...examResources,
];
