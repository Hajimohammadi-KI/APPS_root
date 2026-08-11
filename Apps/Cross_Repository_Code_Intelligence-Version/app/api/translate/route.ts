import { getProviderSecretForRequest, updateProviderState } from "../../../lib/provider-secrets";
import { requestOwner } from "../../../lib/server-user";

const noStore = { "Cache-Control": "no-store" };

function deepLMessage(status: number, message?: string) {
  if (status === 403) return "Der DeepL API-Schlüssel ist ungültig. Bitte die Verbindung in den Einstellungen erneuern.";
  if (status === 456 || status === 429) return "Das DeepL-Zeichenkontingent ist aufgebraucht oder vorübergehend begrenzt.";
  if (status >= 500) return "DeepL ist vorübergehend nicht erreichbar.";
  return message?.slice(0, 240) || "DeepL konnte den Text nicht übersetzen.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { text?: string; target?: string; source?: string; mode?: "translate" | "test" };
    const config = await getProviderSecretForRequest<{ apiKey: string; tier?: "free" | "pro" }>(request, "deepl");
    if (!config?.apiKey) return Response.json({ message: "DeepL API ist noch nicht eingerichtet. Bitte den API-Free-Schlüssel einmal in den zentralen Einstellungen speichern." }, { status: 503, headers: noStore });

    const text = body.mode === "test" ? "Connection test" : body.text?.trim();
    if (!text) return Response.json({ message: "Bitte zuerst Text auswählen." }, { status: 400, headers: noStore });
    if (text.length > 28_000) return Response.json({ message: "Der ausgewählte Text ist zu lang. Bitte einen kleineren Abschnitt verwenden." }, { status: 413, headers: noStore });

    const target = (body.mode === "test" ? "DE" : body.target || "DE").toUpperCase();
    const source = body.source && body.source.toUpperCase() !== "AUTO" ? body.source.toUpperCase() : undefined;
    if (target === "FA" || source === "FA") return Response.json({ message: "DeepL unterstützt Persisch derzeit nicht. Bitte Deutsch oder Englisch wählen; für Persisch kann die KI-Übersetzung verwendet werden." }, { status: 422, headers: noStore });

    const tier = config.tier || (config.apiKey.endsWith(":fx") ? "free" : "pro");
    const response = await fetch(`${tier === "free" ? "https://api-free.deepl.com" : "https://api.deepl.com"}/v2/translate`, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: [text], target_lang: target, ...(source ? { source_lang: source } : {}) }),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await response.json().catch(() => ({})) as { translations?: Array<{ text?: string; detected_source_language?: string }>; message?: string };
    if (!response.ok) {
      const owner = requestOwner(request);
      if (owner) await updateProviderState(owner, "deepl", response.status === 456 || response.status === 429 ? "quota_exhausted" : "error", { message: deepLMessage(response.status, data.message) });
      return Response.json({ message: deepLMessage(response.status, data.message) }, { status: response.status, headers: noStore });
    }
    const translated = data.translations?.[0];
    if (!translated?.text) return Response.json({ message: "DeepL hat eine leere Übersetzung zurückgegeben." }, { status: 502, headers: noStore });
    const owner = requestOwner(request);
    if (owner) await updateProviderState(owner, "deepl", "connected", { message: "" });
    return Response.json({ ok: true, translation: translated.text, detectedLanguage: translated.detected_source_language, provider: "deepl" }, { headers: noStore });
  } catch (error) {
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return Response.json({ message: timeout ? "DeepL hat nicht rechtzeitig geantwortet." : "Die Übersetzung konnte nicht verarbeitet werden." }, { status: timeout ? 504 : 500, headers: noStore });
  }
}
