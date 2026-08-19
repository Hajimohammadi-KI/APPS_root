export const HYBRID_ANALYSIS_SKILLS = [
  "listening",
  "speaking",
  "reading",
  "writing",
] as const;

export type HybridAnalysisSkill = (typeof HYBRID_ANALYSIS_SKILLS)[number];
export type HybridAnalysisLanguage = "en" | "de";
export type NlpSignalStatus = "observation" | "attention" | "not-available";

export interface HybridLanguageAnalysisInput {
  readonly skill: HybridAnalysisSkill;
  readonly language: HybridAnalysisLanguage;
  readonly responseText: string;
  readonly sourceText?: string;
  readonly durationSeconds?: number;
}

export interface NlpSignal {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly status: NlpSignalStatus;
  readonly detail: string;
}

export interface HybridLanguageAnalysis {
  readonly method: "rule-based-nlp";
  readonly evidenceClass: "diagnostic-only";
  readonly skill: HybridAnalysisSkill;
  readonly language: HybridAnalysisLanguage;
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly signals: readonly NlpSignal[];
  readonly limitations: readonly string[];
}

export interface LanguageAnalysisLlmRequest {
  readonly topic: string;
  readonly content: string;
  readonly learnerInput: string;
  readonly language: string;
  readonly purpose: "language-analysis";
}

const STOPWORDS: Readonly<Record<HybridAnalysisLanguage, ReadonlySet<string>>> =
  {
    en: new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "because",
      "but",
      "by",
      "for",
      "from",
      "has",
      "have",
      "he",
      "i",
      "in",
      "is",
      "it",
      "of",
      "on",
      "or",
      "she",
      "that",
      "the",
      "they",
      "this",
      "to",
      "was",
      "we",
      "were",
      "with",
      "you",
    ]),
    de: new Set([
      "aber",
      "als",
      "am",
      "an",
      "auch",
      "auf",
      "aus",
      "bei",
      "das",
      "dem",
      "den",
      "der",
      "die",
      "ein",
      "eine",
      "er",
      "es",
      "für",
      "hat",
      "ich",
      "im",
      "in",
      "ist",
      "mit",
      "oder",
      "sie",
      "und",
      "von",
      "war",
      "wir",
      "zu",
    ]),
  };

const CONNECTORS: Readonly<Record<HybridAnalysisLanguage, readonly string[]>> =
  {
    en: [
      "because",
      "although",
      "however",
      "therefore",
      "first",
      "then",
      "finally",
      "while",
      "whereas",
    ],
    de: [
      "weil",
      "obwohl",
      "jedoch",
      "deshalb",
      "zuerst",
      "dann",
      "schließlich",
      "während",
      "wohingegen",
    ],
  };

const FILLERS: Readonly<Record<HybridAnalysisLanguage, readonly string[]>> = {
  en: ["um", "uh", "erm", "like", "actually", "basically"],
  de: ["äh", "ähm", "also", "halt", "eigentlich", "sozusagen"],
};

