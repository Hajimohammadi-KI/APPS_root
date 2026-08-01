import type { GrammarUnit } from "./types";

export const PATH_GROUPS: Record<string, string[]> = {
  "Complete English Path · A1–C2": [
    "General English",
    "Q Skills inspired",
    "Academic Skills",
    "Advanced Academic English",
  ],
  "Academic English · B1–C2": [
    "Q Skills inspired",
    "Academic Skills",
    "Advanced Academic English",
  ],
  "General English · A1–A2": ["General English"],
  "Q Skills inspired · B1": ["Q Skills inspired"],
  "Academic Skills · B2–C1": ["Academic Skills"],
  "Advanced Academic English · C2": ["Advanced Academic English"],
};

export const GRAMMAR_CATEGORIES = [
  "Tenses & aspect",
  "Modal verbs",
  "Conditionals & wishes",
  "Passive & causative",
  "Nouns, articles & quantity",
  "Pronouns & possession",
  "Questions & negation",
  "Clauses & sentence structure",
  "Comparison",
  "Prepositions & adverbs",
  "Word order & emphasis",
  "Cohesion, register & style",
  "Verb patterns",
  "Foundations & other",
] as const;

export type GrammarCategory = (typeof GRAMMAR_CATEGORIES)[number];

export function grammarCategory(grammar: Pick<GrammarUnit, "title">): GrammarCategory {
  const title = grammar.title.toLowerCase();
  if (/conditional|counterfactual|wish|if only/.test(title)) return "Conditionals & wishes";
  if (/modal|can\/can|must\/have to/.test(title)) return "Modal verbs";
  if (/passive|causative/.test(title)) return "Passive & causative";
  if (/present|past|future|tense|aspect|for and since/.test(title)) return "Tenses & aspect";
  if (/article|noun|plural|countable|uncountable|some\/any|much\/many|quantifier|nominalisation/.test(title)) {
    return "Nouns, articles & quantity";
  }
  if (/pronoun|possessive|substitution|ellipsis/.test(title)) return "Pronouns & possession";
  if (/question|negative/.test(title)) return "Questions & negation";
  if (/relative clause|participle clause|subordination|clause pattern|complex noun phrase/.test(title)) {
    return "Clauses & sentence structure";
  }
  if (/comparative|superlative|too\/enough/.test(title)) return "Comparison";
  if (/preposition|adverb of frequency/.test(title)) return "Prepositions & adverbs";
  if (/inversion|cleft|fronting|word order|emphasis/.test(title)) return "Word order & emphasis";
  if (/discourse|contrast|capital|apostrophe|hedging|stance|register|parallelism|cohesion|rhetorical|academic|punctuation|editing|genre|style|ambiguity|automatic production|british and american/.test(title)) {
    return "Cohesion, register & style";
  }
  if (/gerund|infinitive|reporting verb/.test(title)) return "Verb patterns";
  return "Foundations & other";
}
