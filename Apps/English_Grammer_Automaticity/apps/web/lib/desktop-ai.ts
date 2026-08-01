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
  return window.studyAI?.status() ?? UNAVAILABLE;
}

export async function configureAIProvider(
  configuration: AIProviderConfiguration,
): Promise<AIProviderStatus> {
  if (!window.studyAI) {
    throw new Error(
      "AI accounts can be connected securely in the installed Windows app.",
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
      "No secure desktop AI connection is available. The offline explanation remains usable.",
    );
  }
  return window.studyAI.explain(request);
}
