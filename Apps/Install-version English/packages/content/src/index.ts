import { onlineResources as legacyOnlineResources } from "./generated/resources";
import { repairOnlineResource } from "./resource-links";

export * from "./types";
export * from "./grammar-pedagogy";
export {
	grammarUnits,
	legacyGrammarUnits,
	ensureSixExercises,
	repairMislabeledResourceLinks,
	deriveFormulaicSequences,
	attachFormulaicSequences,
} from "./curriculum";
export { onlineResources as legacyOnlineResources } from "./generated/resources";
export const onlineResources = legacyOnlineResources.map(repairOnlineResource);
export { conversationTopics } from "./generated/topics";
export { GRAMMAR_CATEGORIES, PATH_GROUPS, grammarCategory } from "./taxonomy";
export {
	INTEGRATED_SKILLS,
	buildAutomaticitySteps,
	getIntegratedSkillsLevel,
	integratedSkillsLevels,
} from "./integrated-skills";
export type {
	AutomaticityStage,
	AutomaticityStep,
	IntegratedSkill,
	IntegratedSkillsLevel,
	IntegratedSkillsUnit,
} from "./integrated-skills";
export {
	DATASET_LANGUAGES,
	FOUR_LANGUAGE_SKILLS,
	OPEN_LANGUAGE_DATASETS,
	getOpenDatasetSkillPlans,
	getOpenLanguageDataset,
	validateOpenDatasetCatalog,
} from "./open-language-datasets";
export type {
	DatasetLanguage,
	FourLanguageSkill,
	LocalDatasetImporter,
	OpenDatasetLicense,
	OpenDatasetSkillPlan,
	OpenLanguageDataset,
} from "./open-language-datasets";
export {
	importOpenDatasetText,
	importedItemsToJsonLines,
} from "./open-dataset-import";
export type {
	ImportedOpenDatasetItem,
	ImportOpenDatasetOptions,
} from "./open-dataset-import";
