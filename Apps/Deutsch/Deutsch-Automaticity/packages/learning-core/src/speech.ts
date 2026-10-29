import { normalizeText, tokenizeText } from "./text";
import { alignAnswers } from "./automaticity/answer-alignment";
export { describeAnswerEdits } from "./automaticity/answer-alignment";
/** Legacy numeric accuracy is a placeholder on unverified evidence, never a grade. */
export function spokenPracticeEvidence() {
  return {
    targetHit: false,
    accuracyScore: 0,
    fluencyScore: null,
    attemptVerified: false,
  } as const;
}
export function splitSpokenSentences(
  source: string,
): { text: string; start: number; end: number }[] {
  const result: { text: string; start: number; end: number }[] = [];
  const abbreviation = /\b(?:Dr|Mr|Mrs|Ms|Prof|bzw|usw|ca|z\.B)\.$/iu;
  let start = 0;
  const add = (end: number) => {
    while (start < end && /\s/u.test(source[start]!)) start++;
    if (start < end)
      result.push({ text: source.slice(start, end), start, end });
    start = end;
  };
  for (const match of source.matchAll(/[.!?]+(?=\s|$)/gu)) {
    const end = match.index + match[0].length;
    if (abbreviation.test(source.slice(start, end))) continue;
    add(end);
  }
  add(source.trimEnd().length);
  return result;
}
export interface WaveformDescription {
  readonly durationSeconds: number;
  readonly activeSeconds: number;
  readonly quietIntervals: number;
  readonly clipped: boolean;
  readonly fluencyScore: null;
}
export function describeWaveform(
  samples: Float32Array,
  sampleRate: number,
): WaveformDescription | null {
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate < 1000 ||
    sampleRate > 192000 ||
    !samples.length ||
    samples.length > sampleRate * 600
  )
    return null;
  const windowSize = Math.max(1, Math.round(sampleRate * 0.02));
  const frames: { active: boolean; samples: number }[] = [];
  let clipped = false,
    active = 0;
  for (let start = 0; start < samples.length; start += windowSize) {
    const end = Math.min(start + windowSize, samples.length);
    let sum = 0;
    for (let i = start; i < end; i++) {
      const sample = samples[i]!;
      if (!Number.isFinite(sample) || Math.abs(sample) > 1) return null;
      clipped ||= Math.abs(sample) >= 0.99;
      sum += sample * sample;
    }
    const audible = Math.sqrt(sum / (end - start)) >= 0.01;
    if (audible) active += end - start;
    frames.push({ active: audible, samples: end - start });
  }
  let quiet = 0,
    quietIntervals = 0,
    heard = false;
  for (const frame of frames) {
    if (frame.active) {
      if (heard && quiet / sampleRate >= 0.3) quietIntervals++;
      heard = true;
      quiet = 0;
    } else quiet += frame.samples;
  }
  return {
    durationSeconds: samples.length / sampleRate,
    activeSeconds: active / sampleRate,
    quietIntervals,
    clipped,
    fluencyScore: null,
  };
}
/** Decode and describe on this device; no raw audio leaves this function. */
export async function describeRecording(
  blob: Blob,
): Promise<WaveformDescription | null> {
  if (
    typeof AudioContext === "undefined" ||
    !blob.size ||
    blob.size > 20_000_000
  )
    return null;
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await blob.arrayBuffer());
    if (audio.numberOfChannels !== 1) return null; // Do not hide a silent channel by averaging.
    return describeWaveform(audio.getChannelData(0), audio.sampleRate);
  } catch {
    return null;
  } finally {
    await context.close();
  }
}
export interface WarningCalibration {
  readonly threshold: number;
  readonly falseAlerts: number;
  readonly misses: number;
  readonly samples: number;
}
/** Optimizer only. Synthetic unit fixtures do not qualify a deployed audio model. */
export function calibrateWarningThreshold(
  samples: readonly {
    readonly errorProbability: number;
    readonly error: boolean;
  }[],
): WarningCalibration | null {
  if (
    !samples.length ||
    samples.some(
      (s) =>
        !Number.isFinite(s.errorProbability) ||
        s.errorProbability < 0 ||
        s.errorProbability > 1,
    ) ||
    !samples.some((s) => s.error) ||
    !samples.some((s) => !s.error)
  )
    return null;
  const candidates = [
    ...new Set([1.000001, ...samples.map((s) => s.errorProbability)]),
  ].sort((a, b) => b - a);
  let best: WarningCalibration | null = null,
    bestCost = Infinity;
  for (const threshold of candidates) {
    const falseAlerts = samples.filter(
      (s) => !s.error && s.errorProbability >= threshold,
    ).length;
    const misses = samples.filter(
      (s) => s.error && s.errorProbability < threshold,
    ).length;
    const cost = 10 * falseAlerts + misses;
    if (cost < bestCost) {
      bestCost = cost;
      best = { threshold, falseAlerts, misses, samples: samples.length };
    }
  }
  return best;
}
/** No live calibration is approved yet; the installed apps intentionally pass null. */
export function pronunciationWarning(
  evidence: {
    readonly source: "recognition" | "acoustic";
    readonly errorProbability: number;
  },
  calibration: WarningCalibration | null,
): "review_audio" | null {
  return evidence.source === "acoustic" &&
    calibration &&
    calibration.falseAlerts === 0 &&
    calibration.samples >= 40 &&
    Number.isFinite(evidence.errorProbability) &&
    evidence.errorProbability >= calibration.threshold &&
    evidence.errorProbability <= 1
    ? "review_audio"
    : null;
}
const contrasts = {
  en: [
    { words: ["thin", "tin"], phonemes: ["θɪn", "tɪn"] },
    { words: ["think", "sink"], phonemes: ["θɪŋk", "sɪŋk"] },
    { words: ["wet", "vet"], phonemes: ["wɛt", "vɛt"] },
    { words: ["west", "vest"], phonemes: ["wɛst", "vɛst"] },
    { words: ["ship", "sheep"], phonemes: ["ʃɪp", "ʃiːp"] },
  ],
  de: [
    { words: ["schön", "schon"], phonemes: ["ʃøːn", "ʃoːn"] },
    { words: ["fühlen", "fielen"], phonemes: ["ˈfyːlən", "ˈfiːlən"] },
    { words: ["drücken", "drucken"], phonemes: ["ˈdʁʏkən", "ˈdʁʊkən"] },
    { words: ["ich", "ach"], phonemes: ["ɪç", "ax"] },
  ],
} as const;
/** A small reviewed pronunciation lexicon; no G2P guess for unknown words. */
export function phoneticPractice(text: string, language: "en" | "de") {
  const words = new Set(
    tokenizeText(text)
      .filter((t) => t.kind === "word")
      .map((t) => t.normalized.toLocaleLowerCase(language)),
  );
  return contrasts[language]
    .filter((pair) => pair.words.some((word) => words.has(word)))
    .map((pair) => ({ ...pair, diagnosis: null }));
}
/** Lexical phone comparison explains a possible contrast, not what was pronounced. */
export function compareSpeechSounds(
  transcript: string,
  target: string,
  language: "en" | "de",
) {
  const lexicon = new Map<string, string>();
  for (const pair of contrasts[language])
    pair.words.forEach((word, i) => lexicon.set(word, pair.phonemes[i]!));
  return compareSpeechTarget(transcript, target).edits.flatMap((edit) => {
    if (edit.type !== "replace") return [];
    const recognizedPhonemes = lexicon.get(edit.original),
      targetPhonemes = lexicon.get(edit.expected);
    return recognizedPhonemes && targetPhonemes
      ? [
          {
            recognizedWord: edit.original,
            targetWord: edit.expected,
            recognizedPhonemes,
            targetPhonemes,
            source: "transcript-only" as const,
            pronunciationScore: null,
          },
        ]
      : [];
  });
}

