"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { allDays, planMeta, planWeeks, type PlannedDay, type PlanWeek } from "../plan-data";
import { countCompletedItems, countCompletedOutputs, outputTotal, percentComplete } from "../../lib/study-progress";
import { loadCompletedIds, toggleTaskCompletion } from "../../lib/task-completion-store";

// Same five macro stages already used to summarize the plan on the Study
// Tracker's journey overview (Design / Extraktion / Graph & Retrieval /
// Evaluation / Abgabe over weeks 1-25) -- reused here as the roadmap's
// phase grouping instead of inventing a new breakdown of the plan.
const ROADMAP_STAGES: Array<{
  id: string;
  title: string;
  blurb: string;
  start: number;
  end: number;
}> = [
  {
    id: "design",
    title: "Design",
    blurb: "Problem, Architektur und Evaluation mit einem ausführbaren Vertical Slice bereits in Woche 3.",
    start: 1,
    end: 6,
  },
  {
    id: "extraktion",
    title: "Extraktion",
    blurb: "NLP-Lab-Integration, Roslyn-Syntax/Semantik und EF Core READ/WRITE bis zur Table-Ebene.",
    start: 7,
    end: 12,
  },
  {
    id: "graph-retrieval",
    title: "Graph & Retrieval",
    blurb: "Evidence Model, Neo4j-Graph, Flat- vs. Graph-Retrieval und Query Contracts.",
    start: 13,
    end: 16,
  },
  {
    id: "evaluation",
    title: "Evaluation",
    blurb: "Goldstandard, RQ1/RQ2-Messung, rollenbasierte Antworten und Threats to Validity.",
    start: 17,
    end: 20,
  },
  {
    id: "abgabe",
    title: "Abgabe",
    blurb: "Thesis-Kapitel, Replikationspaket, Demo und die beiden Puffer bis zur finalen Übergabe.",
    start: 21,
    end: 25,
  },
];

function weekOutputTotal(week: PlanWeek) {
  return week.days.reduce((sum, day) => sum + outputTotal(day), 0);
}

function weekCompletedOutputs(week: PlanWeek, completed: ReadonlySet<string>) {
  return week.days.reduce((sum, day) => sum + countCompletedOutputs(day, completed), 0);
}

function isDayDone(day: PlannedDay, completed: ReadonlySet<string>) {
  return countCompletedOutputs(day, completed) === outputTotal(day);
}

function dayItemIds(day: PlannedDay) {
  return day.tasks.flatMap((task) => task.items.map((item) => item.id));
}

