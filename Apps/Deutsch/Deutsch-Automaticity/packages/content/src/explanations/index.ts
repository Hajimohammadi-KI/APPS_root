import { a1Explanations } from "./a1";
import { a2Explanations } from "./a2";
import { b1Explanations } from "./b1";
import { b2Explanations } from "./b2";
import { c1Explanations } from "./c1";
import { c2Explanations } from "./c2";

export {
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  type GrammarExplanation,
  type GrammarMaterialSource,
} from "./schema";

export const grammarExplanations = {
  ...a1Explanations,
  ...a2Explanations,
  ...b1Explanations,
  ...b2Explanations,
  ...c1Explanations,
  ...c2Explanations,
} as const;
