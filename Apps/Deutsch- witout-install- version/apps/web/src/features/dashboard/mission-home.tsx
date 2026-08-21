"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Mic2,
  PenLine,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { DAILY_PRACTICE_STEPS, getDailyPlan } from "@grammar/domain";
import { DailyAutomaticityProgram } from "@/features/daily-program/daily-automaticity-program";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export function MissionHome() {
  const { state } = useLearnerState();
  const plan = getDailyPlan(state);
  const name = state.learner.displayName.trim() || "Lernende";
  const level = state.learningLevel ?? state.learner.selfDeclaredLevel ?? "A1";
  const selectedUnit = state.todayGrammar
    ? grammarUnits.find((unit) => unit.title === state.todayGrammar?.title)
    : grammarUnits.find((unit) => unit.level === level);
  const targetTitle = selectedUnit?.title ?? "Verb sein: bin/bist/ist";
  const targetLevel = selectedUnit?.level ?? level;
  const progress = Math.round(
    (plan.completed.length / DAILY_PRACTICE_STEPS.length) * 100,
  );
  const dueReviews = state.reviews.filter(
    (review) => !review.mastered && review.due <= Date.now(),
  ).length;
  const repairItems = state.errors
    .filter((item) => item.repairStatus !== "fixed")
    .sort((left, right) => right.occurrenceCount - left.occurrenceCount)
    .slice(0, 3);
  const verifiedSpeaking = state.attempts.filter(
    (attempt) => attempt.mode === "speaking" && attempt.verified,
  ).length;
  const verifiedWriting = state.attempts.filter(
    (attempt) => attempt.mode === "writing" && attempt.verified,
  ).length;
  const verifiedTransfer = state.attempts.filter(
    (attempt) => attempt.mode === "transfer" && attempt.verified,
  ).length;

  return (
    <div className="mission-home">
      <header className="mission-home__greeting">
        <div>
          <p className="mission-home__eyebrow">Dein Automatik-Arbeitsbereich</p>
          <h1>Guten Morgen, {name}</h1>
          <p>
            Baue präzises, selbstsicheres Deutsch über einen klaren Lernpfad
            auf.
          </p>
        </div>
        <Link className="mission-home__focus-button" href="/grammatik">
          <Target aria-hidden /> Fokus ändern
        </Link>
      </header>

      <section className="mission-home__hero" aria-labelledby="mission-title">
        <Image
          alt="Lernende übt Deutsch mit Laptop und Notizbuch"
          className="mission-home__hero-image"
          height={1024}
          priority
          sizes="(max-width: 760px) 100vw, 72vw"
          src="/learning-hero.png"
          width={1536}
        />
        <div className="mission-home__hero-copy">
          <span className="mission-home__target-label">
            <Target aria-hidden /> Heutige adaptive Mission
          </span>
          <h2 id="mission-title">
            {targetTitle} · {targetLevel}
          </h2>
          <p>
            Rufe das Muster ab, automatisiere es laut und übertrage es in einen
            neuen Kontext.
          </p>
          <div className="mission-home__meta">
            <span>
              <Clock3 aria-hidden /> ~{state.settings.dailyStudyMinutes} Minuten
            </span>
            <span>
              <Mic2 aria-hidden /> Sprechen &amp; Schreiben
            </span>
          </div>
          <Link className="mission-home__primary" href="/heute">
            Heutige Mission starten <ArrowRight aria-hidden />
          </Link>
        </div>
        <div
          className="mission-home__progress"
          aria-label={`${progress}% abgeschlossen`}
        >
          <strong>{progress}%</strong>
          <span>heute abgeschlossen</span>
        </div>
      </section>

      <DailyAutomaticityProgram />

      <section
        className="mission-home__path"
        aria-label="Dreistufiger Lernpfad"
      >
        <LearningStep
          icon={BookOpen}
          number="1"
          title="Abrufen"
          text="Aktiviere das Zielmuster und nutze es korrekt."
        />
        <LearningStep
          icon={Mic2}
          number="2"
          title="Laut automatisieren"
          text="Sprich das Muster natürlich und sicher."
        />
        <LearningStep
          icon={PenLine}
          number="3"
          title="Übertragen"
          text="Nutze es selbstständig in einem neuen Kontext."
        />
      </section>

      <div className="mission-home__lower-grid">
        <section
          className="mission-home__panel"
          aria-labelledby="repairs-title"
        >
          <div className="mission-home__panel-heading">
            <span className="mission-home__panel-icon mission-home__panel-icon--repair">
              <TriangleAlert aria-hidden />
            </span>
            <div>
              <h2 id="repairs-title">Reparaturmuster</h2>
              <p>Behalte wiederkehrende Fehler im Blick.</p>
            </div>
          </div>
          <div className="mission-home__list">
            {repairItems.length ? (
              repairItems.map((item) => (
                <Link key={item.id} href="/fehler">
                  <span>
                    <strong>{item.topic}</strong>
                    <small>{item.errorClass.replaceAll("_", " ")}</small>
                  </span>
                  <b>{item.occurrenceCount}×</b>
                  <ArrowRight aria-hidden />
                </Link>
              ))
            ) : (
              <div className="mission-home__empty">
                <CheckCircle2 aria-hidden />
                <span>
                  <strong>Keine Reparatur wartet</strong>
                  <small>Deine gespeicherten Korrekturen sind klar.</small>
                </span>
              </div>
            )}
          </div>
          <Link className="mission-home__text-link" href="/fehler">
            Reparaturliste öffnen <ArrowRight aria-hidden />
          </Link>
        </section>

        <section
          className="mission-home__panel"
          aria-labelledby="evidence-title"
        >
          <div className="mission-home__panel-heading">
            <span className="mission-home__panel-icon mission-home__panel-icon--evidence">
              <ShieldCheck aria-hidden />
            </span>
            <div>
              <h2 id="evidence-title">Geprüfte Lernnachweise</h2>
              <p>Nur unabhängig geprüfte Übungen werden angezeigt.</p>
            </div>
          </div>
          <div className="mission-home__evidence-list">
            <EvidenceRow
              icon={Mic2}
              label="Sprechen"
              value={verifiedSpeaking}
            />
            <EvidenceRow
              icon={PenLine}
              label="Schreiben"
              value={verifiedWriting}
            />
            <EvidenceRow
              icon={Target}
              label="Transfer"
              value={verifiedTransfer}
            />
          </div>
          <Link className="mission-home__text-link" href="/fortschritt">
            Lernnachweise ansehen <ArrowRight aria-hidden />
          </Link>
        </section>
      </div>

      {dueReviews > 0 ? (
        <Link className="mission-home__review-strip" href="/wiederholungen">
          <span>
            <Clock3 aria-hidden />
            <strong>
              {dueReviews} Wiederholung{dueReviews === 1 ? "" : "en"} fällig
            </strong>
          </span>
          <span>
            Vor einem neuen Thema wiederholen <ArrowRight aria-hidden />
          </span>
        </Link>
      ) : null}
    </div>
  );
}

function LearningStep({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof BookOpen;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="mission-home__step">
      <span className="mission-home__step-number">{number}</span>
      <span className="mission-home__step-icon">
        <Icon aria-hidden />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function EvidenceRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="mission-home__evidence-row">
      <span>
        <Icon aria-hidden />
      </span>
      <div>
        <strong>{label}</strong>
        <small>Geprüfte Versuche</small>
      </div>
      <b>{value}</b>
    </div>
  );
}
