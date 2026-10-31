import type { Language } from "./automaticity/contracts";

/** Explicit authored repairs of confirmed defects. This is not a general
 * linguistic validator or evidence of independent content review. */
export const KNOWN_CONTENT_REPAIRS = [
  {
    language: "en",
    title: "Layered subordination",
    constructionId: "en.c.072",
    legacyPrompt:
      "Correct the sentence: Stacked clauses with unclear reference.",
    primaryPrompt:
      "Correct the sentence: Stacked clauses with unclear reference.",
    prompt:
      "Correct only the verb form and keep the meaning: Although the data were limited, the pattern that emerge was consistent.",
    source:
      "Although the data were limited, the pattern that emerge was consistent.",
    answer:
      "Although the data were limited, the pattern that emerged was consistent.",
  },
  {
    language: "de",
    title: "Feine Bedeutungsunterschiede im Modus",
    constructionId: "de.c.071",
    legacyPrompt: "Korrigiere den Satz: Die Maßnahme hat sicher keine Folgen.",
    primaryPrompt:
      "Korrigiere die vorgegebene Form. Nicht richtig: Die Maßnahme hat sicher keine Folgen. Schreibe die vollständige richtige Antwort auf Deutsch.",
    prompt:
      "Korrigiere nur die Verbform im Hauptsatz und behalte die Bedeutung bei: Es wären denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.",
    source: "Es wären denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.",
    answer: "Es wäre denkbar, dass die Maßnahme unbeabsichtigte Folgen hat.",
  },
] as const;
export function knownContentRepair(language: Language, title: string) {
  return KNOWN_CONTENT_REPAIRS.find(
    (row) => row.language === language && row.title === title,
  );
}
