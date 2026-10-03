// Port 4332 is the shared PDF Studio readiness contract; the retired 4322 port breaks local handoffs.
const DEFAULT_PDF_READER_URL = "http://127.0.0.1:4332/";

export function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL(
    process.env.NEXT_PUBLIC_PDF_READER_URL ?? DEFAULT_PDF_READER_URL,
  );
  target.searchParams.set("lang", "de");
  target.searchParams.set("source", "german-notebook");
  incoming.searchParams.forEach((value, key) =>
    target.searchParams.set(key, value),
  );
  if (!target.searchParams.has("return"))
    target.searchParams.set("return", `${incoming.origin}/`);
  if (!target.searchParams.has("returnLabel"))
    target.searchParams.set("returnLabel", "Zurück zu DeutschFlow");
  return Response.redirect(target, 307);
}
