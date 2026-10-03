export interface SignalSummary {
  durationSeconds: number;
  peakDb: number | null;
  rmsDb: number | null;
  clippedFraction: number;
  state: "silence" | "quiet" | "clipped" | "signal";
}
/** Recording diagnostics only. Signal energy does not measure pronunciation. */
export function summarizeSignal(
  samples: Float32Array,
  sampleRate: number,
): SignalSummary {
  if (
    !samples.length ||
    !Number.isFinite(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 192000
  )
    throw Error("Invalid audio samples");
  let peak = 0,
    squares = 0,
    clipped = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample) || Math.abs(sample) > 1.01)
      throw Error("Invalid PCM amplitude");
    peak = Math.max(peak, Math.abs(sample));
    squares += sample * sample;
    if (Math.abs(sample) >= 0.99) clipped++;
  }
  const rms = Math.sqrt(squares / samples.length),
    clippedFraction = clipped / samples.length;
  return {
    durationSeconds: samples.length / sampleRate,
    peakDb: peak ? 20 * Math.log10(peak) : null,
    rmsDb: rms ? 20 * Math.log10(rms) : null,
    clippedFraction,
    state:
      peak < 0.00001
        ? "silence"
        : rms < 0.00316
          ? "quiet"
          : clippedFraction > 0.01
            ? "clipped"
            : "signal",
  };
}
