import { requestUserKey } from "../../../lib/server-user";

const MAX_BODY_BYTES = 8_000;
const MAX_TEXT_LENGTH = 300;

class FocusApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type FocusRow = {
  id: string;
  context_id: string;
  context_title: string;
  source: string;
  status: "running" | "paused" | "completed";
  accumulated_seconds: number;
  started_at: string;
  last_started_at: string | null;
  ended_at: string | null;
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

async function requireDatabase() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new FocusApiError("Der Fokus-Speicher ist nicht verfügbar.", 503);
  return env.DB;
}

async function authenticatedUserKey(request: Request) {
  const key = await requestUserKey(request);
  if (!key) throw new FocusApiError("Bitte melde dich an, um Fokuszeit zu speichern.", 401);
  return key;
}

async function ensureTable() {
  const db = await requireDatabase();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tracker_focus_sessions (
        user_key TEXT NOT NULL,
        id TEXT NOT NULL,
        context_id TEXT NOT NULL,
        context_title TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'tracker',
        status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
        accumulated_seconds INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_started_at TEXT,
        ended_at TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_key, id)
      )
    `),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS tracker_focus_sessions_user_idx ON tracker_focus_sessions (user_key, started_at)",
    ),
  ]);
  return db;
}

function isoDate(value: string | null) {
  if (!value) return null;
  return `${value.replace(" ", "T").replace(/Z$/, "")}Z`;
}

function publicSession(row: FocusRow) {
  return {
    id: row.id,
    contextId: row.context_id,
    contextTitle: row.context_title,
    source: row.source,
    status: row.status,
    accumulatedSeconds: row.accumulated_seconds,
    startedAt: isoDate(row.started_at),
    lastStartedAt: isoDate(row.last_started_at),
    endedAt: isoDate(row.ended_at),
  };
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string") throw new FocusApiError(`${label} fehlt.`, 400);
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_TEXT_LENGTH) {
    throw new FocusApiError(`${label} ist ungültig.`, 400);
  }
  return normalized;
}

async function readPayload(request: Request) {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) {
    throw new FocusApiError("Die Anfrage ist leer oder zu groß.", 400);
  }
  try {
    const payload = JSON.parse(raw) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error();
    return payload as Record<string, unknown>;
  } catch {
    throw new FocusApiError("Die Anfrage enthält kein gültiges JSON.", 400);
  }
}

async function sessionById(db: Awaited<ReturnType<typeof ensureTable>>, userKey: string, id: string) {
  return db
    .prepare(`
      SELECT id, context_id, context_title, source, status, accumulated_seconds,
             started_at, last_started_at, ended_at
      FROM tracker_focus_sessions
      WHERE user_key = ? AND id = ?
      LIMIT 1
    `)
    .bind(userKey, id)
    .first<FocusRow>();
}

function handleError(error: unknown) {
  if (error instanceof FocusApiError) return json({ error: error.message }, { status: error.status });
  console.error("Study tracker focus API failed", error);
  return json({ error: "Die Fokuszeit konnte momentan nicht verarbeitet werden." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const db = await ensureTable();
    const result = await db
      .prepare(`
        SELECT id, context_id, context_title, source, status, accumulated_seconds,
               started_at, last_started_at, ended_at
        FROM tracker_focus_sessions
        WHERE user_key = ?
        ORDER BY CASE WHEN status IN ('running', 'paused') THEN 0 ELSE 1 END,
                 started_at DESC
        LIMIT 30
      `)
      .bind(userKey)
      .all<FocusRow>();
    const total = await db
      .prepare(
        "SELECT COALESCE(SUM(accumulated_seconds), 0) AS seconds FROM tracker_focus_sessions WHERE user_key = ?",
      )
      .bind(userKey)
      .first<{ seconds: number }>();
    const sessions = (result.results ?? []).map(publicSession);
    return json({
      active: sessions.find((session) => session.status !== "completed") ?? null,
      sessions,
      storedSeconds: Number(total?.seconds ?? 0),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const db = await ensureTable();
    const payload = await readPayload(request);
    const action = payload.action;

    if (action === "start") {
      const contextId = requiredText(payload.contextId, "contextId");
      const contextTitle = requiredText(payload.contextTitle, "Titel");
      const existing = await db
        .prepare(
          "SELECT id FROM tracker_focus_sessions WHERE user_key = ? AND status IN ('running', 'paused') LIMIT 1",
        )
        .bind(userKey)
        .first<{ id: string }>();
      if (existing) throw new FocusApiError("Bitte beende zuerst die laufende Fokuszeit.", 409);
      const id = crypto.randomUUID();
      await db
        .prepare(`
          INSERT INTO tracker_focus_sessions
            (user_key, id, context_id, context_title, source, status,
             accumulated_seconds, started_at, last_started_at, updated_at)
          VALUES (?, ?, ?, ?, 'tracker', 'running', 0, CURRENT_TIMESTAMP,
                  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `)
        .bind(userKey, id, contextId, contextTitle)
        .run();
      const row = await sessionById(db, userKey, id);
      return json({ session: row ? publicSession(row) : null }, { status: 201 });
    }

    const id = requiredText(payload.id, "Fokus-ID");
    if (action === "pause") {
      await db
        .prepare(`
          UPDATE tracker_focus_sessions
          SET accumulated_seconds = accumulated_seconds +
                MAX(0, unixepoch('now') - unixepoch(last_started_at)),
              last_started_at = NULL,
              status = 'paused',
              updated_at = CURRENT_TIMESTAMP
          WHERE user_key = ? AND id = ? AND status = 'running'
        `)
        .bind(userKey, id)
        .run();
    } else if (action === "resume") {
      await db
        .prepare(`
          UPDATE tracker_focus_sessions
          SET last_started_at = CURRENT_TIMESTAMP,
              status = 'running',
              updated_at = CURRENT_TIMESTAMP
          WHERE user_key = ? AND id = ? AND status = 'paused'
        `)
        .bind(userKey, id)
        .run();
    } else if (action === "finish") {
      await db
        .prepare(`
          UPDATE tracker_focus_sessions
          SET accumulated_seconds = accumulated_seconds +
                CASE WHEN status = 'running'
                  THEN MAX(0, unixepoch('now') - unixepoch(last_started_at))
                  ELSE 0 END,
              last_started_at = NULL,
              status = 'completed',
              ended_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_key = ? AND id = ? AND status IN ('running', 'paused')
        `)
        .bind(userKey, id)
        .run();
    } else {
      throw new FocusApiError("Unbekannte Fokus-Aktion.", 400);
    }

    const row = await sessionById(db, userKey, id);
    if (!row) throw new FocusApiError("Die Fokuszeit wurde nicht gefunden.", 404);
    return json({ session: publicSession(row) });
  } catch (error) {
    return handleError(error);
  }
}
