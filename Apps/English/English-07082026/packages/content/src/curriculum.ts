import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarResource, GrammarUnit } from "./types";

// Raised from 6 -- the original candidate pool below only had enough
// distinct, safe prompts to reach ~6-7 per unit regardless of this
// constant. The expanded pool (more prompts per already-verified field,
// plus one per example sentence) realistically reaches ~10-12 for most
// units. This is still short of the "hundreds of repetitions" skill
// acquisition research calls for -- it is what can be generated safely
// from content that already exists per unit without fabricating new
// example sentences (which would risk introducing bad grammar).
const MINIMUM_CONTROLLED_EXERCISES = 10;

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

  // `rule`/`recallTest`/`transferTest`/`commonError`/`testAnswer` are
  // always complete, well-formed sentences (never derived from the
  // fragmentary `examples` entries that caused the bug above), so every
  // fixed candidate below is safe filler even for units whose original
  // exercises were entirely broken. Several fields get a second, distinct
  // prompt phrasing rather than a second field, since asking the same
  // verified-correct answer a different way is still genuine additional
  // retrieval practice without risking new, unverified sentences.
  const candidatePool: GrammarExercise[] = [
    [`State the rule for “${unit.title}” from memory.`, unit.recallTest],
    [
      `Recall the rule for “${unit.title}” without looking it up.`,
      unit.recallTest,
    ],
    [
      `Write the transfer model for “${unit.title}” accurately.`,
      unit.transferTest,
    ],
    [
      `Apply “${unit.title}” correctly in a new sentence of your own.`,
      unit.transferTest,
    ],
    [
      `Repair this common error for “${unit.title}” and write the full corrected sentence.`,
      unit.repairTest,
    ],
    [`Explain the rule for “${unit.title}” in your own words.`, unit.rule],
    [`Teach “${unit.title}” to a classmate in one sentence.`, unit.rule],
    [
      `Name the common error learners make with “${unit.title}”.`,
      unit.commonError,
    ],
    [
      `Write the standard reference answer for “${unit.title}”.`,
      unit.testAnswer,
    ],
    // Deliberately NOT including a "Type the model sentence: <example>"
    // candidate here anymore: that prompt printed the expected answer
    // verbatim inside itself, so completing it was copy-typing, not
    // recall -- it inflated the exercise count without adding genuine
    // retrieval practice. Removing it lowers the achieved count for
    // some units below MINIMUM_CONTROLLED_EXERCISES; that is honest
    // volume, not a regression to hide.
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

// Splits each verified example sentence on clause boundaries (commas and a
// small set of connective words) rather than fabricating new text, so every
// candidate chunk is a substring of content that already passed the same
// review as the rest of the unit. Kept to 2-6 words: long enough to be a
// genuine multi-word formulaic sequence (not a single word), short enough to
// still be a fixed/semi-fixed chunk rather than a whole sentence.
const CLAUSE_SPLIT =
  /,| and | but | because | so | when | if | that | while | before | after /i;
const MAX_FORMULAIC_SEQUENCES_PER_UNIT = 6;
const MIN_CHUNK_WORDS = 2;
const MAX_CHUNK_WORDS = 6;

export function deriveFormulaicSequences(unit: GrammarUnit): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  function addCandidate(raw: string) {
    const trimmed = raw.trim().replace(/^[-–—]\s*/, "").replace(/[.?!]+$/, "").trim();
    if (!trimmed) return;
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < MIN_CHUNK_WORDS || wordCount > MAX_CHUNK_WORDS) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(trimmed);
  }

  for (const example of unit.examples) {
    for (const clause of example.split(CLAUSE_SPLIT)) {
      addCandidate(clause);
    }
  }

  // Some units' examples are a single sentence with no comma/connective to
  // split on, so clause-splitting alone can leave the pool empty -- either
  // because the whole example is one clause under MIN_CHUNK_WORDS, or
  // (verified-content-only) too long over MAX_CHUNK_WORDS to pass
  // addCandidate as-is. Falling back to the first MAX_CHUNK_WORDS words of
  // the example (still a verbatim substring of verified content, never
  // fabricated) keeps every unit with at least some formulaic-sequence pool.
  if (candidates.length === 0) {
    for (const example of unit.examples) {
      const trimmed = example.trim().replace(/[.?!]+$/, "");
      if (!trimmed) continue;
      const words = trimmed.split(/\s+/);
      addCandidate(
        words.length > MAX_CHUNK_WORDS
          ? words.slice(0, MAX_CHUNK_WORDS).join(" ")
          : trimmed,
      );
    }
  }

  return candidates.slice(0, MAX_FORMULAIC_SEQUENCES_PER_UNIT);
}

function attachFormulaicSequences(unit: GrammarUnit): GrammarUnit {
  return { ...unit, formulaicSequences: deriveFormulaicSequences(unit) };
}

export {
  legacyGrammarUnits,
  ensureSixExercises,
  repairMislabeledResourceLinks,
  attachFormulaicSequences,
};
export const grammarUnits: GrammarUnit[] = [
  ...legacyGrammarUnits,
  ...cefrSupplementalUnits,
]
  .map(ensureSixExercises)
  .map(repairGrammarUnitLinks)
  .map(repairMislabeledResourceLinks)
  .map(attachFormulaicSequences);
