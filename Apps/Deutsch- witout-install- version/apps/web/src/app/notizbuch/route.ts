export function GET(request: Request) {
  const incoming = new URL(request.url);
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || incoming.host;
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProtocol || incoming.protocol.replace(":", "");
  const target = new URL("/pdf-reader", `${protocol}://${host}`);
  target.searchParams.set("lang", "de");
  target.searchParams.set("source", "german-notebook");
  incoming.searchParams.forEach((value, key) =>
    target.searchParams.set(key, value),
  );
  return Response.redirect(target, 307);
}
