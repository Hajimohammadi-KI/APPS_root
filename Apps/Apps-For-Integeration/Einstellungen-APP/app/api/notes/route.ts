type Database = { prepare: (sql: string) => { bind: (...values: unknown[]) => { all: () => Promise<{ results?: unknown[] }>; run: () => Promise<unknown> }; run: () => Promise<unknown> } };
function owner(request: Request) { return request.headers.get("oai-authenticated-user-email") || "owner"; }
async function db() {
  // Keep the Workers-only module deferred so Vinext's Node artifact validator can
  // import the route bundle while Cloudflare still supplies the runtime binding.
  const { env } = await import("cloudflare:workers");
  const database = (env as unknown as { DB?: Database }).DB;
  if (!database) return null;
  await database.prepare("CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, owner TEXT NOT NULL, date TEXT NOT NULL, task TEXT NOT NULL, text TEXT NOT NULL DEFAULT '', files_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL)").run();
  return database;
}
export async function GET(request: Request) { const database = await db(); if (!database) return Response.json({ notes: [], persistent: false }); const result = await database.prepare("SELECT id, date, task, text, files_json, updated_at FROM notes WHERE owner = ? ORDER BY date DESC").bind(owner(request)).all(); return Response.json({ notes: (result.results || []).map((row: unknown) => { const value = row as Record<string, string>; return { id: value.id, date: value.date, task: value.task, text: value.text, files: JSON.parse(value.files_json || "[]"), updatedAt: value.updated_at }; }), persistent: true }); }
export async function PUT(request: Request) { const note = await request.json() as { id: string; date: string; task: string; text?: string; files?: string[]; updatedAt?: string }; if (!note.id || !note.date) return Response.json({ message: "Notiz-ID und Datum fehlen." }, { status: 400 }); const database = await db(); if (!database) return Response.json({ saved: false, persistent: false }); const updated = note.updatedAt || new Date().toISOString(); await database.prepare("INSERT INTO notes (id, owner, date, task, text, files_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET date=excluded.date, task=excluded.task, text=excluded.text, files_json=excluded.files_json, updated_at=excluded.updated_at WHERE owner=excluded.owner").bind(note.id, owner(request), note.date, note.task || "Freie Tagesnotiz", note.text || "", JSON.stringify(note.files || []), updated).run(); return Response.json({ saved: true, persistent: true, updatedAt: updated }); }
