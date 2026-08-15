import { getProviderSecretForRequest, providerSummary } from "../../../lib/provider-secrets";
import type { ProviderStatus, ReaderConnectionStatus } from "@cross-repo/contracts";

export async function GET(request: Request) {
  const [openai, googleConfig, openaiStatus, deeplStatus] = await Promise.all([
    getProviderSecretForRequest<{ apiKey?: string }>(request, "openai"),
    getProviderSecretForRequest<{ clientId?: string }>(request, "google"),
    providerSummary(request, "openai"),
    providerSummary(request, "deepl"),
  ]);
  const translationStatus: ProviderStatus = { ...deeplStatus, metadata: { ...deeplStatus.metadata, provider: "deepl", languages: ["de", "en"] } };
  const status: ReaderConnectionStatus = {
    openai: Boolean(process.env.OPENAI_API_KEY || (openai?.apiKey && openaiStatus.state === "connected")),
    deepl: deeplStatus.state === "connected",
    googleClientId: googleConfig?.clientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    providers: { openai: openaiStatus, deepl: translationStatus },
  };
  return Response.json({ ...status, translation: deeplStatus.state === "connected", translationProvider: "deepl" }, { headers: { "Cache-Control": "no-store" } });
}
