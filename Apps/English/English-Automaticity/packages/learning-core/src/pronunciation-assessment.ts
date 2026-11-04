/** Descriptive acoustic observations, never a pronunciation grade or mastery event. */
export type PronunciationVariant = "en-US" | "en-GB";
export interface PronunciationPhoneme {
  readonly expected: string;
  readonly heard: string | null;
  readonly offsetSeconds: number;
  readonly durationSeconds: number;
}
export interface PronunciationWord {
  readonly word: string;
  readonly offsetSeconds: number;
  readonly durationSeconds: number;
  readonly phonemes: readonly PronunciationPhoneme[];
}
export interface PronunciationObservation {
  readonly kind: "audio_observation";
  readonly provider: "Microsoft Azure Speech";
  readonly variant: PronunciationVariant;
  readonly referenceText: string;
  readonly recognizedText: string;
  readonly spokenPhonemesAvailable: boolean;
  readonly words: readonly PronunciationWord[];
  readonly pronunciationScore: null;
  readonly verified: false;
}
const fail = (): never => {
  throw new Error("Invalid pronunciation evidence.");
};
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
  )
    return fail();
  return value.trim();
}
function list(value: unknown, max: number, empty = false): unknown[] {
  if (!Array.isArray(value) || value.length > max || (!empty && !value.length))
    return fail();
  return value;
}
function bounded(value: unknown, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  )
    return fail();
  return value;
}
function variant(value: unknown): PronunciationVariant {
  if (value !== "en-US" && value !== "en-GB") return fail();
  return value;
}
export function validatePronunciationTarget(value: unknown): string {
  const result = text(value, 500);
  if (result.split(/\s+/u).length > 100 || !/\p{L}/u.test(result))
    return fail();
  return result;
}
function interval(offset: unknown, duration: unknown, total: number) {
  const offsetSeconds = bounded(offset, total);
  const durationSeconds = bounded(duration, total);
  if (offsetSeconds + durationSeconds > total + 0.001) return fail();
  return { offsetSeconds, durationSeconds };
}
function providerInterval(raw: Record<string, unknown>, total: number) {
  const offset = bounded(raw.Offset, 300_000_000);
  const duration = bounded(raw.Duration, 300_000_000);
  if (!Number.isInteger(offset) || !Number.isInteger(duration)) return fail();
  return interval(offset / 10_000_000, duration / 10_000_000, total);
}
function assertWithin(
  child: { offsetSeconds: number; durationSeconds: number },
  parent: { offsetSeconds: number; durationSeconds: number },
) {
  if (
    child.offsetSeconds < parent.offsetSeconds - 0.001 ||
    child.offsetSeconds + child.durationSeconds >
      parent.offsetSeconds + parent.durationSeconds + 0.001
  )
    fail();
}

/** Parse only acoustic fields returned by the pronunciation endpoint. Text is never a fallback for phones. */
export function parseAzurePronunciation(
  raw: unknown,
  context: {
    variant: PronunciationVariant;
    referenceText: string;
    durationSeconds: number;
  },
): PronunciationObservation {
  const locale = variant(context.variant);
  const referenceText = validatePronunciationTarget(context.referenceText);
  const total = bounded(context.durationSeconds, 30);
  if (!total) return fail();
  const root = record(raw);
  if (root.RecognitionStatus !== "Success" && root.RecognitionStatus !== 0)
    return fail();
  const best = record(list(root.NBest, 10)[0]);
  bounded(record(best.PronunciationAssessment).AccuracyScore, 100);
  const words = list(best.Words, 200).map((value) => {
    const source = record(value),
      timing = providerInterval(source, total);
    bounded(record(source.PronunciationAssessment).AccuracyScore, 100);
    const phonemes: PronunciationPhoneme[] =
      locale === "en-US"
        ? list(source.Phonemes ?? [], 100, true).map((value) => {
            const phone = record(value),
              phoneTiming = providerInterval(phone, total);
            assertWithin(phoneTiming, timing);
            const assessment = record(phone.PronunciationAssessment);
            bounded(assessment.AccuracyScore, 100);
            const alternatives = list(
              assessment.NBestPhonemes ?? [],
              10,
              true,
            ).map((value) => {
              const choice = record(value);
              return {
                phone: text(choice.Phoneme, 40),
                score: bounded(choice.Score, 100),
              };
            });
            const highest = alternatives.reduce<{
              phone: string;
              score: number;
            } | null>((a, b) => (!a || b.score > a.score ? b : a), null);
            return {
              expected: text(phone.Phoneme, 40),
              heard: highest?.phone ?? null,
              ...phoneTiming,
            };
          })
        : [];
    return { word: text(source.Word, 100), ...timing, phonemes };
  });
  if (locale === "en-US" && !words.some((w) => w.phonemes.length))
    return fail();
  return {
    kind: "audio_observation",
    provider: "Microsoft Azure Speech",
    variant: locale,
    referenceText,
    recognizedText: text(best.Display ?? root.DisplayText, 4000),
    spokenPhonemesAvailable: words.some((w) =>
      w.phonemes.some((p) => p.heard !== null),
    ),
    words,
    pronunciationScore: null,
    verified: false,
  };
}

