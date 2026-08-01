import type { GrammarUnit, GrammarResource } from "@grammar/content";
import type { ErrorClass, Settings } from "@/features/store/app-store";
import { wordCount } from "@/lib/utils";

export interface LanguageToolMatch {
  message: string;
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  context?: { text: string; offset: number; length: number };
  rule?: {
    id: string;
    category?: { id?: string; name?: string };
  };
}

export interface Evaluation {
  original: string;
  corrected: string;
  changed: boolean;
  online: boolean;
  matches: LanguageToolMatch[];
  error?: string;
  /** The learner may continue this practice step. */
  pass: boolean;
  /** A reliable language check was available; success is stored separately. */
  masteryEligible: boolean;
  spelling: LanguageToolMatch[];
  grammarIssues: LanguageToolMatch[];
  targetUses: number;
  required: number;
  complete: boolean;
  relevant: boolean;
  words: number;
  sentences: number;
  grammar: Pick<GrammarUnit, "title" | "rule" | "examples"> & {
    links?: GrammarResource[];
  };
  links: GrammarResource[];
  accuracyScore: number;
}

export type EvaluationResult = Evaluation;

export interface EvaluationOptions {
  grammar: Pick<GrammarUnit, "title" | "rule" | "examples"> & {
    links?: GrammarResource[];
  };
  minWords?: number;
  minSentences?: number;
  patterns?: string[];
  requiredTargetUses?: number;
  taskPrompt?: string;
}

