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
      signal: AbortSignal.timeout(2_500),
    });
    const data = (await response.json().catch(() => ({}))) as {
      openai?: boolean;
      providers?: { openai?: { metadata?: { model?: string } } };
    };
    const connected = response.ok && data.openai === true;
    return Response.json(
      {
        available: connected,
        connected,
        provider: connected ? "openai" : null,
        providerLabel: connected ? "OpenAI" : null,
        model: data.providers?.openai?.metadata?.model || null,
        storage: connected ? "Zentrales Lernstudio" : null,
      },
      { headers: noStore },
    );
  } catch {
    return Response.json(
      {
        available: false,
        connected: false,
        provider: null,
        providerLabel: null,
        model: null,
        storage: null,
      },
      { headers: noStore },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      topic?: string;
      content?: string;
      learnerInput?: string;
      language?: string;
      purpose?: "explanation" | "follow-up" | "language-analysis";
    };
    const content = body.content?.trim() || "";
    if (
      !content ||
      content.length > 8_000 ||
      (body.learnerInput?.length ?? 0) > 8_000
    ) {
      return Response.json(
        {
          message:
            "Wähle zuerst einen Lerninhalt aus; jedes Textfeld ist auf 8000 Zeichen begrenzt.",
        },
        { status: 400, headers: noStore },
      );
    }
    const analysisRules =
      body.purpose === "language-analysis"
        ? "Nutze nur die bereitgestellten Texte und regelbasierten NLP-Beobachtungen. Behandle Kennzahlen als diagnostische Signale, nicht als Punkte. Trenne Beobachtung von Schlussfolgerung. Vergib niemals CEFR, Beherrschung, Automatik, Verstehen oder Aussprache; ein Transkript ist kein Audionachweis. Bewahre die Bedeutung. Antworte mit genau drei kurzen Abschnitten: Beobachtet, Reparatur, Transfer. Schlage eine explizite Reparatur und eine Aufgabe in einem neuen Kontext vor. Erfinde keine Quelle, Audiodaten, Zeitmessung, Provider-Prüfung oder Lernhistorie."
        : "";
    const question = [
      `Erkläre das Lernthema „${body.topic || "dieses Thema"}“ vollständig auf ${body.language || "Deutsch"}.`,
      body.purpose === "language-analysis"
        ? analysisRules
        : body.purpose === "follow-up"
          ? "Stelle eine kurze Anschlussfrage, mit der die lernende Person die Zielstruktur selbst produziert."
          : "Verwende klare Sprache für Erwachsene, eine kurze Regel, ein eigenständig formuliertes Beispiel und eine Abruffrage.",
      body.learnerInput?.trim()
        ? `Die lernende Person hat geschrieben oder gesagt: ${body.learnerInput.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
    const response = await fetch(`${centralStudyApp}/api/ai`, {
      method: "POST",
      headers: centralHeaders(request, true),
      body: JSON.stringify({ selectedText: content, question }),
      cache: "no-store",
      signal: AbortSignal.timeout(38_000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      answer?: string;
      message?: string;
    };
    if (!response.ok) {
      return Response.json(
        {
          message:
            response.status === 503
              ? "OpenAI ist noch nicht verbunden. Öffne die zentralen Einstellungen und speichere den API-Schlüssel einmalig."
              : data.message ||
                "Die KI-Erklärung konnte nicht erstellt werden.",
        },
        { status: response.status, headers: noStore },
      );
    }
    if (!data.answer?.trim()) {
      return Response.json(
        {
          message:
            "Der verbundene KI-Provider hat keine Rückmeldung geliefert.",
        },
        { status: 502, headers: noStore },
      );
    }
    return Response.json(
      {
        text: data.answer.trim(),
        provider: "openai",
        providerLabel: "OpenAI",
        model: "zentral",
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
          ? "Der KI-Dienst hat nicht rechtzeitig geantwortet."
          : "Der zentrale KI-Dienst konnte nicht erreicht werden.",
      },
      { status: timeout ? 504 : 503, headers: noStore },
    );
  }
}
