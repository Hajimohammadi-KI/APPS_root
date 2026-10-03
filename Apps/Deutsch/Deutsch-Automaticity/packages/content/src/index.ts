import grammarData from "./data/grammar.json";
import topicsData from "./data/topics.json";
import {
  classifyGrammarContent,
  completeControlledExercises,
  type GrammarContentType,
  type GrammarExercise,
} from "./exercise-completion";
import {
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  type GrammarCategory,
} from "./grammar-taxonomy";
import {
  deutschMitMarijaSharedWithMeUrl,
  deutschMitMarijaSourceFolders,
  discussionGuideMaterials,
  discussionAudioMaterials,
  driveMaterialCollections,
  driveMaterialFolderUrl,
  errorRepairMaterials,
  grammarTrainingCatalog,
  grammarTrainingMaterials,
  grammarTrainingParts,
  idiomDailyMaterials,
  type DriveMaterialCollection,
  type DriveMaterialItem,
  type GrammarTrainingPart,
} from "./materials";
import {
  grammarExplanations,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  type GrammarExplanation,
  type GrammarMaterialSource,
} from "./explanations";
import { repairGermanGrammarLinks } from "./resource-links";
import { supplementalGrammarUnits } from "./grammar-supplement";
export {
  FERTIGKEITEN,
  cefrCurriculum,
  type CefrCurriculumLevel,
  type CefrStufe,
} from "./cefr-curriculum";
export {
  germanMediationB1Pilot,
  releasedGermanMediationB1,
} from "./mediation-b1-pilot";

export {
  deutschMitMarijaSharedWithMeUrl,
  deutschMitMarijaSourceFolders,
  discussionGuideMaterials,
  discussionAudioMaterials,
  driveMaterialCollections,
  driveMaterialFolderUrl,
  errorRepairMaterials,
  grammarTrainingCatalog,
  grammarTrainingMaterials,
  grammarTrainingParts,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  idiomDailyMaterials,
  type DriveMaterialCollection,
  type DriveMaterialItem,
  type GrammarTrainingPart,
  type GrammarCategory,
  type GrammarContentType,
  type GrammarExercise,
  type GrammarExplanation,
  type GrammarMaterialSource,
};

export interface SpeakingTopic {
  readonly track: string;
  readonly level: string;
  readonly skill: string;
  readonly category: string;
  readonly topic: string;
  readonly task: string;
  readonly modelAnswer: string;
  readonly targetGrammar: string;
}

export interface GrammarLink {
  readonly 0: string;
  readonly 1: string;
  readonly 2: string;
  readonly 3: string;
  readonly 4: string;
}

export interface GrammarUnit {
  readonly level: string;
  readonly title: string;
  readonly rule: string;
  readonly explanation: GrammarExplanation;
  readonly contentType?: GrammarContentType;
  readonly examples: readonly string[];
  readonly commonError: string;
  readonly exercises: readonly GrammarExercise[];
  readonly links: readonly GrammarLink[];
  readonly testAnswer: string;
  readonly recallTest: string;
  readonly repairTest: string;
  readonly transferTest: string;
}

