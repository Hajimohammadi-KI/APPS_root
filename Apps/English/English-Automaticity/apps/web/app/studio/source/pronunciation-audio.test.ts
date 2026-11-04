import { expect, test } from "bun:test";
import {
  encodePronunciationWav,
  validatePronunciationAudio,
  recordingDownloadName,
  matchesLocalRecordingDuration,
  preparePronunciationAudio,
  wordReplayRange,
} from "./pronunciation-audio";

test("encodes actual samples as mono 16 kHz PCM16 WAV without inventing text", () => {
  const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
  const bytes = encodePronunciationWav(samples);
  const view = new DataView(bytes);
  expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
  expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe("WAVE");
  expect(view.getUint16(22, true)).toBe(1);
  expect(view.getUint32(24, true)).toBe(16000);
  expect(view.getUint16(34, true)).toBe(16);
  expect(view.getUint32(40, true)).toBe(10);
  expect(view.getInt16(46, true)).toBe(16384);
  expect(view.getInt16(48, true)).toBe(-16384);
  expect(view.getInt16(50, true)).toBe(32767);
  expect(view.getInt16(52, true)).toBe(-32768);
});

test("finite Opus resampling overshoot is attenuated uniformly before PCM encoding", () => {
  const view = new DataView(
    encodePronunciationWav(new Float32Array([1.1, 0.55, -1.1, -0.55])),
  );
  expect(view.getInt16(44, true)).toBe(32767);
  expect(view.getInt16(46, true)).toBe(16384);
  expect(view.getInt16(48, true)).toBe(-32768);
  expect(view.getInt16(50, true)).toBe(-16384);
});

test("refuses silent, invalid and oversized audio instead of truncating or assessing text", () => {
  expect(() => encodePronunciationWav(new Float32Array())).toThrow();
  expect(() => encodePronunciationWav(new Float32Array(16000))).toThrow(
    /speech|silent/i,
  );
  expect(() =>
    encodePronunciationWav(new Float32Array([Number.NaN])),
  ).toThrow();
  expect(() => encodePronunciationWav(new Float32Array([Infinity]))).toThrow();
  expect(() =>
    encodePronunciationWav(new Float32Array(480001).fill(0.1)),
  ).toThrow(/30/);
  expect(
    encodePronunciationWav(new Float32Array(480000).fill(0.1)).byteLength,
  ).toBe(960044);
});

test("decoded input must be one channel and at most 30 seconds before resampling", () => {
  expect(() =>
    validatePronunciationAudio({
      numberOfChannels: 2,
      sampleRate: 48000,
      length: 48000,
    }),
  ).toThrow(/channel|mono/i);
  expect(() =>
    validatePronunciationAudio({
      numberOfChannels: 1,
      sampleRate: 48000,
      length: 1440001,
    }),
  ).toThrow(/30/);
  expect(() =>
    validatePronunciationAudio({
      numberOfChannels: 1,
      sampleRate: 48000,
      length: 0,
    }),
  ).toThrow();
  expect(() =>
    validatePronunciationAudio({
      numberOfChannels: 1,
      sampleRate: NaN,
      length: 10,
    }),
  ).toThrow();
  expect(() =>
    validatePronunciationAudio({
      numberOfChannels: 1,
      sampleRate: 48000,
      length: 1440000,
    }),
  ).not.toThrow();
});

test("download filename preserves recording format without personal data", () => {
  expect(recordingDownloadName("audio/webm;codecs=opus")).toBe(
    "my-pronunciation-recording.webm",
  );
  expect(recordingDownloadName("audio/mp4")).toBe(
    "my-pronunciation-recording.m4a",
  );
  expect(recordingDownloadName("audio/ogg")).toBe(
    "my-pronunciation-recording.ogg",
  );
  expect(recordingDownloadName("audio/wav")).toBe(
    "my-pronunciation-recording.wav",
  );
  expect(recordingDownloadName("application/unknown")).toBe(
    "my-pronunciation-recording.audio",
  );
});

