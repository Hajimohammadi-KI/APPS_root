import { expect, test } from "bun:test";
import {
  auditClosedTask,
  auditGapCue,
  auditUnitAnswers,
  optionDistractors,
} from "./curriculum-audit";
const task = {
  id: "fixture",
  answerPolicy: "closed" as const,
  responseKind: "cloze" as const,
  prompt: "Fill the blank: She ___ here.",
  acceptedAnswers: ["She is here."],
  solution: "She is here.",
};
test("W33 build audit finds missing solutions, duplicate alternatives and ambiguous gaps", () => {
  expect(auditClosedTask(task)).toEqual([]);
  expect(
    auditClosedTask({ ...task, solution: "She are here." })[0]?.severity,
  ).toBe("error");
  expect(
    auditClosedTask({
      ...task,
      acceptedAnswers: ["She is here.", " She is here. "],
    }).some((i) => i.code === "duplicate-answer"),
  ).toBe(true);
  expect(
    auditClosedTask({ ...task, prompt: "Fill: She ___ ___ here." }).some(
      (i) => i.code === "multiple-gaps",
    ),
  ).toBe(true);
});
test("W33 known correction prompts with no source sentence or changed meaning cannot pass the audit", () => {
  for (const prompt of [
    "Correct the sentence: Stacked clauses with unclear reference.",
    "Korrigiere die vorgegebene Form. Nicht richtig: Die Maßnahme hat sicher keine Folgen. Schreibe die vollständige richtige Antwort auf Deutsch.",
  ])
    expect(
      auditClosedTask({ ...task, responseKind: "correction", prompt }),
    ).toContainEqual({
      taskId: "fixture",
      code: "known-invalid-correction",
      severity: "error",
    });
});
const correction = (prompt: string, answer: string) => ({
  ...task,
  responseKind: "correction" as const,
  prompt,
  acceptedAnswers: [answer],
  solution: answer,
});
const german = (source: string) =>
  `Korrigiere die vorgegebene Form. Nicht richtig: ${source} Schreibe die vollständige richtige Antwort auf Deutsch.`;
