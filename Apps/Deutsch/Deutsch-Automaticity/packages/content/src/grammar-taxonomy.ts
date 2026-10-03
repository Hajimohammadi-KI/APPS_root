export const GRAMMAR_CATEGORIES = [
  "Zeitformen",
  "Verben & Verbformen",
  "Nomen, Artikel & Plural",
  "Kasus",
  "Pronomen",
  "Adjektive & Adverbien",
  "Präpositionen",
  "Satzbau & Nebensätze",
  "Konnektoren & Textverknüpfung",
  "Passiv & Konjunktiv",
  "Wortbildung & feste Verbindungen",
  "Sprachgebrauch & Register",
] as const;

export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number];

export interface GrammarTaxonomyInput {
  readonly title: string;
  readonly rule: string;
}

const CATEGORY_PATTERNS: Readonly<Record<GrammarCategory, readonly string[]>> =
  {
    Zeitformen: [
      "präsens",
      "präteritum",
      "perfekt",
      "plusquamperfekt",
      "futur",
      "zeitform",
      "tempus",
      "vergangenheit",
      "gegenwart",
    ],
    "Verben & Verbformen": [
      "verb",
      "sein",
      "haben",
      "infinitiv",
      "partizip",
      "passiv",
      "konjunktiv",
      "imperativ",
      "reflexiv",
      "trennbar",
      "modal",
    ],
    "Nomen, Artikel & Plural": [
      "artikel",
      "kein",
      "plural",
      "nomen",
      "genus",
      "nominal",
      "n-deklination",
      "apposition",
    ],
    Kasus: [
      "akkusativ",
      "dativ",
      "genitiv",
      "nominativ",
      "kasus",
      "deklination",
    ],
    Pronomen: [
      "pronomen",
      "reflexiv",
      "demonstrativ",
      "indefinit",
      "possessiv",
    ],
    "Adjektive & Adverbien": [
      "adjektiv",
      "adverb",
      "komparativ",
      "superlativ",
      "graduierung",
    ],
    Präpositionen: ["präposition", "wechselpräposition"],
    "Satzbau & Nebensätze": [
      "nebensatz",
      "hauptsatz",
      "satzbau",
      "wortstellung",
      "relativsatz",
      "relativsätz",
      "infinitiv",
      "partizipial",
      "infinitivsatz",
      "dass-satz",
      "fragesatz",
      "fragen",
      "satzklammer",
      "vorfeld",
      "mittelfeld",
      "nachfeld",
      "attributsatz",
      "einbettung",
      "syntax",
      "ellipse",
    ],
    "Konnektoren & Textverknüpfung": [
      "konnektor",
      "konjunktion",
      "kohäsion",
      "kohärenz",
      "textverknüpf",
      "kausal",
      "konzessiv",
      "konditional",
      "finalsatz",
      "temporalsatz",
      "adversativ",
      "parallelismus",
      "wenn und als",
      "um...zu",
      "damit",
      "obwohl",
      "trotzdem",
      "je...desto",
      "sowohl...als auch",
      "weder...noch",
    ],
    "Passiv & Konjunktiv": [
      "passiv",
      "konjunktiv",
      "indirekte rede",
      "irrealis",
      "modus",
    ],
    "Wortbildung & feste Verbindungen": [
      "nomen-verb",
      "funktionsverb",
      "wortbildung",
      "nominalisierung",
      "verbalisierung",
      "feste verbind",
      "kollokation",
      "präfix",
      "suffix",
      "idiomati",
    ],
    "Sprachgebrauch & Register": [
      "register",
      "stil",
      "textsort",
      "pragmati",
      "hedging",
      "bedeutungs",
      "ambiguität",
      "interferenz",
      "selbstreparatur",
      "automatische produktion",
      "rhetorisch",
    ],
  };

/**
 * Grammar topics can belong to more than one useful learning category.
 * For example, "Verben mit Präpositionen" is both a verb and a preposition
 * topic. Returning all matches prevents legitimate level/category
 * combinations from appearing empty.
 */
export function grammarCategoriesFor(
  grammar: GrammarTaxonomyInput,
): readonly GrammarCategory[] {
  const source = grammar.title.toLocaleLowerCase("de");
  const matches = GRAMMAR_CATEGORIES.filter((category) =>
    CATEGORY_PATTERNS[category].some((pattern) => {
      if (["nomen", "verb", "sein", "haben", "kein"].includes(pattern)) {
        return new RegExp(`\\b${pattern}`, "u").test(source);
      }
      return source.includes(pattern);
    }),
  );

  return matches.length > 0 ? matches : ["Sprachgebrauch & Register"];
}
