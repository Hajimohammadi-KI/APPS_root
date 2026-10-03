import type { ErrorClass } from "./learner-state";

export type EvaluationKind =
  "conversation" | "free" | "recall" | "review" | "sentences" | "why";

export type EvaluationNextAction =
  "repeat" | "repair" | "transfer" | "schedule_review";

export interface GrammarTarget {
  readonly title: string;
  readonly rule: string;
  readonly examples: readonly string[];
}

export interface EvaluationIssue {
  readonly type: string;
  readonly message: string;
  readonly context?: string;
  readonly suggestion?: string;
  readonly errorClass: ErrorClass;
  readonly severity: "minor" | "major" | "critical";
  readonly category?: FeedbackCategory;
  readonly userText?: string;
  readonly correctedText?: string;
  readonly explanation?: string;
  readonly hint?: string;
}

export type FeedbackStatus =
  | "correct"
  | "nearly_correct"
  | "wrong_language"
  | "language_uncertain"
  | "incomplete"
  | "needs_revision";

export type FeedbackCategory =
  | "wrong_output_language"
  | "missing_word"
  | "wrong_article"
  | "wrong_case"
  | "wrong_noun_ending"
  | "wrong_plural_form"
  | "wrong_verb_conjugation"
  | "wrong_tense"
  | "wrong_word_order"
  | "wrong_preposition"
  | "wrong_adjective_ending"
  | "incomplete_sentence"
  | "spelling_or_typo"
  | "vocabulary_or_meaning"
  | "register_or_style";

export interface LanguageToolMatch {
  readonly offset: number;
  readonly length: number;
  readonly message?: string;
  readonly context?: {
    readonly text?: string;
  };
  readonly replacements?: readonly {
    readonly value?: string;
  }[];
  readonly rule?: {
    readonly issueType?: string;
  };
}

export interface LanguageToolResult {
  readonly matches: readonly LanguageToolMatch[];
  readonly online: boolean;
  readonly networkError?: string;
}

export interface EvaluationReport {
  readonly original: string;
  readonly corrected: string;
  readonly changed: boolean;
  readonly matches: readonly LanguageToolMatch[];
  readonly online: boolean;
  readonly networkError?: string;
  readonly issues: readonly EvaluationIssue[];
  /** Practice may continue, including after deterministic offline checks. */
  readonly practiceReady: boolean;
  /** Only verified reports may change mastery and CEFR evidence. */
  readonly verified: boolean;
  readonly ok: boolean;
  readonly targetHit: boolean;
  readonly relevant: boolean;
  readonly accuracyScore: number | null;
  readonly nextAction: EvaluationNextAction;
  readonly status?: FeedbackStatus;
  readonly answerLanguage?: "de" | "fa" | "en" | "other";
  readonly correctParts?: readonly string[];
  readonly nextActionText?: string;
}

export function detectAnswerLanguage(
  text: string,
): "de" | "fa" | "en" | "other" {
  const value = text.normalize("NFC").trim();
  if (!value) return "other";
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) return "other";
  if (/[\u0600-\u06ff]/u.test(value)) {
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
  if (englishHits && (germanHits || sharedHits >= 2)) return "other";
  if (englishHits) return "en";
  if (germanHits || sharedHits >= 2) return "de";
  return "other";
}

export interface ClosedAnswerAnalysis {
  readonly status: FeedbackStatus;
  readonly answerLanguage: "de" | "fa" | "en" | "other";
  readonly correct: boolean | null;
  readonly correctParts: readonly string[];
  readonly issues: readonly Pick<
    EvaluationIssue,
    | "type"
    | "message"
    | "severity"
    | "category"
    | "userText"
    | "correctedText"
    | "explanation"
    | "hint"
  >[];
  readonly corrected: string;
}

const closedAnswerNormalization = (value: string): string =>
  value
    .normalize("NFC")
    .trim()
    .replace(/(?<!\.)\.$/u, "")
    .replace(/\s+/gu, " ");

