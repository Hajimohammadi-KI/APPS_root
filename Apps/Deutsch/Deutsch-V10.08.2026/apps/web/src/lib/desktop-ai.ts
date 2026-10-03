export type AIProviderId =
  "openai" | "anthropic" | "gemini" | "openai-compatible";

export interface AIProviderStatus {
  readonly available: boolean;
  readonly connected: boolean;
  readonly provider: AIProviderId | null;
  readonly providerLabel: string | null;
  readonly model: string | null;
  readonly storage: string | null;
}

export interface AIProviderConfiguration {
  readonly provider: AIProviderId;
  readonly apiKey: string;
  readonly model: string;
  readonly baseUrl?: string;
}

export interface AIExplanationRequest {
  readonly topic: string;
  readonly content: string;
  readonly learnerInput?: string;
  readonly language: string;
  readonly purpose?: "explanation" | "follow-up";
}

export interface AIExplanationResponse {
  readonly text: string;
  readonly provider: AIProviderId;
  readonly providerLabel: string;
  readonly model: string;
}

interface DesktopAIBridge {
  status(): Promise<AIProviderStatus>;
  configure(configuration: AIProviderConfiguration): Promise<AIProviderStatus>;
  disconnect(): Promise<AIProviderStatus>;
  explain(request: AIExplanationRequest): Promise<AIExplanationResponse>;
}

declare global {
  interface Window {
    studyAI?: DesktopAIBridge;
  }
}

const UNAVAILABLE: AIProviderStatus = {
  available: false,
  connected: false,
  provider: null,
  providerLabel: null,
  model: null,
  storage: null,
};

export async function readAIProviderStatus(): Promise<AIProviderStatus> {
  if (window.studyAI) return window.studyAI.status();
  try {
    const response = await fetch("/api/ai", { cache: "no-store" });
    if (!response.ok) return UNAVAILABLE;
    return (await response.json()) as AIProviderStatus;
  } catch {
    return UNAVAILABLE;
  }
}

export async function configureAIProvider(
  configuration: AIProviderConfiguration,
): Promise<AIProviderStatus> {
  if (!window.studyAI) {
    throw new Error(
      "Öffne die zentralen Einstellungen, um den API-Schlüssel einmalig zu speichern, oder verwende die installierte Windows-App.",
    );
  }
  return window.studyAI.configure(configuration);
}

export async function disconnectAIProvider(): Promise<AIProviderStatus> {
  if (!window.studyAI) return UNAVAILABLE;
  return window.studyAI.disconnect();
}

export async function requestAIExplanation(
  request: AIExplanationRequest,
): Promise<AIExplanationResponse> {
  if (window.studyAI) return window.studyAI.explain(request);
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const data = (await response.json().catch(() => ({}))) as
    AIExplanationResponse | { message?: string };
  if (!response.ok || !("text" in data)) {
    throw new Error(
      "message" in data && data.message
        ? data.message
        : "Die zentrale KI-Verbindung ist nicht verfügbar.",
    );
  }
  return data;
}
