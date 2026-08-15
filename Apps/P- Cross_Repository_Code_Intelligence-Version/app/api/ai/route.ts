import { DEFAULT_OPENAI_MODEL } from "../../model-config";
import { getProviderSecretForRequest } from "../../../lib/provider-secrets";

const MAX_TEXT_LENGTH = 28_000;

function providerMessage(status: number, providerMessage?: string) {
  if (status === 401) return "Der OpenAI-API-Schlüssel ist ungültig oder wurde widerrufen.";
  if (status === 400 || status === 404) return "Das gewählte OpenAI-Modell ist falsch geschrieben oder für dieses API-Konto nicht verfügbar.";
  if (status === 429) return "OpenAI kann die Anfrage wegen Kontingent, Abrechnung oder zu vieler Anfragen gerade nicht ausführen.";
  if (status >= 500) return "OpenAI ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.";
  return providerMessage?.slice(0, 220) || "Die OpenAI-Verbindung konnte nicht hergestellt werden.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      selectedText?: string;
      question?: string;
      mode?: string;
    };
    const selectedText = body.selectedText?.trim();
    const question = body.question?.trim();
    if (!selectedText || !question) {
      return Response.json({ message: "Bitte markierten Text und eine Frage angeben." }, { status: 400 });
    }
    if (selectedText.length > MAX_TEXT_LENGTH || question.length > 4_000) {
      return Response.json({ message: "Der ausgewählte Text oder die Frage ist zu lang. Bitte einen kleineren Abschnitt verwenden." }, { status: 413 });
    }

    const stored = await getProviderSecretForRequest<{ apiKey: string; model?: string }>(request, "openai");
    const apiKey = stored?.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { message: "OpenAI ist noch nicht eingerichtet. Verbinde OpenAI einmal in den zentralen Einstellungen." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const modeInstruction = body.mode === "translate"
      ? "Translate the excerpt exactly into the requested target language. Preserve meaning, terminology and paragraph structure."
      : "Answer only from the supplied excerpt. If the excerpt is insufficient, say so clearly. Match the language of the user's question. Never invent citations.";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: stored?.model || process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
        store: false,
        max_output_tokens: body.mode === "test" ? 24 : 900,
        instructions: `You are a careful academic reading assistant. ${modeInstruction}`,
        input: `Selected article excerpt:\n${selectedText}\n\nUser request:\n${question}`,
      }),
      signal: AbortSignal.timeout(35_000),
    });

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return Response.json(
        { message: providerMessage(response.status, data.error?.message) },
        { status: response.status, headers: { "Cache-Control": "no-store" } },
      );
    }
    const answer = data.output_text || data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    return Response.json(
      { answer: answer || "Es wurde keine Textantwort zurückgegeben." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return Response.json(
      { message: timeout ? "OpenAI hat nicht rechtzeitig geantwortet. Bitte erneut versuchen." : "Die Anfrage konnte nicht verarbeitet werden. Bitte Verbindung und Eingaben prüfen." },
      { status: timeout ? 504 : 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