export function analyzeClosedAnswer(
  text: string,
  expected: string,
  acceptedAnswers: readonly string[] = [],
): ClosedAnswerAnalysis {
  const candidates = [expected, ...acceptedAnswers].filter((candidate) =>
    candidate.trim(),
  );
  const canonicalMatch = candidates.some(
    (candidate) =>
      closedAnswerNormalization(candidate) === closedAnswerNormalization(text),
  );
  // A known answer/alternative also disambiguates isolated German forms.
  const knownOrthography = candidates.some(
    (candidate) =>
      closedAnswerNormalization(candidate).toLocaleLowerCase("de-DE") ===
      closedAnswerNormalization(text).toLocaleLowerCase("de-DE"),
  );
  const answerLanguage =
    canonicalMatch || knownOrthography ? "de" : detectAnswerLanguage(text);
  if (answerLanguage === "other") {
    return {
      status: "language_uncertain",
      answerLanguage,
      correct: null,
      correctParts: [],
      corrected: text,
      issues: [
        {
          type: "Sprache unklar",
          severity: "minor",
          message:
            "Die Sprache lässt sich hier nicht sicher erkennen. Die Antwort wurde noch nicht bewertet.",
          userText: text,
          explanation:
            "Kurze oder gemischte Antworten sind für diese lokale Prüfung nicht eindeutig.",
        },
      ],
    };
  }
  if (answerLanguage !== "de") {
    return {
      status: "wrong_language",
      answerLanguage,
      correct: false,
      correctParts: [],
      corrected: expected,
      issues: [
        {
          type: "Ausgabesprache",
          category: "wrong_output_language",
          message: "Die Antwort muss auf Deutsch geschrieben werden.",
          userText: text,
          correctedText: "Deutsch schreiben",
          explanation: "Das Eingabefeld erwartet eine deutsche Antwort.",
          hint: expected.split(/\s+/u).slice(0, 4).join(" ") + " ...",
          severity: "critical",
        },
      ],
    };
  }

  if (canonicalMatch) {
    return {
      status: "correct",
      answerLanguage,
      correct: true,
      correctParts: text.split(/\s+/u).filter(Boolean),
      corrected: text.trim(),
      issues: [],
    };
  }

  const expectedWords = expected.replace(/[.!?]+$/gu, "").split(/\s+/u);
  const answerWords = text.replace(/[.!?]+$/gu, "").split(/\s+/u);
  const sharedWords = expectedWords.filter((word) =>
    answerWords.some(
      (candidate) =>
        closedAnswerNormalization(candidate) ===
        closedAnswerNormalization(word),
    ),
  );
  const issues: Array<ClosedAnswerAnalysis["issues"][number]> = [];
  const hasEsGibtCaseError =
    /\bin meine straße\b/iu.test(text) &&
    /\b(gibt es|es gibt)\b/iu.test(text) &&
    /\b(supermarkt|spermarkt)\b/iu.test(text);
  if (hasEsGibtCaseError) {
    issues.push({
      type: "Kasus",
      category: "wrong_case",
      message: "„meine“ muss hier „meiner“ heißen.",
      userText: "In meine Straße",
      correctedText: "In meiner Straße",
      explanation: "Bei einem festen Ort steht „in“ mit dem Dativ.",
      hint: "die Straße → in meiner Straße",
      severity: "critical",
    });
  }
  if (/\bich sehe der mann\b/iu.test(text)) {
    issues.push({
      type: "Kasus",
      category: "wrong_case",
      message: "„der Mann“ muss hier „den Mann“ heißen.",
      userText: "der Mann",
      correctedText: "den Mann",
      explanation:
        "„Mann“ ist das direkte Objekt von „sehen“ und steht im Akkusativ.",
      hint: "der → den im Akkusativ",
      severity: "critical",
    });
  }
  if (/\bich gebe der mann dem buch\b/iu.test(text)) {
    issues.push({
      type: "Valenz und Kasus",
      category: "wrong_case",
      message:
        "Bei „geben“ ist die Person der Empfänger im Dativ und die Sache das direkte Objekt im Akkusativ.",
      userText: "der Mann dem Buch",
      correctedText: "dem Mann das Buch",
      explanation:
        "Das Verb „geben“ folgt dem Muster „jemandem etwas geben“: dem Mann = Dativ, das Buch = Akkusativ.",
      hint: "der Mann → dem Mann; dem Buch → das Buch",
      severity: "critical",
    });
  }
  if (/\bes gibt (ein|eine) supermarkt\b/iu.test(text)) {
    issues.push({
      type: "Artikel und Kasus",
      category: "wrong_article",
      message:
        "Nach „es gibt“ steht „Supermarkt“ im Akkusativ: „einen Supermarkt“.",
      userText: text.match(/es gibt (ein|eine) supermarkt/iu)?.[0] ?? text,
      correctedText: "einen Supermarkt",
      explanation: "Supermarkt ist maskulin; es gibt verlangt den Akkusativ.",
      hint: "der Supermarkt → einen Supermarkt",
      severity: "critical",
    });
  }
  if (issues.length === 0) {
    issues.push({
      type: "Antwort",
      category: "vocabulary_or_meaning",
      message:
        "Die Antwort stimmt noch nicht vollständig mit der Aufgabe überein.",
      userText: text,
      correctedText: expected,
      explanation: "Vergleiche die Bedeutung und die verlangte Zielstruktur.",
      severity: "major",
    });
  }
  return {
    status: "nearly_correct",
    answerLanguage,
    correct: false,
    correctParts: sharedWords,
    corrected: expected,
    issues: issues.slice(0, 3),
  };
}

