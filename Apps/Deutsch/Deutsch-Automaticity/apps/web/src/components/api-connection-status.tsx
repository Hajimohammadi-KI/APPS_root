"use client";

import { useEffect, useState } from "react";

import {
  API_BASE_URL,
  API_HEALTH_URL,
  CONFIGURED_API_URL,
} from "@/lib/api-config";

import { usesDevicePractice } from "@/lib/api-origin";

type ConnectionState = "checking" | "connected" | "offline" | "device";

const statusCopy: Record<ConnectionState, string> = {
  device: "Üben auf diesem Gerät",
  checking: "Lokaler App-Dienst wird geprüft",
  connected: "Lokaler App-Dienst bereit",
  offline: "Lokaler App-Dienst nicht erreichbar",
};

export function ApiConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>("checking");
  const [retryRequest, setRetryRequest] = useState(0);

  useEffect(() => {
    if (usesDevicePractice(CONFIGURED_API_URL, window.location.hostname)) {
      setStatus("device");
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

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
  }, [retryRequest]);

  return (
    <button
      aria-label={
        status === "offline"
          ? "Lokalen App-Dienst erneut prüfen"
          : statusCopy[status]
      }
      aria-live="polite"
      className="hidden min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground lg:inline-flex"
      disabled={status === "checking" || status === "device"}
      onClick={() => {
        // Erneut prüfen, ohne die Seite und damit einen ungespeicherten
        // Lernschritt neu zu laden.
        setStatus("checking");
        setRetryRequest((request) => request + 1);
      }}
      title={
        status === "device"
          ? "Antworten werden auf diesem Gerät gespeichert. Der optionale Online-Prüfdienst ist nicht eingerichtet."
          : `${statusCopy[status]} · ${API_BASE_URL}`
      }
      type="button"
    >
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{
          backgroundColor:
            status === "connected"
              ? "#3d5a9e"
              : status === "offline"
                ? "#c05640"
                : "#a16207",
        }}
      />
      {statusCopy[status]}
    </button>
  );
}
