export type AutomatikIssueCode =
  "missing_target" | "missing_comma" | "word_order" | "unfinished_sentence";

export interface AutomatikIssue {
  readonly code: AutomatikIssueCode;
  readonly message: string;
  readonly original: string;
  readonly corrected: string;
}

export interface AutomatikAnalysis {
  readonly sentenceCount: number;
  readonly wordCount: number;
  readonly targetUses: number;
  readonly score: number;
  readonly targetHit: boolean;
  readonly issues: readonly AutomatikIssue[];
  // Mirrors EvaluationResponse.online (@grammar/contracts): true only when a
  // real online provider actually evaluated this response, as opposed to
  // the offline fallback/local heuristic. Combined with targetHit at the
  // call site, this is what recordAttempt's `verified` flag must be set
  // from -- practice completing or looking right locally must never by
  // itself progress mastery.
  readonly online: boolean;
}

function sentences(text: string): readonly string[] {
  return text
    .split(/(?:[.!?]+|\n+)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function words(text: string): readonly string[] {
  return text.trim().match(/[A-Za-zÄÖÜäöüß]+(?:[-’'][A-Za-zÄÖÜäöüß]+)*/g) ?? [];
}

export function countWeilClauses(text: string): number {
  return text.match(/\bweil\b/gi)?.length ?? 0;
}

function firstWordOrderIssue(text: string): AutomatikIssue | null {
  const match = text.match(
    /\bweil\s+(ich|du|er|sie|es|wir|ihr|Sie)\s+(bin|bist|ist|sind|seid|habe|hast|hat|haben|habt|werde|wirst|wird|werden|werdet|kann|kannst|können|könnt|muss|musst|müssen|müsst)\b/i,
  );
  if (!match) return null;

  const subject = match[1] ?? "ich";
  const verb = match[2] ?? "bin";
  return {
    code: "word_order",
    message: "Im weil-Nebensatz steht das finite Verb am Ende.",
    original: match[0],
    corrected: `weil ${subject} … ${verb}`,
  };
}

export function analyzeWeilClause(text: string): AutomatikAnalysis {
  const cleanText = text.trim();
  const sentenceCount = sentences(cleanText).length;
  const wordCount = words(cleanText).length;
  const targetUses = countWeilClauses(cleanText);
  const issues: AutomatikIssue[] = [];

  const commaIssue = cleanText.match(/\b[^,.!?\n]+\s+weil\s+/i);
  if (commaIssue && !commaIssue[0].includes(",")) {
    const original = commaIssue[0].trim();
    issues.push({
      code: "missing_comma",
      message: "Vor dem weil-Nebensatz steht ein Komma.",
      original,
      corrected: original.replace(/\s+weil\s+/i, ", weil "),
    });
  }

  const wordOrderIssue = firstWordOrderIssue(cleanText);
  if (wordOrderIssue) issues.push(wordOrderIssue);

  if (cleanText && targetUses === 0) {
    issues.push({
      code: "missing_target",
      message: "Begründe mindestens eine Aussage mit einem weil-Nebensatz.",
      original: cleanText,
      corrected: "Ich übe heute, weil ich sicherer sprechen möchte.",
    });
  }

  if (cleanText && !/[.!?]$/.test(cleanText)) {
    issues.push({
      code: "unfinished_sentence",
      message: "Beende den letzten Satz mit einem Satzzeichen.",
      original: cleanText,
      corrected: `${cleanText}.`,
    });
  }

  const sentenceScore = Math.min(35, Math.round((sentenceCount / 6) * 35));
  const targetScore = Math.min(50, Math.round((targetUses / 4) * 50));
  const accuracyScore = Math.max(0, 15 - issues.length * 5);
  const score = Math.min(100, sentenceScore + targetScore + accuracyScore);

  return {
    sentenceCount,
    wordCount,
    targetUses,
    score,
    targetHit: sentenceCount >= 6 && targetUses >= 4 && issues.length === 0,
    issues,
    // A local regex heuristic (word-order/comma pattern matching), not a
    // real online provider call -- it can misfire, so it must never count
    // as a verified assessment.
    online: false,
  };
}

export function normalizePracticeAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

export function practiceAnswerMatches(
  value: string,
  expected: string,
): boolean {
  return normalizePracticeAnswer(value) === normalizePracticeAnswer(expected);
}

// Nur die „Korrigiere ...“-Familie verlangt echte eigene Produktion: die
// lernende Person schreibt den reparierten Satz selbst. Cloze
// („Setze die fehlende Form ein“), Satzstellung („Ordne die Satzteile“) und
// die Regel-/Referenzabfragen haben dagegen genau eine richtige Zeichenkette
// und werden weiterhin exakt geprüft.
const OFFENE_PRODUKTION = /^Korrigiere den Satz/i;

const PRAXIS_STOPPWOERTER = new Set([
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
  "einer", "eines", "und", "oder", "aber", "ich", "du", "er", "sie", "es",
  "wir", "ihr", "mich", "dich", "sich", "uns", "euch", "mein", "dein", "sein",
  "unser", "in", "an", "auf", "zu", "mit", "von", "bei", "nach", "für", "ist",
  "sind", "war", "waren", "bin", "bist", "seid", "hat", "habe", "hast",
  "haben", "nicht", "sehr", "nur", "schon", "auch", "noch",
]);

function bedeutungsWoerter(text: string): Set<string> {
  return new Set(
    normalizePracticeAnswer(text)
      .replace(/[.,;:!?„“"']/gu, "")
      .split(/\s+/u)
      .filter((wort) => wort.length > 2 && !PRAXIS_STOPPWOERTER.has(wort)),
  );
}

function promptSatz(prompt: string): string {
  return prompt.split(":").slice(1).join(":").trim();
}

/**
 * Bewertet eine kontrollierte Übungsantwort, ohne wortwörtliche Wiedergabe
 * der einen gespeicherten Musterantwort zu verlangen. Eine exakte
 * (normalisierte) Übereinstimmung wird immer akzeptiert. Bei offenen
 * Produktionsaufgaben zählt eine Antwort zusätzlich, wenn sie (a) die
 * Zielformen enthält, die den Mustersatz vom fehlerhaften Prompt-Satz
 * unterscheiden, und (b) inhaltlich hinreichend überlappt.
 *
 * Bis hierher kannte die deutsche App -- anders als die englische -- gar
 * keinen Pfad für offene Produktion: `practiceAnswerMatches` verglich exakt.
 * Wer einen korrekten deutschen Satz schrieb, der von der gespeicherten
 * Zeichenkette abwich, wurde als falsch gewertet.
 */
export function evaluatePracticeAnswer(
  answer: string,
  exercise: { prompt: string; expected: string },
): boolean {
  if (practiceAnswerMatches(answer, exercise.expected)) return true;

  const eingabe = answer.trim();
  if (!eingabe) return false;
  if (!OFFENE_PRODUKTION.test(exercise.prompt.trim())) return false;

  // Den fehlerhaften Satz unverändert abzuschreiben ist keine Korrektur.
  const referenz = promptSatz(exercise.prompt);
  if (referenz && practiceAnswerMatches(eingabe, referenz)) return false;

  const erwartet = bedeutungsWoerter(exercise.expected);
  const referenzWoerter = bedeutungsWoerter(referenz);
  const marker = [...erwartet].filter((wort) => !referenzWoerter.has(wort));
  // Unterscheidet nichts den Mustersatz vom Prompt-Satz, wird der volle
  // Wortbestand verlangt -- die Prüfung darf nie zu „alles zählt“ verfallen.
  const verlangt = marker.length > 0 ? marker : [...erwartet];
  if (verlangt.length === 0) return false;

  const gegeben = bedeutungsWoerter(eingabe);
  if (!verlangt.every((wort) => gegeben.has(wort))) return false;

  const treffer = [...erwartet].filter((wort) => gegeben.has(wort)).length;
  return erwartet.size ? treffer / erwartet.size >= 0.5 : false;
}
