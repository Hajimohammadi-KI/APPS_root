export type GrammarExercise = readonly [prompt: string, answer: string];

export interface ExerciseCompletionInput {
  readonly title: string;
  readonly commonError: string;
  readonly examples: readonly string[];
  readonly exercises: readonly (readonly string[])[];
  readonly testAnswer: string;
  readonly repairTest: string;
  readonly transferTest: string;
}

const MINIMUM_CONTROLLED_EXERCISES = 6;

function cleanSentence(sentence: string): string {
  return sentence.trim().replace(/\s+/g, " ");
}

function withoutTerminalPunctuation(token: string): string {
  return token.replace(/[.!?;:,]+$/u, "");
}

function changedToken(correct: string, incorrect: string): string | undefined {
  const correctTokens = correct.split(/\s+/u);
  const incorrectTokens = incorrect.split(/\s+/u);
  const changedIndex = correctTokens.findIndex(
    (token, index) =>
      withoutTerminalPunctuation(token).toLocaleLowerCase("de") !==
      withoutTerminalPunctuation(
        incorrectTokens[index] ?? "",
      ).toLocaleLowerCase("de"),
  );

  return correctTokens[changedIndex];
}

function maskTarget(sentence: string, preferredToken?: string): string {
  const words = sentence.split(/\s+/u);
  const preferred = preferredToken
    ? withoutTerminalPunctuation(preferredToken)
    : "";
  const targetIndex = words.findIndex(
    (word) =>
      preferred.length > 0 &&
      withoutTerminalPunctuation(word).toLocaleLowerCase("de") ===
        preferred.toLocaleLowerCase("de"),
  );
  const fallbackIndex = words.reduce(
    (bestIndex, word, index) =>
      withoutTerminalPunctuation(word).length >
      withoutTerminalPunctuation(words[bestIndex] ?? "").length
        ? index
        : bestIndex,
    0,
  );
  const index = targetIndex >= 0 ? targetIndex : fallbackIndex;
  const punctuation = words[index]?.match(/[.!?;:,]+$/u)?.[0] ?? "";
  words[index] = `___${punctuation}`;
  return words.join(" ");
}

function reorderedParts(sentence: string): string {
  const normalized = cleanSentence(sentence);
  const punctuation = normalized.match(/[.!?]+$/u)?.[0] ?? "";
  const words = normalized.replace(/[.!?]+$/u, "").split(/\s+/u);

  if (words.length < 2) {
    return normalized;
  }

  return `${words.slice(1).reverse().join(" / ")} / ${words[0]}${punctuation}`;
}

function correctionParts(commonError: string): {
  readonly incorrect: string;
  readonly correct: string;
} {
  const [incorrect, explicitCorrection] = commonError
    .split("→", 2)
    .map(cleanSentence);

  return {
    incorrect: incorrect || commonError,
    correct: explicitCorrection || "",
  };
}

/**
 * The migrated catalog originally contained three controlled exercises per
 * unit. These deterministic additions produce two further, topic-specific
 * retrieval formats without changing the frozen legacy source:
 * a correction-based cloze, a sentence-order reconstruction, and a
 * transfer-retrieval prompt.
 */
export function completeControlledExercises(
  unit: ExerciseCompletionInput,
): readonly GrammarExercise[] {
  const existing: GrammarExercise[] = unit.exercises.map((exercise) => [
    exercise[0]?.trim() ?? "",
    exercise[1]?.trim() ?? "",
  ]);

  if (existing.length >= MINIMUM_CONTROLLED_EXERCISES) {
    return existing;
  }

  const correction = correctionParts(unit.commonError);
  const repairCandidate = cleanSentence(
    unit.repairTest || correction.correct || "",
  );
  const correctedSentence = cleanSentence(
    repairCandidate.split(/\s+/u).length >= 3
      ? repairCandidate
      : unit.testAnswer || repairCandidate,
  );
  const incorrectSentence = cleanSentence(
    correction.incorrect || unit.commonError,
  );
  const token = changedToken(correctedSentence, incorrectSentence);
  const reconstructionAnswer = cleanSentence(
    unit.examples.find(
      (example) => cleanSentence(example) !== correctedSentence,
    ) ??
      unit.testAnswer ??
      correctedSentence,
  );
  const candidates: readonly GrammarExercise[] = [
    [
      `Setze die fehlende Form ein und schreibe den ganzen Satz: ${maskTarget(
        correctedSentence,
        token,
      )}`,
      correctedSentence,
    ],
    [
      `Ordne die Satzteile zu einem korrekten Satz: ${reorderedParts(
        reconstructionAnswer,
      )}`,
      reconstructionAnswer,
    ],
    [
      `Übertrage die Regel in eine neue Situation und schreibe den Zielsatz vollständig: ${unit.transferTest}`,
      cleanSentence(unit.transferTest),
    ],
    [
      `Korrigiere den Satz vollständig und achte auf „${unit.title}“: ${incorrectSentence}`,
      correctedSentence,
    ],
  ];
  const prompts = new Set(existing.map(([prompt]) => prompt));

  for (const candidate of candidates) {
    if (
      existing.length >= MINIMUM_CONTROLLED_EXERCISES ||
      prompts.has(candidate[0])
    ) {
      continue;
    }
    existing.push(candidate);
    prompts.add(candidate[0]);
  }

  if (existing.length < MINIMUM_CONTROLLED_EXERCISES) {
    throw new Error(
      `Could not complete five controlled exercises for "${unit.title}".`,
    );
  }

  return existing;
}
