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
  return window.studyAI?.status() ?? UNAVAILABLE;
}

export async function configureAIProvider(
  configuration: AIProviderConfiguration,
): Promise<AIProviderStatus> {
  if (!window.studyAI) {
    throw new Error(
      "KI-Konten können sicher in der installierten Windows-App verbunden werden.",
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
  if (!window.studyAI) {
    throw new Error(
      "Keine sichere Desktop-KI-Verbindung verfügbar. Die Offline-Erklärung bleibt nutzbar.",
    );
  }
  return window.studyAI.explain(request);
}
