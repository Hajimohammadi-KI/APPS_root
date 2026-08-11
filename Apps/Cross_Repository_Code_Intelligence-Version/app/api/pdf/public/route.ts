const MAX_PDF_BYTES = 200 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const BLOCKED_HOST = /^(?:localhost|0\.0\.0\.0|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|169\.254(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2}|::1)$/i;

function safePublicPdfUrl(value: string) {
  const url = new URL(value);
  const trustedLocalMaterial = url.protocol === "http:"
    && url.hostname === "127.0.0.1"
    && url.port === "3199"
    && url.pathname.startsWith("/api/materials/");
  if ((!trustedLocalMaterial && url.protocol !== "https:") || url.username || url.password) {
    throw new Error("invalid-url");
  }
  const host = url.hostname.toLowerCase();
  if (
    !trustedLocalMaterial && (BLOCKED_HOST.test(host)
    || host.endsWith(".local")
    || host.endsWith(".internal")
    || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host))
  ) {
    throw new Error("private-url");
  }
  return url;
}

async function fetchPublicPdf(initialUrl: URL) {
  let url = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(35_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("redirect");
      url = safePublicPdfUrl(new URL(location, url).toString());
      continue;
    }
    return response;
  }
  throw new Error("redirect");
}

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("url")?.trim() || "";
    if (!value) {
      return Response.json({ message: "Der PDF-Link fehlt." }, { status: 400 });
    }
    const response = await fetchPublicPdf(safePublicPdfUrl(value));
    if (!response.ok) {
      return Response.json(
        { message: "Die ausgewählte öffentliche PDF konnte nicht geladen werden." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PDF_BYTES) {
      return Response.json({ message: "Die PDF ist größer als 200 MB." }, { status: 413 });
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_PDF_BYTES) {
      return Response.json({ message: "Die PDF ist größer als 200 MB." }, { status: 413 });
    }
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      return Response.json(
        { message: "Der Link hat keine gültige PDF zurückgegeben." },
        { status: 415 },
      );
    }
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "private, no-store",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    const timeout = error instanceof Error
      && (error.name === "TimeoutError" || error.name === "AbortError");
    const invalid = error instanceof Error
      && (error.message === "invalid-url" || error.message === "private-url");
    return Response.json(
      {
        message: timeout
          ? "Die PDF-Quelle hat nicht rechtzeitig geantwortet."
          : invalid
            ? "Aus Sicherheitsgründen ist nur eine öffentliche HTTPS-PDF erlaubt."
            : "Die öffentliche PDF konnte nicht geladen werden.",
      },
      { status: timeout ? 504 : invalid ? 400 : 502 },
    );
  }
}
