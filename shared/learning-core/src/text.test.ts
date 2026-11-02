import { expect, test } from "bun:test";
import { gapFill, normalizeText, tokenizeText } from "./text";

test("W07 shared normalization preserves grammatical distinctions", () => {
  expect(normalizeText("  Gru\u0308ße\t Welt.  ")).toBe("Grüße Welt.");
  expect(normalizeText("Hi...", { allowOptionalFinalPeriod: true })).toBe(
    "Hi...",
  );
  expect(normalizeText("Hi.", { allowOptionalFinalPeriod: true })).toBe("Hi");
  for (const value of ["Sie", "sie", "don't", "dont", "für", "fur", "?", "!"])
    expect(normalizeText(value)).toBe(value);
});

test("W33 a typed apostrophe matches the typographic one in a stored answer", () => {
  for (const variant of ["doesn’t", "doesn‘t", "doesnʼt"])
    expect(normalizeText(`She ${variant} work.`)).toBe(
      normalizeText("She doesn't work."),
    );
  expect(normalizeText("dont")).not.toBe(normalizeText("don’t"));
});

test("W33 the gap fill is found around colons in the sentence and instructions after it", () => {
  for (const [prompt, answer, fill] of [
    [
      "Complete the sentence: I ___ ready for the lesson.",
      "I am ready for the lesson.",
      "am",
    ],
    [
      "Use someone/somebody for an unidentified person: ___ has left a message. Write the full sentence.",
      "Somebody has left a message.",
      "Somebody",
    ],
    [
      "Complete the sentence: British English: We met _____.",
      "British English: We met at the weekend.",
      "at the weekend",
    ],
    [
      "Use a double genitive: She is a friend ___ . Write the full sentence.",
      "She’s a friend of mine.",
      null,
    ],
    [
      "Join the clauses with a semicolon and therefore: Costs rose ___ prices increased.",
      "Costs rose; therefore, prices increased.",
      "; therefore,",
    ],
    ["Complete the sentence: She ___ here. (be)", "She is here.", "is"],
    // Neither side of the gap belongs to the answer, and "t|here" is no word boundary.
    ["Complete the sentence: She ___ here.", "They were there.", null],
  ] as const)
    expect(gapFill(prompt, answer)).toBe(fill);
});

test("W07 tokens keep UTF-16 offsets in the original, before NFC", () => {
  const source = "🙂 Gru\u0308ße, don't re-enter!";
  const tokens = tokenizeText(source);
  expect(tokens.map((token) => token.normalized)).toEqual([
    "Grüße",
    ",",
    "don't",
    "re-enter",
    "!",
  ]);
  for (const token of tokens)
    expect(source.slice(token.start, token.end)).toBe(token.text);
  expect(tokens[0]).toEqual({
    text: "Gru\u0308ße",
    normalized: "Grüße",
    start: 3,
    end: 9,
    kind: "word",
  });
});
