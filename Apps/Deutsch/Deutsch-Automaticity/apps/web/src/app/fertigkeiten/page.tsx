import { IntegratedSkillsCatalog } from "@/components/integrated-skills-catalog";

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

      <IntegratedSkillsCatalog />
    </div>
  );
}
