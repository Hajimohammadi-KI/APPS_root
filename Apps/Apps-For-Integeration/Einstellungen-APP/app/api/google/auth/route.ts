import { googleClient } from "../../../../lib/google-provider";

const GOOGLE_SERVICES = new Set(["calendar", "gmail", "drive"]);

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
  if (!client?.clientId || !client.clientSecret) {
    const target = new URL(returnTo, requestUrl.origin);
    target.searchParams.set("google", "config");
    return Response.redirect(target);
  }
  const state = crypto.randomUUID();
  const callback = client.redirectUri || `${requestUrl.origin}/api/google/callback`;
  const requested = new Set((requestUrl.searchParams.get("services") || "calendar,drive").split(",").filter((service) => GOOGLE_SERVICES.has(service)));
  const scopes = ["openid", "email"];
  if (requested.has("calendar")) scopes.push("https://www.googleapis.com/auth/calendar.events");
  if (requested.has("gmail")) scopes.push("https://www.googleapis.com/auth/gmail.readonly");
  if (requested.has("drive")) scopes.push("https://www.googleapis.com/auth/drive.readonly");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", client.clientId);
  auth.searchParams.set("redirect_uri", callback);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("state", state);
  auth.searchParams.set("scope", scopes.join(" "));
  const headers = new Headers({ Location: auth.toString() });
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_state", state));
  headers.append("Set-Cookie", cookie(request, "werkzeug_google_return", returnTo));
  return new Response(null, { status: 302, headers });
}

