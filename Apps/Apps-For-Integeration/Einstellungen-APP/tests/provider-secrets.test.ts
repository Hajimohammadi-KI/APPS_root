import { describe, expect, mock, test } from "bun:test";

// provider-secrets.ts pulls its D1 binding and master key from
// `cloudflare:workers` at call time (`await import("cloudflare:workers")`),
// so mocking that module before importing provider-secrets is enough to run
// the real encrypt/decrypt code paths against an in-memory fake D1 - no
// Cloudflare runtime required.

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

// A tiny in-memory stand-in for Cloudflare D1, just capable enough to run
// provider-secrets.ts's real SQL statements against a Map instead of a real
// database. Each entry is keyed by "<owner>::<provider>", mirroring the
// table's actual primary key.
function createFakeDatabase() {
  const rows = new Map<string, StoredRow>();
  const database = {
    // D1's `prepare(sql)` returns a statement object; `sql` is inspected by
    // its leading keyword below to decide which fake behavior to run.
    prepare(sql: string) {
      const statement = sql.trim();
      return {
        // CREATE TABLE / CREATE INDEX statements are executed directly
        // without a bind() call in provider-secrets.ts.
        run: async () => undefined,
        // `.bind(...values)` is D1's parameter-binding step; the real
        // driver would send `values` to the database, here they're just
        // captured in this closure for the `all`/`run` calls below.
        bind(...values: unknown[]) {
          return {
            // Used for SELECT queries — look up the one matching row (if
            // any) by owner+provider and return it in D1's `{ results }`
            // shape.
            all: async () => {
              if (statement.startsWith("SELECT")) {
                const [owner, provider] = values as [string, string];
                const row = rows.get(`${owner}::${provider}`);
                return { results: row ? [row] : [] };
              }
              return { results: [] };
            },
            // Used for INSERT/UPDATE/DELETE — mutate the in-memory Map to
            // match what the real table would do.
            run: async () => {
              if (statement.startsWith("INSERT INTO provider_secrets")) {
                // Column order here must match the real INSERT statement's
                // placeholder order in provider-secrets.ts.
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
                // Only the fields the real UPDATE statement actually
                // touches; the ciphertext/iv/salt/key_version stay as they
                // were (a status update doesn't re-encrypt anything).
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
    // provider-secrets.ts may batch several statements together; running
    // them one after another in the fake is equivalent for these tests.
    batch: async (statements: { run: () => Promise<unknown> }[]) => {
      for (const statement of statements) await statement.run();
    },
  };
  return { database, rows };
}

const { database: fakeDb, rows: fakeRows } = createFakeDatabase();
// Stand-in for the real Workers secret (PROVIDER_SECRETS_KEY_V1) that
// provider-secrets.ts derives per-owner encryption keys from. A fresh
// random key each test run is fine — nothing here depends on a fixed value.
const masterKeyB64 = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

// provider-secrets.ts resolves its D1 binding and master key by doing
// `await import("cloudflare:workers")` at call time — mocking that module
// before importing provider-secrets below is enough to make the real
// encrypt/store/decrypt code run against the fake database instead of a
// real Cloudflare Worker.
mock.module("cloudflare:workers", () => ({
  env: { DB: fakeDb, PROVIDER_SECRETS_KEY_V1: masterKeyB64 },
}));

// Imported after the mock is registered, so its internal
// `import("cloudflare:workers")` calls resolve to the fake above.
const { getProviderSecret, saveProviderSecret } = await import("../lib/provider-secrets");

describe("provider-secrets encryption", () => {
  // Baseline case: what you save is exactly what you get back.
  test("round-trips a stored secret for its own owner", async () => {
    await saveProviderSecret("owner-round-trip", "openai", { apiKey: "sk-live-abc" }, {}, "connected");
    const secret = await getProviderSecret<{ apiKey: string }>("owner-round-trip", "openai");
    expect(secret).toEqual({ apiKey: "sk-live-abc" });
  });

  // Confirms encryption is actually per-owner, not just per-secret: the
  // exact same plaintext for two different owners must not produce the
  // same ciphertext on disk.
  test("gives different owners different ciphertext for the same plaintext", async () => {
    const payload = { apiKey: "sk-shared-plaintext" };
    await saveProviderSecret("owner-a", "deepl", payload, {}, "connected");
    await saveProviderSecret("owner-b", "deepl", payload, {}, "connected");
    const rowA = fakeRows.get("owner-a::deepl");
    const rowB = fakeRows.get("owner-b::deepl");
    expect(rowA).toBeDefined();
    expect(rowB).toBeDefined();
    expect(rowA?.ciphertext_b64).not.toBe(rowB?.ciphertext_b64);
    // Each owner still decrypts back to the original plaintext under their
    // own derived key.
    expect(await getProviderSecret<{ apiKey: string }>("owner-a", "deepl")).toEqual(payload);
    expect(await getProviderSecret<{ apiKey: string }>("owner-b", "deepl")).toEqual(payload);
  });

  // The security-critical case: if a row ever ends up read under the wrong
  // owner (a bug elsewhere, a copy/paste, a bad join), decryption must fail
  // rather than silently hand back another user's secret.
  test("derives a per-owner key: a row read under a different owner fails authenticated decryption", async () => {
    await saveProviderSecret("owner-c", "google", { token: "secret-c" }, {}, "connected");
    const rowC = fakeRows.get("owner-c::google");
    expect(rowC).toBeDefined();
    // Simulate a row that ends up looked up under a different owner (e.g. a
    // storage/query bug): the ciphertext was produced with owner-c's HKDF-
    // derived key and AAD, so decrypting it while claiming owner-d must fail
    // closed rather than silently succeed.
    fakeRows.set("owner-d::google", { ...rowC! });
    await expect(getProviderSecret("owner-d", "google")).rejects.toThrow();
  });
});
