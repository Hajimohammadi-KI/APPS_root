export interface TranslationStatus {
  available: boolean;
  connected: boolean;
  provider: "google-translation";
  storage: "central-google-oauth" | null;
}

export interface TranslationRequest {
  text: string;
  source?: string;
  target: string;
}

export interface TranslationResponse {
  translation: string;
  detectedSource?: string;
  provider: "google-translation";
}

async function request<T>(init?: RequestInit): Promise<T> {
  const response = await fetch("/api/deepl", { ...init, cache: "no-store" });
  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(data.message || "Google Translation could not process the request.");
  return data;
}

export function readTranslationStatus(): Promise<TranslationStatus> {
  return request<TranslationStatus>();
}

export function translateWithGoogle(requestBody: TranslationRequest): Promise<TranslationResponse> {
  return request<TranslationResponse>({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
}
