import type { Language, Stage } from "./contracts";

export type SupportLanguage = "fa" | "en" | "de";
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface SupportGuideContext {
  stage?: Stage;
  familyId?: string;
  constructionId?: string;
  sourceRule?: string;
  /** Set only after the learner has requested the existing rule disclosure. */
  allowSourceRule?: boolean;
}
const names = { fa: "فارسی", en: "English", de: "Deutsch" } as const;
export const supportLanguageKey = (target: Language) => target === "en" ? "english-explanation-language" : "deutsch-automaticity:explanation-language";
function browserStorage(): PreferenceStorage | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}
export function readSupportLanguage(target: Language, storage: PreferenceStorage | null = browserStorage()): SupportLanguage {
  try {
    const value = storage?.getItem(supportLanguageKey(target));
    for (const code of ["fa", "en", "de"] as const) {
      if (value === code || (target === "de" && value === names[code])) return code;
    }
  } catch { /* A denied preference read does not affect learner evidence. */ }
  return "fa";
}
export function saveSupportLanguage(target: Language, language: SupportLanguage, storage: PreferenceStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(supportLanguageKey(target), target === "de" ? names[language] : language);
    return true;
  } catch { return false; }
}
type Translation = Record<SupportLanguage, string>;
const stageGuides: Record<Stage, Translation> = {
  notice: { fa: "الگو را کشف کن: معنی جمله، نقش واژه‌ها و شکل ساختار را در مثال‌ها مقایسه کن؛ سپس تفاوت را با زبان خودت توضیح بده.", en: "Discover the pattern: compare the meaning, word roles and forms in the examples, then explain the difference in your own words.", de: "Entdecke das Muster: Vergleiche Bedeutung, Wortrollen und Formen in den Beispielen. Erkläre danach den Unterschied mit eigenen Worten." },
  retrieve: { fa: "بدون نگاه‌کردن به نمونه، ساختار را از حافظه بازیابی کن. ابتدا پاسخ بده؛ اگر لازم شد بعد از تلاش راهنما را باز کن.", en: "Recall the structure from memory without reading a model. Try your response first; open help after your attempt if needed.", de: "Rufe die Struktur ohne Vorlage aus dem Gedächtnis ab. Antworte zuerst; öffne die Hilfe bei Bedarf nach deinem Versuch." },
  vary: { fa: "بخش خواسته‌شدهٔ جمله را تغییر بده و معنی اصلی را نگه دار. نقش واژهٔ جدید و تغییر لازم در ساختار را بررسی کن.", en: "Change the requested part of the sentence while keeping its main meaning. Check the new word's role and the required change in form.", de: "Verändere den geforderten Satzteil und bewahre die Kernaussage. Prüfe die Rolle des neuen Wortes und die nötige Formänderung." },
  produce: { fa: "با معنیِ انتخابی خودت پاسخ بساز. ساختار هدف را در جمله‌ای واقعی به کار ببر و سپس شکل واژه‌ها و ترتیب جمله را بررسی کن.", en: "Create a response with your own meaning. Use the target structure in a real sentence, then check word forms and sentence order.", de: "Formuliere eine Antwort mit deiner eigenen Bedeutung. Verwende die Zielstruktur in einem echten Satz und prüfe Formen und Wortstellung." },
  repair: { fa: "خطا را پیدا کن و دلیل اصلاح را توضیح بده. سپس جمله را دوباره بساز تا تفاوت پاسخ اول و اصلاح‌شده روشن باشد.", en: "Find the error and explain why it needs changing. Then rebuild the sentence so the difference from your first response is clear.", de: "Finde den Fehler und begründe die Änderung. Bilde den Satz anschließend neu, sodass der Unterschied zur ersten Antwort klar wird." },
  transfer: { fa: "آموخته را در موقعیت تازه به کار ببر. از روی معنی تصمیم بگیر چه ساختاری لازم است و پاسخی متناسب با موقعیت بساز.", en: "Use what you learned in a new situation. Decide which structure the meaning requires, then create a response that fits the context.", de: "Wende das Gelernte in einer neuen Situation an. Entscheide anhand der Bedeutung, welche Struktur nötig ist, und antworte passend zum Kontext." },
  retain: { fa: "پس از فاصلهٔ زمانی، بدون نمونه پاسخ بده. درستی پاسخ و میزان کمک را صادقانه ثبت کن؛ سرعت تنها یکی از نشانه‌های تسلط است.", en: "Respond again after a delay without a model. Record correctness and help honestly; speed is only one sign of mastery.", de: "Antworte nach einem zeitlichen Abstand erneut ohne Vorlage. Dokumentiere Richtigkeit und Hilfe ehrlich; Tempo ist nur ein Zeichen von Sicherheit." },
};
// Topic cues describe what to inspect; they do not contain item solutions.
const familyGuides: Record<string, Translation> = {
  G01: { fa: "ساختار جمله: فاعل، فعل و ترتیب اجزای جمله را پیدا کن.", en: "Clause structure: identify the subject, verb and order of sentence parts.", de: "Satzstruktur: Finde Subjekt, Verb und die Reihenfolge der Satzteile." },
  G02: { fa: "اسم و مرجع: مشخص کن دربارهٔ چه شخص یا چیزی صحبت می‌کنی.", en: "Nouns and reference: identify the person or thing you mean.", de: "Nomen und Referenz: Bestimme, welche Person oder Sache gemeint ist." },
  G03: { fa: "تعیین‌کننده: معین یا نامعین بودن اسم و شکل مناسب همراه آن را بررسی کن.", en: "Determiners: check whether the noun is definite and which form goes with it.", de: "Artikel: Prüfe Bestimmtheit und die passende Form beim Nomen." },
  G04: { fa: "ضمیر: مرجع را پیدا کن؛ نقش ضمیر را از مالکیت جدا کن و شکل مناسب آن را در جمله بررسی کن.", en: "Pronouns: find the reference, distinguish a pronoun's role from ownership and check its form in the sentence.", de: "Pronomen: Finde den Bezug, unterscheide Satzrolle und Besitz und prüfe die Form im Satz." },
  G05: { fa: "صفت و قید: مشخص کن واژه اسم را توصیف می‌کند یا فعل و ویژگی دیگری را.", en: "Adjectives and adverbs: decide whether the word describes a noun, a verb or another quality.", de: "Adjektive und Adverbien: Entscheide, ob das Wort ein Nomen, ein Verb oder eine andere Eigenschaft beschreibt." },
  G06: { fa: "زمان: زمان اتفاق و ارتباط آن با اکنون را مشخص کن، سپس شکل فعل را بررسی کن.", en: "Tense: locate the event in time and its link to now, then check the verb form.", de: "Tempus: Bestimme den Zeitpunkt und den Bezug zur Gegenwart; prüfe dann die Verbform." },
  G07: { fa: "رابطهٔ زمانی: برنامه، پیش‌بینی و ترتیب رویدادها را از معنی تشخیص بده.", en: "Time relations: use meaning to distinguish plans, predictions and the order of events.", de: "Zeitbezüge: Unterscheide anhand der Bedeutung Pläne, Vorhersagen und die Reihenfolge von Ereignissen." },
  G08: { fa: "ساختار فعل: بررسی کن فعل چه متمم، حرف اضافه یا حالت دستوری می‌خواهد.", en: "Verb patterns: check which complements, prepositions or cases the verb requires.", de: "Verbvalenz: Prüfe, welche Ergänzungen, Präpositionen oder Kasus das Verb verlangt." },
  G09: { fa: "مصدر و وجه وصفی: نقش بخش بدون فعل صرف‌شده و ارتباط آن با جملهٔ اصلی را بررسی کن.", en: "Nonfinite forms: check the role of the infinitive or participle and its link to the main clause.", de: "Infinite Formen: Prüfe die Rolle von Infinitiv oder Partizip und ihren Bezug zum Hauptsatz." },
  G10: { fa: "وجه: امکان، اجبار، اجازه یا میزان اطمینان گوینده را از معنی تشخیص بده.", en: "Modality: identify possibility, obligation, permission or the speaker's certainty.", de: "Modalität: Erkenne Möglichkeit, Pflicht, Erlaubnis oder die Sicherheit der Aussage." },
  G11: { fa: "معلوم و مجهول: تشخیص بده چه کسی عمل را انجام می‌دهد و تمرکز جمله روی چیست.", en: "Voice: identify who performs the action and what the sentence focuses on.", de: "Aktiv und Passiv: Bestimme, wer handelt und worauf der Satz den Fokus legt." },
  G12: { fa: "سؤال و نفی: بخش مورد سؤال یا نفی را مشخص کن و جای فعل و نشانهٔ نفی را بررسی کن.", en: "Questions and negation: identify what is asked or denied and check verb and negation placement.", de: "Fragen und Negation: Bestimme, was erfragt oder verneint wird, und prüfe Verb- und Negationsstellung." },
  G13: { fa: "حرف اضافه: رابطهٔ مکان، زمان یا معنی را مشخص کن و ترکیب درست را بررسی کن.", en: "Prepositions: identify the relation in space, time or meaning and check the required combination.", de: "Präpositionen: Bestimme die räumliche, zeitliche oder inhaltliche Beziehung und prüfe die passende Verbindung." },
  G14: { fa: "پیوند جمله‌ها: رابطهٔ دلیل، نتیجه، تضاد یا ترتیب را پیدا کن و ترتیب واژه‌ها را بررسی کن.", en: "Clause linking: identify reason, result, contrast or sequence and check word order.", de: "Satzverknüpfung: Erkenne Grund, Folge, Gegensatz oder Reihenfolge und prüfe die Wortstellung." },
  G15: { fa: "جملهٔ موصولی: اسم مرجع و نقش واژهٔ پیونددهنده را در جملهٔ وابسته پیدا کن.", en: "Relative clauses: find the reference noun and the linking word's role inside the relative clause.", de: "Relativsätze: Finde das Bezugsnomen und die Rolle des Relativwortes im Nebensatz." },
  G16: { fa: "شرط: واقعی یا فرضی بودن موقعیت و رابطهٔ شرط و نتیجه را مشخص کن.", en: "Conditionals: decide whether the situation is real or hypothetical and how condition and result connect.", de: "Bedingungen: Bestimme, ob die Situation real oder hypothetisch ist und wie Bedingung und Folge zusammenhängen." },
  G17: { fa: "نقل قول: گوینده، زمان و دیدگاه گزارش را مشخص کن و تغییرهای لازم را بررسی کن.", en: "Reported language: identify the speaker, time and reporting viewpoint; check the required changes.", de: "Indirekte Rede: Bestimme Sprecher, Zeit und Berichtsperspektive und prüfe die nötigen Änderungen." },
  G18: { fa: "تمرکز جمله: اطلاعات آشنا و تازه را جدا کن و ترتیب مناسب برای تأکید را بررسی کن.", en: "Information structure: distinguish known and new information and check the order for emphasis.", de: "Informationsstruktur: Trenne bekannte und neue Information und prüfe die Reihenfolge für die Betonung." },
  G19: { fa: "پیوستگی و لحن: ارتباط جمله‌ها و تناسب زبان با مخاطب و موقعیت را بررسی کن.", en: "Cohesion and register: check connections between sentences and language suited to audience and context.", de: "Kohäsion und Register: Prüfe Satzverbindungen und die passende Sprache für Adressat und Situation." },
  G20: { fa: "کاربرد ترکیبی: ساختارهای چندگانه را با معنی روشن و ترتیب منظم به هم وصل کن.", en: "Integrated use: combine several structures with clear meaning and orderly connections.", de: "Komplexe Anwendung: Verbinde mehrere Strukturen mit klarer Bedeutung und geordnetem Aufbau." },
  G21: { fa: "نوشتار: نشانه‌گذاری و شکل نوشتاری را همراه با نقش دستوری واژه بررسی کن.", en: "Orthography: check spelling and punctuation together with each word's grammatical role.", de: "Rechtschreibung: Prüfe Schreibweise und Zeichensetzung zusammen mit der grammatischen Rolle." },
};
const copy: Record<SupportLanguage, { title: string; label: string; general: string; target: Record<Language, string>; fallback: Record<Language, string>; unsaved: string }> = {
  fa: { title: "راهنمای زبان مادری", label: "زبان توضیحات", general: "ابتدا معنی و هدف سؤال را بفهم، سپس پاسخ خودت را بساز. انتخاب زبان راهنما پاسخ یا پیشرفتت را تغییر نمی‌دهد.", target: { en: "جمله‌ها، مثال‌ها و پاسخ تمرین به انگلیسی باقی می‌مانند.", de: "جمله‌ها، مثال‌ها و پاسخ تمرین به آلمانی باقی می‌مانند." }, fallback: { en: "ترجمهٔ این قاعده موجود نیست؛ متن اصلی به انگلیسی نمایش داده می‌شود.", de: "ترجمهٔ این قاعده موجود نیست؛ متن اصلی به آلمانی نمایش داده می‌شود." }, unsaved: "انتخاب زبان برای این صفحه اعمال شد؛ ذخیرهٔ تنظیم در مرورگر ممکن نیست." },
  en: { title: "Native-language guidance", label: "Explanation language", general: "Understand the meaning and goal of the task, then create your own response. Changing guidance language preserves your response and progress.", target: { en: "Task sentences, examples and responses remain in English.", de: "Task sentences, examples and responses remain in German." }, fallback: { en: "This rule is shown in its original English.", de: "A translation of this rule is unavailable; the original German is shown." }, unsaved: "The language applies to this page; browser preference storage is unavailable." },
  de: { title: "Erklärung in deiner Sprache", label: "Erklärungssprache", general: "Verstehe Bedeutung und Ziel der Aufgabe und formuliere deine eigene Antwort. Ein Sprachwechsel bewahrt deine Antwort und deinen Fortschritt.", target: { en: "Aufgabensätze, Beispiele und Antworten bleiben auf Englisch.", de: "Aufgabensätze, Beispiele und Antworten bleiben auf Deutsch." }, fallback: { en: "Eine Übersetzung dieser Regel fehlt; der englische Originaltext wird angezeigt.", de: "Diese Regel wird im deutschen Original angezeigt." }, unsaved: "Die Sprache gilt für diese Seite; die Browsereinstellung kann nicht gespeichert werden." },
};
export function getSupportGuide(language: SupportLanguage, target: Language, context: SupportGuideContext = {}) {
  const translation = copy[language];
  const sourceRule = context.allowSourceRule && context.sourceRule ? { text: context.sourceRule, lang: target, dir: "ltr" as const } : null;
  return {
    ...translation, lang: language, dir: language === "fa" ? "rtl" as const : "ltr" as const,
    stageText: context.stage ? stageGuides[context.stage][language] : translation.general,
    topicText: context.familyId ? familyGuides[context.familyId]?.[language] ?? "" : "",
    targetNote: translation.target[target], sourceRule,
    fallbackNote: sourceRule && language !== target ? translation.fallback[target] : "",
  };
}

