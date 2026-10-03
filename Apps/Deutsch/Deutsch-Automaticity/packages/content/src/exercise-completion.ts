export type GrammarContentType =
  "sentence" | "pattern" | "contrast" | "text" | "style";

export type GrammarExerciseMode = "closed_recall" | "open_production";

export type GrammarFeedbackDimension =
  | "meaning"
  | "form"
  | "word_order"
  | "use"
  | "coherence"
  | "linkage"
  | "text_function"
  | "register"
  | "effect"
  | "naturalness";

export type ExplanationLanguage = "Deutsch" | "English" | "فارسی";

export type LocalizedExerciseCopy = Readonly<
  Record<ExplanationLanguage, string>
>;

export interface GrammarExerciseMetadata {
  readonly mode: GrammarExerciseMode;
  readonly contentType: GrammarContentType;
  readonly validation: "exact" | "ai_or_self_check";
  readonly answerRole: "expected" | "inspiration";
  readonly prompt: LocalizedExerciseCopy;
  readonly hint: LocalizedExerciseCopy;
  readonly feedbackDimensions: readonly GrammarFeedbackDimension[];
  readonly minimumSentences: number;
  readonly outputLanguage: "de";
  readonly acceptedAnswers?: readonly string[];
  readonly requiresLearnerIntentFa?: boolean;
}

export type GrammarExercise = readonly [
  prompt: string,
  answerOrInspiration: string,
  metadata?: GrammarExerciseMetadata,
];

export interface ExerciseCompletionInput {
  readonly level: string;
  readonly title: string;
  readonly rule: string;
  readonly commonError: string;
  readonly examples: readonly string[];
  readonly exercises: readonly (readonly unknown[])[];
  readonly testAnswer: string;
  readonly repairTest: string;
  readonly transferTest: string;
}

const STYLE_TOPICS =
  /register|stil|hedging|pragmati|informationsdichte|regionale variation|syntaktischer rhythmus|rhetorische syntax|modalität und evidentialität|feine bedeutungsunterschiede|ambiguität|interferenzkontrolle|selbstreparatur/iu;
const TEXT_TOPICS =
  /textkohäsion|kohärenz|textsort|tempusfolge in berichten|thema-rhema|kausale zuschreibung|interpunktion als bedeutungssignal|syntax wissenschaftlicher zitate|textsortentransformation/iu;
const CONTRAST_TOPICS =
  /nicht und kein|wenn und als|obwohl|trotzdem|denn und sondern|sowohl|weder|je\.\.\.desto|vorgangspassiv und zustandspassiv|verbalisierung und nominalisierung|skopus und negation|präsupposition und implikatur/iu;
const PATTERN_TOPICS =
  /pluralformen|genitivgrundlagen|adjektivdeklination grundlagen|nominalisierung$|n-deklination|partizipien als adjektive|nomen-verb-verbindungen|komplexe nominalgruppen|parallelismus|idiomatizität und kollokation|partizipialattribute erweitern|integrierte automatische produktion/iu;

const FEEDBACK_DIMENSIONS: Readonly<
  Record<GrammarContentType, readonly GrammarFeedbackDimension[]>
> = {
  sentence: ["meaning", "form", "word_order"],
  pattern: ["meaning", "form"],
  contrast: ["meaning", "use"],
  text: ["coherence", "linkage", "text_function"],
  style: ["register", "effect", "naturalness"],
};

interface CorrectionPair {
  readonly incorrect: string;
  readonly correct: string;
}

interface ProductionBlueprint {
  readonly minimumSentences: number;
  readonly situationDe: string;
  readonly situationEn: string;
  readonly situationFa: string;
}

