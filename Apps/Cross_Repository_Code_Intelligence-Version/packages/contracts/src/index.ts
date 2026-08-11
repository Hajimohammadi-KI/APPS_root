export type ProviderState = "not_configured" | "untested" | "connected" | "expired" | "quota_exhausted" | "error";

export type ProviderStatus = {
  configured: boolean;
  state: ProviderState;
  metadata?: Record<string, unknown>;
  testedAt?: string | null;
  message?: string;
};

export type ReaderConnectionStatus = {
  openai: boolean;
  deepl: boolean;
  googleClientId: string;
  providers: {
    openai: ProviderStatus;
    deepl: ProviderStatus;
  };
};

export type HealthResponse = {
  ok: true;
  service: "cross-repository-api";
  runtime: "bun";
  timestamp: string;
  database: {
    provider: "neon" | "local-d1";
    configured: boolean;
    reachable: boolean;
    message?: string;
  };
};

export type PlatformStatusResponse = {
  api: {
    connected: boolean;
    mode: "nest" | "next-compat";
    service: "cross-repository-api" | "next-route-handlers";
    runtime: "bun" | "next";
    message: string;
  };
  database: HealthResponse["database"];
  checkedAt: string;
};

export type CapabilityResponse = {
  apiVersion: "v1";
  database: "neon" | "not-configured";
  storage: "object-storage" | "not-configured";
  providers: { openai: boolean; deepl: boolean; google: boolean };
  compatibility: { legacyNextApi: true; legacyContentPreserved: true };
};
