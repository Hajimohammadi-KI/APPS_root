"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, API_HEALTH_URL } from "@/lib/api-config";

type ConnectionState = "checking" | "connected" | "offline";

const statusCopy: Record<ConnectionState, string> = {
  checking: "Lokaler App-Dienst wird geprüft",
  connected: "Lokaler App-Dienst bereit",
  offline: "Lokaler App-Dienst nicht erreichbar",
};

function isLoopbackHost(hostname: string) {
  return (
    hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1"
  );
}

export function ApiConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>("checking");

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!isLoopbackHost(window.location.hostname)) {
      setStatus("offline");
      return () => {
        active = false;
      };
    }

    async function checkConnection() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetch(API_HEALTH_URL, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (active) setStatus(response.ok ? "connected" : "offline");
      } catch {
        if (active) setStatus("offline");
      } finally {
        clearTimeout(timeout);
        if (active) timer = setTimeout(checkConnection, 30_000);
      }
    }

    void checkConnection();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <span
      aria-live="polite"
      className="hidden min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground lg:inline-flex"
      title={`${statusCopy[status]} · Bestätigt nur den lokalen API-Dienst, nicht KI- oder Übersetzungsanbieter. · ${API_BASE_URL}`}
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{
          backgroundColor:
            status === "connected"
              ? "#15803d"
              : status === "offline"
                ? "#b91c1c"
                : "#a16207",
        }}
      />
      {statusCopy[status]}
    </span>
  );
}
