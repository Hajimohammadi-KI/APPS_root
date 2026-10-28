/**
 * Small fixed-window request limiter for the server routes that call paid or
 * public services (roadmap R90). State lives in process memory, so on a
 * serverless host each instance counts separately; the limiter bounds abuse
 * per instance and is not a billing guarantee.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitRule {
  scope: string;
  limit: number;
  windowMs: number;
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "local";
}

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Returns a 429 response when the client exceeded the rule, otherwise null. */
export function rateLimit(
  request: Request,
  rule: RateLimitRule,
  now = Date.now(),
) {
  sweep(now);
  const key = `${rule.scope}:${clientKey(request)}`;
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }
  bucket.count += 1;
  if (bucket.count <= rule.limit) return null;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return Response.json(
    {
      message:
        "Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.",
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

export function resetRateLimits() {
  buckets.clear();
}
