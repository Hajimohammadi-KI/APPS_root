import { isRecord } from "./contracts";
import { parseGrammarProvider } from "./grammar-feedback";

/** Interactive proofreading endpoint; no background requests or learner mastery claims. */
export async function handleGrammarFeedback(
  request: Request,
  endpoint: string,
  fetcher: typeof fetch = fetch,
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
  if (
    !isRecord(body) ||
    typeof body.text !== "string" ||
    !body.text.trim() ||
    body.text.length > 8000 ||
    new TextEncoder().encode(body.text).length > 20000 ||
    !["en", "de"].includes(String(body.language))
  )
    return Response.json(
      {
        error: "Provide 1–8000 characters in English or German (up to 20 KB).",
      },
      { status: 400, headers },
    );
  try {
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        text: body.text,
        language: body.language === "de" ? "de-DE" : "en-US",
        enabledOnly: "false",
      }),
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Provider unavailable");
    return Response.json(
      parseGrammarProvider(await response.json(), body.text),
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
