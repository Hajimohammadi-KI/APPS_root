function deeplMessage(status: number, message?: string) {
  if (status === 403) return "Der DeepL-API-Schlüssel ist ungültig oder passt nicht zur gewählten Free-/Pro-Verbindung.";
  if (status === 456) return "Das DeepL-Kontingent ist aufgebraucht.";
  if (status === 429) return "DeepL erhält gerade zu viele Anfragen. Bitte kurz warten.";
  if (status >= 500) return "DeepL ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.";
  return message?.slice(0, 220) || "DeepL konnte den Text nicht übersetzen.";
}

const centralStudyApp = process.env.CENTRAL_STUDY_APP_URL?.trim() || "http://127.0.0.1:4312";

function centralHeaders(request: Request) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["oai-authenticated-user-id", "oai-authenticated-user-email"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function translateCentral(request: Request, body: { text?: string; target?: string; mode?: "translate" | "test" }) {
  try {
    const response = await fetch(`${centralStudyApp}/api/translate`, {
      method: "POST",
      headers: centralHeaders(request),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(32_000),
    });
    const data = await response.json().catch(() => ({}));
    return Response.json(data, { status: response.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { message: "DeepL ist nicht verbunden. Öffne die zentralen Einstellungen und speichere den API-Schlüssel einmalig." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; target?: string; mode?: "translate" | "test" };
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return translateCentral(request, body);
    }
    const host = apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";

    if (body.mode === "test") {
      const response = await fetch(`${host}/v2/usage`, {
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
        signal: AbortSignal.timeout(20_000),
      });
      const data = (await response.json().catch(() => ({}))) as { character_count?: number; character_limit?: number; message?: string };
      if (!response.ok) {
        return Response.json({ message: deeplMessage(response.status, data.message) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
      }
      return Response.json({ ok: true, usage: data }, { headers: { "Cache-Control": "no-store" } });
    }

    const text = body.text?.trim();
    const target = (body.target || "DE").toUpperCase();
    if (!text) return Response.json({ message: "Bitte zuerst Text auswählen." }, { status: 400 });
    if (text.length > 28_000) return Response.json({ message: "Der ausgewählte Text ist zu lang. Bitte einen kleineren Abschnitt verwenden." }, { status: 413 });

    const response = await fetch(`${host}/v2/translate`, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text], target_lang: target, preserve_formatting: true }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = (await response.json()) as { translations?: Array<{ text: string; detected_source_language?: string }>; message?: string };
    if (!response.ok) {
      return Response.json({ message: deeplMessage(response.status, data.message) }, { status: response.status, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json(
      { translation: data.translations?.[0]?.text || "Keine Übersetzung empfangen.", detectedLanguage: data.translations?.[0]?.detected_source_language },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return Response.json(
      { message: timeout ? "DeepL hat nicht rechtzeitig geantwortet. Bitte erneut versuchen." : "Die Übersetzung konnte nicht verarbeitet werden." },
      { status: timeout ? 504 : 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
