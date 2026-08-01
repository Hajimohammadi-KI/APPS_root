import grammarData from "./data/grammar.json";
import topicsData from "./data/topics.json";
import {
  completeControlledExercises,
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
  readonly examples: readonly string[];
  readonly commonError: string;
  readonly exercises: readonly (readonly string[])[];
  readonly links: readonly GrammarLink[];
  readonly testAnswer: string;
  readonly recallTest: string;
  readonly repairTest: string;
  readonly transferTest: string;
}

export const speakingTopics = topicsData as unknown as readonly SpeakingTopic[];
type LegacyGrammarUnit = Omit<GrammarUnit, "explanation">;

const legacyGrammarUnits =
  grammarData as unknown as readonly LegacyGrammarUnit[];

export const grammarUnits: readonly GrammarUnit[] = legacyGrammarUnits.map(
  (unit) => {
    const explanation =
      grammarExplanations[unit.title as keyof typeof grammarExplanations];

    if (!explanation) {
      throw new Error(`Missing complete explanation for "${unit.title}".`);
    }

    return repairGermanGrammarLinks({
      ...unit,
      exercises: completeControlledExercises(unit),
      explanation,
    });
  },
);

export const catalogSummary = {
  topicCount: speakingTopics.length,
  grammarUnitCount: grammarUnits.length,
  levels: [...new Set(grammarUnits.map((unit) => unit.level))],
} as const;