const TARGET_PATTERNS: ReadonlyArray<readonly [RegExp, RegExp]> = [
  [
    /perfekt/,
    /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b[\s\S]*\b(ge\w+|[\wäöüß]+iert)\b/i,
  ],
  [/präteritum/, /\b(war|warst|waren|wart|hatte|ging|kam|sagte|machte)\b/i],
  [/futur/, /\b(werde|wirst|wird|werden|werdet)\b[\s\S]*\b\w+en\b/i],
  [
    /passiv/,
    /\b(werde|wirst|wird|werden|werdet|wurde|wurden|worden)\b[\s\S]*\b(ge\w+|[\wäöüß]+iert)\b/i,
  ],
  [
    /konjunktiv|höflich|irreale|indirekte rede/,
    /\b(würde|wäre|hätte|könnte|müsste|sollte|dürfte|möge|sei|seien)\b/i,
  ],
  [
    /nebensatz|weil|dass|obwohl|konnektor/,
    /\b(weil|dass|obwohl|wenn|während|damit|bevor|nachdem|falls|indem)\b/i,
  ],
  [
    /relativ/,
    /\b(der|die|das|den|dem|deren|dessen|welche|welcher|welches)\b[\s\S]*,/i,
  ],
  [
    /trennbare/,
    /\b(stehe|steht|stehen|fange|fängt|fangen|komme|kommt|kommen|mache|macht|machen)\b[\s\S]*\b(auf|an|mit|ein|aus)\b/i,
  ],
  [
    /modalverb/,
    /\b(kann|kannst|können|muss|musst|müssen|soll|sollen|darf|dürfen|will|wollen|möchte|möchten)\b/i,
  ],
  [/akkusativ/, /\b(den|einen|keinen|meinen|deinen|diesen)\b/i],
  [/dativ/, /\b(dem|einem|keinem|meinem|deinem|diesem|der)\b/i],
  [/genitiv/, /\b(des|eines|meines|deines|dessen|deren)\b/i],
  [/komparativ|vergleich/, /\b(als|wie|besser|mehr|weniger|größer|kleiner)\b/i],
  [/superlativ/, /\b(am \w+sten|der beste|die beste|das beste)\b/i],
  [/negation/, /\b(nicht|kein|keine|keinen|keinem)\b/i],
  [
    /frage/,
    /\?|^(wer|was|wann|wo|wie|warum|welch|ist|sind|hast|hat|kann|können)\b/i,
  ],
  [
    /imperativ/,
    /^(bitte\s+)?(geh|gehen sie|komm|kommen sie|mach|machen sie|sei|seien sie|nimm|nehmen sie)\b/i,
  ],
];

