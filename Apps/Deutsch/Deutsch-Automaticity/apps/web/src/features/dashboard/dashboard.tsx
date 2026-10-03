"use client";
import { useEffect, useState } from "react";
import {
  watchDailyDashboard,
  type DailyDashboard,
} from "@automaticity/learning-core/automaticity";
import { AutomaticityEvidenceSummary } from "@/features/progress/automaticity-evidence-summary";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { grammarUnits } from "@grammar/content";
import { calculateDailyProgress } from "@grammar/domain";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const dayNames = ["S", "M", "D", "M", "D", "F", "S"];

export function Dashboard() {
  const { state } = useLearnerState();
  const [daily, setDaily] = useState<DailyDashboard | null>(null);
  useEffect(() => watchDailyDashboard("de", setDaily), []);
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
  const todayProgress = daily?.percentage ?? null;
  const week = daily?.week.map((day) => day.count) ?? Array<number>(7).fill(0);
  const hasWeekActivity = week.some((value) => value > 0);
  const chartPoints = week
    .map((value, index) => {
      const x = 8 + index * 15.3;
      const y = value > 0 ? 82 - Math.min(68, value * 12) : 82;
      return `${x},${y}`;
    })
    .join(" ");
  const streak = daily?.streak ?? 0;
  const dueReviews = daily?.dueReviews ?? 0;
  const continueReason = daily?.paused
    ? "Dein Lernplan ist pausiert. Öffne ihn, wenn du bereit bist, weiterzuüben."
    : "Setze bei deinen gespeicherten Antworten fort. Fehlerkorrektur und fällige Wiederholungen haben Vorrang vor neuem Stoff.";
  const automatic = levelRecords.filter(
    (record) => record.status === "automatic",
  ).length;
  const speakingAttempts = state.attempts.filter(
    (attempt) => attempt.mode === "speaking" && attempt.verified === true,
  );
  const speakingAccuracy = speakingAttempts.length
    ? Math.round(
        speakingAttempts.reduce(
          (sum, attempt) => sum + attempt.accuracyScore,
          0,
        ) / speakingAttempts.length,
      )
    : null;

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

      <section
        className="home-v2-continue"
        aria-labelledby="continue-plan-title"
      >
        <div>
          <p>Empfohlener nächster Schritt</p>
          <h2 id="continue-plan-title">Meinen Plan fortsetzen</h2>
          <span>{continueReason}</span>
        </div>
        <Link href="/practice">
          Meinen Plan fortsetzen <ChevronRight />
        </Link>
      </section>

      <div className="home-v2-grid">
        {/* AppShell stellt bereits die Hauptregion bereit; dieser Container dient nur dem Dashboard-Raster. */}
        <div className="home-v2-main">
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
                <strong>
                  {todayProgress === null ? "—" : `${todayProgress}%`}
                </strong>
                <span>tägliches Antwortziel · Übungsaktivität</span>
              </div>
              <div>
                <strong>{automatic}</strong>
                <span>bisherige Übungsschwellen erreicht</span>
              </div>
              <div>
                <strong>
                  {speakingAccuracy === null ? "N/A" : `${speakingAccuracy}%`}
                </strong>
                <span>geprüfte Transkriptgenauigkeit</span>
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
                    {daily?.week.map((day) => (
                      <span key={day.date} title={day.date}>
                        {dayNames[day.weekday]}
                      </span>
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
                  <p>Gewähltes Übungsniveau · {level}</p>
                  <h2>Dein Lernfortschritt</h2>
                </div>
                <TrendingUp />
              </div>
              <ProgressRow
                label="Bearbeitete Themen"
                value={progressDimensions.coverage}
              />
              <ProgressRow
                label="Tägliches Antwortziel"
                value={todayProgress}
              />
              {speakingAccuracy === null ? (
                <p>Transkriptgenauigkeit noch nicht geprüft.</p>
              ) : (
                <ProgressRow
                  label="Geprüfte Transkriptgenauigkeit"
                  value={speakingAccuracy}
                />
              )}
              {/* Automatische Übungssignale dürfen nicht wie ein Lehrkrafturteil aussehen. */}
              <div className="home-v2-evidence-legend" role="note">
                <span>
                  <strong>Automatische Übungssignale</strong> Aktivität,
                  Genauigkeit und App-Prüfungen.
                </span>
                <span>
                  <strong>Durch Lehrkraft bestätigte Beherrschung</strong> Auf
                  diesem Gerät nicht erfasst.
                </span>
              </div>
            </article>

            <AutomaticityEvidenceSummary />
          </section>
        </div>

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
                <h2>
                  {streak}-{streak === 1 ? "Tag" : "Tage"}-Rhythmus
                </h2>
              </div>
              <CalendarDays />
            </div>
            <div className="home-v2-week">
              {daily?.week.map((day) => (
                <span
                  className={day.count > 0 ? "is-active" : ""}
                  key={day.date}
                  title={day.date}
                >
                  {dayNames[day.weekday]}
                </span>
              ))}
            </div>
            <p>
              {daily?.repairs
                ? `${daily.repairs} gespeicherte Antwort${daily.repairs === 1 ? " benötigt" : "en benötigen"} eine Korrektur.`
                : dueReviews
                  ? `${dueReviews} Wiederholung${dueReviews === 1 ? " ist" : "en sind"} heute fällig.`
                  : "Öffne deinen Lernweg für die nächste Übung."}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="home-v2-progress-row">
      <div>
        <span>{label}</span>
        <strong>{value === null ? "—" : `${value}%`}</strong>
      </div>
      {value !== null && (
        <div className="home-v2-progress-track">
          <span style={{ width: `${value}%` }} />
        </div>
      )}
    </div>
  );
}
