import { requestOwner } from "./server-user";
import { DEFAULT_OPENAI_MODEL } from "./model-config";

export type ProviderName = "google" | "google_tokens" | "openai" | "deepl";
export type ConnectionState = "not_configured" | "untested" | "connected" | "expired" | "quota_exhausted" | "error";

type Database = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      all: () => Promise<{ results?: unknown[] }>;
      run: () => Promise<unknown>;
    };
    run: () => Promise<unknown>;
  };
  batch?: (statements: unknown[]) => Promise<unknown>;
};

type RuntimeEnv = Record<string, unknown> & { DB?: Database };
type SecretRow = {
  ciphertext_b64: string;
  iv_b64: string;
  salt_b64: string;
  key_version: number;
  metadata_json: string;
  connection_state: ConnectionState;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

const PROVIDERS: ProviderName[] = ["google", "google_tokens", "openai", "deepl"];
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function runtimeEnv(): Promise<RuntimeEnv> {
  const workersModule = await import("cloudflare:workers");
  return workersModule.env as unknown as RuntimeEnv;
}

async function database() {
  const env = await runtimeEnv();
  const db = env.DB;
  if (!db) return null;
  const table = db.prepare(`CREATE TABLE IF NOT EXISTS provider_secrets (
    owner TEXT NOT NULL,
    provider TEXT NOT NULL,
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    salt_b64 TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'A256GCM',
    key_version INTEGER NOT NULL DEFAULT 1,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    connection_state TEXT NOT NULL DEFAULT 'untested',
    last_tested_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner, provider)
  )`);
  const index = db.prepare("CREATE INDEX IF NOT EXISTS provider_secrets_owner_idx ON provider_secrets(owner)");
  if (db.batch) await db.batch([table, index]);
  else { await table.run(); await index.run(); }
  return db;
}

async function masterKey(version: number) {
  const env = await runtimeEnv();
  const value = String(env[`PROVIDER_SECRETS_KEY_V${version}`] || process.env[`PROVIDER_SECRETS_KEY_V${version}`] || "");
  if (!value) throw new Error("secure_storage_not_configured");
  let material: Uint8Array<ArrayBuffer>;
  try { material = base64ToBytes(value); } catch { material = new Uint8Array(encoder.encode(value)); }
  return crypto.subtle.importKey("raw", material, "HKDF", false, ["deriveKey"]);
}

async function derivedKey(owner: string, provider: ProviderName, salt: Uint8Array<ArrayBuffer>, version: number) {
  const info = encoder.encode(`einstellungen:provider-secret:v1:${owner}:${provider}`);
  const source = await masterKey(version);
  const key = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info }, source, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { key, info };
}

async function encrypt(owner: string, provider: ProviderName, payload: unknown) {
  const env = await runtimeEnv();
  const version = Math.max(1, Number(env.PROVIDER_SECRETS_ACTIVE_KEY_VERSION || process.env.PROVIDER_SECRETS_ACTIVE_KEY_VERSION || 1));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const { key, info } = await derivedKey(owner, provider, salt, version);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: info, tagLength: 128 }, key, encoder.encode(JSON.stringify(payload)));
  return { ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)), ivB64: bytesToBase64(iv), saltB64: bytesToBase64(salt), version };
}

async function decrypt<T>(owner: string, provider: ProviderName, row: SecretRow): Promise<T> {
  const salt = base64ToBytes(row.salt_b64);
  const iv = base64ToBytes(row.iv_b64);
  const { key, info } = await derivedKey(owner, provider, salt, Number(row.key_version || 1));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: info, tagLength: 128 }, key, base64ToBytes(row.ciphertext_b64));
  return JSON.parse(decoder.decode(plaintext)) as T;
}

function parseMetadata(value: string) {
  try { return JSON.parse(value || "{}") as Record<string, unknown>; } catch { return {}; }
}

export function assertProvider(value: unknown): ProviderName | null {
  const provider = String(value || "") as ProviderName;
  return PROVIDERS.includes(provider) ? provider : null;
}

