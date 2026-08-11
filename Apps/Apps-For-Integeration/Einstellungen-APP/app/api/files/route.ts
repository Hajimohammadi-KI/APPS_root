type Bucket = { put: (key: string, value: ArrayBuffer, options?: unknown) => Promise<unknown> };
export async function POST(request: Request) {
  // Defer the Workers-only import until a request reaches Cloudflare.
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { BUCKET?: Bucket }).BUCKET;
  if (!bucket) return Response.json({ message: "Dateispeicher ist noch nicht bereit." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ message: "Keine Datei ausgewählt." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return Response.json({ message: "Dateien dürfen maximal 25 MB groß sein." }, { status: 413 });
  const owner = request.headers.get("oai-authenticated-user-email") || "owner";
  const key = `${encodeURIComponent(owner)}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { originalName: file.name, owner } });
  return Response.json({ key, name: file.name, size: file.size, type: file.type });
}
