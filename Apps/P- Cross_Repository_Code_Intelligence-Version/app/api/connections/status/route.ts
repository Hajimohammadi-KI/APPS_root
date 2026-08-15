import { testGoogleConnection } from "../../../../lib/google-provider";
import { providerSummary } from "../../../../lib/provider-secrets";

export async function GET(request: Request) {
  const [google, openai, deepl] = await Promise.all([testGoogleConnection(request), providerSummary(request, "openai"), providerSummary(request, "deepl")]);
  const translation = { ...deepl, metadata: { ...deepl.metadata, provider: "deepl", languages: ["de", "en"] } };
  return Response.json({
    google,
    openai,
    deepl: translation,
    translation,
    googleConfigured: google.configured,
    openaiConfigured: openai.state === "connected",
    deeplConfigured: deepl.state === "connected",
    translationConfigured: deepl.state === "connected",
    secretsExposed: false,
  }, { headers: { "Cache-Control": "no-store" } });
}
