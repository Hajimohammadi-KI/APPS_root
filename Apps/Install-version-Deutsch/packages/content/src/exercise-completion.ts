export type GrammarExercise = readonly [prompt: string, answer: string];

export interface ExerciseCompletionInput {
  readonly title: string;
  readonly commonError: string;
  readonly examples: readonly string[];
  readonly exercises: readonly (readonly string[])[];
  readonly testAnswer: string;
  readonly repairTest: string;
  readonly transferTest: string;
  readonly rule: string;
  readonly recallTest: string;
}

// Ehrlicher Boden, keine Wunschzahl. Der frühere Wert 10 war nur erreichbar,
// weil drei Aufgabenfamilien pro Einheit ihre eigene Lösung im Prompt
// abdruckten (Modellsatz, weiterer Modellsatz, Übertrage-die-Regel). Nach
// deren Entfernung liegt die tatsächliche Ausbeute bei rund 6-7 Aufgaben pro
// Einheit. 5 ist der Wert, den alle 144 Einheiten mit echten Abrufaufgaben
// erreichen -- eine höhere Zahl wäre wieder nur durch Abtippübungen zu halten.
const MINIMUM_CONTROLLED_EXERCISES = 5;

function cleanSentence(sentence: string): string {
  return sentence.trim().replace(/\s+/g, " ");
}

function withoutTerminalPunctuation(token: string): string {
  return token.replace(/[.!?;:,]+$/u, "");
}

function changedToken(correct: string, incorrect: string): string | undefined {
  const correctTokens = correct.split(/\s+/u);
  const incorrectTokens = incorrect.split(/\s+/u);
  const changedIndex = correctTokens.findIndex(
    (token, index) =>
      withoutTerminalPunctuation(token).toLocaleLowerCase("de") !==
      withoutTerminalPunctuation(
        incorrectTokens[index] ?? "",
      ).toLocaleLowerCase("de"),
  );

  return correctTokens[changedIndex];
}

function maskTarget(sentence: string, preferredToken?: string): string {
  const words = sentence.split(/\s+/u);
  const preferred = preferredToken
    ? withoutTerminalPunctuation(preferredToken)
    : "";
  const targetIndex = words.findIndex(
    (word) =>
      preferred.length > 0 &&
      withoutTerminalPunctuation(word).toLocaleLowerCase("de") ===
        preferred.toLocaleLowerCase("de"),
  );
  const fallbackIndex = words.reduce(
    (bestIndex, word, index) =>
      withoutTerminalPunctuation(word).length >
      withoutTerminalPunctuation(words[bestIndex] ?? "").length
        ? index
        : bestIndex,
    0,
  );
  const index = targetIndex >= 0 ? targetIndex : fallbackIndex;
  const punctuation = words[index]?.match(/[.!?;:,]+$/u)?.[0] ?? "";
  words[index] = `___${punctuation}`;
  return words.join(" ");
}

function reorderedParts(sentence: string): string {
  const normalized = cleanSentence(sentence);
  const punctuation = normalized.match(/[.!?]+$/u)?.[0] ?? "";
  const words = normalized.replace(/[.!?]+$/u, "").split(/\s+/u);

  if (words.length < 2) {
    return normalized;
  }

  return `${words.slice(1).reverse().join(" / ")} / ${words[0]}${punctuation}`;
}

function correctionParts(commonError: string): {
  readonly incorrect: string;
  readonly correct: string;
} {
  const [incorrect, explicitCorrection] = commonError
    .split("→", 2)
    .map(cleanSentence);

  return {
    incorrect: incorrect || commonError,
    correct: explicitCorrection || "",
  };
}

/**
 * The migrated catalog originally contained three controlled exercises per
 * unit. These deterministic additions produce two further, topic-specific
 * retrieval formats without changing the frozen legacy source:
 * a correction-based cloze, a sentence-order reconstruction, and a
 * transfer-retrieval prompt.
 */
/** Normalisiert wie der Antwortvergleich zur Laufzeit, damit „im Prompt
 *  enthalten“ nicht an Groß-/Kleinschreibung oder Satzzeichen scheitert. */
