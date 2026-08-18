import { describe, expect, it } from "bun:test";

import {
  detectPitchHz,
  median,
  pitchVarietyInSemitones,
} from "./audio-fluency";

function sineWave(
  frequencyHz: number,
  sampleRate: number,
  seconds: number,
): Float32Array {
  const length = Math.round(sampleRate * seconds);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    samples[i] = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
  }
  return samples;
}

describe("detectPitchHz", () => {
  it("recovers the fundamental frequency of a pure tone within typical speech range", () => {
    const sampleRate = 16_000;
    const wave = sineWave(150, sampleRate, 0.05);
    const detected = detectPitchHz(wave, sampleRate);
    expect(detected).not.toBeNull();
    expect(detected!).toBeGreaterThan(140);
    expect(detected!).toBeLessThan(160);
  });

  it("recovers a different, higher fundamental frequency", () => {
    const sampleRate = 16_000;
    const wave = sineWave(250, sampleRate, 0.05);
    const detected = detectPitchHz(wave, sampleRate);
    expect(detected).not.toBeNull();
    expect(detected!).toBeGreaterThan(235);
    expect(detected!).toBeLessThan(265);
  });

  it("returns null for silence (no periodic energy)", () => {
    const sampleRate = 16_000;
    const silence = new Float32Array(Math.round(sampleRate * 0.05));
    expect(detectPitchHz(silence, sampleRate)).toBeNull();
  });
});

describe("median", () => {
  it("returns null for an empty array", () => {
    expect(median([])).toBeNull();
  });

  it("computes the middle value for an odd-length array", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the two middle values for an even-length array", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("pitchVarietyInSemitones", () => {
  it("returns null with fewer than 3 samples", () => {
    expect(pitchVarietyInSemitones([150, 160], 155)).toBeNull();
  });

  it("returns near-zero for a perfectly monotone pitch", () => {
    const variety = pitchVarietyInSemitones([150, 150, 150, 150], 150);
    expect(variety).not.toBeNull();
    expect(variety!).toBeLessThan(0.01);
  });

  it("returns a larger value for genuinely varied pitch", () => {
    // One octave up (300) and one down (75) around a median of 150 --
    // each is 12 semitones away, so variety should be substantial.
    const monotone = pitchVarietyInSemitones([150, 150, 150], 150);
    const varied = pitchVarietyInSemitones([75, 150, 300], 150);
    expect(varied!).toBeGreaterThan(monotone!);
  });
});
