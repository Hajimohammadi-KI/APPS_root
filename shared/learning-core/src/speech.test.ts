import { expect, test } from "bun:test";
import { RecognitionCollector, compareSpeechTarget, phoneticPractice } from "./speech";
test("W23 final result revisions do not duplicate text and unknown confidence abstains", () => {
  const collector = new RecognitionCollector();
  const event = { resultIndex: 0, results: [{ isFinal: true, length: 2, 0: { transcript: "I think", confidence: 0.6 }, 1: { transcript: "I sink", confidence: 0.4 } }] };
  expect(collector.update(event).finalText).toBe("I think");
  const result = collector.update(event);
  expect(result.finalText).toBe("I think");
  expect(result.reliable).toBe(false);
  expect(result.alternatives[0]?.length).toBe(2);
  expect(new RecognitionCollector().update({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "hello" } }] }).reliable).toBe(false);
});
test("W25 phonetic contrast exercises are optional practice, never an audio diagnosis", () => {
  expect(phoneticPractice("thin", "en")[0]).toMatchObject({ words: ["thin", "tin"], phonemes: ["θɪn", "tɪn"], diagnosis: null });
  expect(phoneticPractice("schön", "de")[0]?.words).toEqual(["schön", "schon"]);
  expect(phoneticPractice("Xanthe", "en")).toEqual([]);
  expect(phoneticPractice("wet", "en")[0]?.words).toEqual(["wet", "vet"]);
});
test("W24 spoken target alignment ignores punctuation and cannot certify pronunciation", () => {
  expect(compareSpeechTarget("I think", "I think.")).toMatchObject({ edits: [], pronunciationScore: null });
  expect(compareSpeechTarget("I gone home", "I have gone home").edits[0]?.type).toBe("missing");
  expect(compareSpeechTarget("I sink", "I think").edits[0]).toMatchObject({ original: "sink", expected: "think" });
});
