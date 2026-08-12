import { deleteProviderSecret, getProviderSecret, getProviderSecretForRequest, saveProviderSecret, updateProviderState } from "./provider-secrets";
import { requestOwner } from "./server-user";

/**
 * `clientSecret` is empty for a shipped Desktop/PKCE client and only set for
 * legacy installations that registered their own Google Cloud "Web" client.
 */
export type GoogleClientConfig = { clientId: string; clientSecret?: string; redirectUri?: string };
export type GoogleTokens = { accessToken: string; refreshToken?: string; expiresAt: number; scope?: string; tokenType?: string };

async function safeJson(response: Response) {
  try { return await response.json() as Record<string, unknown>; } catch { return {}; }
}

export async function googleClient(request: Request) {
  return getProviderSecretForRequest<GoogleClientConfig>(request, "google");
}

export async function googleTokens(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return null;
  return getProviderSecret<GoogleTokens>(owner, "google_tokens");
}

export async function googleAccessToken(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return { token: null, message: "Bitte zuerst anmelden." };
  const client = await googleClient(request);
  let tokens = await getProviderSecret<GoogleTokens>(owner, "google_tokens");
  if (!client || !tokens) return { token: null, message: "Google ist noch nicht verbunden." };
  if (tokens.expiresAt > Date.now() + 60_000) return { token: tokens.accessToken, tokens };
  if (!tokens.refreshToken) {
    await updateProviderState(owner, "google", "expired", { message: "Google-Zugriff ist abgelaufen." });
    return { token: null, message: "Die Google-Verbindung ist abgelaufen. Bitte erneut freigeben." };
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: client.clientId,
        ...(client.clientSecret ? { client_secret: client.clientSecret } : {}),
        refresh_token: tokens.refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await safeJson(response);
    if (!response.ok || !data.access_token) throw new Error("refresh_failed");
    tokens = {
      ...tokens,
      accessToken: String(data.access_token),
      refreshToken: String(data.refresh_token || tokens.refreshToken),
      expiresAt: Date.now() + Number(data.expires_in || 3500) * 1000,
      scope: String(data.scope || tokens.scope || ""),
      tokenType: String(data.token_type || tokens.tokenType || "Bearer"),
    };
    await saveProviderSecret(owner, "google_tokens", tokens, { expiresAt: tokens.expiresAt, scopes: tokens.scope || "" }, "connected", new Date().toISOString());
    return { token: tokens.accessToken, tokens };
  } catch {
    await updateProviderState(owner, "google", "expired", { message: "Google-Token konnte nicht erneuert werden." });
    return { token: null, message: "Google konnte nicht automatisch erneuert werden. Bitte erneut verbinden." };
  }
}

async function probe(url: string, token: string) {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) });
    return response.ok;
  } catch { return false; }
}

export async function testGoogleConnection(request: Request) {
  const owner = requestOwner(request);
  const client = await googleClient(request);
  if (!owner || !client) return { configured: false, connected: false, state: "not_configured", services: {} };
  const access = await googleAccessToken(request);
  if (!access.token) return { configured: true, connected: false, state: "untested", services: {}, message: access.message };
  const token = access.token;
  const grantedScopes = new Set(String(access.tokens?.scope || "").split(/\s+/).filter(Boolean));
  const calendarScopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ];
  const requested = {
    calendar: calendarScopes.some((scope) => grantedScopes.has(scope)),
    gmail: grantedScopes.has("https://www.googleapis.com/auth/gmail.readonly"),
    drive: grantedScopes.has("https://www.googleapis.com/auth/drive.readonly"),
  };
  const [identity, calendar, gmail, drive] = await Promise.all([
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) }).then(async (response) => ({ ok: response.ok, data: await safeJson(response) })).catch(() => ({ ok: false, data: {} })),
    requested.calendar ? probe("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&singleEvents=true", token) : Promise.resolve(undefined),
    requested.gmail ? probe("https://gmail.googleapis.com/gmail/v1/users/me/profile", token) : Promise.resolve(undefined),
    requested.drive ? probe("https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)", token) : Promise.resolve(undefined),
  ]);
  const services = { calendar, gmail, drive };
  const selectedResults = Object.entries(services).filter(([name]) => requested[name as keyof typeof requested]).map(([, ok]) => ok);
  const connected = identity.ok && selectedResults.length > 0 && selectedResults.every(Boolean);
  const identityData = identity.data as Record<string, unknown>;
  const account = String(identityData.email || "");
  await updateProviderState(owner, "google", connected ? "connected" : "error", { account, services, message: connected ? "" : "Mindestens ein gewählter Google-Dienst konnte nicht gelesen werden." });
  return { configured: true, connected, state: connected ? "connected" : "error", account, services, message: connected ? "Google wurde erfolgreich geprüft." : "Google ist angemeldet, aber die benötigten Dienste oder APIs sind noch nicht freigegeben." };
}

export async function disconnectGoogle(request: Request) {
  const owner = requestOwner(request);
  if (!owner) return;
  const tokens = await getProviderSecret<GoogleTokens>(owner, "google_tokens");
  if (tokens?.accessToken) {
    try { await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokens.accessToken)}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(8000) }); } catch { /* local deletion still proceeds */ }
  }
  await deleteProviderSecret(owner, "google_tokens");
  await updateProviderState(owner, "google", "untested", { account: "", services: {}, message: "" }, null);
}