function clean(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function withoutTerminalPunctuation(token: string): string {
  return token.replace(/[.!?;:,]+$/u, "");
}

function normalizeSentenceEnd(value: string): string {
  const normalized = clean(value);
  if (!normalized || /[.!?]$/u.test(normalized)) return normalized;
  return `${normalized}.`;
}

function looksLikeInstruction(value: string): boolean {
  return /^(korrigiere|erkläre|verwende|übertrage|formuliere|schreibe|bilde)\b/iu.test(
    clean(value),
  );
}

function looksLikeSentence(value: string): boolean {
  return clean(value).split(/\s+/u).length >= 3;
}

function parseCorrection(commonError: string): CorrectionPair {
  const normalized = clean(commonError);
  const arrow = normalized.split(/\s*→\s*/u, 2);
  if (arrow.length === 2) {
    return {
      incorrect: clean(arrow[0] ?? ""),
      correct: clean(arrow[1] ?? ""),
    };
  }

  const contrast = normalized.match(
    /^Nicht:\s*(.+?)(?:\.\s*)?Sondern:\s*(.+)$/iu,
  );
  if (contrast) {
    return {
      incorrect: clean(contrast[1] ?? ""),
      correct: clean(contrast[2] ?? ""),
    };
  }

  return { incorrect: normalized, correct: "" };
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
  const words = clean(sentence).split(/\s+/u);
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
  const normalized = clean(sentence);
  const punctuation = normalized.match(/[.!?]+$/u)?.[0] ?? "";
  const words = normalized.replace(/[.!?]+$/u, "").split(/\s+/u);
  if (words.length < 2) return normalized;
  return `${words.slice(1).reverse().join(" / ")} / ${words[0]}${punctuation}`;
}

function feedbackDimensionsFor(
  contentType: GrammarContentType,
): readonly GrammarFeedbackDimension[] {
  return FEEDBACK_DIMENSIONS[contentType];
}

export function classifyGrammarContent(
  unit: Pick<ExerciseCompletionInput, "title" | "examples">,
): GrammarContentType {
  const title = unit.title.toLocaleLowerCase("de");
  if (STYLE_TOPICS.test(title)) return "style";
  if (TEXT_TOPICS.test(title)) return "text";
  if (CONTRAST_TOPICS.test(title)) return "contrast";
  if (PATTERN_TOPICS.test(title)) return "pattern";
  return "sentence";
}

function correctionAnswer(
  unit: ExerciseCompletionInput,
  pair: CorrectionPair,
  contentType: GrammarContentType,
): string {
  if (unit.title === "es gibt mit Akkusativ") {
    return "In meiner Straße gibt es einen Supermarkt.";
  }

  if (pair.correct) {
    const incorrectLength = pair.incorrect.split(/\s+/u).length;
    const correctLength = pair.correct.split(/\s+/u).length;
    if (correctLength >= 3 || correctLength >= incorrectLength) {
      return contentType === "pattern"
        ? pair.correct
        : normalizeSentenceEnd(pair.correct);
    }
  }

  const candidates = [
    looksLikeInstruction(unit.repairTest) ? "" : unit.repairTest,
    unit.testAnswer,
    unit.examples[0] ?? "",
    pair.correct,
  ].map(clean);

  if (contentType !== "pattern") {
    const complete = candidates.find(looksLikeSentence);
    if (complete) return normalizeSentenceEnd(complete);
  }
  return candidates.find(Boolean) ?? clean(unit.rule);
}

function correctionSource(
  unit: ExerciseCompletionInput,
  pair: CorrectionPair,
): string {
  if (unit.title === "es gibt mit Akkusativ") {
    return "Es gibt ein Supermarkt in meiner Straße.";
  }
  return pair.incorrect || unit.commonError;
}

function closedMetadata(
  contentType: GrammarContentType,
  prompt: LocalizedExerciseCopy,
  hint: LocalizedExerciseCopy,
  acceptedAnswers: readonly string[] = [],
): GrammarExerciseMetadata {
  return {
    mode: "closed_recall",
    contentType,
    validation: "exact",
    answerRole: "expected",
    prompt,
    hint,
    feedbackDimensions: feedbackDimensionsFor(contentType),
    minimumSentences: 1,
    outputLanguage: "de",
    ...(acceptedAnswers.length ? { acceptedAnswers } : {}),
  };
}

function localizedClosedPrompt(
  kind:
    | "correction"
    | "cloze"
    | "second_cloze"
    | "second_text"
    | "order"
    | "choice"
    | "text"
    | "style",
  task: string,
): LocalizedExerciseCopy {
  const frames: Record<typeof kind, Record<ExplanationLanguage, string>> = {
    correction: {
      Deutsch: `Korrigiere die vorgegebene Form. Nicht richtig: ${task} Schreibe die vollständige richtige Antwort auf Deutsch.`,
      English: `Correct the given form. Incorrect: ${task} Write the complete correct answer in German.`,
      فارسی: `شکل داده‌شده را اصلاح کن. نادرست: ${task} پاسخ کامل و درست را به آلمانی بنویس.`,
    },
    cloze: {
      Deutsch: `Setze die fehlende Form ein und schreibe die vollständige Antwort auf Deutsch: ${task}`,
      English: `Fill in the missing form and write the complete answer in German: ${task}`,
      فارسی: `شکلِ جاافتاده را کامل کن و پاسخ کامل را به آلمانی بنویس: ${task}`,
    },
    second_cloze: {
      Deutsch: `Wende die Form in einem zweiten kontrollierten Beispiel an. Ergänze die Lücke und schreibe die vollständige Antwort auf Deutsch: ${task}`,
      English: `Apply the form in a second controlled example. Complete the gap and write the full answer in German: ${task}`,
      فارسی: `ساختار را در یک مثال کنترل‌شدهٔ دوم به‌کار ببر. جای خالی را کامل کن و پاسخ کامل را به آلمانی بنویس: ${task}`,
    },
    order: {
      Deutsch: `Ordne die Teile und schreibe einen vollständigen deutschen Satz: ${task}`,
      English: `Put the parts in order and write one complete German sentence: ${task}`,
      فارسی: `بخش‌ها را مرتب کن و یک جملهٔ کامل آلمانی بنویس: ${task}`,
    },
    choice: {
      Deutsch: `Wähle die passende Form und schreibe sie vollständig auf Deutsch: ${task}`,
      English: `Choose the suitable form and write it out completely in German: ${task}`,
      فارسی: `شکل مناسب را انتخاب کن و آن را کامل به آلمانی بنویس: ${task}`,
    },
    text: {
      Deutsch: `Ergänze die Lücke, sodass der Text zusammenhängt. Schreibe den vollständigen deutschen Text: ${task}`,
      English: `Complete the gap so the text is coherent. Write the complete German text: ${task}`,
      فارسی: `جای خالی را طوری کامل کن که متن پیوسته باشد. متن کامل را به آلمانی بنویس: ${task}`,
    },
    second_text: {
      Deutsch: `Überarbeite ein zweites kontrolliertes Textbeispiel. Ergänze die Lücke und schreibe den vollständigen deutschen Text: ${task}`,
      English: `Revise a second controlled text example. Complete the gap and write the full German text: ${task}`,
      فارسی: `یک مثال متنیِ کنترل‌شدهٔ دوم را بازبینی کن. جای خالی را کامل کن و متن کامل را به آلمانی بنویس: ${task}`,
    },
    style: {
      Deutsch: `Wähle die Formulierung, die zum Zielregister passt, und schreibe sie vollständig auf Deutsch: ${task}`,
      English: `Choose the wording that fits the target register and write it out completely in German: ${task}`,
      فارسی: `عبارتی را که با سبک موردنظر متناسب است انتخاب کن و کامل به آلمانی بنویس: ${task}`,
    },
  };
  return frames[kind];
}

function closedHint(contentType: GrammarContentType): LocalizedExerciseCopy {
  const focus = feedbackDimensionsFor(contentType).join(", ");
  return {
    Deutsch: `Diese Aufgabe ist eindeutig prüfbar. Kontrolliere nur: ${focus}.`,
    English: `This task has an objectively checkable answer. Check only: ${focus}.`,
    فارسی: `این تمرین پاسخ عینی و قابل‌بررسی دارد. فقط این موارد را کنترل کن: ${focus}.`,
  };
}

function productionBlueprint(level: string): ProductionBlueprint {
  if (level === "A1") {
    return {
      minimumSentences: 1,
      situationDe: "dein Zimmer, deine Straße, deinen Kurs oder deinen Alltag",
      situationEn: "your room, street, course, or daily life",
      situationFa: "اتاق، خیابان، کلاس یا زندگی روزمرهٔ خودت",
    };
  }
  if (level === "A2") {
    return {
      minimumSentences: 1,
      situationDe:
        "einen Einkauf, einen Termin, eine Reise oder die Universität",
      situationEn: "shopping, an appointment, a trip, or university",
      situationFa: "خرید، قرار، سفر یا دانشگاه",
    };
  }
  if (level === "B1") {
    return {
      minimumSentences: 2,
      situationDe: "eine eigene Erfahrung oder Meinung aus deinem Alltag",
      situationEn: "a personal experience or opinion from daily life",
      situationFa: "یک تجربه یا نظر شخصی از زندگی روزمره",
    };
  }
  if (level === "B2") {
    return {
      minimumSentences: 2,
      situationDe:
        "eine reale Situation bei der Arbeit, an der Universität oder bei der Lösung eines Problems",
      situationEn:
        "a real situation at work, university, or while solving a problem",
      situationFa: "یک موقعیت واقعی در کار، دانشگاه یا هنگام حل یک مسئله",
    };
  }
  return {
    minimumSentences: 3,
    situationDe:
      "einen professionellen oder akademischen Zusammenhang mit einer begründeten Position",
    situationEn: "a professional or academic context with a justified position",
    situationFa: "یک موقعیت حرفه‌ای یا دانشگاهی همراه با موضعی مستدل",
  };
}

function openPrompt(
  unit: ExerciseCompletionInput,
  blueprint: ProductionBlueprint,
): LocalizedExerciseCopy {
  if (unit.title === "es gibt mit Akkusativ") {
    return {
      Deutsch:
        `Was gibt es in deiner Stadt, deiner Straße, deiner Universität oder deinem Zimmer? ` +
        `Schreibe genau einen vollständigen Satz auf Deutsch zum Ziel „es gibt mit Akkusativ“. ` +
        `Formuliere zuerst deine beabsichtigte Bedeutung auf Persisch. Das Beispiel wird erst nach deinem ersten Versuch gezeigt.`,
      English:
        `What is there in your city, street, university, or room? ` +
        `Write exactly one complete sentence in German using the target “es gibt mit Akkusativ”. ` +
        `First state your intended meaning in Persian. The example is revealed only after your first attempt.`,
      فارسی:
        `در شهر، خیابان، دانشگاه یا اتاق تو چه چیزهایی وجود دارد؟ ` +
        `دقیقاً یک جملهٔ کامل به آلمانی با ساختار هدف «es gibt mit Akkusativ» بنویس. ` +
        `ابتدا معنیِ موردنظرت را به فارسی بنویس. مثال فقط پس از اولین تلاش تو نمایش داده می‌شود.`,
    };
  }

  const countDe =
    blueprint.minimumSentences === 1
      ? "genau einen vollständigen Satz"
      : `${blueprint.minimumSentences} zusammenhängende vollständige Sätze`;
  const countEn =
    blueprint.minimumSentences === 1
      ? "exactly one complete sentence"
      : `${blueprint.minimumSentences} connected complete sentences`;
  const countFa =
    blueprint.minimumSentences === 1
      ? "دقیقاً یک جملهٔ کامل"
      : `${blueprint.minimumSentences} جملهٔ کامل و پیوسته`;

  return {
    Deutsch:
      `Schreibe ${countDe} auf Deutsch über ${blueprint.situationDe}. ` +
      `Verwende dabei gezielt „${unit.title}“. ` +
      `Formuliere zuerst deine beabsichtigte Bedeutung auf Persisch. Das Beispiel wird erst nach deinem ersten Versuch gezeigt.`,
    English:
      `Write ${countEn} in German about ${blueprint.situationEn}. ` +
      `Use “${unit.title}” deliberately. ` +
      `First state your intended meaning in Persian. The example is revealed only after your first attempt.`,
    فارسی:
      `${countFa} به آلمانی دربارهٔ ${blueprint.situationFa} بنویس. ` +
      `ساختار «${unit.title}» را آگاهانه به‌کار ببر. ` +
      `ابتدا معنیِ موردنظرت را به فارسی بنویس. مثال فقط پس از اولین تلاش تو نمایش داده می‌شود.`,
  };
}

function openExercise(
  unit: ExerciseCompletionInput,
  contentType: GrammarContentType,
): GrammarExercise {
  const inspiration = clean(unit.examples[0] || unit.testAnswer || unit.rule);
  const blueprint = productionBlueprint(unit.level);
  const prompt = openPrompt(unit, blueprint);
  const focus = feedbackDimensionsFor(contentType).join(", ");
  const hint: LocalizedExerciseCopy = {
    Deutsch: `Deine Antwort bleibt Deutsch. Prüfe „${unit.title}“ sowie ${focus}. Das Modell ist keine Musterlösung.`,
    English: `Keep your answer in German. Check “${unit.title}” and ${focus}. The model is not the only correct answer.`,
    فارسی: `پاسخت باید آلمانی باشد. «${unit.title}» و این موارد را بررسی کن: ${focus}. مثال تنها پاسخ درست نیست.`,
  };

  return [
    prompt.Deutsch,
    inspiration,
    {
      mode: "open_production",
      contentType,
      validation: "ai_or_self_check",
      answerRole: "inspiration",
      prompt,
      hint,
      feedbackDimensions: feedbackDimensionsFor(contentType),
      minimumSentences: blueprint.minimumSentences,
      outputLanguage: "de",
      requiresLearnerIntentFa: true,
    },
  ];
}

function esGibtClosedExercises(
  contentType: GrammarContentType,
): readonly GrammarExercise[] {
  const hint = closedHint(contentType);
  const streetTranslation: LocalizedExerciseCopy = {
    Deutsch:
      "Übersetze diesen persischen Satz ins Deutsche: در خیابان من یک سوپرمارکت وجود دارد.",
    English:
      "Write this Persian sentence in German: در خیابان من یک سوپرمارکت وجود دارد.",
    فارسی: "این جمله را به آلمانی بنویس: در خیابان من یک سوپرمارکت وجود دارد.",
  };
  const accusativeChoice: LocalizedExerciseCopy = {
    Deutsch:
      "Setze die richtige Akkusativform ein und schreibe den vollständigen Satz: Es gibt ___ Supermarkt in meiner Straße. (ein / einen)",
    English:
      "Choose the correct accusative form and write the complete sentence in German: Es gibt ___ Supermarkt in meiner Straße. (ein / einen)",
    فارسی:
      "شکل درست Akkusativ را انتخاب کن و جملهٔ کامل را به آلمانی بنویس: Es gibt ___ Supermarkt in meiner Straße. (ein / einen)",
  };
  const wordOrder: LocalizedExerciseCopy = {
    Deutsch:
      "Ordne die Teile und schreibe den vollständigen Satz: In / meiner Straße / gibt es / einen Supermarkt.",
    English:
      "Put the parts in order and write the complete German sentence: In / meiner Straße / gibt es / einen Supermarkt.",
    فارسی:
      "بخش‌ها را مرتب کن و جملهٔ کامل آلمانی را بنویس: In / meiner Straße / gibt es / einen Supermarkt.",
  };
  const roomTranslation: LocalizedExerciseCopy = {
    Deutsch:
      "Übersetze diesen neuen persischen Satz ins Deutsche: در اتاق من یک میز تحریر وجود دارد.",
    English:
      "Write this new Persian sentence in German: در اتاق من یک میز تحریر وجود دارد.",
    فارسی:
      "این جملهٔ جدید را به آلمانی بنویس: در اتاق من یک میز تحریر وجود دارد.",
  };

  return [
    [
      streetTranslation.Deutsch,
      "In meiner Straße gibt es einen Supermarkt.",
      closedMetadata(contentType, streetTranslation, hint, [
        "Es gibt einen Supermarkt in meiner Straße.",
      ]),
    ],
    [
      accusativeChoice.Deutsch,
      "Es gibt einen Supermarkt in meiner Straße.",
      closedMetadata(contentType, accusativeChoice, hint),
    ],
    [
      wordOrder.Deutsch,
      "In meiner Straße gibt es einen Supermarkt.",
      closedMetadata(contentType, wordOrder, hint, [
        "Es gibt einen Supermarkt in meiner Straße.",
      ]),
    ],
    [
      roomTranslation.Deutsch,
      "In meinem Zimmer gibt es einen Schreibtisch.",
      closedMetadata(contentType, roomTranslation, hint, [
        "Es gibt einen Schreibtisch in meinem Zimmer.",
      ]),
    ],
  ];
}

/**
 * Rebuild every runtime set into four objectively checkable retrieval tasks
 * followed by one explicitly open production task. The open task keeps a
 * model only as inspiration; its metadata forbids fixed-string grading.
 */
export function completeControlledExercises(
  unit: ExerciseCompletionInput,
): readonly GrammarExercise[] {
  const contentType = classifyGrammarContent(unit);
  if (unit.title === "es gibt mit Akkusativ") {
    return [
      ...esGibtClosedExercises(contentType),
      openExercise(unit, contentType),
    ];
  }
  const pair = parseCorrection(unit.commonError);
  const correct = correctionAnswer(unit, pair, contentType);
  const incorrect = correctionSource(unit, pair);
  const primary = clean(unit.examples[0] || unit.testAnswer || correct);
  const secondary = clean(unit.examples[1] || unit.testAnswer || primary);
  const changed = changedToken(correct, incorrect);
  const hint = closedHint(contentType);
  const correctionPrompt = localizedClosedPrompt(
    "correction",
    normalizeSentenceEnd(incorrect),
  );
  const primaryCloze = localizedClosedPrompt(
    contentType === "text" ? "text" : "cloze",
    maskTarget(primary, changed),
  );

  let typeSpecificPrompt: LocalizedExerciseCopy;
  if (contentType === "sentence") {
    typeSpecificPrompt = localizedClosedPrompt(
      "order",
      reorderedParts(secondary),
    );
  } else if (contentType === "text") {
    typeSpecificPrompt = localizedClosedPrompt("text", maskTarget(secondary));
  } else if (contentType === "style") {
    typeSpecificPrompt = localizedClosedPrompt(
      "style",
      `A: ${incorrect} / B: ${primary}`,
    );
  } else {
    typeSpecificPrompt = localizedClosedPrompt(
      "choice",
      `A: ${incorrect} / B: ${primary}`,
    );
  }

  const secondaryCloze = localizedClosedPrompt(
    contentType === "text" ? "second_text" : "second_cloze",
    maskTarget(secondary),
  );
  const closed: readonly GrammarExercise[] = [
    [
      correctionPrompt.Deutsch,
      correct,
      closedMetadata(contentType, correctionPrompt, hint),
    ],
    [
      primaryCloze.Deutsch,
      primary,
      closedMetadata(contentType, primaryCloze, hint),
    ],
    [
      typeSpecificPrompt.Deutsch,
      contentType === "sentence" || contentType === "text"
        ? secondary
        : primary,
      closedMetadata(contentType, typeSpecificPrompt, hint),
    ],
    [
      secondaryCloze.Deutsch,
      secondary,
      closedMetadata(contentType, secondaryCloze, hint),
    ],
  ];

  return [...closed, openExercise(unit, contentType)];
}
