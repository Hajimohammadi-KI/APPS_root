import { expect, test } from "bun:test";
import { phoneDisagreement, speechOceanConsensus } from "../pronunciation-corpus";
test("W26 corpus labels preserve accented but correct pronunciation and exclude disagreement", () => {
  expect(speechOceanConsensus({ words: [{ phones: ["A B", "{A} B", "A B", "A B", "A B"] }] })).toBe("correct");
  expect(speechOceanConsensus({ words: [{ phones: ["(A) B", "(A) B", "(A) B", "A B", "A B"] }] })).toBe("error");
  expect(speechOceanConsensus({ words: [{ phones: ["(A) B", "(A) B", "A B", "A B", "A B"] }] })).toBeNull();
  expect(speechOceanConsensus({ words: [{ phones: [] }] })).toBeNull();
  expect(speechOceanConsensus({ words: [] })).toBeNull();
});
test("W26 raw phoneme discrepancy is a bounded descriptive signal, never a correctness label", () => {
  expect(phoneDisagreement(["θ", "ɪ", "ŋ", "k"], ["s", "ɪ", "ŋ", "k"])).toBe(0.25);
  expect(phoneDisagreement(["ɹ", "i"], ["r", "i"])).toBe(0);
  expect(phoneDisagreement([], ["a"])).toBeNull();
  expect(phoneDisagreement(["a"], Array(301).fill("a"))).toBeNull();
});
