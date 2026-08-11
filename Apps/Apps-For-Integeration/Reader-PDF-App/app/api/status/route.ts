const centralStudyApp = process.env.CENTRAL_STUDY_APP_URL?.trim() || "http://127.0.0.1:4312";

export async function GET(request: Request) {
  const local = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    deepl: Boolean(process.env.DEEPL_API_KEY),
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  };
  if (local.openai && local.deepl && local.googleClientId) {
    return Response.json(local, { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const headers = new Headers();
    for (const name of ["oai-authenticated-user-id", "oai-authenticated-user-email"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await fetch(`${centralStudyApp}/api/status`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(2_500),
    });
    const central = await response.json() as { openai?: boolean; deepl?: boolean; googleClientId?: string };
    return Response.json(
      {
        openai: local.openai || central.openai === true,
        deepl: local.deepl || central.deepl === true,
        googleClientId: local.googleClientId || central.googleClientId || "",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(local, { headers: { "Cache-Control": "no-store" } });
  }
}
