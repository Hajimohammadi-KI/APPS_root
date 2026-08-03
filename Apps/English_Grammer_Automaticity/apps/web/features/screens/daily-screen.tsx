"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Flame,
  GraduationCap,
  MessageCircleMore,
  Mic,
  RotateCcw,
  Square,
  Volume2,
} from "lucide-react";
import { grammarUnits, type CefrLevel } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LearningAccordion } from "@/features/components/learning-accordion";
import { EvaluationResult } from "@/features/components/evaluation-result";
import {
  currentDailyPlan,
  recalculateMastery,
  useAppStore,
  type AttemptMode,
} from "@/features/store/app-store";
import {
  classifyError,
  evaluateResponse,
  type Evaluation,
} from "@/lib/assessment";
import { speak } from "@/lib/speech";
import { requiredFirst, todayKey } from "@/lib/utils";

const stepInfo = [
  [
    "Write a personal sentence from a real situation",
    "Read the situation, then write one full sentence using the target grammar.",
  ],
  [
    "Read the correct sentence aloud",
    "Repeat the corrected sentence twice or record once and listen again.",
  ],
  [
    "Coach conversation",
    "Give a short real response and review pronunciation, word choice, and grammar.",
  ],
] as const;
const defaultGrammar = requiredFirst(grammarUnits, "Grammar catalog");
const DAILY_TIME_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 60] as const;
const LEVEL_OPTIONS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

type HonovrLanguage = "fa" | "de" | "en" | "ar";

function guidanceDirection(language: HonovrLanguage) {
  return language === "fa" || language === "ar" ? "rtl" : "ltr";
}

function minutesByCefr(level: CefrLevel, totalMinutes: number) {
  const ratios: Record<CefrLevel, readonly [number, number, number]> = {
    A1: [0.45, 0.32, 0.23],
    A2: [0.42, 0.31, 0.27],
    B1: [0.38, 0.28, 0.34],
    B2: [0.36, 0.25, 0.39],
    C1: [0.33, 0.22, 0.45],
    C2: [0.3, 0.2, 0.5],
  };
  const [grammarRatio, readRatio] = ratios[level];
  const grammarMinutes = Math.max(4, Math.round(totalMinutes * grammarRatio));
  const readAloudMinutes = Math.max(3, Math.round(totalMinutes * readRatio));
  const coachMinutes = Math.max(
    3,
    totalMinutes - grammarMinutes - readAloudMinutes,
  );
  return { grammarMinutes, readAloudMinutes, coachMinutes };
}

