import { centralHeaders, centralStudyAppUrl } from "@/lib/central-study";
import { rateLimit } from "@/lib/rate-limit";

const noStore = { "Cache-Control": "no-store" };
const DEEPL_RULE = { scope: "deepl", limit: 30, windowMs: 60_000 };
const LIMITS = { text: 5_000, context: 2_000, target: 12, source: 12 } as const;

// Only known string fields, each bounded, are forwarded to the translator.
function translationBody(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of Object.keys(LIMITS) as Array<keyof typeof LIMITS>) {
    const value = input[key];
    if (typeof value === "string" && value.length <= LIMITS[key]) out[key] = value;
    else if (value !== undefined) return null;
  }
  return out.text?.trim() ? out : null;
}

export async function GET() {
  try {
    const response = await fetch(`${centralStudyAppUrl()}/api/status`, { headers: centralHeaders(), cache: "no-store", signal: AbortSignal.timeout(3_000) });
    const data = await response.json().catch(() => ({})) as { translation?: boolean; deepl?: boolean };
    const connected = response.ok && (data.translation === true || data.deepl === true);
    return Response.json({ available: connected, connected, provider: "deepl", storage: connected ? "Central Study Tracker" : null }, { headers: noStore });
  } catch {
    return Response.json({ available: false, connected: false, provider: "deepl", storage: null }, { headers: noStore });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, DEEPL_RULE);
  if (limited) return limited;
  try {
    const body = translationBody(await request.json().catch(() => null));
    if (!body) return Response.json({ message: "Send a short text (up to 5000 characters) to translate." }, { status: 400, headers: noStore });
    const response = await fetch(`${centralStudyAppUrl()}/api/translate`, {
      method: "POST", headers: centralHeaders(true), body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(32_000),
    });
    const data = await response.json().catch(() => ({})) as { translation?: string; detectedLanguage?: string; message?: string };
    if (!response.ok) return Response.json({ message: data.message || "DeepL could not translate this text." }, { status: response.status, headers: noStore });
    return Response.json({ ...data, provider: "deepl", storage: "Central Study Tracker" }, { headers: noStore });
  } catch (error) {
    const timeout = error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name);
    return Response.json({ message: timeout ? "DeepL did not answer in time." : "Connect DeepL once in the central Study Tracker settings." }, { status: timeout ? 504 : 503, headers: noStore });
  }
}