function normalizeForContainment(value: string): string {
  return value
    .toLocaleLowerCase("de-DE")
    .replace(/[.!?,;:„“"']/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

/** True, wenn die Lösung wörtlich in der Aufgabenstellung steht. */
function promptContainsAnswer(prompt: string, expected: string): boolean {
  const answer = normalizeForContainment(expected);
  // Sehr kurze Antworten (ein Wort) können zufällig im Prompt vorkommen,
  // ohne dass die Aufgabe dadurch trivial wird -- erst ab einem echten Satz
  // ist das Enthaltensein ein Abschreib-Signal.
  if (answer.split(" ").length < 3) return false;
  return normalizeForContainment(prompt).includes(answer);
}

/** True, wenn `corrected` plausibel die Korrektur von `incorrect` ist.
 *  Eine Reparatur ändert eine Form, sie hängt keine neuen Satzteile an.
 *  Ohne diese Prüfung entstand eine falsch verschlüsselte Aufgabe: Prompt
 *  „Korrigiere ...: Du fahrst.“ mit erwarteter Antwort „Du fährst nach
 *  Hause.“ -- wer korrekt „Du fährst.“ schrieb, wurde als falsch gewertet. */
function isPlausibleRepairPair(incorrect: string, corrected: string): boolean {
  const a = normalizeForContainment(incorrect).split(" ").filter(Boolean);
  const b = normalizeForContainment(corrected).split(" ").filter(Boolean);
  if (!a.length || !b.length) return false;
  return a.length === b.length;
}

export function completeControlledExercises(
  unit: ExerciseCompletionInput,
): readonly GrammarExercise[] {
  const existing: GrammarExercise[] = unit.exercises
    .map(
      (exercise): GrammarExercise => [
        exercise[0]?.trim() ?? "",
        exercise[1]?.trim() ?? "",
      ],
    )
    // Eine Aufgabe, deren Aufgabenstellung die erwartete Antwort bereits
    // enthält, prüft Abtippen, nicht Abrufen. Das betraf drei Familien in
    // jeder Einheit: „Schreibe den Modellsatz: <Satz>“, „Schreibe einen
    // weiteren Modellsatz: <Satz>“ und „Übertrage die Regel ...: <Satz>“ --
    // in allen dreien stand die Lösung wörtlich im Prompt. Das ist genau der
    // Fehler, der in der englischen curriculum.ts schon behoben ist; hier
    // wurde er nur bei einem einzigen Kandidaten behoben statt generell.
    .filter(([prompt, expected]) => !promptContainsAnswer(prompt, expected));

  if (existing.length >= MINIMUM_CONTROLLED_EXERCISES) {
    return existing;
  }

  const correction = correctionParts(unit.commonError);
  const repairCandidate = cleanSentence(
    unit.repairTest || correction.correct || "",
  );
  const correctedSentence = cleanSentence(
    repairCandidate.split(/\s+/u).length >= 3
      ? repairCandidate
      : unit.testAnswer || repairCandidate,
  );
  const incorrectSentence = cleanSentence(
    correction.incorrect || unit.commonError,
  );
  const token = changedToken(correctedSentence, incorrectSentence);
  const reconstructionAnswer = cleanSentence(
    unit.examples.find(
      (example) => cleanSentence(example) !== correctedSentence,
    ) ??
      unit.testAnswer ??
      correctedSentence,
  );
  const candidates: readonly GrammarExercise[] = [
    [
      `Setze die fehlende Form ein und schreibe den ganzen Satz: ${maskTarget(
        correctedSentence,
        token,
      )}`,
      correctedSentence,
    ],
    [
      `Ordne die Satzteile zu einem korrekten Satz: ${reorderedParts(
        reconstructionAnswer,
      )}`,
      reconstructionAnswer,
    ],
    // ENTFERNT: „Übertrage die Regel in eine neue Situation ...: <Zielsatz>“.
    // Prompt und erwartete Antwort waren beide `unit.transferTest` -- die
    // Lösung stand also wörtlich in der Aufgabe. Zusätzlich ist dieses Feld
    // in fast allen Einheiten der Platzhaltersatz „In einer neuen Situation
    // kann ich <Titel> korrekt verwenden.“, der über die Grammatik nichts
    // prüft. Beides zusammen: reine Zählerhöhung ohne Abrufwert.
    // Nur ausgeben, wenn die erwartete Antwort wirklich die Korrektur des
    // Prompt-Satzes ist (siehe isPlausibleRepairPair).
    ...(isPlausibleRepairPair(incorrectSentence, correctedSentence)
      ? ([
          [
            `Korrigiere den Satz vollständig und achte auf „${unit.title}“: ${incorrectSentence}`,
            correctedSentence,
          ],
        ] as GrammarExercise[])
      : []),
    [`Nenne die Regel für „${unit.title}“ auswendig.`, unit.recallTest],
    // Zweiter Abruf derselben geprüften Antwort unter anderer Formulierung.
    // Bewusst behalten: einen bekannt korrekten Satz erneut abzurufen ist
    // echtes verteiltes Abrufen. Entfernt wurden dagegen die beiden
    // folgenden Aufgaben (siehe unten), weil sie etwas anderes versprachen,
    // als sie bewerteten.
    [
      `Rufe die Regel für „${unit.title}“ ab, ohne nachzusehen.`,
      unit.recallTest,
    ],
    // ENTFERNT: „Erkläre die Regel ... mit eigenen Worten.“ und „Trage ...
    // einem Mitlernenden in einem Satz vor.“ -- beide erwarteten `unit.rule`
    // wortwörtlich. practiceAnswerMatches vergleicht exakt (nach
    // Normalisierung) und kennt -- anders als die englische App -- gar keinen
    // Pfad für offene Produktion. Wer die Regel also wirklich „mit eigenen
    // Worten“ formulierte, wurde als FALSCH gewertet; bestehen konnte man nur
    // durch wortwörtliches Abtippen. Das trainiert Auswendiglernen von
    // Zeichenketten und treibt den Mastery-Wert künstlich hoch.
    // Zusätzlich prüfen beide Aufgaben metasprachliches Wissen ÜBER Grammatik
    // statt der Sprachverwendung, auf die diese App zielt. Echte freie
    // Produktion findet in Schreib-/Transferaufgaben und im
    // Automatisierungstrainer statt, die gegen den Online-Evaluator prüfen.
    [
      `Schreibe die Standard-Referenzantwort für „${unit.title}“.`,
      unit.testAnswer,
    ],
    // Deliberately not including a "Tippe den Beispielsatz: <example>"
    // candidate anymore -- it printed the expected answer verbatim
    // inside the prompt, so completing it was copy-typing, not recall.
    // Matches the same fix applied to English's curriculum.ts.
  ];
  const prompts = new Set(existing.map(([prompt]) => prompt));

  for (const candidate of candidates) {
    if (
      existing.length >= MINIMUM_CONTROLLED_EXERCISES ||
      prompts.has(candidate[0]) ||
      // Gleiche Regel wie für die vorhandenen Aufgaben: kein Kandidat, der
      // seine eigene Lösung abdruckt.
      promptContainsAnswer(candidate[0], candidate[1])
    ) {
      continue;
    }
    existing.push(candidate);
    prompts.add(candidate[0]);
  }

  // Die Untergrenze ist jetzt ein echter Boden, keine Zielvorgabe. Vorher lag
  // MINIMUM bei 10 und wurde nur erreicht, weil drei Aufgabenfamilien pro
  // Einheit ihre eigene Lösung abdruckten; nach deren Entfernung liegt die
  // ehrliche Ausbeute darunter. Lieber weniger, aber echte Abrufaufgaben, als
  // eine hohe Zahl aus Abtippübungen -- die Zahl war ohnehin nie ein Lernwert.
  // Der Fehler bleibt für den Fall, dass eine Einheit so dünn ist, dass selbst
  // eine sinnvolle Kurzrunde nicht zustande kommt.
  if (existing.length < MINIMUM_CONTROLLED_EXERCISES) {
    throw new Error(
      `Nur ${existing.length} echte Abrufaufgaben für „${unit.title}“ (Minimum ${MINIMUM_CONTROLLED_EXERCISES}).`,
    );
  }

  return existing;
}
