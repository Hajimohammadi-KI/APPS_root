import { ExternalLink, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Vollversion v20.8" };

export default function ClassicApplicationPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Vollständige funktionale v20.8
            </h1>
            <Badge className="bg-sky-100 text-sky-800">
              <ShieldCheck data-icon="inline-start" />
              Original unverändert
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle bisherigen Übungen, Aufnahmen, Korrekturen, Wiederholungen und
            Einstellungen bleiben während der React-Migration verfügbar.
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={
            <a
              href="/legacy/index.html"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          In eigenem Tab öffnen
          <ExternalLink data-icon="inline-end" />
        </Button>
      </header>

      <iframe
        title="Deutsch Grammatik-Automatik v20.8"
        src="/legacy/index.html"
        allow="microphone"
        className="h-[calc(100vh-12rem)] min-h-[680px] w-full rounded-2xl border bg-white shadow-lg"
      />
    </div>
  );
}