const OFFLINE_CORRECTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bich habe gegangen\b/gi, "Ich bin gegangen"],
  [/\bmit der Mann\b/gi, "mit dem Mann"],
  [/\bich würde gegangen\b/gi, "ich würde gehen"],
  [/\bmehr besser\b/gi, "besser"],
];

export function classifyError(
  ...fragments: readonly (string | undefined)[]
): ErrorClass {
  const text = fragments.filter(Boolean).join(" ").toLocaleLowerCase("de");

  if (
    /\b(hilfsverb|auxiliary|haben oder sein|mit „sein“|mit sein)\b/.test(text)
  ) {
    return "auxiliary";
  }
  if (
    /\b(wortstellung|wortfolge|satzende|verbposition|verb position|nebensatz|verbzweit|v2)\b/.test(
      text,
    )
  ) {
    return "word_order";
  }
  if (
    /\b(kasus|akkusativ|dativ|genitiv|nominativ|case|deklination)\b/.test(text)
  ) {
    return "case";
  }
  if (/\b(artikel|article|genus)\b/.test(text)) {
    return "article";
  }
  if (/\b(endung|ending|adjektivdeklination)\b/.test(text)) {
    return "ending";
  }
  if (/\b(tempus|zeitform|tense|präteritum|perfekt|futur)\b/.test(text)) {
    return "tense";
  }
  if (/\b(kongruenz|agreement|übereinstimmung)\b/.test(text)) {
    return "agreement";
  }
  if (/\b(rechtschreibung|spelling|misspelling|tippfehler)\b/.test(text)) {
    return "spelling";
  }
  if (/\b(zielgrammatik|verlangte struktur)\b/.test(text)) {
    return "target_grammar";
  }
  return "other";
}

function issueSeverity(errorClass: ErrorClass): EvaluationIssue["severity"] {
  if (
    errorClass === "word_order" ||
    errorClass === "case" ||
    errorClass === "auxiliary" ||
    errorClass === "target_grammar"
  ) {
    return "critical";
  }
  if (errorClass === "spelling" || errorClass === "other") {
    return "minor";
  }
  return "major";
}

function feedbackCategoryFor(
  errorClass: ErrorClass,
  type: string,
  message: string,
): FeedbackCategory | undefined {
  if (/ausgabesprache|language|sprache/iu.test(type)) {
    return "wrong_output_language";
  }
  if (/fehlt|missing|nicht vorhanden/iu.test(message)) return "missing_word";
  if (/artikel|genus/iu.test(type + " " + message)) return "wrong_article";
  if (/präposition|preposition/iu.test(type + " " + message)) {
    return "wrong_preposition";
  }
  if (/wortstellung|wortfolge/iu.test(type + " " + message)) {
    return "wrong_word_order";
  }
  if (/plural|mehrzahl/iu.test(type + " " + message)) {
    return "wrong_plural_form";
  }
  if (/konjug|verbform/iu.test(type + " " + message)) {
    return "wrong_verb_conjugation";
  }
  if (errorClass === "case") return "wrong_case";
  if (errorClass === "ending") return "wrong_adjective_ending";
  if (errorClass === "tense") return "wrong_tense";
  if (errorClass === "spelling") return "spelling_or_typo";
  if (errorClass === "word_order") return "wrong_word_order";
  return undefined;
}

function createIssue(
  issue: Omit<EvaluationIssue, "errorClass" | "severity"> & {
    readonly errorClass?: ErrorClass;
    readonly severity?: EvaluationIssue["severity"];
  },
): EvaluationIssue {
  const errorClass =
    issue.errorClass ??
    classifyError(issue.type, issue.message, issue.context, issue.suggestion);
  const category =
    issue.category ??
    feedbackCategoryFor(errorClass, issue.type, issue.message);
  return {
    ...issue,
    errorClass,
    ...(category ? { category } : {}),
    severity: issue.severity ?? issueSeverity(errorClass),
  };
}