const OFFLINE_RULES: Array<[RegExp, string]> = [
  [/\bshe don't\b/gi, "she doesn't"],
  [/\bhe don't\b/gi, "he doesn't"],
  [/\bdoesn't ([a-z]+)s\b/gi, "doesn't $1"],
  [/\bdid ([a-z]+)ed\b/gi, "did $1"],
  [/\bmore better\b/gi, "better"],
];

function offlineCorrect(text: string) {
  return OFFLINE_RULES.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}

const RELEVANCE_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "answer",
  "because",
  "before",
  "complete",
  "could",
  "create",
  "explain",
  "from",
  "grammar",
  "have",
  "into",
  "more",
  "sentence",
  "should",
  "task",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "this",
  "using",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "write",
  "your",
]);

function contentTokens(text: string) {
  return (
    text
      .toLocaleLowerCase("en")
      .match(/[a-z][a-z'-]{2,}/g)
      ?.filter((token) => !RELEVANCE_STOP_WORDS.has(token)) ?? []
  );
}

/**
 * Rejects empty, copied-looking, or unrelated filler without pretending to
 * understand the learner's meaning. Long, varied free production remains
 * acceptable even when it paraphrases the prompt.
 */
export function responseIsRelevant(
  text: string,
  taskPrompt: string | undefined,
  targetSatisfied: boolean,
) {
  const responseTokens = contentTokens(text);
  const uniqueResponse = new Set(responseTokens);
  if (uniqueResponse.size < 2 || !targetSatisfied) return false;

  const repetitionRatio =
    responseTokens.length > 0 ? uniqueResponse.size / responseTokens.length : 0;
  if (responseTokens.length >= 6 && repetitionRatio < 0.4) return false;

  const promptTokens = new Set(contentTokens(taskPrompt ?? ""));
  if (promptTokens.size === 0) return true;
  const overlapsPrompt = [...uniqueResponse].some((token) =>
    promptTokens.has(token),
  );

  // A direct answer normally reuses one meaningful prompt word. A sufficiently
  // developed paraphrase can still pass without lexical overlap.
  return overlapsPrompt || uniqueResponse.size >= 7;
}

export function issueType(match: LanguageToolMatch) {
  const id = match.rule?.id?.toLowerCase() ?? "";
  const category = match.rule?.category?.name?.toLowerCase() ?? "";
  return /spell|typo/.test(`${id}${category}`) ? "Spelling" : "Grammar";
}

export function classifyError(match: LanguageToolMatch): ErrorClass {
  const id = `${match.rule?.id ?? ""} ${match.rule?.category?.name ?? ""} ${
    match.message
  }`.toLowerCase();
  if (/spell|typo/.test(id)) return "spelling";
  if (/word order|position/.test(id)) return "word_order";
  if (/article|determiner/.test(id)) return "article";
  if (/case/.test(id)) return "case";
  if (/auxiliary/.test(id)) return "auxiliary";
  if (/ending|inflection/.test(id)) return "ending";
  if (/tense|verb form/.test(id)) return "tense";
  if (/agreement/.test(id)) return "agreement";
  return "other";
}

function targetSignals(grammar: EvaluationOptions["grammar"]): RegExp[] {
  const title = grammar.title.toLowerCase();
  const rule = grammar.rule.toLowerCase();
  if (/present perfect/.test(title)) {
    return [/\b(have|has)\s+(been\s+)?\w+(ed|en|n)\b/i];
  }
  if (/past perfect/.test(title)) return [/\bhad\s+\w+(ed|en|n)\b/i];
  if (/passive/.test(title)) {
    return [/\b(am|is|are|was|were|be|been|being)\s+\w+(ed|en|n)\b/i];
  }
  if (/conditional|wish/.test(title))
    return [/\bif\b/i, /\b(would|could|might|had)\b/i];
  if (/modal/.test(title))
    return [/\b(can|could|may|might|must|shall|should|will|would)\b/i];
  if (/relative/.test(title)) return [/\b(who|which|that|whose|where)\b/i];
  if (/question/.test(title)) {
    return [
      /\?$/,
      /^(do|does|did|is|are|was|were|have|has|had|can|could|would|will|what|why|when|where|who|how)\b/i,
    ];
  }
  if (/comparison|comparative|superlative/.test(title)) {
    return [/\b(than|more|less|most|least|better|worse)\b/i];
  }
  if (/link|concession|contrast/.test(`${title}${rule}`)) {
    return [
      /\b(because|so|but|however|although|whereas|while|nevertheless)\b/i,
    ];
  }
  const words =
    grammar.examples
      .join(" ")
      .toLowerCase()
      .match(/\b[a-z]{4,}\b/g) ?? [];
  return [...new Set(words)]
    .slice(0, 3)
    .map(
      (word) =>
        new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"),
    );
}

export async function evaluateResponse(
  text: string,
  options: EvaluationOptions,
  settings: Settings,
): Promise<Evaluation> {
  let correction: {
    original: string;
    corrected: string;
    changed: boolean;
    online: boolean;
    matches: LanguageToolMatch[];
    error?: string;
  };

  try {
    if (!settings.onlineFeedback) {
      throw new Error("Optional online feedback is disabled.");
    }
    const response = await fetch(`${settings.apiBaseUrl}/api/assessment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, language: "en-US" }),
    });
    if (!response.ok)
      throw new Error(`Assessment API returned ${response.status}`);
    correction = (await response.json()) as typeof correction;
  } catch (error) {
    const corrected = offlineCorrect(text);
    correction = {
      original: text,
      corrected,
      changed: corrected !== text,
      online: false,
      matches: [],
      error:
        error instanceof Error
          ? settings.onlineFeedback
            ? `Online evaluation failed: ${error.message}`
            : "Offline feedback active. Enable optional online feedback for a stronger grammar check."
          : "Offline feedback active.",
    };
  }

  const signals =
    options.patterns && options.patterns.length > 0
      ? options.patterns.map(
          (pattern) =>
            new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        )
      : targetSignals(options.grammar);
  const targetUses = signals.filter((signal) => signal.test(text)).length;
  const required = options.requiredTargetUses ?? 1;
  const words = wordCount(text);
  const sentences =
    text.match(/[.!?]+(?=\s|$)/g)?.length ?? (text.trim().length > 0 ? 1 : 0);
  const complete =
    words >= (options.minWords ?? 3) &&
    sentences >= (options.minSentences ?? 1);
  const targetSatisfied = targetUses >= required;
  const relevant = responseIsRelevant(
    text,
    options.taskPrompt,
    targetSatisfied,
  );
  const spelling = correction.matches.filter(
    (match) => issueType(match) === "Spelling",
  );
  const grammarIssues = correction.matches.filter(
    (match) => issueType(match) === "Grammar",
  );
  const knownLanguageIssues = correction.online
    ? (!settings.spellingAffectsMastery || spelling.length === 0) &&
      grammarIssues.length === 0
    : !correction.changed;
  const pass = knownLanguageIssues && targetSatisfied && complete && relevant;
  const masteryEligible = correction.online;
  const issuePenalty = Math.min(
    80,
    spelling.length * (settings.spellingAffectsMastery ? 8 : 2) +
      grammarIssues.length * 15,
  );
  const accuracyScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        issuePenalty -
        (targetUses < required ? 25 : 0) -
        (!complete ? 20 : 0) -
        (!relevant ? 25 : 0) -
        (!correction.online && correction.changed ? 20 : 0),
    ),
  );

  return {
    ...correction,
    pass,
    masteryEligible,
    spelling,
    grammarIssues,
    targetUses,
    required,
    complete,
    relevant,
    words,
    sentences,
    grammar: options.grammar,
    links: options.grammar.links ?? [],
    accuracyScore,
  };
}
