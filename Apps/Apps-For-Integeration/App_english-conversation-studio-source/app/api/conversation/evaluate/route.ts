interface EvaluationRequestBody {
  readonly text: string;
  readonly language: "en" | "de";
}

interface LanguageToolMatch {
  readonly message: string;
  readonly offset: number;
  readonly length: number;
  readonly replacements?: readonly { readonly value: string }[];
  readonly rule?: {
    readonly id?: string;
    readonly category?: { readonly name?: string };
  };
}

interface LanguageToolResponse {
  readonly matches?: readonly LanguageToolMatch[];
}

function isRequestBody(value: unknown): value is EvaluationRequestBody {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.text === "string" &&
    candidate.text.trim().length >= 1 &&
    candidate.text.length <= 8_000 &&
    (candidate.language === "en" || candidate.language === "de")
  );
}

function applyReplacements(text: string, matches: readonly LanguageToolMatch[]) {
  const applicable = [...matches]
    .filter((match) => match.replacements?.[0]?.value !== undefined)
    .filter(
      (match) =>
        Number.isInteger(match.offset) &&
        Number.isInteger(match.length) &&
        match.offset >= 0 &&
        match.length >= 0 &&
        match.offset + match.length <= text.length,
    )
    .sort((left, right) => right.offset - left.offset);
  let corrected = text;
  let rightBoundary = text.length;
  for (const match of applicable) {
    const end = match.offset + match.length;
    if (end > rightBoundary) continue;
    const replacement = match.replacements?.[0]?.value;
    if (replacement === undefined) continue;
    corrected = `${corrected.slice(0, match.offset)}${replacement}${corrected.slice(end)}`;
    rightBoundary = match.offset;
  }
  return corrected;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRequestBody(body)) {
    return Response.json(
      { error: "text must contain 1–8000 characters and language must be en or de." },
      { status: 400 },
    );
  }

  const endpoint = process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check";
  const form = new URLSearchParams({
    text: body.text.trim(),
    language: body.language === "de" ? "de-DE" : "en-US",
    enabledOnly: "false",
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return Response.json(
        { error: `LanguageTool returned HTTP ${response.status}.` },
        { status: 502 },
      );
    }
    const payload = (await response.json()) as LanguageToolResponse;
    const matches = Array.isArray(payload.matches) ? payload.matches : [];
    const original = body.text.trim();
    return Response.json({
      original,
      corrected: applyReplacements(original, matches),
      provider: "LanguageTool",
      checkedAt: new Date().toISOString(),
      issues: matches.map((match) => ({
        message: match.message,
        offset: match.offset,
        length: match.length,
        replacements: (match.replacements ?? [])
          .slice(0, 3)
          .map((item: { readonly value: string }) => item.value),
        ruleId: match.rule?.id ?? "unknown",
        category: match.rule?.category?.name ?? "Language",
      })),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown provider error";
    return Response.json(
      { error: `LanguageTool is unavailable: ${reason}` },
      { status: 502 },
    );
  }
}
