import { requestUserKey } from "../../../lib/server-user";

const MAX_BODY_BYTES = 8_000;

class StudySessionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

type SessionRow = {
  id: string;
  document_id: string;
  document_name: string;
  document_kind: string;
  status: "running" | "paused" | "completed";
  active_seconds: number;
  started_at: string;
  last_started_at: string | null;
  ended_at: string | null;
  start_page: number;
  end_page: number;
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

async function database() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new StudySessionError("Der Studienzeit-Speicher ist nicht verfügbar.", 503);
  return env.DB;
}

async function ownerKey(request: Request) {
  const key = await requestUserKey(request);
  if (!key) throw new StudySessionError("Bitte melde dich an, um Studienzeit zu speichern.", 401);
  return key;
}

async function ensureTable() {
  const db = await database();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pdf_study_sessions (
        owner_key TEXT NOT NULL,
        id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        document_name TEXT NOT NULL,
        document_kind TEXT NOT NULL DEFAULT 'pdf',
        status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed')),
        active_seconds INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_started_at TEXT,
        ended_at TEXT,
        start_page INTEGER NOT NULL DEFAULT 1,
        end_page INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (owner_key, id)
      )
    `),
    db.prepare("CREATE INDEX IF NOT EXISTS pdf_study_sessions_owner_started_idx ON pdf_study_sessions (owner_key, started_at)"),
    db.prepare("CREATE INDEX IF NOT EXISTS pdf_study_sessions_document_idx ON pdf_study_sessions (owner_key, document_id, started_at)"),
  ]);
  return db;
}

function iso(value: string | null) {
  return value ? `${value.replace(" ", "T").replace(/Z$/, "")}Z` : null;
}

function present(row: SessionRow) {
  return {
    id: row.id,
    documentId: row.document_id,
    documentName: row.document_name,
    documentKind: row.document_kind,
    status: row.status,
    activeSeconds: row.active_seconds,
    startedAt: iso(row.started_at),
    lastStartedAt: iso(row.last_started_at),
    endedAt: iso(row.ended_at),
    startPage: row.start_page,
    endPage: row.end_page,
  };
}

function requiredText(value: unknown, label: string, max = 300) {
  if (typeof value !== "string") throw new StudySessionError(`${label} fehlt.`, 400);
  const normalized = value.trim();
  if (!normalized || normalized.length > max) throw new StudySessionError(`${label} ist ungültig.`, 400);
  return normalized;
}

function pageNumber(value: unknown) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 && page <= 100_000 ? page : 1;
}

async function payload(request: Request) {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) throw new StudySessionError("Die Anfrage ist leer oder zu groß.", 400);
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new StudySessionError("Die Anfrage enthält kein gültiges JSON.", 400);
  }
}

async function byId(db: Awaited<ReturnType<typeof ensureTable>>, owner: string, id: string) {
  return db.prepare(`
    SELECT id, document_id, document_name, document_kind, status, active_seconds,
           started_at, last_started_at, ended_at, start_page, end_page
    FROM pdf_study_sessions WHERE owner_key = ? AND id = ? LIMIT 1
  `).bind(owner, id).first<SessionRow>();
}

function errorResponse(error: unknown) {
  if (error instanceof StudySessionError) return json({ message: error.message }, { status: error.status });
  console.error("PDF study timer failed", error);
  return json({ message: "Die Studienzeit konnte gerade nicht verarbeitet werden." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const owner = await ownerKey(request);
    const db = await ensureTable();
    const rows = await db.prepare(`
      SELECT id, document_id, document_name, document_kind, status, active_seconds,
             started_at, last_started_at, ended_at, start_page, end_page
      FROM pdf_study_sessions
      WHERE owner_key = ?
      ORDER BY CASE WHEN status IN ('running', 'paused') THEN 0 ELSE 1 END, started_at DESC
      LIMIT 30
    `).bind(owner).all<SessionRow>();
    const total = await db.prepare(
      "SELECT COALESCE(SUM(active_seconds), 0) AS seconds FROM pdf_study_sessions WHERE owner_key = ?",
    ).bind(owner).first<{ seconds: number }>();
    const sessions = (rows.results ?? []).map(present);
    return json({
      active: sessions.find((session) => session.status !== "completed") ?? null,
      sessions,
      storedSeconds: Number(total?.seconds ?? 0),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const owner = await ownerKey(request);
    const db = await ensureTable();
    const body = await payload(request);
    const action = body.action;

    if (action === "start") {
      const existing = await db.prepare(
        "SELECT id FROM pdf_study_sessions WHERE owner_key = ? AND status IN ('running', 'paused') LIMIT 1",
      ).bind(owner).first<{ id: string }>();
      if (existing) throw new StudySessionError("Beende zuerst die aktuelle Lesesitzung.", 409);
      const id = crypto.randomUUID();
      const documentId = requiredText(body.documentId, "Dokument-ID", 180);
      const documentName = requiredText(body.documentName, "Dokumentname");
      const documentKind = body.documentKind === "article" ? "article" : "pdf";
      const page = pageNumber(body.page);
      await db.prepare(`
        INSERT INTO pdf_study_sessions
          (owner_key, id, document_id, document_name, document_kind, status,
           active_seconds, started_at, last_started_at, start_page, end_page, updated_at)
        VALUES (?, ?, ?, ?, ?, 'running', 0, CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
      `).bind(owner, id, documentId, documentName, documentKind, page, page).run();
      const row = await byId(db, owner, id);
      return json({ session: row ? present(row) : null }, { status: 201 });
    }

    const id = requiredText(body.id, "Sitzungs-ID", 120);
    const page = pageNumber(body.page);
    if (action === "pause") {
      await db.prepare(`
        UPDATE pdf_study_sessions
        SET active_seconds = active_seconds + MAX(0, unixepoch('now') - unixepoch(last_started_at)),
            last_started_at = NULL, status = 'paused', end_page = ?, updated_at = CURRENT_TIMESTAMP
        WHERE owner_key = ? AND id = ? AND status = 'running'
      `).bind(page, owner, id).run();
    } else if (action === "resume") {
      await db.prepare(`
        UPDATE pdf_study_sessions
        SET last_started_at = CURRENT_TIMESTAMP, status = 'running', end_page = ?, updated_at = CURRENT_TIMESTAMP
        WHERE owner_key = ? AND id = ? AND status = 'paused'
      `).bind(page, owner, id).run();
    } else if (action === "finish") {
      await db.prepare(`
        UPDATE pdf_study_sessions
        SET active_seconds = active_seconds + CASE WHEN status = 'running'
              THEN MAX(0, unixepoch('now') - unixepoch(last_started_at)) ELSE 0 END,
            last_started_at = NULL, status = 'completed', ended_at = CURRENT_TIMESTAMP,
            end_page = ?, updated_at = CURRENT_TIMESTAMP
        WHERE owner_key = ? AND id = ? AND status IN ('running', 'paused')
      `).bind(page, owner, id).run();
    } else {
      throw new StudySessionError("Unbekannte Timer-Aktion.", 400);
    }

    const row = await byId(db, owner, id);
    if (!row) throw new StudySessionError("Die Lesesitzung wurde nicht gefunden.", 404);
    return json({ session: present(row) });
  } catch (error) {
    return errorResponse(error);
  }
}
