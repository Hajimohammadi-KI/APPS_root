"use client";

import { useCallback, useEffect, useState } from "react";
import { Languages, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  readTranslationStatus,
  type TranslationStatus,
} from "@/lib/desktop-deepl";

export function DeepLProviderSettings() {
  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await readTranslationStatus());
    } catch {
      setStatus({
        available: true,
        connected: false,
        provider: "google-translation",
        storage: null,
      });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <details className="rounded-xl border p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <Languages aria-hidden="true" className="size-4" />
        Google Übersetzung
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {status?.connected ? "Verbunden" : "Google-Freigabe erforderlich"}
        </span>
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Die Übersetzung verwendet dieselbe sichere Google-Verbindung wie Drive
          und Kalender. Deutsch, Englisch und Persisch werden unterstützt. Ein
          eigener Übersetzungsschlüssel oder ein zusätzliches Passwort ist nicht
          nötig.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              window.location.href = "http://127.0.0.1:4312/settings";
            }}
          >
            {status?.connected
              ? "Google-Verbindung verwalten"
              : "Google verbinden"}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void refresh()}
          >
            <RefreshCw aria-hidden="true" />
            {busy ? "Wird geprüft …" : "Verbindung prüfen"}
          </Button>
        </div>
      </div>
    </details>
  );
}
