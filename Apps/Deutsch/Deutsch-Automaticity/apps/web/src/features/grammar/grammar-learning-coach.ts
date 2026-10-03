import { grammarCategoriesFor } from "@grammar/content";

export const grammarSupportLanguages = ["de", "en", "fa"] as const;

export type GrammarSupportLanguage = (typeof grammarSupportLanguages)[number];

export interface GrammarCoachContent {
  readonly title: string;
  readonly languageLabel: string;
  readonly goal: string;
  readonly steps: readonly string[];
  readonly recallPrompt: string;
  readonly comparePrompt: string;
  readonly sourceNote: string;
}

type GrammarCoachPath = "case" | "wordOrder" | "tense" | "chunk" | "general";

export interface GrammarCoachTopic {
  readonly title: string;
  readonly rule: string;
}

function grammarCoachPath(grammar: GrammarCoachTopic): GrammarCoachPath {
  const categories = grammarCategoriesFor(grammar);
  const source = `${grammar.title} ${grammar.rule}`.toLocaleLowerCase("de");

  if (
    categories.includes("Kasus") ||
    categories.includes("Nomen, Artikel & Plural") ||
    categories.includes("Adjektive & Adverbien")
  )
    return "case";
  if (
    categories.includes("Satzbau & Nebensätze") ||
    categories.includes("Konnektoren & Textverknüpfung") ||
    /neben|hauptsatz|satzbau|wortstellung|satzklammer|konnektor/u.test(source)
  )
    return "wordOrder";
  if (categories.includes("Zeitformen")) return "tense";
  if (
    categories.includes("Präpositionen") ||
    categories.includes("Verben & Verbformen")
  )
    return "chunk";
  return "general";
}

const coachContent: Readonly<
  Record<
    GrammarSupportLanguage,
    Readonly<Record<GrammarCoachPath, GrammarCoachContent>>
  >
