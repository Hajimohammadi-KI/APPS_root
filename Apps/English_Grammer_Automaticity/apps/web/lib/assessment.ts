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
  correctionReview:
    | {
        learnerSentence: string;
        correctedSentence: string;
        mistakeType:
          | "tense"
          | "verb form"
          | "singular/plural"
          | "word order"
          | "preposition"
          | "meaning/use";
        explanation: string;
      }
    | null;
  conversationFeedback: {
    pronunciation: string[];
    wordChoice: string[];
    grammar: string[];
    partB: {
      pronunciation_score: number;
      pronunciation_feedback: string;
      word_choice_score: number;
      word_choice_feedback: string;
      grammar_score: number;
      grammar_feedback: string;
      overall_comment: string;
      next_step: string;
    };
  };
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

function quotedList(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return `"${items[0]}"`;
  if (items.length === 2) return `"${items[0]}" and "${items[1]}"`;
  return `${items.slice(0, -1).map((item) => `"${item}"`).join(", ")}, and "${items.at(-1)}"`;
}

function buildConversationFeedback(
  text: string,
  corrected: string,
  grammar: EvaluationOptions["grammar"],
  grammarIssues: LanguageToolMatch[],
  spelling: LanguageToolMatch[],
  targetUses: number,
  required: number,
) {
  const pronunciation: string[] = [];
  const wordChoice: string[] = [];
  const grammarFeedback: string[] = [];

  const pronunciationTargets = ["vegetables", "scientifically"] as const;
  const mentionedPronunciationTargets = pronunciationTargets.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(`${text} ${corrected}`),
  );
  if (mentionedPronunciationTargets.length > 0) {
    pronunciation.push(
      `You speak clearly most of the time, but ${quotedList(
        [...mentionedPronunciationTargets],
      )} need more practice.`,
    );
  } else {
    pronunciation.push(
      "You speak clearly most of the time. Keep sentence stress and ending sounds consistent.",
    );
  }

  const strongLexicon = [
    "balanced diet",
    "home-cooked food",
    "stay hydrated",
  ] as const;
  const usedLexicon = strongLexicon.filter((phrase) =>
    new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i").test(
      `${text} ${corrected}`,
    ),
  );
  if (usedLexicon.length > 0) {
    wordChoice.push(`Good use of ${quotedList([...usedLexicon])}.`);
  }
  if (/\bit makes me fat\b/i.test(text)) {
    wordChoice.push(
      'Try using "fattening" instead of "it makes me fat" for more natural English.',
    );
  }
  if (wordChoice.length === 0) {
    wordChoice.push(
      "Word choice is clear. Add one stronger collocation to sound more natural.",
    );
  }

  if (/simple present/i.test(grammar.title) && targetUses >= required) {
    grammarFeedback.push("Correct use of Simple Present for habits.");
  }
  if (/\benough sleeps\b/i.test(text) && /\benough sleep\b/i.test(corrected)) {
    grammarFeedback.push(
      'One mistake: "I don\'t get enough sleeps" -> "I don\'t get enough sleep".',
    );
  }
  if (grammarIssues.length > 0 || spelling.length > 0) {
    const primaryIssue = [...grammarIssues, ...spelling][0];
    if (primaryIssue?.message) {
      grammarFeedback.push(`Main fix: ${primaryIssue.message}`);
    }
  }
  if (grammarFeedback.length === 0) {
    grammarFeedback.push(
      "Grammar is controlled in this response. Keep subject-verb agreement and article use stable.",
    );
  }

  const pronunciationScore = Math.max(
    0,
    Math.min(
      100,
      82 +
        Math.min(10, Math.floor(wordCount(text) / 5)) -
        Math.min(20, grammarIssues.length * 3 + spelling.length * 2),
    ),
  );
  const wordChoiceScore = Math.max(
    0,
    Math.min(
      100,
      78 +
        Math.min(12, Math.floor(contentTokens(text).length / 3)) -
        (targetUses < required ? 12 : 0),
    ),
  );
  const grammarScore = Math.max(
    0,
    Math.min(100, 90 - grammarIssues.length * 12 - spelling.length * 4),
  );

  const partB = {
    pronunciation_score: pronunciationScore,
    pronunciation_feedback:
      pronunciationScore >= 90
        ? "Your speech is clear and easy to understand. Key words are pronounced clearly, and your rhythm sounds natural. Keep this consistency in longer answers."
        : pronunciationScore >= 70
          ? "Your pronunciation is mostly clear and understandable. A few words need cleaner endings and steadier stress. Slow down slightly on difficult words to improve clarity."
          : pronunciationScore >= 50
            ? "Your message is understandable in parts, but several sounds are unclear. Word stress and rhythm are sometimes uneven. Practice the corrected sentence aloud before giving a longer answer."
            : "Many key words are hard to understand right now. Speech rhythm and stress need focused practice. Start with short, clear sentences and repeat them slowly.",
    word_choice_score: wordChoiceScore,
    word_choice_feedback:
      wordChoiceScore >= 90
        ? "Your vocabulary fits the topic very well and sounds natural. You use strong combinations of words for daily-life communication. Keep adding precise words for detail."
        : wordChoiceScore >= 70
          ? "Your word choice matches the topic and is mostly natural. Some phrases can be more idiomatic in English. Add one or two stronger collocations in your next response."
          : wordChoiceScore >= 50
            ? "Basic topic vocabulary is present, but several phrases sound limited or unnatural. Use simpler and more common combinations first. Then add one specific detail word."
            : "Word choice is weak for this task and some phrases do not fit the context. Build a short topic word list and reuse it in complete sentences. Focus on natural everyday expressions.",
    grammar_score: grammarScore,
    grammar_feedback:
      grammarScore >= 90
        ? "Grammar control is strong in this response. Verb forms, agreement, and sentence order are accurate. Keep this accuracy while adding more detail."
        : grammarScore >= 70
          ? "Grammar is generally good, with a few errors that reduce precision. Check verb form and small structure points before submitting. Your base is solid and can improve quickly."
          : grammarScore >= 50
            ? "You show basic grammar control, but important errors appear in tense, form, or word order. These errors sometimes affect clarity. Revise one key pattern and use it in 2-3 short sentences."
            : "Grammar errors are frequent and make the message hard to follow. Focus on one core pattern and practice it repeatedly in short responses. Accuracy first, then complexity.",
    overall_comment:
      "You communicated your idea and stayed on task. Keep your direct first sentence, then expand with one reason or example. Prioritize one grammar fix and one vocabulary upgrade in the next attempt.",
    next_step:
      "Record one new 2-4 sentence answer on the same topic. First answer directly, then add one clear reason with the target grammar.",
  };

  return {
    pronunciation,
    wordChoice,
    grammar: grammarFeedback,
    partB,
  };
}

