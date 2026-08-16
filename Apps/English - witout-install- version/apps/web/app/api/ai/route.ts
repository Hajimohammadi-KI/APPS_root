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
        storage: connected ? "Central Study Tracker" : null,
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
      purpose?: "explanation" | "follow-up";
    };
    const content = body.content?.trim() || "";
    if (!content) {
      return Response.json(
        { message: "Choose some lesson content first." },
        { status: 400, headers: noStore },
      );
    }
    const question = [
      `Explain the lesson topic “${body.topic || "this topic"}” in ${body.language || "English"}.`,
      body.purpose === "follow-up"
        ? "Give one short follow-up question that makes the learner produce the target language."
        : "Use clear adult language, one concise rule, one original example, and one retrieval question.",
      body.learnerInput?.trim()
        ? `The learner wrote or said: ${body.learnerInput.trim()}`
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
              ? "OpenAI is not connected yet. Open Central Settings and save the API key once."
              : data.message || "The AI explanation could not be created.",
        },
        { status: response.status, headers: noStore },
      );
    }
    return Response.json(
      {
        text: data.answer || "No explanation was returned.",
        provider: "openai",
        providerLabel: "OpenAI",
        model: "central",
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
          ? "The AI service did not answer in time."
          : "The central AI service could not be reached.",
      },
      { status: timeout ? 504 : 503, headers: noStore },
    );
  }
}
