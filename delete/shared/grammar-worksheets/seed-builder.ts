import type { GrammarWorksheet, WorksheetItem } from "./model";

/** One marked span is the one decision. Other sentence features remain supplied. */
export type WorksheetExample = readonly [
  signal: string,
  sentence: string,
  wrongSpan: string,
];
export interface WorksheetSeed {
  topic: string;
  level: string;
  title: string;
  focusFa: string;
  chain: readonly [string, string, string];
  category: string;
  examples: readonly [
    WorksheetExample,
    WorksheetExample,
    WorksheetExample,
    WorksheetExample,
  ];
  change: string;
  personal: string;
  contextual?: boolean;
}

export function buildWorksheet(
  seed: WorksheetSeed,
  language: "de" | "en" = "de",
): GrammarWorksheet {
  const t = (de: string, en: string) => (language === "en" ? en : de);
  const parts = (sample: WorksheetExample) => {
    const match = /^(.*?)\[\[(.*?)\]\](.*)$/u.exec(sample[1]);
    if (!match || (sample[1].match(/\[\[/g) || []).length !== 1)
      throw new Error(`Exactly one target span is required: ${seed.topic}`);
    const [, before, form, after] = match;
    return {
      form: form!,
      answer: `${before}${form}${after}`,
      gap: `${before}________${after}`,
      wrong: `${before}${sample[2]}${after}`,
    };
  };
  const item = (id: string, n: number, prompt?: string): WorksheetItem => {
    const example = seed.examples[n]!;
    const parsed = parts(example);
    return {
      id,
      prompt: prompt ?? `${example[0]}: ${parsed.gap}`,
      answer: parsed.answer,
      cause: `${example[0]} → ${seed.chain[1]} → ${parsed.form}.`,
      trigger: example[0],
      category: seed.category,
      contrast: parts(seed.examples[n % 2 === 0 ? 1 : 0]).answer,
    };
  };
  // Authored transformations explicitly change one signal; no automatic pronoun replacement.
  return {
    id: `${seed.level.toLowerCase()}-${seed.topic
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase()}`,
    topic: seed.topic,
    level: seed.level,
    title: seed.title,
    focus: seed.chain.join(" → "),
    focusFa: seed.focusFa,
    prerequisite: t(
      "Vorgegebener Satzrahmen → nur die markierte Entscheidung ändern.",
      "Supplied sentence frame → change only the target decision.",
    ),
    decision: seed.chain,
    models: seed.examples
      .slice(0, 3)
      .map((example, n) => ({
        label:
          n === 2
            ? t("Neuer Kontext", "New context")
            : `${t("Kontrast", "Contrast")} ${n + 1}`,
        cue: example[0],
        sentence: parts(example).answer,
      })),
    reference: seed.examples
      .slice(0, 3)
      .map(
        (example) => [example[0], seed.category, parts(example).form] as const,
      ),
    notice: t(
      "Signal erkennen → passende Form wählen → im vollständigen Satz verwenden.",
      "Notice the cue → select the form → use it in a complete sentence.",
    ),
    learn: [item("L1", 0), item("L2", 1)],
    guided: [item("P1", 2), item("P2", 3)],
    transform: [
      item("T1", 1, `${parts(seed.examples[0]).answer} ${seed.change}`),
    ],
    recall: item("R1", 2, parts(seed.examples[2]).answer),
    oral: [item("S1", 0), item("S2", 2), item("S3", 3)],
    correction: [0, 1].map((n) =>
      item(
        `K${n + 1}`,
        n,
        `${t("Ziel", "Target")}: ${seed.examples[n]![0]}. ${parts(seed.examples[n]!).wrong}`,
      ),
    ),
    personal: [seed.personal],
    guidedInstruction: t(
      "Schreibe den vollständigen Satz. Begründe die Form mit dem Signal.",
      "Write the complete sentence. Explain the form using the cue.",
    ),
    reconstructionInstruction: t(
      "Lies das Modell. Decke es ab und schreibe den ganzen Satz aus dem Gedächtnis.",
      "Read the model. Cover it and reconstruct the whole sentence from memory.",
    ),
    correctionInstruction: seed.contextual
      ? t(
          "Die markierten Sätze verfehlen das Ziel. Ändere die Zielstelle. Andere Lösungen können passen.",
          "These sentences miss the stated target. Revise the target span. Other answers may fit.",
        )
      : t(
          "Die markierten Sätze enthalten einen Fehler. Schreibe den Satz richtig und begründe die Änderung.",
          "These sentences contain an error. Write each sentence correctly and explain the change.",
        ),
    correctionLabel: seed.contextual
      ? t("Ziel verfehlt", "Target mismatch")
      : t("Fehlersatz", "Error sentence"),
    personalReason: seed.chain.join(" → "),
    category: seed.category,
  };
}
