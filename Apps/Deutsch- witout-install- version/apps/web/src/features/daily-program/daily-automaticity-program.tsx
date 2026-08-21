"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Gauge,
  MessagesSquare,
  Play,
  RefreshCw,
  Shuffle,
  type LucideIcon,
} from "lucide-react";
import {
  buildDailyAutomaticityProgram,
  DAILY_SESSION_OPTIONS,
  type DailyAutomaticityBlock,
  type DailyAutomaticityBlockId,
} from "@grammar/domain";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const PROGRAM_CONTENT: Record<
  DailyAutomaticityBlockId,
  {
    readonly title: string;
    readonly description: string;
    readonly href:
      | "/grammatik"
      | "/gemischtes-training"
      | "/studio"
      | "/wiederholungen"
      | "/automatik";
    readonly icon: LucideIcon;
    readonly unitSingular: string;
    readonly unitPlural: string;
  }
> = {
  grammar: {
    title: "Grammatik-Labor",
    description: "Verstehe und rufe das heutige Zielmuster aktiv ab.",
    href: "/grammatik",
    icon: BookOpenCheck,
    unitSingular: "Aufgabe",
    unitPlural: "Aufgaben",
  },
  mixed_practice: {
    title: "Gemischtes Training",
    description: "Mische alte und neue Muster ohne sichtbare Lösungshilfe.",
    href: "/gemischtes-training",
    icon: Shuffle,
    unitSingular: "Aufgabe",
    unitPlural: "Aufgaben",
  },
  conversation_studio: {
    title: "Gesprächsstudio",
    description: "Produziere das Muster laut in einem echten Kontext.",
    href: "/studio",
    icon: MessagesSquare,
    unitSingular: "Runde",
    unitPlural: "Runden",
  },
  review: {
    title: "Wiederholen & reparieren",
    description: "Rufe Fälliges ab und repariere wiederkehrende Fehler.",
    href: "/wiederholungen",
    icon: RefreshCw,
    unitSingular: "Aufgabe",
    unitPlural: "Aufgaben",
  },
  automatization: {
    title: "Automatisierungstrainer",
    description: "Baue Tempo mit Abruf, Shadowing und Transfer auf.",
    href: "/automatik",
    icon: Gauge,
    unitSingular: "Runde",
    unitPlural: "Runden",
  },
};

export function DailyAutomaticityProgram() {
  const { state, updateSettings } = useLearnerState();
  const program = buildDailyAutomaticityProgram(
    state.settings.dailyStudyMinutes,
  );
  const pace =
    program.volumeMultiplier === 1
      ? "Kompakt: dieselben Qualitätsziele werden über mehr Tage erreicht."
      : program.volumeMultiplier === 2
        ? "Ausgewogen: doppelt so viel Tagesumfang wie im 15-Minuten-Weg."
        : "Intensiv: dreimal so viel Tagesumfang wie im 15-Minuten-Weg.";
  const hrefForBlock = (block: DailyAutomaticityBlock, blockIndex: number) => {
    const content = PROGRAM_CONTENT[block.id];
    const params = new URLSearchParams({
      from: "daily",
      step: String(blockIndex + 1),
      session: String(program.sessionMinutes),
      minutes: String(block.minutes),
      units: String(block.practiceUnits),
    });
    const separator = content.href.includes("?") ? "&" : "?";
    return `${content.href}${separator}${params.toString()}` as Route;
  };
  const firstBlock = program.blocks.find((block) => block.id === "grammar");

  return (
    <section
      aria-labelledby="daily-program-title"
      className="daily-auto-program"
    >
      <div className="daily-auto-program__header">
        <div>
          <span className="daily-auto-program__eyebrow">
            <Clock3 aria-hidden /> Adaptives Tagesprogramm
          </span>
          <h2 dir="auto" id="daily-program-title">
            Zeit wählen und alle fünf Schritte bearbeiten
          </h2>
          <p dir="auto">
            Jede Dauer enthält Grammatik, gemischten Abruf, Gespräch,
            Wiederholung und Automatisierung. Mehr Zeit bedeutet mehr Übung –
            nicht leichtere Fortschrittsregeln.
          </p>
        </div>
        <fieldset className="daily-auto-program__duration">
          <legend>Heutige Lernzeit</legend>
          <div>
            {DAILY_SESSION_OPTIONS.map((minutes) => (
              <button
                aria-pressed={program.sessionMinutes === minutes}
                key={minutes}
                onClick={() => updateSettings({ dailyStudyMinutes: minutes })}
                type="button"
              >
                {minutes} Min.
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="daily-auto-program__pace" dir="auto">
        <strong>
          {program.sessionMinutes} Minuten · {program.volumeMultiplier}×
          Tagesumfang.
        </strong>{" "}
        {pace}
      </p>

      <div className="daily-auto-program__route">
        <div>
          <strong dir="auto">Ein geführter Weg mit fünf Pflichtmodulen</strong>
          <span dir="auto">
            Bearbeite die Module der Reihe nach. Jede Karte übergibt ihre Zeit-
            und Mengenvorgabe an die Übung.
          </span>
        </div>
        {firstBlock ? (
          <Link
            className="daily-auto-program__start"
            href={hrefForBlock(firstBlock, 0)}
          >
            <Play aria-hidden /> {program.sessionMinutes}-Minuten-Programm
            starten
          </Link>
        ) : null}
      </div>

      <ol className="daily-auto-program__grid">
        {program.blocks.map((block, index) => {
          const content = PROGRAM_CONTENT[block.id];
          const Icon = content.icon;
          return (
            <li key={block.id}>
              <Link href={hrefForBlock(block, index)}>
                <span className="daily-auto-program__number">{index + 1}</span>
                <span className="daily-auto-program__icon">
                  <Icon aria-hidden />
                </span>
                <span className="daily-auto-program__copy">
                  <span className="daily-auto-program__status" dir="auto">
                    {index === 0
                      ? "Hier starten"
                      : `Danach · Schritt ${index + 1}`}
                  </span>
                  <strong dir="auto">{content.title}</strong>
                  <small dir="auto">{content.description}</small>
                  <b dir="auto">
                    {block.minutes} Min. · {block.practiceUnits}{" "}
                    {block.practiceUnits === 1
                      ? content.unitSingular
                      : content.unitPlural}
                  </b>
                </span>
                <ArrowRight aria-hidden className="daily-auto-program__arrow" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
