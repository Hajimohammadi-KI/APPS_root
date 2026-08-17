import { cefrSupplementalUnits } from "./cefr-supplement";
import { grammarUnits as legacyGrammarUnits } from "./generated/grammar";
import { repairGrammarUnitLinks } from "./resource-links";
import type { GrammarExercise, GrammarResource, GrammarUnit } from "./types";

// How many items to aim for, not a guarantee. Measured against the shipped
// content after the copy-typing and self-contradicting items were filtered
// out: units land between 3 and 10 (3 for 3 units, 4 for 2, 5 for 12, 6 for
// 45, 7 for 22, 10 for 28). The earlier note here claimed "~10-12 for most
// units"; that was only true while items that printed their own answer still
// counted. Far short of the many distributed repetitions skill-acquisition
// research calls for -- and the gap closes by AUTHORING content, never by
// re-admitting items a learner can solve by copying.
const TARGET_CONTROLLED_EXERCISES = 10;

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
// Prompts that explicitly promise the learner a whole sentence. When the
// stored key is a bare fragment ("two children", "easier", "any time."), a
// learner who obeys the instruction and writes the full sentence is marked
// WRONG -- the instruction and the answer key contradict each other. Measured
// across the shipped content: 50 items. This prompt does not begin with
// Transform/Complete/Correct, so evaluatePracticeAnswer's lenient path never
// applied to it either; it was pure exact match against the fragment.
const FULL_SENTENCE_PROMPT = /write the full corrected sentence/i;

function normalizeForContainment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.!?,;:"'’“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// An exercise whose prompt already prints its expected answer tests typing,
// not retrieval. The generator stopped ADDING such candidates, but the units'
// own authored exercises were never filtered -- 110 items shipped this way
// ("Type the model sentence: I am a student." -> "I am a student."). German's
// exercise-completion.ts already applies this rule; English did not.
function promptContainsAnswer(prompt: string, expected: string): boolean {
  const answer = normalizeForContainment(expected);
  // Below a real clause, an incidental word overlap is not a copying signal.
  if (answer.split(" ").length < 3) return false;
  return normalizeForContainment(prompt).includes(answer);
}

function isWellFormedExercise(
  [prompt, answer]: GrammarExercise,
  unit: GrammarUnit,
): boolean {
  if (!answer.trim() || FRAGMENT_ANSWER_PATTERN.test(answer.trim())) {
    return false;
  }
  if (promptContainsAnswer(prompt, answer)) return false;
  // A promise of a full sentence paired with a fragment key is unanswerable
  // as written. Two words is the floor for "a sentence" here (e.g. "I agree."
  // is legitimate; "easier" is not).
  if (
    FULL_SENTENCE_PROMPT.test(prompt) &&
    answer.trim().split(/\s+/).length < 3
  ) {
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
  // exercises were entirely broken.
  //
  // Each field now contributes exactly ONE candidate. Previously three
  // fields each had a second prompt phrasing pointing at the same expected
  // answer, on the theory that re-asking it differently was extra retrieval
  // practice. Two of those pairs were actively harmful and are removed:
  //
  //   - "Apply X in a new sentence of your own" and "Explain the rule in
  //     your own words" promised open production but were graded by exact
  //     match against `transferTest`/`rule` (see evaluatePracticeAnswer:
  //     only Transform/Complete/Correct prompts get lenient grading). A
  //     learner writing a genuine sentence was marked WRONG; the only
  //     passing answer was typing the reference string verbatim. That
  //     trains string memorisation and silently inflates mastery.
  //   - "Explain"/"Teach the rule" test metalinguistic (declarative)
  //     knowledge -- explaining grammar -- which is the opposite of the
  //     automaticity this app exists to build. Real open production is
  //     already handled by the writing/transfer tasks and the
  //     Automatization Trainer, which grade against the online evaluator
  //     instead of a fixed string.
  //
  // Every remaining prompt states plainly that it wants the reference
  // answer, so what is asked matches what is graded.
  // 84 of 112 units carry the boilerplate transferTest "In a new situation,
  // I can use <title> accurately." Asking a learner to reproduce that teaches
  // nothing about the grammar -- the only variable part is the unit title
  // they were just shown -- so the transfer candidate is skipped whenever the
  // field is still that placeholder rather than a real model sentence.
  const TRANSFER_PLACEHOLDER =
    /^In a new situation, I can use .+ accurately\.$/i;
  const hasRealTransferModel =
    typeof unit.transferTest === "string" &&
    !TRANSFER_PLACEHOLDER.test(unit.transferTest.trim());

  const candidatePool: GrammarExercise[] = [
    [`State the rule for “${unit.title}” from memory.`, unit.recallTest],
    // Second retrieval of the same verified sentence under a different
    // prompt. Kept deliberately: re-retrieving a known-correct sentence is
    // legitimate spaced retrieval practice for automaticity. What was
    // removed above is different -- prompts that ASKED for the learner's own
    // wording while grading against a fixed string.
    [
      `Recall the rule for “${unit.title}” without looking it up.`,
      unit.recallTest,
    ],
    ...(hasRealTransferModel
      ? ([
          [
            `Write the transfer model for “${unit.title}” accurately.`,
            unit.transferTest,
          ],
        ] as GrammarExercise[])
      : []),
    [
      `Repair this common error for “${unit.title}” and write the full corrected sentence.`,
      unit.repairTest,
    ],
    [
      `Name the common error learners make with “${unit.title}”.`,
      unit.commonError,
    ],
    // Also kept even when it restates repairTest (true for 36 units): same
    // reasoning as the recall pair above -- a second retrieval of a real,
    // verified sentence is practice, not padding.
    [
      `Write the standard reference answer for “${unit.title}”.`,
      unit.testAnswer,
    ],
    // Deliberately NOT including a "Type the model sentence: <example>"
    // candidate here anymore: that prompt printed the expected answer
    // verbatim inside itself, so completing it was copy-typing, not
    // recall -- it inflated the exercise count without adding genuine
    // retrieval practice. Removing it lowers the achieved count for
    // some units below TARGET_CONTROLLED_EXERCISES; that is honest
    // volume, not a regression to hide.
  ];
  const candidates = candidatePool.filter((candidate) =>
    isWellFormedExercise(candidate, unit),
  );

  const exercises = [...wellFormed];
  const prompts = new Set(exercises.map((exercise) => exercise[0]));
  // Dedupe by ANSWER as well as by prompt. Several candidates point at the
  // same expected string (both rule prompts expect `recallTest`, which is
  // identical to `rule` in all 112 units). Admitting both spent two of the
  // unit's slots on one retrieval target; skipping the duplicate lets a
  // candidate with a genuinely new answer take the slot instead. The round
  // picker already deduped at display time -- doing it here means the saved
  // pool is honest too, not just what happens to be shown.
  const answers = new Set(
    exercises.map((exercise) => normalizeForContainment(exercise[1])),
  );
  for (const candidate of candidates) {
    if (exercises.length >= TARGET_CONTROLLED_EXERCISES) break;
    if (prompts.has(candidate[0])) continue;
    if (answers.has(normalizeForContainment(candidate[1]))) continue;
    exercises.push(candidate);
    prompts.add(candidate[0]);
    answers.add(normalizeForContainment(candidate[1]));
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
