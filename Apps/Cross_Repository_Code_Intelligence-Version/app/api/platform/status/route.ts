import { NextResponse } from "next/server";
import type { HealthResponse, PlatformStatusResponse } from "@cross-repo/contracts";

export const dynamic = "force-dynamic";

const DEVICE_ONLY_STORAGE = process.env.NEXT_PUBLIC_STORAGE_MODE === "device";

const COMPAT_DATABASE: PlatformStatusResponse["database"] = {
  provider: "local-d1",
  configured: false,
  reachable: true,
  message: DEVICE_ONLY_STORAGE
    ? "Fortschritt, Einstellungen und Lesedaten werden in diesem Browser gespeichert. Cloud-Synchronisierung ist nicht aktiv."
    : "Lokaler Speicher ist aktiv. Der NestJS-Dienst startet separat mit Bun.",
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
        message: "NestJS API läuft mit Bun und ist mit der Web-App verbunden.",
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
          ? "Vercel-Webmodus: Die Kernfunktionen arbeiten ohne Anmeldung direkt in diesem Browser."
          : "Die App bleibt über die vorhandenen Next.js-APIs nutzbar; der NestJS-Dienst ist noch nicht gestartet.",
      },
      database: COMPAT_DATABASE,
      checkedAt,
    };
    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  }
}
