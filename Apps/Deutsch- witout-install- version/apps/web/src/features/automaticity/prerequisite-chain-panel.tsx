import { ArrowRight, Check, Circle, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MasteryRecord } from "@grammar/domain";
import type { GrammarUnit } from "@grammar/content";
import {
  prerequisiteChainFor,
  resolvePrerequisiteSteps,
} from "./grammar-prerequisites";

export function PrerequisiteChainPanel({
  unit,
  mastery,
  onSelectPrerequisite,
}: Readonly<{
  unit: GrammarUnit;
  mastery: Readonly<Record<string, MasteryRecord>>;
  onSelectPrerequisite: (unit: GrammarUnit) => void;
}>) {
  const chain = prerequisiteChainFor(unit);
  if (!chain) return null;
  const steps = resolvePrerequisiteSteps(chain);

  return (
    <Card className="border-sky-200 bg-sky-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="size-4" /> Voraussetzungen für „{unit.title}“
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => {
            const status = step.unit
              ? (mastery[step.unit.title]?.status ?? "new")
              : "new";
            const learned = status === "stable" || status === "automatic";
            return (
              <span className="flex items-center gap-2" key={step.label}>
                {index > 0 ? (
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 text-sky-700"
                  />
                ) : null}
                <button
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${
                    learned
                      ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                      : "border-sky-300 bg-white text-sky-950"
                  }`}
                  disabled={!step.unit}
                  onClick={() => step.unit && onSelectPrerequisite(step.unit)}
                  type="button"
                >
                  {learned ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                  {step.label}
                </button>
              </span>
            );
          })}
          <ArrowRight aria-hidden="true" className="size-4 text-sky-700" />
          <Badge className="bg-violet-700 text-white">{unit.title}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{chain.why}</p>
      </CardContent>
    </Card>
  );
}
