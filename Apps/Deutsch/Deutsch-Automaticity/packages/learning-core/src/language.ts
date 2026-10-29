const training = {
  en: "the people have been working together because they want to learn. she is writing a letter and he will read it tomorrow. we went home with our friends after school. this is my book and your new house.",
  de: "die menschen haben zusammen gearbeitet weil sie lernen möchten. sie schreibt einen brief und er wird ihn morgen lesen. wir gingen nach der schule mit unseren freunden nach hause. das ist mein buch und dein neues haus.",
};
function trigrams(text: string): string[] {
  const words =
    text
      .toLocaleLowerCase()
      .normalize("NFC")
      .match(/\p{L}+/gu) ?? [];
  return words.flatMap((word) => {
    const padded = `^${word}$`;
    return Array.from({ length: Math.max(0, padded.length - 2) }, (_, i) =>
      padded.slice(i, i + 3),
    );
  });
}
const models = Object.fromEntries(
  Object.entries(training).map(([language, text]) => {
    const counts = new Map<string, number>();
    for (const gram of trigrams(text))
      counts.set(gram, (counts.get(gram) ?? 0) + 1);
    return [language, { counts, total: trigrams(text).length }];
  }),
) as Record<"en" | "de", { counts: Map<string, number>; total: number }>;
const vocabulary = new Set([
  ...models.en.counts.keys(),
  ...models.de.counts.keys(),
]).size;

/** Smoothed character-trigram log likelihood; a diagnostic, never grammar evidence. */
export function languageNgramScores(text: string): Record<"en" | "de", number> {
  const grams = trigrams(text.slice(0, 20000));
  const score = (language: "en" | "de") =>
    grams.reduce(
      (sum, gram) =>
        sum +
        Math.log(
          ((models[language].counts.get(gram) ?? 0) + 1) /
            (models[language].total + vocabulary),
        ),
      0,
    ) / Math.max(1, grams.length);
  return { en: score("en"), de: score("de") };
}

export function detectTextLanguage(text: string): "de" | "fa" | "en" | "other" {
  const value = text.normalize("NFC").trim();
  if (!value) return "other";
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) return "other";
  if (
    Array.from(value).some(
      (character) =>
        /\p{Script=Arabic}/u.test(character) && /\p{L}/u.test(character),
    )
  ) {
    return /[A-Za-zÄÖÜäöüß]/u.test(value) ? "other" : "fa";
  }
  const words = value.toLocaleLowerCase("de-DE").match(/\p{L}+/gu) ?? [];
  if (!words.length || words.some((word) => /[^\p{Script=Latin}]/u.test(word)))
    return "other";
  // Sparse lexical clues, not language proof. Shared/unknown words and mixed
  // evidence must remain inconclusive; an authored closed answer is checked separately.
  const german = new Set(
    "ich du wir ihr sie mich dich sich euch ihnen mein meine meinen meiner meinem dein deine sein seine unser unsere nicht kein keine keinen ist sind bist habe hast haben habt wird werden wurde wurden würde wäre hätte könnte könnten muss müssen soll sollen kann können weil dass obwohl damit deshalb daher gibt bitte danke nein für über ohne zwischen zum zur beim gefahren gegangen".split(
      " ",
    ),
  );
  const shared = new Set(
    "der die das den dem des ein eine einen einem einer und mit nach aus im es er war hat bin".split(
      " ",
    ),
  );
  const english = new Set(
    "the and is are were this that these those you your my we they he she have has had hello friend please with from not our their write answer sentence".split(
      " ",
    ),
  );
  const germanHits = words.filter((word) => german.has(word)).length;
  const sharedHits = new Set(words.filter((word) => shared.has(word))).size;
  const englishHits = words.filter((word) => english.has(word)).length;
  const scores = languageNgramScores(value);
  // Asymmetric abstention: a statistical model can veto lexical evidence,
  // but cannot promote unknown Latin text into the expected language.
  if (germanHits && scores.en - scores.de > 1.5) return "other";
  if (englishHits && scores.de - scores.en > 1.5) return "other";
  if (englishHits && (germanHits || sharedHits >= 2)) return "other";
  if (englishHits) return "en";
  if (germanHits || sharedHits >= 2) return "de";
  return "other";
}