const COPY = {
  en: {
    words: "Words",
    sentences: "Sentences",
    lexical: "Lexical variety",
    lexicalDetail:
      "Unique-word ratio is descriptive and depends strongly on sample length.",
    connectors: "Connectors",
    connectorsDetail:
      "Visible linking words can support cohesion; zero is not automatically an error.",
    coverage: "Source-content coverage",
    coverageDetail:
      "Shared content words estimate recall or evidence selection, not comprehension by themselves.",
    coverageMissing:
      "Add the source text to calculate transparent content-word overlap.",
    fillers: "Potential fillers",
    fillersDetail:
      "Transcript matches are only candidates; natural discourse markers need human review.",
    pace: "Transcript pace",
    paceDetail:
      "WPM describes pace only. It does not measure pronunciation, accuracy, or fluency by itself.",
    paceMissing:
      "Add a real recording duration of at least 10 seconds to calculate WPM.",
    lengthAttention: "The sample is short; most NLP ratios will be unstable.",
    noPronunciation:
      "Text analysis cannot score pronunciation, stress, rhythm, or audio quality.",
    noMastery:
      "NLP and LLM feedback are diagnostic only and cannot award CEFR, mastery, or automaticity.",
    provider:
      "An LLM may suggest a repair and transfer task only when a real provider responds; its output remains unverified until the learner reviews it.",
  },
  de: {
    words: "Wörter",
    sentences: "Sätze",
    lexical: "Lexikalische Vielfalt",
    lexicalDetail:
      "Der Anteil verschiedener Wörter ist nur beschreibend und hängt stark von der Textlänge ab.",
    connectors: "Konnektoren",
    connectorsDetail:
      "Sichtbare Verknüpfungswörter können Kohäsion stützen; null ist nicht automatisch ein Fehler.",
    coverage: "Abdeckung des Ausgangstextes",
    coverageDetail:
      "Gemeinsame Inhaltswörter schätzen Abruf oder Belegauswahl, beweisen aber allein kein Verstehen.",
    coverageMissing:
      "Füge den Ausgangstext hinzu, um die transparente Inhaltswort-Überlappung zu berechnen.",
    fillers: "Mögliche Füllwörter",
    fillersDetail:
      "Treffer im Transkript sind nur Kandidaten; natürliche Diskursmarker brauchen menschliche Prüfung.",
    pace: "Transkript-Tempo",
    paceDetail:
      "WPM beschreibt nur das Tempo. Aussprache, Korrektheit oder Flüssigkeit werden damit nicht allein gemessen.",
    paceMissing:
      "Füge die Dauer einer echten Aufnahme von mindestens 10 Sekunden hinzu, um WPM zu berechnen.",
    lengthAttention:
      "Die Probe ist kurz; die meisten NLP-Verhältnisse sind noch instabil.",
    noPronunciation:
      "Textanalyse kann Aussprache, Akzent, Rhythmus oder Audioqualität nicht bewerten.",
    noMastery:
      "NLP- und LLM-Rückmeldungen sind nur diagnostisch und vergeben weder CEFR noch Beherrschung oder Automatik.",
    provider:
      "Ein LLM darf nur nach echter Provider-Antwort Reparatur und Transfer vorschlagen; die Ausgabe bleibt bis zur Prüfung durch die lernende Person unbestätigt.",
  },
} as const;

function boundedText(value: string | undefined, name: string): string {
  const normalized = (value ?? "").replace(/\s+/gu, " ").trim();
  if (normalized.length > 8_000) {
    throw new Error(`${name} must not exceed 8000 characters.`);
  }
  return normalized;
}

