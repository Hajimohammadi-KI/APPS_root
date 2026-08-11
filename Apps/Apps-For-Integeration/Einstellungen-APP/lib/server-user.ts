const AUTH_ID_HEADER = "oai-authenticated-user-id";
const AUTH_EMAIL_HEADER = "oai-authenticated-user-email";
const LOCAL_USER_KEY = "local-user";

function cleanHeader(value: string | null) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (normalized === "localhost" || normalized === "[::1]") return true;

  const octets = normalized.split(".");
  return octets.length === 4
    && octets[0] === "127"
    && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
}

/**
 * Local mode is intentionally an explicit two-part opt-in: the process must
 * have LOCAL_MODE=1 and the request URL must use a loopback host. Merely
 * sending a custom Host header to a deployed app cannot create a local user.
 */
export function isLocalModeRequest(request: Request) {
  return process.env.LOCAL_MODE === "1"
    && isLoopbackHostname(new URL(request.url).hostname);
}

export function requestOwner(request: Request): string | null {
  if (isLocalModeRequest(request)) return LOCAL_USER_KEY;

  // Keep the hosted Sites authentication contract and precedence unchanged.
  return cleanHeader(request.headers.get(AUTH_ID_HEADER))
    || cleanHeader(request.headers.get(AUTH_EMAIL_HEADER));
}

/**
 * Central storage key for tracker data. Email-only hosted users retain the
 * same SHA-256 key format used by the original APIs; local data always uses a
 * stable, human-readable key and never depends on a fake auth header.
 */
export async function requestUserKey(request: Request): Promise<string | null> {
  if (isLocalModeRequest(request)) return LOCAL_USER_KEY;

  const email = cleanHeader(request.headers.get(AUTH_EMAIL_HEADER))?.toLowerCase();
  const identity = email || cleanHeader(request.headers.get(AUTH_ID_HEADER));
  if (!identity) return null;

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identity),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `user_${hash}`;
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) return false;
  if (!origin) {
    return fetchSite === "same-origin"
      || fetchSite === "same-site"
      || (isLocalModeRequest(request) && !fetchSite);
  }
  return origin === new URL(request.url).origin;
}

