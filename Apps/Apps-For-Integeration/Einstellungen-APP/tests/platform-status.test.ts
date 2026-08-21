import { afterEach, describe, expect, test } from "bun:test";

import { GET } from "../app/api/platform/status/route";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("platform status fallback", () => {
  test("never reports the database reachable when the real health check fails", async () => {
    globalThis.fetch = (async () =>
      new Response(null, { status: 503 })) as unknown as typeof fetch;

    const response = await GET();
    const payload = (await response.json()) as {
      api: { connected: boolean };
      database: { configured: boolean; reachable: boolean };
    };

    expect(payload.api.connected).toBe(false);
    expect(payload.database.configured).toBe(false);
    expect(payload.database.reachable).toBe(false);
  });
});