export default function RoadmapClient() {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingDayId, setPendingDayId] = useState<string | null>(null);
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState("");

  useEffect(() => {
    let active = true;
    loadCompletedIds().then((ids) => {
      if (!active) return;
      setCompleted(ids);
      setLoading(false);
      // Open the first week that is not yet fully done, so the roadmap
      // lands on "where I actually am" instead of always at week 1.
      const firstOpenWeek = planWeeks.find((week) =>
        week.days.some((day) => !isDayDone(day, ids)),
      );
      if (firstOpenWeek) setOpenWeeks(new Set([firstOpenWeek.number]));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const totalOutputs = allDays.reduce((sum, day) => sum + outputTotal(day), 0);
  const totalCompleted = allDays.reduce(
    (sum, day) => sum + countCompletedOutputs(day, completed),
    0,
  );
  const overallPercent = percentComplete(totalCompleted, totalOutputs);

  function toggleWeek(weekNumber: number) {
    setOpenWeeks((current) => {
      const next = new Set(current);
      if (next.has(weekNumber)) next.delete(weekNumber);
      else next.add(weekNumber);
      return next;
    });
  }

  async function toggleDay(day: PlannedDay) {
    if (pendingDayId) return;
    const nextDone = !isDayDone(day, completed);
    const ids = dayItemIds(day);
    setPendingDayId(day.id);
    // Optimistic update so the checkbox responds immediately; reconciled
    // below once every underlying item toggle (the same per-item
    // completion unit the rest of the app uses) has round-tripped.
    setCompleted((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (nextDone) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    try {
      await Promise.all(ids.map((id) => toggleTaskCompletion(id, nextDone)));
      setToast(nextDone ? `„${day.title}“ als erledigt markiert.` : `„${day.title}“ wieder geöffnet.`);
    } catch {
      setToast("Konnte den Tag nicht speichern. Bitte erneut versuchen.");
    } finally {
      setPendingDayId(null);
    }
  }

  return (
    <main className="roadmap-shell">
      <header className="roadmap-hero">
        <div>
          <p className="roadmap-eyebrow">Cross Repository Code Intelligence</p>
          <h1>Projekt-Fahrplan</h1>
          <p className="roadmap-lead">
            Alle 25 Wochen des Lernplans als scannbare Roadmap, gruppiert in
            fünf Etappen. Jedes Häkchen ist derselbe gespeicherte Fortschritt
            wie im Lernplan selbst — hier abgehakt, dort auch abgehakt.
          </p>
        </div>
        <aside className="roadmap-progress" aria-label="Gesamtfortschritt">
          <div
            className="roadmap-ring"
            style={{ "--progress": `${overallPercent * 3.6}deg` } as React.CSSProperties}
            role="img"
            aria-label={`Gesamtfortschritt: ${overallPercent} Prozent`}
          >
            <span>
              <strong>{overallPercent}%</strong>
              <small>{planMeta.totalDays} Tage</small>
            </span>
          </div>
          <Link href="/" className="roadmap-back-link">
            ← Zurück zum Lernplan
          </Link>
        </aside>
      </header>

      {loading ? <p className="roadmap-loading">Fortschritt wird geladen…</p> : null}
      {toast ? (
        <p className="roadmap-toast" role="status">
          {toast}
        </p>
      ) : null}

      <ol className="roadmap-stages">
        {ROADMAP_STAGES.map((stage, stageIndex) => {
          const stageWeeks = planWeeks.filter(
            (week) => week.number >= stage.start && week.number <= stage.end,
          );
          const stageTotal = stageWeeks.reduce((sum, week) => sum + weekOutputTotal(week), 0);
          const stageDone = stageWeeks.reduce(
            (sum, week) => sum + weekCompletedOutputs(week, completed),
            0,
          );
          const stagePercent = percentComplete(stageDone, stageTotal);
          const stageComplete = stageTotal > 0 && stageDone === stageTotal;

          return (
            <li key={stage.id} className={`roadmap-stage ${stageComplete ? "is-done" : ""}`}>
              <div className="roadmap-stage-header">
                <span className="roadmap-stage-number" aria-hidden="true">
                  {stageComplete ? "✓" : stageIndex + 1}
                </span>
                <div className="roadmap-stage-titles">
                  <h2>
                    {stage.title}
                    <small>
                      Woche {stage.start}–{stage.end}
                    </small>
                  </h2>
                  <p>{stage.blurb}</p>
                </div>
                <div className="roadmap-stage-bar" aria-hidden="true">
                  <div style={{ width: `${stagePercent}%` }} />
                </div>
                <span className="roadmap-stage-percent">{stagePercent}%</span>
              </div>

              <ol className="roadmap-weeks">
                {stageWeeks.map((week) => {
                  const weekTotal = weekOutputTotal(week);
                  const weekDone = weekCompletedOutputs(week, completed);
                  const weekPercent = percentComplete(weekDone, weekTotal);
                  const weekComplete = weekTotal > 0 && weekDone === weekTotal;
                  const open = openWeeks.has(week.number);

                  return (
                    <li key={week.phaseId} className={`roadmap-week ${weekComplete ? "is-done" : ""}`}>
                      <button
                        type="button"
                        className="roadmap-week-header"
                        aria-expanded={open}
                        onClick={() => toggleWeek(week.number)}
                      >
                        <span className="roadmap-week-number">W{week.number}</span>
                        <span className="roadmap-week-titles">
                          <strong>{week.title}</strong>
                          <small>{week.phase}</small>
                        </span>
                        <span className="roadmap-week-percent">{weekPercent}%</span>
                        <span className="roadmap-week-caret" aria-hidden="true">
                          {open ? "▾" : "▸"}
                        </span>
                      </button>

                      {open ? (
                        <div className="roadmap-week-body">
                          <p className="roadmap-week-goal">{week.goal}</p>
                          <ul className="roadmap-day-list">
                            {week.days.map((day) => {
                              const done = isDayDone(day, completed);
                              const started = !done && countCompletedItems(day, completed) > 0;
                              const checkboxId = `roadmap-day-${day.id}`;
                              return (
                                <li
                                  key={day.id}
                                  className={`roadmap-day ${done ? "is-done" : ""} ${started ? "is-started" : ""}`}
                                >
                                  <input
                                    id={checkboxId}
                                    type="checkbox"
                                    checked={done}
                                    disabled={pendingDayId === day.id}
                                    onChange={() => toggleDay(day)}
                                  />
                                  <label htmlFor={checkboxId}>
                                    <strong>{day.title}</strong>
                                    <small>{day.deliverable}</small>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