export async function getProviderRecord(owner: string, provider: ProviderName) {
  const db = await database();
  if (!db) return null;
  const result = await db.prepare("SELECT ciphertext_b64, iv_b64, salt_b64, key_version, metadata_json, connection_state, last_tested_at, created_at, updated_at FROM provider_secrets WHERE owner = ? AND provider = ?").bind(owner, provider).all();
  const row = (result.results?.[0] || null) as SecretRow | null;
  if (!row) return null;
  return { row, metadata: parseMetadata(row.metadata_json) };
}

export async function getProviderSecret<T>(owner: string, provider: ProviderName): Promise<T | null> {
  const record = await getProviderRecord(owner, provider);
  if (!record) return null;
  return decrypt<T>(owner, provider, record.row);
}

export async function getProviderSecretForRequest<T>(request: Request, provider: ProviderName): Promise<T | null> {
  const owner = requestOwner(request);
  if (!owner) return null;
  const stored = await getProviderSecret<T>(owner, provider);
  if (stored) return stored;
  const env = await runtimeEnv();
  if (provider === "openai" && (env.OPENAI_API_KEY || process.env.OPENAI_API_KEY)) return { apiKey: String(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY), model: String(env.OPENAI_MODEL || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL) } as T;
  if (provider === "deepl" && (env.DEEPL_API_KEY || process.env.DEEPL_API_KEY)) {
    const apiKey = String(env.DEEPL_API_KEY || process.env.DEEPL_API_KEY);
    return { apiKey, tier: apiKey.endsWith(":fx") ? "free" : "pro" } as T;
  }
  // The client secret is optional on purpose: a shipped "Desktop app" client
  // uses PKCE and has no secret, which is what lets a learner connect Google
  // without ever creating their own Google Cloud project.
  if (provider === "google" && (env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID)) return {
    clientId: String(env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
    clientSecret: String(env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ""),
    redirectUri: String(env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || ""),
  } as T;
  return null;
}

export async function saveProviderSecret(owner: string, provider: ProviderName, payload: unknown, metadata: Record<string, unknown>, state: ConnectionState, testedAt: string | null = null) {
  const db = await database();
  if (!db) throw new Error("database_unavailable");
  const envelope = await encrypt(owner, provider, payload);
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO provider_secrets (owner, provider, ciphertext_b64, iv_b64, salt_b64, algorithm, key_version, metadata_json, connection_state, last_tested_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'A256GCM', ?, ?, ?, ?, ?, ?) ON CONFLICT(owner, provider) DO UPDATE SET ciphertext_b64=excluded.ciphertext_b64, iv_b64=excluded.iv_b64, salt_b64=excluded.salt_b64, algorithm=excluded.algorithm, key_version=excluded.key_version, metadata_json=excluded.metadata_json, connection_state=excluded.connection_state, last_tested_at=excluded.last_tested_at, updated_at=excluded.updated_at")
    .bind(owner, provider, envelope.ciphertextB64, envelope.ivB64, envelope.saltB64, envelope.version, JSON.stringify(metadata), state, testedAt, now, now).run();
}

export async function updateProviderState(owner: string, provider: ProviderName, state: ConnectionState, metadataPatch: Record<string, unknown> = {}, testedAt: string | null = new Date().toISOString()) {
  const db = await database();
  if (!db) return;
  const record = await getProviderRecord(owner, provider);
  const metadata = { ...(record?.metadata || {}), ...metadataPatch };
  await db.prepare("UPDATE provider_secrets SET metadata_json = ?, connection_state = ?, last_tested_at = ?, updated_at = ? WHERE owner = ? AND provider = ?")
    .bind(JSON.stringify(metadata), state, testedAt, new Date().toISOString(), owner, provider).run();
}

export async function deleteProviderSecret(owner: string, provider: ProviderName) {
  const db = await database();
  if (db) await db.prepare("DELETE FROM provider_secrets WHERE owner = ? AND provider = ?").bind(owner, provider).run();
}

export async function providerSummary(request: Request, provider: Exclude<ProviderName, "google_tokens">) {
  const owner = requestOwner(request);
  if (!owner) return { configured: false, state: "not_configured" as ConnectionState, metadata: {}, testedAt: null };
  const record = await getProviderRecord(owner, provider);
  const configured = Boolean(record || await getProviderSecretForRequest(request, provider));
  return {
    configured,
    state: record?.row.connection_state || (configured ? "untested" : "not_configured"),
    metadata: record?.metadata || {},
    testedAt: record?.row.last_tested_at || null,
  };
}