> = {
  de: {
    case: {
      title: "Aktiver Kasus-Coach",
      languageLabel: "Deutsch",
      goal: "Zerlege einen Satz in einer festen Reihenfolge, statt zu raten.",
      steps: [
        "Finde Verb oder Präposition: Welchen Kasus fordert sie?",
        "Stelle die passende Frage: Wer? Wen? Wem? Wessen?",
        "Wähle Artikel und Adjektivendung für diesen Kasus.",
        "Sprich die ganze Nomengruppe laut und vergleiche erst dann.",
      ],
      recallPrompt:
        "Erkläre ohne Nachsehen, was den Kasus bestimmt, und bilde ein Beispiel.",
      comparePrompt:
        "Vergleiche jetzt mit Regel und Beispiel. Korrigiere nur den falschen Teil.",
      sourceNote:
        "Methode: aktiver Abruf → unmittelbarer Vergleich → kurze Reparatur → zeitversetzte Wiederholung. Die Übungssätze sind eigenständig formuliert.",
    },
    wordOrder: {
      title: "Aktiver Satzbau-Coach",
      languageLabel: "Deutsch",
      goal: "Finde erst das Satzgerüst; verschiebe Wörter erst danach.",
      steps: [
        "Finde das finite Verb.",
        "Entscheide: Hauptsatz oder Nebensatz?",
        "Setze das Verb auf Position zwei oder ans Ende des Nebensatzes.",
        "Sprich den Satz langsam und danach einmal natürlich.",
      ],
      recallPrompt:
        "Erkläre ohne Nachsehen die Verbposition mit einem kurzen Satz.",
      comparePrompt: "Prüfe jetzt nur Verbposition und Komma mit der Regel.",
      sourceNote:
        "Methode: Muster abrufen, einen Fehler finden und die Struktur in einem eigenen Satz wiederverwenden.",
    },
    tense: {
      title: "Aktiver Zeiten-Coach",
      languageLabel: "Deutsch",
      goal: "Wähle die Zeitform über Zeitangabe und Bedeutung, nicht durch Auswendiglernen.",
      steps: [
        "Finde das Zeitsignal.",
        "Benenne die Absicht: Gewohnheit, Ereignis oder Plan.",
        "Wähle Hilfsverb und Verbform.",
        "Bilde einen wahren Satz aus deinem Alltag und sprich ihn laut.",
      ],
      recallPrompt:
        "Erkläre ohne Nachsehen, wann du diese Zeitform verwendest.",
      comparePrompt:
        "Prüfe jetzt Zeitsignal, Hilfsverb und Verbform mit der Regel.",
      sourceNote:
        "Methode: Signal → Formwahl → persönliche Produktion → geplanter Abruf.",
    },
    chunk: {
      title: "Aktiver Verb-Präpositions-Coach",
      languageLabel: "Deutsch",
      goal: "Lerne Verb, Präposition und Kasus als eine Einheit.",
      steps: [
        "Sieh die ganze Einheit: Verb + Präposition + Kasus.",
        "Sprich die passende Frage laut.",
        "Baue die Einheit in einen kurzen Satz ein.",
        "Sage den Satz noch einmal ohne Hilfe.",
      ],
      recallPrompt:
        "Erkläre ohne Nachsehen die benötigte Einheit und ihren Kasus.",
      comparePrompt:
        "Vergleiche Einheit, Frage und Kasus mit der Regel; ergänze nur das Fehlende.",
      sourceNote:
        "Methode: kleine Einheiten, lauter Abruf, Reparatur eines Fehlers und zeitversetzte Wiederholung.",
    },
    general: {
      title: "Aktiver Grammatik-Coach",
      languageLabel: "Deutsch",
      goal: "Erkenne ein Grammatiksignal, benenne seinen Zweck und nutze es in einem echten Satz.",
      steps: [
        "Finde das wichtigste Signal im Satz.",
        "Benenne seine Funktion mit eigenen Worten.",
        "Wähle die passende Form.",
        "Schreibe und sprich einen kurzen Satz aus deinem Alltag.",
      ],
      recallPrompt:
        "Erkläre die Regel ohne Nachsehen einfach und mit einem persönlichen Beispiel.",
      comparePrompt:
        "Öffne die Regel nach deiner Antwort und repariere nur den Unterschied.",
      sourceNote:
        "Methode: aktiver Abruf, sofortige Rückmeldung, persönliche Produktion und Wiederholungen nach 1, 3, 7, 14 und 30 Tagen.",
    },
  },
  en: {
    case: {
      title: "Active case coach",
      languageLabel: "English",
      goal: "Analyse the sentence in a fixed order instead of guessing.",
      steps: [
        "Find the verb or preposition and identify the case it requires.",
        "Ask the matching question: who, whom, to whom, whose?",
        "Choose the article and adjective ending for that case.",
        "Say the whole noun phrase aloud, then compare.",
      ],
      recallPrompt:
        "Without looking, explain what determines the case and give one example.",
      comparePrompt:
        "Compare your answer with the rule and example. Repair only the incorrect part.",
      sourceNote:
        "Method: active recall → immediate comparison → one short repair → spaced review. All practice sentences are original.",
    },
    wordOrder: {
      title: "Active word-order coach",
      languageLabel: "English",
      goal: "Find the sentence frame before moving individual words.",
      steps: [
        "Find the finite verb.",
        "Decide whether this is a main or subordinate clause.",
        "Put the verb in position two or at the end of the subordinate clause.",
        "Say the sentence slowly, then once naturally.",
      ],
      recallPrompt:
        "Without looking, explain the verb position with one short example.",
      comparePrompt: "Check only the verb position and comma against the rule.",
      sourceNote:
        "Method: retrieve the pattern, find one error, then reuse the structure in your own sentence.",
    },
    tense: {
      title: "Active tense coach",
      languageLabel: "English",
      goal: "Choose the tense from meaning and time reference, not from memorisation alone.",
      steps: [
        "Find the time signal.",
        "Name the intention: habit, event, result, or plan.",
        "Choose the auxiliary and verb form.",
        "Create a true sentence from your life and say it aloud.",
      ],
      recallPrompt: "Without looking, explain when this tense is used.",
      comparePrompt:
        "Check the time signal, auxiliary, and verb form against the rule.",
      sourceNote:
        "Method: signal → form choice → personal production → scheduled retrieval.",
    },
    chunk: {
      title: "Active verb-preposition coach",
      languageLabel: "English",
      goal: "Learn the verb, preposition, and case as one unit.",
      steps: [
        "Read the whole unit: verb + preposition + case.",
        "Say the matching question aloud.",
        "Use the unit in a short personal sentence.",
        "Say it again without help.",
      ],
      recallPrompt: "Without looking, state the complete unit and its case.",
      comparePrompt:
        "Compare the unit, question, and case; add only what is missing.",
      sourceNote:
        "Method: small chunks, spoken recall, one repair, and spaced review.",
    },
    general: {
      title: "Active grammar coach",
      languageLabel: "English",
      goal: "Notice the grammar signal, name its purpose, and use it in a real sentence.",
      steps: [
        "Find the strongest signal in the sentence.",
        "Explain its function in your own words.",
        "Choose the required form.",
        "Write and say a short true sentence.",
      ],
      recallPrompt:
        "Explain the rule without looking and add one personal example.",
      comparePrompt:
        "Open the rule only after your attempt and repair the difference.",
      sourceNote:
        "Method: active recall, immediate feedback, personal production, and review after 1, 3, 7, 14, and 30 days.",
    },
  },
  fa: {
    case: {
      title: "مربی فعال حالت‌های دستوری",
      languageLabel: "فارسی",
      goal: "جمله را همیشه با یک ترتیب ثابت بررسی کن تا مجبور به حدس‌زدن نباشی.",
      steps: [
        "فعل یا حرف اضافه را پیدا کن و ببین کدام حالت را می‌خواهد.",
        "سؤال مناسب را بپرس: چه کسی؟ چه کسی را؟ به چه کسی؟ مال چه کسی؟",
        "آرتیکل و پایان صفت را متناسب با همان حالت انتخاب کن.",
        "کل گروه اسمی را بلند بگو و بعد با پاسخ مقایسه کن.",
      ],
      recallPrompt:
        "بدون نگاه‌کردن توضیح بده چه چیزی حالت دستوری را تعیین می‌کند و یک مثال بساز.",
      comparePrompt:
        "پاسخت را با قانون و مثال مقایسه کن و فقط بخش اشتباه را اصلاح کن.",
      sourceNote:
        "روش: بازیابی فعال ← مقایسه فوری ← اصلاح کوتاه ← مرور فاصله‌دار. همه جمله‌های تمرینی برای همین برنامه نوشته شده‌اند.",
    },
    wordOrder: {
      title: "مربی فعال ترتیب جمله",
      languageLabel: "فارسی",
      goal: "اول اسکلت جمله را پیدا کن و بعد کلمات را جابه‌جا کن.",
      steps: [
        "فعل صرف‌شده را پیدا کن.",
        "تشخیص بده جمله اصلی است یا وابسته.",
        "فعل را جایگاه دوم یا پایان جمله وابسته قرار بده.",
        "جمله را آهسته و سپس یک‌بار طبیعی بلند بگو.",
      ],
      recallPrompt: "بدون نگاه‌کردن جای فعل را با یک مثال کوتاه توضیح بده.",
      comparePrompt: "فقط جای فعل و ویرگول را با قانون مقایسه کن.",
      sourceNote:
        "روش: بازیابی الگو، یافتن یک خطا و استفاده دوباره از ساختار در جمله شخصی.",
    },
    tense: {
      title: "مربی فعال زمان‌ها",
      languageLabel: "فارسی",
      goal: "زمان فعل را از روی معنا و نشانه زمانی انتخاب کن، نه فقط با حفظ‌کردن.",
      steps: [
        "نشانه زمانی را پیدا کن.",
        "هدف جمله را مشخص کن: عادت، رویداد، نتیجه یا برنامه.",
        "فعل کمکی و شکل فعل را انتخاب کن.",
        "یک جمله واقعی از زندگی خودت بساز و بلند بگو.",
      ],
      recallPrompt: "بدون نگاه‌کردن توضیح بده این زمان چه وقت استفاده می‌شود.",
      comparePrompt: "نشانه زمانی، فعل کمکی و شکل فعل را با قانون بررسی کن.",
      sourceNote:
        "روش: نشانه ← انتخاب ساختار ← تولید شخصی ← بازیابی برنامه‌ریزی‌شده.",
    },
    chunk: {
      title: "مربی فعال فعل و حرف اضافه",
      languageLabel: "فارسی",
      goal: "فعل، حرف اضافه و حالت را به‌صورت یک واحد یاد بگیر.",
      steps: [
        "واحد کامل را ببین: فعل + حرف اضافه + حالت.",
        "سؤال مناسب را بلند بگو.",
        "این واحد را در یک جمله کوتاه شخصی به کار ببر.",
        "جمله را دوباره بدون کمک بگو.",
      ],
      recallPrompt: "بدون نگاه‌کردن واحد کامل و حالت آن را بیان کن.",
      comparePrompt:
        "واحد، سؤال و حالت را مقایسه کن و فقط بخش جاافتاده را اضافه کن.",
      sourceNote:
        "روش: واحدهای کوچک، بازیابی با صدای بلند، اصلاح یک خطا و مرور فاصله‌دار.",
    },
    general: {
      title: "مربی فعال گرامر",
      languageLabel: "فارسی",
      goal: "نشانه گرامری را پیدا کن، کاربردش را بگو و آن را در یک جمله واقعی استفاده کن.",
      steps: [
        "مهم‌ترین نشانه را در جمله پیدا کن.",
        "کاربرد آن را با کلمات خودت توضیح بده.",
        "ساختار درست را انتخاب کن.",
        "یک جمله کوتاه واقعی بنویس و بلند بگو.",
      ],
      recallPrompt:
        "بدون نگاه‌کردن قانون را ساده توضیح بده و یک مثال شخصی بساز.",
      comparePrompt:
        "فقط بعد از پاسخ خودت قانون را باز کن و تفاوت را اصلاح کن.",
      sourceNote:
        "روش: بازیابی فعال، بازخورد فوری، تولید شخصی و مرور در روزهای ۱، ۳، ۷، ۱۴ و ۳۰.",
    },
  },
};

export function grammarCoachFor(
  grammar: GrammarCoachTopic,
  language: GrammarSupportLanguage,
): GrammarCoachContent {
  return coachContent[language][grammarCoachPath(grammar)];
}

export function isGrammarSupportLanguage(
  value: string | null,
): value is GrammarSupportLanguage {
  return grammarSupportLanguages.some((language) => language === value);
}
