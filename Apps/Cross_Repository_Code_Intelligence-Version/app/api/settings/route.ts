import { DEFAULT_WERKZEUG_SETTINGS, isTrustedOrigin, normalizeWerkzeugSettings, settingsForClient } from "../../../lib/werkzeug-settings";
import { isSameOriginMutation, requestUserKey } from "../../../lib/server-user";

type Database = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      all: () => Promise<{ results?: unknown[] }>;
      run: () => Promise<unknown>;
    };
    run: () => Promise<unknown>;
  };
};

async function database() {
  const { env } = await import("cloudflare:workers");
  const db = (env as unknown as { DB?: Database }).DB;
  if (!db) return null;
  await db.prepare("CREATE TABLE IF NOT EXISTS app_settings (owner TEXT PRIMARY KEY, schema_version INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL DEFAULT 1, settings_json TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
  return db;
}

// Cross-origin callers only ever get the sections their registered client
// grant covers (same enforcement the postMessage/iframe embed protocol
// already applies via settingsForClient) -- this REST route previously
// skipped that check entirely and returned the full settings object,
// including every other app's grant-restricted sections, to any caller
// with a valid auth identity. Same-origin (the settings UI itself) and
// requests with no Origin header (server-side, not bound by this check)
// keep getting the full object, since there is no cross-origin caller to
// scope against in those cases.
function scopeToCaller(request: Request, settings: ReturnType<typeof normalizeWerkzeugSettings>) {
  const origin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if (!origin || origin === ownOrigin) return settings;
  if (!isTrustedOrigin(settings, origin, ownOrigin)) return null;
  return settingsForClient(settings, origin);
}

export async function GET(request: Request) {
  const user = await requestUserKey(request);
  if (!user) return Response.json({ message: "Bitte melde dich an, um deine Einstellungen zu laden." }, { status: 401 });
  const db = await database();
  if (!db) {
    const scoped = scopeToCaller(request, DEFAULT_WERKZEUG_SETTINGS);
    if (!scoped) return Response.json({ message: "Diese App ist nicht als vertrauenswürdige Verbindung eingetragen." }, { status: 403 });
    return Response.json({ settings: scoped, revision: 0, persistent: false });
  }
  const result = await db.prepare("SELECT settings_json, revision, updated_at FROM app_settings WHERE owner = ?").bind(user).all();
  const row = (result.results?.[0] || null) as Record<string, unknown> | null;
  if (!row) {
    const scoped = scopeToCaller(request, DEFAULT_WERKZEUG_SETTINGS);
    if (!scoped) return Response.json({ message: "Diese App ist nicht als vertrauenswürdige Verbindung eingetragen." }, { status: 403 });
    return Response.json({ settings: scoped, revision: 0, persistent: true });
  }
  try {
    const settings = normalizeWerkzeugSettings(JSON.parse(String(row.settings_json)));
    const scoped = scopeToCaller(request, settings);
    if (!scoped) return Response.json({ message: "Diese App ist nicht als vertrauenswürdige Verbindung eingetragen." }, { status: 403 });
    return Response.json({ settings: scoped, revision: Number(row.revision || 0), persistent: true });
  } catch {
    const scoped = scopeToCaller(request, DEFAULT_WERKZEUG_SETTINGS);
    if (!scoped) return Response.json({ message: "Diese App ist nicht als vertrauenswürdige Verbindung eingetragen." }, { status: 403 });
    return Response.json({ settings: scoped, revision: Number(row.revision || 0), persistent: true, repaired: true });
  }
}

export async function PUT(request: Request) {
  const user = await requestUserKey(request);
  if (!user) return Response.json({ message: "Bitte melde dich an, um Einstellungen zu speichern." }, { status: 401 });
  if (!isSameOriginMutation(request)) return Response.json({ message: "Diese Änderung ist nur direkt in Einstellungen erlaubt." }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ message: "Die Einstellungsdatei ist kein gültiges JSON." }, { status: 400 }); }
  const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const settings = normalizeWerkzeugSettings(root.settings ?? payload);
  settings.updatedAt = new Date().toISOString();
  const db = await database();
  if (!db) return Response.json({ settings, revision: 0, saved: false, persistent: false });
  const current = await db.prepare("SELECT revision FROM app_settings WHERE owner = ?").bind(user).all();
  const revision = Number((current.results?.[0] as Record<string, unknown> | undefined)?.revision || 0) + 1;
  await db.prepare("INSERT INTO app_settings (owner, schema_version, revision, settings_json, updated_at) VALUES (?, 1, ?, ?, ?) ON CONFLICT(owner) DO UPDATE SET schema_version=excluded.schema_version, revision=excluded.revision, settings_json=excluded.settings_json, updated_at=excluded.updated_at")
    .bind(user, revision, JSON.stringify(settings), settings.updatedAt).run();
  return Response.json({ settings, revision, saved: true, persistent: true });
}

export async function DELETE(request: Request) {
  const user = await requestUserKey(request);
  if (!user) return Response.json({ message: "Bitte melde dich an." }, { status: 401 });
  if (!isSameOriginMutation(request)) return Response.json({ message: "Diese Änderung ist nur direkt in Einstellungen erlaubt." }, { status: 403 });
  const db = await database();
  if (db) await db.prepare("DELETE FROM app_settings WHERE owner = ?").bind(user).run();
  return Response.json({ settings: DEFAULT_WERKZEUG_SETTINGS, reset: true });
}
