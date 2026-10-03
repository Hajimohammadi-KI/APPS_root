import { disconnectGoogle, googleClient, testGoogleConnection } from "../../../lib/google-provider";
import { deleteProviderSecret, getProviderSecret, providerSummary, saveProviderSecret, updateProviderState } from "../../../lib/provider-secrets";
import { DeepLConfig, OpenAIConfig, testDeepL, testOpenAI } from "../../../lib/provider-tests";
import { DEFAULT_OPENAI_MODEL } from "../../../lib/model-config";
import { isSameOriginMutation, requestOwner } from "../../../lib/server-user";

function noStore(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

function mask(value: string) {
  return value.length > 4 ? `••••${value.slice(-4)}` : "••••";
}

export async function GET(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return noStore({ message: "Bitte zuerst anmelden." }, { status: 401 });
  const [googleBase, openai, deepl, googleLive, googleConfig] = await Promise.all([
    providerSummary(request, "google"),
    providerSummary(request, "openai"),
    providerSummary(request, "deepl"),
    testGoogleConnection(request),
    googleClient(request),
  ]);
  return noStore({
    callbackUrl: googleConfig?.redirectUri || `${new URL(request.url).origin}/api/google/callback`,
    google: { ...googleBase, ...googleLive },
    openai,
    deepl,
  });
}

export async function POST(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return noStore({ message: "Bitte zuerst anmelden." }, { status: 401 });
  if (!isSameOriginMutation(request)) return noStore({ message: "Diese Änderung ist nur direkt in Einstellungen erlaubt." }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return noStore({ message: "Die Eingaben sind ungültig." }, { status: 400 }); }
  const provider = String(body.provider || "");
  if (provider === "google") {
    const clientId = String(body.clientId || "").trim().slice(0, 500);
    const clientSecret = String(body.clientSecret || "").trim().slice(0, 1000);
    const current = await getProviderSecret<{ clientId: string; clientSecret: string; redirectUri?: string }>(owner, "google");
    const fallbackRedirectUri = current?.redirectUri || `${new URL(request.url).origin}/api/google/callback`;
    const requestedRedirectUri = String(body.redirectUri || fallbackRedirectUri).trim().slice(0, 1000);
    let redirectUri = "";
    try {
      const parsed = new URL(requestedRedirectUri);
      const localHttp = parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
      if (parsed.protocol !== "https:" && !localHttp) throw new Error("invalid_protocol");
      if (!parsed.pathname.endsWith("/api/google/callback")) throw new Error("invalid_path");
      redirectUri = parsed.toString();
    } catch { return noStore({ message: "Die Callback-URL muss eine gültige HTTPS-Adresse oder eine lokale HTTP-Adresse sein und auf /api/google/callback enden." }, { status: 400 }); }
    const candidate = { clientId: clientId || current?.clientId || "", clientSecret: clientSecret || current?.clientSecret || "", redirectUri };
    if (!candidate.clientId || !candidate.clientSecret) return noStore({ message: "Google Client-ID und Client-Secret werden beide benötigt." }, { status: 400 });
    const credentialsChanged = Boolean(current && (candidate.clientId !== current.clientId || candidate.clientSecret !== current.clientSecret));
    const redirectChanged = Boolean(current && candidate.redirectUri !== current.redirectUri);
    if (current && !clientId && !clientSecret && !redirectChanged) return noStore({ ok: true, state: "unchanged", message: "Die sichere Google-Konfiguration ist bereits gespeichert. Du kannst jetzt die Freigabe starten oder erneut testen." });
    if (credentialsChanged || redirectChanged) await disconnectGoogle(request);
    await saveProviderSecret(owner, "google", candidate, { clientIdHint: mask(candidate.clientId), redirectUri: candidate.redirectUri }, "untested", null);
    return noStore({ ok: true, state: "untested", message: "Google-Konfiguration wurde sicher gespeichert. Jetzt die offizielle Google-Freigabe starten." });
  }
  if (provider === "openai") {
    const current = await getProviderSecret<OpenAIConfig>(owner, "openai");
    const apiKey = String(body.apiKey || "").trim().slice(0, 1000) || current?.apiKey || "";
    const model = String(body.model || current?.model || DEFAULT_OPENAI_MODEL).trim().slice(0, 100);
    if (!apiKey) return noStore({ message: "Bitte einen OpenAI API-Schlüssel eingeben." }, { status: 400 });
    const result = await testOpenAI({ apiKey, model });
    if (!result.ok) {
      if (current) await updateProviderState(owner, "openai", result.state, { message: result.message, model });
      return noStore({ ok: false, state: result.state, message: result.message }, { status: 422 });
    }
    await saveProviderSecret(owner, "openai", { apiKey, model }, { keyHint: mask(apiKey), model: String(result.metadata?.model || model), message: "" }, "connected", new Date().toISOString());
    return noStore({ ok: true, state: "connected", message: result.message, metadata: { model: String(result.metadata?.model || model), keyHint: mask(apiKey) } });
  }
  if (provider === "deepl") {
    const current = await getProviderSecret<DeepLConfig>(owner, "deepl");
    const apiKey = String(body.apiKey || "").trim().slice(0, 1000) || current?.apiKey || "";
    const tier = body.tier === "pro" ? "pro" : body.tier === "free" ? "free" : current?.tier || "free";
    if (!apiKey) return noStore({ message: "Bitte einen DeepL API-Schlüssel eingeben." }, { status: 400 });
    const result = await testDeepL({ apiKey, tier });
    if (!result.ok) {
      if (current) await updateProviderState(owner, "deepl", result.state, { message: result.message, tier });
      return noStore({ ok: false, state: result.state, message: result.message }, { status: 422 });
    }
    await saveProviderSecret(owner, "deepl", { apiKey, tier }, { keyHint: mask(apiKey), tier, ...result.metadata, message: "" }, "connected", new Date().toISOString());
    return noStore({ ok: true, state: "connected", message: result.message, metadata: { keyHint: mask(apiKey), tier, ...result.metadata } });
  }
  return noStore({ message: "Unbekannter Dienst." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return noStore({ message: "Bitte zuerst anmelden." }, { status: 401 });
  if (!isSameOriginMutation(request)) return noStore({ message: "Diese Änderung ist nur direkt in Einstellungen erlaubt." }, { status: 403 });
  let body: Record<string, unknown> = {};
  try { body = await request.json() as Record<string, unknown>; } catch { /* empty body */ }
  const provider = String(body.provider || "");
  if (!(["google", "openai", "deepl"] as string[]).includes(provider)) return noStore({ message: "Unbekannter Dienst." }, { status: 400 });
  if (provider === "google") {
    await disconnectGoogle(request);
    await deleteProviderSecret(owner, "google");
  } else await deleteProviderSecret(owner, provider as "openai" | "deepl");
  return noStore({ ok: true, message: "Die gespeicherte Verbindung wurde entfernt." });
}