function normalizeSpeakingTopic(
  topic: SpeakingTopic,
  index: number,
): SpeakingTopic {
  const subject = `„${topic.topic}“`;
  const variant = index % 3;

  if (topic.level === "A1") {
    return {
      ...topic,
      task: `Sprich über das Thema ${subject}. Nenne drei persönliche Informationen und stelle am Ende eine einfache Frage.`,
      modelAnswer:
        variant === 0
          ? `Das Thema ${subject} ist für mich im Alltag wichtig. Ich kenne dazu ein gutes Beispiel. Darüber spreche ich gern. Wie ist das bei dir?`
          : variant === 1
            ? `Bei ${subject} denke ich zuerst an meinen Alltag. Ich mache dabei etwas Bestimmtes gern. Ein kleines Beispiel kann ich erklären. Was machst du?`
            : `Ich möchte kurz über ${subject} sprechen. Für mich gehört das zum normalen Leben. Ich nenne dazu ein Beispiel. Kennst du das auch?`,
    };
  }

  if (topic.level === "A2") {
    return {
      ...topic,
      task: `Berichte über eine persönliche Erfahrung zum Thema ${subject}. Beschreibe, was passiert ist, wie du reagiert hast und was du daraus gelernt hast.`,
      modelAnswer: `Zum Thema ${subject} habe ich vor Kurzem etwas erlebt. Zuerst war die Situation ungewohnt, aber dann habe ich eine passende Lösung gefunden. Dadurch habe ich etwas Wichtiges gelernt.`,
    };
  }

  if (topic.level === "B1") {
    return {
      ...topic,
      task: `Nimm zum Thema ${subject} Stellung. Formuliere eine klare Meinung, begründe sie und ergänze ein persönliches Beispiel.`,
      modelAnswer: `Beim Thema ${subject} halte ich eine ausgewogene Lösung für sinnvoll. Dafür spricht vor allem meine eigene Erfahrung. Ein konkretes Beispiel zeigt, dass kleine Veränderungen oft mehr bewirken als starre Regeln.`,
    };
  }

  if (topic.level === "B2" || topic.level === "B2-C1") {
    return {
      ...topic,
      task: `Diskutiere das Thema ${subject} differenziert. Stelle zwei Perspektiven gegenüber, bewerte ihre Folgen und begründe deine eigene Position.`,
      modelAnswer: `Das Thema ${subject} lässt sich aus unterschiedlichen Perspektiven betrachten. Einerseits gibt es überzeugende praktische Vorteile, andererseits entstehen mögliche Nachteile. Entscheidend ist für mich, welche Lösung langfristig tragfähig und fair bleibt.`,
    };
  }

  if (topic.level === "C1") {
    return {
      ...topic,
      task: `Analysiere das Thema ${subject}. Ordne zentrale Argumente ein, benenne eine Einschränkung und formuliere ein begründetes Urteil mit präzisen Verknüpfungen.`,
      modelAnswer: `Bei einer Analyse des Themas ${subject} reicht eine einfache Zustimmung oder Ablehnung nicht aus. Die Bewertung hängt von Voraussetzungen, Betroffenen und langfristigen Folgen ab. Daher überzeugt mich eine Position nur, wenn sie auch mögliche Gegenargumente berücksichtigt.`,
    };
  }

  return {
    ...topic,
    task: `Erörtere das Thema ${subject} präzise und nuanciert. Differenziere Begriffe, prüfe mindestens ein Gegenargument und formuliere ein stilistisch angemessenes Fazit.`,
    modelAnswer: `Das Thema ${subject} verlangt zunächst eine begriffliche Klärung. Erst danach lassen sich konkurrierende Positionen hinsichtlich ihrer Annahmen und Konsequenzen vergleichen. Mein Fazit fällt deshalb bewusst differenziert aus und berücksichtigt auch die Grenzen der eigenen Bewertung.`,
  };
}

const legacySpeakingTopics = topicsData as unknown as readonly SpeakingTopic[];

export const speakingTopics: readonly SpeakingTopic[] =
  legacySpeakingTopics.map(normalizeSpeakingTopic);
type LegacyGrammarUnit = Omit<GrammarUnit, "explanation">;

const legacyGrammarUnits =
  grammarData as unknown as readonly LegacyGrammarUnit[];

export const grammarUnits: readonly GrammarUnit[] = [
  ...legacyGrammarUnits.map((unit) => {
    const explanation =
      grammarExplanations[unit.title as keyof typeof grammarExplanations];

    if (!explanation) {
      throw new Error(`Missing complete explanation for "${unit.title}".`);
    }

    return repairGermanGrammarLinks({
      ...unit,
      contentType: classifyGrammarContent(unit),
      exercises: completeControlledExercises(unit),
      explanation,
    });
  }),
  ...supplementalGrammarUnits.map((unit) =>
    repairGermanGrammarLinks({
      ...unit,
      contentType: classifyGrammarContent(unit),
      exercises: completeControlledExercises(unit),
    }),
  ),
];

export const catalogSummary = {
  topicCount: speakingTopics.length,
  grammarUnitCount: grammarUnits.length,
  levels: [...new Set(grammarUnits.map((unit) => unit.level))],
} as const;
