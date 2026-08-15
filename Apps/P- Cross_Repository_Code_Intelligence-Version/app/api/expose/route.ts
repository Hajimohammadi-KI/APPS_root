import {
  isSameOriginMutation,
  requestUserKey,
} from "../../../lib/server-user";
import { DEVICE_ONLY_STORAGE } from "../../../lib/storage-mode";

const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 240;
const BUNDLED_FILE_NAME =
  "Cross_Repository_Code_Intelligence_Expose_DE_2026_v2_4.pdf";
const BUNDLED_URL = "/expose.pdf";

type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => D1PreparedStatementLike;
  run: () => Promise<unknown>;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results?: T[] }>;
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
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
  delete: (key: string | string[]) => Promise<void>;
};

type ExposeRow = {
  version: number;
  storage_key: string;
  file_name: string;
  size: number;
  created_at: string;
};

class ExposeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store");
  return Response.json(data, { ...init, headers });
}

function bundledMetadata() {
  return {
    custom: false,
    source: "bundled" as const,
    version: 0,
    fileName: BUNDLED_FILE_NAME,
    name: BUNDLED_FILE_NAME,
    size: null,
    updatedAt: null,
    url: BUNDLED_URL,
  };
}

function customMetadata(row: ExposeRow) {
  return {
    custom: true,
    source: "custom" as const,
    version: Number(row.version),
    fileName: row.file_name,
    name: row.file_name,
    size: Number(row.size),
    updatedAt: row.created_at,
    url: "/api/expose",
  };
}

async function bindings() {
  // Vercel's device-only build intentionally has no Cloudflare runtime.
  // Avoid resolving the Workers-only module there; the bundled Exposé remains
  // available and browser data continues to live on this device.
  if (DEVICE_ONLY_STORAGE) return null;
  const { env } = await import("cloudflare:workers");
  const value = env as unknown as {
    DB?: D1DatabaseLike;
    BUCKET?: R2BucketLike;
  };
  if (!value.DB || !value.BUCKET) return null;
  return { db: value.DB, bucket: value.BUCKET };
}

