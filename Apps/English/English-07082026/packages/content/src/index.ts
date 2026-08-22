import { onlineResources as legacyOnlineResources } from "./generated/resources";
import { repairOnlineResource } from "./resource-links";

export * from "./types";
export * from "./grammar-pedagogy";
export { grammarUnits, legacyGrammarUnits } from "./curriculum";
export { onlineResources as legacyOnlineResources } from "./generated/resources";
export const onlineResources = legacyOnlineResources.map(repairOnlineResource);
export { conversationTopics } from "./generated/topics";
export {
  englishMediationB1Pilot,
  releasedEnglishMediationB1,
} from "./mediation-b1-pilot";
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
