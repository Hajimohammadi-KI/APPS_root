window.GERMAN_GRAMMAR_RUNTIME = true;

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const units = Array.isArray(window.GERMAN_GRAMMAR_UNITS)
    ? window.GERMAN_GRAMMAR_UNITS
    : [];
  const params = new URLSearchParams(window.location.search);
  const progressKey = "deutsch-automaticity:grammar-progress:v3";
  const productionKey = "deutsch-automaticity:grammar-open-responses:v1";
  const learnerStateKey = "GrammarAutomaticityV11_de";
  const dailySessionKey = "deutsch-automaticity:daily-session:v1";
  const dailyContext =
    params.get("from") === "daily"
      ? {
          activity: Number(params.get("activity") || 1),
          topic: params.get("topic") || "",
          level: params.get("level") || "A1",
          returnTo: params.get("return") || "/heute",
        }
      : null;

  let selectedIndex = 0;
  let exerciseIndex = 0;
  let explanationLanguage = "Deutsch";
  let checkingOpenProduction = false;
  let toastTimer;
  let drafts;

  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character],
    );

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLocaleLowerCase("de-DE")
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\s+/g, " ");

  // Search remains case-insensitive; assessed German answers do not.
  const normalizeAnswer = (value) =>
    String(value ?? "")
      .normalize("NFC")
      .trim()
      .replace(/(?<![.!?])\.$/u, "")
      .replace(/\s+/gu, " ");

  const detectAnswerLanguage = (text) => {
    const value = String(text ?? "").normalize("NFC").trim();
    if (!value || /[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) return "other";
    if (/[\u0600-\u06ff]/u.test(value)) {
      return /[A-Za-zÄÖÜäöüß]/u.test(value) ? "other" : "fa";
    }
    const words = value.toLocaleLowerCase("de-DE").match(/\p{L}+/gu) ?? [];
    if (!words.length || words.some((word) => /[^\p{Script=Latin}]/u.test(word))) return "other";
    // Sparse lexical clues, not language proof. Keep unknown/mixed input unassessed.
    const german = new Set("ich du wir ihr sie mich dich sich euch ihnen mein meine meinen meiner meinem dein deine sein seine unser unsere nicht kein keine keinen ist sind bist habe hast haben habt wird werden wurde wurden würde wäre hätte könnte könnten muss müssen soll sollen kann können weil dass obwohl damit deshalb daher gibt bitte danke nein für über ohne zwischen zum zur beim gefahren gegangen".split(" "));
    const shared = new Set("der die das den dem des ein eine einen einem einer und mit nach aus im es er war hat bin".split(" "));
    const english = new Set("the and is are were this that these those you your my we they he she have has had hello friend please with from not our their write answer sentence".split(" "));
    const germanHits = words.filter((word) => german.has(word)).length;
    const sharedHits = new Set(words.filter((word) => shared.has(word))).size;
    const englishHits = words.filter((word) => english.has(word)).length;
    if (englishHits && (germanHits || sharedHits >= 2)) return "other";
    if (englishHits) return "en";
    if (germanHits || sharedHits >= 2) return "de";
    return "other";
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  };

  const uiCopy = {
    Deutsch: {
      closedEyebrow: "Geschlossene Übung · eindeutig prüfbar",
      openEyebrow: "Freie Produktion · mehrere Antworten möglich",
      closedPlaceholder: "Vollständige Antwort auf Deutsch",
      openPlaceholder: "Schreibe deinen eigenen Text auf Deutsch",
      intentLabel: "Schritt 1 · Beabsichtigte Bedeutung auf Persisch",
      intentPlaceholder:
        "ابتدا معنیِ جمله‌ای را که می‌خواهی به آلمانی بنویسی، به فارسی بنویس",
      intentHelp:
        "Nur bei freien Aufgaben: Lege zuerst auf Persisch fest, was dein eigener deutscher Satz bedeuten soll.",
      answerLabel: "Schritt 2 · Eigene deutsche Antwort",
      closedAnswerLabel: "Deine vollständige deutsche Antwort",
      check: "Antwort prüfen",
      evaluate: "Eigenen Text auswerten",
      checking: "Eigener Text wird geprüft …",
      correct: "Richtig — diese geschlossene Aufgabe ist eindeutig gelöst.",
      expected: "Noch nicht richtig. Eine passende Antwort ist:",
      empty: "Schreibe zuerst deine eigene deutsche Antwort.",
      intentEmpty:
        "Schreibe zuerst auf Persisch, was dein deutscher Satz bedeuten soll.",
      intentPersian:
        "Der erste Schritt muss persischen Text enthalten, damit deine beabsichtigte Bedeutung feststeht.",
      incomplete: (minimum) =>
        `Schreibe mindestens ${minimum} vollständige${minimum === 1 ? "n Satz" : " Sätze"} auf Deutsch.`,
      aiCorrect: "Sehr gut — deine eigene Formulierung wurde ausgewertet.",
      aiRevision: "Fast richtig — überarbeite gezielt deine eigene Formulierung.",
      selfCheck:
        "Selbstcheck: Dein eigener Text wurde lokal gespeichert und nicht mit dem Modellsatz verglichen. Ohne freigegebene, verbundene KI kann die App nicht jede freie Formulierung zuverlässig korrigieren.",
      inspiration: "Beispiel nur zur Inspiration, nicht als einzige Lösung:",
      dimensions: "Geprüfte Bereiche",
      aiUnavailable:
        "Online-KI ist nicht freigegeben oder nicht verbunden. Deshalb wird keine vollständige Korrektur vorgetäuscht.",
      corrected: "Verbesserte deutsche Form",
      acceptedAlternative: "Diese deutsche Form ist ebenfalls richtig.",
      exampleLocked:
        "Die deutschen Beispiele bleiben bis nach deinem eigenen Versuch verborgen.",
      wrongLanguage: "Die Antwort muss auf Deutsch geschrieben werden.",
      feedbackTitle: "Überprüfung deiner Antwort",
      nearlyCorrect: "Fast richtig. Nur wenige Stellen brauchen eine Korrektur.",
    },
    English: {
      closedEyebrow: "Closed task · objectively checkable",
      openEyebrow: "Open production · many answers are possible",
      closedPlaceholder: "Write the complete answer in German",
      openPlaceholder: "Write your own text in German",
      intentLabel: "Step 1 · Intended meaning in Persian",
      intentPlaceholder:
        "ابتدا معنیِ جمله‌ای را که می‌خواهی به آلمانی بنویسی، به فارسی بنویس",
      intentHelp:
        "Open tasks only: first state in Persian what your own German sentence should mean.",
      answerLabel: "Step 2 · Your own German answer",
      closedAnswerLabel: "Your complete German answer",
      check: "Check answer",
      evaluate: "Evaluate my own text",
      checking: "Evaluating your own text …",
      correct: "Correct — this closed task has one controlled answer.",
      expected: "Not correct yet. One suitable answer is:",
      empty: "Write your own German answer first.",
      intentEmpty:
        "First write in Persian what your German sentence should mean.",
      intentPersian:
        "Step 1 must contain Persian text so your intended meaning is recorded.",
      incomplete: (minimum) =>
        `Write at least ${minimum} complete German ${minimum === 1 ? "sentence" : "sentences"}.`,
      aiCorrect: "Very good — your own wording was evaluated.",
      aiRevision: "Almost right — revise your own wording using this feedback.",
      selfCheck:
        "Self-check: Your own text was saved locally and was not compared with the model sentence. Without approved, connected AI, the app cannot reliably correct every open response.",
      inspiration: "Example for inspiration only, not the only answer:",
      dimensions: "Checked dimensions",
      aiUnavailable:
        "Online AI is not approved or connected, so the app does not pretend to provide a complete correction.",
      corrected: "Improved German version",
      acceptedAlternative: "This German form is also correct.",
      exampleLocked:
        "The German examples stay hidden until after your own attempt.",
      wrongLanguage: "The answer must be written in German.",
      feedbackTitle: "Review of your answer",
      nearlyCorrect: "Almost correct. Only a few parts need correction.",
    },
    فارسی: {
      closedEyebrow: "تمرین بسته · دارای پاسخ عینی",
      openEyebrow: "تولید آزاد · پاسخ‌های درست متعدد",
      closedPlaceholder: "پاسخ کامل را به آلمانی بنویس",
      openPlaceholder: "متن خودت را به آلمانی بنویس",
      intentLabel: "مرحلهٔ ۱ · معنیِ موردنظر به فارسی",
      intentPlaceholder:
        "ابتدا معنیِ جمله‌ای را که می‌خواهی به آلمانی بنویسی، به فارسی بنویس",
      intentHelp:
        "فقط در تمرین باز: ابتدا به فارسی مشخص کن که جملهٔ آلمانیِ خودت باید چه معنایی داشته باشد.",
      answerLabel: "مرحلهٔ ۲ · پاسخ آلمانیِ خودت",
      closedAnswerLabel: "پاسخ کامل آلمانی",
      check: "بررسی پاسخ",
      evaluate: "ارزیابی متن خودم",
      checking: "متن خودت در حال بررسی است…",
      correct: "درست است — این تمرین بسته یک پاسخ کنترل‌شده دارد.",
      expected: "هنوز درست نیست. یک پاسخ مناسب:",
      empty: "ابتدا پاسخ آلمانی خودت را بنویس.",
      intentEmpty: "ابتدا معنیِ موردنظرت را به فارسی بنویس.",
      intentPersian:
        "مرحلهٔ اول باید دارای متن فارسی باشد تا معنیِ موردنظرت مشخص شود.",
      incomplete: (minimum) =>
        `حداقل ${minimum} جملهٔ کامل به آلمانی بنویس.`,
      aiCorrect: "بسیار خوب — جمله‌بندی خودت ارزیابی شد.",
      aiRevision: "تقریباً درست است — جمله‌بندی خودت را با این بازخورد اصلاح کن.",
      selfCheck:
        "خودارزیابی: متن خودت به‌صورت محلی ذخیره شد و با جملهٔ نمونه مقایسه نشد. بدون هوش مصنوعیِ متصل و مجاز، اپ نمی‌تواند هر پاسخ آزادی را قابل‌اعتماد تصحیح کند.",
      inspiration: "مثال فقط برای الهام است، نه تنها پاسخ درست:",
      dimensions: "موارد بررسی‌شده",
      aiUnavailable:
        "هوش مصنوعی آنلاین مجاز یا متصل نیست؛ بنابراین اپ وانمود نمی‌کند که تصحیح کامل انجام شده است.",
      corrected: "صورت اصلاح‌شدهٔ آلمانی",
      acceptedAlternative: "این صورت آلمانی نیز درست است.",
      exampleLocked:
        "مثال‌های آلمانی تا پس از تلاش خودت پنهان می‌مانند.",
      wrongLanguage: "پاسخ باید به آلمانی نوشته شود.",
      feedbackTitle: "بررسی پاسخ شما",
      nearlyCorrect: "جملهٔ شما تقریباً درست است. فقط چند بخش نیاز به اصلاح دارد.",
    },
  };

  const dimensionLabels = {
    Deutsch: {
      meaning: "Bedeutung",
      form: "Form",
      form: "Form",
      word_order: "Wortstellung",
      use: "Verwendung",
      coherence: "Kohärenz",
      linkage: "Verknüpfung",
      text_function: "Textfunktion",
      register: "Register",
      effect: "Wirkung",
      naturalness: "Natürlichkeit",
    },
    English: {
      meaning: "meaning",
      form: "form",
      word_order: "word order",
      use: "use",
      coherence: "coherence",
      linkage: "linkage",
      text_function: "text function",
      register: "register",
      effect: "effect",
      naturalness: "naturalness",
    },
    فارسی: {
      meaning: "معنا",
      form: "ساختار",
      word_order: "ترتیب واژه‌ها",
      use: "کاربرد",
      coherence: "انسجام",
      linkage: "پیوند متن",
      text_function: "کارکرد متن",
      register: "سبک زبانی",
      effect: "اثر",
      naturalness: "طبیعی‌بودن",
    },
  };

  const issueLabels = {
    Deutsch: {
      meaning: "Bedeutung",
      target_grammar: "Zielgrammatik",
      case: "Kasus",
      preposition: "Präposition und Kasus",
      word_order: "Wortstellung",
      spelling: "Rechtschreibung",
      vocabulary: "Wortschatz",
      style: "Stil",
      completeness: "Vollständigkeit",
      target_missing: "Zielstruktur",
      check: "Selbstcheck",
      model: "Beispiel nach dem Versuch",
      answer: "Deine Antwort",
      expected: "Passende Lösung",
      wrong_language: "Ausgabesprache",
    },
    English: {
      meaning: "Meaning",
      form: "Form",
      target_grammar: "Target grammar",
      case: "Case",
      preposition: "Preposition and case",
      word_order: "Word order",
      spelling: "Spelling",
      vocabulary: "Vocabulary",
      style: "Style",
      completeness: "Completeness",
      target_missing: "Target structure",
      check: "Self-check",
      model: "Example after your attempt",
      answer: "Your answer",
      expected: "Suitable solution",
      wrong_language: "Output language",
    },
    فارسی: {
      meaning: "معنا",
      form: "شکل واژه",
      target_grammar: "گرامر هدف",
      case: "حالت دستوری",
      preposition: "حرف اضافه و حالت دستوری",
      word_order: "ترتیب واژه‌ها",
      spelling: "املا",
      vocabulary: "واژگان",
      style: "سبک",
      completeness: "کامل‌بودن جمله",
      target_missing: "ساختار هدف",
      check: "خودارزیابی",
      model: "مثال پس از تلاش تو",
      answer: "پاسخ تو",
      expected: "پاسخ مناسب",
      wrong_language: "زبان پاسخ",
    },
  };

  const activeCopy = () => uiCopy[explanationLanguage] || uiCopy.Deutsch;
  const instructionLanguage = () => ({ Deutsch: "de", English: "en", فارسی: "fa" })[explanationLanguage] || "de";
  const navigationCopy = {
    de: { previous: "← Zurück", next: "Nächste Aufgabe →", hint: "Hinweis", audio: "Aufgabe vorlesen", guide: "Anleitung zur Aufgabe" },
    en: { previous: "← Previous", next: "Next task →", hint: "Hint", audio: "Read prompt aloud", guide: "How to do this task" },
    fa: { previous: "تمرین قبلی", next: "تمرین بعدی", hint: "راهنمایی", audio: "خواندن صورت سؤال", guide: "روش انجام تمرین" },
  };
  const localizedIssueLabel = (type) =>
    (issueLabels[explanationLanguage] || issueLabels.Deutsch)[type] || type;
  const renderFeedbackPoints = (points) =>
    `<ul class="feedback-points">${points
      .filter((point) => point?.message)
      .map(
        (point) =>
          `<li><strong>${escapeHtml(localizedIssueLabel(point.type || "check"))}:</strong> ${escapeHtml(point.message)}</li>`,
      )
      .join("")}</ul>`;
  const renderFeedbackHtml = (points) =>
    `<ul class="feedback-points">${points
      .filter((point) => point?.message || point?.html)
      .map(
        (point) =>
          `<li><strong>${escapeHtml(localizedIssueLabel(point.type || "check"))}:</strong> ${point.html ? `${point.html} ${escapeHtml(point.message || "")}` : escapeHtml(point.message)}</li>`,
      )
      .join("")}</ul>`;
  const localizedMessage = (messages) =>
    messages?.[explanationLanguage] || messages?.Deutsch || "";
  const containsPersian = (value) => /[\u0600-\u06ff]/u.test(String(value ?? ""));
  const exerciseMetadata = (exercise) =>
    exercise?.[2] && typeof exercise[2] === "object" ? exercise[2] : null;
  const isOpenProduction = (exercise) =>
    exerciseMetadata(exercise)?.mode === "open_production";
  const localizedExerciseText = (exercise, field, fallback = "") => {
    const localized = exerciseMetadata(exercise)?.[field];
    return localized?.[explanationLanguage] || localized?.Deutsch || fallback;
  };
  const countSentences = (value) =>
    String(value ?? "")
      .split(/(?:[.!?]+|\n+)/u)
      .map((part) => part.trim())
      .filter(Boolean).length;
  const countWords = (value) =>
    String(value ?? "").match(/[\p{Letter}\p{Number}'’-]+/gu)?.length || 0;
  const localizedDimensions = (metadata) => {
    const labels = dimensionLabels[explanationLanguage] || dimensionLabels.Deutsch;
    return (metadata?.feedbackDimensions || [])
      .map((dimension) => labels[dimension] || dimension)
      .join(", ");
  };
  const recordGrammarError = (unit, exercise, answer, category, corrected) => {
    const key = "deutschflow:grammar-error-patterns:v1";
    const existing = readJson(key, []);
    const rows = Array.isArray(existing) ? existing : [];
    const metadata = exerciseMetadata(exercise);
    const signature = `${unit.level}:${unit.title}:${category}`;
    const current = rows.find((row) => row.signature === signature);
    const next = current
      ? rows.map((row) =>
          row.signature === signature
            ? {
                ...row,
                occurrences: row.occurrences + 1,
                lastSeenAt: new Date().toISOString(),
              }
            : row,
        )
      : [
          ...rows,
          {
            signature,
            level: unit.level,
            topic: unit.title,
            contentType: metadata?.contentType || unit.contentType || "sentence",
            category,
            corrected,
            occurrences: 1,
            lastSeenAt: new Date().toISOString(),
          },
        ];
    localStorage.setItem(key, JSON.stringify(next.slice(-200)));
  };

  const answerLanguageFeedback = (answer, candidates = []) => {
    // Known closed forms can disambiguate short answers; models for open tasks cannot.
    const knownForm = candidates.some((candidate) =>
      normalizeAnswer(candidate).toLocaleLowerCase("de-DE") === normalizeAnswer(answer).toLocaleLowerCase("de-DE"),
    );
    const language = knownForm ? "de" : detectAnswerLanguage(answer);
    if (language === "de") return null;
    const uncertain = language === "other";
    return {
      status: uncertain ? "language_uncertain" : "wrong_language",
      points: [{
        type: uncertain ? "check" : "wrong_language",
        message: uncertain
          ? localizedMessage({
              Deutsch: "Die Sprache lässt sich hier nicht sicher erkennen. Die Antwort wurde noch nicht bewertet. Bitte ergänze etwas Kontext oder lass sie prüfen.",
              English: "The language is unclear, so this answer is not assessed. Add some context or have it reviewed.",
              فارسی: "زبان پاسخ روشن نیست و هنوز ارزیابی نشده است. کمی زمینه اضافه کن یا پاسخ را برای بررسی ارائه بده.",
            })
          : activeCopy().wrongLanguage,
      }],
    };
  };

  const localClosedFeedback = (answer, expected) => {
    const hasLocationCaseError = /\bin meine (straße|strasse)\b/iu.test(answer);
    const hasSupermarket = /\b(supermarkt|spermarket)\b/iu.test(answer);
    if (hasLocationCaseError && /\b(gibt es|es gibt)\b/iu.test(answer) && hasSupermarket) {
      const points = [
        {
          type: "case",
          message: localizedMessage({
            Deutsch: "In meine Straße ❌ → In meiner Straße ✅. Bei einem festen Ort steht „in“ mit dem Dativ.",
            English: "In meine Straße ❌ → In meiner Straße ✅. A fixed location uses „in“ with the dative.",
            فارسی: "In meine Straße ❌ → In meiner Straße ✅. مکان ثابت: in + Dativ.",
          }),
        },
      ];
      if (/\b(gibt es|es gibt) (ein|eine) (supermarkt|spermarket)\b/iu.test(answer)) {
        points.push({
          type: "case",
          message: localizedMessage({
            Deutsch: "„eine Supermarkt“ ❌ → „einen Supermarkt“ ✅. Supermarkt ist maskulin und steht nach „es gibt“ im Akkusativ.",
            English: "“eine Supermarkt” ❌ → “einen Supermarkt” ✅. Supermarkt is masculine and takes the accusative after “es gibt”.",
            فارسی: "«eine Supermarkt» ❌ → «einen Supermarkt» ✅. Supermarkt مذکر است و پس از «es gibt» در Akkusativ می‌آید.",
          }),
        });
      }
      return {
        status: "nearly_correct",
        points: [
          ...points,
          {
            type: "meaning",
            message: localizedMessage({
              Deutsch: "Richtig: „gibt es“ und „einen Supermarkt“.",
              English: "Correct: “gibt es” and “einen Supermarkt”.",
              فارسی: "بخش‌های درست: «gibt es» و «einen Supermarkt». ",
            }),
          },
        ],
        corrected: expected,
      };
    }
    if (/\bich sehe der mann\b/iu.test(answer)) {
      const highlighted = '<span class="feedback-error-token">der Mann</span> → <span class="feedback-correct-token">den Mann</span>';
      return {
        status: "nearly_correct",
        points: [{
          type: "case",
          html: `${highlighted}. ${escapeHtml(localizedMessage({
            Deutsch: "„Mann“ ist das direkte Objekt von „sehen“ und steht deshalb im Akkusativ.",
            English: "“Mann” is the direct object of “sehen”, so it takes the accusative.",
            فارسی: "«Mann» مفعول مستقیمِ «sehen» است و باید در حالت Akkusativ بیاید.",
          }))}`,
        }],
        corrected: "Ich sehe den Mann.",
      };
    }
    if (/\bich gebe der mann dem buch\b/iu.test(answer)) {
      return {
        status: "nearly_correct",
        points: [
          {
            type: "case",
            html: '<span class="feedback-error-token">der Mann</span> → <span class="feedback-correct-token">dem Mann</span>; <span class="feedback-error-token">dem Buch</span> → <span class="feedback-correct-token">das Buch</span>.',
            message: localizedMessage({
              Deutsch: "Bei „geben“ ist der Empfänger Dativ und die gegebene Sache Akkusativ.",
              English: "With “geben”, the recipient is dative and the thing given is accusative.",
              فارسی: "در فعل «geben»، گیرنده در حالت Dativ و چیزی که داده می‌شود در حالت Akkusativ است.",
            }),
          },
          {
            type: "target_grammar",
            message: localizedMessage({
              Deutsch: "Valenz: jemandem etwas geben → dem Mann das Buch.",
              English: "Valency: jemandem etwas geben → dem Mann das Buch.",
              فارسی: "الگوی فعل: jemandem etwas geben → dem Mann das Buch.",
            }),
          },
        ],
        corrected: "Ich gebe dem Mann das Buch.",
      };
    }
    const answerWords = answer.replace(/[.!?]+$/gu, "").split(/\s+/u);
    const expectedWords = expected.replace(/[.!?]+$/gu, "").split(/\s+/u);
    const differenceIndex = expectedWords.findIndex(
      (word, index) =>
        normalizeAnswer(word) !== normalizeAnswer(answerWords[index] || ""),
    );
    if (differenceIndex >= 0) {
      const userWord = answerWords[differenceIndex] || "(fehlt)";
      const expectedWord = expectedWords[differenceIndex] || "(entfernen)";
      return {
        status: "nearly_correct",
        points: [
          {
            type: "form",
            message: localizedMessage({
              Deutsch: `Prüfe diese Stelle: „${userWord}“ → „${expectedWord}“.`,
              English: `Check this part: “${userWord}” → “${expectedWord}”.`,
              فارسی: `این بخش را اصلاح کن: «${userWord}» → «${expectedWord}».`,
            }),
          },
        ],
        corrected: expected,
      };
    }
    return {
      status: "needs_revision",
      points: [
        {
          type: "meaning",
          message: localizedMessage({
            Deutsch: "Die deutsche Antwort passt noch nicht vollständig zur verlangten Bedeutung.",
            English: "The German answer does not yet fully match the required meaning.",
            فارسی: "پاسخ آلمانی هنوز کاملاً با معنای خواسته‌شده مطابقت ندارد.",
          }),
        },
      ],
      corrected: expected,
    };
  };
  const learnerAllowsOnlineAI = () =>
    readJson(learnerStateKey, {})?.learner?.allowOnlineAI === true;

  const saveOpenResponse = (
    unit,
    exercise,
    learnerIntentFa,
    response,
    outcome,
  ) => {
    const rows = JSON.parse(localStorage.getItem(productionKey) || "[]");
    if (!Array.isArray(rows)) throw new Error("Unreadable response history");
    const metadata = exerciseMetadata(exercise);
    rows.push({
      version: 2,
      level: unit.level,
      topic: unit.title,
      contentType: metadata?.contentType || unit.contentType || "sentence",
      learnerIntentFa,
      response,
      assistanceUsed: drafts?.assisted ?? false,
      outcome,
      occurredAt: new Date().toISOString(),
    });
    localStorage.setItem(productionKey, JSON.stringify(rows));
  };

  const parseAiEvaluation = (text) => {
    const match = String(text ?? "").match(/\{[\s\S]*\}/u);
    if (!match) return null;
    try {
      const value = JSON.parse(match[0]);
      if (
        !value ||
        !["correct", "needs_revision"].includes(value.verdict) ||
        typeof value.targetUsed !== "boolean" ||
        typeof value.complete !== "boolean" ||
        typeof value.correctedGerman !== "string" ||
        !Array.isArray(value.issueTypes)
      ) {
        return null;
      }
      const feedbackPoints = Array.isArray(value.feedbackPoints)
        ? value.feedbackPoints
            .filter(
              (point) =>
                point &&
                typeof point.type === "string" &&
                typeof point.message === "string" &&
                point.message.trim(),
            )
            .map((point) => ({
              type: point.type.slice(0, 50),
              message: point.message.trim().slice(0, 1_000),
            }))
            .slice(0, 10)
        : [];
      if (!feedbackPoints.length && typeof value.feedback === "string") {
        feedbackPoints.push({ type: "check", message: value.feedback.trim() });
      }
      if (!feedbackPoints.length) return null;
      return {
        verdict: value.verdict,
        targetUsed: value.targetUsed,
        complete: value.complete,
        correctedGerman: value.correctedGerman.trim(),
        feedbackPoints,
        issueTypes: value.issueTypes.map(String).slice(0, 8),
      };
    } catch {
      return null;
    }
  };

  const requestOpenProductionEvaluation = async (
    unit,
    exercise,
    learnerIntentFa,
    answer,
  ) => {
    if (!learnerAllowsOnlineAI()) return null;
    const metadata = exerciseMetadata(exercise);
    const request = {
      topic: unit.title,
      content: JSON.stringify({
        target: unit.title,
        rule: unit.rule,
        contentType: metadata?.contentType || unit.contentType || "sentence",
        feedbackDimensions: metadata?.feedbackDimensions || [],
        task: localizedExerciseText(exercise, "prompt", exercise[0]),
        inspirationOnly: exercise[1],
      }),
      learnerIntentFa,
      learnerInput: answer,
      language: explanationLanguage,
      purpose: "grammar-evaluation",
    };

    try {
      if (window.studyAI?.status && window.studyAI?.explain) {
        const status = await window.studyAI.status();
        if (!status?.connected) return null;
        const result = await window.studyAI.explain(request);
        const evaluation = parseAiEvaluation(result?.text);
        return evaluation
          ? {
              evaluation,
              source: `${result.providerLabel || "AI"} · ${result.model || "connected"}`,
            }
          : null;
      }

      const statusResponse = await fetch("/api/ai", { cache: "no-store" });
      if (!statusResponse.ok) return null;
      const status = await statusResponse.json();
      if (!status?.connected) return null;
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) return null;
      const result = await response.json();
      const evaluation = parseAiEvaluation(result?.text);
      return evaluation
        ? {
            evaluation,
            source: `${result.providerLabel || "AI"} · ${result.model || "connected"}`,
          }
        : null;
    } catch {
      return null;
    }
  };

  const localEsGibtFeedback = (answer) => {
    const normalizedAnswer = normalize(answer);
    const points = [];
    if (/\bin meiner stadt viele parks\b/u.test(normalizedAnswer)) {
      return {
        corrected: "In meiner Stadt gibt es viele Parks.",
        points: [
          {
            type: "target_missing",
            message: localizedMessage({
              Deutsch:
                "Deine Idee ist klar, aber das Verb fehlt. Verwende „es gibt“.",
              English:
                "Your idea is clear, but the verb is missing. Use “es gibt”.",
              فارسی:
                "منظورت روشن است، اما فعل در جمله نیست. از «es gibt» استفاده کن.",
            }),
          },
        ],
      };
    }

    if (/\bspermarket\b/u.test(normalizedAnswer)) {
      points.push({
        type: "spelling",
        message: localizedMessage({
          Deutsch: "„Spermarket“ → „Supermarkt“.",
          English: "“Spermarket” → “Supermarkt”.",
          فارسی: "املای درست: «Spermarket» → «Supermarkt».",
        }),
      });
    }
    const supermarketArticle = normalizedAnswer.match(
      /\bes gibt (ein|eine) (?:supermarkt|spermarket)\b/u,
    )?.[1];
    if (supermarketArticle) {
      points.push({
        type: "case",
        message: localizedMessage({
          Deutsch:
            `„${supermarketArticle}“ → „einen“: Supermarkt ist maskulin und steht nach „es gibt“ im Akkusativ.`,
          English:
            `“${supermarketArticle}” → “einen”: Supermarkt is masculine and takes the accusative after “es gibt”.`,
          فارسی:
            `«${supermarketArticle}» → «einen»؛ Supermarkt مذکر است و پس از «es gibt» در حالت Akkusativ می‌آید.`,
        }),
      });
    }
    if (/\bim strasse\b/u.test(normalizedAnswer)) {
      points.push({
        type: "preposition",
        message: localizedMessage({
          Deutsch:
            "„im Strasse“ → „in meiner Straße“ oder „in der Straße“: Straße ist feminin; „im“ bedeutet „in dem“ und passt hier nicht.",
          English:
            "“im Strasse” → “in meiner Straße” or “in der Straße”: Straße is feminine; “im” means “in dem” and does not fit here.",
          فارسی:
            "شکل درست: «im Strasse» → «in meiner Straße» یا «in der Straße»؛ Straße مؤنث است و «im = in dem» اینجا درست نیست.",
        }),
      });
    }
    if (!/\b(?:es gibt|gibt es)\b/u.test(normalizedAnswer)) {
      points.push({
        type: "target_missing",
        message: localizedMessage({
          Deutsch: "Verwende die Zielstruktur „es gibt“ in deinem Satz.",
          English: "Use the target structure “es gibt” in your sentence.",
          فارسی: "ساختار هدف «es gibt» را در جمله‌ات به‌کار ببر.",
        }),
      });
    }
    if (!points.length) return null;
    return {
      corrected:
        /\b(?:supermarkt|spermarket)\b/u.test(normalizedAnswer)
          ? "Es gibt einen Supermarkt in meiner Straße."
          : "",
      points,
    };
  };

  const progress = readJson(progressKey, {});
  const unitKey = (unit) => `${unit.level}:${unit.title}`;
  const completedFor = (unit) => progress[unitKey(unit)] || [];
  const saveProgress = () => localStorage.setItem(progressKey, JSON.stringify(progress));

  const notify = (message) => {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  };

  const deriveGoal = (unit) =>
    `Ich kann ${unit.title} in verständlichen, eigenen Sätzen passend verwenden.`;

  const renderCardBody = (items, fallback) => {
    if (Array.isArray(items) && items.length) {
      return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }
    return `<p>${escapeHtml(fallback || "")}</p>`;
  };

  const renderRule = (unit) => {
    const explanation = unit.explanation || {};
    const cards = [
      ["Bedeutung", renderCardBody(null, explanation.overview || unit.rule)],
      ["Form bilden", renderCardBody(explanation.formation, unit.rule)],
      ["Verwendung", renderCardBody(explanation.usage, unit.rule)],
      ["Satzstellung", renderCardBody(explanation.wordOrder, unit.rule)],
      ["Transfer", renderCardBody(null, explanation.memoryTip || unit.transferTest)],
    ];
    $("#ruleBody").innerHTML = `
      <p class="rule-intro">${escapeHtml(unit.rule)}</p>
      <div class="pattern-grid">
        ${cards
          .map(
            ([title, body], index) => `
              <article class="pattern-card">
                <div class="pattern-title"><span class="mini-icon">${index + 1}</span>${escapeHtml(title)}</div>
                ${body}
              </article>`,
          )
          .join("")}
      </div>`;
  };

  const currentUnit = () => units[selectedIndex];

  const renderExamples = (unit, reveal) => {
    const container = $("#examplesContent");
    if (!reveal) {
      container.innerHTML = `<p>${escapeHtml(activeCopy().exampleLocked)}</p>`;
      container.closest("details")?.removeAttribute("open");
      return;
    }
    container.innerHTML = `
      <p><strong>Vergleiche die Modelle:</strong></p>
      <ul>${(unit.examples || []).map((example) => `<li>${escapeHtml(example)}</li>`).join("")}</ul>
      <p><strong>Abruf:</strong> ${escapeHtml(unit.recallTest || "Erkläre die Regel ohne nachzusehen.")}</p>`;
  };

  const isRecitationExercise = (unit, exercise) =>
    !exerciseMetadata(exercise) &&
    Boolean(unit?.recallTest) &&
    exercise?.[1] === unit.recallTest;

  const renderExercise = () => {
    const unit = currentUnit();
    if (!unit) return;
    const exercises = Array.isArray(unit.exercises) && unit.exercises.length
      ? unit.exercises
      : [[unit.recallTest || `Bilde einen Satz mit ${unit.title}.`, unit.testAnswer || unit.examples?.[0] || ""]];
    exerciseIndex = Math.max(0, Math.min(exerciseIndex, exercises.length - 1));
    const exercise = exercises[exerciseIndex];
    const metadata = exerciseMetadata(exercise);
    const open = isOpenProduction(exercise);
    const requiresLearnerIntentFa =
      metadata?.requiresLearnerIntentFa === true;
    const copy = activeCopy();
    renderExamples(unit, !open);
    const language = instructionLanguage();
    window.languageWriting.render($("#exercisePrompt"), localizedExerciseText(exercise, "prompt", exercise[0]), language);
    const nav = navigationCopy[language];
    for (const [id, text] of [["previousBtn", nav.previous], ["nextBtn", nav.next], ["hintBtn", nav.hint], ["writingGuideTitle", nav.guide]]) {
      const element = $(`#${id}`);
      element.textContent = text;
      element.lang = language;
      element.dir = language === "fa" ? "rtl" : "ltr";
    }
    $("#audioBtn").setAttribute("aria-label", nav.audio);
    $("#audioBtn").lang = language;
    for (const id of ["exerciseEyebrow", "intentLabel", "intentHelp", "answerLabel", "checkBtn", "feedback"]) {
      const element = $(`#${id}`);
      element.lang = language;
      element.dir = language === "fa" ? "rtl" : "ltr";
    }
    $$("#ruleReference, .accordion-list details").forEach(panel => { panel.open = false; });
    $("#exerciseEyebrow").textContent = open
      ? copy.openEyebrow
      : isRecitationExercise(unit, exercise)
        ? "Freie Erklärung – vergleiche danach mit der Regel"
        : copy.closedEyebrow;
    const answerInput = $("#answerInput");
    const intentInput = $("#intentInput");
    $("#intentField").hidden = !requiresLearnerIntentFa;
    intentInput.disabled = !requiresLearnerIntentFa;
    intentInput.value = "";
    intentInput.placeholder = copy.intentPlaceholder;
    $("#intentLabel").textContent = copy.intentLabel;
    $("#intentHelp").textContent = copy.intentHelp;
    $("#answerLabel").textContent = requiresLearnerIntentFa
      ? copy.answerLabel
      : copy.closedAnswerLabel;
    answerInput.value = "";
    answerInput.placeholder = open
      ? copy.openPlaceholder
      : copy.closedPlaceholder;
    const checkButton = $("#checkBtn");
    checkButton.textContent = open ? copy.evaluate : copy.check;
    checkButton.disabled = checkingOpenProduction;
    checkButton.setAttribute("aria-busy", String(checkingOpenProduction));
    const feedback = $("#feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
    drafts?.load(`${unitKey(unit)}:${exerciseIndex}:${exercise[0]}`);
    $("#previousBtn").disabled = checkingOpenProduction || exerciseIndex === 0;
    $("#nextBtn").disabled =
      checkingOpenProduction || exerciseIndex === exercises.length - 1;
  };

  const renderLesson = () => {
    const unit = currentUnit();
    if (!unit) return;
    const completed = completedFor(unit).length;
    const total = Math.max(1, unit.exercises?.length || 1);
    $("#lessonTitle").textContent = unit.title;
    $(".crumbs .badge").textContent = unit.level;
    $(".crumbs .foundations").textContent = `${completed}/${total} Übungen`;
    $("#canDoGoal").textContent = deriveGoal(unit);
    renderExamples(unit, true);
    $("#mistakeContent").innerHTML = `
      <p>${escapeHtml(unit.commonError || "Prüfe Form, Bedeutung und Satzstellung.")}</p>
      <p><strong>Reparatur:</strong> ${escapeHtml(unit.repairTest || "Korrigiere den Fehler und erkläre die Änderung.")}</p>`;
    $("#pathContent").innerHTML = `
      <ol>
        <li>Rufe die Regel ab: <strong>${escapeHtml(unit.rule)}</strong></li>
        <li>Korrigiere diesen Fehler: „${escapeHtml(unit.commonError || unit.repairTest || "")}“</li>
        <li>Sprich den korrigierten Satz laut.</li>
        <li>Verwende ${escapeHtml(unit.title)} danach in einem eigenen, wahren Satz.</li>
      </ol>`;
    const extraModel = (unit.examples || [])[1] || (unit.examples || [])[0] || unit.rule;
    $("#resourcesContent").innerHTML = `
      <p><strong>Zusätzliche freie Übung; das Beispiel dient nur als Inspiration:</strong></p>
      <ol>
        <li>Schreibe einen anderen, eigenen Satz zum Ziel: „${escapeHtml(extraModel)}“</li>
        <li>Verwandle deinen Satz in eine Verneinung.</li>
        <li>Verwandle deinen Satz in eine Frage.</li>
      </ol>
      <p>Oben im Abrufbereich stehen dir außerdem ${(unit.exercises || []).length || 1} geführte Aufgaben zu ${escapeHtml(unit.title)} zur Verfügung.</p>`;
    renderRule(unit);
    exerciseIndex = 0;
    renderExercise();
    renderCatalog();
    history.replaceState(
      null,
      "",
      `${location.pathname}?topic=${encodeURIComponent(unit.title)}${dailyContext ? `&from=daily&activity=${dailyContext.activity}&level=${encodeURIComponent(dailyContext.level)}&return=${encodeURIComponent(dailyContext.returnTo)}` : ""}`,
    );
  };

  const renderCatalog = (query = $("#topicSearch")?.value || "") => {
    const list = $("#levelList");
    if (!list) return;
    const needle = normalize(query);
    list.innerHTML = levels
      .map((level) => {
        const levelUnits = units
          .map((unit, index) => ({ unit, index }))
          .filter(({ unit }) => unit.level === level)
          .filter(({ unit }) => !needle || normalize(`${unit.title} ${unit.rule}`).includes(needle));
        if (!levelUnits.length) return "";
        const done = levelUnits.reduce((sum, { unit }) => sum + completedFor(unit).length, 0);
        const total = levelUnits.reduce((sum, { unit }) => sum + Math.max(1, unit.exercises?.length || 1), 0);
        const selectedInLevel = levelUnits.some(({ index }) => index === selectedIndex);
        return `
          <details class="level" ${selectedInLevel || needle ? "open" : ""}>
            <summary>
              <span class="level-tag ${level.toLowerCase()}">${level} · GER</span>
              <span>${levelUnits.length} Themen <small class="catalog-progress">${done}/${total} Übungen erledigt</small></span>
            </summary>
            <div class="topic-list">
              ${levelUnits
                .map(({ unit, index }) => {
                  const unitDone = completedFor(unit).length;
                  const unitTotal = Math.max(1, unit.exercises?.length || 1);
                  return `
                    <button class="topic ${index === selectedIndex ? "active" : ""}" type="button" data-index="${index}">
                      <span class="topic-dot"></span>
                      <span>${escapeHtml(unit.title)}</span>
                      <span class="topic-count">${unitDone}/${unitTotal}</span>
                    </button>`;
                })
                .join("")}
            </div>
          </details>`;
      })
      .join("");
    const resultCount = $$(".topic", list).length;
    let resultStatus = $("#topicSearchStatus");
    if (!resultStatus) {
      resultStatus = document.createElement("p");
      resultStatus.id = "topicSearchStatus";
      resultStatus.setAttribute("role", "status");
      $("#topicSearch").closest(".catalog-tools").after(resultStatus);
    }
    resultStatus.textContent = needle ? (resultCount ? `${resultCount} passende Themen` : "Keine passenden Themen. Versuche einen anderen Suchbegriff.") : "";
    $$(".topic", list).forEach((button) => {
      button.addEventListener("click", () => {
        selectedIndex = Number(button.dataset.index);
        renderLesson();
        if (window.innerWidth <= 620) $(".content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const markDailyComplete = () => {
    if (!dailyContext) return;
    const session = readJson(dailySessionKey, {});
    const completedActivities = [
      ...new Set([...(session.completedActivities || []), dailyContext.activity]),
    ];
    localStorage.setItem(
      dailySessionKey,
      JSON.stringify({
        ...session,
        currentActivity: dailyContext.activity,
        completedActivities,
        updatedAt: new Date().toISOString(),
      }),
    );
    $("#dailyCompleteDialog")?.showModal();
  };

  const markExerciseComplete = (unit) => {
    const key = unitKey(unit);
    progress[key] = [...new Set([...(progress[key] || []), exerciseIndex])];
    saveProgress();
    renderCatalog();
    $(".crumbs .foundations").textContent = `${progress[key].length}/${unit.exercises.length} Übungen`;
    if (progress[key].length === unit.exercises.length) markDailyComplete();
    return progress[key].length;
  };

  const checkAnswer = async () => {
    if (checkingOpenProduction) return;
    const unit = currentUnit();
    if (!unit) return;
    const exercise = unit.exercises?.[exerciseIndex] || [unit.recallTest, unit.testAnswer];
    const learnerIntentFa = $("#intentInput").value.trim();
    const answer = $("#answerInput").value.trim();
    const expected = exercise[1] || unit.testAnswer || unit.examples?.[0] || "";
    const metadata = exerciseMetadata(exercise);
    const open = isOpenProduction(exercise);
    const feedback = $("#feedback");
    const copy = activeCopy();

    if (open && !learnerIntentFa) {
      feedback.className = "feedback show bad";
      feedback.innerHTML = renderFeedbackPoints([
        { type: "meaning", message: copy.intentEmpty },
      ]);
      $("#intentInput").focus();
      return;
    }
    if (open && !containsPersian(learnerIntentFa)) {
      feedback.className = "feedback show bad";
      feedback.innerHTML = renderFeedbackPoints([
        { type: "meaning", message: copy.intentPersian },
      ]);
      $("#intentInput").focus();
      return;
    }
    if (!answer) {
      feedback.className = "feedback show bad";
      feedback.innerHTML = renderFeedbackPoints([
        { type: "completeness", message: copy.empty },
      ]);
      $("#answerInput").focus();
      return;
    }

    try { saveOpenResponse(unit, exercise, learnerIntentFa, answer, open ? "submitted-unassessed" : "guided-practice"); }
    catch { feedback.className="feedback show bad"; feedback.textContent="Deine Antwort konnte nicht gespeichert werden. Lass diesen Tab offen und exportiere eine Sicherung."; return; }
    const acceptedAnswers = open ? [] : [expected, ...(Array.isArray(metadata?.acceptedAnswers) ? metadata.acceptedAnswers : [])];
    const languageFeedback = answerLanguageFeedback(answer, acceptedAnswers);
    if (languageFeedback) {
      feedback.className = languageFeedback.status === "language_uncertain" ? "feedback show" : "feedback show bad";
      feedback.innerHTML = renderFeedbackPoints(languageFeedback.points);
      return;
    }

    if (open) {
      const minimumSentences = Math.max(1, metadata?.minimumSentences || 1);
      if (countSentences(answer) < minimumSentences || countWords(answer) < 4) {
        feedback.className = "feedback show bad";
        feedback.textContent = copy.incomplete(minimumSentences);
        return;
      }

      if (unit.title === "es gibt mit Akkusativ") {
        const localIssue = localEsGibtFeedback(answer);
        if (localIssue) {
          feedback.className = "feedback show bad";
          feedback.innerHTML = `${renderFeedbackPoints(localIssue.points)}${
            localIssue.corrected
              ? `<p><strong>${escapeHtml(copy.corrected)}:</strong> ${escapeHtml(localIssue.corrected)}</p>`
              : ""
          }`;
          return;
        }
      }

      const evaluationContext = {
        unit: unitKey(unit),
        exerciseIndex,
        language: explanationLanguage,
        answer,
        learnerIntentFa,
      };
      checkingOpenProduction = true;
      const checkButton = $("#checkBtn");
      checkButton.disabled = true;
      checkButton.setAttribute("aria-busy", "true");
      checkButton.textContent = copy.checking;
      $("#previousBtn").disabled = true;
      $("#nextBtn").disabled = true;
      const result = await requestOpenProductionEvaluation(
        unit,
        exercise,
        learnerIntentFa,
        answer,
      );
      checkingOpenProduction = false;
      if (
        unitKey(currentUnit()) !== evaluationContext.unit ||
        exerciseIndex !== evaluationContext.exerciseIndex ||
        explanationLanguage !== evaluationContext.language ||
        $("#answerInput").value.trim() !== evaluationContext.answer ||
        $("#intentInput").value.trim() !== evaluationContext.learnerIntentFa
      ) {
        renderExercise();
        return;
      }
      checkButton.disabled = false;
      checkButton.setAttribute("aria-busy", "false");
      checkButton.textContent = copy.evaluate;
      $("#previousBtn").disabled = exerciseIndex === 0;
      $("#nextBtn").disabled = exerciseIndex === unit.exercises.length - 1;

      if (!result) {
        drafts.markAssisted();
        const completed = markExerciseComplete(unit);
        feedback.className = "feedback show";
        feedback.innerHTML = `<strong>${escapeHtml(copy.selfCheck)}</strong>${renderFeedbackPoints([
          { type: "check", message: copy.aiUnavailable },
          {
            type: "meaning",
            message: `${learnerIntentFa} ↔ ${answer}`,
          },
          {
            type: "check",
            message: `${copy.dimensions}: ${localizedDimensions(metadata)}`,
          },
          {
            type: "model",
            message: `${copy.inspiration} ${expected}`,
          },
        ])}`;
        notify(`${completed}/${unit.exercises.length}`);
        return;
      }

      const { evaluation, source } = result;
      const accepted =
        evaluation.verdict === "correct" &&
        evaluation.targetUsed &&
        evaluation.complete;
      feedback.className = `feedback show ${accepted ? "good" : "bad"}`;
      feedback.innerHTML = `<strong>${escapeHtml(accepted ? copy.aiCorrect : copy.aiRevision)}</strong>${renderFeedbackPoints(evaluation.feedbackPoints)}${
        evaluation.correctedGerman &&
        normalizeAnswer(evaluation.correctedGerman) !== normalizeAnswer(answer)
          ? `<p><strong>${escapeHtml(copy.corrected)}:</strong> ${escapeHtml(evaluation.correctedGerman)}</p>`
          : ""
      }<small>${escapeHtml(source)} · ${escapeHtml(copy.dimensions)}: ${escapeHtml(localizedDimensions(metadata))}</small>`;
      if (accepted) markExerciseComplete(unit);
      return;
    }

    const recitation = isRecitationExercise(unit, exercise);
    const correct = recitation
      ? answer.trim().length > 0
      : acceptedAnswers.some(
          (acceptedAnswer) => normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer),
        );
    feedback.className = `feedback show ${correct ? "good" : "bad"}`;
    if (recitation) {
      drafts.markAssisted();
      if (!correct) {
        feedback.innerHTML = `Schreibe zuerst deine eigene Erklärung, bevor du vergleichst.`;
        return;
      }
      feedback.innerHTML = `<strong>Die Regel zum Vergleich:</strong> ${escapeHtml(expected)}<br><span>Es gibt hier keine einzig richtige Formulierung – vergleiche nur Bedeutung und Vollständigkeit.</span>`;
    } else if (!correct) {
      drafts.markAssisted();
      const localIssue = localClosedFeedback(answer, expected);
      const points = localIssue?.points?.length
        ? localIssue.points
        : [
            { type: "answer", message: answer || copy.empty },
            { type: "expected", message: `${copy.expected} ${expected}` },
            {
              type: "check",
              message: `${copy.dimensions}: ${localizedDimensions(metadata)}`,
            },
          ];
      feedback.innerHTML = `<strong>${escapeHtml(copy.feedbackTitle)}</strong>${localIssue?.points?.some((point) => point.html) ? renderFeedbackHtml(localIssue.points) : renderFeedbackPoints(points)}${
        localIssue?.corrected
          ? `<p><strong>${escapeHtml(copy.corrected)}:</strong> ${escapeHtml(localIssue.corrected)}</p>`
          : ""
      }`;
      if (localIssue?.points?.length) {
        recordGrammarError(
          unit,
          exercise,
          answer,
          localIssue.points[0]?.type || "needs_revision",
          localIssue.corrected || expected,
        );
      }
      return;
    }
    const completed = markExerciseComplete(unit);
    if (!recitation) {
      const usedAlternative = normalizeAnswer(answer) !== normalizeAnswer(expected);
      const correctRulePoints =
        unit.title === "es gibt mit Akkusativ"
          ? [
              {
                type: "case",
                message: localizedMessage({
                  Deutsch: "In meiner Straße: fester Ort → in + Dativ.",
                  English: "In meiner Straße: fixed location → in + dative.",
                  فارسی: "In meiner Straße: مکان ثابت → in + Dativ.",
                }),
              },
              {
                type: "target_grammar",
                message: localizedMessage({
                  Deutsch: "Einen Supermarkt: es gibt verlangt den Akkusativ.",
                  English: "Einen Supermarkt: es gibt requires the accusative.",
                  فارسی: "Einen Supermarkt: پس از es gibt حالت Akkusativ می‌آید.",
                }),
              },
            ]
          : [];
      feedback.innerHTML = `<strong>${escapeHtml(copy.correct)}</strong>${
        usedAlternative
          ? renderFeedbackPoints([
              { type: "meaning", message: copy.acceptedAlternative },
            ])
          : ""
      }${renderFeedbackPoints(correctRulePoints)}
      <span>${completed}/${unit.exercises.length}</span>`;
    }
  };

  const speak = (text, language = explanationLanguage) => {
    if (!("speechSynthesis" in window)) {
      notify("Vorlesen wird in diesem Browser nicht unterstützt.");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === "English" ? "en-US" : language === "فارسی" ? "fa-IR" : "de-DE";
    speechSynthesis.speak(utterance);
  };

  const languageGuides = {
    Deutsch: {
      dir: "ltr",
      html: "<strong>So arbeitest du:</strong> Bei einer Übersetzungsaufgabe gibt die App den persischen Ausgangssatz vor; du schreibst nur die deutsche Fassung. Nur bei freien Aufgaben formulierst du zuerst deine eigene Bedeutung auf Persisch. Fehler erscheinen einzeln als Stichpunkte. Ohne freigegebene, verbundene KI zeigt die App einen ehrlichen Selbstcheck statt einer vorgetäuschten Korrektur.",
    },
    English: {
      dir: "ltr",
      html: "<strong>How to work:</strong> In a translation task, the app provides the Persian source sentence and you write only the German version. Only open tasks ask you to define your own meaning in Persian first. Errors are separated into bullet points. Without approved, connected AI, the app provides an honest self-check instead of pretending to correct every response.",
    },
    "فارسی": {
      dir: "rtl",
      html: "<strong>روش انجام تمرین:</strong> در تمرین ترجمه، اپ جملهٔ فارسی را می‌دهد و تو فقط ترجمهٔ آلمانی را می‌نویسی. فقط در تمرین باز، ابتدا معنیِ انتخابی خودت را به فارسی مشخص می‌کنی. هر خطا در یک بولت جدا توضیح داده می‌شود. بدون هوش مصنوعیِ متصل و مجاز، اپ به‌جای تصحیح ساختگی یک خودارزیابی صادقانه نشان می‌دهد.",
    },
  };

  const setupLearningControls = () => {
    const selectedTime = localStorage.getItem("deutsch-automaticity:study-time") || "15";
    const selectedLanguage = localStorage.getItem("deutsch-automaticity:explanation-language") || "فارسی"; // R77: Persian guidance until the learner chooses otherwise
    const renderTime = (value) => {
      $("#timeSummary").textContent = `${value} Minuten`;
      $("#timeChoices").innerHTML = [10, 15, 20, 25, 30, 40, 50, 60]
        .map((time) => `<button type="button" class="learning-choice ${String(time) === String(value) ? "active" : ""}" data-time="${time}">${time} Min.</button>`)
        .join("");
      $$("[data-time]").forEach((button) => button.addEventListener("click", () => {
        localStorage.setItem("deutsch-automaticity:study-time", button.dataset.time);
        renderTime(button.dataset.time);
      }));
    };
    const renderLanguage = (value) => {
      explanationLanguage = languageGuides[value] ? value : "Deutsch";
      const guide = languageGuides[explanationLanguage];
      $("#languageSummary").textContent = explanationLanguage;
      $("#honovrGuide").dir = guide.dir;
      $("#honovrGuide").lang = instructionLanguage();
      $("#honovrGuide").innerHTML = guide.html;
      $("#languageChoices").innerHTML = Object.keys(languageGuides)
        .map((language) => `<button type="button" class="learning-choice ${language === explanationLanguage ? "active" : ""}" data-language="${language}">${language}</button>`)
        .join("");
      $$("[data-language]").forEach((button) => button.addEventListener("click", () => {
        localStorage.setItem("deutsch-automaticity:explanation-language", button.dataset.language);
        renderLanguage(button.dataset.language);
        renderExercise();
      }));
    };
    renderTime(selectedTime);
    renderLanguage(selectedLanguage);
  };

  const setup = () => {
    if (!units.length) {
      $("#levelList").innerHTML = '<p role="alert">Der vollständige Grammatikkatalog konnte nicht geladen werden.</p>';
      $("#unitCount").textContent = "0";
      return;
    }

    $("#unitCount").textContent = String(units.length);
    const requestedTopic = dailyContext?.topic || params.get("topic") || "";
    const requestedIndex = units.findIndex((unit) => normalize(unit.title) === normalize(requestedTopic));
    const requestedLevelIndex = units.findIndex((unit) => unit.level === (dailyContext?.level || params.get("level")));
    selectedIndex = requestedIndex >= 0 ? requestedIndex : requestedLevelIndex >= 0 ? requestedLevelIndex : 0;

    window.createLanguageDrawer($("#sidebar"), $("#menuBtn"), $("#scrim"));
    drafts = window.createGrammarDrafts({ language:"de", answer:$("#answerInput"), intent:$("#intentInput"), onError:()=>{
      const feedback=$("#feedback"); feedback.className="feedback show bad"; feedback.textContent="Dein Entwurf konnte nicht gespeichert oder wiederhergestellt werden. Lass diesen Tab offen und exportiere eine Sicherung.";
    }});
    $$("#ruleReference, .accordion-list details").forEach(panel=>panel.addEventListener("toggle",()=>{if(panel.open) drafts.markAssisted();}));
    $("#topicSearch")?.addEventListener("input", (event) => renderCatalog(event.target.value));
    $("#checkBtn")?.addEventListener("click", checkAnswer);
    $("#answerInput")?.addEventListener("keydown", (event) => event.key === "Enter" && checkAnswer());
    $("#previousBtn")?.addEventListener("click", () => { exerciseIndex -= 1; renderExercise(); });
    $("#nextBtn")?.addEventListener("click", () => { exerciseIndex += 1; renderExercise(); });
    $("#hintBtn")?.addEventListener("click", () => {
      drafts.markAssisted();
      const unit = currentUnit();
      const exercise = unit?.exercises?.[exerciseIndex];
      const hint = localizedExerciseText(
        exercise,
        "hint",
        unit?.explanation?.memoryTip || unit?.rule || "Prüfe das Lernziel.",
      );
      const feedback = $("#feedback");
      feedback.className = "feedback show";
      window.languageWriting.render(feedback, hint, instructionLanguage());
      notify(hint);
    });
    $("#audioBtn")?.addEventListener("click", () => speak($("#exercisePrompt").textContent));
    $("[data-action='use-today']")?.addEventListener("click", () => {
      const unit = currentUnit();
      localStorage.setItem("deutsch-automaticity:today-grammar", JSON.stringify({ level: unit.level, topic: unit.title, updatedAt: new Date().toISOString() }));
      location.href = `/heute?from=grammar&level=${encodeURIComponent(unit.level)}&topic=${encodeURIComponent(unit.title)}`;
    });
    $("[data-action='help']")?.addEventListener("click", () => notify("Wähle links ein Niveau und ein Thema. Bearbeite danach die Aufgaben der Reihe nach."));
    $("[data-action='install']")?.addEventListener("click", () => location.assign("/support"));

    const rulerButton = $("#rulerBtn");
    const ruler = $("#readingRuler");
    rulerButton?.addEventListener("click", () => {
      const active = !document.body.classList.contains("ruler-active");
      document.body.classList.toggle("ruler-active", active);
      rulerButton.setAttribute("aria-pressed", String(active));
      ruler?.setAttribute("aria-hidden", String(!active));
    });
    document.addEventListener("pointermove", (event) => {
      if (document.body.classList.contains("ruler-active") && ruler) ruler.style.top = `${event.clientY - 18}px`;
    });

    $("#dailyReturnBtn")?.addEventListener("click", () => { location.href = dailyContext?.returnTo || "/heute"; });
    $("#dailyRepeatBtn")?.addEventListener("click", () => { $("#dailyCompleteDialog")?.close(); exerciseIndex = 0; renderExercise(); });
    $("#dailyMistakesBtn")?.addEventListener("click", () => { location.href = "/fehler"; });

    setupLearningControls();
    renderLesson();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
