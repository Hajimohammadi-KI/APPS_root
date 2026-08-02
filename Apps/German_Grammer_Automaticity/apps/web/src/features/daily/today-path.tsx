"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Flame,
  LoaderCircle,
  LockKeyhole,
  Mic2,
  Volume2,
} from "lucide-react";

import {
  grammarUnits,
  speakingTopics,
  type GrammarUnit,
} from "@grammar/content";
import {
  type EvaluationKind,
  type EvaluationResponse,
} from "@grammar/contracts";
import {
  calculateStreak,
  canCompleteDailyStep,
  countWords,
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TODAY_PATH_LOADED_AT = Date.now();

const dailyTasks = [
  {
    title: "Regel aktiv abrufen",
    description:
      "Erkläre ohne nachzuschlagen, wann und wie diese Grammatik verwendet wird.",
  },
  {
    title: "Drei Sätze produzieren",
    description:
      "Bilde drei eigene vollständige Sätze mit der heutigen Zielgrammatik.",
  },
  {
    title: "Coach-Gespräch",
    description:
      "Führe im Gesprächsstudio mindestens eine ausgewertete Antwort mit der Zielgrammatik durch.",
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
  const [sessionTarget, setSessionTarget] = useState<1 | 2 | 3 | 5>(() => {
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
  const latestError = state.errors.at(-1);
  const repairOriginal = latestError?.original ?? "Ich habe gegangen.";
  const repairCorrected = latestError?.corrected ?? "Ich bin gegangen.";
  const exercise = todayGrammar.exercises[0] ?? ["", ""];
  const reviewExpected = dueReviews[0]?.corrected ?? exercise[1] ?? "";
  const reviewPrompt =
    dueReviews[0]?.original ?? exercise[0] ?? todayGrammar.rule;
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
          key === "recall"
            ? `Erkläre die Regel „${todayGrammar.title}“ aus dem Gedächtnis.`
            : key === "sentences"
              ? "Schreibe drei unterschiedliche eigene Sätze."
              : key === "why"
                ? "Erkläre die genaue Korrektur und ihren grammatischen Grund."
                : key === "transfer"
                  ? "Erkläre den nützlichen Punkt in eigenen Worten für eine andere Person."
                  : "Rufe die richtige Form ohne Nachsehen ab.",
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

  async function checkRecall() {
    const text = plan.answers.recall?.trim() ?? "";
    if (countWords(text) < 8) {
      setMessages((current) => ({
        ...current,
        recall: "Nenne die Regel ausführlicher (mindestens 8 Wörter).",
      }));
      return;
    }
    const report = await evaluate("recall", text, "recall");
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
      completeDailyStep(0);
    }
  }

  async function checkSentences() {
    const sentences = ["s1", "s2", "s3"].map(
      (key) => plan.answers[key]?.trim() ?? "",
    );
    if (sentences.some((sentence) => countWords(sentence) < 3)) {
      setMessages((current) => ({
        ...current,
        sentences:
          "Bitte schreibe drei vollständige und unterschiedliche Sätze.",
      }));
      return;
    }
    const text = sentences
      .map((sentence) => (/[.!?]$/.test(sentence) ? sentence : `${sentence}.`))
      .join(" ");
    const report = await evaluate("sentences", text, "sentences");
    if (report) {
      recordAttempt({
        topic: todayGrammar.title,
        mode: "writing",
        inputText: text,
        correctedText: report.corrected,
        targetHit: report.practiceReady && report.targetHit,
        verified: report.verified,
        accuracyScore: report.accuracyScore,
      });
    }
    if (report?.practiceReady) {
      completeDailyStep(1);
    }
  }

  async function checkWhy() {
    const text = plan.answers.why?.trim() ?? "";
    if (countWords(text) < 5) {
      setMessages((current) => ({
        ...current,
        why: "Bitte schreibe etwas ausführlicher (mindestens 5 Wörter).",
      }));
      return;
    }
    const report = await evaluate("why", text, "why");
    if (report) {
      recordAttempt({
        topic: todayGrammar.title,
        mode: "repair",
        inputText: text,
        correctedText: report.corrected,
        targetHit: report.practiceReady,
        verified: report.verified,
        accuracyScore: report.accuracyScore,
      });
    }
    if (report?.practiceReady) {
      completeDailyStep(3);
    }
  }

  async function checkTransfer() {
    const text = plan.answers.transfer?.trim() ?? "";
    if (countWords(text) < 8) {
      setMessages((current) => ({
        ...current,
        transfer: "Bitte schreibe etwas ausführlicher (mindestens 8 Wörter).",
      }));
      return;
    }
    const report = await evaluate("transfer", text, "free");
    if (report) {
      recordAttempt({
        topic: todayGrammar.title,
        mode: "transfer",
        inputText: text,
        correctedText: report.corrected,
        targetHit: report.practiceReady && report.targetHit,
        verified: report.verified,
        accuracyScore: report.accuracyScore,
      });
    }
    if (report?.practiceReady) {
      completeDailyStep(5);
    }
  }

  async function checkReview() {
    const text = plan.answers.review?.trim() ?? "";
    if (!text) {
      setMessages((current) => ({
        ...current,
        review: "Gib zuerst deine eigene Antwort ein.",
      }));
      return;
    }
    const report = await evaluate("review", text, "review");
    if (!report) {
      return;
    }
    if (
      reviewExpected &&
      text.toLocaleLowerCase("de").trim() !==
        reviewExpected.toLocaleLowerCase("de").trim()
    ) {
      if (dueReviews[0]) {
        completeReview(dueReviews[0].id, false);
      }
      recordAttempt({
        topic: todayGrammar.title,
        mode:
          dueReviews[0]?.sourceType === "error_item" ? "repair" : "recognition",
        inputText: text,
        correctedText: reviewExpected,
        targetHit: false,
        verified: true,
        accuracyScore: 40,
      });
      setMessages((current) => ({
        ...current,
        review: `Noch nicht vollständig richtig. Erwartete Fassung: ${reviewExpected}`,
      }));
      return;
    }
    recordAttempt({
      topic: todayGrammar.title,
      mode:
        dueReviews[0]?.sourceType === "error_item" ? "repair" : "recognition",
      inputText: text,
      correctedText: reviewExpected,
      targetHit: true,
      verified: true,
      accuracyScore: 100,
    });
    if (report.practiceReady || !report.changed) {
      if (dueReviews[0]) {
        completeReview(dueReviews[0].id, true);
      }
      completeDailyStep(6);
    } else if (dueReviews[0]) {
      completeReview(dueReviews[0].id, false);
    }
  }

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
            {state.settings.movementBreaks && sessionTarget >= 5 ? (
              <p className="mt-2 text-xs leading-5 text-sky-50/80">
                Nach Schritt 3: zwei Minuten aufstehen, bewegen und Wasser
                trinken. Die Pause zählt zum Lernplan.
              </p>
            ) : null}
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                30-Minuten-Tagesprotokoll
              </p>
              <CardTitle className="mt-1">
                Kernroutine für Automatisierung
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Nutze das als Standardform für 30 Minuten konzentriertes Lernen.
                Es ist eine starke Routine, keine Garantie.
              </p>
            </div>
            <Button onClick={() => setSessionTarget(5)} variant="outline">
              30-Minuten-Session starten
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Abrufen",
                minutes: "5 Min.",
                description: "Regel aus dem Gedächtnis sagen.",
                exercise: `Erkläre ohne Hilfe, wann ${todayGrammar.title} verwendet wird.`,
                step: "Schritt 1",
              },
              {
                title: "Schreiben",
                minutes: "7 Min.",
                description: "Zwei eigene Sätze schreiben.",
                exercise: `Schreibe zwei eigene Sätze mit ${todayGrammar.title} in neuem Kontext.`,
                step: "Schritt 2",
              },
              {
                title: "Sprechen",
                minutes: "7 Min.",
                description: "Eine Antwort im Studio oder laut geben.",
                exercise: `Gib im Studio eine vollständige Antwort mit ${todayGrammar.title}.`,
                step: "Schritt 3",
              },
              {
                title: "Laut lesen",
                minutes: "10 Min.",
                description: "Korrigierten Satz deutlich vorlesen.",
                exercise: "Lies den korrigierten Satz zweimal laut oder nimm dich einmal auf und höre danach zu.",
                step: "Schritt 2",
              },
              {
                title: "Coach-Gespräch",
                minutes: "8 Min.",
                description: "Eine Antwort im Studio geben und absenden.",
                exercise: `Öffne das Studio und gib eine vollständige Antwort mit ${todayGrammar.title}.`,
                step: "Schritt 3",
              },
            ].map(({ title, minutes, description, exercise, step }) => (
              <div
                key={title}
                className="rounded-xl border bg-muted/20 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <strong className="block">{title}</strong>
                  <Badge variant="secondary">{step}</Badge>
                </div>
                <span className="block text-xs font-semibold text-primary">
                  {minutes}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {description}
                </span>
                <span className="mt-2 block rounded-lg border bg-background/80 p-2 text-xs leading-5 text-foreground">
                  Übung: {exercise}
                </span>
              </div>
            ))}
          </div>
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
                    grammar={todayGrammar}
                    answers={plan.answers}
                    done={done}
                    unlocked={unlocked}
                    loading={loading}
                    report={
                      reports[
                        [
                          "recall",
                          "sentences",
                          "conversation",
                          "why",
                          "repeat",
                          "transfer",
                          "review",
                        ][index]!
                      ]
                    }
                    message={
                      messages[
                        [
                          "recall",
                          "sentences",
                          "conversation",
                          "why",
                          "repeat",
                          "transfer",
                          "review",
                        ][index]!
                      ]
                    }
                    repairOriginal={repairOriginal}
                    repairCorrected={repairCorrected}
                    reviewPrompt={reviewPrompt}
                    onAnswer={setDailyAnswer}
                    onRecall={checkRecall}
                    onSentences={checkSentences}
                    onWhy={checkWhy}
                    onRepeat={() => completeDailyStep(4)}
                    onTransfer={checkTransfer}
                    onReview={checkReview}
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
  grammar,
  answers,
  done,
  unlocked,
  loading,
  report,
  message,
  repairOriginal,
  repairCorrected,
  reviewPrompt,
  onAnswer,
  onRecall,
  onSentences,
  onWhy,
  onRepeat,
  onTransfer,
  onReview,
}: Readonly<{
  index: number;
  grammar: GrammarUnit;
  answers: Readonly<Record<string, string>>;
  done: boolean;
  unlocked: boolean;
  loading: string | null;
  report: EvaluationResponse | undefined;
  message: string | undefined;
  repairOriginal: string;
  repairCorrected: string;
  reviewPrompt: string;
  onAnswer: (key: string, value: string) => void;
  onRecall: () => void;
  onSentences: () => void;
  onWhy: () => void;
  onRepeat: () => void;
  onTransfer: () => void;
  onReview: () => void;
}>) {
  if (index === 0) {
    return (
      <TaskForm
        onSubmit={onRecall}
        loading={loading === "recall"}
        disabled={!unlocked || done}
        report={report}
        message={message}
      >
        <Textarea
          aria-label="Regel erklären"
          placeholder={`Erkläre „${grammar.title}“ in deinen eigenen Worten …`}
          value={answers.recall ?? ""}
          onChange={(event) => onAnswer("recall", event.target.value)}
        />
      </TaskForm>
    );
  }

  if (index === 1) {
    return (
      <TaskForm
        onSubmit={onSentences}
        loading={loading === "sentences"}
        disabled={!unlocked || done}
        report={report}
        message={message}
      >
        <div className="grid gap-2">
          {["s1", "s2", "s3"].map((key, sentenceIndex) => (
            <Input
              key={key}
              aria-label={`Satz ${sentenceIndex + 1}`}
              placeholder={`${sentenceIndex + 1}. eigener Satz`}
              value={answers[key] ?? ""}
              onChange={(event) => onAnswer(key, event.target.value)}
            />
          ))}
        </div>
      </TaskForm>
    );
  }

  if (index === 2) {
    const topic =
      speakingTopics.find((item) => item.level === grammar.level) ??
      speakingTopics[0];
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-blue-50/70 p-3 text-sm leading-6">
          {topic?.task}
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

  if (index === 3) {
    return (
      <TaskForm
        onSubmit={onWhy}
        loading={loading === "why"}
        disabled={!unlocked || done}
        report={report}
        message={message}
      >
        <CorrectionSample
          original={repairOriginal}
          corrected={repairCorrected}
        />
        <Textarea
          aria-label="Korrektur erklären"
          placeholder="Was wurde geändert und warum?"
          value={answers.why ?? ""}
          onChange={(event) => onAnswer("why", event.target.value)}
        />
      </TaskForm>
    );
  }

  if (index === 4) {
    return (
      <div className="space-y-3">
        <CorrectionSample
          original={repairOriginal}
          corrected={repairCorrected}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => speak(repairCorrected)}
          >
            <Volume2 data-icon="inline-start" />
            Anhören
          </Button>
          <Button type="button" disabled={!unlocked || done} onClick={onRepeat}>
            <Check data-icon="inline-start" />
            Zweimal laut gesagt
          </Button>
        </div>
      </div>
    );
  }

  if (index === 5) {
    return (
      <TaskForm
        onSubmit={onTransfer}
        loading={loading === "transfer"}
        disabled={!unlocked || done}
        report={report}
        message={message}
      >
        <Textarea
          aria-label="Mediations- und Transferantwort"
          placeholder="Eine Person hat die heutige Erklärung verpasst. Fasse den nützlichen Punkt in eigenen Worten zusammen und verwende die Zielgrammatik …"
          value={answers.transfer ?? ""}
          onChange={(event) => onAnswer("transfer", event.target.value)}
        />
      </TaskForm>
    );
  }

  return (
    <TaskForm
      onSubmit={onReview}
      loading={loading === "review"}
      disabled={!unlocked || done}
      report={report}
      message={message}
    >
      <div className="rounded-xl border bg-muted/50 p-3 text-sm">
        {reviewPrompt}
      </div>
      <Input
        aria-label="Antwort auf Wiederholung"
        placeholder="Deine richtige Fassung"
        value={answers.review ?? ""}
        onChange={(event) => onAnswer("review", event.target.value)}
      />
    </TaskForm>
  );
}

function TaskForm({
  children,
  onSubmit,
  loading,
  disabled,
  report,
  message,
}: Readonly<{
  children: React.ReactNode;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  report: EvaluationResponse | undefined;
  message: string | undefined;
}>) {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <Button type="submit" disabled={disabled || loading}>
        {loading ? (
          <LoaderCircle className="animate-spin" data-icon="inline-start" />
        ) : (
          <Check data-icon="inline-start" />
        )}
        Antwort prüfen
      </Button>
      {message && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {message}
        </p>
      )}
      {report && <EvaluationResult report={report} />}
    </form>
  );
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

function CorrectionSample({
  original,
  corrected,
}: Readonly<{ original: string; corrected: string }>) {
  return (
    <div className="rounded-xl border bg-muted/50 p-3 text-sm leading-6">
      <span className="line-through decoration-red-500">{original}</span>
      <br />
      <strong className="text-sky-800">→ {corrected}</strong>
    </div>
  );
}
