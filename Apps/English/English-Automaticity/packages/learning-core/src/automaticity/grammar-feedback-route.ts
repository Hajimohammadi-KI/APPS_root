import { isRecord } from "./contracts";
import { parseGrammarProvider } from "./grammar-feedback";

const VARIANTS = {
  en: ["en-US", "en-GB"],
  de: ["de-DE", "de-AT", "de-CH"],
} as const;

export interface GrammarRateLimiter {
  /** Seconds until the client may retry, or 0 when the request is allowed. */
  take(client: string): number;
}

/**
 * Fixed-window limit per client. On serverless hosts each instance keeps its
 * own window, so this protects the shared public provider quota on a
 * best-effort basis rather than as a global guarantee.
 */
export function createGrammarRateLimiter({
  limit = 10,
  windowMs = 60_000,
  now = Date.now,
}: {
  limit?: number;
  windowMs?: number;
  now?: () => number;
} = {}): GrammarRateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(client) {
      const at = now();
      for (const [key, window] of windows)
        if (at - window.start >= windowMs) windows.delete(key);
      const window = windows.get(client) ?? { start: at, count: 0 };
      if (window.count >= limit)
        return Math.max(1, Math.ceil((window.start + windowMs - at) / 1000));
      window.count += 1;
      windows.set(client, window);
      return 0;
    },
  };
}

const defaultLimiter = createGrammarRateLimiter();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "local"
  );
}

/** Interactive proofreading endpoint; no background requests or learner mastery claims. */
export async function handleGrammarFeedback(
  request: Request,
  endpoint: string,
  fetcher: typeof fetch = fetch,
  limiter: GrammarRateLimiter = defaultLimiter,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400, headers },
    );
  }
  const language =
    isRecord(body) && (body.language === "en" || body.language === "de")
      ? body.language
      : null;
  const allowed: readonly string[] = language ? VARIANTS[language] : [];
  const variant =
    isRecord(body) && body.variant !== undefined
      ? String(body.variant)
      : allowed[0];
  if (
    !isRecord(body) ||
    typeof body.text !== "string" ||
    !body.text.trim() ||
    body.text.length > 8000 ||
    new TextEncoder().encode(body.text).length > 20000 ||
    !language ||
    !variant ||
    !allowed.includes(variant)
  )
    return Response.json(
      {
        error:
          "Provide 1–8000 characters in English or German (up to 20 KB) and a supported language variant.",
      },
      { status: 400, headers },
    );
  if (body.consent !== true)
    return Response.json(
      {
        error:
          "Online proofreading needs your explicit consent. Nothing was sent.",
      },
      { status: 403, headers },
    );
  const retryAfter = limiter.take(clientKey(request));
  if (retryAfter > 0)
    return Response.json(
      {
        error: `Too many online checks. Nothing was sent; try again in ${retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: { ...headers, "Retry-After": String(retryAfter) },
      },
    );
  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        text: body.text,
        language: variant,
        enabledOnly: "false",
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Provider unavailable");
    return Response.json(
      parseGrammarProvider(
        withoutRegionalOnlyMatches(await response.json()),
        body.text,
      ),
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          "Online proofreading is unavailable. Your response is not graded; try again later.",
      },
      { status: 502, headers },
    );
  }
}

/** A phrase that is standard in another variant of the language is not an error. */
function withoutRegionalOnlyMatches(raw: unknown): unknown {
  if (!isRecord(raw) || !Array.isArray(raw.matches)) return raw;
  return {
    ...raw,
    matches: raw.matches.filter(
      (item: unknown) =>
        !(
          isRecord(item) &&
          isRecord(item.rule) &&
          item.rule.issueType === "locale-violation"
        ),
    ),
  };
}
