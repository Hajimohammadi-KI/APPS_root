"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Flame,
  LockKeyhole,
  Mic2,
  Volume2,
} from "lucide-react";

import {
  grammarUnits,
} from "@grammar/content";
import {
  type EvaluationKind,
  type EvaluationResponse,
} from "@grammar/contracts";
import {
  calculateStreak,
  canCompleteDailyStep,
  getDailyPlan,
  getTodayKey,
} from "@grammar/domain";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TODAY_PATH_LOADED_AT = Date.now();

const dailyTasks = [
  {
    title: "Write a personal sentence from a real situation",
    description:
      "Nutze den Kontext und schreibe genau einen vollständigen Satz mit der Zielgrammatik.",
  },
  {
    title: "Read the Correct Sentence Aloud",
    description:
      "Lies den korrigierten Satz zweimal laut oder nimm dich einmal auf und höre wieder zu.",
  },
  {
    title: "Coach conversation",
    description:
      "Antworte kurz aus dem Alltag und erweitere mit Grund, Detail, Beispiel oder Kontrast.",
  },
] as const;

const learningLevelOptions = [
  { value: "A1", description: "Grundlagen aufbauen" },
  { value: "A2", description: "Alltag sicher meistern" },
  { value: "B1", description: "Selbstständig sprechen" },
  { value: "B2", description: "Komplex argumentieren" },
  { value: "C1", description: "Präzise formulieren" },
  { value: "C2", description: "Stilistisch differenzieren" },
] as const;

type LearningLevel = (typeof learningLevelOptions)[number]["value"];

function getLearningLevel(value: string | null | undefined) {
  return learningLevelOptions.find((option) => option.value === value)?.value;
}

function speak(text: string) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
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

function extractMainUsesFromExplanation(
  usageLines: readonly string[] | undefined,
) {
  if (!usageLines || usageLines.length === 0) {
    return [];
  }
  const items = usageLines
    .map((line) => line.split(":")[0]?.trim() ?? "")
    .map((item) => normalizeUseLabel(item))
    .filter((item) => item.length >= 2);
  return [...new Set(items)];
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
    return ["Prediction", "Spontaneous decision", "Personal plan", "Promise or offer"];
  }
  if (/modal/.test(title)) {
    return ["Ability", "Advice", "Permission", "Possibility", "Obligation"];
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
    return ["Describing people", "Describing things", "Adding defining detail"];
  }
  if (/comparative|superlative|comparison/.test(title)) {
    return ["Comparing two choices", "Describing extremes", "Giving reasons for preference"];
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
  return ["Personal routine", "Study or work context", "Family or social context"];
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
  return fallback[index % fallback.length] ?? fallback[0]!;
}

function buildStep1Practice(
  grammarTitle: string,
  grammarRule: string,
  curatedUses?: readonly string[],
) {
  const uses =
    curatedUses && curatedUses.length >= 2
      ? [...curatedUses]
      : inferMainUses(grammarTitle, grammarRule);
  const situations: Step1Situation[] = uses.map((use, index) => ({
    use,
    situation: buildSituationText(use, index),
    prompt: `Now write one complete sentence in ${grammarTitle} about this situation.`,
  }));
  return { uses, situations };
}

function buildStep3Task(grammarTitle: string) {
  return {
    question:
      "Some people believe strict routines always improve daily productivity. Do you agree for your own life?",
    goal:
      `Use ${grammarTitle} in a short real-life response with one direct answer and one supporting detail.`,
    hint:
      "First answer directly. Then add a reason, detail, example, or contrast.",
    vocabulary: ["daily routine", "stay focused", "in my experience"],
    task: [
      "Answer in 2-4 sentences.",
      "Start with one direct opinion or fact.",
      "Then expand with one reason, example, or contrast.",
    ],
  };
}

function mapMistakeType(
  issue: EvaluationResponse["issues"][number] | undefined,
): "tense" | "verb form" | "singular/plural" | "word order" | "preposition" | "meaning/use" {
  if (!issue) return "meaning/use";
  if (issue.errorClass === "tense") return "tense";
  if (issue.errorClass === "agreement") return "singular/plural";
  if (issue.errorClass === "word_order") return "word order";
  if (issue.errorClass === "auxiliary" || issue.errorClass === "ending") {
    return "verb form";
  }
  if (issue.errorClass === "other" && /preposition|at\s|in\s|on\s|to\s/i.test(issue.message)) {
    return "preposition";
  }
  return "meaning/use";
}

