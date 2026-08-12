import { googleClient, GoogleTokens } from "../../../../lib/google-provider";
import { getProviderSecret, saveProviderSecret } from "../../../../lib/provider-secrets";
import { requestOwner } from "../../../../lib/server-user";

function readCookie(request: Request, name: string) {
  const value = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value ? decodeURIComponent(value) : "";
}
function cookie(request: Request, name: string, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`;
}

function safeReturnTo(request: Request, value: string) {
  try {
    const origin = new URL(request.url).origin;
    const target = new URL(value || "/settings", origin);
    if (target.origin !== origin || !target.pathname.startsWith("/")) return "/settings";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/settings";
  }
}

function finish(request: Request, returnTo: string, result: string) {
  const target = new URL(safeReturnTo(request, returnTo), new URL(request.url).origin);
  target.searchParams.set("google", result);
  const headers = new Headers({ Location: target.toString() });
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_state", "", 0));
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_verifier", "", 0));
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_return", "", 0));
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = readCookie(request, "werkzeug_google_state");
  const verifier = readCookie(request, "werkzeug_google_verifier");
  const returnTo = readCookie(request, "werkzeug_google_return") || "/settings";
  const owner = requestOwner(request);
  const client = await googleClient(request);
  if (url.searchParams.get("error")) return finish(request, returnTo, "cancelled");
  if (!owner || !client || !code || !state || !verifier || expected !== state) return finish(request, returnTo, "invalid");
  try {
    const callback = client.redirectUri || `${url.origin}/api/google/callback`;
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: client.clientId,
        // Only legacy self-registered "Web" clients still carry a secret.
        ...(client.clientSecret ? { client_secret: client.clientSecret } : {}),
        code_verifier: verifier,
        redirect_uri: callback,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
    if (!response.ok || !data.access_token) return finish(request, returnTo, "failed");
    const previous = await getProviderSecret<GoogleTokens>(owner, "google_tokens");
    const tokens: GoogleTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || previous?.refreshToken,
      expiresAt: Date.now() + Number(data.expires_in || 3500) * 1000,
      scope: data.scope || previous?.scope || "",
      tokenType: data.token_type || "Bearer",
    };
    await saveProviderSecret(owner, "google_tokens", tokens, { expiresAt: tokens.expiresAt, scopes: tokens.scope || "" }, "connected", new Date().toISOString());
    await saveProviderSecret(owner, "google", client, { clientIdHint: `••••${client.clientId.slice(-4)}`, redirectUri: callback, message: "" }, "connected", new Date().toISOString());
    return finish(request, returnTo, "connected");
  } catch {
    return finish(request, returnTo, "failed");
  }
}