test("local model results must describe the current audio sample duration", () => {
  expect(matchesLocalRecordingDuration(1000, 16000)).toBe(true);
  expect(matchesLocalRecordingDuration(1001, 16000)).toBe(true);
  expect(matchesLocalRecordingDuration(2000, 16000)).toBe(false);
  expect(matchesLocalRecordingDuration(NaN, 16000)).toBe(false);
  expect(matchesLocalRecordingDuration(0, 0)).toBe(false);
  expect(matchesLocalRecordingDuration(31000, 496000)).toBe(false);
});

test("word replay supports loaded MediaRecorder WebM with unknown finite duration", () => {
  expect(wordReplayRange(1, 0.5, Infinity, 1)).toEqual({
    start: 0.9,
    end: 1.6,
  });
  expect(wordReplayRange(1, 0.5, 1.5, 1)).toEqual({ start: 0.9, end: 1.5 });
  expect(wordReplayRange(1, 0.5, Infinity, 0)).toBeNull();
  expect(wordReplayRange(1, 0.5, NaN, 1)).toBeNull();
  expect(wordReplayRange(1, 0.5, 0.5, 1)).toBeNull();
  expect(wordReplayRange(-1, 0.5, Infinity, 1)).toBeNull();
  expect(wordReplayRange(0, 0, Infinity, 1)).toBeNull();
  expect(wordReplayRange(Infinity, 1, Infinity, 1)).toBeNull();
});

test("audio conversion rejects invalid input without sending anything", async () => {
  await expect(preparePronunciationAudio(new Blob())).rejects.toThrow(/empty/);
  await expect(
    preparePronunciationAudio(new Blob([new Uint8Array(20_000_001)])),
  ).rejects.toThrow(/large/);
  await expect(preparePronunciationAudio(new Blob(["audio"]))).rejects.toThrow(
    /unavailable/,
  );
});

test("browser decoder and renderer process the real blob and always close audio context", async () => {
  const oldContext = Object.getOwnPropertyDescriptor(
    globalThis,
    "AudioContext",
  );
  const oldOffline = Object.getOwnPropertyDescriptor(
    globalThis,
    "OfflineAudioContext",
  );
  let closed = 0,
    started = 0,
    connections = 0,
    fail = false,
    channels = 1;
  const samples = new Float32Array(16000).fill(0.1);
  let sourceBytes = 0;
  class Decoder {
    async decodeAudioData(bytes: ArrayBuffer) {
      sourceBytes = bytes.byteLength;
      if (fail) throw new Error("bad encoding");
      return { numberOfChannels: channels, sampleRate: 48000, length: 48000 };
    }
    async close() {
      closed++;
    }
  }
  class Renderer {
    destination = {};
    constructor(count: number, length: number, rate: number) {
      expect([count, length, rate]).toEqual([1, 16000, 16000]);
    }
    createBufferSource() {
      return {
        buffer: null,
        connect: () => {
          connections++;
        },
        start: () => {
          started++;
        },
      };
    }
    async startRendering() {
      return { getChannelData: () => samples };
    }
  }
  Object.defineProperty(globalThis, "AudioContext", {
    value: Decoder,
    configurable: true,
  });
  Object.defineProperty(globalThis, "OfflineAudioContext", {
    value: Renderer,
    configurable: true,
  });
  try {
    const result = await preparePronunciationAudio(
      new Blob(["actual sound bytes"]),
    );
    expect(result.type).toBe("audio/wav");
    expect(result.size).toBe(32044);
    expect(sourceBytes).toBe(18);
    expect([closed, started, connections]).toEqual([1, 1, 1]);
    channels = 2;
    await expect(
      preparePronunciationAudio(new Blob(["stereo"])),
    ).rejects.toThrow(/mono/);
    expect(closed).toBe(2);
    fail = true;
    await expect(
      preparePronunciationAudio(new Blob(["invalid"])),
    ).rejects.toThrow(/decode/);
    expect(closed).toBe(3);
  } finally {
    if (oldContext)
      Object.defineProperty(globalThis, "AudioContext", oldContext);
    else Reflect.deleteProperty(globalThis, "AudioContext");
    if (oldOffline)
      Object.defineProperty(globalThis, "OfflineAudioContext", oldOffline);
    else Reflect.deleteProperty(globalThis, "OfflineAudioContext");
  }
});
