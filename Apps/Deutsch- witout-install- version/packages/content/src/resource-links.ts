import type { GrammarLink, GrammarUnit } from "./index";

const LINGOLIA_GRAMMAR_HUB = "https://deutsch.lingolia.com/de/grammatik";
const LINGOLIA_EXERCISE_HUB = LINGOLIA_GRAMMAR_HUB;

const RETIRED_LINGOLIA_PATHS = new Set([
  "/de/grammatik/adjektive/partizipien-als-adjektive",
  "/de/grammatik/adjektive/steigerung",
  "/de/grammatik/deklination/artikel",
  "/de/grammatik/deklination/nomen/n-deklination",
  "/de/grammatik/deklination/nomen/plural",
  "/de/grammatik/deklination/pronomen/indefinitpronomen",
  "/de/grammatik/deklination/pronomen/possessivpronomen",
  "/de/grammatik/praepositionen/verben-mit-praepositionen",
  "/de/grammatik/praepositionen/wechselpraepositionen",
  "/de/grammatik/satzbau/fragesaetze",
  "/de/grammatik/satzbau/grundlagen",
  "/de/grammatik/satzbau/indirekte-fragen",
  "/de/grammatik/satzbau/infinitivsaetze",
  "/de/grammatik/satzbau/konjunktiv",
  "/de/grammatik/satzbau/negation",
  "/de/grammatik/satzbau/partizipialsaetze",
  "/de/grammatik/satzbau/relativsaetze",
  "/de/grammatik/verben/indirekte-rede",
  "/de/grammatik/verben/reflexive-verben",
  "/de/grammatik/verben/trennbare-verben",
  "/de/grammatik/wortbildung/nominalisierung",
]);

export function isRetiredGermanResource(url: string): boolean {
  const parsed = new URL(url);
  return (
    parsed.hostname === "deutsch.lingolia.com" &&
    RETIRED_LINGOLIA_PATHS.has(parsed.pathname)
  );
}

export function repairGermanGrammarLinks(unit: GrammarUnit): GrammarUnit {
  return {
    ...unit,
    links: unit.links.map((link): GrammarLink => {
      if (!isRetiredGermanResource(link[1])) return link;

      const role = link[3];
      return [
        role === "exercise"
          ? "Aktuelle Online-Übungen"
          : "Aktuelle Grammatikübersicht",
        role === "exercise" ? LINGOLIA_EXERCISE_HUB : LINGOLIA_GRAMMAR_HUB,
        role === "exercise"
          ? `Aktuelle Lingolia-Übungen als Ersatz für den entfernten Direktlink zu „${unit.title}“.`
          : `Aktuelle Lingolia-Grammatikübersicht als Ersatz für den entfernten Direktlink zu „${unit.title}“.`,
        role,
        link[4],
      ];
    }),
  };
}
