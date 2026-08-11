import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const EXPECTED_CLIENT_ID = "375329782210-6gvtr3bnqopsdt4agfok530r43b60oin.apps.googleusercontent.com";
const REDIRECT_URI = "http://127.0.0.1:4312/api/google/callback";
const repoRoot = resolve(import.meta.dirname, "..");
const envPath = join(repoRoot, ".env.local");
const securePath = resolve(repoRoot, "..", "..", "shared", "private", "google-oauth-crossrepositorycode.json");

function candidates() {
  const explicit = process.argv[2]?.trim();
  if (explicit) return [resolve(explicit)];
  const downloads = join(homedir(), "Downloads");
  if (!existsSync(downloads)) return [];
  return readdirSync(downloads, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => join(downloads, entry.name));
}

function readMatchingClient(path) {
  try {
    const document = JSON.parse(readFileSync(path, "utf8"));
    const client = document?.web;
    if (client?.client_id !== EXPECTED_CLIENT_ID || typeof client?.client_secret !== "string" || !client.client_secret.trim()) return null;
    return { path, clientId: client.client_id, clientSecret: client.client_secret.trim() };
  } catch {
    return null;
  }
}

function setEnv(contents, name, value) {
  const expression = new RegExp(`^${name}=.*$`, "m");
  if (expression.test(contents)) return contents.replace(expression, `${name}=${value}`);
  return `${contents}${contents.endsWith("\n") || !contents ? "" : "\n"}${name}=${value}\n`;
}

const match = candidates().map(readMatchingClient).find(Boolean);
if (!match) {
  console.error("Die neue Google-OAuth-JSON-Datei wurde nicht in Downloads gefunden.");
  console.error(`Erwartete Client-ID: ${EXPECTED_CLIENT_ID}`);
  process.exit(2);
}

let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "# Local-only configuration.\n";
env = setEnv(env, "GOOGLE_CLIENT_ID", match.clientId);
env = setEnv(env, "GOOGLE_CLIENT_SECRET", match.clientSecret);
env = setEnv(env, "GOOGLE_REDIRECT_URI", REDIRECT_URI);
writeFileSync(envPath, env, { encoding: "utf8", mode: 0o600 });

mkdirSync(dirname(securePath), { recursive: true });
copyFileSync(match.path, securePath);

console.log(`Google OAuth wurde sicher importiert (${basename(match.path)}).`);
console.log("Client-ID, Secret und Callback sind jetzt für Tracker, Drive und Kalender eingerichtet.");
