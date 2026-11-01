import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarUnit } from "./types";
import { knownContentRepair } from "@automaticity/learning-core/content-repairs";
import {
  contentRevisionFor,
  retiredRepairPrompt,
  type RevisedTask,
} from "@automaticity/learning-core/content-revisions";
import { normalizeText } from "@automaticity/learning-core/text";

const MINIMUM_CONTROLLED_EXERCISES = 6;

function ensureSixExercises(unit: GrammarUnit): GrammarUnit {
  // The learner needs to see the error, written left of "→" in commonError.
  const error = unit.commonError.split("→")[0]!.trim();
  const candidates: GrammarExercise[] = [
    [`State the rule for “${unit.title}” from memory.`, unit.recallTest],
    [
      `Write the transfer model for “${unit.title}” accurately.`,
      unit.transferTest,
    ],
    [
      `Repair this common error for “${unit.title}” and write the full corrected sentence: ${error}`,
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
const revisedExercise = ({
  prompt,
  answer,
  alternatives,
}: RevisedTask): GrammarExercise =>
  alternatives?.length
    ? [prompt, answer, { acceptedAnswers: [...alternatives] }]
    : [prompt, answer];

/** The same authored 2026-11-01 revision as the independent learning path. */
function reviseContent(unit: GrammarUnit): GrammarUnit {
  const revision = contentRevisionFor("en", unit.title);
  if (!revision) return unit;
  const examples = revision.examples ?? unit.examples;
  const renamed = new Map(
    unit.examples.map((old, index) => [old, examples[index] ?? examples[0]!]),
  );
  const repair = revision.repair;
  const retired =
    repair && normalizeText(retiredRepairPrompt("en", repair.old));
  return {
    ...unit,
    examples: [...examples],
    ...(repair && {
      commonError: `${repair.source} → ${repair.answer}`,
      repairTest: repair.answer,
    }),
    exercises: unit.exercises.map<GrammarExercise>(([prompt, answer]) => {
      if (repair && normalizeText(prompt) === retired)
        return revisedExercise(repair);
      const example = renamed.get(answer);
      return example && example !== answer
        ? [prompt.replace(answer, example), example]
        : [prompt, answer];
    }),
  };
}
export { legacyGrammarUnits };
export const grammarUnits: GrammarUnit[] = [
  ...legacyGrammarUnits,
  ...cefrSupplementalUnits,
]
  .map(repairKnownContent)
  .map(reviseContent)
  .map(ensureSixExercises)
  .map(repairGrammarUnitLinks);