export function applyLanguageToolMatches(
  text: string,
  matches: readonly LanguageToolMatch[],
): string {
  let corrected = text;
  let offset = 0;

  for (const match of matches) {
    const replacement = match.replacements?.[0]?.value;
    if (!replacement) {
      continue;
    }
    const position = match.offset + offset;
    corrected =
      corrected.slice(0, position) +
      replacement +
      corrected.slice(position + match.length);
    offset += replacement.length - match.length;
  }

  return corrected;
}

export function offlineCorrect(text: string): string {
  return OFFLINE_CORRECTIONS.reduce(
    (corrected, [pattern, replacement]) =>
      corrected.replace(pattern, replacement),
    text,
  );
}

export function targetEvidencePresent(
  text: string,
  grammar: GrammarTarget,
): boolean {
  const title = grammar.title.toLocaleLowerCase("de");
  const specific = TARGET_PATTERNS.find(([name]) => name.test(title));
  if (specific) {
    return specific[1].test(text);
  }

  const stopWords = new Set([
    "diese",
    "dieser",
    "dieses",
    "einen",
    "einer",
    "werden",
    "verwendet",
    "korrekt",
    "satz",
    "sätze",
    "struktur",
    "grammatik",
    "deutsch",
  ]);
  const clues = [grammar.rule, ...grammar.examples]
    .join(" ")
    .toLocaleLowerCase("de")
    .match(/\b[a-zäöüß]{4,}\b/g)
    ?.filter((word) => !stopWords.has(word));
  const lowerText = text.toLocaleLowerCase("de");

  return clues?.some((word) => lowerText.includes(word)) ?? false;
}

export function getTaskIssues(
  text: string,
  grammar: GrammarTarget,
  kind: EvaluationKind,
  taskPrompt?: string,
): readonly EvaluationIssue[] {
  const issues: EvaluationIssue[] = [];
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (
    /perfekt/.test(grammar.title.toLocaleLowerCase("de")) &&
    /\b(gefahren|gegangen|gekommen|geflogen|gelaufen|gereist|aufgestanden|eingeschlafen|geworden|geblieben)\b/i.test(
      text,
    ) &&
    /\b(habe|hast|hat|haben|habt)\b/i.test(text)
  ) {
    issues.push(
      createIssue({
        type: "Zielgrammatik",
        message:
          "Bei einer Orts- oder Zustandsänderung wird das Perfekt dieser Verben mit „sein“ gebildet.",
        suggestion: text
          .replace(/\bich habe\b/i, "Ich bin")
          .replace(/\bdu hast\b/i, "Du bist")
          .replace(/\ber hat\b/i, "Er ist")
          .replace(/\bsie hat\b/i, "Sie ist")
          .replace(/\bwir haben\b/i, "Wir sind")
          .replace(/\bihr habt\b/i, "Ihr seid")
          .replace(/\bsie haben\b/i, "Sie sind"),
        errorClass: "auxiliary",
      }),
    );
  }

  if (
    kind === "sentences" &&
    new Set(sentences.map((sentence) => sentence.toLocaleLowerCase("de")))
      .size < sentences.length
  ) {
    issues.push(
      createIssue({
        type: "Aufgabe",
        message:
          "Die Sätze sind identisch. Schreibe drei unterschiedliche Sätze.",
      }),
    );
  }

  if (
    (kind === "free" || kind === "sentences" || kind === "conversation") &&
    !targetEvidencePresent(text, grammar)
  ) {
    issues.push(
      createIssue({
        type: "Zielgrammatik",
        message: `Die verlangte Struktur „${grammar.title}“ ist nicht eindeutig nachweisbar.`,
        errorClass: "target_grammar",
      }),
    );
  }

  if (kind === "recall") {
    const keywords =
      grammar.rule.toLocaleLowerCase("de").match(/\b[a-zäöüß]{5,}\b/g) ?? [];
    const lowerText = text.toLocaleLowerCase("de");
    if (!keywords.some((keyword) => lowerText.includes(keyword))) {
      issues.push(
        createIssue({
          type: "Inhalt",
          message:
            "Deine Erklärung nennt keinen zentralen Begriff aus der Regel.",
        }),
      );
    }
  }

  if (
    kind === "why" &&
    !/\b(weil|deshalb|denn|darum|verb|hilfsverb|partizip|kasus|endung|satzende|korrigiert|geändert)\b/i.test(
      text,
    )
  ) {
    issues.push(
      createIssue({
        type: "Inhalt",
        message:
          "Nenne die geänderte Form und den grammatischen Grund der Korrektur.",
      }),
    );
  }

  if (!responseIsRelevant(text, taskPrompt, kind, grammar)) {
    issues.push(
      createIssue({
        type: "Aufgabenbezug",
        message:
          "Die Antwort ist zu kurz, zu wiederholend oder nicht klar mit der Aufgabe verbunden.",
      }),
    );
  }

  return issues;
}