function scaffoldingCopy(
  language: HonovrLanguage,
  level: CefrLevel,
  grammarTitle: string,
) {
  const simple = level === "A1" || level === "A2";
  const maps: Record<
    HonovrLanguage,
    {
      studySummary: string;
      languageSummary: string;
      step1Guide: string;
      step2Guide: string;
      step2Checks: string;
      stage2Guide: string;
      stage2Steps: string;
      stage2Checks: string;
      stage3Guide: string;
      stage3Steps: string;
      stage3Checks: string;
    }
  > = {
    fa: {
      studySummary: "ابتدا زمان روزانه را انتخاب کن؛ زمان هر تمرین بر اساس CEFR تنظیم می شود.",
      languageSummary: "اول توضیح فارسی را بخوان، بعد محتوای انگلیسی را انجام بده.",
      step1Guide: simple
        ? `در این تمرین یک جمله ساده درباره زندگی خودت با ${grammarTitle} بنویس.`
        : `در این تمرین با ${grammarTitle} یک جمله دقیق تر و طبیعی تر درباره تجربه شخصی خودت بنویس.`,
      step2Guide: "گام 1: سه جمله شخصی بنویس. گام 2: زمان فعل و ترتیب واژه ها بررسی می شود.",
      step2Checks: "بررسی: زمان فعل، ترتیب کلمات، کامل بودن جمله.",
      stage2Guide: "جمله اصلاح شده را با صدای بلند بخوان تا فرم درست در حافظه گفتاری تثبیت شود.",
      stage2Steps: "گام 1: دو بار با صدای بلند بخوان. گام 2: یا یک بار ضبط کن و دوباره گوش بده.",
      stage2Checks: "بررسی: وضوح تلفظ، ریتم جمله، دقت فرم درست.",
      stage3Guide: "حالا در Coach Conversation یک پاسخ واقعی بده و از همین گرامر استفاده کن.",
      stage3Steps: "گام 1: پاسخ 45 تا 60 ثانیه ای. گام 2: بازخورد گرامر، واژگان و تلفظ را بررسی کن.",
      stage3Checks: "بررسی: زمان فعل، واژگان طبیعی، روانی پاسخ.",
    },
    de: {
      studySummary: "Waehle zuerst die taegliche Lernzeit; die Teilzeiten werden nach CEFR angepasst.",
      languageSummary: "Lies zuerst die Erklaerung auf Deutsch und arbeite dann mit dem Zielenglisch.",
      step1Guide: simple
        ? `Schreibe in dieser Uebung einen einfachen persoenlichen Satz mit ${grammarTitle}.`
        : `Schreibe in dieser Uebung einen praezisen, natuerlichen persoenlichen Satz mit ${grammarTitle}.`,
      step2Guide: "Schritt 1: Schreibe drei eigene Saetze. Schritt 2: Wir pruefen Zeitform und Wortstellung.",
      step2Checks: "Pruefung: Verbzeit, Wortfolge, Vollstaendigkeit.",
      stage2Guide: "Lies den korrigierten Satz laut, damit die korrekte Form stabil bleibt.",
      stage2Steps: "Schritt 1: Zweimal laut lesen. Schritt 2: Oder einmal aufnehmen und abhoeren.",
      stage2Checks: "Pruefung: Deutliche Aussprache, Satzrhythmus, korrekte Form.",
      stage3Guide: "Gib danach im Coach Conversation eine echte Antwort mit derselben Grammatik.",
      stage3Steps: "Schritt 1: 45-60 Sekunden antworten. Schritt 2: Feedback zu Grammatik, Wortwahl und Aussprache nutzen.",
      stage3Checks: "Pruefung: Verbzeit, natuerliche Wortwahl, Fluessigkeit.",
    },
    en: {
      studySummary: "Choose daily study time first; each task duration adapts to your CEFR level.",
      languageSummary: "Read the support explanation first, then perform the target-language task.",
      step1Guide: simple
        ? `In this task, write one simple personal sentence using ${grammarTitle}.`
        : `In this task, write one precise personal sentence using ${grammarTitle} in a realistic context.`,
      step2Guide: "Step 1: Write three personal sentences. Step 2: We check verb tense and word order.",
      step2Checks: "Checks: tense control, word order, and sentence completeness.",
      stage2Guide: "Read the corrected sentence aloud to stabilize accurate grammar and natural wording.",
      stage2Steps: "Step 1: Read it aloud twice. Step 2: Or record once and play it back.",
      stage2Checks: "Checks: pronunciation clarity, rhythm, and correct sentence form.",
      stage3Guide: "Then answer in Coach Conversation using the same grammar in a real response.",
      stage3Steps: "Step 1: Give a 45-60 second answer. Step 2: Review grammar, word choice, and pronunciation feedback.",
      stage3Checks: "Checks: verb tense, natural wording, and fluency.",
    },
    ar: {
      studySummary: "اختر وقت الدراسة اليومي اولا، ثم تتكيف مدة كل تمرين حسب مستوى CEFR.",
      languageSummary: "اقرا الشرح الداعم اولا، ثم نفذ مهمة اللغة الهدف.",
      step1Guide: simple
        ? `في هذا التمرين اكتب جملة شخصية بسيطة باستخدام ${grammarTitle}.`
        : `في هذا التمرين اكتب جملة شخصية ادق واكثر طبيعية باستخدام ${grammarTitle}.`,
      step2Guide: "الخطوة 1: اكتب ثلاث جمل شخصية. الخطوة 2: نفحص زمن الفعل وترتيب الكلمات.",
      step2Checks: "الفحص: زمن الفعل، ترتيب الكلمات، واكتمال الجملة.",
      stage2Guide: "اقرا الجملة المصححة بصوت عال لتثبيت الصيغة الصحيحة.",
      stage2Steps: "الخطوة 1: اقرأها مرتين. الخطوة 2: او سجل مرة واحدة واستمع للتسجيل.",
      stage2Checks: "الفحص: وضوح النطق، ايقاع الجملة، ودقة الصيغة.",
      stage3Guide: "ثم اجب في Coach Conversation باستخدام نفس القاعدة في موقف حقيقي.",
      stage3Steps: "الخطوة 1: اجابة من 45 الى 60 ثانية. الخطوة 2: راجع ملاحظات القواعد والمفردات والنطق.",
      stage3Checks: "الفحص: زمن الفعل، اختيار الكلمات، والطلاقة.",
    },
  };
  return maps[language];
}

type Step1Situation = {
  use: string;
  situation: string;
  prompt: string;
};

