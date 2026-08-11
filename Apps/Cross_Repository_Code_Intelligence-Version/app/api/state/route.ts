import { requestUserKey } from "../../../lib/server-user";

const MAX_BODY_BYTES = 70_000;
const MAX_NOTE_LENGTH = 20_000;
const MAX_ID_LENGTH = 240;
const MAX_SETTING_DEPTH = 8;
const MAX_ARRAY_LENGTH = 250;
const MAX_SETTING_STRING_LENGTH = 8_000;

const SENSITIVE_SETTING_KEY =
  /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|bearer[_-]?token|authorization[_-]?(?:header|value)|password|passphrase|secret|credential|private[_-]?key|client[_-]?secret)/i;

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type TaskProgressRow = {
  task_id: string;
  completed: number;
  updated_at: string;
};

type DayNoteRow = {
  day_id: string;
  note: string;
  updated_at: string;
};

type SettingsRow = {
  data: string;
  updated_at: string;
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

async function requireDatabase() {
  // Keep the Worker-only module behind the request boundary. This lets the
  // deploy artifact be inspected by Node while still resolving the real D1
  // binding inside Cloudflare at request time.
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new ApiError("Der Speicher ist momentan nicht verfügbar.", 503);
  }
  return env.DB;
}

async function ensureTables() {
  const db = await requireDatabase();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tracker_task_progress (
        user_key TEXT NOT NULL,
        task_id TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_key, task_id)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tracker_day_notes (
        user_key TEXT NOT NULL,
        day_id TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_key, day_id)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tracker_user_settings (
        user_key TEXT PRIMARY KEY NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
  ]);
  return db;
}

async function authenticatedUserKey(request: Request) {
  const key = await requestUserKey(request);
  if (!key) {
    throw new ApiError("Bitte melde dich an, um deinen Fortschritt zu speichern.", 401);
  }
  return key;
}

function requiredId(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new ApiError(`${field} fehlt.`, 400);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_ID_LENGTH) {
    throw new ApiError(`${field} ist ungültig.`, 400);
  }
  return normalized;
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_BYTES) {
    throw new ApiError("Die Anfrage ist leer oder zu groß.", 400);
  }
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not an object");
    }
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError("Die Anfrage enthält kein gültiges JSON.", 400);
  }
}

function sanitizeSettings(value: unknown, depth = 0): unknown {
  if (depth > MAX_SETTING_DEPTH) {
    throw new ApiError("Die Einstellungen sind zu tief verschachtelt.", 400);
  }
  if (
    value === null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (typeof value === "string") {
    if (value.length > MAX_SETTING_STRING_LENGTH) {
      throw new ApiError("Ein Einstellungswert ist zu lang.", 400);
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      throw new ApiError("Eine Einstellungsliste ist zu lang.", 400);
    }
    return value.map((entry) => sanitizeSettings(entry, depth + 1));
  }
  if (typeof value === "object" && value) {
    const clean: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (
        key === "__proto__" ||
        key === "prototype" ||
        key === "constructor" ||
        SENSITIVE_SETTING_KEY.test(key)
      ) {
        throw new ApiError(
          "Schlüssel, Tokens und Passwörter dürfen nicht in den Einstellungen gespeichert werden.",
          400,
        );
      }
      if (key.length > 120) {
        throw new ApiError("Ein Einstellungsname ist zu lang.", 400);
      }
      clean[key] = sanitizeSettings(entry, depth + 1);
    }
    return clean;
  }
  throw new ApiError("Die Einstellungen enthalten einen ungültigen Wert.", 400);
}

