/** Authored micro-skills: never infer grammar decisions or solutions from title regexes. */
export interface WorksheetItem {
  id: string;
  prompt: string;
  answer: string;
  cause: string;
  trigger: string;
  category: string;
  contrast: string;
}

export interface GrammarWorksheet {
  id: string;
  topic: string;
  level: string;
  title: string;
  focus: string;
  focusFa: string;
  prerequisite: string;
  decision: readonly string[];
  models: readonly { label: string; cue: string; sentence: string }[];
  reference: readonly (readonly [string, string, string])[];
  notice: string;
  learn: readonly WorksheetItem[];
  guided: readonly WorksheetItem[];
  transform: readonly WorksheetItem[];
  recall: WorksheetItem;
  oral: readonly WorksheetItem[];
  correction: readonly WorksheetItem[];
  personal: readonly string[];
  guidedInstruction?: string;
  reconstructionInstruction?: string;
  correctionInstruction?: string;
  correctionLabel?: string;
  personalReason?: string;
  category?: string;
}
