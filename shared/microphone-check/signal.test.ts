import { test, expect } from "bun:test";
import { summarizeSignal } from "./signal";
test("silence is never a passing recording", () => {
  expect(summarizeSignal(new Float32Array(16000), 16000)).toEqual({
    durationSeconds: 1,
    peakDb: null,
    rmsDb: null,
    clippedFraction: 0,
    state: "silence",
  });
});
test("detects quiet sound and clipping independently of language or text", () => {
  expect(
    summarizeSignal(new Float32Array(16000).fill(0.001), 16000).state,
  ).toBe("quiet");
  expect(summarizeSignal(new Float32Array(16000).fill(1), 16000).state).toBe(
    "clipped",
  );
  const wave = Float32Array.from(
    { length: 16000 },
    (_, i) => 0.2 * Math.sin(i / 5),
  );
  expect(summarizeSignal(wave, 16000).state).toBe("signal");
});
test("rejects corrupt waveform data", () => {
  expect(() => summarizeSignal(new Float32Array([NaN]), 16000)).toThrow();
  expect(() => summarizeSignal(new Float32Array(), 16000)).toThrow();
});
