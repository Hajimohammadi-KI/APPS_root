"use client";

import * as React from "react";
import { Languages, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readTranslationStatus, type TranslationStatus } from "@/lib/desktop-deepl";

export function DeepLProviderSettings() {
  const [status, setStatus] = React.useState<TranslationStatus | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try { setStatus(await readTranslationStatus()); }
    catch { setStatus({ available: true, connected: false, provider: "google-translation", storage: null }); }
    finally { setBusy(false); }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  return (
    <details className="rounded-xl border p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <Languages aria-hidden className="size-4" />Google Translation
        <span className="ml-auto text-xs font-medium text-muted-foreground">{status?.connected ? "Connected" : "Google permission required"}</span>
      </summary>
      <div className="mt-4 grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">Translation uses the same secure Google connection as Drive and Calendar. It supports English, German, and Persian and does not require a separate translation password or API key.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild><a href="http://127.0.0.1:4312/settings">{status?.connected ? "Manage Google connection" : "Connect Google"}</a></Button>
          <Button variant="outline" disabled={busy} onClick={() => void refresh()}><RefreshCw aria-hidden className="size-4" />{busy ? "Checking..." : "Check connection"}</Button>
        </div>
      </div>
    </details>
  );
}
