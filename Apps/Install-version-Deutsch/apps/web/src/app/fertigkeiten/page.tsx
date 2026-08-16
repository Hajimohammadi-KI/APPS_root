import { FERTIGKEITEN, cefrCurriculum, grammarUnits } from "@grammar/content";

export const metadata = { title: "Integrierte Fertigkeiten A1–C2" };

export default function FertigkeitenPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
          Vollständiger CEFR-Lernpfad
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Deutsch in realen Situationen verwenden
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Jede Stufe verbindet Grammatik und Wortschatz mit Hören, Lesen,
          Sprechen, Schreiben, Mediation und Online-Interaktion. Ein Thema gilt
          erst als gelernt, wenn du es selbstständig verwenden kannst.
        </p>
      </header>

      <section className="grid gap-4">
        {cefrCurriculum.map((level, index) => {
          const grammarCount = grammarUnits.filter(
            (unit) => unit.level === level.stufe,
          ).length;
          return (
            <details
              className="group overflow-hidden rounded-3xl border bg-card shadow-sm"
              key={level.stufe}
              name="cefr-level"
              open={index === 0}
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
                  <span className="mt-1 block text-sm text-muted-foreground">
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
                      {level.themen.map((thema) => (
                        <span
                          className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium"
                          key={thema}
                        >
                          {thema}
                        </span>
                      ))}
                    </div>
                  </article>
                  <article className="rounded-2xl border bg-secondary/35 p-5">
                    <h2 className="text-lg font-bold">Aktiver Wortschatz</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {level.wortschatz.map((wort) => (
                        <span
                          className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                          key={wort}
                        >
                          {wort}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 text-sm">
                      <strong>Aussprache:</strong> {level.aussprache}
                    </p>
                  </article>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {FERTIGKEITEN.map((fertigkeit) => (
                    <article
                      className="rounded-2xl border p-4"
                      key={fertigkeit}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                        {fertigkeit}
                      </p>
                      <p className="mt-2 text-sm leading-6">
                        {level.kannBeschreibungen[fertigkeit]}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