function parseStoredSettings(value: string | undefined) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, { status: error.status });
  }
  console.error("Study tracker state API failed", error);
  return json(
    { error: "Speichern ist momentan nicht möglich. Bitte versuche es erneut." },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const db = await ensureTables();
    const [progressResult, notesResult, settingsResult] = await db.batch([
      db
        .prepare(
          "SELECT task_id, completed, updated_at FROM tracker_task_progress WHERE user_key = ? ORDER BY task_id",
        )
        .bind(userKey),
      db
        .prepare(
          "SELECT day_id, note, updated_at FROM tracker_day_notes WHERE user_key = ? ORDER BY day_id",
        )
        .bind(userKey),
      db
        .prepare(
          "SELECT data, updated_at FROM tracker_user_settings WHERE user_key = ? LIMIT 1",
        )
        .bind(userKey),
    ]);

    const progressRows = (progressResult.results ?? []) as TaskProgressRow[];
    const noteRows = (notesResult.results ?? []) as DayNoteRow[];
    const settingsRow = (settingsResult.results?.[0] ?? null) as SettingsRow | null;

    return json({
      progress: Object.fromEntries(
        progressRows.map((row) => [row.task_id, Boolean(row.completed)]),
      ),
      notes: Object.fromEntries(noteRows.map((row) => [row.day_id, row.note])),
      settings: parseStoredSettings(settingsRow?.data),
      updatedAt: {
        progress: progressRows.reduce<string | null>(
          (latest, row) => (!latest || row.updated_at > latest ? row.updated_at : latest),
          null,
        ),
        notes: noteRows.reduce<string | null>(
          (latest, row) => (!latest || row.updated_at > latest ? row.updated_at : latest),
          null,
        ),
        settings: settingsRow?.updated_at ?? null,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const payload = await readPayload(request);
    const action = payload.action;
    const db = await ensureTables();

    if (action === "toggle") {
      const taskId = requiredId(payload.taskId, "taskId");
      if (payload.completed !== undefined && typeof payload.completed !== "boolean") {
        throw new ApiError("completed muss true oder false sein.", 400);
      }

      if (typeof payload.completed === "boolean") {
        await db
          .prepare(`
            INSERT INTO tracker_task_progress (user_key, task_id, completed, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_key, task_id) DO UPDATE SET
              completed = excluded.completed,
              updated_at = CURRENT_TIMESTAMP
          `)
          .bind(userKey, taskId, payload.completed ? 1 : 0)
          .run();
      } else {
        await db
          .prepare(`
            INSERT INTO tracker_task_progress (user_key, task_id, completed, updated_at)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_key, task_id) DO UPDATE SET
              completed = CASE completed WHEN 1 THEN 0 ELSE 1 END,
              updated_at = CURRENT_TIMESTAMP
          `)
          .bind(userKey, taskId)
          .run();
      }

      const row = await db
        .prepare(
          "SELECT completed, updated_at FROM tracker_task_progress WHERE user_key = ? AND task_id = ?",
        )
        .bind(userKey, taskId)
        .first<{ completed: number; updated_at: string }>();
      return json({
        taskId,
        completed: Boolean(row?.completed),
        updatedAt: row?.updated_at ?? null,
      });
    }

    if (action === "note") {
      const dayId = requiredId(payload.dayId, "dayId");
      if (typeof payload.note !== "string" || payload.note.length > MAX_NOTE_LENGTH) {
        throw new ApiError("Die Tagesnotiz ist ungültig oder zu lang.", 400);
      }
      const note = payload.note;
      if (!note.trim()) {
        await db
          .prepare("DELETE FROM tracker_day_notes WHERE user_key = ? AND day_id = ?")
          .bind(userKey, dayId)
          .run();
        return json({ dayId, note: "", updatedAt: null });
      }
      await db
        .prepare(`
          INSERT INTO tracker_day_notes (user_key, day_id, note, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_key, day_id) DO UPDATE SET
            note = excluded.note,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(userKey, dayId, note)
        .run();
      const row = await db
        .prepare(
          "SELECT updated_at FROM tracker_day_notes WHERE user_key = ? AND day_id = ?",
        )
        .bind(userKey, dayId)
        .first<{ updated_at: string }>();
      return json({ dayId, note, updatedAt: row?.updated_at ?? null });
    }

    if (action === "settings") {
      if (!payload.settings || typeof payload.settings !== "object" || Array.isArray(payload.settings)) {
        throw new ApiError("settings muss ein Objekt sein.", 400);
      }
      const settings = sanitizeSettings(payload.settings);
      const serialized = JSON.stringify(settings);
      if (serialized.length > MAX_BODY_BYTES) {
        throw new ApiError("Die Einstellungen sind zu groß.", 400);
      }
      await db
        .prepare(`
          INSERT INTO tracker_user_settings (user_key, data, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_key) DO UPDATE SET
            data = excluded.data,
            updated_at = CURRENT_TIMESTAMP
        `)
        .bind(userKey, serialized)
        .run();
      const row = await db
        .prepare("SELECT updated_at FROM tracker_user_settings WHERE user_key = ?")
        .bind(userKey)
        .first<{ updated_at: string }>();
      return json({ settings, updatedAt: row?.updated_at ?? null });
    }

    if (action === "import") {
      if (!Array.isArray(payload.completedIds) || payload.completedIds.length > 5_000) {
        throw new ApiError("Die importierte Fortschrittsliste ist ungültig.", 400);
      }
      if (!payload.notes || typeof payload.notes !== "object" || Array.isArray(payload.notes)) {
        throw new ApiError("Die importierten Notizen sind ungültig.", 400);
      }
      if (!payload.settings || typeof payload.settings !== "object" || Array.isArray(payload.settings)) {
        throw new ApiError("Die importierten Einstellungen sind ungültig.", 400);
      }

      const completedIds = [...new Set(
        payload.completedIds.map((value) => requiredId(value, "taskId")),
      )];
      const notes = Object.entries(payload.notes as Record<string, unknown>)
        .map(([dayId, note]) => {
          const safeDayId = requiredId(dayId, "dayId");
          if (typeof note !== "string" || note.length > MAX_NOTE_LENGTH) {
            throw new ApiError("Eine importierte Tagesnotiz ist ungültig oder zu lang.", 400);
          }
          return [safeDayId, note] as const;
        })
        .filter(([, note]) => note.trim());
      if (notes.length > 1_000) {
        throw new ApiError("Die importierte Notizliste ist zu groß.", 400);
      }
      const settings = sanitizeSettings(payload.settings);
      const serializedSettings = JSON.stringify(settings);

      await db.batch([
        db.prepare("DELETE FROM tracker_task_progress WHERE user_key = ?").bind(userKey),
        db.prepare("DELETE FROM tracker_day_notes WHERE user_key = ?").bind(userKey),
        db.prepare("DELETE FROM tracker_user_settings WHERE user_key = ?").bind(userKey),
      ]);

      const statements = [
        ...completedIds.map((taskId) =>
          db
            .prepare(
              "INSERT INTO tracker_task_progress (user_key, task_id, completed, updated_at) VALUES (?, ?, 1, CURRENT_TIMESTAMP)",
            )
            .bind(userKey, taskId),
        ),
        ...notes.map(([dayId, note]) =>
          db
            .prepare(
              "INSERT INTO tracker_day_notes (user_key, day_id, note, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            )
            .bind(userKey, dayId, note),
        ),
        db
          .prepare(
            "INSERT INTO tracker_user_settings (user_key, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
          )
          .bind(userKey, serializedSettings),
      ];
      for (let index = 0; index < statements.length; index += 75) {
        await db.batch(statements.slice(index, index + 75));
      }

      return json({
        imported: true,
        completedCount: completedIds.length,
        noteCount: notes.length,
        settings,
      });
    }

    if (action === "reset") {
      if (payload.confirm !== "RESET") {
        throw new ApiError("Zum Zurücksetzen ist eine ausdrückliche Bestätigung erforderlich.", 400);
      }
      await db.batch([
        db
          .prepare("DELETE FROM tracker_task_progress WHERE user_key = ?")
          .bind(userKey),
        db.prepare("DELETE FROM tracker_day_notes WHERE user_key = ?").bind(userKey),
        db
          .prepare("DELETE FROM tracker_user_settings WHERE user_key = ?")
          .bind(userKey),
      ]);
      return json({ progress: {}, notes: {}, settings: {} });
    }

    throw new ApiError("Unbekannte Aktion.", 400);
  } catch (error) {
    return handleError(error);
  }
}
