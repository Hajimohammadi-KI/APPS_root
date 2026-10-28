"use client";

import { FERTIGKEITEN, cefrCurriculum } from "@grammar/content";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IntegratedSkillsPathCards } from "./integrated-skills-path-cards";

type LevelId = (typeof cefrCurriculum)[number]["stufe"];
type SkillId = (typeof FERTIGKEITEN)[number];

const ALL_LEVELS = cefrCurriculum.map((level) => level.stufe);

function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

export function IntegratedSkillsCatalog() {
  const pickerRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const [pendingLevels, setPendingLevels] = useState<LevelId[]>(["A1"]);
  const [pendingSkills, setPendingSkills] = useState<SkillId[]>([
    ...FERTIGKEITEN,
  ]);
  const [visibleLevels, setVisibleLevels] = useState<LevelId[]>(["A1"]);
  const [visibleSkills, setVisibleSkills] = useState<SkillId[]>([
    ...FERTIGKEITEN,
  ]);

  const matchingLevels = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("de");
    if (!normalizedQuery) return cefrCurriculum;

    return cefrCurriculum.filter((level) =>
      [level.stufe, level.ziel, ...level.themen, ...level.wortschatz]
        .join(" ")
        .toLocaleLowerCase("de")
        .includes(normalizedQuery),
    );
  }, [query]);

  const selectedLevels = cefrCurriculum.filter((level) =>
    visibleLevels.includes(level.stufe),
  );
  const selectionIsValid = pendingLevels.length > 0 && pendingSkills.length > 0;

  function applySelection() {
    if (!selectionIsValid) return;
    setVisibleLevels(pendingLevels);
    setVisibleSkills(pendingSkills);
    pickerRef.current?.removeAttribute("open");
  }

  return (
    <div className="space-y-4">
      {/* This compact multi-select replaces the always-expanded catalogue so
          learners can choose several levels and skills without scrolling past
          unrelated content. Apply keeps tentative checkbox changes reversible. */}
      <details
        className="group overflow-hidden rounded-3xl border border-worksheet-line! bg-card shadow-sm"
        ref={pickerRef}
      >
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-worksheet-cyan/80 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
          <span className="min-w-0">
            <strong className="block text-lg">Lernpfad auswählen</strong>
            <span className="mt-1 block text-sm text-muted-foreground">
              {visibleLevels.length} von {ALL_LEVELS.length} Niveaus ·{" "}
              {visibleSkills.length} von {FERTIGKEITEN.length} Fertigkeiten
            </span>
          </span>
          <span className="text-sm font-bold text-primary group-open:hidden">
            Mehrfachauswahl öffnen
          </span>
          <span className="hidden text-sm font-bold text-primary group-open:inline">
            Auswahl schließen
          </span>
        </summary>

        <div className="space-y-5 border-t p-5 sm:p-6">
          <label
            className="block text-sm font-bold"
            htmlFor="skill-path-search"
          >
            Niveau, Ziel oder Thema suchen
          </label>
          <input
            className="min-h-11 w-full rounded-xl border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            id="skill-path-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Zum Beispiel B1, Reisen oder Forschung"
            type="search"
            value={query}
          />

          <fieldset>
            <legend className="text-sm font-black uppercase tracking-[0.12em] text-primary">
              Niveaus
            </legend>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
              {matchingLevels.map((level) => (
                <label
                  className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm ${
                    pendingLevels.includes(level.stufe)
                      ? "border-worksheet-line bg-worksheet-cyan"
                      : "bg-background"
                  }`}
                  key={level.stufe}
                >
                  <input
                    aria-label={`Niveau ${level.stufe} anzeigen`}
                    checked={pendingLevels.includes(level.stufe)}
                    className="mt-1 size-4 shrink-0 accent-worksheet-teal"
                    onChange={() =>
                      setPendingLevels((current) =>
                        toggleValue(current, level.stufe),
                      )
                    }
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <strong className="block">{level.stufe}</strong>
                    <span className="mt-1 line-clamp-2 block text-muted-foreground">
                      {level.ziel}
                    </span>
                  </span>
                </label>
              ))}
              {!matchingLevels.length ? (
                <p className="text-sm text-muted-foreground">
                  Kein Niveau passt zu dieser Suche.
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-black uppercase tracking-[0.12em] text-primary">
              Fertigkeiten
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {FERTIGKEITEN.map((skill) => (
                <label
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm font-bold ${
                    pendingSkills.includes(skill)
                      ? "border-worksheet-line bg-worksheet-cyan"
                      : "bg-background"
                  }`}
                  key={skill}
                >
                  <input
                    aria-label={`${skill} anzeigen`}
                    checked={pendingSkills.includes(skill)}
                    className="size-4 shrink-0 accent-worksheet-teal"
                    onChange={() =>
                      setPendingSkills((current) => toggleValue(current, skill))
                    }
                    type="checkbox"
                  />
                  {skill}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="min-h-11 px-4"
              disabled={!selectionIsValid}
              onClick={applySelection}
              type="button"
            >
              Auswahl anwenden
            </Button>
            <Button
              className="min-h-11 px-4"
              onClick={() => {
                setPendingLevels([...ALL_LEVELS]);
                setPendingSkills([...FERTIGKEITEN]);
              }}
              type="button"
              variant="outline"
            >
              Alle auswählen
            </Button>
            {!selectionIsValid ? (
              <p
                aria-live="polite"
                className="text-sm font-medium text-destructive"
              >
                Wähle mindestens ein Niveau und eine Fertigkeit.
              </p>
            ) : null}
          </div>
        </div>
      </details>

      <p
        aria-live="polite"
        className="text-sm font-medium text-muted-foreground"
      >
        Angezeigt: {visibleLevels.join(", ")} · {visibleSkills.join(", ")}
      </p>

      <IntegratedSkillsPathCards
        levels={selectedLevels}
        skills={visibleSkills}
      />
    </div>
  );
}
