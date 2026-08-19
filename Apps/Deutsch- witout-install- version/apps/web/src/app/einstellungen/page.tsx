import type { Route } from "next";
import { redirect } from "next/navigation";

export const metadata = { title: "Einstellungen" };
export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS_URL = "http://127.0.0.1:4323/settings?lang=de";

function settingsTarget(): URL | null {
  try {
    const target = new URL(
      process.env.NEXT_PUBLIC_SETTINGS_URL ?? DEFAULT_SETTINGS_URL,
    );
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return null;
    }
    return target;
  } catch {
    return null;
  }
}

async function settingsAvailable(target: URL): Promise<boolean> {
  try {
    const healthUrl = new URL("/api/platform/status", target);
    const response = await fetch(healthUrl, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function SettingsPage() {
  const target = settingsTarget();
  if (target && (await settingsAvailable(target))) {
    redirect(target.toString() as Route);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Einstellungen</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Die Einstellungen sind gerade nicht erreichbar
        </h1>
        <p className="text-muted-foreground">
          Deine Lerndaten bleiben auf diesem Gerät erhalten. Starte das
          Einstellungsmodul und prüfe diese Seite anschließend erneut.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <a
          className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground"
          href="/einstellungen"
        >
          Erneut prüfen
        </a>
        <a className="rounded-xl border px-4 py-2 font-medium" href="/">
          Zurück zur Startseite
        </a>
      </div>
      <details className="rounded-2xl border p-4 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          Hilfe für die lokale Einrichtung
        </summary>
        <p className="mt-3">
          Erwartete Adresse: {target?.origin ?? "ungültige Konfiguration"}. Die
          App wartet höchstens zwei Sekunden auf eine bestätigte Antwort und
          leitet niemals zu einem ungeprüften Dienst weiter.
        </p>
      </details>
    </section>
  );
}
