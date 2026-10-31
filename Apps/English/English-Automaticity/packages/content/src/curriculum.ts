import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarUnit } from "./types";
import { knownContentRepair } from "@automaticity/learning-core/content-repairs";

const MINIMUM_CONTROLLED_EXERCISES = 6;

function ensureSixExercises(unit: GrammarUnit): GrammarUnit {
  const candidates: GrammarExercise[] = [
    [`State the rule for “${unit.title}” from memory.`, unit.recallTest],
    [
      `Write the transfer model for “${unit.title}” accurately.`,
      unit.transferTest,
    ],
    [
      `Repair this common error for “${unit.title}” and write the full corrected sentence.`,
      unit.repairTest,
    ],
  ];

  const exercises = [...unit.exercises];
  const prompts = new Set(exercises.map((exercise) => exercise[0]));
  for (const candidate of candidates) {
    if (exercises.length >= MINIMUM_CONTROLLED_EXERCISES) break;
    if (prompts.has(candidate[0])) continue;
    exercises.push(candidate);
    prompts.add(candidate[0]);
  }

  return {
    ...unit,
    exercises,
  };
}

function repairKnownContent(unit: GrammarUnit): GrammarUnit {
  const repair = knownContentRepair("en", unit.title);
  if (!repair) return unit;
  return {
    ...unit,
    commonError: `${repair.source} → ${repair.answer}`,
    repairTest: repair.answer,
    exercises: unit.exercises.map<GrammarExercise>((exercise) =>
      exercise[0] === repair.legacyPrompt
        ? [repair.prompt, repair.answer]
        : exercise,
    ),
  };
}
export { legacyGrammarUnits };
export const grammarUnits: GrammarUnit[] = [
  ...legacyGrammarUnits,
  ...cefrSupplementalUnits,
]
  .map(repairKnownContent)
  .map(ensureSixExercises)
  .map(repairGrammarUnitLinks);
