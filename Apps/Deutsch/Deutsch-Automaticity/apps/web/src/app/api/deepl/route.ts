const noStore = { "Cache-Control": "no-store" };
const centralStudyApp =
  process.env.CENTRAL_STUDY_APP_URL?.trim() || "http://127.0.0.1:4312";

function centralHeaders(request: Request, json = false) {
  const headers = new Headers(
    json ? { "Content-Type": "application/json" } : undefined,
  );
  for (const name of [
    "oai-authenticated-user-id",
    "oai-authenticated-user-email",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function GET(request: Request) {
  try {
    const response = await fetch(`${centralStudyApp}/api/status`, {
      headers: centralHeaders(request),
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      translation?: boolean;
      deepl?: boolean;
    };
    const connected =
      response.ok && (data.translation === true || data.deepl === true);
    return Response.json(
      {
        available: connected,
        connected,
        provider: "deepl",
        storage: connected ? "Central Study Tracker" : null,
      },
      { headers: noStore },
    );
  } catch {
    return Response.json(
      {
        available: false,
        connected: false,
        provider: "deepl",
        storage: null,
      },
      { headers: noStore },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      target?: string;
      source?: string;
      context?: string;
    };
    const response = await fetch(`${centralStudyApp}/api/translate`, {
      method: "POST",
      headers: centralHeaders(request, true),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(32_000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      translation?: string;
      detectedLanguage?: string;
      message?: string;
    };
    if (!response.ok)
      return Response.json(
        {
          message: data.message || "DeepL konnte diesen Text nicht übersetzen.",
        },
        { status: response.status, headers: noStore },
      );
    return Response.json(
      {
        ...data,
        provider: "deepl",
        storage: "Central Study Tracker",
      },
      { headers: noStore },
    );
  } catch (error) {
    const timeout =
      error instanceof Error &&
      ["AbortError", "TimeoutError"].includes(error.name);
    return Response.json(
      {
        message: timeout
          ? "DeepL hat nicht rechtzeitig geantwortet."
          : "Verbinde DeepL einmal in den zentralen Lernstudio-Einstellungen.",
      },
      { status: timeout ? 504 : 503, headers: noStore },
    );
  }
}