function tokens(
  value: string,
  language: HybridAnalysisLanguage,
): readonly string[] {
  return (
    value
      .toLocaleLowerCase(language)
      .match(/[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu) ?? []
  ).map((token) => token.replace(/[’]/gu, "'"));
}

function sentences(value: string): readonly string[] {
  return value
    .split(/(?<=[.!?])\s+|[\r\n]+/gu)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

export function analyzeLanguageSample(
  input: HybridLanguageAnalysisInput,
): HybridLanguageAnalysis {
  if (!HYBRID_ANALYSIS_SKILLS.includes(input.skill)) {
    throw new Error("Unknown language skill.");
  }
  const responseText = boundedText(input.responseText, "responseText");
  if (!responseText) throw new Error("responseText is required.");
  const sourceText = boundedText(input.sourceText, "sourceText");
  const copy = COPY[input.language];
  const responseTokens = tokens(responseText, input.language);
  const responseSentences = sentences(responseText);
  const uniqueTokens = new Set(responseTokens);
  const connectorCount = responseTokens.filter((token) =>
    CONNECTORS[input.language].includes(token),
  ).length;
  const signals: NlpSignal[] = [
    {
      id: "word-count",
      label: copy.words,
      value: String(responseTokens.length),
      status: responseTokens.length < 8 ? "attention" : "observation",
      detail: responseTokens.length < 8 ? copy.lengthAttention : copy.words,
    },
    {
      id: "sentence-count",
      label: copy.sentences,
      value: String(responseSentences.length),
      status: "observation",
      detail: copy.sentences,
    },
    {
      id: "lexical-variety",
      label: copy.lexical,
      value: `${percentage(uniqueTokens.size, responseTokens.length)}%`,
      status: responseTokens.length < 8 ? "attention" : "observation",
      detail: copy.lexicalDetail,
    },
    {
      id: "connectors",
      label: copy.connectors,
      value: String(connectorCount),
      status: "observation",
      detail: copy.connectorsDetail,
    },
  ];

  if (input.skill === "listening" || input.skill === "reading") {
    if (sourceText) {
      const sourceContent = new Set(
        tokens(sourceText, input.language).filter(
          (token) => !STOPWORDS[input.language].has(token),
        ),
      );
      const responseContent = new Set(
        responseTokens.filter((token) => !STOPWORDS[input.language].has(token)),
      );
      const overlap = [...sourceContent].filter((token) =>
        responseContent.has(token),
      ).length;
      const coverage = percentage(overlap, sourceContent.size);
      signals.push({
        id: "source-coverage",
        label: copy.coverage,
        value: `${coverage}%`,
        status: coverage < 25 ? "attention" : "observation",
        detail: copy.coverageDetail,
      });
    } else {
      signals.push({
        id: "source-coverage",
        label: copy.coverage,
        value: "N/A",
        status: "not-available",
        detail: copy.coverageMissing,
      });
    }
  }

  if (input.skill === "speaking") {
    const fillerCount = responseTokens.filter((token) =>
      FILLERS[input.language].includes(token),
    ).length;
    signals.push({
      id: "fillers",
      label: copy.fillers,
      value: String(fillerCount),
      status: "observation",
      detail: copy.fillersDetail,
    });
    const duration = input.durationSeconds;
    const validDuration =
      typeof duration === "number" &&
      Number.isFinite(duration) &&
      duration >= 10 &&
      duration <= 3_600;
    signals.push({
      id: "pace",
      label: copy.pace,
      value: validDuration
        ? `${Math.round((responseTokens.length / duration) * 60)} WPM`
        : "N/A",
      status: validDuration ? "observation" : "not-available",
      detail: validDuration ? copy.paceDetail : copy.paceMissing,
    });
  }

  return {
    method: "rule-based-nlp",
    evidenceClass: "diagnostic-only",
    skill: input.skill,
    language: input.language,
    wordCount: responseTokens.length,
    sentenceCount: responseSentences.length,
    signals,
    limitations: [
      ...(input.skill === "speaking" ? [copy.noPronunciation] : []),
      copy.noMastery,
      copy.provider,
    ],
  };
}

export function buildLanguageAnalysisLlmRequest(
  input: HybridLanguageAnalysisInput,
  analysis: HybridLanguageAnalysis,
): LanguageAnalysisLlmRequest {
  const responseText = boundedText(input.responseText, "responseText");
  const sourceText = boundedText(input.sourceText, "sourceText");
  const languageName = input.language === "de" ? "German" : "English";
  const observations = analysis.signals
    .map(
      (signal) =>
        `${signal.label}: ${signal.value} (${signal.status}); ${signal.detail}`,
    )
    .join("\n");
  return {
    topic: `${languageName} ${input.skill} diagnostic feedback`,
    content: [
      `Skill: ${input.skill}`,
      `Evidence class: ${analysis.evidenceClass}`,
      sourceText ? `Source text: ${sourceText}` : "Source text: not supplied",
      "Rule-based NLP observations:",
      observations,
      "Constraints: use only supplied text and observations; distinguish observation from inference; do not award CEFR, mastery, or automaticity; do not claim pronunciation evidence from a transcript; preserve meaning; propose one explicit repair and one new-context transfer task.",
    ].join("\n"),
    learnerInput: responseText,
    language: languageName,
    purpose: "language-analysis",
  };
}
