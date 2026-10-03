"use client";
import { AutomaticityEvidenceSummary } from "./automaticity-evidence-summary";

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  Mic2,
  Repeat2,
} from "lucide-react";

import { grammarUnits } from "@grammar/content";
import {
  CEFR_LEVELS,
  calculateStreak,
  errorClassLabels,
  getTodayKey,
  masteryStatusLabels,
  type CefrLevel,
  type ErrorClass,
} from "@grammar/domain";

import { LearningAccordion } from "@/components/learning-accordion";
import { Badge } from "@/components/ui/badge";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const PROGRESS_PAGE_LOADED_AT = Date.now();

const metricToneClasses = {
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

export function ProgressEvidence() {
  const { state, hydrated } = useLearnerState();
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= PROGRESS_PAGE_LOADED_AT,
  ).length;
  const todayUnit =
    grammarUnits.find(
      (unit) =>
        state.todayGrammar?.date === getTodayKey() &&
        unit.title === state.todayGrammar.title,
    ) ??
    (state.learningLevel
      ? grammarUnits.find((unit) => unit.level === state.learningLevel)
      : undefined);
  const masteryRows = Object.entries(state.mastery).map(([topic, record]) => ({
    ...record,
    topic,
  }));
  const automaticTopics = masteryRows.filter(
    (mastery) => mastery.status === "automatic",
  ).length;
  const unstableTopics = masteryRows.filter(
    (mastery) => mastery.status !== "automatic",
  ).length;
  const focusMastery = todayUnit ? state.mastery[todayUnit.title] : undefined;
  const weakSpeaking = masteryRows.filter(
    (mastery) =>
      state.attempts.some(
        (attempt) =>
          attempt.topic === mastery.topic &&
          attempt.mode === "speaking" &&
          attempt.verified === true,
      ) &&
      mastery.status !== "new" &&
      mastery.scores.speaking < 80 &&
      mastery.scores.writing >= mastery.scores.speaking,
  ).length;
  const weakWriting = masteryRows.filter(
    (mastery) =>
      state.attempts.some(
        (attempt) =>
          attempt.topic === mastery.topic &&
          attempt.mode === "writing" &&
          attempt.verified === true,
      ) &&
      mastery.status !== "new" &&
      mastery.scores.writing < 80 &&
      mastery.scores.speaking > mastery.scores.writing,
  ).length;

  const groupedErrors = state.errors.reduce<
    Partial<Record<ErrorClass, number>>
  >((groups, error) => {
    if (error.repairStatus !== "fixed") {
      groups[error.errorClass] =
        (groups[error.errorClass] ?? 0) + error.occurrenceCount;
    }
    return groups;
  }, {});
  const topErrors = Object.entries(groupedErrors)
    .map(([errorClass, count]) => ({
      errorClass: errorClass as ErrorClass,
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const levelGates = CEFR_LEVELS.map((level) => {
    const levelTitles = grammarUnits
      .filter((unit) => unit.level === level)
      .map((unit) => unit.title);
    const titleSet = new Set(levelTitles);
    const automaticCount = levelTitles.filter(
      (title) => state.mastery[title]?.status === "automatic",
    ).length;
    const activeCriticalErrors = state.errors.filter(
      (error) =>
        titleSet.has(error.topic) &&
        error.critical &&
        error.repairStatus !== "fixed",
    ).length;
    const successful = state.attempts.filter(
      (attempt) =>
        titleSet.has(attempt.topic) &&
        attempt.verified === true &&
        attempt.targetHit &&
        attempt.accuracyScore >= 80,
    );
    const minimumSamples = Math.max(6, Math.ceil(levelTitles.length * 0.5));
    const requirements = [
      {
        label: `Themen über der bisherigen Übungsschwelle ${automaticCount}/${levelTitles.length}`,
        done: automaticCount === levelTitles.length,
      },
      {
        label: `Aktive kritische Fehler ${activeCriticalErrors}`,
        done: activeCriticalErrors === 0,
      },
      {
        label: `Geprüfte Sprechübungen ${successful.filter((attempt) => attempt.mode === "speaking").length}/${minimumSamples}`,
        done:
          successful.filter((attempt) => attempt.mode === "speaking").length >=
          minimumSamples,
      },
      {
        label: `Geprüfte Schreibübungen ${successful.filter((attempt) => attempt.mode === "writing").length}/${minimumSamples}`,
        done:
          successful.filter((attempt) => attempt.mode === "writing").length >=
          minimumSamples,
      },
      {
        label: `Geprüfte Transferübungen ${successful.filter((attempt) => attempt.mode === "transfer").length}/${minimumSamples}`,
        done:
          successful.filter((attempt) => attempt.mode === "transfer").length >=
          minimumSamples,
      },
    ] as const;

    return {
      level: level as CefrLevel,
      ready: requirements.every((requirement) => requirement.done),
      requirements,
    };
  });
  const activeGate =
    levelGates.find((gate) => gate.level === state.learner.selfDeclaredLevel) ??
    levelGates.find((gate) => !gate.ready) ??
    levelGates[levelGates.length - 1];

  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return state.activity[getTodayKey(date)] ?? 0;
  });
  const weeklyCompletion = Math.round(
    (weekActivity.filter((activity) => activity > 0).length / 7) * 100,
  );
  const streak = calculateStreak(state.activity);
  const achievements = [
    {
      key: "streak",
      unlocked: streak >= 3,
      title: "Konstanz-Starter",
      hint: "3 Tage Lernserie",
    },
    {
      key: "automaticity",
      unlocked: automaticTopics >= 5,
      title: "Übungsaufbau",
      hint: "5 bisherige Übungsschwellen erreichen",
    },
    {
      key: "reviews",
      unlocked: state.attempts.length > 0 && dueReviews === 0,
      title: "Review-Null",
      hint: "Alle fälligen Reviews abschließen",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-sky-50/70 p-5 shadow-sm sm:p-7">
        <p className="section-kicker">Details, nur bei Bedarf</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          Fortschritt & Nachweise
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Die Startseite bleibt ruhig. Öffne hier nur den Bereich, den du gerade
          prüfen möchtest. Alle Gruppen sind zunächst geschlossen.
        </p>
        {/* Diese Legende verhindert, dass App-Scores als Lehrkrafturteil gelesen werden. */}
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2" role="note">
          <p className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <strong>Automatische Übungssignale:</strong> Aktivität,
            App-Prüfungen und berechnete Stabilität.
          </p>
          <p className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <strong>Durch Lehrkraft bestätigte Beherrschung:</strong> auf diesem
            Gerät nicht erfasst.
          </p>
        </div>
      </header>

      <AutomaticityEvidenceSummary />
      <LearningAccordion
        eyebrow="Persönlicher Lernstand"
        group="progress-evidence"
        icon={Gauge}
        summary="Automatisierung, fällige Wiederholungen sowie Sprech- und Schreibwerte"
        title="Bisherige Übungswerte"
        tone="violet"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactMetric
            icon={<CheckCircle2 />}
            label="Bisherige Übungsschwelle erreicht"
            value={hydrated ? String(automaticTopics) : "–"}
            hint="Historischer App-Wert, kein Beherrschungsnachweis"
            tone="sky"
          />
          <CompactMetric
            icon={<AlertTriangle />}
            label="Weitere Übung vorgesehen"
            value={hydrated ? String(unstableTopics) : "–"}
            hint="Beherrschung unabhängig davon ungeprüft"
            tone="amber"
          />
          <CompactMetric
            icon={<Repeat2 />}
            label="Heute fällig"
            value={hydrated ? String(dueReviews) : "–"}
            hint="Wiederholungen und Reparaturen"
            tone="blue"
          />
          <CompactMetric
            icon={<Gauge />}
            label="Fokusstatus"
            value={
              hydrated
                ? masteryStatusLabels[focusMastery?.status ?? "new"]
                : "–"
            }
            hint={todayUnit?.title ?? "Noch kein Fokus"}
            tone="violet"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <EvidenceRow label="Sprechen braucht Übung" value={weakSpeaking} />
          <EvidenceRow label="Schreiben braucht Übung" value={weakWriting} />
        </div>
      </LearningAccordion>

      <LearningAccordion
        eyebrow="Gezielt reparieren"
        group="progress-evidence"
        icon={LockKeyhole}
        summary="Wiederkehrende Fehler und Bedingungen für das nächste Niveau"
        title="Fehler und Übungsplan für das Niveau"
        tone="amber"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="top-errors-heading">
            <h2 id="top-errors-heading" className="text-sm font-bold">
              Häufigste aktive Fehler
            </h2>
            {topErrors.length > 0 ? (
              <ol className="mt-3 grid gap-2">
                {topErrors.map((error, index) => (
                  <li
                    key={error.errorClass}
                    className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-xs font-black text-amber-900">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">
                      {errorClassLabels[error.errorClass]}
                    </span>
                    <Badge variant="secondary">{error.count}×</Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-xl border bg-background p-4 text-sm text-muted-foreground">
                Noch keine aktiven Fehler. Neue Korrekturen werden im Studio
                automatisch klassifiziert.
              </p>
            )}
          </section>

          {activeGate ? (
            <section aria-labelledby="level-gate-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="level-gate-heading" className="text-sm font-bold">
                  Übungsplan für das Niveau
                </h2>
                <Badge variant={activeGate.ready ? "secondary" : "outline"}>
                  {activeGate.level}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {activeGate.requirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className="flex items-center gap-2 rounded-xl border bg-background p-3 text-sm"
                  >
                    <CheckCircle2
                      className={`size-4 ${requirement.done ? "text-emerald-600" : "text-muted-foreground"}`}
                    />
                    <span className="min-w-0 flex-1">{requirement.label}</span>
                    <Badge variant={requirement.done ? "secondary" : "outline"}>
                      {requirement.done ? "Erfüllt" : "Offen"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </LearningAccordion>

      <LearningAccordion
        eyebrow="Langfristige Motivation"
        group="progress-evidence"
        icon={Award}
        summary={`Wochenaktivität ${weeklyCompletion}% · ${achievements.filter((item) => item.unlocked).length} von ${achievements.length} Badges erreicht`}
        title="Wochenziele und Badges"
        tone="blue"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <section aria-labelledby="weekly-goals-heading">
            <h2 id="weekly-goals-heading" className="text-sm font-bold">
              Ruhige Wochenziele
            </h2>
            <ul className="mt-3 grid gap-2">
              <GoalRow label="1 Grammatik-Checkpoint" frequency="Täglich" />
              <GoalRow label="1 Antwort laut sprechen" frequency="Täglich" />
              <GoalRow
                label="Fällige Wiederholungen erledigen"
                frequency="Priorität"
              />
              <GoalRow
                label="80% Wochenaktivität erreichen"
                frequency="Wöchentlich"
              />
            </ul>
          </section>
          <section aria-labelledby="badges-heading">
            <h2 id="badges-heading" className="text-sm font-bold">
              Deine Badges
            </h2>
            <div className="mt-3 grid gap-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.key}
                  className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm"
                >
                  <Award
                    className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
                  />
                  <span className="min-w-0 flex-1 font-medium">
                    {achievement.title}
                  </span>
                  <Badge
                    variant={achievement.unlocked ? "secondary" : "outline"}
                  >
                    {achievement.unlocked ? "Erreicht" : achievement.hint}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </div>
      </LearningAccordion>

      <p className="px-2 text-xs leading-5 text-muted-foreground">
        Der heutige Trainingsweg, das Gesprächsstudio und die Wiederholungen
        bleiben als eigene Punkte im Seitenmenü. Sie werden hier nicht doppelt
        angezeigt.
      </p>
    </div>
  );
}

function CompactMetric({
  hint,
  icon,
  label,
  tone,
  value,
}: Readonly<{
  hint: string;
  icon: React.ReactNode;
  label: string;
  tone: keyof typeof metricToneClasses;
  value: string;
}>) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-background p-3">
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5 ${metricToneClasses[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <strong className="block text-lg leading-6">{value}</strong>
        <span className="block truncate text-xs text-muted-foreground">
          {hint}
        </span>
      </span>
    </div>
  );
}

function EvidenceRow({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
      <Mic2 className="size-5 text-violet-700" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <strong className="text-lg text-violet-700">{value}</strong>
    </div>
  );
}

function GoalRow({
  frequency,
  label,
}: Readonly<{ frequency: string; label: string }>) {
  return (
    <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
      <CheckCircle2 className="size-4 text-sky-700" aria-hidden="true" />
      <span className="min-w-0 flex-1">{label}</span>
      <Badge variant="secondary">{frequency}</Badge>
    </li>
  );
}
