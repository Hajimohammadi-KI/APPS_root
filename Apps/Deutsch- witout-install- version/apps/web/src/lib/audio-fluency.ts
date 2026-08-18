// Real, audio-derived fluency measurement -- not a text word-count/time
// ratio (which is what this app's speaking mission used before this file
// existed). Decodes the actual recorded PCM samples and measures
// amplitude over short windows to separate active speech from silence/
// pauses, plus a real (if approximate) intonation signal via
// autocorrelation-based pitch tracking. This does not attempt
// phoneme-level pronunciation scoring (a genuinely harder problem needing
// a specialized provider, e.g. Azure Pronunciation Assessment) -- only
// what can be measured honestly client-side, with no external service or
// key: active-speech timing from amplitude, and pitch variety from the
// raw waveform itself. Ported from the English app's equivalent module.

export interface AudioFluencyAnalysis {
  totalDurationSeconds: number;
  activeSpeechSeconds: number;
  pauseCount: number;
  totalPauseSeconds: number;
  // Real fundamental-frequency samples across active-speech windows
  // (autocorrelation, computed client-side -- not a provider call). null
  // when too little voiced audio was captured to say anything meaningful.
  medianPitchHz: number | null;
  // Standard deviation of pitch in semitones (perceptually linear, unlike
  // raw Hz) -- a rough proxy for "monotone vs. varied intonation," a
  // commonly cited non-native speech feature. Not phoneme-level
  // pronunciation accuracy (that still needs a specialized provider like
  // Azure Pronunciation Assessment), but a genuine signal beyond timing
  // alone, computed with no external service or key.
  pitchVarietySemitones: number | null;
}

// Tuned for typical laptop/headset mic input in a quiet room, not a lab
// calibration -- a window's RMS amplitude below this is treated as silence.
const SILENCE_RMS_THRESHOLD = 0.02;
// Gaps shorter than this are normal inter-word/inter-syllable gaps, not a
// meaningful pause -- only longer silences count toward pauseCount.
const MIN_PAUSE_SECONDS = 0.3;
const WINDOW_SECONDS = 0.05;

type AudioContextConstructor = new () => AudioContext;

function resolveAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const withWebkit = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? withWebkit.webkitAudioContext ?? null;
}

// Typical human speech fundamental frequency range -- lags outside this
// band are rejected outright, which also keeps the search cheap.
const MIN_PITCH_HZ = 80;
const MAX_PITCH_HZ = 400;
// Below this, autocorrelation on a near-silent or unvoiced (fricative/
// noise) window produces a confident-looking but meaningless peak -- only
// windows with a real periodic signal (voiced speech) should contribute.
const MIN_VOICED_CORRELATION = 0.35;

// Single-window fundamental frequency via normalized autocorrelation --
// the standard, dependency-free way to estimate pitch from raw PCM. Not a
// formant/phoneme analysis, just "how fast is this segment of waveform
// repeating," which is what pitch (voice fundamental) actually is.
export function detectPitchHz(
  window: Float32Array,
  sampleRate: number,
): number | null {
  const minLag = Math.floor(sampleRate / MAX_PITCH_HZ);
  const maxLag = Math.min(
    window.length - 1,
    Math.ceil(sampleRate / MIN_PITCH_HZ),
  );
  if (maxLag <= minLag) return null;

  let energy = 0;
  for (const sample of window) energy += sample * sample;
  if (energy <= 0) return null;

  let bestLag = -1;
  let bestCorrelation = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < window.length - lag; i += 1) {
      correlation += window[i]! * window[i + lag]!;
    }
    const normalized = correlation / energy;
    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorrelation < MIN_VOICED_CORRELATION) return null;
  return sampleRate / bestLag;
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

// Standard deviation of pitch expressed in semitones relative to the
// sample's own median -- semitones are a perceptually linear scale
// (each step sounds like an equal pitch change), unlike raw Hz, so this
// is the right unit for "how much did the pitch vary," not just "by how
// many Hz."
export function pitchVarietyInSemitones(
  pitchesHz: readonly number[],
  medianHz: number,
): number | null {
  if (pitchesHz.length < 3 || medianHz <= 0) return null;
  const semitones = pitchesHz.map((hz) => 12 * Math.log2(hz / medianHz));
  const meanSemitone =
    semitones.reduce((total, value) => total + value, 0) / semitones.length;
  const variance =
    semitones.reduce((total, value) => total + (value - meanSemitone) ** 2, 0) /
    semitones.length;
  return Math.sqrt(variance);
}

export async function analyzeAudioFluency(
  blob: Blob,
): Promise<AudioFluencyAnalysis | null> {
  const AudioContextCtor = resolveAudioContextConstructor();
  if (!AudioContextCtor) return null;

  const audioContext = new AudioContextCtor();
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const windowSize = Math.max(1, Math.round(WINDOW_SECONDS * sampleRate));
    const totalDurationSeconds = audioBuffer.duration;

    let currentSilenceSeconds = 0;
    let pauseCount = 0;
    let totalPauseSeconds = 0;
    const pitchesHz: number[] = [];

    for (let start = 0; start < channelData.length; start += windowSize) {
      const end = Math.min(start + windowSize, channelData.length);
      let sumSquares = 0;
      for (let i = start; i < end; i += 1) {
        const sample = channelData[i] ?? 0;
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / Math.max(1, end - start));
      const windowSeconds = (end - start) / sampleRate;

      if (rms >= SILENCE_RMS_THRESHOLD) {
        if (currentSilenceSeconds >= MIN_PAUSE_SECONDS) {
          pauseCount += 1;
          totalPauseSeconds += currentSilenceSeconds;
        }
        currentSilenceSeconds = 0;
        const pitchHz = detectPitchHz(
          channelData.subarray(start, end),
          sampleRate,
        );
        if (pitchHz !== null) pitchesHz.push(pitchHz);
      } else {
        currentSilenceSeconds += windowSeconds;
      }
    }
    if (currentSilenceSeconds >= MIN_PAUSE_SECONDS) {
      pauseCount += 1;
      totalPauseSeconds += currentSilenceSeconds;
    }

    const activeSpeechSeconds = Math.max(
      0,
      totalDurationSeconds - totalPauseSeconds,
    );
    const medianPitchHz = median(pitchesHz);
    return {
      totalDurationSeconds,
      activeSpeechSeconds,
      pauseCount,
      totalPauseSeconds,
      medianPitchHz,
      pitchVarietySemitones:
        medianPitchHz !== null
          ? pitchVarietyInSemitones(pitchesHz, medianPitchHz)
          : null,
    };
  } catch {
    // Decoding can fail on some MediaRecorder mime types depending on
    // browser/codec support -- treat as "could not be measured", not as an
    // error to surface, since the caller must fall back to "not assessed"
    // either way.
    return null;
  } finally {
    await audioContext.close();
  }
}

// Words per second of active speech, scaled to a 0-100 score. 2.5 words/sec
// (~150 wpm) is a common benchmark for comfortable conversational pace, so
// that rate maps to 100; slower or faster (which usually signals rushing,
// not fluency) score proportionally lower.
const TARGET_WORDS_PER_SECOND = 2.5;

export function scoreFromActiveSpeech(
  wordCount: number,
  activeSpeechSeconds: number,
): number {
  if (activeSpeechSeconds <= 0) return 0;
  const rate = wordCount / activeSpeechSeconds;
  return Math.max(
    0,
    Math.min(100, Math.round((rate / TARGET_WORDS_PER_SECOND) * 100)),
  );
}
