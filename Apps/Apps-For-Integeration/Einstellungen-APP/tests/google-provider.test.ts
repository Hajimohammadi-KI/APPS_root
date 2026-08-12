import { afterEach, describe, expect, mock, test } from "bun:test";

// Same in-memory fake-D1 approach as provider-secrets.test.ts: google-provider.ts
// stores/reads its client config and tokens through provider-secrets.ts, which
// resolves its D1 binding and master key via `cloudflare:workers` at call time.
// Mocking that module lets the real encrypt/store/refresh code run without a
// Cloudflare runtime, and mocking `fetch` keeps the test off the real network.

type StoredRow = {
  ciphertext_b64: string;
  iv_b64: string;
  salt_b64: string;
  key_version: number;
  metadata_json: string;
  connection_state: string;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

// Same fake D1 as provider-secrets.test.ts (kept local rather than shared,
// so this test file has no cross-file dependency): a Map keyed by
// "<owner>::<provider>", enough to run google-provider.ts's real reads and
// writes without a Cloudflare runtime.
function createFakeDatabase() {
  const rows = new Map<string, StoredRow>();
  const database = {
    prepare(sql: string) {
      const statement = sql.trim();
      return {
        // CREATE TABLE / CREATE INDEX run directly, no bind() involved.
        run: async () => undefined,
        bind(...values: unknown[]) {
          return {
            // SELECT: hand back the one row for this owner+provider, if any.
            all: async () => {
              if (statement.startsWith("SELECT")) {
                const [owner, provider] = values as [string, string];
                const row = rows.get(`${owner}::${provider}`);
                return { results: row ? [row] : [] };
              }
              return { results: [] };
            },
            // INSERT/UPDATE/DELETE: mutate the Map the same way the real
            // table would.
            run: async () => {
              if (statement.startsWith("INSERT INTO provider_secrets")) {
                const [
                  owner, provider, ciphertext_b64, iv_b64, salt_b64,
                  key_version, metadata_json, connection_state, last_tested_at,
                  created_at, updated_at,
                ] = values as [
                  string, string, string, string, string,
                  number, string, string, string | null,
                  string, string,
                ];
                rows.set(`${owner}::${provider}`, {
                  ciphertext_b64, iv_b64, salt_b64, key_version,
                  metadata_json, connection_state, last_tested_at,
                  created_at, updated_at,
                });
              } else if (statement.startsWith("UPDATE provider_secrets")) {
                const [metadata_json, connection_state, last_tested_at, updated_at, owner, provider] = values as [
                  string, string, string | null, string, string, string,
                ];
                const key = `${owner}::${provider}`;
                const existing = rows.get(key);
                if (existing) rows.set(key, { ...existing, metadata_json, connection_state, last_tested_at, updated_at });
              } else if (statement.startsWith("DELETE FROM provider_secrets")) {
                const [owner, provider] = values as [string, string];
                rows.delete(`${owner}::${provider}`);
              }
              return undefined;
            },
          };
        },
      };
    },
    batch: async (statements: { run: () => Promise<unknown> }[]) => {
      for (const statement of statements) await statement.run();
    },
  };
  return { database, rows };
}

const { database: fakeDb, rows: fakeRows } = createFakeDatabase();
// Any fixed-shape key works here — these tests never assert on its value,
// only that encrypt/decrypt round-trips through provider-secrets.ts work.
const masterKeyB64 = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

mock.module("cloudflare:workers", () => ({
  env: { DB: fakeDb, PROVIDER_SECRETS_KEY_V1: masterKeyB64 },
}));

// Imported after the mock is registered so google-provider.ts's own
// `import("cloudflare:workers")` (via provider-secrets.ts) sees the fake.
const { googleAccessToken } = await import("../lib/google-provider");
const { saveProviderSecret } = await import("../lib/provider-secrets");

// googleAccessToken() reads the caller's identity the same way every other
// route in this app does — via the `oai-authenticated-user-id` header — so
// each test builds a request carrying the owner key it set up secrets for.
function requestFor(owner: string) {
  return new Request("https://example.invalid/api/google", {
    headers: { "oai-authenticated-user-id": owner },
  });
}

// Every test below stubs `globalThis.fetch`; restore the real one after
// each test so stubs never leak between tests.
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("google token refresh", () => {
  // Happy path: an expired access token + a valid refresh token should
  // trigger exactly one call to Google's token endpoint and come back with
  // a new access token, with the stored connection state staying "connected".
  test("refreshes an expired access token when a refresh token exists", async () => {
    const owner = "owner-refresh-ok";
    // Client config (no secret — this app uses PKCE) and the stored token
    // pair the refresh logic will read.
    await saveProviderSecret(owner, "google", { clientId: "test-client-id", clientSecret: "", redirectUri: "" }, {}, "connected");
    await saveProviderSecret(owner, "google_tokens", {
      accessToken: "old-access-token",
      refreshToken: "refresh-token-abc",
      // Already in the past, so googleAccessToken() must treat it as
      // needing a refresh rather than reusing it as-is.
      expiresAt: Date.now() - 5000,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      tokenType: "Bearer",
    }, {}, "connected");

    // Record every URL fetch() is called with, and hand back a successful
    // Google token response — this stands in for the real oauth2.googleapis.com
    // endpoint.
    const calls: string[] = [];
    globalThis.fetch = mock(async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify({
        access_token: "new-access-token",
        refresh_token: "refresh-token-abc",
        expires_in: 3600,
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        token_type: "Bearer",
      }), { status: 200 });
    }) as unknown as typeof fetch;

    const result = await googleAccessToken(requestFor(owner));

    // Exactly the real Google token endpoint was hit, once.
    expect(calls).toEqual(["https://oauth2.googleapis.com/token"]);
    expect(result.token).toBe("new-access-token");
    expect(fakeRows.get(`${owner}::google_tokens`)?.connection_state).toBe("connected");
  });

  // No refresh token stored at all: there's nothing to refresh with, so the
  // code must not even attempt a network call — it should recognize the
  // dead end immediately and report the connection as expired.
  test("does not call the network and reports expiry when no refresh token exists", async () => {
    const owner = "owner-no-refresh-token";
    await saveProviderSecret(owner, "google", { clientId: "test-client-id", clientSecret: "", redirectUri: "" }, {}, "connected");
    // Deliberately omits `refreshToken`.
    await saveProviderSecret(owner, "google_tokens", {
      accessToken: "old-access-token",
      expiresAt: Date.now() - 5000,
      scope: "",
      tokenType: "Bearer",
    }, {}, "connected");

    const fetchMock = mock(async () => new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await googleAccessToken(requestFor(owner));

    // The key assertion: no network call was even attempted.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.token).toBeNull();
    expect(result.message).toBeTruthy();
    expect(fakeRows.get(`${owner}::google`)?.connection_state).toBe("expired");
  });

  // A refresh token exists, but Google rejects it (e.g. revoked access).
  // The failure must be handled explicitly — no token returned, and the
  // stored connection state flipped to expired rather than left stale as
  // "connected".
  test("fails closed and marks the connection expired when Google's refresh call errors", async () => {
    const owner = "owner-refresh-fails";
    await saveProviderSecret(owner, "google", { clientId: "test-client-id", clientSecret: "", redirectUri: "" }, {}, "connected");
    await saveProviderSecret(owner, "google_tokens", {
      accessToken: "old-access-token",
      refreshToken: "refresh-token-bad",
      expiresAt: Date.now() - 5000,
      scope: "",
      tokenType: "Bearer",
    }, {}, "connected");

    // Simulate Google's real error response for a revoked/invalid refresh
    // token.
    globalThis.fetch = mock(async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })) as unknown as typeof fetch;

    const result = await googleAccessToken(requestFor(owner));

    expect(result.token).toBeNull();
    expect(fakeRows.get(`${owner}::google`)?.connection_state).toBe("expired");
  });
});
