import { grammarUnits, type GrammarUnit } from "@grammar/content";

// Prerequisite chains for the six topics the backlog named as missing a
// prerequisite diagram. Each step is a category (matched by title substring,
// since several of these topics span multiple units across levels -- e.g.
// "Adjektivdeklination nach Artikeln (A2)" and "...vollständig (B1)"), not a
// single exact unit. Ordered earliest-first; the final step is the topic
// itself. Grounded in real German pedagogy, not invented: adjective endings
// depend on case+gender+article type together, so case has to come first;
// Wechselpräpositionen and verb government both require distinguishing
// Akkusativ/Dativ first; Nebensatz is a variant of the Satzklammer rule, so
// the base word-order rule has to come first.
export interface PrerequisiteStep {
  readonly label: string;
  readonly match: (unit: GrammarUnit) => boolean;
}

export interface PrerequisiteChain {
  readonly appliesTo: (unit: GrammarUnit) => boolean;
  readonly steps: readonly PrerequisiteStep[];
  readonly why: string;
}

const titleIncludes = (needle: string) => (unit: GrammarUnit) =>
  unit.title
    .toLocaleLowerCase("de-DE")
    .includes(needle.toLocaleLowerCase("de-DE"));

const AKKUSATIV: PrerequisiteStep = {
  label: "Akkusativ",
  match: (unit) => unit.title === "Akkusativ",
};
const DATIV: PrerequisiteStep = {
  label: "Dativ",
  match: (unit) => unit.title === "Dativ",
};
const GENITIV: PrerequisiteStep = {
  label: "Genitiv",
  match: titleIncludes("Genitiv"),
};
const ARTIKEL: PrerequisiteStep = {
  label: "Artikel (bestimmt/unbestimmt)",
  match: titleIncludes("Artikel"),
};
const SATZKLAMMER: PrerequisiteStep = {
  label: "Satzklammer (Verb Position 2)",
  match: titleIncludes("Satzklammer"),
};
const GRUNDWORTSTELLUNG: PrerequisiteStep = {
  label: "Grundlegende Wortstellung",
  match: titleIncludes("Zeitangaben und Wortstellung"),
};

export const PREREQUISITE_CHAINS: readonly PrerequisiteChain[] = [
  {
    appliesTo: titleIncludes("Adjektivdeklination"),
    steps: [ARTIKEL, AKKUSATIV, DATIV, GENITIV],
    why: "Die Endung eines Adjektivs hängt gleichzeitig von Kasus, Genus und Artikeltyp ab. Ohne sichere Kasus- und Artikelkenntnis lässt sich die Endung nicht ableiten, nur auswendig lernen.",
  },
  {
    appliesTo: titleIncludes("Wechselpräpositionen"),
    steps: [AKKUSATIV, DATIV],
    why: "Wechselpräpositionen wählen zwischen Akkusativ (Richtung, „Wohin?“) und Dativ (Ort, „Wo?“). Ohne beide Kasus sicher zu unterscheiden, ist die Wahl reines Raten.",
  },
  {
    appliesTo: titleIncludes("Verben mit Dativ und Akkusativ"),
    steps: [AKKUSATIV, DATIV],
    why: "Verb-Rektion bedeutet: welchen Kasus ein bestimmtes Verb erzwingt. Das lässt sich nur beurteilen, wenn Akkusativ und Dativ bereits sicher unterschieden werden.",
  },
  {
    appliesTo: titleIncludes("Nebensatz"),
    steps: [GRUNDWORTSTELLUNG, SATZKLAMMER],
    why: "Ein Nebensatz verschiebt das konjugierte Verb ans Satzende -- eine Abwandlung der Satzklammer-Regel. Ohne die Grundregel der Verbposition im Hauptsatz wirkt die Endstellung willkürlich.",
  },
  {
    appliesTo: titleIncludes("Satzklammer"),
    steps: [GRUNDWORTSTELLUNG],
    why: "Die Satzklammer (Verb Position 2 + Ergänzung am Satzende) baut direkt auf der Grundregel der Verbposition auf.",
  },
  {
    appliesTo: (unit) =>
      titleIncludes("Wortstellung")(unit) &&
      !titleIncludes("Zeitangaben und Wortstellung")(unit),
    steps: [GRUNDWORTSTELLUNG, SATZKLAMMER],
    why: "Fortgeschrittene Wortstellung (Mittelfeld, markierte Stellung) variiert die Grundregel bewusst -- ohne die Grundregel selbst wirkt jede Abweichung willkürlich statt bedeutungstragend.",
  },
] as const;

export interface ResolvedPrerequisiteStep {
  readonly label: string;
  readonly unit: GrammarUnit | null;
}

export function resolvePrerequisiteSteps(
  chain: PrerequisiteChain,
): readonly ResolvedPrerequisiteStep[] {
  return chain.steps.map((step) => ({
    label: step.label,
    unit: grammarUnits.find((candidate) => step.match(candidate)) ?? null,
  }));
}

export function prerequisiteChainFor(
  unit: GrammarUnit,
): PrerequisiteChain | null {
  const chain = PREREQUISITE_CHAINS.find((candidate) =>
    candidate.appliesTo(unit),
  );
  if (!chain) return null;
  // A topic substring-matching one of its own prerequisite categories (e.g.
  // "Adjektivdeklination nach Artikeln" contains "Artikel") must not be
  // excluded as its own prerequisite -- only the concrete resolved unit
  // (checked by title identity, not substring) counts as a real conflict.
  const isOwnPrerequisite = resolvePrerequisiteSteps(chain).some(
    (step) => step.unit?.title === unit.title,
  );
  return isOwnPrerequisite ? null : chain;
}
