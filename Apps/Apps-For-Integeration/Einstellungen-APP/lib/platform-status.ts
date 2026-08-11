export type PlatformStatusResponse = {
  api: {
    connected: boolean;
    mode: "nest" | "next-compat";
    service: "cross-repository-api" | "next-route-handlers";
    runtime: "bun" | "next";
    message: string;
  };
  database: {
    provider: "neon" | "local-d1";
    configured: boolean;
    reachable: boolean;
    message?: string;
  };
  checkedAt: string;
};

export type HealthResponse = {
  ok: true;
  service: "cross-repository-api";
  runtime: "bun";
  timestamp: string;
  database: PlatformStatusResponse["database"];
};
