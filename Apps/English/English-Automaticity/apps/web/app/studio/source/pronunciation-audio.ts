const SAMPLE_RATE = 16_000;
const MAX_SECONDS = 30;
const MAX_RECORDING_BYTES = 20_000_000;

export function validatePronunciationAudio(audio: {
  readonly numberOfChannels: number;
  readonly sampleRate: number;
  readonly length: number;
}): void {
  if (audio.numberOfChannels !== 1)
    throw new Error(
      "Use a mono recording; multiple audio channels cannot be assessed here.",
    );
  if (
    !Number.isFinite(audio.sampleRate) ||
    audio.sampleRate < 8000 ||
    audio.sampleRate > 192000 ||
    !Number.isSafeInteger(audio.length) ||
    audio.length <= 0
  )
    throw new Error("The recording has no usable audio samples.");
  if (audio.length / audio.sampleRate > MAX_SECONDS)
    throw new Error(
      "Record a pronunciation clip of 30 seconds or less. The original recording has not been shortened.",
    );
}

/** Preserve float samples for local inference, with safe uniform attenuation. */
export function normalizePronunciationSamples(
  samples: Float32Array,
): Float32Array<ArrayBuffer> {
  validatePronunciationAudio({
    numberOfChannels: 1,
    sampleRate: SAMPLE_RATE,
    length: samples.length,
  });
  let energy = 0;
  let peak = 1;
  for (const sample of samples) {
    if (!Number.isFinite(sample))
      throw new Error("The recording contains invalid audio samples.");
    energy += sample * sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  if (Math.sqrt(energy / samples.length) < 0.0001)
    throw new Error(
      "This recording is silent or too quiet. Record again before checking pronunciation.",
    );
  // Opus decoding/resampling may overshoot full scale. Preserve relative
  // amplitudes rather than clipping peaks or wrapping integer samples.
  return Float32Array.from(samples, (sample) => sample / peak);
}

/** Encode samples, not a transcript. Reject silence and malformed values. */
export function encodePronunciationWav(samples: Float32Array): ArrayBuffer {
  const normalizedSamples = normalizePronunciationSamples(samples);
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++)
      view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  normalizedSamples.forEach((normalized, index) => {
    view.setInt16(
      44 + index * 2,
      Math.round(normalized * (normalized < 0 ? 32768 : 32767)),
      true,
    );
  });
  return buffer;
}

/** Browser resampling uses its audio renderer, rather than dropping samples. */
export async function preparePronunciationSamples(
  blob: Blob,
): Promise<Float32Array<ArrayBuffer>> {
  if (!blob.size || blob.size > MAX_RECORDING_BYTES)
    throw new Error(
      "The recording is empty or too large for pronunciation checking.",
    );
  if (
    typeof AudioContext === "undefined" ||
    typeof OfflineAudioContext === "undefined"
  )
    throw new Error(
      "Audio conversion is unavailable in this browser. Download the recording for your teacher.",
    );
  const context = new AudioContext();
  try {
    let decoded: AudioBuffer;
    try {
      decoded = await context.decodeAudioData(await blob.arrayBuffer());
    } catch {
      throw new Error(
        "This browser could not decode the recording. No audio was sent.",
      );
    }
    validatePronunciationAudio(decoded);
    const renderer = new OfflineAudioContext(
      1,
      Math.ceil((decoded.length / decoded.sampleRate) * SAMPLE_RATE),
      SAMPLE_RATE,
    );
    const source = renderer.createBufferSource();
    source.buffer = decoded;
    source.connect(renderer.destination);
    source.start();
    const rendered = await renderer.startRendering();
    return normalizePronunciationSamples(rendered.getChannelData(0));
  } finally {
    await context.close();
  }
}

export async function preparePronunciationAudio(blob: Blob): Promise<Blob> {
  return new Blob(
    [encodePronunciationWav(await preparePronunciationSamples(blob))],
    { type: "audio/wav" },
  );
}

/** Reject a late or mismatched result even when its phoneme shape is valid. */
export function matchesLocalRecordingDuration(
  durationMs: number,
  samples: number,
): boolean {
  return (
    Number.isSafeInteger(samples) &&
    samples >= 320 &&
    samples <= 480000 &&
    Number.isFinite(durationMs) &&
    Math.abs(durationMs - samples / 16) <= 1
  );
}

export function recordingDownloadName(type: string): string {
  const mime = type.split(";")[0]?.toLowerCase();
  const extension =
    mime === "audio/webm"
      ? "webm"
      : mime === "audio/mp4"
        ? "m4a"
        : mime === "audio/ogg"
          ? "ogg"
          : ["audio/wav", "audio/wave", "audio/x-wav"].includes(mime ?? "")
            ? "wav"
            : "audio";
  return `my-pronunciation-recording.${extension}`;
}

/** MediaRecorder WebM may have no duration metadata even when it can play. */
export function wordReplayRange(
  offset: number,
  duration: number,
  recordingDuration: number,
  readyState: number,
): { start: number; end: number } | null {
  if (
    readyState < 1 ||
    !Number.isFinite(offset) ||
    !Number.isFinite(duration) ||
    offset < 0 ||
    duration <= 0 ||
    offset + duration > MAX_SECONDS ||
    (!Number.isFinite(recordingDuration) && recordingDuration !== Infinity) ||
    offset >= recordingDuration
  )
    return null;
  return {
    start: Math.max(0, offset - 0.1),
    end: Math.min(recordingDuration, offset + duration + 0.1),
  };
}
