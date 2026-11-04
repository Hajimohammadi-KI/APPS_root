export const LOCAL_PRONUNCIATION_MODEL_ID = "hama-js@1.7.0/asr-v3" as const;
export const localModelAssetManifest = [
  {
    file: "hama.wasm",
    bytes: 47465,
    sha256: "4525bd3d75df567434cd1ac6d01bbf26173136d2594289524ab780c9b636e661",
  },
  {
    file: "asr_waveform.hama",
    bytes: 4723088,
    sha256: "a9fcfe73e179ca48e399cd76a90a6b3e1887bf5037ecc52b778d13a149563328",
  },
  {
    file: "g2p_vocab.json",
    bytes: 220107,
    sha256: "520d19e4e6ae58658eed53594e0feab8ea8e1b4b04a7746e25e50c16c29b91bf",
  },
] as const;
export interface LocalPronunciationSpan {
  readonly phoneme: string;
  readonly startMs: number;
  readonly endMs: number;
}
export interface LocalPronunciationObservation {
  readonly source: "local_phoneme_model";
  readonly modelId: typeof LOCAL_PRONUNCIATION_MODEL_ID;
  readonly phonemes: readonly string[];
  readonly spans: readonly LocalPronunciationSpan[];
  readonly durationMs: number;
  readonly pronunciationScore: null;
  readonly verified: false;
}
const fail = (): never => {
  throw new Error(
    "No usable local acoustic observation. Try a short clear recording or ask your teacher to listen.",
  );
};
const isPhone = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 20 &&
  /^[a-zA-Z\u00c0-\u02ff\u0300-\u036fβθχᵊᵝ‿⁰¹²³⁴⁵⁻⁽⁾꜔]+$/u.test(value);
function duration(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 30000
  )
    return fail();
  return value;
}
/** A voiced-signal guard, not a speech-quality or correctness classifier. */
export function validateLocalPronunciationSamples(
  samples: unknown,
  sampleRate: unknown,
): number {
  if (
    !(samples instanceof Float32Array) ||
    sampleRate !== 16000 ||
    samples.length < 320 ||
    samples.length > 480000
  )
    return fail();
  let power = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample) || Math.abs(sample) > 1) return fail();
    power += sample * sample;
  }
  if (Math.sqrt(power / samples.length) < 0.0005) return fail();
  return samples.length / 16;
}
/** CTC emissions only; no target sentence, word dictionary or text ASR is an input. */
export function decodeLocalPhonemeFrames(
  frames: readonly number[],
  tokens: readonly string[],
  durationMs: number,
): LocalPronunciationObservation {
  duration(durationMs);
  if (!frames.length || frames.length > 1500 || tokens.length > 512)
    return fail();
  const blank = tokens.indexOf("<blank>"),
    emissions: { phoneme: string; frame: number }[] = [];
  if (blank < 0) return fail();
  let previous = -1;
  for (let frame = 0; frame < frames.length; frame++) {
    const id = frames[frame]!;
    if (!Number.isInteger(id) || id < 0 || id >= tokens.length) return fail();
    if (id === previous) continue;
    previous = id;
    if (id === blank) continue;
    const phoneme = tokens[id]!;
    if (phoneme !== "<wb>" && !isPhone(phoneme)) return fail();
    emissions.push({ phoneme, frame });
  }
  const spans: LocalPronunciationSpan[] = [];
  for (let i = 0; i < emissions.length; i++) {
    const item = emissions[i]!;
    if (item.phoneme === "<wb>") continue;
    const startMs = Math.min(durationMs, item.frame * 20),
      endMs = Math.min(
        durationMs,
        (emissions[i + 1]?.frame ?? frames.length) * 20,
      );
    if (endMs <= startMs) return fail();
    spans.push({ phoneme: item.phoneme, startMs, endMs });
  }
  return parseLocalPronunciationObservation({
    source: "local_phoneme_model",
    modelId: LOCAL_PRONUNCIATION_MODEL_ID,
    phonemes: spans.map((s) => s.phoneme),
    spans,
    durationMs,
    pronunciationScore: null,
    verified: false,
  });
}
export function parseLocalPronunciationObservation(
  raw: unknown,
): LocalPronunciationObservation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail();
  const r = raw as Record<string, unknown>,
    durationMs = duration(r.durationMs);
  if (
    r.source !== "local_phoneme_model" ||
    r.modelId !== LOCAL_PRONUNCIATION_MODEL_ID ||
    r.pronunciationScore !== null ||
    r.verified !== false ||
    !Array.isArray(r.phonemes) ||
    !Array.isArray(r.spans) ||
    !r.phonemes.length ||
    r.phonemes.length > 1000 ||
    r.spans.length !== r.phonemes.length
  )
    return fail();
  const phonemes = r.phonemes.map((p) => (isPhone(p) ? p : fail()));
  if (!/\p{L}/u.test(phonemes.join(""))) return fail();
  let previousEnd = 0;
  const spans = r.spans.map((s: unknown, i) => {
    if (!s || typeof s !== "object" || Array.isArray(s)) return fail();
    const span = s as Record<string, unknown>,
      startMs = span.startMs,
      endMs = span.endMs;
    if (
      span.phoneme !== phonemes[i] ||
      typeof startMs !== "number" ||
      typeof endMs !== "number" ||
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs) ||
      startMs < previousEnd ||
      endMs <= startMs ||
      endMs > durationMs
    )
      return fail();
    previousEnd = endMs;
    return { phoneme: phonemes[i]!, startMs, endMs };
  });
  return {
    source: "local_phoneme_model",
    modelId: LOCAL_PRONUNCIATION_MODEL_ID,
    phonemes,
    spans,
    durationMs,
    pronunciationScore: null,
    verified: false,
  };
}
