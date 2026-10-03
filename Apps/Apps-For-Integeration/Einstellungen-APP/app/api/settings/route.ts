import { DEFAULT_WERKZEUG_SETTINGS, normalizeWerkzeugSettings } from "../../../lib/werkzeug-settings";
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

export async function GET(request: Request) {
  const user = await requestUserKey(request);
  if (!user) return Response.json({ message: "Bitte melde dich an, um deine Einstellungen zu laden." }, { status: 401 });
  const db = await database();
  if (!db) return Response.json({ settings: DEFAULT_WERKZEUG_SETTINGS, revision: 0, persistent: false });
  const result = await db.prepare("SELECT settings_json, revision, updated_at FROM app_settings WHERE owner = ?").bind(user).all();
  const row = (result.results?.[0] || null) as Record<string, unknown> | null;
  if (!row) return Response.json({ settings: DEFAULT_WERKZEUG_SETTINGS, revision: 0, persistent: true });
  try {
    return Response.json({ settings: normalizeWerkzeugSettings(JSON.parse(String(row.settings_json))), revision: Number(row.revision || 0), persistent: true });
  } catch {
    return Response.json({ settings: DEFAULT_WERKZEUG_SETTINGS, revision: Number(row.revision || 0), persistent: true, repaired: true });
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