const RELEVANCE_STOP_WORDS = new Set([
  "aber",
  "antwort",
  "aufgabe",
  "aus",
  "bei",
  "das",
  "dass",
  "dem",
  "den",
  "der",
  "des",
  "die",
  "dies",
  "eine",
  "einem",
  "einen",
  "einer",
  "erkläre",
  "für",
  "grammatik",
  "ist",
  "mit",
  "oder",
  "satz",
  "schreibe",
  "struktur",
  "und",
  "verwende",
  "von",
  "warum",
  "was",
  "wie",
  "wird",
  "zum",
  "zur",
]);

function contentTokens(text: string): readonly string[] {
  return (
    text
      .toLocaleLowerCase("de")
      .match(/[a-zäöüß][a-zäöüß'-]{2,}/g)
      ?.filter((token) => !RELEVANCE_STOP_WORDS.has(token)) ?? []
  );
}

export function responseIsRelevant(
  text: string,
  taskPrompt: string | undefined,
  kind: EvaluationKind,
  grammar: GrammarTarget,
): boolean {
  const responseTokens = contentTokens(text);
  const uniqueResponse = new Set(responseTokens);
  if (uniqueResponse.size < 2) return false;
  if (
    responseTokens.length >= 6 &&
    uniqueResponse.size / responseTokens.length < 0.4
  ) {
    return false;
  }
  if (
    (kind === "free" || kind === "sentences" || kind === "conversation") &&
    !targetEvidencePresent(text, grammar)
  ) {
    return false;
  }
  // Kurze gelenkte Antworten müssen nicht dieselben Inhaltswörter wie die
  // Aufgabe wiederholen. Wenn die Zielform vorhanden ist und mindestens zwei
  // sinntragende Wörter vorkommen, darf die Übung fortgesetzt werden.
  if (responseTokens.length <= 5) return true;
  const promptTokens = new Set(contentTokens(taskPrompt ?? ""));
  if (promptTokens.size === 0) return true;
  return (
    [...uniqueResponse].some((token) => promptTokens.has(token)) ||
    uniqueResponse.size >= 7
  );
}

export function evaluateAnswer(
  text: string,
  grammar: GrammarTarget,
  kind: EvaluationKind,
  languageTool: LanguageToolResult,
  taskPrompt?: string,
): EvaluationReport {
  const answerLanguage = detectAnswerLanguage(text);
  if (answerLanguage === "other") {
    return {
      original: text,
      corrected: text,
      changed: false,
      matches: [],
      online: languageTool.online,
      ...(languageTool.networkError
        ? { networkError: languageTool.networkError }
        : {}),
      issues: [
        {
          type: "Sprache unklar",
          message:
            "Die Sprache lässt sich hier nicht sicher erkennen. Die Antwort wurde noch nicht bewertet.",
          context: text,
          errorClass: "other",
          severity: "minor",
          explanation:
            "Kurze oder gemischte Antworten sind für diese lokale Prüfung nicht eindeutig.",
        },
      ],
      practiceReady: false,
      verified: false,
      ok: false,
      targetHit: false,
      relevant: false,
      accuracyScore: null,
      nextAction: "repeat",
      status: "language_uncertain",
      answerLanguage,
      correctParts: [],
      nextActionText:
        "Bitte ergänze etwas Kontext oder lass die Antwort prüfen.",
    };
  }
  if (answerLanguage !== "de") {
    const languageIssue = createIssue({
      type: "Ausgabesprache",
      message: "Die Antwort muss auf Deutsch geschrieben werden.",
      context: text,
      suggestion: "Deutsch schreiben",
      errorClass: "other",
      category: "wrong_output_language",
      explanation: "Das Eingabefeld erwartet eine deutsche Antwort.",
      hint: grammar.examples[0]?.split(/\s+/u).slice(0, 4).join(" ") + " ...",
    });
    return {
      original: text,
      corrected: "",
      changed: false,
      matches: languageTool.matches,
      online: languageTool.online,
      ...(languageTool.networkError
        ? { networkError: languageTool.networkError }
        : {}),
      issues: [languageIssue],
      practiceReady: false,
      verified: false,
      ok: false,
      targetHit: false,
      relevant: false,
      accuracyScore: 0,
      nextAction: "repair",
      status: "wrong_language",
      answerLanguage,
      correctParts: [],
      nextActionText: "پاسخ را به آلمانی بنویسید.",
    };
  }
  const corrected = languageTool.online
    ? applyLanguageToolMatches(text, languageTool.matches)
    : offlineCorrect(text);
  const languageIssues: EvaluationIssue[] = languageTool.matches.map(
    (match) => {
      const suggestion = match.replacements?.[0]?.value;
      return createIssue({
        type:
          match.rule?.issueType === "misspelling"
            ? "Rechtschreibung"
            : "Grammatik/Stil",
        message: match.message ?? "Diese Stelle sollte korrigiert werden.",
        ...(match.context?.text ? { context: match.context.text } : {}),
        ...(suggestion ? { suggestion } : {}),
        ...(match.rule?.issueType === "misspelling"
          ? { errorClass: "spelling" as const }
          : {}),
      });
    },
  );
  const offlineIssue =
    !languageTool.online && corrected !== text
      ? [
          createIssue({
            type: "Offline-Grammatik",
            message:
              "Die lokale Prüfung hat eine bekannte Form korrigiert. Repariere sie vor dem Fortfahren.",
            suggestion: corrected,
          }),
        ]
      : [];
  const taskIssues = getTaskIssues(text, grammar, kind, taskPrompt);
  const issues = [...languageIssues, ...offlineIssue, ...taskIssues];
  const targetCorrection = taskIssues.find(
    (issue) => issue.type === "Zielgrammatik" && issue.suggestion,
  )?.suggestion;
  const finalCorrection = targetCorrection ?? corrected;
  const targetHit = !taskIssues.some(
    (issue) =>
      issue.errorClass === "target_grammar" || issue.type === "Zielgrammatik",
  );
  const relevant = !taskIssues.some((issue) => issue.type === "Aufgabenbezug");
  const accuracyScore = Math.max(
    0,
    100 -
      issues.reduce(
        (penalty, issue) =>
          penalty +
          (issue.severity === "critical"
            ? 30
            : issue.severity === "major"
              ? 18
              : 8),
        0,
      ),
  );
  const practiceReady = issues.length === 0;
  const verified = languageTool.online;
  const ok = verified && practiceReady;

  return {
    original: text,
    corrected: finalCorrection,
    changed: finalCorrection !== text,
    matches: languageTool.matches,
    online: languageTool.online,
    ...(languageTool.networkError
      ? { networkError: languageTool.networkError }
      : {}),
    issues,
    practiceReady,
    verified,
    ok,
    targetHit,
    relevant,
    accuracyScore,
    nextAction:
      issues.length > 0
        ? "repair"
        : kind === "review"
          ? "schedule_review"
          : "transfer",
    status: issues.length === 0 ? "correct" : "needs_revision",
    answerLanguage,
    nextActionText:
      issues.length === 0
        ? "حالا این ساختار را در یک جملهٔ جدید به کار ببر."
        : "خطاهای مشخص‌شده را اصلاح و پاسخ را دوباره ارسال کن.",
  };
}