async function ensureTable(db: D1DatabaseLike) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS project_expose_versions (
      user_key TEXT NOT NULL,
      version INTEGER NOT NULL,
      storage_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_key, version)
    )
  `).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS project_expose_versions_current_idx ON project_expose_versions (user_key, version DESC)",
  ).run();
}

async function currentExpose(db: D1DatabaseLike, userKey: string) {
  return db.prepare(`
    SELECT version, storage_key, file_name, size, created_at
    FROM project_expose_versions
    WHERE user_key = ?
    ORDER BY version DESC
    LIMIT 1
  `).bind(userKey).first<ExposeRow>();
}

function contentDisposition(name: string) {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function validPdfName(value: string) {
  const name = value.trim();
  return name.length > 0
    && name.length <= MAX_FILE_NAME_LENGTH
    && /\.pdf$/i.test(name)
    && !/[\\/\u0000-\u001f\u007f]/.test(name);
}

function handleError(error: unknown) {
  if (error instanceof ExposeApiError) {
    return json({ message: error.message }, { status: error.status });
  }
  console.error("Exposé API failed", error);
  return json(
    { message: "Das Exposé konnte momentan nicht verarbeitet werden." },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const metadataOnly = url.searchParams.get("meta") === "1";
    const userKey = await requestUserKey(request);
    let storage: Awaited<ReturnType<typeof bindings>> = null;
    try {
      storage = await bindings();
    } catch (error) {
      if (!metadataOnly) throw error;
      console.error("Exposé metadata storage unavailable", error);
    }

    // The bundled Exposé is always available to the reader. A missing local
    // identity or unavailable local database must never break that fallback.
    if (!userKey || !storage) {
      if (metadataOnly) return json({ expose: bundledMetadata() });
      throw new ExposeApiError("Kein eigenes Exposé gespeichert.", 404);
    }

    if (metadataOnly) {
      try {
        await ensureTable(storage.db);
        const row = await currentExpose(storage.db, userKey);
        return json({ expose: row ? customMetadata(row) : bundledMetadata() });
      } catch (error) {
        console.error("Exposé metadata lookup failed", error);
        return json({ expose: bundledMetadata() });
      }
    }
    await ensureTable(storage.db);
    const row = await currentExpose(storage.db, userKey);
    if (!row) throw new ExposeApiError("Kein eigenes Exposé gespeichert.", 404);

    const object = await storage.bucket.get(row.storage_key);
    if (!object) throw new ExposeApiError("Die gespeicherte Exposé-Datei fehlt.", 404);
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(row.file_name),
      "X-Content-Type-Options": "nosniff",
      "X-Expose-Version": String(row.version),
    });
    if (object.size) headers.set("Content-Length", String(object.size));
    return new Response(object.body, { headers });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginMutation(request)) {
      throw new ExposeApiError(
        "Das Exposé darf nur direkt in dieser lokalen App geändert werden.",
        403,
      );
    }
    const userKey = await requestUserKey(request);
    if (!userKey) throw new ExposeApiError("Bitte melde dich zuerst an.", 401);
    const storage = await bindings();
    if (!storage) throw new ExposeApiError("Der lokale Dateispeicher ist nicht verfügbar.", 503);

    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File) || value.size === 0) {
      throw new ExposeApiError("Bitte wähle eine PDF-Datei aus.", 400);
    }
    if (value.size > MAX_PDF_BYTES) {
      throw new ExposeApiError("Die PDF ist größer als 50 MB.", 413);
    }
    if (!validPdfName(value.name)) {
      throw new ExposeApiError("Der Dateiname muss ein gültiger PDF-Dateiname sein.", 400);
    }
    const signature = new TextDecoder().decode(
      await value.slice(0, 5).arrayBuffer(),
    );
    if (signature !== "%PDF-") {
      throw new ExposeApiError("Die ausgewählte Datei ist keine gültige PDF.", 400);
    }

    await ensureTable(storage.db);
    const current = await currentExpose(storage.db, userKey);
    const version = Number(current?.version ?? 0) + 1;
    const storageKey = `expose/${userKey}/v${version}-${crypto.randomUUID()}.pdf`;
    await storage.bucket.put(storageKey, value.stream(), {
      httpMetadata: { contentType: "application/pdf" },
      customMetadata: {
        originalName: value.name,
        version: String(version),
      },
    });

    try {
      await storage.db.prepare(`
        INSERT INTO project_expose_versions
          (user_key, version, storage_key, file_name, size, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(userKey, version, storageKey, value.name, value.size).run();
    } catch (error) {
      await storage.bucket.delete(storageKey);
      throw error;
    }

    const row = await currentExpose(storage.db, userKey);
    if (!row) throw new ExposeApiError("Das Exposé konnte nicht gespeichert werden.", 500);
    return json({ expose: customMetadata(row), saved: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSameOriginMutation(request)) {
      throw new ExposeApiError(
        "Das Exposé darf nur direkt in dieser lokalen App geändert werden.",
        403,
      );
    }
    const userKey = await requestUserKey(request);
    if (!userKey) throw new ExposeApiError("Bitte melde dich zuerst an.", 401);
    const storage = await bindings();
    if (!storage) throw new ExposeApiError("Der lokale Dateispeicher ist nicht verfügbar.", 503);

    await ensureTable(storage.db);
    const result = await storage.db.prepare(`
      SELECT version, storage_key, file_name, size, created_at
      FROM project_expose_versions
      WHERE user_key = ?
    `).bind(userKey).all<ExposeRow>();
    const rows = result.results ?? [];
    if (rows.length) {
      await storage.bucket.delete(rows.map((row) => row.storage_key));
      await storage.db.prepare(
        "DELETE FROM project_expose_versions WHERE user_key = ?",
      ).bind(userKey).run();
    }
    return json({ deleted: true, expose: bundledMetadata() });
  } catch (error) {
    return handleError(error);
  }
}
