/** Non-initial token counts in distinct examples and accepted answers from
 * curriculum-de.json 2026-09-05.5; ambiguous words excluded by lexical review.
 * These counts establish a limited orthography scope, not a correctness score.
 */
export const GERMAN_NOUN_CORPUS: Readonly<
  Record<
    string,
    { readonly noun: string; readonly upper: number; readonly lower: number }
  >
> = {
  buch: { noun: "Buch", upper: 10, lower: 0 },
  frau: { noun: "Frau", upper: 3, lower: 0 },
  mann: { noun: "Mann", upper: 5, lower: 0 },
  haus: { noun: "Haus", upper: 4, lower: 0 },
};
export const GERMAN_NOUNS: Readonly<
  Record<
    string,
    {
      readonly gender: "m" | "f" | "n";
      readonly plural: string;
      readonly weak: boolean;
    }
  >
> = {
  Mann: { gender: "m", plural: "Männer", weak: false },
  Frau: { gender: "f", plural: "Frauen", weak: false },
  Kind: { gender: "n", plural: "Kinder", weak: false },
  Buch: { gender: "n", plural: "Bücher", weak: false },
  Haus: { gender: "n", plural: "Häuser", weak: false },
  Student: { gender: "m", plural: "Studenten", weak: true },
};
