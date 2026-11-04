import { Buffer } from "node:buffer";
import {
  parseAzurePronunciation,
  validatePronunciationTarget,
  validatePronunciationWav,
  type PronunciationVariant,
} from "./pronunciation-assessment";

export interface PronunciationProviderConfig {
  readonly key?: string | undefined;
  readonly region?: string | undefined;
}
export interface PronunciationRateLimiter {
  take(client: string): number;
}
const headers = { "Cache-Control": "no-store" };
const error = (
  message: string,
  status: number,
  extra: Record<string, string> = {},
) =>
  Response.json(
    { error: message },
    { status, headers: { ...headers, ...extra } },
  );
function configured(config: PronunciationProviderConfig): boolean {
  return (
    typeof config.key === "string" &&
    config.key.length >= 8 &&
    config.key.length <= 1024 &&
    !/[\s\u0000-\u001f\u007f]/u.test(config.key) &&
    typeof config.region === "string" &&
    /^[a-z][a-z0-9]{1,31}$/u.test(config.region)
  );
}
export function pronunciationCapability(config: PronunciationProviderConfig) {
  return {
    available: configured(config),
    provider: "Microsoft Azure Speech" as const,
    maxSeconds: 30 as const,
    supportedVariants: ["en-US", "en-GB"] as const,
  };
}

/** Best-effort per-instance protection, not a distributed account spending limit. */
export function createPronunciationRateLimiter({
  now = Date.now,
  perClient = 3,
  total = 30,
  maxClients = 256,
}: {
  now?: () => number;
  perClient?: number;
  total?: number;
  maxClients?: number;
} = {}): PronunciationRateLimiter {
  let start = now(),
    count = 0;
  const clients = new Map<string, number>();
  return {
    take(client) {
      const at = now();
      if (at < start || at - start >= 60_000) {
        start = at;
        count = 0;
        clients.clear();
      }
      const previous = clients.get(client) ?? 0;
      if (
        count >= total ||
        previous >= perClient ||
        (!clients.has(client) && clients.size >= maxClients)
      )
        return Math.max(1, Math.ceil((start + 60_000 - at) / 1000));
      clients.set(client, previous + 1);
      count++;
      return 0;
    },
  };
}
const defaultLimiter = createPronunciationRateLimiter();
class TooLarge extends Error {}
async function boundedBody(
  body: ReadableStream<Uint8Array> | null,
  max: number,
  contentLength: string | null,
): Promise<Uint8Array<ArrayBuffer>> {
  if (
    contentLength !== null &&
    (!/^\d+$/u.test(contentLength) || Number(contentLength) > max)
  )
    throw new TooLarge();
  if (!body) throw new Error("Missing body");
  const reader = body.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0,
    timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Read timeout")), 20_000);
  });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      size += part.value.byteLength;
      if (size > max) throw new TooLarge();
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.length;
    }
    return bytes;
  } catch (cause) {
    void reader.cancel().catch(() => undefined);
    throw cause;
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}

/** Explicit short-clip upload; never reads or saves a learner's stored recordings. */
export async function handlePronunciationAssessment(
  request: Request,
  config: PronunciationProviderConfig,
  {
    fetcher = fetch,
    limiter = defaultLimiter,
  }: { fetcher?: typeof fetch; limiter?: PronunciationRateLimiter } = {},
): Promise<Response> {
  if (request.method !== "POST")
    return error("Use POST for an audio observation.", 405, { Allow: "POST" });
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return error("Audio upload must start from this app.", 403);
  if (!configured(config))
    return error("Audio analysis is not configured. Nothing was sent.", 503);
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data;\s*boundary=/iu.test(contentType))
    return error(
      "Provide a recorded WAV file and its explicit reference text.",
      400,
    );
  let audio: Uint8Array<ArrayBuffer>,
    referenceText: string,
    variant: PronunciationVariant,
    durationSeconds: number;
  try {
    const bytes = await boundedBody(
      request.body,
      1_100_000,
      request.headers.get("content-length"),
    );
    const form = await new Response(bytes, {
      headers: { "content-type": contentType },
    }).formData();
    const keys = [...form.keys()];
    if (
      keys.length !== 4 ||
      new Set(keys).size !== 4 ||
      keys.some(
        (k) => !["audio", "referenceText", "variant", "consent"].includes(k),
      )
    )
      return error(
        "Provide exactly one audio file, reference text, variant and consent.",
        400,
      );
    if (form.get("consent") !== "true")
      return error(
        "Sending this recording requires explicit audio consent. Nothing was sent.",
        403,
      );
    referenceText = validatePronunciationTarget(form.get("referenceText"));
    const requestedVariant = form.get("variant");
    if (requestedVariant !== "en-US" && requestedVariant !== "en-GB")
      return error("Choose a supported English pronunciation variant.", 400);
    variant = requestedVariant;
    const file = form.get("audio");
    if (
      !(file instanceof Blob) ||
      !["audio/wav", "audio/x-wav"].includes(file.type)
    )
      return error(
        "Provide a mono 16 kHz PCM WAV recording up to 30 seconds.",
        400,
      );
    audio = new Uint8Array(await file.arrayBuffer());
    durationSeconds = validatePronunciationWav(audio).durationSeconds;
  } catch (cause) {
    return cause instanceof TooLarge
      ? error("The audio upload exceeds the short-clip limit.", 413)
      : error(
          "Invalid audio or reference text. Use a non-silent mono 16 kHz PCM WAV up to 30 seconds.",
          400,
        );
  }
  const client = (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  ).slice(0, 128);
  const retry = limiter.take(client);
  if (retry)
    return error(
      "Too many audio checks. Nothing was sent; try again later.",
      429,
      { "Retry-After": String(retry) },
    );
  const options = {
    ReferenceText: referenceText,
    GradingSystem: "HundredMark",
    Dimension: "Comprehensive",
    Granularity: "Phoneme",
    EnableMiscue: true,
    ...(variant === "en-US"
      ? { PhonemeAlphabet: "IPA", NBestPhonemeCount: 3 }
      : {}),
  };
  try {
    const response = await fetcher(
      `https://${config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${variant}&format=detailed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
          "Ocp-Apim-Subscription-Key": config.key!,
          "Pronunciation-Assessment": Buffer.from(
            JSON.stringify(options),
            "utf8",
          ).toString("base64"),
          Accept: "application/json",
        },
        body: audio,
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok) {
      void response.body?.cancel().catch(() => undefined);
      throw new Error("Unavailable");
    }
    const raw = JSON.parse(
      new TextDecoder().decode(
        await boundedBody(
          response.body,
          1_000_000,
          response.headers.get("content-length"),
        ),
      ),
    );
    return Response.json(
      parseAzurePronunciation(raw, { variant, referenceText, durationSeconds }),
      { headers },
    );
  } catch {
    return error(
      "No usable acoustic observation was returned. Your recording has not been graded; try again or ask your teacher to listen.",
      502,
    );
  }
}
