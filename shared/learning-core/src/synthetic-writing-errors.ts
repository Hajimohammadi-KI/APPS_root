/** Test data augmentation only: these examples never qualify evaluator precision. */
export function syntheticWritingErrors(
  correct: readonly string[],
  language: "en" | "de",
) {
  const mutations =
    language === "en"
      ? [
          ["an hour", "a hour", "EN_INITIAL_SOUND"],
          ["He has", "He have", "EN_SUBJECT_AGREEMENT"],
          ["some advice", "an advice", "EN_UNCOUNTABLE"],
        ]
      : [
          ["mit mir", "mit mich", "DE_PREPOSITION_CASE"],
          ["Ich bin gegangen", "Ich habe gegangen", "DE_PERFEKT_AUXILIARY"],
          ["ein Buch", "ein buch", "DE_NOUN_CAPITAL"],
        ];
  return correct.flatMap((text) =>
    mutations
      .filter(([from]) => text.includes(from!))
      .map(([from, to, ruleId]) => ({
        correct: text,
        error: text.replace(from!, to!),
        language,
        ruleId: ruleId!,
        purpose: "synthetic-recall-only" as const,
      })),
  );
}
