export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface SpokenChunk {
  text: string;
  purpose: string;
  example: string;
}

export interface ConversationTopic {
  track: string;
  level: CefrLevel;
  skill: string;
  category: string;
  topic: string;
  task: string;
  modelAnswer: string;
  targetGrammar: CefrLevel;
  spokenChunks: SpokenChunk[];
}

export type GrammarResourceRole = "explanation" | "exercise";
export type GrammarResource = [
  label: string,
  url: string,
  description: string,
  role: GrammarResourceRole,
];
/** Further complete answers the Grammar Lab accepts besides the stored one. */
export interface GrammarExerciseMetadata {
  acceptedAnswers?: string[];
  /** Reviewed wrong forms; the Lab marks one for repair with its explanation. */
  rejectedAnswers?: { answer: string; explanation: string }[];
  /** An expected answer is checked even when the prompt names no gap or correction. */
  answerRole?: "expected" | "inspiration";
}
export type GrammarExercise = [
  prompt: string,
  answer: string,
  metadata?: GrammarExerciseMetadata,
];

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
}

export interface OnlineResource {
  skill: string;
  level: string;
  provider: "Test-English" | "British Council" | "IELTS";
  title: string;
  url: string;
}