function buildPartB(report: EvaluationResponse) {
  const critical = report.issues.filter((item) => item.severity === "critical").length;
  const major = report.issues.filter((item) => item.severity === "major").length;
  const minor = report.issues.filter((item) => item.severity === "minor").length;
  const pronunciationScore = Math.max(0, Math.min(100, 88 - critical * 18 - major * 8 - minor * 3));
  const wordChoiceScore = Math.max(0, Math.min(100, 84 - critical * 14 - major * 7 - minor * 2));
  const grammarScore = Math.max(0, Math.min(100, report.accuracyScore));

  return {
    pronunciation_score: pronunciationScore,
    pronunciation_feedback:
      pronunciationScore >= 90
        ? "Speech is clear and easy to understand. Stress and rhythm are natural in most parts. Keep this consistency in longer answers."
        : pronunciationScore >= 70
          ? "Speech is mostly understandable. A few words need clearer endings and steadier stress. Read the corrected sentence aloud once more before the next answer."
          : pronunciationScore >= 50
            ? "Some parts are clear, but overall intelligibility is limited. Stress and rhythm need more control. Slow down and focus on key words."
            : "Many words are hard to understand right now. Focus on short sentences and clear word stress. Repeat the corrected sentence before continuing.",
    word_choice_score: wordChoiceScore,
    word_choice_feedback:
      wordChoiceScore >= 90
        ? "Word choice matches the topic well and sounds natural. Vocabulary is precise for everyday communication. Keep adding one strong collocation in each answer."
        : wordChoiceScore >= 70
          ? "Word choice is mostly appropriate for the task. Some phrases can be more natural in context. Add one specific expression to strengthen your answer."
          : wordChoiceScore >= 50
            ? "Basic vocabulary is present, but several choices are limited or awkward. Use simpler and more common combinations first. Then add one detail word."
            : "Word choice is weak for this topic and some phrases do not fit the context. Build a short topic vocabulary list and reuse it in full sentences.",
    grammar_score: grammarScore,
    grammar_feedback:
      grammarScore >= 90
        ? "Grammar control is strong. Verb forms and sentence structure are accurate in this response. Keep this level while adding more details."
        : grammarScore >= 70
          ? "Grammar is generally good with a few recurring issues. Check one core structure before submitting the next answer. You are close to stable accuracy."
          : grammarScore >= 50
            ? "Grammar is basic and still inconsistent in key points. A few mistakes affect clarity and precision. Practice one target pattern with 2-3 short sentences."
            : "Grammar errors are frequent and reduce clarity. Focus on one pattern at a time and produce short accurate sentences. Accuracy first, then complexity.",
    overall_comment:
      "You stayed on task and communicated a clear idea. Keep the direct first sentence, then expand with one concrete reason or example. Prioritize one grammar fix and one vocabulary improvement in the next attempt.",
    next_step:
      "Give one more 2-4 sentence answer on the same topic. Start directly, then add one reason using the target grammar.",
  };
}

export function TodayPath() {
  const { state, hydrated, setTodayGrammar, updateLearnerProfile } =
    useLearnerState();
  const [isChoosingLevel, setIsChoosingLevel] = useState(false);
  const selectedLevel = getLearningLevel(state.learningLevel);
  const plan = getDailyPlan(state);

  function selectLevel(level: LearningLevel) {
    if (
      selectedLevel &&
      selectedLevel !== level &&
      plan.completed.length > 0 &&
      !window.confirm(
        "Beim Wechsel des Niveaus wird dein heutiger Fortschritt zurückgesetzt. Möchtest du fortfahren?",
      )
    ) {
      return;
    }

    const firstUnit = grammarUnits.find((unit) => unit.level === level);
    if (!firstUnit) {
      return;
    }

    setTodayGrammar(firstUnit.title, firstUnit.level);
    updateLearnerProfile({
      selfDeclaredLevel: level,
      verifiedLevel:
        state.learner.selfDeclaredLevel === level
          ? state.learner.verifiedLevel
          : null,
      placementMode: "manual",
      placementCheckedAt: null,
    });
    setIsChoosingLevel(false);
  }

  if (!hydrated) {
    return (
      <Card aria-live="polite">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Lernpfad wird geladen…
        </CardContent>
      </Card>
    );
  }

  if (!selectedLevel || isChoosingLevel) {
    return (
      <LearningLevelSelector
        selectedLevel={selectedLevel ?? null}
        onSelect={selectLevel}
        {...(selectedLevel
          ? { onCancel: () => setIsChoosingLevel(false) }
          : {})}
      />
    );
  }

  return (
    <ActiveTodayPath
      learningLevel={selectedLevel}
      onChangeLevel={() => setIsChoosingLevel(true)}
    />
  );
}

