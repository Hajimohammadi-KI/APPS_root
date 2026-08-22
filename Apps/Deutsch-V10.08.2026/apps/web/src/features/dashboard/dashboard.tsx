"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Flame,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { grammarUnits } from "@grammar/content";
import {
  calculateDailyProgress,
  DAILY_PRACTICE_STEPS,
  getDailyPlan,
  getTodayKey,
} from "@grammar/domain";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const dayNames = ["M", "D", "M", "D", "F", "S", "S"];

function dateKey(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return getTodayKey(date);
}

export function Dashboard() {
  const { state } = useLearnerState();
  const plan = getDailyPlan(state);
  const name = state.learner.displayName.trim() || "Lernende";
  const level = state.learningLevel ?? state.learner.selfDeclaredLevel ?? "A1";
  const levelUnits = grammarUnits.filter((unit) => unit.level === level);
  const levelRecords = levelUnits
    .map((unit) => state.mastery[unit.title])
    .filter((record) => record !== undefined);
  const progressDimensions = calculateDailyProgress({
    levelTopicCount: levelUnits.length,
    coveredTopicCount: levelRecords.filter(
      (record) =>
        record.scores.recognition > 0 ||
        record.scores.writing > 0 ||
        record.scores.speaking > 0 ||
        record.scores.repair > 0 ||
        record.scores.transfer > 0,
    ).length,
    masteryScores: levelRecords.map(
      (record) =>
        (record.scores.recognition +
          record.scores.writing +
          record.scores.speaking +
          record.scores.repair +
          record.scores.transfer) /
        5,
    ),
    automaticityScore: levelRecords.length
      ? levelRecords.reduce(
          (sum, record) => sum + record.scores.automaticity,
          0,
        ) / levelRecords.length
      : 0,
  });
  const todayProgress = Math.round(
    (plan.completed.length / DAILY_PRACTICE_STEPS.length) * 100,
  );
  const week = Array.from(
    { length: 7 },
    (_, index) => state.activity[dateKey(6 - index)] ?? 0,
  );
  const hasWeekActivity = week.some((value) => value > 0);
  const chartPoints = week
    .map((value, index) => {
      const x = 8 + index * 15.3;
      const y = value > 0 ? 82 - Math.min(68, value * 12) : 82;
      return `${x},${y}`;
    })
    .join(" ");
  const streak = (() => {
    let count = 0;
    for (let index = 0; index < 60; index += 1) {
      if ((state.activity[dateKey(index)] ?? 0) > 0) count += 1;
      else break;
    }
    return count;
  })();
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= Date.now(),
  ).length;
  const automatic = levelRecords.filter(
    (record) => record.status === "automatic",
  ).length;
  const speakingAttempts = state.attempts.filter(
    (attempt) => attempt.mode === "speaking",
  );
  const speakingAccuracy = speakingAttempts.length
    ? Math.round(
        speakingAttempts.reduce(
          (sum, attempt) => sum + attempt.accuracyScore,
          0,
        ) / speakingAttempts.length,
      )
    : 0;

  const courses = [
    {
      title: "Deutschen Wortschatz erweitern",
      detail: `${level} · ${dueReviews} Wiederholungen fällig`,
      tone: "rose",
      href: "/ressourcen",
      icon: BookOpen,
    },
    {
      title: "Starke Grammatik aufbauen",
      detail: `${levelRecords.length} von ${levelUnits.length} Themen begonnen`,
      tone: "lavender",
      href: "/grammatik",
      icon: Target,
    },
    {
      title: "Alltagsgespräche sicher meistern",
      detail: `${speakingAttempts.length} Sprechproben gespeichert`,
      tone: "peach",
      href: "/studio",
      icon: MessageCircle,
    },
  ] as const;

  return (
    <div className="home-v2">
      <header className="home-v2-heading">
        <div>
          <p className="home-v2-eyebrow">
            <Sparkles aria-hidden="true" /> Persönliches Lern-Dashboard
          </p>
          <h1>Willkommen, {name}</h1>
          <p>
            Kleine, messbare Übungen machen Deutsch zu einer sicheren
            Fertigkeit.
          </p>
        </div>
        <div className="home-v2-tools" aria-label="Werkzeuge des Dashboards">
          <Link aria-label="Lernmaterial durchsuchen" href="/ressourcen">
            <Search />
          </Link>
          <Link aria-label="Wiederholungen öffnen" href="/wiederholungen">
            <Bell />
            <span className="home-v2-dot" />
          </Link>
          <Link className="home-v2-profile" href="/einstellungen">
            <span>{name.slice(0, 1).toUpperCase()}</span>
            <strong>{name}</strong>
          </Link>
        </div>
      </header>

      <div className="home-v2-grid">
        <main className="home-v2-main">
          <section
            className="home-v2-chart-card"
            aria-labelledby="performance-title"
          >
            <div className="home-v2-card-head">
              <div>
                <p>Lernaktivität</p>
                <h2 id="performance-title">Leistungsdiagramm</h2>
              </div>
              <Link href="/fortschritt">
                Details ansehen <ArrowUpRight />
              </Link>
            </div>
            <div className="home-v2-chart-summary">
              <div>
                <strong>+{todayProgress}%</strong>
                <span>heutige Mission</span>
              </div>
              <div>
                <strong>{automatic}</strong>
                <span>automatische Themen</span>
              </div>
              <div>
                <strong>{speakingAccuracy}%</strong>
                <span>Sprechgenauigkeit</span>
              </div>
            </div>
            <div
              className="home-v2-chart-wrap"
              aria-label="Lernaktivität der letzten sieben Tage"
            >
              {hasWeekActivity ? (
                <>
                  <svg
                    viewBox="0 0 100 90"
                    preserveAspectRatio="none"
                    role="img"
                  >
                    <title>Lernaktivität der letzten sieben Tage</title>
                    {[20, 40, 60, 80].map((line) => (
                      <line key={line} x1="0" x2="100" y1={line} y2={line} />
                    ))}
                    <polyline
                      className="home-v2-chart-shadow"
                      points={chartPoints}
                    />
                    <polyline
                      className="home-v2-chart-line"
                      points={chartPoints}
                    />
                    {chartPoints.split(" ").map((point) => {
                      const [cx, cy] = point.split(",");
                      return <circle key={point} cx={cx} cy={cy} r="1.4" />;
                    })}
                  </svg>
                  <div className="home-v2-chart-days">
                    {dayNames.map((day, index) => (
                      <span key={`${day}-${index}`}>{day}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="home-v2-chart-empty">
                  Nach deiner ersten gespeicherten Übung beginnt hier dein
                  echtes Diagramm.
                </p>
              )}
            </div>
          </section>

          <section className="home-v2-lower-grid">
            <article className="home-v2-progress-card">
              <div className="home-v2-card-head">
                <div>
                  <p>Aktuelles Niveau · {level}</p>
                  <h2>Dein Lernfortschritt</h2>
                </div>
                <TrendingUp />
              </div>
              <ProgressRow
                label="Bearbeitete Themen"
                value={progressDimensions.coverage}
              />
              <ProgressRow label="Heutige Übung" value={todayProgress} />
              <ProgressRow label="Sprechgenauigkeit" value={speakingAccuracy} />
              <a className="home-v2-primary" href="/heute">
                Heutiges Training fortsetzen <ChevronRight />
              </a>
            </article>

            <article className="home-v2-focus-card">
              <div className="home-v2-card-head">
                <div>
                  <p>Lernnachweise</p>
                  <h2>Dein Fokuswert</h2>
                </div>
                <Flame />
              </div>
              <div className="home-v2-score">
                <strong>
                  {Math.round(
                    (todayProgress +
                      progressDimensions.mastery +
                      speakingAccuracy) /
                      3,
                  )}
                  %
                </strong>
                <span>ausgewogener Fortschritt</span>
              </div>
              <dl>
                <div>
                  <dt>Übung</dt>
                  <dd>{todayProgress}%</dd>
                </div>
                <div>
                  <dt>Beherrschung</dt>
                  <dd>{progressDimensions.mastery}%</dd>
                </div>
                <div>
                  <dt>Sprechen</dt>
                  <dd>{speakingAccuracy}%</dd>
                </div>
              </dl>
            </article>
          </section>
        </main>

        <aside className="home-v2-aside">
          <section className="home-v2-courses" aria-labelledby="courses-title">
            <div className="home-v2-card-head">
              <div>
                <p>Heute lernen</p>
                <h2 id="courses-title">Lernweg auswählen</h2>
              </div>
              <Link aria-label="Alle Lernwege öffnen" href="/ressourcen">
                <ArrowUpRight />
              </Link>
            </div>
            <div className="home-v2-course-list">
              {courses.map(({ title, detail, tone, href, icon: Icon }) => (
                <a
                  className={`home-v2-course home-v2-course-${tone}`}
                  key={title}
                  href={href}
                >
                  <span className="home-v2-course-icon">
                    <Icon />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  <ChevronRight />
                </a>
              ))}
            </div>
          </section>

          <section className="home-v2-rhythm">
            <div className="home-v2-card-head">
              <div>
                <p>Beständigkeit</p>
                <h2>{streak}-Tage-Rhythmus</h2>
              </div>
              <CalendarDays />
            </div>
            <div className="home-v2-week">
              {week.map((value, index) => (
                <span className={value > 0 ? "is-active" : ""} key={index}>
                  {dayNames[index]}
                </span>
              ))}
            </div>
            <p>
              {dueReviews
                ? `${dueReviews} Wiederholung${dueReviews === 1 ? " ist" : "en sind"} heute fällig.`
                : "Keine dringende Wiederholung wartet. Halte deinen Rhythmus."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProgressRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="home-v2-progress-row">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="home-v2-progress-track">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