function normalizeSentence(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

function normalizeUseLabel(value: string) {
  const cleaned = value
    .replace(/^\s*(to\s+|for\s+)?/i, "")
    .replace(/^\s*(a|an|the|one)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractUsesFromRuleText(rule: string) {
  const normalized = rule.replace(/\s+/g, " ").trim();
  const segments: string[] = [];

  for (const match of normalized.matchAll(/\bfor\b\s+([^.;]+)/gi)) {
    const segment = match[1];
    if (segment) {
      segments.push(segment);
    }
  }

  if (segments.length === 0) {
    const toMatch = normalized.match(/\bto\b\s+([^.;]+)/i);
    if (toMatch?.[1]) {
      segments.push(toMatch[1]);
    }
  }

  const tokens = segments
    .flatMap((segment) => segment.split(/,|\band\b|\bor\b/gi))
    .map((item) => normalizeUseLabel(item))
    .filter((item) => item.length >= 3 && !/^(Use|State|Add)$/i.test(item));

  return [...new Set(tokens)];
}

function inferMainUses(grammarTitle: string, grammarRule: string) {
  const title = grammarTitle.toLowerCase();
  const rule = grammarRule.toLowerCase();
  const parsedFromRule = extractUsesFromRuleText(grammarRule);

  if (/verb be: am\/is\/are|\bto be\b/.test(title) || /\buse be\b/.test(rule)) {
    return [
      "Identify",
      "Describe",
      "Locate",
      "State age",
      "State nationality or origin",
      "State time or date",
      "State condition",
    ];
  }

  if (/subject pronouns?|object pronouns?|personal pronouns?/.test(title)) {
    return ["People as subject", "Things and ideas as subject", "Replacing repeated nouns"];
  }
  if (/plural nouns?|plural forms?/.test(title)) {
    return ["Regular plural forms", "Irregular plural forms", "Counted nouns in daily context"];
  }
  if (/possessive adjectives?|possessive pronouns?/.test(title)) {
    return ["Showing ownership", "Talking about family and relations", "Objects and personal items"];
  }
  if (/have\/has got|have got/.test(title)) {
    return ["Possession", "Family and relationships", "Personal characteristics"];
  }
  if (/w-?questions?|yes\/no questions?|question forms?/.test(title)) {
    return ["Asking for personal information", "Asking for place or time", "Asking for choices and decisions"];
  }
  if (/simple present/.test(title)) {
    return [
      "Daily habits",
      "General facts",
      "Schedules and timetables",
      "Permanent situations",
    ];
  }
  if (/present continuous|progressive/.test(title)) {
    return [
      "Action happening now",
      "Temporary current situation",
      "Planned near-future arrangement",
    ];
  }
  if (/present perfect/.test(title)) {
    return [
      "Life experience",
      "Recent result",
      "Unfinished time period",
      "Duration until now",
    ];
  }
  if (/past simple/.test(title)) {
    return [
      "Finished past event",
      "Past routine",
      "Time-specific completed action",
    ];
  }
  if (/future|will|going to/.test(title)) {
    return [
      "Prediction",
      "Spontaneous decision",
      "Personal plan",
      "Promise or offer",
    ];
  }
  if (/modal/.test(title)) {
    return [
      "Ability",
      "Advice",
      "Permission",
      "Possibility",
      "Obligation",
    ];
  }
  if (/conditionals?|if clause/.test(title)) {
    return [
      "Real present or future condition",
      "Hypothetical present condition",
      "Regret about the past",
      "Cause and result planning",
    ];
  }
  if (/passive/.test(title)) {
    return [
      "Process with unknown agent",
      "Formal announcement",
      "News-style reporting",
    ];
  }
  if (/relative clause/.test(title) || /\bwho\b|\bwhich\b|\bthat\b/.test(rule)) {
    return [
      "Describing people",
      "Describing things",
      "Adding defining detail",
    ];
  }
  if (/comparative|superlative|comparison/.test(title)) {
    return [
      "Comparing two choices",
      "Describing extremes",
      "Giving reasons for preference",
    ];
  }
  if (/preposition/.test(title)) {
    return [
      "Time expressions",
      "Place and movement",
      "Common verb-preposition pairs",
      "Daily routine locations",
    ];
  }
  if (/article|a\s*\/\s*an\s*\/\s*the|\ba\s+an\s+the\b/.test(title)) {
    return [
      "First mention vs known reference",
      "Unique noun in context",
      "General plural or uncountable meaning",
    ];
  }
  if (parsedFromRule.length >= 2) {
    return parsedFromRule;
  }

  return [
    "Personal routine",
    "Study or work context",
    "Family or social context",
  ];
}

function buildSituationText(use: string, index: number) {
  const u = use.toLowerCase();
  if (u.includes("habit")) {
    return "A classmate asks about your weekday morning routine before you leave home for work or university.";
  }
  if (u.includes("fact")) {
    return "You are explaining a simple fact about your city to a new international neighbor.";
  }
  if (u.includes("schedule") || u.includes("timetable")) {
    return "You are checking train times and telling your friend when the next train leaves.";
  }
  if (u.includes("permanent")) {
    return "During a self-introduction, you describe where you live or where you work now.";
  }
  if (u.includes("happening now") || u.includes("temporary")) {
    return "A friend calls you right now and asks what you are doing at this moment.";
  }
  if (u.includes("arrangement") || u.includes("plan")) {
    return "You and your cousin are organizing a meeting this week and confirming one specific plan.";
  }
  if (u.includes("experience")) {
    return "In a casual chat, someone asks whether you have ever tried a new activity like hiking alone.";
  }
  if (u.includes("result")) {
    return "At home, you explain a recent result that is visible now, such as finishing a task.";
  }
  if (u.includes("duration") || u.includes("until now")) {
    return "At work, you describe how long you have done one ongoing responsibility.";
  }
  if (u.includes("finished past") || u.includes("time-specific")) {
    return "A friend asks what you did last weekend and wants one clear completed action.";
  }
  if (u.includes("prediction")) {
    return "You look at dark clouds and share a quick weather prediction before going outside.";
  }
  if (u.includes("decision") || u.includes("offer") || u.includes("promise")) {
    return "Someone in your family needs help right now, and you decide what you will do.";
  }
  if (u.includes("ability")) {
    return "In a new team, you explain one skill you can do well to help the group.";
  }
  if (u.includes("advice")) {
    return "A friend feels tired these days and asks for one practical health suggestion.";
  }
  if (u.includes("permission")) {
    return "In a shared office, you ask politely before using a colleague's device.";
  }
  if (u.includes("possibility")) {
    return "You discuss weekend plans and mention one thing that might happen.";
  }
  if (u.includes("obligation")) {
    return "Your manager reminds the team about one rule that everyone must follow today.";
  }
  if (u.includes("condition") || u.includes("cause and result")) {
    return "You are planning your evening and explain one result that depends on a condition.";
  }
  if (u.includes("regret")) {
    return "You are reflecting on a mistake from last month and describing what would have been better.";
  }
  if (u.includes("passive") || u.includes("unknown agent") || u.includes("reporting")) {
    return "You read a public notice and report what action was completed, without naming the person who did it.";
  }
  if (u.includes("describing people")) {
    return "You recommend a teacher to your friend and add one defining detail about that person.";
  }
  if (u.includes("describing things") || u.includes("defining detail")) {
    return "You describe a device you use every day and explain one key feature.";
  }
  if (u.includes("comparing") || u.includes("preference")) {
    return "You are choosing between two supermarkets and explaining why one option is better for you.";
  }
  if (u.includes("extremes")) {
    return "You discuss restaurants in your area and identify the best option for quick lunch.";
  }
  if (u.includes("time expressions")) {
    return "You are arranging your day and mentioning exactly when an activity happens.";
  }
  if (u.includes("place") || u.includes("movement") || u.includes("location")) {
    return "A tourist asks for directions, and you explain one place relation clearly.";
  }
  if (u.includes("verb-preposition")) {
    return "You talk about a common routine and include a natural verb with its usual preposition.";
  }
  if (u.includes("first mention") || u.includes("known reference") || u.includes("unique noun")) {
    return "You describe buying an item and then referring to the same item again in a follow-up comment.";
  }

  const fallback = [
    "You are talking with a friend about one normal activity from today.",
    "You are explaining one real situation from work or study this week.",
    "You are sharing one simple personal detail in a social conversation.",
  ];
  return fallback[index % fallback.length]!;
}

function buildStep1Practice(grammarTitle: string, grammarRule: string) {
  const uses = inferMainUses(grammarTitle, grammarRule);
  const situations: Step1Situation[] = uses.map((use, index) => ({
    use,
    situation: buildSituationText(use, index),
    prompt: `Now write one complete sentence in ${grammarTitle} about this situation.`,
  }));
  return { uses, situations };
}

function buildStep2Script(correctSentence: string) {
  return {
    title: "Read the Correct Sentence Aloud",
    goal: "Fix the correct sentence in speaking and listening memory before conversation.",
    correctSentence,
    repeatModeTask: "Read the corrected sentence aloud two times.",
    repeatModeInstructions: [
      "Read the sentence once at a natural speed.",
      "Read it one more time with clear stress and ending sounds.",
    ],
    repeatCounterLabel: "Repeat aloud",
    recordModeTask: "Record yourself reading the corrected sentence once.",
    recordModeInstructions: [
      "Record one clear reading of the sentence.",
      "Listen to your recording once and compare it with the model sentence.",
    ],
  };
}

function buildStep3Task(grammarTitle: string) {
  return {
    question:
      "Some people believe strict routines always improve daily productivity. Do you agree for your own life?",
    goal:
      `Use ${grammarTitle} in a short real-life response with one direct answer and one supporting detail.`,
    hint:
      "Answer directly in sentence 1. Then add a reason, detail, example, or contrast in the next sentences.",
    vocabulary: ["daily routine", "stay focused", "in my experience"],
    task: [
      "Answer in 2-4 sentences about your real routine.",
      "Start with a direct opinion or fact.",
      "Then expand with one reason, example, or contrast.",
    ],
  };
}

export function DailyScreen({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const { state, mutate, recordAttempt, setTodayGrammar } = useAppStore();
  const grammar =
    grammarUnits.find((unit) => unit.title === state.todayGrammar?.title) ??
    defaultGrammar;
  const plan = currentDailyPlan(state);
  const [answers, setAnswers] = React.useState<Record<string, string>>(
    plan.answers,
  );
  const [results, setResults] = React.useState<
    Record<string, Evaluation | Evaluation[]>
  >({});
  const [messages, setMessages] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState("");
  const [readAloudState, setReadAloudState] = React.useState<
    "idle" | "recording"
  >("idle");
  const [readAloudAudioUrl, setReadAloudAudioUrl] = React.useState("");
  const readAloudRecorderRef = React.useRef<MediaRecorder | null>(null);
  const readAloudStreamRef = React.useRef<MediaStream | null>(null);
  const readAloudChunksRef = React.useRef<Blob[]>([]);
  const due = state.reviews
    .filter(
      (review) => review.status === "pending" && review.dueAt <= Date.now(),
    )
    .toSorted((a, b) => a.dueAt - b.dueAt);
  const [sessionTarget, setSessionTarget] = React.useState<1 | 2 | 3>(() =>
    state.settings.dailyStudyMinutes >= 25
      ? 3
      : state.settings.dailyStudyMinutes >= 15
        ? 2
        : 1,
  );
  const lastError = state.errors.toSorted((a, b) =>
    b.lastSeenAt.localeCompare(a.lastSeenAt),
  )[0];
  const corrected = lastError?.correctedText ?? "She doesn't work here.";
  const progress = Math.round((plan.completed.length / 3) * 100);
  const sessionCompleted = plan.completed.filter(
    (step) => step < sessionTarget,
  ).length;
  const selectedLevel =
    state.learner.selfDeclaredLevel ?? (grammar.level as CefrLevel);
  const dailyMinutes = state.settings.dailyStudyMinutes;
  const honovrLanguage = state.settings.honovrLanguage;
  const scaffoldDir = guidanceDirection(honovrLanguage);
  const timing = minutesByCefr(selectedLevel, dailyMinutes);
  const workflow = [
    {
      phase: "Prepare",
      focus: "Grammar in context",
      minutes: timing.grammarMinutes,
      summary:
        "Understand how to use the grammar in a real daily-life situation.",
      icon: GraduationCap,
    },
    {
      phase: "Rehearse",
      focus: "Read aloud",
      minutes: timing.readAloudMinutes,
      summary:
        "Stabilize the corrected sentence with repeat or recording mode.",
      icon: Volume2,
    },
    {
      phase: "Perform",
      focus: "Coach conversation",
      minutes: timing.coachMinutes,
      summary:
        "Use the same grammar in a short, natural speaking response.",
      icon: MessageCircleMore,
    },
  ] as const;
  const copy = scaffoldingCopy(honovrLanguage, selectedLevel, grammar.title);
  const step1Plan = React.useMemo(
    () => buildStep1Practice(grammar.title, grammar.rule),
    [grammar.rule, grammar.title],
  );
  const readAloudRepeats = Number(answers.repairRepeats ?? 0);
  const readAloudRecorded = answers.repairRecorded === "1";
  const readAloudDone = readAloudRepeats >= 2 || readAloudRecorded;
  const correctedSentenceForReadAloud = React.useMemo(() => {
    const firstRecall = step1Plan.situations
      .map((_, index) => results[`recall:${index}`])
      .find((item) => item && !Array.isArray(item)) as Evaluation | undefined;
    if (firstRecall?.corrected) {
      return firstRecall.corrected;
    }
    const sentenceResults = results.sentences;
    if (Array.isArray(sentenceResults) && sentenceResults.length > 0) {
      return sentenceResults[0]?.corrected ?? corrected;
    }
    if (sentenceResults && !Array.isArray(sentenceResults)) {
      return sentenceResults.corrected;
    }
    return corrected;
  }, [corrected, results, results.sentences, step1Plan.situations]);

  const correctedStep1Items = React.useMemo(
    () =>
      step1Plan.situations
        .map((item, index) => {
          const key = `recall:${index}`;
          const result = results[key];
          if (!result || Array.isArray(result) || !result.corrected.trim()) {
            return null;
          }
          return { index, use: item.use, corrected: result.corrected.trim() };
        })
        .filter(
          (item): item is { index: number; use: string; corrected: string } =>
            Boolean(item),
        ),
    [results, step1Plan.situations],
  );

  const allStep2RewritesDone = React.useMemo(
    () =>
      correctedStep1Items.length > 0 &&
      correctedStep1Items.every((item) => {
        const rewrite = answers[`rewrite:${item.index}`] ?? "";
        return normalizeSentence(rewrite) === normalizeSentence(item.corrected);
      }),
    [answers, correctedStep1Items],
  );
  const step2Script = React.useMemo(
    () => buildStep2Script(correctedSentenceForReadAloud),
    [correctedSentenceForReadAloud],
  );
  const step3Task = React.useMemo(
    () => buildStep3Task(grammar.title),
    [grammar.title],
  );

  React.useEffect(() => {
    setAnswers(plan.answers);
  }, [state.todayGrammar?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setSessionTarget(dailyMinutes >= 25 ? 3 : dailyMinutes >= 15 ? 2 : 1);
  }, [dailyMinutes]);

  React.useEffect(
    () => () => {
      readAloudStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
      if (readAloudAudioUrl) URL.revokeObjectURL(readAloudAudioUrl);
    },
    [readAloudAudioUrl],
  );

  const saveAnswer = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    mutate((draft) => {
      const daily = draft.dailyPlans[todayKey()] ?? {
        completed: [],
        answers: {},
      };
      daily.answers[key] = value;
      draft.dailyPlans[todayKey()] = daily;
    });
  };

  const completeStep = (index: number) => {
    mutate((draft) => {
      const daily = draft.dailyPlans[todayKey()] ?? {
        completed: [],
        answers: {},
      };
      if (!daily.completed.includes(index)) daily.completed.push(index);
      draft.dailyPlans[todayKey()] = daily;
      draft.activity[todayKey()] = daily.completed.length;
    });
  };

  React.useEffect(() => {
    if (
      !plan.completed.includes(1) &&
      readAloudDone &&
      (correctedStep1Items.length === 0 || allStep2RewritesDone)
    ) {
      completeStep(1);
    }
  }, [
    allStep2RewritesDone,
    correctedStep1Items.length,
    plan.completed,
    readAloudDone,
  ]);

  const startReadAloudRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      readAloudStreamRef.current = stream;
      readAloudChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      readAloudRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) readAloudChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(readAloudChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setReadAloudAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setReadAloudState("recording");
    } catch {
      setMessages((current) => ({
        ...current,
        readAloud:
          "Microphone is unavailable. You can still complete Stage 2 by reading aloud twice and marking each repeat.",
      }));
    }
  };

  const stopReadAloudRecording = async () => {
    const recorder = readAloudRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    await new Promise<void>((resolve) => {
      recorder.addEventListener("stop", () => resolve(), { once: true });
      recorder.stop();
    });
    saveAnswer("repairRecorded", "1");
    completeStep(1);
    setReadAloudState("idle");
  };

  const record = (
    evaluation: Evaluation,
    mode: AttemptMode,
    topic = grammar.title,
  ) => {
    recordAttempt({
      grammarTitle: grammar.title,
      mode,
      inputText: evaluation.original,
      correctedText: evaluation.corrected,
      targetHit: evaluation.targetUses >= evaluation.required,
      accuracyScore: evaluation.accuracyScore,
      fluencyScore: 0,
      latencyMs: null,
      passed: evaluation.masteryEligible && evaluation.pass,
      verified: evaluation.masteryEligible,
    });
    mutate((draft) => {
      evaluation.matches.forEach((match) => {
        const errorClass = classifyError(match);
        const signature = `${grammar.title}:${errorClass}:${
          match.context?.text ?? evaluation.original
        }`;
        const existing = draft.errors.find((error) => error.id === signature);
        if (existing) {
          existing.occurrenceCount += 1;
          existing.lastSeenAt = new Date().toISOString();
          existing.repairStatus = "scheduled";
          existing.nextRepairAt = Date.now() + 86_400_000;
        } else {
          draft.errors.push({
            id: signature,
            grammarTitle: grammar.title,
            topic,
            errorClass,
            originalText: match.context?.text ?? evaluation.original,
            correctedText: evaluation.corrected,
            explanation: match.message,
            occurrenceCount: 1,
            repairStatus: "scheduled",
            nextRepairAt: Date.now() + 86_400_000,
            lastSeenAt: new Date().toISOString(),
          });
        }
      });
      recalculateMastery(draft, grammar.title);
    });
  };

  const evaluateOne = async (
    resultKey: string,
    value: string,
    options: {
      minWords: number;
      requiredTargetUses: number;
      mode: AttemptMode;
      taskPrompt: string;
    },
  ) => {
    if (!value.trim()) {
      setMessages((current) => ({
        ...current,
        [resultKey]: "Write your own English answer first.",
      }));
      return null;
    }
    setLoading(resultKey);
    const evaluation = await evaluateResponse(
      value.trim(),
      {
        grammar,
        minWords: options.minWords,
        requiredTargetUses: options.requiredTargetUses,
        taskPrompt: options.taskPrompt,
      },
      state.settings,
    );
    setLoading("");
    setResults((current) => ({ ...current, [resultKey]: evaluation }));
    record(evaluation, options.mode);
    if (evaluation.online) speak(evaluation.corrected);
    return evaluation;
  };

  const renderResult = (key: string) => {
    const result = results[key];
    if (!result) return null;
    if (Array.isArray(result)) {
      return (
        <div className="mt-3 space-y-3">
          {result.map((evaluation, index) => (
            <div key={`${key}-${index}`}>
              <p className="mb-1 text-sm font-extrabold">
                Sentence {index + 1}
              </p>
              <EvaluationResult evaluation={evaluation} />
            </div>
          ))}
        </div>
      );
    }
    return <EvaluationResult evaluation={result} />;
  };

  let streak = 0;
  for (let index = 0; index < 365; index++) {
    const date = new Date(Date.now() - index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (state.activity[date]) streak++;
    else if (index > 0) break;
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Practical Fluency Path</h1>
          <p>
            One focused unit with three steps: grammar, read aloud, and coach conversation.
          </p>
        </div>
        <Badge variant={progress === 100 ? "success" : "default"}>
          {plan.completed.length}/3 completed
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Unit overview
              </p>
              <CardTitle className="mt-1">Unit 1 · Everyday routines</CardTitle>
              <p className="text-sm text-muted-foreground">
                Build accurate, confident language for real daily decisions.
              </p>
            </div>
            <Button onClick={() => navigate("studio")}>Start Unit 1</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {workflow.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div className="rounded-2xl border bg-muted/20 p-4" key={step.phase}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <Badge variant="default">{step.minutes} min</Badge>
                  </div>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-primary">
                    {step.phase}
                  </p>
                  <h3 className="text-sm font-extrabold">{step.focus}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {step.summary}
                  </p>
                  <StepIcon className="mt-3 size-4 text-primary" />
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border p-3 text-sm">
              <span className="text-xs text-muted-foreground">Your progress</span>
              <p className="font-extrabold">{plan.completed.length} / 3 steps</p>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <span className="text-xs text-muted-foreground">Estimated time</span>
              <p className="font-extrabold">{dailyMinutes} min</p>
            </div>
            <div className="rounded-xl border p-3 text-sm">
              <span className="text-xs text-muted-foreground">Mastery goal</span>
              <p className="font-extrabold">Accurate and natural use</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                Today's grammar focus
              </p>
              <CardTitle className="mt-1">
                {grammar.title} · {grammar.level}
              </CardTitle>
            </div>
            <Button onClick={() => navigate("grammar")} variant="outline">
              Change grammar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3">
            <LearningAccordion
              defaultOpen
              eyebrow="Scaffolding"
              group="daily-training-controls"
              summary={`${dailyMinutes} min selected`}
              title="Daily study time"
              tone="amber"
            >
              <div className="space-y-3" dir={scaffoldDir}>
                <p className="text-xs leading-5 text-muted-foreground">
                  {copy.studySummary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAILY_TIME_OPTIONS.map((minutes) => (
                    <Button
                      aria-pressed={dailyMinutes === minutes}
                      key={minutes}
                      onClick={() =>
                        mutate((draft) => {
                          draft.settings.dailyStudyMinutes = minutes;
                        })
                      }
                      size="sm"
                      type="button"
                      variant={dailyMinutes === minutes ? "default" : "outline"}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>
            </LearningAccordion>

            <LearningAccordion
              eyebrow="Scaffolding"
              group="daily-training-controls"
              summary={
                honovrLanguage === "fa"
                  ? "فارسی"
                  : honovrLanguage === "de"
                    ? "Deutsch"
                    : honovrLanguage === "ar"
                      ? "العربية"
                      : "English"
              }
              title="Explanation language (HONOVR)"
              tone="violet"
            >
              <div className="space-y-3" dir={scaffoldDir}>
                <p className="text-xs leading-5 text-muted-foreground">
                  {copy.languageSummary}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["fa", "فارسی"],
                      ["de", "Deutsch"],
                      ["en", "English"],
                    ] as const
                  ).map(([language, label]) => (
                    <Button
                      aria-pressed={honovrLanguage === language}
                      key={language}
                      onClick={() =>
                        mutate((draft) => {
                          draft.settings.honovrLanguage = language;
                        })
                      }
                      size="sm"
                      type="button"
                      variant={honovrLanguage === language ? "default" : "outline"}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </LearningAccordion>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="field-stack min-w-44">
              <Label htmlFor="daily-cefr-level">CEFR level</Label>
              <Select
                id="daily-cefr-level"
                name="daily-cefr-level"
                onChange={(event) => {
                  const level = event.target.value as CefrLevel;
                  mutate((draft) => {
                    draft.learner.selfDeclaredLevel = level;
                  });
                  const nextGrammar = grammarUnits.find(
                    (unit) => unit.level === level,
                  );
                  if (nextGrammar) {
                    setTodayGrammar(nextGrammar);
                  }
                }}
                value={selectedLevel}
              >
                {LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </div>
            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-xs leading-5">
              <p className="font-bold">CEFR-adaptive timing</p>
              <p>
                Grammar · {timing.grammarMinutes} min | Read aloud · {timing.readAloudMinutes} min | Coach conversation · {timing.coachMinutes} min
              </p>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span>
              Session target: {sessionCompleted}/{sessionTarget}
            </span>
            <strong>
              {sessionCompleted >= sessionTarget
                ? "Session target reached"
                : `${progress}% of full path`}
            </strong>
          </div>
          <Progress
            aria-label={`${sessionCompleted} of ${sessionTarget} selected session steps completed`}
            value={Math.round((sessionCompleted / sessionTarget) * 100)}
          />
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {grammar.rule}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Quick mission</strong>
              <span className="text-muted-foreground">
                Complete 1 speaking turn in Studio
              </span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Recovery mode</strong>
              <span className="text-muted-foreground">
                Finish first {sessionTarget} steps today
              </span>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-sm">
              <strong className="block">Review pressure</strong>
              <span className="text-muted-foreground">
                {due.length} due review{due.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="daily-list">
        {stepInfo.map(([title, description], index) => {
          const done = plan.completed.includes(index);
          const stepMeta = workflow[Math.min(index, workflow.length - 1)]!;
          return (
            <article
              className="daily-step"
              data-done={done}
              data-optional={index >= sessionTarget}
              key={title}
            >
              <header className="daily-step-head">
                <span className="step-number">{index + 1}</span>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{stepMeta.phase}</Badge>
                    <Badge variant="default">
                      {stepMeta.focus} · {stepMeta.minutes} min
                    </Badge>
                  </div>
                  <h2 className="font-extrabold">{title}</h2>
                  <p className="text-xs text-muted-foreground">{description}</p>
                  {index >= sessionTarget ? (
                    <span className="mt-1 inline-block text-xs font-bold text-muted-foreground">
                      Optional in this session
                    </span>
                  ) : null}
                </div>
                {done ? (
                  <CheckCircle2
                    aria-label="Completed"
                    className="size-6 text-emerald-600"
                  />
                ) : (
                  <Button
                    aria-label={`Listen to guidance for ${title}`}
                    onClick={() => speak(description)}
                    size="icon"
                    variant="ghost"
                  >
                    <Volume2 aria-hidden className="size-4" />
                  </Button>
                )}
              </header>
              <div className="daily-step-body">
                {index === 0 ? (
                  <div className="space-y-3">
                    <div className="mb-3 rounded-xl border bg-secondary/70 p-3 text-xs leading-5" dir={scaffoldDir}>
                      <p className="font-bold">Grammar: {grammar.title}</p>
                      <p className="mt-2 font-bold">Main uses:</p>
                      <ul className="list-disc pl-4">
                        {step1Plan.uses.map((use) => (
                          <li key={use}>{use}</li>
                        ))}
                      </ul>
                      <p className="mt-2 font-bold">Practice situations:</p>
                    </div>
                    <div className="space-y-3">
                      {step1Plan.situations.map((item, situationIndex) => {
                        const key = `recall:${situationIndex}`;
                        return (
                          <div
                            className="rounded-xl border bg-white/70 p-3"
                            key={`${item.use}-${situationIndex}`}
                          >
                            <p className="font-bold">{situationIndex + 1}. {item.use}</p>
                            <p className="mt-1 text-sm">Situation: {item.situation}</p>
                            <p className="mt-1 text-sm font-semibold">{item.prompt}</p>
                            <Textarea
                              aria-label={`Sentence for ${item.use}`}
                              autoComplete="off"
                              name={`daily-recall-${situationIndex}`}
                              onChange={(event) =>
                                saveAnswer(key, event.target.value)
                              }
                              placeholder="Write your sentence here."
                              value={answers[key] ?? ""}
                            />
                            <Button
                              className="mt-3"
                              disabled={loading === key}
                              onClick={async () => {
                                const result = await evaluateOne(
                                  key,
                                  answers[key] ?? "",
                                  {
                                    minWords: 1,
                                    requiredTargetUses: 1,
                                    mode: "writing",
                                    taskPrompt: item.prompt,
                                  },
                                );
                                if (result?.pass) {
                                  saveAnswer(`recallPass:${situationIndex}`, "1");
                                  const allPassedNow = step1Plan.situations.every(
                                    (_, indexItem) =>
                                      indexItem === situationIndex
                                        ? true
                                        : answers[`recallPass:${indexItem}`] === "1",
                                  );
                                  if (allPassedNow) {
                                    completeStep(0);
                                  }
                                }
                              }}
                            >
                              <Check aria-hidden className="size-4" />
                              {loading === key ? "Evaluating..." : "Evaluate sentence"}
                            </Button>
                            {messages[key] ? (
                              <p className="mt-2 text-sm">{messages[key]}</p>
                            ) : null}
                            {renderResult(key)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {index === 1 ? (
                  <>
                    <div className="mt-4 rounded-xl border bg-slate-50/80 p-3" dir={scaffoldDir}>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                        Step title: {step2Script.title}
                      </p>
                      <p className="mt-2 text-sm leading-6">
                        Goal: {step2Script.goal}
                      </p>
                      <div className="mt-3 rounded-xl border bg-white p-3 text-sm leading-6">
                        <strong>Correct sentence:</strong> {step2Script.correctSentence}
                      </div>
                      {correctedStep1Items.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          <p className="text-sm font-semibold">Rewrite each corrected sentence:</p>
                          {correctedStep1Items.map((item) => {
                            const rewriteKey = `rewrite:${item.index}`;
                            const matched =
                              normalizeSentence(answers[rewriteKey] ?? "") ===
                              normalizeSentence(item.corrected);
                            return (
                              <div key={`rewrite-${item.index}`} className="rounded-xl border bg-muted/30 p-3">
                                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                                  Use: {item.use}
                                </p>
                                <p className="mt-1 text-sm">
                                  <strong>Corrected sentence:</strong> {item.corrected}
                                </p>
                                <Textarea
                                  aria-label={`Rewrite sentence for ${item.use}`}
                                  className="mt-2"
                                  onChange={(event) =>
                                    saveAnswer(rewriteKey, event.target.value)
                                  }
                                  placeholder="Write the corrected sentence again."
                                  value={answers[rewriteKey] ?? ""}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {matched ? "Matched" : "Not matched yet"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <p className="mt-3 text-sm font-semibold">
                        Repeat mode task: {step2Script.repeatModeTask}
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-muted-foreground">
                        {step2Script.repeatModeInstructions.map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant={readAloudDone ? "success" : "secondary"}>
                          {step2Script.repeatCounterLabel}: {readAloudRepeats}/2
                        </Badge>
                        {readAloudRecorded ? (
                          <Badge variant="success">Recorded once</Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        Record mode task: {step2Script.recordModeTask}
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-xs leading-5 text-muted-foreground">
                        {step2Script.recordModeInstructions.map((instruction) => (
                          <li key={instruction}>{instruction}</li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            const repeats = Math.min(2, readAloudRepeats + 1);
                            saveAnswer("repairRepeats", String(repeats));
                            if (
                              repeats >= 2 &&
                              (correctedStep1Items.length === 0 ||
                                allStep2RewritesDone)
                            ) {
                              completeStep(1);
                            }
                          }}
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw aria-hidden className="size-4" />
                          Mark one read aloud
                        </Button>
                        <Button
                          onClick={() =>
                            readAloudState === "idle"
                              ? void startReadAloudRecording()
                              : void stopReadAloudRecording()
                          }
                          type="button"
                          variant="secondary"
                        >
                          {readAloudState === "idle" ? (
                            <>
                              <Mic aria-hidden className="size-4" />
                              Record once
                            </>
                          ) : (
                            <>
                              <Square aria-hidden className="size-4" />
                              Stop recording
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => speak(correctedSentenceForReadAloud)}
                          type="button"
                          variant="ghost"
                        >
                          <Volume2 aria-hidden className="size-4" />
                          Listen model
                        </Button>
                      </div>
                      {messages.readAloud ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {messages.readAloud}
                        </p>
                      ) : null}
                      {readAloudAudioUrl ? (
                        <audio className="mt-3 w-full" controls src={readAloudAudioUrl}>
                          <track kind="captions" />
                        </audio>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {index === 2 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-xl border bg-secondary/70 p-3 text-xs leading-5" dir={scaffoldDir}>
                      <p className="font-bold">Question: {step3Task.question}</p>
                      <p className="mt-1">Goal: {step3Task.goal}</p>
                      <p className="mt-1">Hint: {step3Task.hint}</p>
                      <p className="mt-2 font-semibold">Suggested vocabulary:</p>
                      <ul className="list-disc pl-4">
                        {step3Task.vocabulary.map((word) => (
                          <li key={word}>{word}</li>
                        ))}
                      </ul>
                      <p className="mt-2 font-semibold">Task:</p>
                      <ol className="list-decimal pl-4">
                        {step3Task.task.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ol>
                    </div>
                    <p className="text-sm">
                      {done
                        ? "A passed answer from the conversation studio is saved for today."
                        : "Open the studio, answer from memory, and pass all five criteria."}
                    </p>
                    <Button onClick={() => navigate("studio")}>
                      <MessageCircleMore aria-hidden className="size-4" />
                      Open conversation studio
                    </Button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Due Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {due.length > 0 ? (
              due.slice(0, 6).map((item) => (
                <div className="rounded-xl border p-3 text-sm" key={item.id}>
                  <div className="flex items-center justify-between gap-2">
                    <strong>{item.topic}</strong>
                    <Badge
                      variant={
                        item.sourceType === "error_item"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {item.mode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Interval: {item.intervalDays}{" "}
                    {item.intervalDays === 1 ? "day" : "days"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No review is due today.
              </p>
            )}
          </CardContent>
        </Card>
        {state.settings.showStreaks ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame aria-hidden className="size-5 text-orange-600" />
                Streak · {streak} {streak === 1 ? "day" : "days"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="heatmap"
                aria-label="Activity overview for the last 70 days"
              >
                {Array.from({ length: 70 }, (_, index) => {
                  const date = new Date(Date.now() - (69 - index) * 86_400_000)
                    .toISOString()
                    .slice(0, 10);
                  const count = state.activity[date] ?? 0;
                  const heatLevel =
                    count >= 5 ? 3 : count >= 2 ? 2 : count ? 1 : 0;
                  return (
                    <span
                      aria-label={`${date}: ${count} completed tasks`}
                      className="heat-cell"
                      data-level={heatLevel}
                      key={date}
                      title={`${date}: ${count}`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Flexible Consistency</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              One missed day does not erase your learning. Return with the
              five-minute rescue session. Mastery depends on retained speaking
              and writing, not on an unbroken streak.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