test("W33 a correction must accept the complete repaired text it asks for", () => {
  for (const [prompt, answer, code] of [
    [
      "Correct the sentence: I don’t have some time.",
      "any time.",
      "fragment-answer",
    ],
    [
      "Correct the sentence: Finished the report, she left.",
      "Having finished.",
      "fragment-answer",
    ],
    [
      "Correct the sentence: The woman which called",
      "who called.",
      "fragment-answer",
    ],
    [
      german("Das Buch liegt auf den Tisch."),
      "auf dem Tisch.",
      "fragment-answer",
    ],
    [german("mit dem Student."), "Studenten.", "fragment-answer"],
    [
      "Correct the sentence: Unclear pronoun reference.",
      "This limitation affects the result.",
      "unrelated-correction",
    ],
    [
      german("Prüfe das Zeitverhältnis, bevor du den Konnektor wählst."),
      "Sobald die Ergebnisse vorliegen, informieren wir alle Beteiligten.",
      "unrelated-correction",
    ],
    [
      german("Das Haus wurde gebaut."),
      "Das Haus wurde gebaut.",
      "unchanged-correction",
    ],
  ] as const)
    expect(auditClosedTask(correction(prompt, answer))).toContainEqual({
      taskId: "fixture",
      code,
      severity: "error",
    });
});
test("W33 a placeholder ellipsis is never an accepted answer, but notation in a rule is", () => {
  expect(
    auditClosedTask(
      correction(
        "Correct the sentence: Same register in every context.",
        "I found out...",
      ),
    ),
  ).toContainEqual({
    taskId: "fixture",
    code: "incomplete-answer",
    severity: "error",
  });
  const rule = "Use almost or exactly with as … as comparisons.";
  expect(
    auditClosedTask({ ...task, acceptedAnswers: [rule], solution: rule }),
  ).toEqual([]);
});
test("W33 a rule note is never an accepted answer", () => {
  for (const answer of [
    "Nicht: Ich oft lerne Deutsch. Sondern: Ich lerne oft Deutsch.",
    "Vorgang: wird geöffnet. Zustand: ist geöffnet.",
    "These → Begründung → Einwand → Abwägung → Schluss",
  ])
    expect(
      auditClosedTask({ ...task, acceptedAnswers: [answer], solution: answer }),
    ).toContainEqual({
      taskId: "fixture",
      code: "note-as-answer",
      severity: "error",
    });
  const sentence = "Nicht alle Ergebnisse waren signifikant.";
  expect(
    auditClosedTask({
      ...task,
      acceptedAnswers: [sentence],
      solution: sentence,
    }),
  ).toEqual([]);
});
test("W33 a closed answer never repeats the unit's rule or error description", () => {
  const unit = {
    rule: "Unterscheide Ursache mit da, weil, aufgrund und Folge mit sodass.",
    commonError: "Ursache beantwortet warum; Folge beschreibt das Ergebnis.",
  };
  const cloze = (answer: string) => ({
    ...task,
    id: answer,
    acceptedAnswers: [answer],
    solution: answer,
  });
  expect(
    auditUnitAnswers(unit, [
      cloze("Ursache beantwortet warum; Folge beschreibt das Ergebnis."),
      cloze("Da der Zug ausfiel, kamen wir zu spät."),
    ]),
  ).toEqual([
    {
      taskId: "Ursache beantwortet warum; Folge beschreibt das Ergebnis.",
      code: "rule-as-answer",
      severity: "error",
    },
  ]);
});
test("a reviewed wrong form needs an explanation and can never also be accepted", () => {
  expect(
    auditClosedTask({
      ...task,
      rejectedAnswers: [
        { answer: "She is here.", explanation: "Not this one." },
      ],
    }),
  ).toContainEqual({
    taskId: "fixture",
    code: "rejected-answer-conflict",
    severity: "error",
  });
  expect(
    auditClosedTask({
      ...task,
      rejectedAnswers: [{ answer: "She are here.", explanation: " " }],
    }),
  ).toContainEqual({
    taskId: "fixture",
    code: "rejected-answer-conflict",
    severity: "error",
  });
  expect(
    auditClosedTask({
      ...task,
      rejectedAnswers: [
        { answer: "She are here.", explanation: "Use is with she." },
      ],
    }),
  ).toEqual([]);
});
test("another option the prompt itself offers is a certain distractor", () => {
  const cloze = (prompt: string, answer: string) => ({
    prompt,
    responseKind: "cloze" as const,
    acceptedAnswers: [answer],
  });
  expect(
    optionDistractors(
      cloze(
        "Complete with am, is or are. Write the full sentence: I ___ ready for the lesson.",
        "I am ready for the lesson.",
      ),
    ),
  ).toEqual(["I is ready for the lesson.", "I are ready for the lesson."]);
  expect(
    optionDistractors(
      cloze(
        "Setze die richtige Akkusativform ein und schreibe den vollständigen Satz: Es gibt ___ Supermarkt in meiner Straße. (ein / einen)",
        "Es gibt einen Supermarkt in meiner Straße.",
      ),
    ),
  ).toEqual(["Es gibt ein Supermarkt in meiner Straße."]);
  expect(
    optionDistractors(
      cloze(
        "Ergänze viel oder viele vor dem nicht zählbaren Nomen und schreibe den ganzen Satz: Heute habe ich ___ Zeit.",
        "Heute habe ich viel Zeit.",
      ),
    ),
  ).toEqual(["Heute habe ich viele Zeit."]);
  expect(
    optionDistractors({
      prompt:
        "Wähle die passende Form und schreibe sie vollständig auf Deutsch: A: zwei Buch / B: zwei Bücher",
      responseKind: "choice",
      acceptedAnswers: ["zwei Bücher"],
    }),
  ).toEqual(["zwei Buch"]);
  // Without an option that yields a stored answer nothing is inferred.
  expect(
    optionDistractors(
      cloze("Complete with am, is or are: She ___ here.", "She was here."),
    ),
  ).toEqual([]);
  expect(
    optionDistractors(
      cloze("Complete the sentence: She ___ here.", "She is here."),
    ),
  ).toEqual([]);
});
test("W33 build audit requires a cue for every content word a one-gap cloze leaves out", () => {
  const codes = (language: "en" | "de", prompt: string, answer: string) =>
    auditGapCue(
      {
        id: "fixture",
        answerPolicy: "closed",
        modality: "writing",
        prompt,
        acceptedAnswers: [answer],
      },
      language,
    ).map((issue) => `${issue.code}:${issue.severity}`);
  const setze =
    "Setze die fehlende Form ein und schreibe die vollständige Antwort auf Deutsch: ";
  for (const [language, prompt, answer] of [
    [
      "en",
      "Complete the sentence: This is _____ book.",
      "This is Maya’s book.",
    ],
    [
      "de",
      setze + "Ich ___ jeden Morgen um sieben Uhr auf.",
      "Ich stehe jeden Morgen um sieben Uhr auf.",
    ],
    ["de", setze + "Ich stehe um ___ Uhr auf.", "Ich stehe um sieben Uhr auf."],
    ["de", setze + "Ich habe gestern ___.", "Ich habe gestern gearbeitet."],
    // The choice must be visible: a hint is help the learner has to request.
    [
      "en",
      "Complete the sentence: _____ the rain, we went out.",
      "Despite the rain, we went out.",
    ],
    // The fixed frame ("… auf Deutsch") and function words ("auf") cue nothing.
    ["de", setze + "Warum lernst du ___?", "Warum lernst du Deutsch?"],
    [
      "de",
      setze + "Ich habe wenig Zeit, aber viele ___.",
      "Ich habe wenig Zeit, aber viele Aufgaben.",
    ],
    // A colon inside the sentence or an instruction after it still aligns.
    [
      "en",
      "Complete the sentence: American English: We met _____.",
      "American English: We met on the weekend.",
    ],
    [
      "de",
      setze + "Ich habe—besser gesagt: ich ___ begonnen.",
      "Ich habe—besser gesagt: ich hatte—bereits begonnen.",
    ],
  ] as const)
    expect(codes(language, prompt, answer)).toEqual(["uncued-gap:error"]);
  expect(
    codes(
      "en",
      "Complete the sentence: I am _____terested in photography.",
      "I am interested in photography.",
    ),
  ).toEqual(["gap-inside-word:error"]);
  // A bracket cue that is already the answer turns recall into copying.
  for (const [language, prompt, answer] of [
    [
      "de",
      setze + "Der Kurs ist ___. (interessant)",
      "Der Kurs ist interessant.",
    ],
    [
      "de",
      setze + "Ich habe ___ gestern gegeben. (es, ihm)",
      "Ich habe es ihm gestern gegeben.",
    ],
    [
      "en",
      "Use the verb as an instruction: ___ the door, please. (open)",
      "Open the door, please.",
    ],
  ] as const)
    expect(codes(language, prompt, answer)).toEqual(["copied-cue:error"]);
  for (const [language, prompt, answer] of [
    // Capitalising a name inside the sentence is the task, not a copy.
    [
      "en",
      "Use capital letters correctly: I’m visiting _____ in July. (france)",
      "I’m visiting France in July.",
    ],
    [
      "de",
      setze + "Ich habe ___ gestern gegeben. (ihm, es)",
      "Ich habe es ihm gestern gegeben.",
    ],
    [
      "de",
      setze + "Der Kurs ist ___. (interessant / interessante)",
      "Der Kurs ist interessant.",
    ],
  ] as const)
    expect(codes(language, prompt, answer)).toEqual([]);
  for (const [language, prompt, answer] of [
    // An explicit cue after the sentence, an option list, or the word itself
    // in the instruction or the rest of the sentence.
    [
      "de",
      setze + "Ich ___ jeden Morgen um sieben Uhr auf. (aufstehen)",
      "Ich stehe jeden Morgen um sieben Uhr auf.",
    ],
    [
      "en",
      "Complete the sentence with bored or boring: I was _____ during the lecture.",
      "I was bored during the lecture.",
    ],
    [
      "de",
      "Ergänze abschließen als Infinitiv mit zu und schreibe den ganzen Satz: Vergiss nicht, die Tür ___.",
      "Vergiss nicht, die Tür abzuschließen.",
    ],
    [
      "de",
      setze + "das Buch – die ___; die Frau – die Frauen",
      "das Buch – die Bücher; die Frau – die Frauen",
    ],
    [
      "en",
      "Use the present continuous passive of repair: The road _____.",
      "The road is being repaired.",
    ],
    [
      "de",
      "Ergänze das Partizip II von schreiben und schreibe den ganzen Satz: Sie hat den Brief ___.",
      "Sie hat den Brief geschrieben.",
    ],
    // Function words are the grammar target and need no cue.
    [
      "en",
      "Complete the sentence: She is good ___ maths.",
      "She is good at maths.",
    ],
    [
      "en",
      "Complete the sentence: We _____ work on Sundays.",
      "We don’t work on Sundays.",
    ],
    [
      "de",
      "Ergänze das Fragewort für eine Sache und schreibe beide Sätze: ___ freust du dich? Ich freue mich auf die Ferien.",
      "Worauf freust du dich? Ich freue mich auf die Ferien.",
    ],
    // A gap the key does not fit is another rule's concern.
    ["en", "Complete the sentence: She ___ here.", "They were there."],
  ] as const)
    expect(codes(language, prompt, answer)).toEqual([]);
});
test("W33 the content gate keeps genuine minimal repairs", () => {
  for (const [prompt, answer] of [
    ["Correct the sentence: I am agree.", "I agree."],
    ["Correct the sentence: Her works here.", "She works here."],
    ["Correct the sentence: two childs", "two children"],
    ["Correct the sentence: the most easiest", "the easiest"],
    [
      "Correct the sentence: Despite it was raining, we went out.",
      "Although it was raining, we went out.",
    ],
    [
      "Correct the demonstrative number: This shoes are wet.",
      "These shoes are wet.",
    ],
    [german("Trotzdem es regnet."), "Obwohl es regnet."],
    [german("weil ich lebe in Deutschland."), "weil ich in Deutschland lebe."],
    [german("wegen dem Wetter."), "wegen des Wetters."],
    [german("Ich habe ihm es."), "Ich habe es ihm."],
  ] as const)
    expect(auditClosedTask(correction(prompt, answer))).toEqual([]);
});
