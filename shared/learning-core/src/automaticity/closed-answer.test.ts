import { expect, test } from "bun:test";
import { checkClosedAnswer, closedResponseKind } from "./closed-answer";

const labTask = (prompt: string, ...acceptedAnswers: string[]) => ({
  prompt,
  responseKind: closedResponseKind(prompt),
  acceptedAnswers,
  modality: "writing" as const,
  terminalFullStop: true,
});

test("a Lab prompt names its response kind as the learning path does", () => {
  expect(closedResponseKind("Complete the sentence: I ___ here.")).toBe(
    "cloze",
  );
  expect(closedResponseKind("Correct the sentence: She go home.")).toBe(
    "correction",
  );
  expect(
    closedResponseKind(
      "Korrigiere die vorgegebene Form: Ich bin gestern krank.",
    ),
  ).toBe("correction");
  expect(
    closedResponseKind(
      "Wähle die passende Form und schreibe sie vollständig auf Deutsch: A: drei Kinder / B: drei Kinds",
    ),
  ).toBe("choice");
  expect(closedResponseKind("Rewrite the sentence in the passive.")).toBe(
    "transformation",
  );
});

test("only a stored form passes; the other offered option is certainly wrong", () => {
  const task = labTask(
    "Complete the sentence with so or such: The film was _____ exciting.",
    "The film was so exciting.",
  );
  expect(
    checkClosedAnswer(task, "The film was so exciting", "en"),
  ).toMatchObject({ verdict: "pass", reason: "accepted", spans: [] });
  const option = checkClosedAnswer(task, "The film was such exciting.", "en");
  expect(option).toMatchObject({ verdict: "needs_repair", reason: "option" });
  expect(option.feedback).toBe(
    "This is one of the given options, but not the one that fits here. The stored answer has “so” where you wrote “such”.",
  );
  expect(option.spans).toHaveLength(1);
});

test("an answer that is not certainly wrong is saved without a score, never marked wrong", () => {
  const task = labTask(
    "Ergänze die Lücke: Es regnet; ___ gehe ich raus. (obwohl / trotzdem)",
    "Es regnet; trotzdem gehe ich raus.",
  );
  const other = checkClosedAnswer(
    task,
    "Es regnet; dennoch gehe ich raus.",
    "de",
  );
  expect(other).toMatchObject({ verdict: "not_assessed", reason: "unmatched" });
  expect(other.feedback.startsWith("Ohne Bewertung gespeichert: ")).toBe(true);
  expect(
    checkClosedAnswer(task, "Es regnet; obwohl gehe ich raus.", "de").verdict,
  ).toBe("needs_repair");
});

test("the unchanged sentence to correct and a wrong case are certainly wrong", () => {
  const task = labTask(
    "Correct the sentence: She go to work every day.",
    "She goes to work every day.",
  );
  expect(
    checkClosedAnswer(task, "She go to work every day.", "en").reason,
  ).toBe("unchanged");
  expect(
    checkClosedAnswer(task, "she goes to work every day.", "en").reason,
  ).toBe("case");
});

test("the same words with a different mark are certainly wrong; a possibly optional comma is not", () => {
  const statement = labTask("Ergänze: Sie ___.", "Sie kommt.");
  for (const answer of [
    "Sie kommt?",
    "Sie kommt!",
    "Sie kommt...",
    "Sie kommt. .",
  ])
    expect(
      `${answer} ${checkClosedAnswer(statement, answer, "de").reason}`,
    ).toBe(`${answer} punctuation`);
  const clause = labTask(
    "Ergänze: Ich weiß, ___ er kommt.",
    "Ich weiß, dass er kommt.",
  );
  expect(
    checkClosedAnswer(clause, "Ich weiß dass er kommt.", "de"),
  ).toMatchObject({
    verdict: "needs_repair",
    reason: "punctuation",
  });
  // A comma before an infinitive group without um/ohne/statt may be left out.
  const infinitive = labTask(
    "Ergänze: Ich versuche, früher ___. (aufstehen)",
    "Ich versuche, früher aufzustehen.",
  );
  expect(
    checkClosedAnswer(infinitive, "Ich versuche früher aufzustehen.", "de")
      .verdict,
  ).toBe("not_assessed");
  const purpose = labTask(
    "Ergänze: Sie lernt, ___ die Prüfung zu bestehen.",
    "Sie lernt, um die Prüfung zu bestehen.",
  );
  expect(
    checkClosedAnswer(purpose, "Sie lernt um die Prüfung zu bestehen.", "de")
      .reason,
  ).toBe("punctuation");
  // English commas are often optional: a comma-only difference stays unscored.
  const english = labTask(
    "Complete the sentence: After lunch, we ___ home.",
    "After lunch, we went home.",
  );
  expect(
    checkClosedAnswer(english, "After lunch we went home.", "en").verdict,
  ).toBe("not_assessed");
  expect(
    checkClosedAnswer(english, "After lunch, we went home?", "en").reason,
  ).toBe("punctuation");
});
