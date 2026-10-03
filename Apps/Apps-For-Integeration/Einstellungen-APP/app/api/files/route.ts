// requestUserKey turns the caller's identity into one stable storage-prefix
// key; isSameOriginMutation blocks cross-site writes (used by POST below).
import { isSameOriginMutation, requestUserKey } from "../../../lib/server-user";

// Shape of one object as R2's `list()` returns it — only the fields this
// route actually reads.
type BucketObject = {
  key: string;
  size: number;
  uploaded: string | Date;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
};
// Minimal R2 bucket surface this file needs: writing a file (POST) and
// listing what's already stored (GET).
type Bucket = {
  put: (key: string, value: ArrayBuffer, options?: unknown) => Promise<unknown>;
  list: (options?: { prefix?: string; include?: string[] }) => Promise<{ objects: BucketObject[] }>;
};

// GET lists only the requesting user's own uploads: results are scoped by
// filtering the bucket on the same `${owner}/` key prefix that POST writes
// under, so one user's key can never enumerate another user's files.
export async function GET(request: Request) {
  // Resolve who's asking. No identity, no list — this must never leak an
  // "everyone's files" fallback.
  const owner = await requestUserKey(request);
  if (!owner) return Response.json({ message: "Bitte zuerst anmelden." }, { status: 401 });
  // Cloudflare's bindings only exist inside a Workers request, so this
  // import has to happen at call time, not at module load time.
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { BUCKET?: Bucket }).BUCKET;
  // If the R2 binding isn't configured yet, report "no files" rather than
  // erroring — there's nothing to list either way.
  if (!bucket) return Response.json({ files: [] });
  // Every object this owner has ever uploaded lives under this exact
  // prefix (see POST's `key` below) — nothing outside it is visible here.
  const prefix = `${encodeURIComponent(owner)}/`;
  const result = await bucket.list({ prefix, include: ["customMetadata", "httpMetadata"] });
  // Turn R2's raw object records into the small, stable shape the UI
  // actually needs.
  const files = result.objects.map((object) => ({
    key: object.key,
    // Prefer the original filename we stored as metadata; fall back to
    // whatever comes after the prefix in the storage key if it's missing.
    name: object.customMetadata?.originalName || object.key.slice(prefix.length),
    size: object.size,
    type: object.httpMetadata?.contentType || "application/octet-stream",
    // R2 can hand back either a Date or an ISO string depending on
    // binding/runtime — normalize to a string either way.
    uploadedAt: object.uploaded instanceof Date ? object.uploaded.toISOString() : String(object.uploaded),
  }));
  return Response.json({ files });
}

export async function POST(request: Request) {
  // Identity comes from the shared helper so a raw client header can never pick
  // the storage prefix, and anonymous callers no longer share one "owner" bucket.
  const owner = await requestUserKey(request);
  if (!owner) return Response.json({ message: "Bitte zuerst anmelden." }, { status: 401 });
  // Only this app's own pages may trigger an upload — blocks a third-party
  // site from POSTing here on a signed-in user's behalf.
  if (!isSameOriginMutation(request)) return Response.json({ message: "Uploads sind nur direkt in dieser App erlaubt." }, { status: 403 });
  // Defer the Workers-only import until a request reaches Cloudflare.
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { BUCKET?: Bucket }).BUCKET;
  if (!bucket) return Response.json({ message: "Dateispeicher ist noch nicht bereit." }, { status: 503 });
  // Pull the uploaded file out of the multipart form body.
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ message: "Keine Datei ausgewählt." }, { status: 400 });
  // Reject oversized uploads before reading the whole file into memory.
  if (file.size > 25 * 1024 * 1024) return Response.json({ message: "Dateien dürfen maximal 25 MB groß sein." }, { status: 413 });
  // Storage key = `<owner>/<random>-<sanitized original name>`. The owner
  // prefix is what makes GET's per-user listing above possible; the random
  // UUID prevents two uploads with the same filename from colliding; the
  // character filter keeps the key itself a safe, predictable string.
  const key = `${encodeURIComponent(owner)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  // Store the real filename separately as metadata (the storage key itself
  // is sanitized/prefixed and isn't meant to be shown to the user as-is).
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { originalName: file.name, owner } });
  return Response.json({ key, name: file.name, size: file.size, type: file.type });
}
