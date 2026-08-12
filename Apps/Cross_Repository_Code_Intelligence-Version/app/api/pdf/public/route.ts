import { MAX_PDF_BYTES, TOO_LARGE_MESSAGE as TOO_LARGE, readCapped, safeRemotePdfUrl } from "../../../../lib/safe-remote-url";

const MAX_REDIRECTS = 4;

/** The tracker may also load its own locally served study materials. */
const safePublicPdfUrl = (value: string) => safeRemotePdfUrl(value, { allowLocalMaterial: true });

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
      return Response.json({ message: TOO_LARGE }, { status: 413 });
    }
    const bytes = await readCapped(response);
    if (!bytes) {
      return Response.json({ message: TOO_LARGE }, { status: 413 });
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
