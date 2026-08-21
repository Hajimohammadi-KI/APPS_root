import { describe, expect, it } from "bun:test";
import { grammarUnits } from "@grammar/content";

import {
  prerequisiteChainFor,
  resolvePrerequisiteSteps,
} from "./grammar-prerequisites";

const NAMED_TOPICS = [
  "Adjektivdeklination nach Artikeln",
  "Wechselpräpositionen",
  "Verben mit Dativ und Akkusativ",
  "Nebensatz mit weil",
  "Satzklammer im einfachen Hauptsatz",
  "Wortstellung im Mittelfeld",
];

describe("German grammar prerequisite chains", () => {
  it("resolves a chain for every one of the backlog-named topics", () => {
    for (const title of NAMED_TOPICS) {
      const unit = grammarUnits.find((candidate) => candidate.title === title);
      expect(unit).toBeDefined();
      const chain = prerequisiteChainFor(unit!);
      expect(chain).not.toBeNull();
    }
  });

  it("resolves every prerequisite step to a real, existing grammar unit", () => {
    for (const title of NAMED_TOPICS) {
      const unit = grammarUnits.find((candidate) => candidate.title === title)!;
      const chain = prerequisiteChainFor(unit)!;
      const steps = resolvePrerequisiteSteps(chain);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.unit).not.toBeNull();
      }
    }
  });

  it("does not claim a topic is its own prerequisite", () => {
    const akkusativ = grammarUnits.find((unit) => unit.title === "Akkusativ")!;
    const dativ = grammarUnits.find((unit) => unit.title === "Dativ")!;
    expect(prerequisiteChainFor(akkusativ)).toBeNull();
    expect(prerequisiteChainFor(dativ)).toBeNull();
  });

  it("Satzklammer requires only basic word order, not itself", () => {
    const satzklammer = grammarUnits.find(
      (unit) => unit.title === "Satzklammer im einfachen Hauptsatz",
    )!;
    const chain = prerequisiteChainFor(satzklammer)!;
    const steps = resolvePrerequisiteSteps(chain);
    expect(steps.some((step) => step.label.includes("Satzklammer"))).toBe(
      false,
    );
  });
});
