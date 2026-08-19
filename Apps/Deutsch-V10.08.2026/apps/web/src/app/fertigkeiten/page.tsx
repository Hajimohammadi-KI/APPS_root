import {
  FERTIGKEITEN,
  cefrCurriculum,
  getOpenDatasetSkillPlans,
  grammarUnits,
  type FourLanguageSkill,
} from "@grammar/content";
import { HybridLanguageCoach } from "@/features/language-analysis/hybrid-language-coach";

export const metadata = { title: "Integrierte Fertigkeiten A1–C2" };

const openDatasetSkillPlans = getOpenDatasetSkillPlans("de");

const methodCopy: Readonly<
  Record<
    FourLanguageSkill,
    {
      readonly label: string;
      readonly method: string;
      readonly evidence: string;
    }
  >
> = {
  listening: {
    label: "Hören",
    method: "Neuronale mehrsprachige Spracherkennung plus Bedeutungsabruf",
    evidence:
      "Transkript, Inhaltsabruf und zeitversetztes Verstehen bleiben getrennte Nachweise.",
  },
  speaking: {
    label: "Sprechen",
    method: "Neuronale ASR, Forced Alignment und prüfbare Flüssigkeitsmerkmale",
    evidence:
      "Echtes Audio, Wiedergabe, Reparatur und Transfer sind Pflicht; ASR allein bewertet keine Aussprache.",
  },
  reading: {
    label: "Lesen",
    method: "Syntaxbewusste Suche mit transparenten CEFR-Heuristiken",
    evidence:
      "Bedeutung, Belegauswahl und Erklärung zählen; Korpusfrequenz ist keine CEFR-Stufe.",
  },
  writing: {
    label: "Schreiben",
    method:
      "Neuronale Korrekturvorschläge plus Lernerkorpus und aktive Reparatur",
    evidence:
      "Original, Vorschlag, begründete Reparatur und unabhängiger Transfer werden getrennt gespeichert.",
  },
};

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

      <section className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm sm:p-6">
        <details className="group overflow-hidden rounded-2xl border border-sky-200 bg-background">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5">
            <span>
              Offene Datensätze und geeignete Methoden für vier Fertigkeiten
            </span>
            <span className="text-sm text-primary group-open:hidden">
              Öffnen
            </span>
            <span className="hidden text-sm text-primary group-open:inline">
              Schließen
            </span>
          </summary>
          <div className="grid gap-4 border-t border-sky-200 p-4 lg:grid-cols-2">
            {openDatasetSkillPlans.map((plan) => {
              const copy = methodCopy[plan.skill];
              return (
                <article
                  className="rounded-2xl border bg-secondary/30 p-4"
                  key={plan.skill}
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                    {copy.label}
                  </p>
                  <h2 className="mt-2 text-base font-black">{copy.method}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {copy.evidence}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {plan.datasets.map((dataset) => (
                      <li key={dataset.id}>
                        <a
                          className="block rounded-xl border bg-background p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          href={dataset.officialUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <strong className="block text-sm">
                            {dataset.title}
                          </strong>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {dataset.license.spdx}
                            {dataset.sizeByLanguage?.de
                              ? ` · ${dataset.sizeByLanguage.de}`
                              : ""}
                            {` · geprüft ${dataset.verifiedOn}`}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <p className="border-t border-sky-200 px-4 py-3 text-sm leading-6 text-muted-foreground sm:px-5">
            Korpora und Modelle werden nicht automatisch geladen oder in den
            Installer gepackt. Lokal heruntergeladene Common-Voice- oder
            Tatoeba-CC0-Dateien lassen sich mit{" "}
            <code>bun run datasets:import</code> datensparsam normalisieren;
            Personen- und Demografiefelder werden verworfen.
          </p>
        </details>
      </section>

      <HybridLanguageCoach />

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
