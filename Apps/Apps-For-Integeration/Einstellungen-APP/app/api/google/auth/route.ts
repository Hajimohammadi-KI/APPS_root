import { googleClient, GoogleTokens } from "../../../../lib/google-provider";
import { getProviderSecret } from "../../../../lib/provider-secrets";
import { requestOwner } from "../../../../lib/server-user";

const GOOGLE_SERVICES = new Set(["calendar", "gmail", "drive"]);

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * PKCE lets the app ship a public Desktop client ID with no client secret, so
 * the learner never has to create a Google Cloud project or download a JSON
 * file just to press "Connect".
 */
async function pkce() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

function cookie(request: Request, name: string, value: string, maxAge = 600) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAge}`;
}

function safeReturnTo(requestUrl: URL, value: string | null) {
  try {
    const target = new URL(value || "/settings", requestUrl.origin);
    if (target.origin !== requestUrl.origin || !target.pathname.startsWith("/")) return "/settings";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/settings";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const client = await googleClient(request);
  const returnTo = safeReturnTo(requestUrl, requestUrl.searchParams.get("returnTo"));
  // Only a client ID is required now; a secret is accepted but no longer needed.
  if (!client?.clientId) {
    const target = new URL(returnTo, requestUrl.origin);
    target.searchParams.set("google", "config");
    return Response.redirect(target);
  }
  const state = crypto.randomUUID();
  const { verifier, challenge } = await pkce();
  const callback = client.redirectUri || `${requestUrl.origin}/api/google/callback`;
  // Default to the calendar alone: Drive and Gmail are sensitive/restricted
  // scopes that force a Google security assessment and a scary consent screen,
  // so they are only requested when a feature actually asks for them.
  const requested = new Set((requestUrl.searchParams.get("services") || "calendar").split(",").filter((service) => GOOGLE_SERVICES.has(service)));
  const scopes = ["openid", "email"];
  if (requested.has("calendar")) scopes.push("https://www.googleapis.com/auth/calendar.events");
  if (requested.has("gmail")) scopes.push("https://www.googleapis.com/auth/gmail.readonly");
  if (requested.has("drive")) scopes.push("https://www.googleapis.com/auth/drive.readonly");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", client.clientId);
  auth.searchParams.set("redirect_uri", callback);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("access_type", "offline");
  // Google only returns a refresh token on an explicit consent, so ask for one
  // the first time and stay silent on every later reconnect.
  const owner = requestOwner(request);
  const existing = owner ? await getProviderSecret<GoogleTokens>(owner, "google_tokens") : null;
  if (!existing?.refreshToken) auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("state", state);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");
  auth.searchParams.set("scope", scopes.join(" "));
  const headers = new Headers({ Location: auth.toString() });
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_state", state));
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_verifier", verifier));
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_return", returnTo));
  return new Response(null, { status: 302, headers });
}

