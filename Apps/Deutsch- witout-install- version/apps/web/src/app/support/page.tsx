import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Installations-, Offline-, Backup- und Auswertungshilfe für DeutschFlow.",
  title: "Support",
};

export default function SupportPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <div className="mb-8">
        <Link className="text-sm text-primary hover:underline" href="/">
          ← Zurück zur Lern-App
        </Link>
      </div>

      <header className="mb-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          Einmal installieren, überall lernen
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Installation und Support
        </h1>
        <p className="mt-3 text-muted-foreground">
          Dasselbe vollständige Lernsystem steht für Windows, Android, iPhone
          und iPad bereit.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Windows</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nutze das Setup aus dem Download-Bereich oder öffne die sichere
            Webadresse in Edge und wähle "App installieren".
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Android</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nutze die Android-App nach Veröffentlichung oder installiere die APK
            für direkte Tests.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">iPhone und iPad</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nutze App Store oder TestFlight. Die Webversion kann zusätzlich in
            Safari über "Teilen → Zum Home-Bildschirm" installiert werden.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Offline-Nutzung</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Öffne die App nach jedem Update einmal online. Katalog, Übungen,
            Fortschritt und Einstellungen funktionieren lokal.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Fortschritt sichern</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nutze "Einstellungen → Daten exportieren", bevor du Gerät wechselst,
            deinstallierst oder Browserdaten löschst.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Auswertungsprobleme</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prüfe den API-Status in den Einstellungen. Wenn der Dienst nicht
            erreichbar ist, Internetverbindung prüfen und erneut versuchen.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            href="/privacy"
          >
            Datenschutzhinweis lesen →
          </Link>
        </section>
      </div>
    </main>
  );
}
