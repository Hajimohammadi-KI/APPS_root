"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  Mic2,
  MessageSquareWarning,
  Repeat2,
  Sparkles,
} from "lucide-react";

import { catalogSummary, grammarUnits } from "@grammar/content";
import {
  CEFR_LEVELS,
  calculateStreak,
  DAILY_PRACTICE_STEPS,
  errorClassLabels,
  getDailyPlan,
  getTodayKey,
  masteryStatusLabels,
  type CefrLevel,
  type ErrorClass,
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
import { QuickStartGuide } from "@/components/user-guide";
import { EffectivenessPanel } from "@/features/dashboard/effectiveness-panel";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const DASHBOARD_LOADED_AT = Date.now();

export function Dashboard() {
  const { state, hydrated } = useLearnerState();
  const plan = getDailyPlan(state);
  const completed = plan.completed.length;
  const percentage = Math.round(
    (completed / DAILY_PRACTICE_STEPS.length) * 100,
  );
  const streak = calculateStreak(state.activity);
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= DASHBOARD_LOADED_AT,
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
  const masteryRows = Object.values(state.mastery);
  const automaticTopics = masteryRows.filter(
    (mastery) => mastery.status === "automatic",
  ).length;
  const unstableTopics = masteryRows.filter(
    (mastery) => mastery.status !== "automatic",
  ).length;
  const focusMastery = todayUnit ? state.mastery[todayUnit.title] : undefined;
  const weakSpeaking = masteryRows.filter(
    (mastery) =>
      mastery.status !== "new" &&
      mastery.scores.speaking < 80 &&
      mastery.scores.writing >= mastery.scores.speaking,
  ).length;
  const weakWriting = masteryRows.filter(
    (mastery) =>
      mastery.status !== "new" &&
      mastery.scores.writing < 80 &&
      mastery.scores.speaking > mastery.scores.writing,
  ).length;
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const day = 6 - index;
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - day);
    const key = getTodayKey(date);
    return state.activity[key] ?? 0;
  });
  const weekMax = Math.max(1, ...weekActivity);
  const weeklyCompletion = Math.round(
    (weekActivity.filter((count) => count > 0).length / 7) * 100,
  );
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
      title: "Automatisierungs-Aufbau",
      hint: "5 Themen automatisieren",
    },
    {
      key: "reviews",
      unlocked: state.attempts.length > 0 && dueReviews === 0,
      title: "Review-Null",
      hint: "Alle fälligen Reviews abschließen",
    },
  ] as const;
  const groupedErrors = state.errors.reduce<
    Partial<Record<ErrorClass, number>>
  >((groups, error) => {
    if (error.repairStatus === "fixed") {
      return groups;
    }
    groups[error.errorClass] =
      (groups[error.errorClass] ?? 0) + error.occurrenceCount;
    return groups;
  }, {});
  const topErrors = Object.entries(groupedErrors)
    .map(([errorClass, count]) => ({
      errorClass: errorClass as ErrorClass,
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
  const progressStories = [
    {
      completed: plan.completed.includes(0),
      description:
        "Schreibe einen eigenen Satz aus einer realen Situation.",
      imagePosition: "left center",
      title: "Grammatik",
    },
    {
      completed: plan.completed.includes(1),
      description:
        "Lies den korrigierten Satz laut, klar und bewusst.",
      imagePosition: "center center",
      title: "Laut lesen",
    },
    {
      completed: plan.completed.includes(2),
      description:
        "Nutze die Struktur in einer kurzen Coach-Konversation.",
      imagePosition: "right center",
      title: "Coach-Gespräch",
    },
  ] as const;
  const activeStory = Math.max(
    0,
    progressStories.findIndex((story) => !story.completed),
  );
  const levelGates = CEFR_LEVELS.map((level) => {
    const levelTitles = grammarUnits
      .filter((unit) => unit.level === level)
      .map((unit) => unit.title);
    const titleSet = new Set(levelTitles);
    const automaticCount = levelTitles.filter(
      (title) => state.mastery[title]?.status === "automatic",
    ).length;
    const totalTopics = levelTitles.length;
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
    const speaking = successful.filter(
      (attempt) => attempt.mode === "speaking",
    ).length;
    const writing = successful.filter(
      (attempt) => attempt.mode === "writing",
    ).length;
    const transfer = successful.filter(
      (attempt) => attempt.mode === "transfer",
    ).length;
    const minimumSamples = Math.max(6, Math.ceil(totalTopics * 0.5));
    const requirements = [
      {
        label: `Automatisierte Themen ${automaticCount}/${totalTopics}`,
        done: automaticCount === totalTopics,
      },
      {
        label: `Aktive kritische Fehler ${activeCriticalErrors}`,
        done: activeCriticalErrors === 0,
      },
      {
        label: `Sprech-Nachweise ${speaking}/${minimumSamples}`,
        done: speaking >= minimumSamples,
      },
      {
        label: `Schreib-Nachweise ${writing}/${minimumSamples}`,
        done: writing >= minimumSamples,
      },
      {
        label: `Transfer-Nachweise ${transfer}/${minimumSamples}`,
        done: transfer >= minimumSamples,
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

  return (
    <div className="space-y-6">
      <section className="dashboard-hero">
        <Image
          src="/assets/automaticity-journey-hero.png"
          alt="Eine Lernende entwickelt sich vom Grammatiklernen über das Sprechen bis zur sicheren Präsentation"
          fill
          priority
          sizes="(max-width: 860px) 100vw, 1240px"
          className="dashboard-hero-image"
        />
        <div className="dashboard-hero-shade" />
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-kicker">
            <Sparkles aria-hidden="true" className="size-4" />
            Dein täglicher Weg zu automatischem Deutsch
          </span>
          <h1>Sicher und automatisch sprechen</h1>
          <p>
            Gehe vom Wissen über die Regel zur natürlichen Anwendung – beim
            Schreiben, Sprechen, Reparieren und freien Übertragen.
          </p>
          <div className="dashboard-hero-actions">
            <Button
              nativeButton={false}
              size="lg"
              render={<Link href="/heute" />}
            >
              Heutigen Pfad starten
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              render={<Link href="/heute" />}
            >
              30-Minuten-Session starten
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="dashboard-hero-secondary"
              render={<Link href="/studio" />}
            >
              Gesprächsstudio öffnen
            </Button>
          </div>
          <div className="dashboard-hero-proof">
            <span>
              <strong>{state.learner.selfDeclaredLevel ?? "–"}</strong> gewählt
            </span>
            <span>
              <strong>{state.learner.verifiedLevel ?? "–"}</strong> nachgewiesen
            </span>
            <span>
              <strong>{catalogSummary.grammarUnitCount}</strong> Grammatikthemen
            </span>
            <span>
              <strong>{catalogSummary.topicCount}</strong> Sprechthemen
            </span>
            <span>
              <strong>{DAILY_PRACTICE_STEPS.length}</strong> Evidenz-Gates
            </span>
          </div>
        </div>
        <div className="dashboard-hero-progress space-y-4 rounded-3xl border border-white/40 bg-white/80 p-5 text-slate-950 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
              Weiter machen
            </span>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <strong className="block text-3xl">{percentage}%</strong>
                <small className="text-slate-500">
                  {completed} von {DAILY_PRACTICE_STEPS.length} Aufgaben
                  erledigt
                </small>
              </div>
              <Badge variant="secondary">{todayUnit?.level ?? "A1"}</Badge>
            </div>
          </div>
          <Progress
            value={percentage}
            aria-label={`Heutiger Weg ${percentage} Prozent abgeschlossen`}
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Heutiger Fokus
              </span>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {todayUnit?.title ?? "Niveau wählen, um zu beginnen"}
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nächste Aktion
              </span>
              <p className="mt-1 text-sm font-medium text-slate-900">
                Noch {Math.max(1, DAILY_PRACTICE_STEPS.length - completed)}{" "}
                Schritt
                {DAILY_PRACTICE_STEPS.length - completed === 1 ? "" : "e"} oder
                direkt 30 Minuten starten.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EffectivenessPanel />

      {!state.learner.selfDeclaredLevel || state.attempts.length === 0 ? (
        <QuickStartGuide />
      ) : null}

      <section
        className="progress-story"
        aria-labelledby="progress-story-title"
      >
        <div className="progress-story-heading">
          <div>
            <span>Dein visueller Fortschritt</span>
            <h2 id="progress-story-title">Vom Abruf zum sicheren Sprechen</h2>
          </div>
          <div className="progress-story-total">
            <strong>{percentage}%</strong>
            <span>heute abgeschlossen</span>
          </div>
        </div>
        <div className="progress-story-grid">
          {progressStories.map((story, index) => {
            const status = story.completed
              ? "complete"
              : index === activeStory
                ? "current"
                : "locked";

            return (
              <article
                key={story.title}
                className="progress-story-card"
                data-status={status}
              >
                <div className="progress-story-image">
                  <Image
                    src="/assets/automaticity-progress-story.png"
                    alt={`${story.title}: Etappe des Automatisierungswegs`}
                    fill
                    sizes="(max-width: 700px) 100vw, 33vw"
                    style={{ objectPosition: story.imagePosition }}
                  />
                  <span className="progress-story-number">{index + 1}</span>
                </div>
                <div className="progress-story-body">
                  <div>
                    <h3>{story.title}</h3>
                    <p>{story.description}</p>
                  </div>
                  <span className="progress-story-status">
                    {status === "complete" ? (
                      <CheckCircle2 aria-hidden="true" className="size-4" />
                    ) : status === "current" ? (
                      <Sparkles aria-hidden="true" className="size-4" />
                    ) : (
                      <LockKeyhole aria-hidden="true" className="size-4" />
                    )}
                    {status === "complete"
                      ? "Abgeschlossen"
                      : status === "current"
                        ? "In Arbeit"
                        : "Als Nächstes"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="overview-heading">
        <div className="mb-3">
          <p className="section-kicker">Aktueller Status</p>
          <h2 id="overview-heading" className="section-title">
            Dein Dashboard
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<CheckCircle2 />}
            label="Automatisiert"
            value={hydrated ? String(automaticTopics) : "–"}
            hint="Alle Nachweise erfüllt"
            tone="sky"
          />
          <MetricCard
            icon={<AlertTriangle />}
            label="Instabil"
            value={hydrated ? String(unstableTopics) : "–"}
            hint="Noch nicht automatisch"
            tone="amber"
          />
          <MetricCard
            icon={<Repeat2 />}
            label="Heute fällig"
            value={hydrated ? String(dueReviews) : "–"}
            hint="Themen und Reparaturen"
            tone="blue"
          />
          <MetricCard
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
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="size-5" />
              Schreiben & Sprechen getrennt
            </CardTitle>
            <CardDescription>
              Ein starker schriftlicher Wert ersetzt keinen mündlichen Nachweis.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ScoreSummary label="Sprechen schwach" value={weakSpeaking} />
            <ScoreSummary label="Schreiben schwach" value={weakWriting} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="size-5" />
              Top-3 wiederkehrende Fehler
            </CardTitle>
            <CardDescription>
              Häufigkeit aus aktiven persönlichen Reparaturschleifen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topErrors.length > 0 ? (
              <ol className="grid gap-2">
                {topErrors.map((error, index) => (
                  <li
                    key={error.errorClass}
                    className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
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
              <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                Noch keine aktiven Fehler. Neue Korrekturen werden im Studio
                automatisch klassifiziert.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {activeGate ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="size-5" />
              Level-Progress-Gate
            </CardTitle>
            <CardDescription>
              Ein Niveau wird erst nachgewiesen, wenn alle
              Automatisierungsbedingungen erfüllt sind.
            </CardDescription>
            <div className="pt-2">
              <Badge variant={activeGate.ready ? "secondary" : "outline"}>
                {activeGate.level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {activeGate.requirements.map((requirement) => (
              <div
                key={requirement.label}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm"
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
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Wochenmissionen</CardTitle>
          <CardDescription>
            Kurze Aufgaben wie in den besten Lern-Apps: konsistent, klar,
            messbar.
          </CardDescription>
          <div className="pt-2">
            <Badge variant="secondary">{weeklyCompletion}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekActivity.map((count, index) => (
              <div
                key={`${index}-${count}`}
                className="rounded-lg border bg-background px-2 py-3 text-center"
              >
                <div
                  className="mx-auto h-8 w-2 rounded-full bg-sky-100"
                  style={{
                    transform: `scaleY(${Math.max(0.2, count / weekMax)})`,
                    transformOrigin: "bottom",
                  }}
                />
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>

          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <BookOpen className="size-4 text-sky-700" />
              <span className="min-w-0 flex-1">1 Grammatik-Checkpoint</span>
              <Badge variant="secondary">Täglich</Badge>
            </li>
            <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <Mic2 className="size-4 text-violet-700" />
              <span className="min-w-0 flex-1">1 Antwort laut sprechen</span>
              <Badge variant="secondary">Täglich</Badge>
            </li>
            <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <Repeat2 className="size-4 text-blue-700" />
              <span className="min-w-0 flex-1">Fällige Reviews erledigen</span>
              <Badge variant="outline">Priorität</Badge>
            </li>
            <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <Gauge className="size-4 text-amber-700" />
              <span className="min-w-0 flex-1">
                80% Wochenaktivität erreichen
              </span>
              <Badge variant="secondary">Wöchentlich</Badge>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Heutiger Automatik-Zyklus</CardTitle>
            <CardDescription>
              Abruf → Sprechen → Korrektur → Reparatur → Transfer → Wiederholung
            </CardDescription>
            <div className="pt-2">
              <Badge variant="secondary">{percentage} %</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={percentage}
              aria-label={`Tagesfortschritt: ${percentage} Prozent`}
            />
            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {DAILY_PRACTICE_STEPS.slice(0, 4).map((step, index) => (
                <li
                  key={step.id}
                  className="flex items-start gap-3 rounded-xl border bg-background p-3"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      plan.completed.includes(index)
                        ? "bg-sky-600 text-white"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {plan.completed.includes(index) ? "✓" : index + 1}
                  </span>
                  <span>
                    <span className="block font-medium">{step.label}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-900/10 bg-blue-50/70 shadow-sm">
          <CardHeader>
            <CardTitle>Nächste 3 Aufgaben</CardTitle>
            <CardDescription>
              {todayUnit?.title ?? "Heutige Grammatik"} · {dueReviews}{" "}
              Wiederholung{dueReviews === 1 ? "" : "en"} fällig
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickTask
              href="/grammatik"
              icon={<BookOpen />}
              label="Heutige Grammatik öffnen"
              hint="Regel ohne Nachschlagen abrufen"
            />
            <QuickTask
              href="/studio"
              icon={<Mic2 />}
              label="Mit dem Coach sprechen"
              hint="Zielgrammatik verwenden"
            />
            <QuickTask
              href="/wiederholungen"
              icon={<Repeat2 />}
              label="Fällige Wiederholungen"
              hint="Langfristige Automatik aufbauen"
            />

            <div className="mt-2 rounded-xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
                Deine Badges
              </p>
              <div className="mt-2 grid gap-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.key}
                    className="flex items-center gap-2 rounded-lg border p-2 text-sm"
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
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-2xl border bg-card px-5 py-4 text-center text-sm italic text-muted-foreground shadow-sm">
        „Kleine Schritte jeden Tag führen zu sicherem, automatischem Sprechen.“
      </p>

      <p className="text-center text-xs text-muted-foreground">
        {catalogSummary.grammarUnitCount} Grammatikthemen ·{" "}
        {catalogSummary.topicCount} Gesprächsthemen ·{" "}
        {state.settings.showStreaks
          ? `Lernserie ${streak} Tage`
          : "flexible Kontinuität"}{" "}
        · {state.errors.length} Fehlerdatensätze · offline verfügbar
      </p>
    </div>
  );
}

const metricToneClasses = {
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  tone: keyof typeof metricToneClasses;
}>) {
  return (
    <Card size="sm" className="shadow-sm">
      <CardContent className="flex items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5 ${metricToneClasses[tone]}`}
        >
          {icon}
        </span>
        <span>
          <span className="block text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <strong className="mt-0.5 block text-lg leading-6">{value}</strong>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function QuickTask({
  href,
  icon,
  label,
  hint,
}: Readonly<{
  href: "/grammatik" | "/studio" | "/wiederholungen";
  icon: React.ReactNode;
  label: string;
  hint: string;
}>) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors hover:border-primary/30 hover:bg-sky-50/40"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700 [&>svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{label}</strong>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function ScoreSummary({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-xl border bg-muted/35 p-3">
      <strong className="block text-2xl text-primary">{value}</strong>
      <span className="mt-1 block text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
