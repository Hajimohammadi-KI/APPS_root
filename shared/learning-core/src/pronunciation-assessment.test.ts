import { expect, test } from "bun:test";
import {
  LOCAL_PRONUNCIATION_MODEL_ID,
  parseLocalPronunciationObservation,
  validateLocalPronunciationSamples,
  decodeLocalPhonemeFrames,
  localModelAssetManifest,
} from "./pronunciation-assessment";

test("local PCM analysis has no text input or cloud provenance and preserves vowel observations", () => {
  const result = decodeLocalPhonemeFrames(
    [0, 1, 1, 0, 2, 2, 0],
    ["<blank>", "h", "ɑ", "<wb>"],
    140,
  );
  expect(result.phonemes).toEqual(["h", "ɑ"]);
  expect(result.spans).toEqual([
    { phoneme: "h", startMs: 20, endMs: 80 },
    { phoneme: "ɑ", startMs: 80, endMs: 140 },
  ]);
  expect(result.source).toBe("local_phoneme_model");
  expect(result.modelId).toBe(LOCAL_PRONUNCIATION_MODEL_ID);
  expect(result.pronunciationScore).toBeNull();
  expect(result.verified).toBe(false);
  expect(parseLocalPronunciationObservation(result)).toEqual(result);
  expect(JSON.stringify(result)).not.toMatch(
    /Hello|Azure|referenceText|expected|heard/,
  );
});
test("CTC repeats separated by blank are real repeats and word separators are not phonemes", () => {
  expect(
    decodeLocalPhonemeFrames(
      [1, 1, 0, 1, 3, 2],
      ["<blank>", "h", "ɑ", "<wb>"],
      120,
    ).phonemes,
  ).toEqual(["h", "h", "ɑ"]);
});
test("no speech, invalid frame IDs, excessive duration and unknown tokens fail closed", () => {
  for (const frames of [[], [0, 0], [9], [1.2]])
    expect(() =>
      decodeLocalPhonemeFrames(frames, ["<blank>", "h"], 100),
    ).toThrow();
  expect(() =>
    decodeLocalPhonemeFrames([1], ["<blank>", "<unk>"], 100),
  ).toThrow();
  expect(() => decodeLocalPhonemeFrames([1], ["<blank>", "一"], 100)).toThrow();
  expect(() =>
    decodeLocalPhonemeFrames([1], ["<blank>", "h"], 30_001),
  ).toThrow();
});
test("PCM must be finite audible16k waveform within30seconds", () => {
  expect(
    validateLocalPronunciationSamples(new Float32Array(16000).fill(0.1), 16000),
  ).toBe(1000);
  for (const samples of [
    new Float32Array(),
    new Float32Array(16000),
    new Float32Array(480001).fill(0.1),
    new Float32Array(16000).fill(NaN),
    new Float32Array(16000).fill(2),
  ])
    expect(() => validateLocalPronunciationSamples(samples, 16000)).toThrow();
  expect(() => validateLocalPronunciationSamples([0.1], 16000)).toThrow();
  expect(() =>
    validateLocalPronunciationSamples(new Float32Array(16000).fill(0.1), 44100),
  ).toThrow();
});
test("public observations cannot invent grades or mismatch phones and timed spans", () => {
  const result = decodeLocalPhonemeFrames([1, 1], ["<blank>", "h"], 40);
  for (const value of [
    null,
    {},
    { ...result, verified: true },
    { ...result, pronunciationScore: 90 },
    { ...result, modelId: "other" },
    { ...result, source: "cloud" },
    { ...result, phonemes: ["ɑ"] },
    { ...result, spans: [{ phoneme: "h", startMs: 1, endMs: 100 }] },
  ])
    expect(() => parseLocalPronunciationObservation(value)).toThrow();
});
test("only three pinned ASR assets are needed; there is no cloud endpoint or P2G model", () => {
  expect(localModelAssetManifest.map((x) => x.file)).toEqual([
    "hama.wasm",
    "asr_waveform.hama",
    "g2p_vocab.json",
  ]);
  expect(
    localModelAssetManifest.every(
      (x) => /^[a-f0-9]{64}$/.test(x.sha256) && x.bytes > 0,
    ),
  ).toBe(true);
  expect(localModelAssetManifest.reduce((n, x) => n + x.bytes, 0)).toBeLessThan(
    5_000_000,
  );
});