function LearningLevelSelector({
  selectedLevel,
  onSelect,
  onCancel,
}: Readonly<{
  selectedLevel: LearningLevel | null;
  onSelect: (level: LearningLevel) => void;
  onCancel?: () => void;
}>) {
  return (
    <Card className="overflow-hidden border-sky-900/10 shadow-lg">
      <CardHeader className="bg-gradient-to-br from-sky-950 to-slate-900 text-white">
        <Badge className="w-fit bg-sky-400/20 text-sky-50">Dein Einstieg</Badge>
        <CardTitle className="mt-2 text-2xl text-white">
          <h1 className="text-balance">
            Mit welchem Niveau möchtest du starten?
          </h1>
        </CardTitle>
        <CardDescription className="max-w-2xl text-pretty text-sky-50/75">
          Wähle dein aktuelles Deutschniveau. Der Tagespfad startet mit der
          ersten passenden Grammatikeinheit. Diese Selbsteinschätzung ist kein
          Kompetenznachweis; die freiwillige Einstufung findest du zusätzlich in
          den Einstellungen.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-6">
        <fieldset>
          <legend className="sr-only">Startniveau auswählen</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learningLevelOptions.map((option) => {
              const active = selectedLevel === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(option.value)}
                  className={`min-h-24 touch-manipulation rounded-2xl border p-4 text-left transition-colors focus-visible:ring-3 focus-visible:ring-sky-500/40 focus-visible:outline-none ${
                    active
                      ? "border-sky-600 bg-sky-50 text-sky-950 shadow-sm"
                      : "bg-background hover:border-sky-400 hover:bg-sky-50/50"
                  }`}
                >
                  <span className="block text-xl font-bold">
                    {option.value}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        {onCancel && (
          <div className="mt-5 flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              Zurück zum Tagespfad
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveTodayPath({
  learningLevel,
  onChangeLevel,
}: Readonly<{
  learningLevel: LearningLevel;
  onChangeLevel: () => void;
}>) {
  const {
    state,
    setTodayGrammar,
    setDailyAnswer,
    completeDailyStep,
    addError,
    completeReview,
    recordAttempt,
  } = useLearnerState();
  const plan = getDailyPlan(state);
  const [reports, setReports] = useState<
    Readonly<Record<string, EvaluationResponse>>
  >({});
  const [messages, setMessages] = useState<Readonly<Record<string, string>>>(
    {},
  );
  const [loading, setLoading] = useState<string | null>(null);

  const todayGrammar = useMemo(() => {
    const stored =
      state.todayGrammar?.date === getTodayKey()
        ? grammarUnits.find((unit) => unit.title === state.todayGrammar?.title)
        : undefined;
    if (stored?.level === learningLevel) {
      return stored;
    }

    const firstUnit = grammarUnits.find((unit) => unit.level === learningLevel);
    if (!firstUnit) {
      throw new Error(`Für das Niveau ${learningLevel} fehlt eine Einheit.`);
    }
    return firstUnit;
  }, [learningLevel, state.todayGrammar]);

  useEffect(() => {
    if (
      state.todayGrammar?.date !== getTodayKey() ||
      state.todayGrammar.title !== todayGrammar.title
    ) {
      setTodayGrammar(todayGrammar.title, todayGrammar.level);
    }
  }, [
    setTodayGrammar,
    state.todayGrammar,
    todayGrammar.level,
    todayGrammar.title,
  ]);

  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= TODAY_PATH_LOADED_AT,
  );
  const [sessionTarget, setSessionTarget] = useState<1 | 2 | 3>(() => {
    const latest = Object.entries(state.activity)
      .filter(([, count]) => count > 0)
      .map(([date]) => date)
      .sort()
      .at(-1);
    if (!latest) return 2;
    const daysAway = Math.floor(
      (new Date(`${getTodayKey()}T12:00:00`).valueOf() -
        new Date(`${latest}T12:00:00`).valueOf()) /
        86_400_000,
    );
    return daysAway >= 2 ? 2 : 3;
  });
  const exercise = todayGrammar.exercises[0] ?? ["", ""];
  const explanationUses = useMemo(
    () =>
      extractMainUsesFromExplanation(
        (
          todayGrammar as {
            explanation?: { usage?: readonly string[] };
          }
        ).explanation?.usage,
      ),
    [todayGrammar],
  );
  const step1Plan = useMemo(
    () => buildStep1Practice(todayGrammar.title, todayGrammar.rule, explanationUses),
    [explanationUses, todayGrammar.rule, todayGrammar.title],
  );
  const step3Task = useMemo(
    () => buildStep3Task(todayGrammar.title),
    [todayGrammar.title],
  );
  const correctedStep1Items = useMemo(
    () =>
      step1Plan.situations
        .map((item, index) => {
          const key = `recall:${index}`;
          const report = reports[key];
          if (!report || !report.corrected.trim()) return null;
          return { index, use: item.use, corrected: report.corrected.trim() };
        })
        .filter(
          (item): item is { index: number; use: string; corrected: string } =>
            Boolean(item),
        ),
    [reports, step1Plan.situations],
  );
  const allStep2RewritesDone = useMemo(
    () =>
      correctedStep1Items.length > 0 &&
      correctedStep1Items.every((item) => {
        const rewrite = plan.answers[`rewrite:${item.index}`] ?? "";
        return normalizeSentence(rewrite) === normalizeSentence(item.corrected);
      }),
    [correctedStep1Items, plan.answers],
  );
  const recallCorrected =
    correctedStep1Items[0]?.corrected ?? reports.recall?.corrected ?? exercise[1] ?? "";
  const readAloudRepeats = Number(plan.answers.readAloudRepeats ?? 0);
  const readAloudRecorded = plan.answers.readAloudRecorded === "1";
  const readAloudDone = readAloudRepeats >= 2 || readAloudRecorded;
  const completed = plan.completed.length;
  const percentage = Math.round((completed / dailyTasks.length) * 100);
  const sessionCompleted = plan.completed.filter(
    (step) => step < sessionTarget,
  ).length;
  const streak = calculateStreak(state.activity);

  async function evaluate(
    key: string,
    text: string,
    kind: EvaluationKind,
  ): Promise<EvaluationResponse | null> {
    setMessages((current) => ({ ...current, [key]: "" }));
    setLoading(key);
    try {
      const report = await requestEvaluation({
        allowOnlineFeedback: state.learner.allowOnlineAI,
        apiBaseUrl: API_BASE_URL,
        text,
        grammar: {
          title: todayGrammar.title,
          rule: todayGrammar.rule,
          examples: todayGrammar.examples,
        },
        kind,
        taskPrompt:
          key.startsWith("recall:")
            ? (step1Plan.situations[Number(key.split(":")[1] ?? "0")]?.prompt ??
              `Now write one complete sentence in ${todayGrammar.title} about this situation.`)
            : "Answer in 2-4 real-life sentences with one direct statement and one supporting detail.",
        spellingAffectsMastery: state.settings.spellingAffectsMastery,
      });
      setReports((current) => ({ ...current, [key]: report }));
      speak(report.corrected);
      const issue = report.issues[0];
      if (issue) {
        addError({
          topic: todayGrammar.title,
          original: report.original,
          corrected: report.corrected,
          errorClass: issue.errorClass,
          explanation: issue.message,
          critical: issue.severity === "critical",
        });
      }
      return report;
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [key]:
          error instanceof Error
            ? error.message
            : "Die Auswertung ist momentan nicht erreichbar.",
      }));
      return null;
    } finally {
      setLoading(null);
    }
  }

  async function checkRecallAt(index: number) {
    const key = `recall:${index}`;
    const text = plan.answers[key]?.trim() ?? "";
    const report = await evaluate(key, text, "sentences");
    if (report) {
      recordAttempt({
        topic: todayGrammar.title,
        mode: "recognition",
        inputText: text,
        correctedText: report.corrected,
        targetHit: report.practiceReady && report.targetHit,
        verified: report.verified,
        accuracyScore: report.accuracyScore,
      });
    }
    if (report?.practiceReady) {
      setDailyAnswer(`recallPass:${index}`, "1");
      const allPassed = step1Plan.situations.every(
        (_, itemIndex) =>
          itemIndex === index ||
          plan.answers[`recallPass:${itemIndex}`] === "1",
      );
      if (allPassed) {
        completeDailyStep(0);
      }
    }
  }

  function markReadAloudRepeat() {
    const repeats = Math.min(2, readAloudRepeats + 1);
    setDailyAnswer("readAloudRepeats", String(repeats));
    if (
      (repeats >= 2 || readAloudRecorded) &&
      (correctedStep1Items.length === 0 || allStep2RewritesDone)
    ) {
      completeDailyStep(1);
    }
  }

  function markReadAloudRecorded() {
    setDailyAnswer("readAloudRecorded", "1");
    if (correctedStep1Items.length === 0 || allStep2RewritesDone) {
      completeDailyStep(1);
    }
  }

  useEffect(() => {
    const allPassed =
      step1Plan.situations.length > 0 &&
      step1Plan.situations.every(
        (_, index) => plan.answers[`recallPass:${index}`] === "1",
      );
    if (allPassed && !plan.completed.includes(0)) {
      completeDailyStep(0);
    }
  }, [completeDailyStep, plan.answers, plan.completed, step1Plan.situations]);

  useEffect(() => {
    if (
      !plan.completed.includes(1) &&
      readAloudDone &&
      (correctedStep1Items.length === 0 || allStep2RewritesDone)
    ) {
      completeDailyStep(1);
    }
  }, [
    allStep2RewritesDone,
    completeDailyStep,
    correctedStep1Items.length,
    plan.completed,
    readAloudDone,
  ]);

  return (
    <div className="space-y-6">
      <Card className="border-sky-900/10 bg-gradient-to-br from-sky-950 to-slate-900 text-white shadow-lg">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white">
                {todayGrammar.level}
              </Badge>
              <Badge className="bg-sky-400/20 text-sky-50">
                Heutiger Grammatikfokus
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={onChangeLevel}
            >
              Niveau ändern
            </Button>
          </div>
          <CardTitle className="mt-2 text-2xl text-white">
            <h1>{todayGrammar.title}</h1>
          </CardTitle>
          <CardDescription className="max-w-3xl text-sky-50/75">
            Jeder Schritt enthält eine konkrete Aufgabe und zählt erst nach
            erfolgreicher Bearbeitung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>{completed} / 3 Schritte</span>
            <span>{percentage} %</span>
          </div>
          <Progress
            value={percentage}
            className="bg-white/20"
            aria-label={`Tagesfortschritt: ${percentage} Prozent`}
          />
          <fieldset className="mt-5 border-t border-white/15 pt-4">
            <legend className="text-sm font-extrabold">
              Realistische Einheit wählen
            </legend>
            <p className="mt-1 text-xs leading-5 text-sky-50/75">
              Eine kurze Einheit zählt als guter Wiedereinstieg. Die übrigen
              Kompetenznachweise werden dabei nicht fälschlich abgeschlossen.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  [1, "5 Min. · Rettung"],
                  [2, "10 Min. · Sanft"],
                  [3, "15 Min. · Vollständig"],
                ] as const
              ).map(([target, label]) => (
                <Button
                  aria-pressed={sessionTarget === target}
                  className={
                    sessionTarget === target
                      ? "bg-white text-sky-950 hover:bg-sky-50"
                      : "border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  }
                  key={target}
                  onClick={() => setSessionTarget(target)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs font-bold" role="status">
              Sitzungsziel: {sessionCompleted}/{sessionTarget}
              {sessionCompleted >= sessionTarget
                ? " · Ziel erreicht"
                : " Schritte"}
            </p>
          </fieldset>
        </CardContent>
      </Card>

      <section aria-label="Schnellfokus heute" className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-900">
          Schnellfokus heute
        </h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 1</strong>
            <span className="text-muted-foreground">
              Eine vollständige Studio-Antwort sprechen und auswerten.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 2</strong>
            <span className="text-muted-foreground">
              Fällige Wiederholung zuerst abschließen.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 3</strong>
            <span className="text-muted-foreground">
              Mindestens {sessionTarget} Schritt{sessionTarget === 1 ? "" : "e"}{" "}
              heute erledigen.
            </span>
          </article>
        </div>
      </section>

      <details className="rounded-xl border bg-card shadow-sm">
        <summary className="cursor-pointer px-4 py-3 font-semibold text-blue-900">
          Regel, Beispiele und passende Online-Lektionen
        </summary>
        <div className="space-y-4 border-t p-4">
          <p className="text-sm leading-6">{todayGrammar.rule}</p>
          <ul className="grid gap-1 text-sm text-muted-foreground">
            {todayGrammar.examples.map((example) => (
              <li key={example}>• {example}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {todayGrammar.links.map((link) => (
              <a
                key={`${link[0]}-${link[1]}`}
                href={link[1]}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
              >
                {link[3] === "exercise" ? "Übung" : "Erklärung"} · {link[0]} ↗
              </a>
            ))}
          </div>
        </div>
      </details>

      <ol className="grid gap-4">
        {dailyTasks.map((task, index) => {
          const done = plan.completed.includes(index);
          const unlocked = canCompleteDailyStep(plan.completed, index);
          return (
            <li key={task.title}>
              <Card
                className={
                  done
                    ? "border-sky-500/40 bg-sky-50/50"
                    : unlocked
                      ? "ring-2 ring-primary/20"
                      : "opacity-75"
                }
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full font-semibold ${
                        done
                          ? "bg-sky-600 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{task.title}</CardTitle>
                        {unlocked && !done && <Badge>Als Nächstes</Badge>}
                        {!unlocked && (
                          <Badge variant="outline">
                            <LockKeyhole data-icon="inline-start" />
                            Gesperrt
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {task.description}
                      </CardDescription>
                      {index >= sessionTarget ? (
                        <p className="mt-1 text-xs font-bold text-muted-foreground">
                          In dieser Einheit freiwillig
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DailyTaskBody
                    index={index}
                    answers={plan.answers}
                    done={done}
                    unlocked={unlocked}
                    loading={loading}
                    reports={reports}
                    messages={messages}
                    onAnswer={setDailyAnswer}
                    onRecallAt={checkRecallAt}
                    onMarkReadAloudRepeat={markReadAloudRepeat}
                    onMarkReadAloudRecorded={markReadAloudRecorded}
                    readAloudRepeats={readAloudRepeats}
                    readAloudRecorded={readAloudRecorded}
                    readAloudDone={readAloudDone}
                    correctedSentence={recallCorrected}
                    situations={step1Plan.situations}
                    correctedStep1Items={correctedStep1Items}
                    allStep2RewritesDone={allStep2RewritesDone}
                    step3Task={step3Task}
                  />
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        {state.settings.showStreaks ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="size-5 text-amber-600" />
                Lernserie: {streak} Tage
              </CardTitle>
              <CardDescription>
                Die letzten 70 Tage; dunklere Felder bedeuten mehr erledigte
                Schritte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="grid grid-cols-14 gap-1"
                aria-label="Lernaktivität"
              >
                {Array.from({ length: 70 }, (_, index) => {
                  const date = new Date(
                    TODAY_PATH_LOADED_AT - (69 - index) * 86_400_000,
                  )
                    .toISOString()
                    .slice(0, 10);
                  const amount = state.activity[date] ?? 0;
                  return (
                    <span
                      key={date}
                      title={`${date}: ${amount} Schritte`}
                      className={`aspect-square rounded-sm ${
                        amount >= 5
                          ? "bg-sky-700"
                          : amount >= 2
                            ? "bg-sky-400"
                            : amount
                              ? "bg-sky-200"
                              : "bg-muted"
                      }`}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Flexible Kontinuität</CardTitle>
              <CardDescription>
                Ein verpasster Tag löscht keinen Lernerfolg. Starte mit der
                Fünf-Minuten-Einheit; Kompetenz zählt, nicht eine ungebrochene
                Serie.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Fällige Wiederholungen</CardTitle>
            <CardDescription>
              {dueReviews.length
                ? `${dueReviews.length} Korrektur${dueReviews.length === 1 ? "" : "en"} wartet auf Abruf.`
                : "Heute ist keine gespeicherte Korrektur fällig."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {dueReviews.slice(0, 3).map((review) => (
              <div key={review.id} className="rounded-xl border p-3">
                <strong className="text-sm">{review.topic}</strong>
                <p className="mt-1 text-sm text-muted-foreground">
                  {review.original} → {review.corrected}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DailyTaskBody({
  index,
  answers,
  done,
  unlocked,
  loading,
  reports,
  messages,
  onAnswer,
  onRecallAt,
  onMarkReadAloudRepeat,
  onMarkReadAloudRecorded,
  readAloudRepeats,
  readAloudRecorded,
  readAloudDone,
  correctedSentence,
  situations,
  correctedStep1Items,
  allStep2RewritesDone,
  step3Task,
}: Readonly<{
  index: number;
  answers: Readonly<Record<string, string>>;
  done: boolean;
  unlocked: boolean;
  loading: string | null;
  reports: Readonly<Record<string, EvaluationResponse>>;
  messages: Readonly<Record<string, string>>;
  onAnswer: (key: string, value: string) => void;
  onRecallAt: (index: number) => void;
  onMarkReadAloudRepeat: () => void;
  onMarkReadAloudRecorded: () => void;
  readAloudRepeats: number;
  readAloudRecorded: boolean;
  readAloudDone: boolean;
  correctedSentence: string;
  situations: Step1Situation[];
  correctedStep1Items: Array<{ index: number; use: string; corrected: string }>;
  allStep2RewritesDone: boolean;
  step3Task: {
    question: string;
    goal: string;
    hint: string;
    vocabulary: string[];
    task: string[];
  };
}>) {
  if (index === 0) {
    return (
      <div className="space-y-3">
        <div className="space-y-2 rounded-xl border bg-muted/40 p-3 text-sm">
          <p className="font-semibold">Practice situations:</p>
        </div>
        {situations.map((item, situationIndex) => {
          const key = `recall:${situationIndex}`;
          const report = reports[key];
          const message = messages[key];
          return (
            <div key={`${item.use}-${situationIndex}`} className="rounded-xl border bg-background/70 p-3">
              <p className="text-sm font-semibold">{situationIndex + 1}. {item.use}</p>
              <p className="mt-1 text-xs">Situation: {item.situation}</p>
              <p className="mt-1 text-xs font-semibold">{item.prompt}</p>
              <Textarea
                aria-label={`Sentence for ${item.use}`}
                className="mt-2"
                placeholder="Write one complete sentence for this situation."
                value={answers[key] ?? ""}
                onChange={(event) => onAnswer(key, event.target.value)}
              />
              <Button
                className="mt-2"
                type="button"
                disabled={!unlocked || done || loading === key}
                onClick={() => onRecallAt(situationIndex)}
              >
                <Check data-icon="inline-start" />
                {loading === key ? "Evaluating..." : "Evaluate sentence"}
              </Button>
              {message ? (
                <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                  {message}
                </p>
              ) : null}
              {report ? <EvaluationResult report={report} /> : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">
          Step title: Read the Correct Sentence Aloud
        </p>
        <p className="text-sm leading-6">
          Goal: Help the learner fix the correct sentence in speaking and listening memory before moving to conversation practice.
        </p>
        <div className="rounded-xl border bg-white p-3 text-sm leading-6">
          <strong>Correct sentence:</strong> {correctedSentence}
        </div>
        {correctedStep1Items.length > 0 ? (
          <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Rewrite each corrected sentence:</p>
            {correctedStep1Items.map((item) => {
              const rewriteKey = `rewrite:${item.index}`;
              const matched =
                normalizeSentence(answers[rewriteKey] ?? "") ===
                normalizeSentence(item.corrected);
              return (
                <div key={`rewrite-${item.index}`} className="rounded-xl border bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Use: {item.use}
                  </p>
                  <p className="mt-1 text-sm"><strong>Corrected sentence:</strong> {item.corrected}</p>
                  <Textarea
                    aria-label={`Rewrite sentence for ${item.use}`}
                    className="mt-2"
                    placeholder="Write the corrected sentence again."
                    value={answers[rewriteKey] ?? ""}
                    onChange={(event) => onAnswer(rewriteKey, event.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {matched ? "Matched" : "Not matched yet"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}
        <p className="text-sm font-semibold">Repeat mode task: Read the corrected sentence aloud twice.</p>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>Read the sentence once at a natural speed.</li>
          <li>Read it one more time with clear stress and ending sounds.</li>
        </ul>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={readAloudDone ? "default" : "outline"}>
            Repeat counter label: Repeat aloud {readAloudRepeats}/2
          </Badge>
          {readAloudRecorded ? <Badge>Recorded once</Badge> : null}
          {correctedStep1Items.length > 0 ? (
            <Badge variant={allStep2RewritesDone ? "default" : "outline"}>
              Rewrite check: {allStep2RewritesDone ? "Complete" : "Pending"}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm font-semibold">Record mode task: Record yourself reading it once and listen again.</p>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>Record one clear reading of the corrected sentence.</li>
          <li>Listen to your recording once and compare it with the model.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!unlocked || done} onClick={onMarkReadAloudRepeat}>
            <Check data-icon="inline-start" />
            Mark one repeat
          </Button>
          <Button type="button" variant="outline" disabled={!unlocked || done} onClick={onMarkReadAloudRecorded}>
            <Mic2 data-icon="inline-start" />
            Mark recording done
          </Button>
          <Button type="button" variant="ghost" onClick={() => speak(correctedSentence)}>
            <Volume2 data-icon="inline-start" />
            Listen model
          </Button>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-blue-50/70 p-3 text-sm leading-6">
          <p><strong>Question:</strong> {step3Task.question}</p>
          <p className="mt-2"><strong>Goal:</strong> {step3Task.goal}</p>
          <p className="mt-2"><strong>Hint:</strong> {step3Task.hint}</p>
          <p className="mt-2"><strong>Suggested vocabulary:</strong></p>
          <ul className="list-disc pl-5">
            {step3Task.vocabulary.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
          <p className="mt-2"><strong>Task:</strong></p>
          <ol className="list-decimal pl-5">
            {step3Task.task.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>
        <Button
          nativeButton={false}
          disabled={!unlocked || done}
          render={<Link href="/studio" />}
        >
          <Mic2 data-icon="inline-start" />
          Gesprächsstudio öffnen
          <ChevronRight data-icon="inline-end" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Der Schritt wird automatisch abgeschlossen, sobald du im Studio eine
          eigene Antwort erfolgreich ausgewertet hast.
        </p>
      </div>
    );
  }

  return null;
}

function EvaluationResult({
  report,
}: Readonly<{ report: EvaluationResponse }>) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        report.practiceReady
          ? "border-sky-300 bg-sky-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong>
          {report.ok
            ? "Online geprüft und bestanden"
            : report.practiceReady
              ? "Offline-Übung bereit"
              : "Noch einmal prüfen"}
        </strong>
        <Badge variant="outline">
          {report.online ? "Online-Prüfung" : "Offline-Übung"}
        </Badge>
      </div>
      {report.changed && (
        <p className="mt-2">
          <span className="text-muted-foreground">Korrigiert: </span>
          <strong>{report.corrected}</strong>
        </p>
      )}
      {report.issues.length > 0 && (
        <ul className="mt-2 grid gap-1">
          {report.issues.map((issue, index) => (
            <li key={`${issue.type}-${index}`}>
              <strong>{issue.type}:</strong> {issue.message}
              {issue.suggestion ? ` Vorschlag: ${issue.suggestion}` : ""}
            </li>
          ))}
        </ul>
      )}
      {report.issues.length > 0 ? (
        <div className="mt-2 rounded-xl border bg-white/80 p-3 text-sm leading-6">
          <p className="font-semibold">Correction review:</p>
          <p><strong>Learner sentence:</strong> {report.original}</p>
          <p><strong>Corrected sentence:</strong> {report.corrected}</p>
          <p><strong>Mistake type:</strong> {mapMistakeType(report.issues[0])}</p>
          <p>
            <strong>Explanation:</strong> The mistake is in the reported issue context. This is a {mapMistakeType(report.issues[0])} issue. {report.issues[0]?.message ?? "Use the corrected pattern for this meaning."}
          </p>
        </div>
      ) : null}
      <div className="mt-2 rounded-xl border bg-slate-900 p-3 text-xs text-slate-100">
        <p className="mb-2 font-semibold">STEP 3 PART B output (JSON):</p>
        <pre className="overflow-x-auto">{JSON.stringify(buildPartB(report), null, 2)}</pre>
      </div>
      {!report.online && (
        <p className="mt-2 text-xs text-muted-foreground">
          Die lokale Prüfung blockiert die Übung nicht. Sie verändert aber weder
          Grammatikbeherrschung noch CEFR-Nachweise, bis eine Online-Prüfung
          verfügbar ist.
        </p>
      )}
    </div>
  );
}

