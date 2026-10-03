export type AIProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "openai-compatible";

export interface AIProviderStatus {
  available: boolean;
  connected: boolean;
  provider: AIProviderId | null;
  providerLabel: string | null;
  model: string | null;
  storage: string | null;
}

export interface AIProviderConfiguration {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIExplanationRequest {
  topic: string;
  content: string;
  learnerInput?: string;
  language: string;
  purpose?: "explanation" | "follow-up";
}

export interface AIExplanationResponse {
  text: string;
  provider: AIProviderId;
  providerLabel: string;
  model: string;
}

interface DesktopAIBridge {
  status(): Promise<AIProviderStatus>;
  configure(
    configuration: AIProviderConfiguration,
  ): Promise<AIProviderStatus>;
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
      "Open Central Settings to save the API key once, or use the installed Windows app.",
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
    | AIExplanationResponse
    | { message?: string };
  if (!response.ok || !("text" in data)) {
    throw new Error(
      "message" in data && data.message
        ? data.message
        : "The central AI connection is not available.",
    );
  }
  return data;
}
