"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { grammarUnits } from "@grammar/content";
import { CEFR_LEVELS } from "@grammar/domain";

type GrammarUnit = (typeof grammarUnits)[number];

const UNITS_BY_LEVEL = new Map(
  CEFR_LEVELS.map((level) => [
    level,
    grammarUnits.filter((unit) => unit.level === level),
  ]),
);

type GrammarUnitAccordionProps = Readonly<{
  selectedTitle: string | undefined;
  onSelect: (unit: GrammarUnit) => void;
}>;

export function GrammarUnitAccordion({
  selectedTitle,
  onSelect,
}: GrammarUnitAccordionProps) {
  const selectedLevel = grammarUnits.find(
    (unit) => unit.title === selectedTitle,
  )?.level;
  const [openLevels, setOpenLevels] = useState<string[]>([
    selectedLevel ?? "A1",
  ]);
  return (
    <Accordion
      aria-label="Grammatikniveau und Einheit wählen"
      onValueChange={setOpenLevels}
      value={openLevels}
    >
      {CEFR_LEVELS.map((level) => {
        const units = UNITS_BY_LEVEL.get(level) ?? [];
        if (units.length === 0) return null;
        const label = `${level} · ${units.length} Einheiten`;

        return (
          <AccordionItem key={level} value={level}>
            <AccordionTrigger className="px-1 text-sm font-bold text-muted-foreground hover:bg-violet-50 hover:text-violet-950 hover:no-underline">
              {label}
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <ul
                aria-label={`${level} Einheiten`}
                className="overflow-hidden rounded-lg border border-violet-100 bg-background"
              >
                {units.map((unit) => {
                  const selected = selectedTitle === unit.title;

                  return (
                    <li
                      className="w-full max-w-none! border-b border-violet-100 last:border-b-0"
                      key={unit.title}
                    >
                      <button
                        aria-pressed={selected}
                        data-slot="grammar-unit-row"
                        className={`relative flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium outline-none transition-[color,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-violet-50 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-700 ${
                          selected
                            ? "bg-violet-100 text-violet-950 shadow-[inset_3px_0_0_#6d28d9]"
                            : "bg-background text-foreground"
                        }`}
                        onClick={() => onSelect(unit)}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                            selected
                              ? "border-violet-700 bg-violet-700 text-white"
                              : "border-violet-300 bg-white text-transparent"
                          }`}
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 flex-1">{unit.title}</span>
                        {selected ? (
                          <span className="text-xs font-bold text-violet-800">
                            Ausgewählt
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