/** Validate the public projection again before the browser renders external data. */
export function parsePronunciationObservation(
  raw: unknown,
): PronunciationObservation {
  const root = record(raw),
    locale = variant(root.variant);
  if (
    root.kind !== "audio_observation" ||
    root.provider !== "Microsoft Azure Speech" ||
    root.pronunciationScore !== null ||
    root.verified !== false ||
    typeof root.spokenPhonemesAvailable !== "boolean"
  )
    return fail();
  const words = list(root.words, 200).map((value) => {
    const source = record(value),
      timing = interval(source.offsetSeconds, source.durationSeconds, 30);
    const phonemes = list(source.phonemes, 100, true).map((value) => {
      const phone = record(value),
        phoneTiming = interval(phone.offsetSeconds, phone.durationSeconds, 30);
      assertWithin(phoneTiming, timing);
      return {
        expected: text(phone.expected, 40),
        heard: phone.heard === null ? null : text(phone.heard, 40),
        ...phoneTiming,
      };
    });
    if (locale === "en-GB" && phonemes.length) return fail();
    return { word: text(source.word, 100), ...timing, phonemes };
  });
  const spokenPhonemesAvailable = words.some((w) =>
    w.phonemes.some((p) => p.heard !== null),
  );
  if (
    root.spokenPhonemesAvailable !== spokenPhonemesAvailable ||
    (locale === "en-US" && !words.some((w) => w.phonemes.length))
  )
    return fail();
  return {
    kind: "audio_observation",
    provider: "Microsoft Azure Speech",
    variant: locale,
    referenceText: validatePronunciationTarget(root.referenceText),
    recognizedText: text(root.recognizedText, 4000),
    spokenPhonemesAvailable,
    words,
    pronunciationScore: null,
    verified: false,
  };
}

/** The browser encoder emits this canonical PCM WAV, so reject other formats rather than guessing. */
export function validatePronunciationWav(bytes: Uint8Array): {
  durationSeconds: number;
} {
  if (
    bytes.byteLength < 46 ||
    bytes.byteLength > 960_044 ||
    bytes.byteLength % 2
  )
    return fail();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number, expected: string) =>
    [...expected].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  if (
    !tag(0, "RIFF") ||
    !tag(8, "WAVE") ||
    !tag(12, "fmt ") ||
    !tag(36, "data") ||
    view.getUint32(4, true) !== bytes.length - 8 ||
    view.getUint32(16, true) !== 16 ||
    view.getUint16(20, true) !== 1 ||
    view.getUint16(22, true) !== 1 ||
    view.getUint32(24, true) !== 16000 ||
    view.getUint32(28, true) !== 32000 ||
    view.getUint16(32, true) !== 2 ||
    view.getUint16(34, true) !== 16 ||
    view.getUint32(40, true) !== bytes.length - 44
  )
    return fail();
  let active = false;
  for (let i = 44; i < bytes.length; i += 2)
    if (Math.abs(view.getInt16(i, true)) >= 16) {
      active = true;
      break;
    }
  if (!active) return fail();
  return { durationSeconds: (bytes.length - 44) / 32000 };
}
