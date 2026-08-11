"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Lightbulb,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { LearningAccordion } from "@/components/learning-accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import {
  isPracticeAnswerCorrect,
  type MaterialPracticePlan,
  type PracticeExercise,
} from "@/lib/material-practice";
import { pdfReaderHrefForMaterial } from "@/lib/pdf-reader-link";
import { cn } from "@/lib/utils";

interface ExerciseResult {
  readonly correct: boolean;
  readonly answer: string;
}

function ExercisePanel({
  exercise,
  answer,
  result,
  onAnswer,
  onCheck,
}: Readonly<{
  exercise: PracticeExercise;
  answer: string;
  result?: ExerciseResult;
  onAnswer: (value: string) => void;
  onCheck: () => void;
}>) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <p className="text-xs font-bold tracking-[0.12em] text-violet-700 uppercase">
          {exercise.instruction}
        </p>
        <p className="mt-2 text-base font-semibold leading-7 text-slate-950">
          {exercise.prompt}
        </p>
      </div>

      {exercise.type === "choice" && exercise.options ? (
        <div aria-label="Antwortmöglichkeiten" className="grid gap-2">
          {exercise.options.map((option) => (
            <button
              aria-pressed={answer === option}
              className={cn(
                "min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                "focus-visible:ring-3 focus-visible:ring-violet-300 focus-visible:outline-none",
                answer === option
                  ? "border-violet-500 bg-violet-50 text-violet-950"
                  : "border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50/50",
              )}
              key={option}
              onClick={() => onAnswer(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor={`${exercise.id}-answer`}
          >
            Deine Antwort
          </label>
          <Input
            autoComplete="off"
            className="h-12 bg-white text-base"
            id={`${exercise.id}-answer`}
            onChange={(event) => onAnswer(event.target.value)}
            placeholder="Schreibe den vollständigen Ausdruck oder Satz."
            value={answer}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={!answer.trim()} onClick={onCheck} type="button">
          Antwort prüfen
        </Button>
        <span className="inline-flex items-start gap-1.5 text-xs leading-5 text-slate-600">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          {exercise.hint}
        </span>
      </div>

      {result ? (
        <div
          aria-live="polite"
          className={cn(
            "rounded-xl border p-4",
            result.correct
              ? "border-emerald-300 bg-emerald-50 text-emerald-950"
              : "border-rose-300 bg-rose-50 text-rose-950",
          )}
        >
          <div className="flex items-start gap-2">
            {result.correct ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            ) : (
              <CircleAlert className="mt-0.5 size-5 shrink-0" />
            )}
            <div>
              <strong className="block">
                {result.correct ? "Richtig gelöst" : "Noch nicht richtig"}
              </strong>
              {!result.correct ? (
                <p className="mt-1 text-sm leading-6">
                  Richtige Lösung: <strong>{exercise.answerLabel}</strong>
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6">
                <strong>Warum?</strong> {exercise.explanation}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MaterialPracticeSession({
  plan,
}: Readonly<{ plan: MaterialPracticePlan }>) {
  const { state, addError, markActivity, recordAttempt, scheduleReview } =
    useLearnerState();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ExerciseResult>>({});
  const [saved, setSaved] = useState(false);

  const topicKey = `Quellenübung · ${plan.material.id}`;
  const previousAttempts = useMemo(
    () => state.attempts.filter((attempt) => attempt.topic === topicKey),
    [state.attempts, topicKey],
  );
  const checkedCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(
    (result) => result.correct,
  ).length;
  const allChecked = checkedCount === plan.exercises.length;
  const score = allChecked
    ? Math.round((correctCount / plan.exercises.length) * 100)
    : 0;
  const sourceHref =
    pdfReaderHrefForMaterial({
      sourceUrl: plan.material.url,
      name: plan.material.title,
      focus: `Schwerpunkt: ${plan.focus}`,
      context: `Deutsch ${plan.material.level} · ${plan.material.format}`,
      isPdf: plan.material.format === "PDF",
      materialId: plan.material.id,
    }) || plan.material.url;

  const setAnswer = (exerciseId: string, value: string) => {
    setAnswers((current) => ({ ...current, [exerciseId]: value }));
    setResults((current) => {
      if (!(exerciseId in current)) return current;
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
    setSaved(false);
  };

  const checkExercise = (exercise: PracticeExercise) => {
    const answer = answers[exercise.id] ?? "";
    setResults((current) => ({
      ...current,
      [exercise.id]: {
        answer,
        correct: isPracticeAnswerCorrect(answer, exercise.acceptedAnswers),
      },
    }));
    setSaved(false);
  };

  const resetPractice = () => {
    setAnswers({});
    setResults({});
    setSaved(false);
  };

  const readPrompt = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = state.settings.ttsRate;
    window.speechSynthesis.speak(utterance);
  };

  const saveResult = () => {
    if (!allChecked || saved) return;
    const wrongExercises = plan.exercises.filter(
      (item) => !results[item.id]?.correct,
    );
    const combinedInput = plan.exercises
      .map((item) => `${item.stage}: ${answers[item.id] ?? ""}`)
      .join("\n");
    const combinedCorrection = plan.exercises
      .map((item) => `${item.stage}: ${item.answerLabel}`)
      .join("\n");

    recordAttempt({
      topic: topicKey,
      mode: "writing",
      inputText: combinedInput,
      correctedText: combinedCorrection,
      targetHit: score >= 67,
      verified: true,
      accuracyScore: score,
    });
    markActivity(10);

    wrongExercises.forEach((item) => {
      const original = answers[item.id]?.trim() || "Keine Antwort";
      addError({
        topic: plan.focus,
        original,
        corrected: item.answerLabel,
        errorClass: item.errorClass,
        explanation: item.explanation,
      });
      scheduleReview(plan.focus, original, item.answerLabel, {
        sourceType: "grammar_topic",
        sourceId: plan.material.id,
        reviewMode: "repair",
      });
    });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-linear-to-br from-white via-violet-50 to-sky-50 p-5 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-12 size-52 rounded-full bg-violet-200/45 blur-sm"
        />
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <Badge>{plan.material.level}</Badge>
            <Badge variant="secondary">{plan.material.format}</Badge>
            <Badge variant="outline">Aktives Üben</Badge>
          </div>
          <p className="mt-5 text-xs font-black tracking-[0.15em] text-violet-700 uppercase">
            Quellenbasierte Transferübung
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {plan.material.title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">
            Schwerpunkt: <strong>{plan.focus}</strong>. Lies die Regel kurz,
            löse anschließend ohne Vorlage und prüfe bei jeder Aufgabe die
            Begründung.
          </p>
          {plan.relatedFocus.length ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Weitere Themen im Quellenmaterial: {plan.relatedFocus.join(", ")}.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/deutsch-mit-marija"
            >
              <ArrowLeft data-icon="inline-start" />
              Zur Materialübersicht
            </Link>
            <a
              className={buttonVariants()}
              href={sourceHref}
              rel={
                sourceHref === plan.material.url
                  ? "noopener noreferrer"
                  : undefined
              }
              target={sourceHref === plan.material.url ? "_blank" : undefined}
            >
              <BookOpen data-icon="inline-start" />
              {plan.material.format === "PDF"
                ? "Original-PDF öffnen"
                : "Originalquelle öffnen"}
              <ExternalLink data-icon="inline-end" />
            </a>
          </div>
        </div>
      </section>

      <Card className="border-slate-200 bg-white/90">
        <CardContent className="space-y-3">
          <Progress value={(checkedCount / plan.exercises.length) * 100}>
            <ProgressLabel>Bearbeitete Schritte</ProgressLabel>
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {checkedCount} von {plan.exercises.length}
            </span>
          </Progress>
          {previousAttempts.length ? (
            <p className="text-xs text-slate-600">
              Bereits gespeichert: {previousAttempts.length} Versuch(e), zuletzt{" "}
              {previousAttempts.at(-1)?.accuracyScore ?? 0} %.
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Noch kein gespeicherter Versuch. Dein Ergebnis wird nach dem
              letzten Schritt in Fortschritt und Fehlerkartei übernommen.
            </p>
          )}
        </CardContent>
      </Card>

      <LearningAccordion
        defaultOpen
        eyebrow="1 · Kurz verstehen"
        icon={Sparkles}
        summary={plan.objective}
        title={`Regel: ${plan.focus}`}
        tone="violet"
      >
        <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <p className="text-base font-medium leading-7 text-slate-900">
            {plan.rule}
          </p>
          <Button
            className="mt-3"
            onClick={() => readPrompt(plan.rule)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Volume2 data-icon="inline-start" />
            Regel vorlesen
          </Button>
        </div>
      </LearningAccordion>

      {plan.exercises.map((item, index) => {
        const result = results[item.id];
        return (
          <LearningAccordion
            defaultOpen={index === 0}
            eyebrow={`${index + 2} · ${item.stage}`}
            icon={index === 2 ? RotateCcw : Lightbulb}
            key={item.id}
            summary={
              result
                ? result.correct
                  ? "Richtig - Begründung ansehen"
                  : "Noch einmal prüfen - Lösung und Begründung ansehen"
                : "Aufgabe öffnen und direkt prüfen"
            }
            title={`Aufgabe ${index + 1}`}
            tone={index === 0 ? "blue" : index === 1 ? "emerald" : "amber"}
          >
            <ExercisePanel
              answer={answers[item.id] ?? ""}
              exercise={item}
              onAnswer={(value) => setAnswer(item.id, value)}
              onCheck={() => checkExercise(item)}
              {...(result ? { result } : {})}
            />
          </LearningAccordion>
        );
      })}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black tracking-[0.13em] text-violet-700 uppercase">
              Ergebnis und nächster Abruf
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {allChecked
                ? `${correctCount} von ${plan.exercises.length} richtig · ${score} %`
                : "Prüfe zuerst alle drei Aufgaben"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Falsche Antworten werden mit Lösung und Regel in deine
              Fehlerkartei übernommen und für eine spätere Reparatur eingeplant.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={resetPractice} type="button" variant="outline">
              <RotateCcw data-icon="inline-start" />
              Neu beginnen
            </Button>
            <Button
              disabled={!allChecked || saved}
              onClick={saveResult}
              type="button"
            >
              <Save data-icon="inline-start" />
              {saved ? "Gespeichert" : "Ergebnis speichern"}
            </Button>
          </div>
        </div>
        {saved ? (
          <div
            className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-950"
            role="status"
          >
            Ergebnis, Aktivität und notwendige Wiederholungen wurden
            gespeichert.
          </div>
        ) : null}
      </section>

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
        {plan.copyrightNote}
      </p>
    </div>
  );
}