export function compareSpeechTarget(transcript: string, target: string) {
  const words = (s: string) =>
    tokenizeText(s.slice(0, 10000))
      .filter((t) => t.kind === "word")
      .map((t) => t.normalized.toLocaleLowerCase())
      .join(" ");
  const actual = words(transcript),
    expected = words(target);
  const comparable =
    !!actual &&
    !!expected &&
    actual.split(" ").length <= 200 &&
    expected.split(" ").length <= 200 &&
    transcript.length <= 10000 &&
    target.length <= 10000;
  return {
    comparable,
    edits: comparable ? alignAnswers(actual, expected) : [],
    pronunciationScore: null,
  } as const;
}
export interface RecognitionAlternative {
  readonly transcript: string;
  readonly confidence?: number;
}
export interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length?: number;
  readonly [index: number]: RecognitionAlternative | undefined;
}
export interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<RecognitionResult>;
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  start(): void;
  stop(): void;
}
export interface RecognitionEvidence {
  readonly finalText: string;
  readonly interimText: string;
  readonly alternatives: readonly (readonly RecognitionAlternative[])[];
  readonly reliable: boolean;
  readonly pronunciationScore: null;
}
/** Browser confidence describes recognition, never the quality of pronunciation. */
export class RecognitionCollector {
  constructor(private readonly initialText = "") {}
  update(event: RecognitionEvent): RecognitionEvidence {
    const final: string[] = [this.initialText],
      interim: string[] = [];
    const alternatives: RecognitionAlternative[][] = [];
    let reliable = true;
    for (let i = 0; i < Math.min(event.results.length, 500); i++) {
      const result = event.results[i];
      if (!result) continue;
      const choices: RecognitionAlternative[] = [];
      for (let j = 0; j < Math.min(result.length ?? 1, 3); j++) {
        const candidate = result[j];
        if (candidate && typeof candidate.transcript === "string")
          choices.push({
            transcript: candidate.transcript,
            ...(typeof candidate.confidence === "number"
              ? { confidence: candidate.confidence }
              : {}),
          });
      }
      const text = choices[0]?.transcript ?? "";
      (result.isFinal ? final : interim).push(text);
      if (result.isFinal) alternatives.push(choices);
      if (
        !result.isFinal ||
        !text.trim() ||
        !choices.length ||
        choices.some(
          (choice) =>
            !Number.isFinite(choice.confidence) ||
            (choice.confidence ?? 0) < 0.9 ||
            (choice.confidence ?? 0) > 1 ||
            normalizeText(choice.transcript).toLocaleLowerCase() !==
              normalizeText(text).toLocaleLowerCase(),
        )
      )
        reliable = false;
    }
    return {
      finalText: final.filter(Boolean).join(" ").trim(),
      interimText: interim.join(" ").trim(),
      alternatives,
      reliable: reliable && alternatives.length > 0,
      pronunciationScore: null,
    };
  }
}