/** This controller only changes its own host; response/session DOM is never rebuilt. */
export function mountSupportLanguageGuide(container: HTMLElement, target: Language, initialContext: SupportGuideContext = {}) {
  let context = initialContext;
  let language = readSupportLanguage(target);
  const details = document.createElement("details"); details.className = "support-language-guide"; details.dataset.supportLanguageGuide = "";
  const summary = document.createElement("summary");
  const label = document.createElement("label");
  const select = document.createElement("select"); select.className = "explanation-language-select"; select.dataset.supportLanguageSelect = "";
  select.setAttribute("aria-label", copy[language].label);
  for (const code of ["fa", "en", "de"] as const) {
    const option = document.createElement("option"); option.value = code; option.textContent = names[code]; option.lang = code; select.append(option);
  }
  label.append(select);
  const guidance = document.createElement("div"); guidance.className = "support-language-copy";
  const status = document.createElement("p"); status.className = "support-language-status"; status.setAttribute("role", "status");
  details.append(summary, label, guidance, status); container.append(details);
  const render = () => {
    const guide = getSupportGuide(language, target, context);
    details.lang = guide.lang; details.dir = guide.dir;
    summary.textContent = `${guide.title} · ${names[language]}`;
    label.setAttribute("aria-label", guide.label); select.setAttribute("aria-label", guide.label); select.value = language;
    guidance.replaceChildren();
    for (const text of [guide.stageText, guide.topicText, guide.targetNote, guide.fallbackNote]) {
      if (text) { const paragraph = document.createElement("p"); paragraph.textContent = text; guidance.append(paragraph); }
    }
    if (guide.sourceRule) { const source = document.createElement("p"); source.className = "support-language-source"; source.lang = guide.sourceRule.lang; source.dir = guide.sourceRule.dir; source.textContent = guide.sourceRule.text; guidance.append(source); }
  };
  const change = () => {
    const selected = select.value;
    if (selected !== "fa" && selected !== "en" && selected !== "de") return;
    language = selected;
    const saved = saveSupportLanguage(target, language);
    render(); status.textContent = saved ? "" : copy[language].unsaved;
    window.dispatchEvent(new CustomEvent("automaticity:support-language", { detail: { target, language } }));
  };
  const receive = (event: Event) => {
    if (event instanceof StorageEvent && event.key !== supportLanguageKey(target)) return;
    if (event instanceof CustomEvent) {
      const detail = event.detail as { target?: unknown; language?: unknown } | null;
      if (detail?.target !== target || !["fa", "en", "de"].includes(String(detail.language))) return;
      language = detail.language as SupportLanguage;
    } else language = readSupportLanguage(target);
    render();
  };
  select.addEventListener("change", change); window.addEventListener("storage", receive); window.addEventListener("automaticity:support-language", receive);
  render();
  return { update(next: SupportGuideContext) { context = next; render(); }, dispose() { select.removeEventListener("change", change); window.removeEventListener("storage", receive); window.removeEventListener("automaticity:support-language", receive); details.remove(); } };
}
