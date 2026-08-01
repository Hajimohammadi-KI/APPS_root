import { onlineResources as legacyOnlineResources } from "./generated/resources";
import { repairOnlineResource } from "./resource-links";

export * from "./types";
export { grammarUnits, legacyGrammarUnits } from "./curriculum";
export {
  onlineResources as legacyOnlineResources,
} from "./generated/resources";
export const onlineResources = legacyOnlineResources.map(repairOnlineResource);
export { conversationTopics } from "./generated/topics";
export {
  GRAMMAR_CATEGORIES,
  PATH_GROUPS,
  grammarCategory,
} from "./taxonomy";
export {
  qSkillsIntroResources,
  qSkillsLevels,
  qSkillsSourceFolder,
} from "./qskills";
export type {
  QSkillsLevel,
  QSkillsResource,
  QSkillsResourceKind,
  QSkillsUnit,
} from "./qskills";
