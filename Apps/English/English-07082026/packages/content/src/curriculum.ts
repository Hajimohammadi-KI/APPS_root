import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarResource, GrammarUnit } from "./types";

const MINIMUM_CONTROLLED_EXERCISES = 6;

// Some legacy units were generated from a `commonError` that was only a
// category label (e.g. "Unclear pronoun reference.", "Using slang in a
// formal report.") rather than an actual "wrong → correct" sentence pair,
// combined with an `examples` list built for illustrating a device rather
// than for quoting as complete sentences. That produced two flavors of
// broken "Correct the sentence" / "Type another model sentence" exercises:
// (1) the stored answer is a dangling fragment ("This limitation...") or
// leaked template syntax ("vs What do you mean?"), and (2) the answer is a
// complete, well-formed sentence but has nothing to do with the "error"
// named in the prompt (e.g. "Correct the sentence: Using slang in a formal
// report." paired with "Could you clarify the requirement?" — there is no
// slang in the prompt to correct). Filter both out instead of serving them
// to learners as if they were a real correction task.
const FRAGMENT_ANSWER_PATTERN = /\.\.\.\s*$|^\s*(?:vs|\/)\s+/i;
const CORRECT_THE_SENTENCE_PROMPT = /^Correct the sentence:\s*/i;

function isWellFormedExercise(
  [prompt, answer]: GrammarExercise,
  unit: GrammarUnit,
): boolean {
  if (!answer.trim() || FRAGMENT_ANSWER_PATTERN.test(answer.trim())) {
    return false;
  }
  // A "Correct the sentence" exercise only makes sense when `commonError`
  // actually stores a "wrong → correct" pair to correct. When it's just a
  // category label, the prompt has no real wrong sentence in it at all, so
  // whatever answer got attached to it is unrelated by construction.
  if (
    CORRECT_THE_SENTENCE_PROMPT.test(prompt) &&
    !unit.commonError.includes(" → ")
  ) {
    return false;
  }
  return true;
}

function ensureSixExercises(unit: GrammarUnit): GrammarUnit {
  const wellFormed = unit.exercises.filter((exercise) =>
    isWellFormedExercise(exercise, unit),
  );

  // `rule`/`recallTest`/`transferTest`/`commonError` are always complete,
  // well-formed sentences (never derived from the fragmentary `examples`
  // entries that caused the bug above), so every candidate below is safe
  // filler even for units whose original exercises were entirely broken.
  const candidatePool: GrammarExercise[] = [
    [`State the rule for “${unit.title}” from memory.`, unit.recallTest],
    [
      `Write the transfer model for “${unit.title}” accurately.`,
      unit.transferTest,
    ],
    [
      `Repair this common error for “${unit.title}” and write the full corrected sentence.`,
      unit.repairTest,
    ],
    [`Explain the rule for “${unit.title}” in your own words.`, unit.rule],
    [
      `Name the common error learners make with “${unit.title}”.`,
      unit.commonError,
    ],
    [
      `Apply “${unit.title}” correctly in a new sentence of your own.`,
      unit.transferTest,
    ],
    [`Teach “${unit.title}” to a classmate in one sentence.`, unit.rule],
  ];
  const candidates = candidatePool.filter((candidate) =>
    isWellFormedExercise(candidate, unit),
  );

  const exercises = [...wellFormed];
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

// A small number of C1/C2 legacy units link to test-english.com pages that
// only exist up to B2 (the generator fell back to the nearest lower-level
// page and mislabeled it as the "same exact-topic lesson"). These two were
// flagged by a content audit as genuinely misleading — fix them to point at
// real, verified C1/C2-appropriate resources instead of leaving a B2 page
// mislabeled as advanced content.
const RESOURCE_LEVEL_OVERRIDES: Record<string, GrammarResource[]> = {
  "Advanced cohesion": [
    [
      "Online explanation",
      "https://learnenglish.britishcouncil.org/grammar/c1-grammar/avoiding-repetition-text",
      "British Council C1 explanation of reference chains and repetition avoidance, a genuinely C-level match for “Advanced cohesion”.",
      "explanation",
    ],
    [
      "Online exercises",
      "https://learnenglish.britishcouncil.org/grammar/c1-grammar/avoiding-repetition-text",
      "British Council C1 interactive exercises on reference chains and repetition avoidance, a genuinely C-level match for “Advanced cohesion”.",
      "exercise",
    ],
  ],
  "Genre-specific grammar": [
    [
      "Online explanation",
      "https://learnenglish.britishcouncil.org/skills/writing/c1-writing",
      "British Council C1 writing skills across narratives, reports, proposals, and presentations, a genuinely C-level match for “Genre-specific grammar”.",
      "explanation",
    ],
    [
      "Online exercises",
      "https://learnenglish.britishcouncil.org/skills/writing/c1-writing",
      "British Council C1 writing practice across narratives, reports, proposals, and presentations, a genuinely C-level match for “Genre-specific grammar”.",
      "exercise",
    ],
  ],
};

function repairMislabeledResourceLinks(unit: GrammarUnit): GrammarUnit {
  const override = RESOURCE_LEVEL_OVERRIDES[unit.title];
  if (!override) return unit;
  return { ...unit, links: override };
}

export {
  legacyGrammarUnits,
  ensureSixExercises,
  repairMislabeledResourceLinks,
};
export const grammarUnits: GrammarUnit[] = [
  ...legacyGrammarUnits,
  ...cefrSupplementalUnits,
]
  .map(ensureSixExercises)
  .map(repairGrammarUnitLinks)
  .map(repairMislabeledResourceLinks);
