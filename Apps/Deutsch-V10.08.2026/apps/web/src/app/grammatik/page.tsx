"use client";

import { grammarUnits } from "@grammar/content";
import { CEFR_LEVELS } from "@grammar/domain";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutomaticityLab } from "@/features/automaticity/automaticity-lab";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export default function GrammatikPage() {
  const { state, setTodayGrammar } = useLearnerState();
  const selectedTitle = state.todayGrammar?.title;

  return (
    <div className="space-y-5">
      <div>
        <Badge className="mb-3 bg-violet-700 text-white">Grammatik-Lab</Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {grammarUnits.length} Einheiten, A1 bis C2
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Wähle eine Einheit, um sie zur heutigen Automatik-Mission zu machen.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Einheit wählen</CardTitle>
          <CardDescription>
            Die Auswahl setzt das heutige Übungsthema. Der Nachweis wird
            genauso geprüft wie bei jeder anderen Mission — exakte
            kontrollierte Übung, online geprüftes Schreiben und Sprechen, und
            Übertragung.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {CEFR_LEVELS.map((level) => {
            const units = grammarUnits.filter((unit) => unit.level === level);
            if (units.length === 0) return null;
            return (
              <div key={level}>
                <h2 className="mb-2 text-sm font-bold text-muted-foreground">
                  {level} · {units.length} Einheiten
                </h2>
                <div className="flex flex-wrap gap-2">
                  {units.map((unit) => (
                    <button
                      aria-pressed={selectedTitle === unit.title}
                      className={`rounded-full border px-3 py-1.5 text-left text-sm font-bold ${
                        selectedTitle === unit.title
                          ? "border-violet-700 bg-violet-100 text-violet-950"
                          : "bg-background"
                      }`}
                      key={unit.title}
                      onClick={() => {
                        setTodayGrammar(unit.title, unit.level);
                        document
                          .getElementById("mission")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      type="button"
                    >
                      {unit.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <AutomaticityLab />
    </div>
  );
}
