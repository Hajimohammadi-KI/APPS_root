/**
 * Shared SSRF guard and capped body reader for the public PDF proxies.
 *
 * Both the tracker and the PDF reader fetch learner-supplied URLs server-side,
 * so the host check has to reject every form that resolves to a private
 * address, not just the ones that look private as text.
 */

// Held below the Cloudflare Worker memory ceiling: the body is buffered before
// the size check, so a larger cap would abort the isolate instead of returning
// a clean 413.
export const MAX_PDF_BYTES = 24 * 1024 * 1024;
export const TOO_LARGE_MESSAGE = "Die PDF ist größer als 24 MB.";

const BLOCKED_NAME = /^(?:localhost|.*\.localhost)$/i;
const BLOCKED_SUFFIX = [".local", ".internal", ".home.arpa"];

/**
 * `URL` canonicalises decimal/octal/hex hosts to dotted quads, but a bare
 * integer host such as `2130706433` (127.0.0.1) survives as digits, so both
 * shapes are handled here.
 */
export function parseIpv4(host: string): number[] | null {
  if (/^\d+$/.test(host)) {
    const value = Number(host);
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) return null;
    return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
  }
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : -1));
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

export function isPrivateIpv4(octets: number[]) {
  const [a, b] = octets;
  return a === 0 // 0.0.0.0/8
    || a === 10 // private
    || a === 127 // loopback
    || (a === 100 && b >= 64 && b <= 127) // carrier-grade NAT
    || (a === 169 && b === 254) // link-local, incl. cloud metadata
    || (a === 172 && b >= 16 && b <= 31) // private
    || (a === 192 && b === 168) // private
    || a >= 224; // multicast and reserved
}

/**
 * Expands an IPv6 literal to its eight 16-bit groups. Needed because `URL`
 * rewrites `::ffff:127.0.0.1` to the hex form `::ffff:7f00:1`, so matching the
 * dotted-quad spelling alone would miss IPv4-mapped loopback.
 */
export function expandIpv6(address: string): number[] | null {
  let text = address;
  // A trailing dotted quad (`::ffff:127.0.0.1`) becomes two hex groups.
  const tail = text.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (tail) {
    const octets = parseIpv4(tail[1]);
    if (!octets) return null;
    const hex = `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
    text = `${text.slice(0, -tail[1].length)}${hex}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const parse = (part: string) => (part ? part.split(":").map((group) => (/^[0-9a-f]{1,4}$/.test(group) ? parseInt(group, 16) : -1)) : []);
  const head = parse(halves[0]);
  const tailGroups = halves.length === 2 ? parse(halves[1]) : [];
  if ([...head, ...tailGroups].some((group) => group < 0)) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const gap = 8 - head.length - tailGroups.length;
  if (gap < 1) return null;
  return [...head, ...Array<number>(gap).fill(0), ...tailGroups];
}

/** `url.hostname` keeps the brackets around an IPv6 literal. */
export function isPrivateIpv6(host: string) {
  const address = host.slice(1, -1).toLowerCase();
  const groups = expandIpv6(address);
  if (!groups) return true; // Unparseable literal: refuse rather than guess.
  // Unique-local (fc00::/7) and link-local (fe80::/10).
  if ((groups[0] & 0xfe00) === 0xfc00) return true;
  if ((groups[0] & 0xffc0) === 0xfe80) return true;
  const leadingZero = groups.slice(0, 5).every((group) => group === 0);
  if (!leadingZero) return false;
  // `::`, `::1` and other IPv4-compatible or IPv4-mapped forms all live here.
  if (groups[5] === 0 || groups[5] === 0xffff) {
    const octets = [groups[6] >> 8, groups[6] & 255, groups[7] >> 8, groups[7] & 255];
    if (groups[5] === 0 && groups[6] === 0 && groups[7] <= 1) return true; // :: and ::1
    return isPrivateIpv4(octets);
  }
  return false;
}

/**
 * The tracker also serves its own study materials from the local legacy server,
 * so that one exact origin and path prefix may be allowed explicitly while
 * every other loopback address stays blocked.
 */
export function isTrustedLocalMaterial(url: URL) {
  return url.protocol === "http:"
    && url.hostname === "127.0.0.1"
    && url.port === "3199"
    && url.pathname.startsWith("/api/materials/");
}

export type SafeUrlOptions = { allowLocalMaterial?: boolean };

/** Throws `invalid-url` or `private-url`; callers map those to user messages. */
export function safeRemotePdfUrl(value: string, options: SafeUrlOptions = {}) {
  const url = new URL(value);
  if (options.allowLocalMaterial && isTrustedLocalMaterial(url)) return url;
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("invalid-url");
  }
  const host = url.hostname.toLowerCase();
  const ipv4 = parseIpv4(host);
  if (
    BLOCKED_NAME.test(host)
    || BLOCKED_SUFFIX.some((suffix) => host.endsWith(suffix))
    || (host.startsWith("[") && isPrivateIpv6(host))
    || (ipv4 !== null && isPrivateIpv4(ipv4))
  ) {
    throw new Error("private-url");
  }
  return url;
}

/**
 * `content-length` is attacker-controlled, so stream the body and stop as soon
 * as the cap is passed instead of buffering an unbounded response first.
 * Returns `null` when the cap is exceeded.
 */
export async function readCapped(response: Response): Promise<Uint8Array<ArrayBuffer> | null> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PDF_BYTES) return null;
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
