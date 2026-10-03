import type { RuleId } from "./construction-rules";
/** Engineering regression examples authored with the implementation.
 * These are NOT independently labelled qualification or learner evidence. */
export const REPRESENTATIVE_FIXTURES: {
  rule: RuleId;
  alternatives: [string[], string[]];
  wrongRole: string;
  unsupported: string;
  missingTarget?: string;
}[] = [
  {
    rule: "en.inflection",
    alternatives: [
      [
        "Every day, Mina works in the library.",
        "Every day Mina works in the library.",
      ],
      ["Every evening, Omar studies at home."],
    ],
    wrongRole: "Omar works in the library every day.",
    unsupported: "Mina is working in the library every day.",
  },
  {
    rule: "de.inflection",
    alternatives: [
      ["Den neuen Plan erkläre ich."],
      ["Mit dem neuen Ansatz arbeiten wir."],
    ],
    wrongRole: "Wir erklären den neuen Plan.",
    unsupported: "Ich erläutere den neuen Plan.",
  },
  {
    rule: "en.valency",
    alternatives: [
      ["Mina relies on Omar.", "Mina depends upon Omar."],
      ["Omar depends on Mina.", "Omar relies upon Mina."],
    ],
    wrongRole: "Omar depends on Mina.",
    unsupported: "She relies on him.",
  },
  {
    rule: "de.valency",
    alternatives: [
      [
        "Gestern hat Mina Omar kontaktiert.",
        "Mina hat Omar gestern kontaktiert.",
      ],
      ["Omar hat Mina gestern kontaktiert."],
    ],
    wrongRole: "Omar hat gestern Mina kontaktiert.",
    unsupported: "Sie hat ihn gestern kontaktiert.",
  },
  {
    rule: "en.temporal",
    alternatives: [
      [
        "Yesterday, Mina finished the report.",
        "Mina did finish the report yesterday.",
      ],
      [
        "Omar finished the report last Monday.",
        "Last Monday Omar did finish the report.",
      ],
    ],
    wrongRole: "Omar finished the report yesterday.",
    unsupported: "Mina finished her report yesterday.",
  },
  {
    rule: "de.temporal",
    alternatives: [
      [
        "Gestern hat Mina den Bericht geschrieben.",
        "Mina hat den Bericht gestern geschrieben.",
      ],
      ["Omar hat den Bericht am Montag geschrieben."],
    ],
    wrongRole: "Omar hat gestern den Bericht geschrieben.",
    unsupported: "Mina schrieb gestern den Bericht.",
  },
  {
    rule: "en.clause",
    alternatives: [
      ["Mina says Omar is ready."],
      ["Omar says that Mina is ready."],
    ],
    wrongRole: "Omar says that Mina is ready.",
    unsupported: "Mina says she is ready.",
  },
  {
    rule: "de.clause",
    alternatives: [
      ["Weil Omar krank ist, bleibt Mina zu Hause."],
      ["Omar bleibt zu Hause, weil Mina krank ist."],
    ],
    wrongRole: "Omar bleibt zu Hause, weil Mina krank ist.",
    unsupported: "Mina bleibt zu Hause, weil er krank ist.",
  },
  {
    rule: "en.voice",
    alternatives: [
      ["The report has to be checked."],
      ["The door can be opened"],
    ],
    wrongRole: "The door must be checked.",
    unsupported: "It is necessary to check the report.",
  },
  {
    rule: "de.voice",
    alternatives: [
      ["Geprüft werden muss der Bericht."],
      ["Geöffnet werden kann die Tür."],
    ],
    wrongRole: "Die Tür muss geprüft werden.",
    unsupported: "Der Bericht ist zu prüfen.",
  },
  {
    rule: "en.discourse",
    alternatives: [
      [
        "Mina keeps working though Mina is tired.",
        "Mina is tired, but Mina keeps working.",
      ],
      ["Though Omar is tired, Omar keeps working."],
    ],
    wrongRole: "Although Omar is tired, Mina keeps working.",
    unsupported: "Although she is tired, Mina keeps working.",
    missingTarget: "Because Mina is tired, Mina keeps working.",
  },
  {
    rule: "de.discourse",
    alternatives: [
      [
        "Mina ist müde, trotzdem arbeitet Mina weiter.",
        "Mina arbeitet weiter, obwohl Mina müde ist.",
        "Mina ist müde, aber Mina arbeitet weiter.",
      ],
      ["Obwohl Omar müde ist, arbeitet Omar weiter."],
    ],
    wrongRole: "Obwohl Omar müde ist, arbeitet Mina weiter.",
    unsupported: "Obwohl sie müde ist, arbeitet Mina weiter.",
    missingTarget: "Weil Mina müde ist, arbeitet Mina weiter.",
  },
];
