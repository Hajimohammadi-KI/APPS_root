import { expect, test } from "bun:test";
import {
  parseAzurePronunciation,
  parsePronunciationObservation,
  validatePronunciationTarget,
  validatePronunciationWav,
} from "./pronunciation-assessment";

const context = {
  variant: "en-US" as const,
  referenceText: "Hello.",
  durationSeconds: 2,
};
function fixture() {
  return {
    RecognitionStatus: "Success",
    DisplayText: "Hello.",
    NBest: [
      {
        Display: "Hello.",
        PronunciationAssessment: { AccuracyScore: 99 },
        Words: [
          {
            Word: "hello",
            Offset: 1_000_000,
            Duration: 8_000_000,
            PronunciationAssessment: { AccuracyScore: 95, ErrorType: "None" },
            Phonemes: [
              {
                Phoneme: "ɛ",
                Offset: 2_000_000,
                Duration: 1_000_000,
                PronunciationAssessment: {
                  AccuracyScore: 47,
                  NBestPhonemes: [
                    { Phoneme: "ɑ", Score: 99 },
                    { Phoneme: "ɛ", Score: 40 },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}
function wav(seconds = 1, amplitude = 1000) {
  const bytes = new Uint8Array(44 + Math.round(seconds * 16_000) * 2);
  const view = new DataView(bytes.buffer);
  for (const [at, text] of [
    [0, "RIFF"],
    [8, "WAVE"],
    [12, "fmt "],
    [36, "data"],
  ] as const)
    [...text].forEach((c, i) => (bytes[at + i] = c.charCodeAt(0)));
  view.setUint32(4, bytes.length - 8, true);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16_000, true);
  view.setUint32(28, 32_000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(40, bytes.length - 44, true);
  for (let i = 44; i < bytes.length; i += 2)
    view.setInt16(i, amplitude * (i % 4 ? -1 : 1), true);
  return bytes;
}

test("W26 same recognized Hello preserves different acoustic phoneme; no score or pass", () => {
  const result = parseAzurePronunciation(fixture(), context);
  expect(result.recognizedText).toBe("Hello.");
  expect(result.words[0]?.phonemes[0]).toEqual({
    expected: "ɛ",
    heard: "ɑ",
    offsetSeconds: 0.2,
    durationSeconds: 0.1,
  });
  expect(result.pronunciationScore).toBeNull();
  expect(result.verified).toBe(false);
  expect(JSON.stringify(result)).not.toMatch(
    /AccuracyScore|ErrorType|\"pass\"|PronScore/,
  );
  expect(parsePronunciationObservation(result)).toEqual(result);
});
test("provider acoustic words retain repetitions without changing the explicit target", () => {
  const raw = fixture();
  const word = raw.NBest[0]!.Words[0]!;
  raw.NBest[0]!.Words = Array.from({ length: 4 }, (_, i) => ({
    ...word,
    Offset: i * 10_000_000,
    Phonemes: word.Phonemes.map((p) => ({
      ...p,
      Offset: i * 10_000_000 + 1_000_000,
    })),
  }));
  const result = parseAzurePronunciation(raw, {
    ...context,
    referenceText: "Hello. Hello. Hello. Hello.",
    durationSeconds: 5,
  });
  expect(result.words).toHaveLength(4);
  expect(result.referenceText).toBe("Hello. Hello. Hello. Hello.");
});
test("en-GB is retained without invented named phonemes", () => {
  const result = parseAzurePronunciation(fixture(), {
    ...context,
    variant: "en-GB",
  });
  expect(result.variant).toBe("en-GB");
  expect(result.spokenPhonemesAvailable).toBe(false);
  expect(result.words[0]?.phonemes).toEqual([]);
});
test("missing spoken alternative stays unknown, never replaced by expected phoneme", () => {
  const raw = fixture();
  raw.NBest[0]!.Words[0]!.Phonemes[0]!.PronunciationAssessment.NBestPhonemes =
    [];
  const result = parseAzurePronunciation(raw, context);
  expect(result.words[0]?.phonemes[0]?.heard).toBeNull();
  expect(result.spokenPhonemesAvailable).toBe(false);
});
test("provider output that is not acoustic evidence fails closed", () => {
  for (const raw of [
    null,
    {},
    { RecognitionStatus: "NoMatch" },
    { ...fixture(), NBest: [] },
    { ...fixture(), RecognitionStatus: "Error" },
  ])
    expect(() => parseAzurePronunciation(raw, context)).toThrow();
  const raw = fixture();
  raw.NBest[0]!.Words[0]!.Phonemes = [];
  expect(() => parseAzurePronunciation(raw, context)).toThrow();
});
test("provider invalid times, phones and scores fail closed", () => {
  for (const value of [-1, Number.NaN, Infinity, 100_000_000]) {
    const raw = fixture();
    raw.NBest[0]!.Words[0]!.Offset = value;
    expect(() => parseAzurePronunciation(raw, context)).toThrow();
  }
  const raw = fixture();
  raw.NBest[0]!.Words[0]!.Phonemes[0]!.PronunciationAssessment.NBestPhonemes[0]!.Score = 101;
  expect(() => parseAzurePronunciation(raw, context)).toThrow();
});
test("public observation validator refuses forged grades and invalid provenance", () => {
  const result = parseAzurePronunciation(fixture(), context);
  for (const raw of [
    null,
    {},
    { ...result, verified: true },
    { ...result, pronunciationScore: 100 },
    { ...result, provider: "browser-ASR" },
    { ...result, variant: "de-DE" },
    { ...result, words: [] },
    { ...result, spokenPhonemesAvailable: false },
  ])
    expect(() => parsePronunciationObservation(raw)).toThrow();
});
test("reference text must be explicit and bounded", () => {
  expect(validatePronunciationTarget("  Hello, teacher!  ")).toBe(
    "Hello, teacher!",
  );
  for (const value of [
    null,
    {},
    "",
    " ",
    "a".repeat(501),
    Array(102).fill("hi").join(" "),
    "Hello\u0000",
  ])
    expect(() => validatePronunciationTarget(value)).toThrow();
});
test("only real bounded mono 16k PCM16 WAV can be submitted", () => {
  expect(validatePronunciationWav(wav()).durationSeconds).toBe(1);
  expect(validatePronunciationWav(wav(30)).durationSeconds).toBe(30);
  for (const bytes of [new Uint8Array(), wav(0), wav(30.001), wav(1, 0)])
    expect(() => validatePronunciationWav(bytes)).toThrow();
  for (const [offset, value] of [
    [20, 3],
    [22, 2],
    [24, 44_100],
    [28, 1],
    [32, 4],
    [34, 8],
    [40, 9999],
  ]) {
    const bytes = wav();
    new DataView(bytes.buffer).setUint32(offset!, value!, true);
    expect(() => validatePronunciationWav(bytes)).toThrow();
  }
});
