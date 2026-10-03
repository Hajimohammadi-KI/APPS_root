"use client";

import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildGermanEvidence,
  useLearnerState,
} from "@/features/learner-state/learner-state-provider";
import { getTodayKey } from "@grammar/domain";

const EFFECTIVENESS_PANEL_LOADED_AT = Date.now();

function dayDifference(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  return Math.floor((toDate.valueOf() - fromDate.valueOf()) / 86_400_000);
}

function mean(values: number[]) {
  return values.length
    ? Math.round(
        values.reduce((total, value) => total + value, 0) / values.length,
      )
    : null;
}

export function EffectivenessPanel() {
  const { state } = useLearnerState();
  const evidence = buildGermanEvidence(state);
  const today = getTodayKey();
  const thisWeek = evidence.dailyActivity.filter((row) => {
    const days = dayDifference(row.date, today);
    return days >= 0 && days < 7;
  });
  const activeDays = thisWeek.filter((row) => row.practiceCount > 0).length;
  const productiveSamples = thisWeek.reduce(
    (total, row) =>
      total + row.speakingSamples + row.writingSamples + row.spontaneousSamples,
    0,
  );
  const scoredDays = evidence.dailyActivity.filter(
    (row) => row.averageScore !== null,
  );
  const baseline = mean(
    scoredDays
      .slice(0, 3)
      .flatMap((row) => (row.averageScore === null ? [] : [row.averageScore])),
  );
  const recent = mean(
    scoredDays
      .slice(-3)
      .flatMap((row) => (row.averageScore === null ? [] : [row.averageScore])),
  );
  const trend = baseline === null || recent === null ? null : recent - baseline;
  const outcomeGain =
    state.outcomes.baselineScore === null ||
    state.outcomes.followupScore === null
      ? null
      : state.outcomes.followupScore - state.outcomes.baselineScore;
  const lastActiveDate = evidence.dailyActivity
    .filter((row) => row.practiceCount > 0)
    .at(-1)?.date;
  const daysAway = lastActiveDate ? dayDifference(lastActiveDate, today) : null;
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= EFFECTIVENESS_PANEL_LOADED_AT,
  ).length;
  const returning = daysAway !== null && daysAway >= 2;
  const sessionTarget = returning ? 2 : 3;
  const recommendation = returning
    ? "Sanft zurückkehren: Erledige die ersten zwei Schritte. Der Rest ist heute freiwillig."
    : dueReviews >= 4
      ? `Beginne mit einer Grammatikaufgabe und räume danach ${dueReviews} fällige Wiederholungen auf.`
      : "Nutze alle drei Schritte: Grammatik, Laut lesen und Coach-Gespräch.";

  return (
    <section
      aria-labelledby="effectiveness-title"
      className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-extrabold tracking-wider text-primary uppercase">
            <FlaskConical aria-hidden="true" className="size-4" />
            Messbares Lernen
          </p>
          <h2 className="mt-2 text-xl font-extrabold" id="effectiveness-title">
            Nachweise statt nur Lernserie
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Diese datensparsamen App-Werte zeigen Übung und Veränderung. Sie
            ersetzen keine unabhängige GER-Prüfung.
          </p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <EvidenceMetric
              icon={CalendarCheck2}
              label="Aktive Tage diese Woche"
              value={`${activeDays}/5`}
            />
            <EvidenceMetric
              icon={Activity}
              label="Produktive Proben"
              value={String(productiveSamples)}
            />
            <EvidenceMetric
              icon={TrendingUp}
              label="Ergebnis-Veränderung"
              value={
                outcomeGain === null
                  ? trend === null
                    ? "Ausgangswert fehlt"
                    : `${trend >= 0 ? "+" : ""}${trend} App-Punkte`
                  : `${outcomeGain >= 0 ? "+" : ""}${outcomeGain} Rubrik-Punkte`
              }
            />
            <EvidenceMetric
              icon={ShieldCheck}
              label="Unabhängige Prüfung"
              value={
                state.outcomes.independentlyRated
                  ? state.outcomes.retentionScore === null
                    ? "Bewertet · Behalten offen"
                    : "Bewertet + behalten"
                  : "Nicht erfasst"
              }
            />
          </dl>
        </div>
        <aside className="w-full rounded-2xl border border-primary/15 bg-primary/5 p-4 xl:max-w-sm">
          <p className="text-xs font-extrabold tracking-wider text-primary uppercase">
            Adaptive Einheit · {sessionTarget} von 3 Schritten
          </p>
          <h3 className="mt-2 font-extrabold">
            {returning
              ? "Wiedereinstieg"
              : dueReviews >= 4
                ? "Zuerst behalten"
                : "Ausgewogene Einheit"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {recommendation}
          </p>
          <Button
            className="mt-4 w-full"
            nativeButton={false}
            render={
              <a
                href={
                  state.learner.selfDeclaredLevel ? "/heute" : "/einstellungen"
                }
              />
            }
          >
            {state.learner.selfDeclaredLevel
              ? "Empfohlene Einheit starten"
              : "Mein Niveau wählen"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </aside>
      </div>

      <div className="mt-5 rounded-2xl border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
              30-Minuten-Tagesprotokoll
            </p>
            <h3 className="mt-1 font-extrabold">
              Wissenschaftliches Tempo für Automatisierung
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Das ist die Zielroutine für stetigen Fortschritt, keine Garantie.
          </p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[
            [
              "Grammatik",
              "8 Min.",
              "Einen eigenen Satz aus einer realen Situation schreiben.",
            ],
            [
              "Laut lesen",
              "10 Min.",
              "Korrigierten Satz laut lesen oder einmal aufnehmen und anhören.",
            ],
            [
              "Coach-Gespräch",
              "12 Min.",
              "Eine Antwort im Studio geben und Feedback auswerten.",
            ],
          ].map(([title, minutes, description]) => (
            <div key={title} className="rounded-xl border bg-card p-3 text-sm">
              <strong className="block">{title}</strong>
              <span className="block text-xs font-semibold text-primary">
                {minutes}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EvidenceMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-background p-4">
      <Icon aria-hidden="true" className="size-4 text-primary" />
      <dt className="mt-3 text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-base font-extrabold">{value}</dd>
    </div>
  );
}
