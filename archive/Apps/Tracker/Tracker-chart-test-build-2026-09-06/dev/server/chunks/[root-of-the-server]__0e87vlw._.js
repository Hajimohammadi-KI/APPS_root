module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/server-user.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isLocalModeRequest",
    ()=>isLocalModeRequest,
    "isSameOriginMutation",
    ()=>isSameOriginMutation,
    "requestOwner",
    ()=>requestOwner,
    "requestUserKey",
    ()=>requestUserKey
]);
const AUTH_ID_HEADER = "oai-authenticated-user-id";
const AUTH_EMAIL_HEADER = "oai-authenticated-user-email";
const LOCAL_USER_KEY = "local-user";
function cleanHeader(value) {
    const cleaned = value?.trim();
    return cleaned || null;
}
function isLoopbackHostname(hostname) {
    const normalized = hostname.toLowerCase().replace(/\.$/, "");
    if (normalized === "localhost" || normalized === "[::1]") return true;
    const octets = normalized.split(".");
    return octets.length === 4 && octets[0] === "127" && octets.every((octet)=>/^\d{1,3}$/.test(octet) && Number(octet) <= 255);
}
function isLocalModeRequest(request) {
    return process.env.LOCAL_MODE === "1" && isLoopbackHostname(new URL(request.url).hostname);
}
/**
 * Whether this deployment trusts oai-authenticated-user-* headers for
 * non-local requests. These headers carry no signature -- they're only safe
 * to trust when a platform gateway in front of this app (the ChatGPT Apps
 * SDK / Sites host) verifies the caller's session and sets them itself,
 * stripping any caller-supplied copy first. The shipped local install
 * (scripts/generate-local-env.mjs) never needs this flag: it sets
 * LOCAL_MODE=1, which is checked first below and never consults these
 * headers at all. Default is "don't trust", so a Worker or Vercel
 * deployment reachable directly -- with no such gateway in front of it --
 * fails safe with 401s instead of letting any caller impersonate an
 * arbitrary user by setting these headers themselves.
 */ function trustsAuthHeaders() {
    return process.env.TRUST_OAI_AUTH_HEADERS === "1";
}
function requestOwner(request) {
    if (isLocalModeRequest(request)) return LOCAL_USER_KEY;
    if (!trustsAuthHeaders()) return null;
    // Keep the hosted Sites authentication contract and precedence unchanged.
    return cleanHeader(request.headers.get(AUTH_ID_HEADER)) || cleanHeader(request.headers.get(AUTH_EMAIL_HEADER));
}
async function requestUserKey(request) {
    if (isLocalModeRequest(request)) return LOCAL_USER_KEY;
    if (!trustsAuthHeaders()) return null;
    const email = cleanHeader(request.headers.get(AUTH_EMAIL_HEADER))?.toLowerCase();
    const identity = email || cleanHeader(request.headers.get(AUTH_ID_HEADER));
    if (!identity) return null;
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identity));
    const hash = Array.from(new Uint8Array(digest), (byte)=>byte.toString(16).padStart(2, "0")).join("");
    return `user_${hash}`;
}
function isSameOriginMutation(request) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite && ![
        "same-origin",
        "same-site",
        "none"
    ].includes(fetchSite)) return false;
    if (!origin) {
        return fetchSite === "same-origin" || fetchSite === "same-site" || isLocalModeRequest(request) && !fetchSite;
    }
    return origin === new URL(request.url).origin;
}
}),
"[project]/lib/storage-mode.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEVICE_ONLY_STORAGE",
    ()=>DEVICE_ONLY_STORAGE
]);
const DEVICE_ONLY_STORAGE = ("TURBOPACK compile-time value", "device") === "device";
}),
"[project]/app/api/expose/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/server-user.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$storage$2d$mode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/storage-mode.ts [app-route] (ecmascript)");
;
;
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 240;
const BUNDLED_FILE_NAME = "Cross_Repository_Code_Intelligence_Expose_DE_2026_v2_4.pdf";
const BUNDLED_URL = "/expose.pdf";
class ExposeApiError extends Error {
    status;
    constructor(message, status){
        super(message), this.status = status;
    }
}
function json(data, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("Cache-Control", "private, no-store");
    return Response.json(data, {
        ...init,
        headers
    });
}
function bundledMetadata() {
    return {
        custom: false,
        source: "bundled",
        version: 0,
        fileName: BUNDLED_FILE_NAME,
        name: BUNDLED_FILE_NAME,
        size: null,
        updatedAt: null,
        url: BUNDLED_URL
    };
}
function customMetadata(row) {
    return {
        custom: true,
        source: "custom",
        version: Number(row.version),
        fileName: row.file_name,
        name: row.file_name,
        size: Number(row.size),
        updatedAt: row.created_at,
        url: "/api/expose"
    };
}
async function bindings() {
    // Vercel's device-only build intentionally has no Cloudflare runtime.
    // Avoid resolving the Workers-only module there; the bundled Exposé remains
    // available and browser data continues to live on this device.
    if (__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$storage$2d$mode$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DEVICE_ONLY_STORAGE"]) return null;
    const { env } = await Promise.resolve().then(()=>__turbopack_context__.x("cloudflare:workers", ()=>require("cloudflare:workers"), true));
    const value = env;
    if (!value.DB || !value.BUCKET) return null;
    return {
        db: value.DB,
        bucket: value.BUCKET
    };
}
async function ensureTable(db) {
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
    await db.prepare("CREATE INDEX IF NOT EXISTS project_expose_versions_current_idx ON project_expose_versions (user_key, version DESC)").run();
}
async function currentExpose(db, userKey) {
    return db.prepare(`
    SELECT version, storage_key, file_name, size, created_at
    FROM project_expose_versions
    WHERE user_key = ?
    ORDER BY version DESC
    LIMIT 1
  `).bind(userKey).first();
}
function contentDisposition(name) {
    const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
function validPdfName(value) {
    const name = value.trim();
    return name.length > 0 && name.length <= MAX_FILE_NAME_LENGTH && /\.pdf$/i.test(name) && !/[\\/\u0000-\u001f\u007f]/.test(name);
}
function handleError(error) {
    if (error instanceof ExposeApiError) {
        return json({
            message: error.message
        }, {
            status: error.status
        });
    }
    console.error("Exposé API failed", error);
    return json({
        message: "Das Exposé konnte momentan nicht verarbeitet werden."
    }, {
        status: 500
    });
}
async function GET(request) {
    try {
        const url = new URL(request.url);
        const metadataOnly = url.searchParams.get("meta") === "1";
        const userKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requestUserKey"])(request);
        let storage = null;
        try {
            storage = await bindings();
        } catch (error) {
            if (!metadataOnly) throw error;
            console.error("Exposé metadata storage unavailable", error);
        }
        // The bundled Exposé is always available to the reader. A missing local
        // identity or unavailable local database must never break that fallback.
        if (!userKey || !storage) {
            if (metadataOnly) return json({
                expose: bundledMetadata()
            });
            throw new ExposeApiError("Kein eigenes Exposé gespeichert.", 404);
        }
        if (metadataOnly) {
            try {
                await ensureTable(storage.db);
                const row = await currentExpose(storage.db, userKey);
                return json({
                    expose: row ? customMetadata(row) : bundledMetadata()
                });
            } catch (error) {
                console.error("Exposé metadata lookup failed", error);
                return json({
                    expose: bundledMetadata()
                });
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
            "X-Expose-Version": String(row.version)
        });
        if (object.size) headers.set("Content-Length", String(object.size));
        return new Response(object.body, {
            headers
        });
    } catch (error) {
        return handleError(error);
    }
}
async function POST(request) {
    try {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSameOriginMutation"])(request)) {
            throw new ExposeApiError("Das Exposé darf nur direkt in dieser lokalen App geändert werden.", 403);
        }
        const userKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requestUserKey"])(request);
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
        const signature = new TextDecoder().decode(await value.slice(0, 5).arrayBuffer());
        if (signature !== "%PDF-") {
            throw new ExposeApiError("Die ausgewählte Datei ist keine gültige PDF.", 400);
        }
        await ensureTable(storage.db);
        const current = await currentExpose(storage.db, userKey);
        const version = Number(current?.version ?? 0) + 1;
        const storageKey = `expose/${userKey}/v${version}-${crypto.randomUUID()}.pdf`;
        await storage.bucket.put(storageKey, value.stream(), {
            httpMetadata: {
                contentType: "application/pdf"
            },
            customMetadata: {
                originalName: value.name,
                version: String(version)
            }
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
        return json({
            expose: customMetadata(row),
            saved: true
        }, {
            status: 201
        });
    } catch (error) {
        return handleError(error);
    }
}
async function DELETE(request) {
    try {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSameOriginMutation"])(request)) {
            throw new ExposeApiError("Das Exposé darf nur direkt in dieser lokalen App geändert werden.", 403);
        }
        const userKey = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$server$2d$user$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requestUserKey"])(request);
        if (!userKey) throw new ExposeApiError("Bitte melde dich zuerst an.", 401);
        const storage = await bindings();
        if (!storage) throw new ExposeApiError("Der lokale Dateispeicher ist nicht verfügbar.", 503);
        await ensureTable(storage.db);
        const result = await storage.db.prepare(`
      SELECT version, storage_key, file_name, size, created_at
      FROM project_expose_versions
      WHERE user_key = ?
    `).bind(userKey).all();
        const rows = result.results ?? [];
        if (rows.length) {
            await storage.bucket.delete(rows.map((row)=>row.storage_key));
            await storage.db.prepare("DELETE FROM project_expose_versions WHERE user_key = ?").bind(userKey).run();
        }
        return json({
            deleted: true,
            expose: bundledMetadata()
        });
    } catch (error) {
        return handleError(error);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0e87vlw._.js.map