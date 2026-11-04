import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  loadPinnedPhonemeAsset,
  type PinnedAssetCache,
} from "./local-pronunciation-assets";
const bytes = new Uint8Array([1, 2, 3, 4]);
const item = {
  file: "test.wasm",
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
};
const url = "https://app.example/learning-core/local-phoneme/assets/test.wasm";
function cacheWith(
  response: Response | undefined,
): PinnedAssetCache & { deleted: boolean; written: Response | null } {
  return {
    deleted: false,
    written: null,
    async match() {
      return response;
    },
    async delete() {
      this.deleted = true;
      return true;
    },
    async put(_url, response) {
      this.written = response;
    },
  };
}
const offline = (async () => {
  throw new Error("offline");
}) as typeof fetch;
test("decoded gzip/br bytes validate despite their compressed Content-Length", async () => {
  for (const encoding of ["gzip", "br"]) {
    const cache = cacheWith(undefined),
      progress: number[] = [];
    const result = await loadPinnedPhonemeAsset(item, url, {
      cache,
      onProgress: (n) => progress.push(n),
      fetcher: (async () =>
        new Response(bytes, {
          headers: { "content-encoding": encoding, "content-length": "28" },
        })) as typeof fetch,
    });
    expect(result).toEqual(bytes);
    expect(progress.at(-1)).toBe(4);
    expect(cache.written).not.toBeNull();
  }
});
test("verified cached model loads offline using bounded stream not arrayBuffer", async () => {
  const response = new Response(bytes);
  response.arrayBuffer = () => {
    throw new Error("unbounded allocation forbidden");
  };
  expect(
    await loadPinnedPhonemeAsset(item, url, {
      cache: cacheWith(response),
      fetcher: offline,
    }),
  ).toEqual(bytes);
});
test("oversized cached body cancels safely, evicts and fetches the pinned replacement", async () => {
  let cancelled = false,
    fetches = 0;
  const response = new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(5));
      },
      cancel() {
        cancelled = true;
        throw new Error("cancel rejected");
      },
    }),
  );
  const cache = cacheWith(response);
  const result = await loadPinnedPhonemeAsset(item, url, {
    cache,
    fetcher: (async () => {
      fetches++;
      return new Response(bytes);
    }) as typeof fetch,
  });
  expect(result).toEqual(bytes);
  expect(cancelled).toBe(true);
  expect(cache.deleted).toBe(true);
  expect(fetches).toBe(1);
});
test("corrupt or truncated cache is discarded; changed network bytes never run", async () => {
  for (const corrupt of [
    new Uint8Array([4, 3, 2, 1]),
    new Uint8Array([1, 2]),
  ]) {
    const cache = cacheWith(new Response(corrupt));
    await expect(
      loadPinnedPhonemeAsset(item, url, {
        cache,
        fetcher: (async () => new Response(corrupt)) as typeof fetch,
      }),
    ).rejects.toThrow("verification");
    expect(cache.deleted).toBe(true);
    expect(cache.written).toBeNull();
  }
});
test("stalled fetch reaches deadline and aborts instead of keeping UI busy", async () => {
  let signal: AbortSignal | undefined;
  await expect(
    loadPinnedPhonemeAsset(item, url, {
      timeoutMs: 10,
      fetcher: ((_url, init) => {
        signal = init?.signal ?? undefined;
        return new Promise(() => {});
      }) as typeof fetch,
    }),
  ).rejects.toThrow("timed out");
  expect(signal?.aborted).toBe(true);
});
test("stalled response stream reaches deadline and is cancelled", async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    }),
  );
  await expect(
    loadPinnedPhonemeAsset(item, url, {
      timeoutMs: 10,
      fetcher: (async () => response) as typeof fetch,
    }),
  ).rejects.toThrow("timed out");
  expect(cancelled).toBe(true);
});
test("stalled cached stream also has deadline; no network upload or unbounded wait", async () => {
  let cancelled = false;
  const cache = cacheWith(
    new Response(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true;
        },
      }),
    ),
  );
  await expect(
    loadPinnedPhonemeAsset(item, url, {
      cache,
      timeoutMs: 10,
      fetcher: offline,
    }),
  ).rejects.toThrow("timed out");
  expect(cancelled).toBe(true);
});
test("network is GET without credentials, no redirect or upload", async () => {
  await loadPinnedPhonemeAsset(item, url, {
    fetcher: (async (input, init) => {
      expect(String(input)).toBe(url);
      expect(init?.method).toBe("GET");
      expect(init?.body).toBeUndefined();
      expect(init?.redirect).toBe("error");
      expect(init?.credentials).toBe("omit");
      return new Response(bytes);
    }) as typeof fetch,
  });
});
