import { expect, test } from "bun:test";
import {
  evaluatePronunciationCalibration,
  type AcousticObservation,
} from "../pronunciation-calibration";

const config = {
  language: "en" as const,
  requiredGroups: ["fa"],
  modelSha256: "a".repeat(64),
  labelsSha256: "b".repeat(64),
  sourceUrl: "https://example.org/corpus",
};
function rows(group = "fa"): AcousticObservation[] {
  return ["calibration", "evaluation"].flatMap((split) =>
    Array.from({ length: 80 }, (_, i) => [
      {
        sampleId: `${split}-${i}-c`,
        speakerId: `${split}-${i}`,
        split,
        group,
        language: "en",
        label: "correct",
        labelSource: "human",
        score: 0.1,
      },
      {
        sampleId: `${split}-${i}-e`,
        speakerId: `${split}-${i}`,
        split,
        group,
        language: "en",
        label: "error",
        labelSource: "human",
        score: 0.9,
      },
    ]).flat(),
  ) as AcousticObservation[];
}
test("W26 independently evaluates speakers and never makes a synthetic report production approval", () => {
  const report = evaluatePronunciationCalibration(rows(), config);
  expect(report.threshold).toBe(0.9);
  expect(report.meetsStatisticalGate).toBe(true);
  expect(report.readyForProduction).toBe(false);
  expect(report.slices[0]).toMatchObject({
    group: "fa",
    negativeSpeakers: 80,
    falseAlertSpeakers: 0,
    positiveSpeakers: 80,
    detectedSpeakers: 80,
  });
  expect(report.slices[0]!.falseAlertUpper95).toBeCloseTo(
    1 - Math.pow(0.05, 1 / 80),
    8,
  );
});
test("W26 requires target groups and independent evaluation speakers", () => {
  expect(
    evaluatePronunciationCalibration(rows("zh"), config).meetsStatisticalGate,
  ).toBe(false);
  const repeated = rows().map((r) => ({
    ...r,
    speakerId: `${r.split}-one-person`,
  }));
  expect(
    evaluatePronunciationCalibration(repeated, config).meetsStatisticalGate,
  ).toBe(false);
  const leaked = rows();
  leaked[0] = { ...leaked[0]!, speakerId: "evaluation-0" };
  expect(() => evaluatePronunciationCalibration(leaked, config)).toThrow(
    "speaker",
  );
  const oneFalseAlert = rows();
  const firstCorrect = oneFalseAlert.findIndex(
    (r) => r.split === "evaluation" && r.label === "correct",
  );
  oneFalseAlert[firstCorrect] = {
    ...oneFalseAlert[firstCorrect]!,
    score: 0.99,
  };
  expect(
    evaluatePronunciationCalibration(oneFalseAlert, config)
      .meetsStatisticalGate,
  ).toBe(false);
});
test("W26 rejects labels explicitly marked synthetic, inconsistent model scope and invalid scores", () => {
  const invalid = rows();
  invalid[0] = { ...invalid[0]!, labelSource: "synthetic" } as never;
  expect(() => evaluatePronunciationCalibration(invalid, config)).toThrow(
    "human",
  );
  expect(() =>
    evaluatePronunciationCalibration(rows(), {
      ...config,
      modelSha256: "invalid",
    }),
  ).toThrow("hash");
  const invalidScore = rows();
  invalidScore[0] = { ...invalidScore[0]!, score: Number.NaN };
  expect(() => evaluatePronunciationCalibration(invalidScore, config)).toThrow(
    "score",
  );
});