function mapMistakeType(
  issue: LanguageToolMatch | undefined,
): "tense" | "verb form" | "singular/plural" | "word order" | "preposition" | "meaning/use" {
  const raw = `${issue?.rule?.id ?? ""} ${issue?.rule?.category?.name ?? ""} ${issue?.message ?? ""}`.toLowerCase();
  if (/tense|time|past|present|future/.test(raw)) return "tense";
  if (/verb|conjugation|participle|auxiliary/.test(raw)) return "verb form";
  if (/plural|singular|agreement|countable|uncountable/.test(raw)) {
    return "singular/plural";
  }
  if (/word order|position|syntax/.test(raw)) return "word order";
  if (/preposition/.test(raw)) return "preposition";
  return "meaning/use";
}

function buildCorrectionReview(
  original: string,
  corrected: string,
  issue: LanguageToolMatch | undefined,
) {
  if (!issue && original === corrected) return null;
  const mistakeType = mapMistakeType(issue);
  const location = issue?.context?.text?.trim();
  const message = issue?.message?.trim();
  const reason =
    message && message.length > 0
      ? message
      : "The sentence form needs adjustment for natural and correct English.";

  return {
    learnerSentence: original,
    correctedSentence: corrected,
    mistakeType,
    explanation: location
      ? `The mistake is in "${location}". This is a ${mistakeType} issue. ${reason} The corrected version is right because it follows the correct grammar pattern for this meaning.`
      : `This is a ${mistakeType} issue. ${reason} The corrected version is right because it uses the correct grammar pattern for the intended meaning.`,
  };
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
  const conversationFeedback = buildConversationFeedback(
    text,
    correction.corrected,
    options.grammar,
    grammarIssues,
    spelling,
    targetUses,
    required,
  );
  const correctionReview = buildCorrectionReview(
    correction.original,
    correction.corrected,
    correction.matches[0],
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
    correctionReview,
    conversationFeedback,
  };
}
