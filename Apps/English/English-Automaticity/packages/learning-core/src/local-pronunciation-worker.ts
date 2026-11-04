import { HamaEngine, ASR_VOCAB } from "./vendor/hama-js/engine.js";
import { loadPinnedPhonemeAsset } from "./local-pronunciation-assets";
import {
  decodeLocalPhonemeFrames,
  localModelAssetManifest,
  validateLocalPronunciationSamples,
} from "./pronunciation-assessment";

// Dedicated worker: the only network operations are GETs for these three static, pinned same-origin assets.
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage: (message: unknown) => void;
};
const totalBytes = localModelAssetManifest.reduce(
  (sum, item) => sum + item.bytes,
  0,
);
const cacheName = "automaticity-local-phonemes-hama-1.7.0";
let model: { engine: HamaEngine; handle: number; tokens: string[] } | null =
    null,
  busy = false;
const progress = (
  requestId: string,
  stage: "loading" | "analysing",
  loadedBytes: number,
) =>
  scope.postMessage({
    type: "progress",
    requestId,
    stage,
    loadedBytes,
    totalBytes,
  });
async function loadAsset(
  item: (typeof localModelAssetManifest)[number],
  requestId: string,
  already: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const url = new URL(`./local-phoneme/assets/${item.file}`, import.meta.url);
  let cache: Cache | null = null;
  try {
    cache = await caches.open(cacheName);
  } catch {
    /* Private browsing may disable durable caching; local inference can still run. */
  }
  return loadPinnedPhonemeAsset(item, url.href, {
    cache,
    onProgress: (bytes) => progress(requestId, "loading", already + bytes),
  });
}
async function loadModel(requestId: string) {
  if (model) return model;
  progress(requestId, "loading", 0);
  const loaded: Uint8Array<ArrayBuffer>[] = [];
  let done = 0;
  for (const item of localModelAssetManifest) {
    loaded.push(await loadAsset(item, requestId, done));
    done += item.bytes;
  }
  const vocab: unknown = JSON.parse(new TextDecoder().decode(loaded[2]!));
  if (
    !vocab ||
    typeof vocab !== "object" ||
    !("decoder" in vocab) ||
    !Array.isArray(vocab.decoder) ||
    !vocab.decoder.every((x) => typeof x === "string")
  )
    throw new Error("Model vocabulary is invalid.");
  const tokens = [...(vocab.decoder as string[]), "<wb>", "<blank>"];
  if (tokens.length !== ASR_VOCAB)
    throw new Error("Model vocabulary is invalid.");
  const engine = await HamaEngine.fromBytes(loaded[0]!);
  model = { engine, handle: engine.loadAsr(loaded[1]!), tokens };
  return model;
}
scope.onmessage = (event) => {
  const data = event.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return;
  const input = data as Record<string, unknown>,
    requestId = input.requestId;
  if (typeof requestId !== "string" || requestId.length > 100) return;
  if (busy) {
    scope.postMessage({
      type: "error",
      requestId,
      error: "Another local analysis is still running.",
    });
    return;
  }
  if (input.type !== "load" && input.type !== "analyse") return;
  // Unknown payload keys, including transcript/target text, are rejected rather than entering inference.
  const allowed =
    input.type === "load"
      ? ["type", "requestId"]
      : ["type", "requestId", "samples", "sampleRate"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    scope.postMessage({
      type: "error",
      requestId,
      error: "Only the recorded waveform can be analysed here.",
    });
    return;
  }
  busy = true;
  void (async () => {
    try {
      const durationMs =
        input.type === "analyse"
          ? validateLocalPronunciationSamples(input.samples, input.sampleRate)
          : 0;
      const current = await loadModel(requestId);
      if (input.type === "load") {
        scope.postMessage({ type: "ready", requestId });
        return;
      }
      progress(requestId, "analysing", totalBytes);
      const output = current.engine.asrRun(
        current.handle,
        input.samples as Float32Array,
      );
      if (
        !Number.isInteger(output.T) ||
        !Number.isInteger(output.outLength) ||
        output.outLength < 1 ||
        output.outLength > output.T ||
        output.outLength > 1500 ||
        output.logProbs.length !== output.T * ASR_VOCAB
      )
        throw new Error("No usable acoustic observation.");
      const blank = current.tokens.indexOf("<blank>"),
        frames: number[] = [];
      for (let t = 0; t < output.outLength; t++) {
        let best = -1,
          score = -Infinity;
        for (let c = 0; c < ASR_VOCAB; c++) {
          const raw = output.logProbs[t * ASR_VOCAB + c]!;
          if (!Number.isFinite(raw))
            throw new Error("No usable acoustic observation.");
          const adjusted = raw / 0.95 + (c === blank ? -0.1 : 0);
          if (adjusted > score) {
            best = c;
            score = adjusted;
          }
        }
        frames.push(best);
      }
      scope.postMessage({
        type: "result",
        requestId,
        result: decodeLocalPhonemeFrames(frames, current.tokens, durationMs),
      });
    } catch (error) {
      scope.postMessage({
        type: "error",
        requestId,
        error:
          error instanceof Error
            ? error.message
            : "Local sound analysis is unavailable.",
      });
    } finally {
      busy = false;
    }
  })();
};
