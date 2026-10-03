import { NextResponse } from "next/server";
import type { HealthResponse, PlatformStatusResponse } from "../../../../lib/platform-status";

export const dynamic = "force-dynamic";

const DEVICE_ONLY_STORAGE = process.env.NEXT_PUBLIC_STORAGE_MODE === "device";

const COMPAT_DATABASE: PlatformStatusResponse["database"] = {
  provider: "local-d1",
  configured: false,
  reachable: true,
  message: DEVICE_ONLY_STORAGE
    ? "Einstellungen werden sicher in diesem Browser gespeichert. Cloud-Synchronisierung ist nicht aktiv."
    : "Lokaler Speicher ist aktiv. Ein optionaler NestJS-Dienst kann separat mit Bun laufen.",
};

export async function GET() {
  const checkedAt = new Date().toISOString();
  const apiUrl = process.env.API_INTERNAL_URL?.trim() || "http://127.0.0.1:4313/v1/health";

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(1800),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("nest_api_unavailable");
    const health = await response.json() as HealthResponse;
    const payload: PlatformStatusResponse = {
      api: {
        connected: true,
        mode: "nest",
        service: health.service,
        runtime: health.runtime,
        message: "NestJS API läuft mit Bun und ist mit den Einstellungen verbunden.",
      },
      database: health.database,
      checkedAt,
    };
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch {
    const payload: PlatformStatusResponse = {
      api: {
        connected: false,
        mode: "next-compat",
        service: "next-route-handlers",
        runtime: "next",
        message: DEVICE_ONLY_STORAGE
          ? "Gerätemodus: Die Einstellungen funktionieren ohne Anmeldung in diesem Browser."
          : "Die Einstellungen bleiben über die vorhandenen Next.js-APIs nutzbar; NestJS ist optional.",
      },
      database: COMPAT_DATABASE,
      checkedAt,
    };
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  }
}
