import { chmodSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const envPath = resolve(process.cwd(), ".env.local");
let contents = existsSync(envPath)
  ? readFileSync(envPath, "utf8")
  : [
      "# Generated local-only configuration.",
      "# API keys are optional and can be added without changing source files.",
      "",
    ].join("\n");

function setDefault(name, value) {
  const expression = new RegExp(`^${name}=(.*)$`, "m");
  const match = contents.match(expression);
  if (match?.[1]?.trim()) return;
  if (match) {
    contents = contents.replace(expression, `${name}=${value}`);
  } else {
    if (contents && !contents.endsWith("\n")) contents += "\n";
    contents += `${name}=${value}\n`;
  }
}

function setValue(name, value) {
  const expression = new RegExp(`^${name}=(.*)$`, "m");
  if (expression.test(contents)) contents = contents.replace(expression, `${name}=${value}`);
  else {
    if (contents && !contents.endsWith("\n")) contents += "\n";
    contents += `${name}=${value}\n`;
  }
}

function envValue(name) {
  return contents.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim() || "";
}

function migrateLegacyValue(name, legacyValue, currentValue) {
  const expression = new RegExp(`^${name}=(.*)$`, "m");
  const match = contents.match(expression);
  if (match?.[1]?.trim() === legacyValue) {
    contents = contents.replace(expression, `${name}=${currentValue}`);
  }
}

function findGoogleOAuthClient() {
  const override = process.env.GOOGLE_OAUTH_CLIENT_FILE?.trim();
  const candidates = override ? [resolve(override)] : [];

  for (const candidate of candidates) {
    try {
      const document = JSON.parse(readFileSync(candidate, "utf8"));
      const client = document?.web;
      if (typeof client?.client_id === "string" && typeof client?.client_secret === "string") {
        return { clientId: client.client_id, clientSecret: client.client_secret };
      }
    } catch {
      // Ignore unrelated or invalid JSON files and keep the app installable.
    }
  }
  return null;
}

async function findStoredGoogleOAuthClient() {
  const directory = resolve(process.cwd(), ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!existsSync(directory)) return null;
  const candidates = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sqlite") && entry.name !== "metadata.sqlite")
    .map((entry) => resolve(directory, entry.name));

  for (const candidate of candidates) {
    let database;
    try {
      database = new DatabaseSync(candidate, { readOnly: true });
      const row = database.prepare("SELECT ciphertext_b64, iv_b64, salt_b64, key_version FROM provider_secrets WHERE owner = ? AND provider = ?").get("local-user", "google");
      if (!row) continue;
      const masterKey = envValue(`PROVIDER_SECRETS_KEY_V${Number(row.key_version || 1)}`);
      if (!masterKey) continue;
      const decode = (value) => Uint8Array.from(Buffer.from(String(value), "base64"));
      const info = new TextEncoder().encode("einstellungen:provider-secret:v1:local-user:google");
      const source = await crypto.subtle.importKey("raw", decode(masterKey), "HKDF", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: decode(row.salt_b64), info }, source, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
      const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(row.iv_b64), additionalData: info, tagLength: 128 }, key, decode(row.ciphertext_b64));
      const client = JSON.parse(new TextDecoder().decode(plaintext));
      if (typeof client?.clientId === "string" && typeof client?.clientSecret === "string") return client;
    } catch {
      // Older or unrelated local databases are skipped without exposing data.
    } finally {
      database?.close();
    }
  }
  return null;
}

migrateLegacyValue("API_PORT", "4311", "4313");
migrateLegacyValue("WEB_ORIGIN", "http://127.0.0.1:4310", "http://127.0.0.1:4312");
migrateLegacyValue("API_INTERNAL_URL", "http://127.0.0.1:4311/v1/health", "http://127.0.0.1:4313/v1/health");
migrateLegacyValue("GOOGLE_REDIRECT_URI", "http://127.0.0.1:4310/api/google/callback", "http://127.0.0.1:4312/api/google/callback");

setDefault("LOCAL_MODE", "1");
setDefault("API_PORT", "4313");
setDefault("WEB_ORIGIN", "http://127.0.0.1:4312");
setDefault("API_INTERNAL_URL", "http://127.0.0.1:4313/v1/health");
setDefault("PROVIDER_SECRETS_ACTIVE_KEY_VERSION", "1");
setDefault("PROVIDER_SECRETS_KEY_V1", randomBytes(32).toString("base64"));
setDefault("OPENAI_MODEL", "gpt-5.6-sol");
setDefault("GOOGLE_REDIRECT_URI", "http://127.0.0.1:4312/api/google/callback");

const storedGoogleOAuthClient = await findStoredGoogleOAuthClient();
const googleOAuthClient = storedGoogleOAuthClient || findGoogleOAuthClient();
if (googleOAuthClient) {
  // The explicit local configuration is authoritative. Stored provider data
  // may come from an older or disabled OAuth client, so it must only fill
  // missing values and must never overwrite a newly configured client.
  setDefault("GOOGLE_CLIENT_ID", googleOAuthClient.clientId);
  setDefault("GOOGLE_CLIENT_SECRET", googleOAuthClient.clientSecret);
  setDefault("GOOGLE_REDIRECT_URI", googleOAuthClient.redirectUri || "http://127.0.0.1:4312/api/google/callback");
}

writeFileSync(envPath, contents, { encoding: "utf8", mode: 0o600 });
try {
  chmodSync(envPath, 0o600);
} catch {
  // Windows may not implement POSIX file modes; the file remains local.
}

console.log("Lokale Konfiguration bereit: .env.local (Schlüsselwerte werden nicht ausgegeben).");
if (googleOAuthClient) console.log("Google-OAuth-Konfiguration wurde für die Ein-Klick-Verbindung erkannt.");
