export type OpenAIConfig = { apiKey: string; model: string };
export type DeepLConfig = { apiKey: string; tier: "free" | "pro" };

type TestResult = {
  ok: boolean;
  state: "connected" | "quota_exhausted" | "invalid_key" | "unreachable" | "error";
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
    if (response.status === 401) return { ok: false, state: "invalid_key", message: "Der OpenAI API-Schlüssel ist ungültig oder wurde widerrufen." };
    if (response.status === 429) return { ok: false, state: "quota_exhausted", message: "OpenAI meldet ein Limit- oder Guthabenproblem. Bitte API-Konto und Abrechnung prüfen." };
    if (response.status === 404 || response.status === 400) return { ok: false, state: "error", message: `Das Modell „${config.model}“ ist für diesen API-Schlüssel nicht verfügbar oder falsch geschrieben.` };
    return { ok: false, state: "unreachable", message: "OpenAI konnte die Testanfrage nicht verarbeiten. Bitte später erneut versuchen." };
  } catch {
    return { ok: false, state: "unreachable", message: "OpenAI konnte nicht erreicht werden. Bitte Internetverbindung prüfen und erneut testen." };
  }
}

export async function testDeepL(config: DeepLConfig): Promise<TestResult> {
  try {
    const endpoint = config.tier === "free" ? "https://api-free.deepl.com/v2/usage" : "https://api.deepl.com/v2/usage";
    const response = await fetch(endpoint, {
      headers: { Authorization: `DeepL-Auth-Key ${config.apiKey}` },
      signal: AbortSignal.timeout(15000),
    });
    const data = await safeJson(response);
    if (response.ok) return { ok: true, state: "connected", message: "DeepL API wurde erfolgreich verbunden.", metadata: { tier: config.tier, characterCount: Number(data.character_count || 0), characterLimit: Number(data.character_limit || 0) } };
    if (response.status === 403) return { ok: false, state: "invalid_key", message: "Der DeepL API-Schlüssel ist ungültig oder gehört nicht zum gewählten Tarif." };
    if (response.status === 456 || response.status === 429) return { ok: false, state: "quota_exhausted", message: "Das DeepL-Zeichenkontingent ist aufgebraucht oder vorübergehend begrenzt." };
    return { ok: false, state: "unreachable", message: "DeepL konnte die Testanfrage nicht verarbeiten." };
  } catch {
    return { ok: false, state: "unreachable", message: "DeepL konnte nicht erreicht werden. Bitte Internetverbindung prüfen." };
  }
}
