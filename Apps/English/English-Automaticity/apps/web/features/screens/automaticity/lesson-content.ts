import { grammarUnits, type GrammarUnit } from "@grammar/content";

function requireDefaultGrammar() {
  const grammar =
    grammarUnits.find(
      (unit) => unit.title.toLocaleLowerCase("en") === "present perfect",
    ) ?? grammarUnits.at(0);
  if (!grammar) throw new Error("The grammar catalog is empty.");
  return grammar;
}

export const defaultGrammar = requireDefaultGrammar();

const presentPerfectModel =
  "I have worked on an important project this week. I have already solved two difficult problems. My supervisor has given me useful feedback. I have never felt so prepared to explain my work.";

const presentPerfectExercises = [
  {
    prompt: "Transform: I started this project in May and I still work on it.",
    expected: "I have worked on this project since May",
  },
  {
    prompt: "Complete: She ___ already ___ the report. (write)",
    expected: "She has already written the report",
  },
  {
    prompt: "Transform: This is my first experience with shadowing.",
    expected: "I have never tried shadowing before",
  },
] as const;

function isPresentPerfect(grammar: GrammarUnit) {
  return grammar.title.toLocaleLowerCase("en") === "present perfect";
}

export function lessonKey(grammar: GrammarUnit) {
  if (isPresentPerfect(grammar)) return "automaticity:present-perfect";
  return `automaticity:${grammar.title
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function lessonExercises(
  grammar: GrammarUnit,
): readonly { readonly prompt: string; readonly expected: string }[] {
  if (isPresentPerfect(grammar)) return presentPerfectExercises;
  return grammar.exercises.slice(0, 3).map(([prompt, expected]) => ({
    prompt,
    expected,
  }));
}

export function lessonModel(grammar: GrammarUnit) {
  if (isPresentPerfect(grammar)) return presentPerfectModel;
  return grammar.testAnswer.trim() || grammar.examples.join(" ");
}

export const shadowingStages = [
  "Listen without reading",
  "Listen while following the text",
  "Shadow one sentence at a time",
  "Shadow the complete passage",
  "Retell it freely without the text",
] as const;

export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}
