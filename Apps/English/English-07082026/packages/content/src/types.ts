export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ConversationTopic {
  track: string;
  level: CefrLevel;
  skill: string;
  category: string;
  topic: string;
  task: string;
  modelAnswer: string;
  targetGrammar: CefrLevel;
}

export type GrammarResourceRole = "explanation" | "exercise";
export type GrammarResource = [
  label: string,
  url: string,
  description: string,
  role: GrammarResourceRole,
];
export type GrammarExercise = [prompt: string, answer: string];

export interface GrammarUnit {
  level: CefrLevel;
  title: string;
  rule: string;
  examples: string[];
  commonError: string;
  exercises: GrammarExercise[];
  links: GrammarResource[];
  testAnswer: string;
  recallTest: string;
  repairTest: string;
  transferTest: string;
  // Fixed/semi-fixed multi-word chunks (collocations, fixed phrases) drawn
  // from this unit's own verified `examples` -- never fabricated new text.
  // Optional (rather than required) because the raw legacy/supplemental
  // catalog literals in generated/grammar.ts and cefr-supplement.ts predate
  // this field; curriculum.ts's pipeline always populates it before the
  // public `grammarUnits` export, so any unit reachable through that export
  // has it, but the type stays honest about the raw sources.
  formulaicSequences?: string[];
}

export interface OnlineResource {
  skill: string;
  level: string;
  provider: "Test-English" | "British Council" | "IELTS";
  title: string;
  url: string;
}
