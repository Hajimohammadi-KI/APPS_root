export function GET(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL("http://127.0.0.1:4322/");
  target.searchParams.set("lang", "de");
  target.searchParams.set("source", "german-notebook");
  incoming.searchParams.forEach((value, key) =>
    target.searchParams.set(key, value),
  );
  return Response.redirect(target, 307);
}
