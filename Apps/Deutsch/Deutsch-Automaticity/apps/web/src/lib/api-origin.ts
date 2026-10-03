/** Public web builds use same-origin routes; desktop ports stay server-side. */
export function isLocalAppHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(host)) return true;
  const octets = host.split(".").map(Number);
  if (
    octets.length !== 4 ||
    !octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  )
    return false;
  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && (octets[1] ?? -1) >= 16 && (octets[1] ?? -1) <= 31)
  );
}

export function normalizeApiOrigin(
  value?: string,
  configured?: string,
  pageHost?: string,
): string {
  for (const candidate of [value, configured]) {
    if (!candidate?.trim()) continue;
    try {
      const url = new URL(candidate.trim());
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        continue;
      const legacyPort = ["4201", "4210"].includes(url.port);
      if (
        legacyPort &&
        (isLocalAppHost(url.hostname) || url.hostname === pageHost)
      )
        continue;
      return candidate.trim().replace(/\/+$/, "");
    } catch {
      // An invalid optional endpoint falls back to the app's same-origin mode.
    }
  }
  return "";
}

export function usesDevicePractice(baseUrl: string, hostname: string): boolean {
  return !baseUrl && !isLocalAppHost(hostname);
}
