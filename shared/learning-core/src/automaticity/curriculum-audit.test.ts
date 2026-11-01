import { expect, test } from "bun:test";
import { auditClosedTask, auditUnitAnswers } from "./curriculum-audit";
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
