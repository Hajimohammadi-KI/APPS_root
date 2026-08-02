"use client";

import Image from "next/image";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  MessageSquareWarning,
  Mic2,
  Repeat2,
  Sparkles,
} from "lucide-react";
import { type CefrLevel, grammarUnits } from "@grammar/content";
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
import { EffectivenessPanel } from "@/features/components/effectiveness-panel";
import { currentDailyPlan, useAppStore } from "@/features/store/app-store";
import { QuickStartGuide } from "@/features/user-guide";

const errorClassLabels: Record<string, string> = {
  agreement: "Agreement",
  article: "Articles",
  auxiliary: "Auxiliaries",
  case: "Case",
  ending: "Word ending",
  other: "Other",
  spelling: "Spelling",
  tense: "Tense",
  word_order: "Word order",
};

const metricToneClasses = {
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
} as const;

const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function dateKey(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DashboardScreen({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const { state } = useAppStore();
  const plan = currentDailyPlan(state);
  const progress = Math.round((plan.completed.length / 3) * 100);
  const dueReviews = state.reviews.filter(
    (review) => review.status === "pending" && review.dueAt <= Date.now(),
  ).length;
  const masteryRows = Object.values(state.mastery);
  const automaticTopics = masteryRows.filter(
    (mastery) => mastery.status === "automatic",
  ).length;
  const unstableTopics = masteryRows.filter(
    (mastery) => mastery.status !== "automatic",
  ).length;
  const weakSpeaking = masteryRows.filter(
    (mastery) =>
      mastery.status !== "new" &&
      mastery.speakingScore < 80 &&
      mastery.writingScore >= mastery.speakingScore,
  ).length;
  const weakWriting = masteryRows.filter(
    (mastery) =>
      mastery.status !== "new" &&
      mastery.writingScore < 80 &&
      mastery.speakingScore > mastery.writingScore,
  ).length;
  const groupedErrors = state.errors.reduce<Record<string, number>>(
    (groups, error) => {
      if (error.repairStatus === "fixed") return groups;
      groups[error.errorClass] =
        (groups[error.errorClass] ?? 0) + error.occurrenceCount;
      return groups;
    },
    {},
  );
  const topErrors = Object.entries(groupedErrors)
    .map(([errorClass, count]) => ({ errorClass, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
  const streak = (() => {
    let days = 0;
    for (let i = 0; i < 70; i += 1) {
      if (state.activity[dateKey(i)]) days += 1;
      else break;
    }
    return days;
  })();
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const key = dateKey(6 - index);
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
      title: "Consistency Starter",
      hint: "Reach a 3-day streak",
    },
    {
      key: "automaticity",
      unlocked: automaticTopics >= 5,
      title: "Automaticity Builder",
      hint: "Master 5 topics",
    },
    {
      key: "reviews",
      unlocked: state.attempts.length > 0 && dueReviews === 0,
      title: "Review Zero",
      hint: "Clear all due reviews",
    },
  ] as const;
  const progressStories = [
    {
      completed: plan.completed.includes(0),
      description: "Write a personal sentence from a real situation.",
      imagePosition: "left center",
      title: "Grammar",
    },
    {
      completed: plan.completed.includes(1),
      description: "Read the corrected sentence aloud to build speaking memory.",
      imagePosition: "center center",
      title: "Read aloud",
    },
    {
      completed: plan.completed.includes(2),
      description: "Use the structure in a short coached conversation.",
      imagePosition: "right center",
      title: "Coach conversation",
    },
  ];
  const activeStory = Math.max(
    0,
    progressStories.findIndex((story) => !story.completed),
  );
  const levelGates = CEFR_ORDER.map((level) => {
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
        titleSet.has(error.grammarTitle) &&
        error.repairStatus !== "fixed" &&
        error.errorClass !== "spelling",
    ).length;
    const successful = state.attempts.filter(
      (attempt) =>
        titleSet.has(attempt.grammarTitle) &&
        attempt.verified === true &&
        attempt.passed,
    );
    const speaking = successful.filter((attempt) => attempt.mode === "speaking").length;
    const writing = successful.filter((attempt) => attempt.mode === "writing").length;
    const transfer = successful.filter(
      (attempt) => attempt.mode === "transfer" || attempt.mode === "timed",
    ).length;
    const minimumSamples = Math.max(6, Math.ceil(totalTopics * 0.5));
    const requirements = [
      {
        label: `Automatic topics ${automaticCount}/${totalTopics}`,
        done: automaticCount === totalTopics,
      },
      {
        label: `Active critical errors ${activeCriticalErrors}`,
        done: activeCriticalErrors === 0,
      },
      {
        label: `Speaking evidence ${speaking}/${minimumSamples}`,
        done: speaking >= minimumSamples,
      },
      {
        label: `Writing evidence ${writing}/${minimumSamples}`,
        done: writing >= minimumSamples,
      },
      {
        label: `Transfer evidence ${transfer}/${minimumSamples}`,
        done: transfer >= minimumSamples,
      },
    ] as const;
    return {
      level,
      ready: requirements.every((requirement) => requirement.done),
      requirements,
    };
  });
  const activeGate =
    levelGates.find((gate) => gate.level === state.learner.selfDeclaredLevel) ??
    levelGates.find((gate) => !gate.ready) ??
    levelGates[levelGates.length - 1];
  const todayUnit =
    grammarUnits.find(
      (unit) =>
        state.todayGrammar?.date === dateKey(0) &&
        unit.title === state.todayGrammar.title,
    ) ??
    (state.learner.selfDeclaredLevel
      ? grammarUnits.find((unit) => unit.level === state.learner.selfDeclaredLevel)
      : undefined);

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <Image
          alt="A learner moving from grammar drills to confident speaking"
          className="dashboard-hero-image"
          fill
          priority
          sizes="(max-width: 860px) 100vw, 1240px"
          src="/automaticity-journey-hero.png"
        />
        <div className="dashboard-hero-shade" />
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-kicker">
            <Sparkles aria-hidden className="size-4" />
            Your daily route to automatic English
          </span>
          <h1>Use English confidently and automatically</h1>
          <p>
            Turn rule knowledge into natural usage in writing, conversation,
            error repair, and real-life transfer.
          </p>
          <div className="dashboard-hero-actions">
            <Button onClick={() => navigate("daily")} size="lg">
              Start today's path
              <ArrowRight aria-hidden className="size-4" />
            </Button>
            <Button
              onClick={() => navigate("daily")}
              size="lg"
              variant="outline"
            >
              Start 30-minute session
            </Button>
            <Button
              className="dashboard-hero-secondary"
              onClick={() => navigate("studio")}
              size="lg"
              variant="outline"
            >
              Open Conversation Studio
            </Button>
          </div>
          <div className="dashboard-hero-proof">
            <span>
              <strong>{state.learner.selfDeclaredLevel ?? "—"}</strong>{" "}
              selected level
            </span>
            <span>
              <strong>{state.learner.verifiedLevel ?? "—"}</strong>{" "}
              verified level
            </span>
            <span>
              <strong>{grammarUnits.length}</strong> grammar units
            </span>
            <span>
              <strong>72</strong> conversation topics
            </span>
            <span>
              <strong>3</strong> daily steps
            </span>
          </div>
        </div>
        <div className="dashboard-hero-progress space-y-4 rounded-3xl border border-white/40 bg-white/80 p-5 text-slate-950 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-500">
              Continue now
            </span>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <strong className="block text-3xl">{progress}%</strong>
                <small className="text-slate-500">
                  {plan.completed.length} of 3 tasks completed
                </small>
              </div>
              <Badge variant="secondary">{todayUnit?.level ?? "A1"}</Badge>
            </div>
          </div>
          <Progress value={progress} aria-label={`Today's learning path ${progress} percent complete`} />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Today's focus
              </span>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {todayUnit?.title ?? "Choose a level to begin"}
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-3">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Next action
              </span>
              <p className="mt-1 text-sm font-medium text-slate-900">
                Finish {Math.max(1, 3 - plan.completed.length)} step
                {3 - plan.completed.length === 1 ? "" : "s"} or start the 30-minute session.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EffectivenessPanel navigate={navigate} />

      {!state.learner.selfDeclaredLevel || state.attempts.length === 0 ? (
        <QuickStartGuide navigate={navigate} />
      ) : null}

      <section aria-labelledby="overview-heading">
        <div className="mb-3">
          <p className="section-kicker">Live Learning Status</p>
          <h2 id="overview-heading" className="section-title">
            Your dashboard
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<CheckCircle2 />}
            label="Automated"
            value={String(automaticTopics)}
            hint="All evidence gates passed"
            tone="sky"
          />
          <MetricCard
            icon={<AlertTriangle />}
            label="Unstable"
            value={String(unstableTopics)}
            hint="Needs more retrieval cycles"
            tone="amber"
          />
          <MetricCard
            icon={<Repeat2 />}
            label="Due now"
            value={String(dueReviews)}
            hint="Reviews and repairs"
            tone="blue"
          />
          <MetricCard
            icon={<Gauge />}
            label="Weekly momentum"
            value={`${weeklyCompletion}%`}
            hint="Active days in last 7"
            tone="violet"
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="size-5" />
              Market-style skill balance
            </CardTitle>
            <CardDescription>
              Strong writing cannot replace verified speaking.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <ScoreSummary label="Speaking risk" value={weakSpeaking} />
            <ScoreSummary label="Writing risk" value={weakWriting} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareWarning className="size-5" />
              Top recurring errors
            </CardTitle>
            <CardDescription>
              Prioritized from active repair loops.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topErrors.length > 0 ? (
              <ol className="grid gap-2">
                {topErrors.map((error, index) => (
                  <li
                    className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                    key={error.errorClass}
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-xs font-semibold text-amber-900">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 font-medium">
                      {errorClassLabels[error.errorClass] ?? "Other"}
                    </span>
                    <Badge variant="secondary">{error.count}x</Badge>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
                No active recurring errors. New corrections will be added
                automatically.
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
              Level progress gate
            </CardTitle>
            <CardDescription>
              A level is verified only when all automaticity requirements are complete.
            </CardDescription>
            <div className="pt-2">
              <Badge variant={activeGate.ready ? "success" : "warning"}>
                {activeGate.level}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {activeGate.requirements.map((requirement) => (
              <div
                className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                key={requirement.label}
              >
                <CheckCircle2
                  className={`size-4 ${requirement.done ? "text-emerald-600" : "text-muted-foreground"}`}
                />
                <span className="min-w-0 flex-1">{requirement.label}</span>
                <Badge variant={requirement.done ? "success" : "warning"}>
                  {requirement.done ? "Done" : "Open"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Weekly mission board</CardTitle>
            <CardDescription>
              Keep your pace with short, market-style missions.
            </CardDescription>
            <div className="pt-2">
              <Badge variant="secondary">{weeklyCompletion}%</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {weekActivity.map((count, index) => (
                <div
                  className="rounded-md border bg-background p-2 text-center"
                  key={`${index}-${count}`}
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
            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
                <BookOpen className="size-4 text-sky-700" />
                <span className="min-w-0 flex-1">
                  Finish one grammar checkpoint
                </span>
                <Badge variant="secondary">Daily</Badge>
              </li>
              <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
                <Mic2 className="size-4 text-violet-700" />
                <span className="min-w-0 flex-1">
                  Record one spoken answer
                </span>
                <Badge variant="secondary">Daily</Badge>
              </li>
              <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
                <Repeat2 className="size-4 text-blue-700" />
                <span className="min-w-0 flex-1">
                  Clear due reviews
                </span>
                <Badge variant="warning">Priority</Badge>
              </li>
              <li className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
                <Gauge className="size-4 text-amber-700" />
                <span className="min-w-0 flex-1">
                  Reach 80% weekly activity
                </span>
                <Badge variant="secondary">Weekly</Badge>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="border-blue-900/10 bg-blue-50/70 shadow-sm">
          <CardHeader>
            <CardTitle>Quick launch</CardTitle>
            <CardDescription>
              Recommended flow used by top language apps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickTask
              hint="Recall and controlled practice"
              icon={<BookOpen />}
              label="Open grammar lab"
              onClick={() => navigate("grammar")}
            />
            <QuickTask
              hint="Target grammar in natural speech"
              icon={<Mic2 />}
              label="Open conversation studio"
              onClick={() => navigate("studio")}
            />
            <QuickTask
              hint="Repair recurring mistakes"
              icon={<Repeat2 />}
              label="Open error workshop"
              onClick={() => navigate("errors")}
            />

            <div className="mt-3 rounded-xl border bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">
                Achievement badges
              </p>
              <div className="mt-2 grid gap-2">
                {achievements.map((achievement) => (
                  <div
                    className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                    key={achievement.key}
                  >
                    <Award
                      className={`size-4 ${achievement.unlocked ? "text-amber-600" : "text-muted-foreground"}`}
                    />
                    <span className="min-w-0 flex-1 font-medium">
                      {achievement.title}
                    </span>
                    <Badge variant={achievement.unlocked ? "success" : "secondary"}>
                      {achievement.unlocked ? "Unlocked" : achievement.hint}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section
        className="progress-story"
        aria-labelledby="progress-story-title"
      >
        <div className="progress-story-heading">
          <div>
            <span>Your visible progress</span>
            <h2 id="progress-story-title">From recall to confident speaking</h2>
          </div>
          <div className="progress-story-total">
            <strong>{progress}%</strong>
            <span>completed today</span>
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
                className="progress-story-card"
                data-status={status}
                key={story.title}
              >
                <div className="progress-story-image">
                  <Image
                    alt={`${story.title}: automaticity path stage`}
                    fill
                    sizes="(max-width: 700px) 100vw, 33vw"
                    src="/automaticity-progress-story.png"
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
                      <CheckCircle2 aria-hidden className="size-4" />
                    ) : status === "current" ? (
                      <Sparkles aria-hidden className="size-4" />
                    ) : (
                      <LockKeyhole aria-hidden className="size-4" />
                    )}
                    {status === "complete"
                      ? "Completed"
                      : status === "current"
                        ? "In progress"
                        : "Next"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {grammarUnits.length} grammar units · 72 conversation topics · streak {streak} day{streak === 1 ? "" : "s"} · {state.errors.length} error records · offline-ready
      </p>
    </div>
  );
}

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
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3 pt-5">
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

function QuickTask({
  icon,
  label,
  hint,
  onClick,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}>) {
  return (
    <button
      className="flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition-colors hover:border-primary/30 hover:bg-sky-50/40"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-sky-100 text-sky-700 [&>svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm">{label}</strong>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </button>
  );
}
