import { requestUserKey } from "../../../lib/server-user";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_ID_LENGTH = 240;
const MAX_NAME_LENGTH = 240;

class AttachmentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  run: () => Promise<unknown>;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results?: T[] }>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
  batch: (statements: D1PreparedStatementLike[]) => Promise<unknown>;
};

type R2ObjectLike = {
  body: ReadableStream<Uint8Array>;
  size?: number;
};

type R2BucketLike = {
  put: (
    key: string,
    value: ReadableStream<Uint8Array>,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectLike | null>;
  delete: (key: string) => Promise<void>;
};

type AttachmentRow = {
  id: string;
  day_id: string;
  storage_key: string;
  name: string;
  mime_type: string;
  size: number;
  created_at: string;
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(data, { ...init, headers });
}

async function requireBindings() {
  const { env } = await import("cloudflare:workers");
  const bindings = env as unknown as {
    DB?: D1DatabaseLike;
    BUCKET?: R2BucketLike;
  };
  if (!bindings.DB || !bindings.BUCKET) {
    throw new AttachmentApiError(
      "Der Dateispeicher ist momentan nicht verfügbar.",
      503,
    );
  }
  return { db: bindings.DB, bucket: bindings.BUCKET };
}

async function authenticatedUserKey(request: Request) {
  const key = await requestUserKey(request);
  if (!key) {
    throw new AttachmentApiError(
      "Bitte melde dich an, um Dateien zu verwenden.",
      401,
    );
  }
  return key;
}

function requiredId(value: string | null, label: string) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized.length > MAX_ID_LENGTH) {
    throw new AttachmentApiError(`${label} ist ungültig.`, 400);
  }
  return normalized;
}

function safeName(value: string) {
  const normalized = value
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return normalized || "Datei";
}

function publicAttachment(row: AttachmentRow) {
  return {
    id: row.id,
    dayId: row.day_id,
    name: row.name,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
  };
}

async function ensureAttachmentTable(db: D1DatabaseLike) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS tracker_attachments (
        user_key TEXT NOT NULL,
        id TEXT NOT NULL,
        day_id TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_key, id)
      )
    `),
    db.prepare(
      "CREATE INDEX IF NOT EXISTS tracker_attachments_day_idx ON tracker_attachments (user_key, day_id)",
    ),
  ]);
}

function contentDisposition(name: string, disposition: "inline" | "attachment") {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function previewContentType(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (
    /^(image\/(?:png|jpeg|gif|webp|avif)|application\/pdf|audio\/|video\/)/.test(
      normalized,
    )
  ) {
    return normalized;
  }
  if (
    normalized.startsWith("text/") ||
    /^(application\/(?:json|xml|javascript)|application\/x-(?:httpd-php|sh))$/.test(
      normalized,
    )
  ) {
    return "text/plain; charset=utf-8";
  }
  return "application/octet-stream";
}

function handleError(error: unknown) {
  if (error instanceof AttachmentApiError) {
    return json({ error: error.message }, { status: error.status });
  }
  console.error("Study tracker attachment API failed", error);
  return json(
    { error: "Die Datei konnte momentan nicht verarbeitet werden." },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const { db, bucket } = await requireBindings();
    await ensureAttachmentTable(db);
    const url = new URL(request.url);
    const attachmentId = url.searchParams.get("id");

    if (!attachmentId) {
      const result = await db
        .prepare(`
          SELECT id, day_id, storage_key, name, mime_type, size, created_at
          FROM tracker_attachments
          WHERE user_key = ?
          ORDER BY created_at DESC
        `)
        .bind(userKey)
        .all<AttachmentRow>();
      return json({ attachments: (result.results ?? []).map(publicAttachment) });
    }

    const id = requiredId(attachmentId, "Datei-ID");
    const row = await db
      .prepare(`
        SELECT id, day_id, storage_key, name, mime_type, size, created_at
        FROM tracker_attachments
        WHERE user_key = ? AND id = ?
        LIMIT 1
      `)
      .bind(userKey, id)
      .first<AttachmentRow>();
    if (!row) throw new AttachmentApiError("Die Datei wurde nicht gefunden.", 404);

    const object = await bucket.get(row.storage_key);
    if (!object) throw new AttachmentApiError("Der Dateiinhalt fehlt.", 404);
    const download = url.searchParams.get("download") === "1";
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": download
        ? row.mime_type || "application/octet-stream"
        : previewContentType(row.mime_type),
      "Content-Disposition": contentDisposition(
        row.name,
        download ? "attachment" : "inline",
      ),
      "X-Content-Type-Options": "nosniff",
    });
    if (object.size) headers.set("Content-Length", String(object.size));
    return new Response(object.body, { headers });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const { db, bucket } = await requireBindings();
    await ensureAttachmentTable(db);
    const form = await request.formData();
    const dayId = requiredId(
      typeof form.get("dayId") === "string" ? String(form.get("dayId")) : null,
      "Tag",
    );
    const value = form.get("file");
    if (!(value instanceof File) || value.size === 0) {
      throw new AttachmentApiError("Bitte wähle eine Datei aus.", 400);
    }
    if (value.size > MAX_FILE_BYTES) {
      throw new AttachmentApiError(
        "Die Datei ist größer als 25 MB.",
        413,
      );
    }

    const id = crypto.randomUUID();
    const name = safeName(value.name);
    const mimeType = value.type || "application/octet-stream";
    const storageKey = `${userKey}/${id}`;
    await bucket.put(storageKey, value.stream(), {
      httpMetadata: { contentType: mimeType },
      customMetadata: { originalName: name, dayId },
    });

    try {
      await db
        .prepare(`
          INSERT INTO tracker_attachments
            (user_key, id, day_id, storage_key, name, mime_type, size, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `)
        .bind(userKey, id, dayId, storageKey, name, mimeType, value.size)
        .run();
    } catch (error) {
      await bucket.delete(storageKey);
      throw error;
    }

    const row = await db
      .prepare(`
        SELECT id, day_id, storage_key, name, mime_type, size, created_at
        FROM tracker_attachments
        WHERE user_key = ? AND id = ?
      `)
      .bind(userKey, id)
      .first<AttachmentRow>();
    if (!row) throw new AttachmentApiError("Die Datei konnte nicht gespeichert werden.", 500);
    return json({ attachment: publicAttachment(row) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const userKey = await authenticatedUserKey(request);
    const { db, bucket } = await requireBindings();
    await ensureAttachmentTable(db);
    const id = requiredId(new URL(request.url).searchParams.get("id"), "Datei-ID");
    const row = await db
      .prepare(
        "SELECT storage_key FROM tracker_attachments WHERE user_key = ? AND id = ? LIMIT 1",
      )
      .bind(userKey, id)
      .first<{ storage_key: string }>();
    if (!row) throw new AttachmentApiError("Die Datei wurde nicht gefunden.", 404);

    await bucket.delete(row.storage_key);
    await db
      .prepare("DELETE FROM tracker_attachments WHERE user_key = ? AND id = ?")
      .bind(userKey, id)
      .run();
    return json({ deleted: true, id });
  } catch (error) {
    return handleError(error);
  }
}
