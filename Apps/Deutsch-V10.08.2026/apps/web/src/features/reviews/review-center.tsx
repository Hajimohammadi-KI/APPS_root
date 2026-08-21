"use client";

import { useEffect, useState } from "react";
import {
  Award,
  CalendarClock,
  Check,
  Clock3,
  LoaderCircle,
  Repeat2,
  Volume2,
} from "lucide-react";

import { grammarUnits } from "@grammar/content";
import type { EvaluationResponse } from "@grammar/contracts";
import {
  getTodayKey,
  reviewModeLabels,
  REVIEW_INTERVAL_DAYS,
  type MasteryMode,
} from "@grammar/domain";
import {
  appendLearningEvidenceBundleToStorage,
  buildAttemptVerticalSlice,
  normalizeDailySessionMinutes,
  type CefrLevel,
} from "@automaticity/learning-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import { requestEvaluation } from "@/lib/evaluation-client";
import { API_BASE_URL } from "@/lib/api-config";

const REVIEW_CENTER_LOADED_AT = Date.now();

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

export function ReviewCenter() {
  const { state, completeReview, markActivity, recordAttempt } =
    useLearnerState();
  const totalReviews = state.reviews.length;
  const masteredReviews = state.reviews.filter(
    (review) => review.mastered,
  ).length;
  const due = state.reviews.filter(
    (review) => !review.mastered && review.due <= REVIEW_CENTER_LOADED_AT,
  );
  const upcoming = state.reviews
    .filter(
      (review) => !review.mastered && review.due > REVIEW_CENTER_LOADED_AT,
    )
    .sort((left, right) => left.due - right.due);
  const [selectedId, setSelectedId] = useState(due[0]?.id ?? "");
  const selected = due.find((review) => review.id === selectedId) ?? due[0];
  const [answer, setAnswer] = useState("");
  const [report, setReport] = useState<EvaluationResponse | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(8);
  const achievements = [
    {
      key: "first-review",
      unlocked: masteredReviews >= 1,
      title: "Erste Wiederholung",
      hint: "1 Review erfolgreich abschließen",
    },
    {
      key: "queue-control",
      unlocked: totalReviews > 0 && due.length === 0,
      title: "Warteschlange leer",
      hint: "Keine fällige Wiederholung offen",
    },
    {
      key: "retention-core",
      unlocked: masteredReviews >= 10,
      title: "Retention-Kern",
      hint: "10 Reviews meistern",
    },
  ] as const;
  const timedActive =
    selected?.reviewMode === "timed" && state.settings.timedChallenges;

  useEffect(() => {
    if (!timedActive) {
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [selected?.id, timedActive]);

  async function checkReview() {
    if (!selected || !answer.trim()) {
      setMessage("Gib zuerst deine eigene richtige Fassung ein.");
      return;
    }
    const grammar =
      grammarUnits.find((unit) => unit.title === selected.topic) ??
      grammarUnits.find(
        (unit) =>
          state.todayGrammar?.date === getTodayKey() &&
          unit.title === state.todayGrammar.title,
      ) ??
      grammarUnits.find((unit) => unit.level === "A2")!;
    setLoading(true);
    setMessage("");
    try {
      const result = await requestEvaluation({
        allowOnlineFeedback: state.learner.allowOnlineAI,
        apiBaseUrl: API_BASE_URL,
        text: answer.trim(),
        grammar: {
          title: grammar.title,
          rule: grammar.rule,
          examples: grammar.examples,
        },
        kind: "review",
        taskPrompt: `Rufe die gespeicherte Korrektur zu „${selected.topic}“ ohne Nachsehen ab.`,
        spellingAffectsMastery: state.settings.spellingAffectsMastery,
      });
      setReport(result);
      speak(result.corrected);
      const exact =
        answer.trim().toLocaleLowerCase("de") ===
        selected.corrected.trim().toLocaleLowerCase("de");
      const mode: MasteryMode =
        selected.reviewMode === "repair"
          ? "repair"
          : selected.reviewMode === "timed"
            ? "recognition"
            : selected.reviewMode === "mixed"
              ? "transfer"
              : "writing";
      const occurredAt = new Date().toISOString();
      appendLearningEvidenceBundleToStorage(
        window.localStorage,
        buildAttemptVerticalSlice({
          attemptId: crypto.randomUUID(),
          occurredAt,
          language: "de",
          cefrLevel: grammar.level as CefrLevel,
          contentVersion: `20.8.23-${grammar.level.toLowerCase()}-runtime`,
          topic: selected.topic,
          targetForm: grammar.rule,
          prompt: `Übertrage „${selected.topic}“ ohne Nachschlagen in einen neuen Kontext.`,
          mode,
          inputText: answer.trim(),
          correctedText: result.corrected,
          targetHit: exact && result.targetHit,
          accuracyScore: exact ? 100 : 40,
          attemptVerified: true,
          assessedBy: state.learner.allowOnlineAI ? "online" : "deterministic",
          sessionMinutes: normalizeDailySessionMinutes(
            state.settings.dailyStudyMinutes,
          ),
          fromDueReview: true,
          sourceId: "deutsch-authored-grammar-curriculum-v20",
        }),
      );
      recordAttempt({
        topic: selected.topic,
        mode,
        inputText: answer.trim(),
        correctedText: result.corrected,
        targetHit: exact && result.targetHit,
        verified: true,
        accuracyScore: exact ? 100 : 40,
        ...(timedActive ? { latencyMs: (8 - secondsLeft) * 1_000 } : {}),
      });
      if (!exact) {
        completeReview(selected.id, false);
        setSecondsLeft(8);
        setMessage(
          `Noch nicht vollständig richtig. Das Intervall wurde verkürzt. Erwartete Fassung: ${selected.corrected}`,
        );
      } else if (!result.practiceReady && result.changed) {
        completeReview(selected.id, false);
        setSecondsLeft(8);
        setMessage(
          "Die lokale Prüfung hat noch eine konkrete Korrektur gefunden. Das Intervall wurde zurückgesetzt.",
        );
      } else {
        const confidence =
          result.accuracyScore >= 95 && (!timedActive || secondsLeft >= 3)
            ? "easy"
            : result.accuracyScore < 85 || (timedActive && secondsLeft <= 0)
              ? "hard"
              : "good";
        completeReview(selected.id, true, confidence);
        setSecondsLeft(8);
        markActivity(1);
        setMessage(
          confidence === "easy"
            ? "Sicher und schnell abgerufen. Das nächste Intervall wurde verlängert."
            : confidence === "hard"
              ? "Richtig, aber noch anstrengend. Das Thema erscheint früher wieder."
              : "Richtig. Die nächste Wiederholung wurde automatisch geplant.",
        );
        setAnswer("");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Die Auswertung ist momentan nicht erreichbar.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Langzeitgedächtnis</p>
        <h1 className="section-title">Wiederholungen</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Gespeicherte Korrekturen und abgeschlossene Grammatikthemen folgen dem
          ursprünglichen festen Lernrhythmus.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            Lernintervalle
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REVIEW_INTERVAL_DAYS.map((day, index) => (
            <Badge key={day} variant={index === 0 ? "default" : "secondary"}>
              +{day} {day === 1 ? "Tag" : "Tage"}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <section aria-label="Wiederholungsmissionen" className="space-y-2">
        <h2 className="text-sm font-semibold text-sky-900">Schnellmissionen</h2>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 1</strong>
            <span className="text-muted-foreground">
              Heute mindestens 1 fällige Wiederholung abschließen.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 2</strong>
            <span className="text-muted-foreground">
              Priorität auf zeitkritische Abrufe setzen.
            </span>
          </article>
          <article className="min-w-56 rounded-xl border bg-card p-3 text-sm shadow-sm">
            <strong className="block">Mission 3</strong>
            <span className="text-muted-foreground">
              Mastered: {masteredReviews} von {totalReviews}
            </span>
          </article>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            Fortschritte für Langzeitbehalten sichtbar machen.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.key}
              className="flex items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <Award
                className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
              />
              <span className="min-w-0 flex-1 font-medium">
                {achievement.title}
              </span>
              <Badge variant={achievement.unlocked ? "secondary" : "outline"}>
                {achievement.unlocked ? "Erreicht" : achievement.hint}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Heute fällig</CardTitle>
            <CardDescription>{due.length} Wiederholungen</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {due.map((review) => (
              <button
                key={review.id}
                type="button"
                className={`rounded-xl border p-3 text-left ${
                  selected?.id === review.id
                    ? "border-primary bg-sky-50"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => {
                  setSelectedId(review.id);
                  setAnswer("");
                  setReport(null);
                  setMessage("");
                  setSecondsLeft(8);
                }}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <strong className="min-w-0 flex-1 text-sm">
                    {review.topic}
                  </strong>
                  <Badge variant="outline">
                    {reviewModeLabels[review.reviewMode]}
                  </Badge>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {review.sourceType === "error_item"
                    ? "Persönlicher Fehler"
                    : "Grammatikthema"}{" "}
                  · Stufe {review.stage + 1} von {REVIEW_INTERVAL_DAYS.length}
                </span>
              </button>
            ))}
            {due.length === 0 && (
              <div className="py-8 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <Repeat2 className="size-5" />
                </span>
                <p className="mt-3 text-sm font-semibold">
                  Heute ist nichts fällig
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          {selected ? (
            <>
              <CardHeader>
                <Badge className="mb-2 w-fit">
                  {selected.reviewMode === "timed" && !timedActive
                    ? "Abruf ohne Zeitdruck"
                    : reviewModeLabels[selected.reviewMode]}{" "}
                  · Wiederholung {selected.stage + 1}
                </Badge>
                <CardTitle>{selected.topic}</CardTitle>
                <CardDescription>
                  Rufe die richtige Fassung ohne Nachschlagen ab.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-muted/50 p-4 text-sm">
                  {selected.original}
                </div>
                {timedActive && (
                  <p
                    role="timer"
                    className={`rounded-xl border p-3 text-sm font-semibold ${
                      secondsLeft > 0
                        ? "border-blue-200 bg-blue-50 text-blue-950"
                        : "border-amber-300 bg-amber-50 text-amber-950"
                    }`}
                  >
                    {secondsLeft > 0
                      ? `${secondsLeft} Sekunden für schnellen Abruf`
                      : "Zeitfenster abgelaufen – antworte trotzdem und trainiere den Abruf erneut."}
                  </p>
                )}
                <Textarea
                  aria-label="Richtige Fassung"
                  placeholder="Deine korrigierte Fassung …"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={() => void checkReview()}
                  >
                    {loading ? (
                      <LoaderCircle
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    Antwort prüfen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => speak(selected.corrected)}
                  >
                    <Volume2 data-icon="inline-start" />
                    Lösung anhören
                  </Button>
                </div>
                {message && (
                  <p role="status" className="rounded-xl border p-3 text-sm">
                    {message}
                  </p>
                )}
                {report && (
                  <div className="rounded-xl bg-muted/50 p-3 text-sm">
                    <strong>
                      {report.ok
                        ? "Online geprüft"
                        : report.practiceReady
                          ? "Offline richtig abgerufen"
                          : "Noch prüfen"}
                    </strong>
                    {report.changed && (
                      <p className="mt-1">Korrigiert: {report.corrected}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="grid min-h-72 place-items-center text-center text-sm text-muted-foreground">
              Schließe eine Grammatikeinheit oder korrigierte Studio-Antwort ab.
              Danach erscheint sie hier.
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-5" />
            Demnächst
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.slice(0, 9).map((review) => (
            <div key={review.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="min-w-0 flex-1">{review.topic}</strong>
                <Badge variant="outline">
                  {reviewModeLabels[review.reviewMode]}
                </Badge>
              </div>
              <span className="mt-1 block text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(review.due)}
              </span>
            </div>
          ))}
          {upcoming.length === 0 && (
            <Empty className="min-h-36 border sm:col-span-2 lg:col-span-3">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClock aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Keine Wiederholung geplant</EmptyTitle>
                <EmptyDescription>
                  Nach einer abgeschlossenen Übung erscheint hier automatisch
                  der nächste Wiederholungstermin.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
