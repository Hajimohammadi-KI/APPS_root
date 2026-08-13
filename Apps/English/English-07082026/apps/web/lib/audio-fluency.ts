// Real, audio-derived fluency measurement -- not a text word-count/time
// ratio. Decodes the actual recorded PCM samples and measures amplitude
// over short windows to separate active speech from silence/pauses, per
// AUTOMATICITY_PRODUCT_CONTRACT.md §9.2's "active speech duration excluding
// non-speech pauses." This does not attempt pronunciation or prosody
// analysis (a genuinely harder problem needing a specialized provider) --
// only what can be measured honestly from amplitude alone: how much of the
// recording was actual speech versus silence, and how the words-per-second
// rate looks when pause time is excluded.

export interface AudioFluencyAnalysis {
  totalDurationSeconds: number;
  activeSpeechSeconds: number;
  pauseCount: number;
  totalPauseSeconds: number;
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
    return { totalDurationSeconds, activeSpeechSeconds, pauseCount, totalPauseSeconds };
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
  return Math.max(0, Math.min(100, Math.round((rate / TARGET_WORDS_PER_SECOND) * 100)));
}
