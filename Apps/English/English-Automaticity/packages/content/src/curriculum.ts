import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarUnit } from "./types";
import { knownContentRepair } from "@automaticity/learning-core/content-repairs";
import {
  checkedPracticeFor,
  controlledPracticeFor,
  contentRevisionFor,
  gapCueRevisionsFor,
  retiredRepairPrompt,
  type RevisedTask,
} from "@automaticity/learning-core/content-revisions";
import { gapFill, normalizeText } from "@automaticity/learning-core/text";
import { modelSentenceCue } from "./lab-model-cues";

const MINIMUM_CONTROLLED_EXERCISES = 6;

/** Fills the unit to six exercises with the learning path's checkable items,
 * then a checked repair of the unit's error. Reciting the rule or a can-do
 * statement checked nothing and is no longer offered. */
function ensureSixExercises(unit: GrammarUnit): GrammarUnit {
  // The learner needs to see the error, written left of "→" in commonError.
  const error = unit.commonError.split("→")[0]!.trim();
  const practice = checkedPracticeFor("en", unit.title);
  const candidates: GrammarExercise[] = [
    ...practice
      .filter((row) => !row.notebook)
      .map(({ prompt, answers: [answer, ...alternatives] }) =>
        revisedExercise({ prompt, answer: answer!, alternatives }),
      ),
    [
      `Correct this common error for “${unit.title}” and write the full corrected sentence: ${error}`,
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
  // The learner's error-notebook items follow every earlier exercise, so saved
  // Lab progress keeps its positions; their recorded wrong forms come along.
  for (const row of practice) {
    if (!row.notebook || prompts.has(row.prompt)) continue;
    const [answer, ...alternatives] = row.answers;
    exercises.push([
      row.prompt,
      answer!,
      {
        answerRole: "expected",
        ...(alternatives.length && { acceptedAnswers: [...alternatives] }),
        ...(row.rejected && {
          rejectedAnswers: row.rejected.map((wrong) => ({ ...wrong })),
        }),
      },
    ]);
    prompts.add(row.prompt);
  }

  for (const row of controlledPracticeFor("en", unit.title)) {
    if (prompts.has(row.prompt)) continue;
    const [answer, ...alternatives] = row.answers;
    const existingIndex = exercises.findIndex(
      ([, key, metadata]) =>
        metadata?.answerRole !== "inspiration" &&
        normalizeText(key) === normalizeText(answer!) &&
        (metadata?.acceptedAnswers ?? []).every((value) =>
          row.answers.some(
            (form) => normalizeText(form) === normalizeText(value),
          ),
        ),
    );
    if (existingIndex >= 0) {
      const existing = exercises[existingIndex]!;
      exercises[existingIndex] = [
        existing[0],
        existing[1],
        {
          ...existing[2],
          rejectedAnswers: [
            ...(existing[2]?.rejectedAnswers ?? []),
            ...row.rejected.map((wrong) => ({ ...wrong })),
          ],
        },
      ];
      continue;
    }
    exercises.push([
      row.prompt,
      answer!,
      {
        answerRole: "expected",
        acceptedAnswers: [...alternatives],
        rejectedAnswers: row.rejected.map((wrong) => ({ ...wrong })),
      },
    ]);
    prompts.add(row.prompt);
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
/** The learning path's visible cue for a one-gap exercise that had none. */
function cueGaps(unit: GrammarUnit): GrammarUnit {
  const revisions = gapCueRevisionsFor("en", unit.title);
  return {
    ...unit,
    exercises: unit.exercises.map<GrammarExercise>((exercise, index) => {
      const revision = revisions.get(index);
      const [answer, ...alternatives] = revision?.answers ?? [
        exercise[1],
        ...(exercise[2]?.acceptedAnswers ?? []),
      ];
      // A revision that keeps the stored answer must fit this exercise's answer.
      return revision &&
        /_{2,}/u.test(exercise[0]) &&
        (revision.answers || gapFill(revision.prompt, answer!) !== null)
        ? revisedExercise({
            prompt: revision.prompt,
            answer: answer!,
            alternatives,
          })
        : exercise;
    }),
  };
}
/** Copying a visible model sentence or explaining the rule checked nothing:
 * the model sentence returns as a recall item, and the rule recital makes way
 * for the learning path's checked items added by ensureSixExercises. */
function recallModelSentences(unit: GrammarUnit): GrammarUnit {
  return {
    ...unit,
    exercises: unit.exercises.flatMap<GrammarExercise>((exercise) => {
      if (/^Explain the rule:/u.test(exercise[0])) return [];
      const model = exercise[0].match(
        /^Type (?:the|another) model sentence: (.+)$/u,
      )?.[1];
      const cue = model === undefined ? undefined : modelSentenceCue(model);
      return [cue ? [cue.prompt, cue.answer] : exercise];
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
  .map(cueGaps)
  .map(recallModelSentences)
  .map(ensureSixExercises)
  .map(repairGrammarUnitLinks);
