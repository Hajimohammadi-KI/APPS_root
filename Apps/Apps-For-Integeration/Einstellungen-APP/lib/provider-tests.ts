export type OpenAIConfig = { apiKey: string; model: string };
export type DeepLConfig = { apiKey: string; tier: "free" | "pro" };

type TestResult = {
  ok: boolean;
  state: "connected" | "quota_exhausted" | "error";
  message: string;
  metadata?: Record<string, unknown>;
};

async function safeJson(response: Response) {
  try { return await response.json() as Record<string, unknown>; } catch { return {}; }
}

export async function testOpenAI(config: OpenAIConfig): Promise<TestResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, input: "Reply with OK.", max_output_tokens: 16, store: false }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await safeJson(response);
    if (response.ok) return { ok: true, state: "connected", message: "OpenAI hat erfolgreich geantwortet.", metadata: { model: String(data.model || config.model) } };
    if (response.status === 401) return { ok: false, state: "error", message: "Der OpenAI API-Schlüssel ist ungültig oder wurde widerrufen." };
    if (response.status === 429) return { ok: false, state: "quota_exhausted", message: "OpenAI meldet ein Limit- oder Guthabenproblem. Bitte API-Konto und Abrechnung prüfen." };
    if (response.status === 404 || response.status === 400) return { ok: false, state: "error", message: `Das Modell „${config.model}“ ist für diesen API-Schlüssel nicht verfügbar oder falsch geschrieben.` };
    return { ok: false, state: "error", message: "OpenAI konnte die Testanfrage nicht verarbeiten. Bitte später erneut versuchen." };
  } catch {
    return { ok: false, state: "error", message: "OpenAI konnte nicht erreicht werden. Bitte Internetverbindung prüfen und erneut testen." };
  }
}

export async function testDeepL(config: DeepLConfig): Promise<TestResult> {
  const host = config.tier === "free" ? "https://api-free.deepl.com" : "https://api.deepl.com";
  try {
    const response = await fetch(`${host}/v2/usage`, { headers: { Authorization: `DeepL-Auth-Key ${config.apiKey}` }, signal: AbortSignal.timeout(12000) });
    const data = await safeJson(response);
    if (response.ok) return {
      ok: true,
      state: "connected",
      message: "DeepL wurde erfolgreich geprüft.",
      metadata: {
        tier: config.tier,
        characterCount: Number(data.character_count || data.api_key_character_count || 0),
        characterLimit: Number(data.character_limit || data.api_key_character_limit || 0),
      },
    };
    if (response.status === 401 || response.status === 403) return { ok: false, state: "error", message: "Der DeepL API-Schlüssel ist ungültig oder passt nicht zur gewählten Free/Pro-Version." };
    if (response.status === 456) return { ok: false, state: "quota_exhausted", message: "Das DeepL-Kontingent ist aufgebraucht." };
    if (response.status === 429) return { ok: false, state: "error", message: "DeepL hat zu viele Anfragen erhalten. Bitte kurz warten und erneut testen." };
    return { ok: false, state: "error", message: "DeepL konnte die Testanfrage nicht verarbeiten." };
  } catch {
    return { ok: false, state: "error", message: "DeepL konnte nicht erreicht werden. Bitte später erneut testen." };
  }
}
