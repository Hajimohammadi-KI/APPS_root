import { expect, test } from "bun:test";
import {
  phoneDisagreement,
  speechOceanConsensus,
  selectSpeakerCandidates,
} from "../pronunciation-corpus";
test("W26 corpus labels preserve accented but correct pronunciation and exclude disagreement", () => {
  expect(
    speechOceanConsensus({
      words: [{ phones: ["A B", "{A} B", "A B", "A B", "A B"] }],
    }),
  ).toBe("correct");
  expect(
    speechOceanConsensus({
      words: [{ phones: ["(A) B", "(A) B", "(A) B", "A B", "A B"] }],
    }),
  ).toBe("error");
  expect(
    speechOceanConsensus({
      words: [{ phones: ["(A) B", "(A) B", "A B", "A B", "A B"] }],
    }),
  ).toBeNull();
  expect(speechOceanConsensus({ words: [{ phones: [] }] })).toBeNull();
  expect(speechOceanConsensus({ words: [] })).toBeNull();
});
test("W26 raw phoneme discrepancy is a bounded descriptive signal, never a correctness label", () => {
  expect(phoneDisagreement(["θ", "ɪ", "ŋ", "k"], ["s", "ɪ", "ŋ", "k"])).toBe(
    0.25,
  );
  expect(phoneDisagreement(["ɹ", "i"], ["r", "i"])).toBe(0);
  expect(phoneDisagreement([], ["a"])).toBeNull();
  expect(phoneDisagreement(["a"], Array(301).fill("a"))).toBeNull();
});
test("W26 missing ASR phones abstain instead of becoming maximum pronunciation disagreement", () => {
  expect(phoneDisagreement(["θ", "ɪ", "ŋ", "k"], [])).toBeNull();
  expect(phoneDisagreement(["a"], ["", " ", "ˈ", "ˌ"])).toBeNull();
  expect(phoneDisagreement([" ", "ˈ"], ["a"])).toBeNull();
  // An actual nonempty mismatch remains a descriptive discrepancy.
  expect(phoneDisagreement(["a"], ["b"])).toBe(1);
});
test("W26 selects utterances before inspecting any pronunciation labels", () => {
  const metadata = [
    { sampleId: "a", speakerId: "one", label: "correct" },
    { sampleId: "b", speakerId: "one", label: "correct" },
    { sampleId: "c", speakerId: "one", label: "error" },
    { sampleId: "d", speakerId: "one", label: "error" },
    { sampleId: "e", speakerId: "two", label: "error" },
  ];
  expect(selectSpeakerCandidates(metadata, 3).map((r) => r.sampleId)).toEqual([
    "a",
    "b",
    "c",
    "e",
  ]);
  expect(
    selectSpeakerCandidates(
      metadata.map((r) => ({ ...r, label: "changed" })),
      3,
    ).map((r) => r.sampleId),
  ).toEqual(["a", "b", "c", "e"]);
});
