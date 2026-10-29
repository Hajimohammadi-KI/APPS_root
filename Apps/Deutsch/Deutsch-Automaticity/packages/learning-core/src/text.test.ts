import { expect, test } from "bun:test";
import { normalizeText, tokenizeText } from "./text";

test("W07 shared normalization preserves grammatical distinctions", () => {
  expect(normalizeText("  Gru\u0308ße\t Welt.  ")).toBe("Grüße Welt.");
  expect(normalizeText("Hi...", { allowOptionalFinalPeriod: true })).toBe(
    "Hi...",
  );
  expect(normalizeText("Hi.", { allowOptionalFinalPeriod: true })).toBe("Hi");
  for (const value of ["Sie", "sie", "don't", "dont", "für", "fur", "?", "!"])
    expect(normalizeText(value)).toBe(value);
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
