import { expect, test } from "bun:test";
import {
  matchesReferenceAnswer,
  normalizeReferenceAnswer,
} from "./reference-answer";

test("case, negation, spelling and sentence boundaries remain meaningful", () => {
  for (const [answer, expected] of [
    ["lesen", "Lesen"],
    [
      "Vor dem schlafen liest er zehn Minuten.",
      "Vor dem Schlafen liest er zehn Minuten.",
    ],
    [
      "i have worked on this project since may",
      "I have worked on this project since May",
    ],
    [
      "Ich bleibe zu hause, weil ich krank bin.",
      "Ich bleibe zu Hause, weil ich krank bin.",
    ],
    [
      "Vor dem Schlafen. liest er zehn Minuten.",
      "Vor dem Schlafen liest er zehn Minuten.",
    ],
    ["I have worked???", "I have worked."],
    ["Ich weiß es.", "Ich weiss es."],
    ["I have worked.", "I have not worked."],
    ["Lets go.", "Let's go."],
  ])
    expect(
      matchesReferenceAnswer(answer!, expected!, {
        allowOptionalFinalPeriod: true,
      }),
    ).toBe(false);
});

test("only declared final full stops and equivalent Unicode/spacing are optional", () => {
  const expected = "Ich übe heute.";
  expect(matchesReferenceAnswer("Ich übe heute", expected)).toBe(false);
  expect(
    matchesReferenceAnswer("Ich übe heute", expected, {
      allowOptionalFinalPeriod: true,
    }),
  ).toBe(true);
  expect(
    matchesReferenceAnswer("Ich übe heute!", expected, {
      allowOptionalFinalPeriod: true,
    }),
  ).toBe(false);
  expect(
    matchesReferenceAnswer("Ich übe heute..", expected, {
      allowOptionalFinalPeriod: true,
    }),
  ).toBe(false);
  expect(matchesReferenceAnswer("  Ich  u\u0308be heute.\n", expected)).toBe(
    true,
  );
  expect(matchesReferenceAnswer("", "")).toBe(false);
  expect(normalizeReferenceAnswer("  Lesen\n ")).toBe("Lesen");
});
