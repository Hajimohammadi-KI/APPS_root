import { expect, test } from "bun:test";
import { RecognitionCollector, compareSpeechTarget, phoneticPractice, calibrateWarningThreshold, pronunciationWarning, describeWaveform, spokenPracticeEvidence, splitSpokenSentences } from "./speech";
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
test("W28 transcript checks cannot verify spoken accuracy or convert WPM into fluency", () => {
  expect(spokenPracticeEvidence()).toEqual({ targetHit: false, accuracyScore: 0, fluencyScore: null, attemptVerified: false });
  const source = "Dr. Smith is here. I agree!";
  const sentences = splitSpokenSentences(source);
  expect(sentences.map(s => s.text)).toEqual(["Dr. Smith is here.", "I agree!"]);
  for (const sentence of sentences) expect(source.slice(sentence.start, sentence.end)).toBe(sentence.text);
});
test("W27 waveform descriptions count interior quiet intervals without giving a fluency score", () => {
  const samples = new Float32Array(1000);
  for (let i = 0; i < 300; i++) samples[i] = .2;
  for (let i = 700; i < 1000; i++) samples[i] = .2;
  expect(describeWaveform(samples, 1000)).toMatchObject({ durationSeconds: 1, activeSeconds: .6, quietIntervals: 1, fluencyScore: null });
  expect(describeWaveform(new Float32Array(1000), 1000)?.quietIntervals).toBe(0);
  expect(describeWaveform(new Float32Array([NaN]), 1000)).toBeNull();
});
test("W26 asymmetric calibration abstains without reviewed acoustic evidence", () => {
  expect(calibrateWarningThreshold([])).toBeNull();
  const sample = [{ errorProbability: .9, error: true }, { errorProbability: .8, error: false }, { errorProbability: .2, error: false }];
  const calibrated = calibrateWarningThreshold(sample);
  expect(calibrated?.falseAlerts).toBe(0);
  expect(calibrated?.threshold).toBe(.9);
  expect(pronunciationWarning({ source: "recognition", errorProbability: 1 }, calibrated)).toBeNull();
  expect(pronunciationWarning({ source: "acoustic", errorProbability: .99 }, null)).toBeNull();
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
