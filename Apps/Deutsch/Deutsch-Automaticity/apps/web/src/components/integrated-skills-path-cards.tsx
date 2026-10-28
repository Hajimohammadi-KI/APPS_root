import { cefrCurriculum, FERTIGKEITEN, grammarUnits } from "@grammar/content";

type IntegratedSkillsPathCardsProps = {
  levels: readonly (typeof cefrCurriculum)[number][];
  skills: readonly (typeof FERTIGKEITEN)[number][];
};

export function IntegratedSkillsPathCards({
  levels,
  skills,
}: IntegratedSkillsPathCardsProps) {
  return (
    <section className="grid gap-4" aria-label="Ausgewählte Lernpfade">
      {levels.map((level) => {
        const grammarCount = grammarUnits.filter(
          (unit) => unit.level === level.stufe,
        ).length;
        return (
          <details
            className="group overflow-hidden rounded-3xl border bg-card shadow-sm"
            data-level={level.stufe}
            key={level.stufe}
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-xl font-black text-primary-foreground">
                {level.stufe}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-xl">
                  {level.themen.length} Themen · {grammarCount}{" "}
                  Grammatikbereiche
                </strong>
                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                  {level.ziel}
                </span>
              </span>
              <span className="text-sm font-bold text-primary group-open:hidden">
                Öffnen
              </span>
              <span className="hidden text-sm font-bold text-primary group-open:inline">
                Schließen
              </span>
            </summary>

            <div className="border-t p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border bg-secondary/35 p-5">
                  <h2 className="text-lg font-bold">
                    Themen und Lebensbereiche
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {level.themen.map((topic) => (
                      <span
                        className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium"
                        key={topic}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl border bg-secondary/35 p-5">
                  <h2 className="text-lg font-bold">Aktiver Wortschatz</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {level.wortschatz.map((word) => (
                      <span
                        className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                        key={word}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 text-sm">
                    <strong>Aussprache:</strong> {level.aussprache}
                  </p>
                </article>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {skills.map((skill) => (
                  <article className="rounded-2xl border p-4" key={skill}>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                      {skill}
                    </p>
                    <p className="mt-2 text-sm leading-6">
                      {level.kannBeschreibungen[skill]}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </details>
        );
      })}
    </section>
  );
}
