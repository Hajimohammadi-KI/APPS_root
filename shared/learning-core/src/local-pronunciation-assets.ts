export interface PinnedPhonemeAsset {
  readonly file: string;
  readonly bytes: number;
  readonly sha256: string;
}
export interface PinnedAssetCache {
  match(url: string): Promise<Response | undefined>;
  delete(url: string): Promise<boolean>;
  put(url: string, response: Response): Promise<void>;
}

/** Fetch automatically decodes gzip/br. Bound the decoded stream, not encoded Content-Length. */
async function boundedBytes(
  response: Response,
  size: number,
  deadline: Promise<never>,
  onProgress: (bytes: number) => void,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.ok || !response.body) {
    void response.body?.cancel().catch(() => undefined);
    throw new Error(
      "Model files are unavailable. Connect once to download them, then try again.",
    );
  }
  const reader = response.body.getReader(),
    bytes = new Uint8Array(size);
  let count = 0;
  try {
    while (true) {
      const part = await Promise.race([reader.read(), deadline]);
      if (part.done) break;
      if (count + part.value.byteLength > size)
        throw new Error("Model file verification failed.");
      bytes.set(part.value, count);
      count += part.value.byteLength;
      onProgress(count);
    }
    if (count !== size) throw new Error("Model file verification failed.");
    return bytes;
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
async function verify(
  bytes: Uint8Array<ArrayBuffer>,
  item: PinnedPhonemeAsset,
): Promise<void> {
  const hash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== item.sha256) throw new Error("Model file verification failed.");
}

/** Both cached and network model bytes are bounded and authenticated before inference. */
export async function loadPinnedPhonemeAsset(
  item: PinnedPhonemeAsset,
  url: string,
  {
    cache = null,
    fetcher = fetch,
    onProgress = () => undefined,
    timeoutMs = 20000,
  }: {
    cache?: PinnedAssetCache | null;
    fetcher?: typeof fetch;
    onProgress?: (bytes: number) => void;
    timeoutMs?: number;
  } = {},
): Promise<Uint8Array<ArrayBuffer>> {
  if (
    !Number.isInteger(item.bytes) ||
    item.bytes < 1 ||
    item.bytes > 5_000_000 ||
    !/^[a-f0-9]{64}$/u.test(item.sha256) ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60000
  )
    throw new Error("Invalid pinned model asset.");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new Error(
          "Model loading timed out. Try again or use your saved recording.",
        ),
      );
    }, timeoutMs);
  });
  try {
    try {
      const cached = cache
        ? await Promise.race([cache.match(url), deadline])
        : undefined;
      if (cached) {
        const bytes = await boundedBytes(
          cached,
          item.bytes,
          deadline,
          onProgress,
        );
        await Promise.race([verify(bytes, item), deadline]);
        return bytes;
      }
    } catch (error) {
      if (controller.signal.aborted) throw error;
      // A corrupt/oversized cached entry is evicted before retrying its pinned source.
      try {
        await Promise.race([cache?.delete(url), deadline]);
      } catch {
        if (controller.signal.aborted) throw error;
      }
    }
    const response = await Promise.race([
      fetcher(url, {
        method: "GET",
        credentials: "omit",
        redirect: "error",
        cache: "no-cache",
        signal: controller.signal,
      }),
      deadline,
    ]);
    const bytes = await boundedBytes(
      response,
      item.bytes,
      deadline,
      onProgress,
    );
    await Promise.race([verify(bytes, item), deadline]);
    try {
      await Promise.race([
        cache?.put(
          url,
          new Response(bytes, {
            headers: { "Content-Type": "application/octet-stream" },
          }),
        ),
        deadline,
      ]);
    } catch {
      /* Durable storage is optional; these verified bytes can still run locally. */
    }
    return bytes;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "Model loading timed out. Try again or use your saved recording.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
