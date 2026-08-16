"use client";

import { grammarUnits } from "@grammar/content";
import { CEFR_LEVELS } from "@grammar/domain";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutomaticityLab } from "@/features/automaticity/automaticity-lab";
import { PrerequisiteChainPanel } from "@/features/automaticity/prerequisite-chain-panel";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export default function GrammatikPage() {
  const { state, setTodayGrammar } = useLearnerState();
  const selectedTitle = state.todayGrammar?.title;
  const selectedUnit = grammarUnits.find(
    (unit) => unit.title === selectedTitle,
  );

  return (
    <div className="space-y-5">
      <div>
        <Badge className="mb-3 bg-violet-700 text-white">
          {grammarUnits.length} Einheiten, A1 bis C2
        </Badge>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Grammatik-Labor
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
        <CardContent>
          <Accordion
            defaultValue={selectedUnit ? [selectedUnit.level] : ["A1"]}
            multiple
          >
            {CEFR_LEVELS.map((level) => {
              const units = grammarUnits.filter((unit) => unit.level === level);
              if (units.length === 0) return null;
              return (
                <AccordionItem key={level} value={level}>
                  <AccordionTrigger className="text-sm font-bold text-muted-foreground">
                    {level} · {units.length} Einheiten
                  </AccordionTrigger>
                  <AccordionContent>
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
      {selectedUnit ? (
        <PrerequisiteChainPanel
          mastery={state.mastery}
          onSelectPrerequisite={(unit) => setTodayGrammar(unit.title, unit.level)}
          unit={selectedUnit}
        />
      ) : null}
      <AutomaticityLab />
    </div>
  );
}
