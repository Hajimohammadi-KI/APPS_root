import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Wie DeutschFlow Lerndaten lokal speichert und optionale Online-Auswertung verarbeitet.",
  title: "Datenschutz",
};

const updated = "1. August 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <div className="mb-8">
        <Link className="text-sm text-primary hover:underline" href="/">
          ← Zurück zur Lern-App
        </Link>
      </div>

      <header className="mb-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
          Klarer, lokaler Datenschutz
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Datenschutz
        </h1>
        <p className="mt-3 text-muted-foreground">
          DeutschFlow ist so aufgebaut, dass der vollständige Lernkatalog und
          die meisten Lerndaten auf deinem Gerät bleiben.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Zuletzt aktualisiert: {updated}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Daten auf deinem Gerät</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fortschritt, Einstellungen, Antworten, Fehlerhistorie,
            Wiederholungsstatus und lokal aufgenommene Audiodateien werden im
            Browser-Speicher oder in IndexedDB gespeichert. In dieser Version
            gibt es keine Kontosynchronisierung. Das Löschen von App- oder
            Website-Daten kann diese Inhalte entfernen.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Online-Auswertung</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wenn du eine Auswertung aktiv startest, werden Antworttext und
            ausgewählte Variante per HTTPS an den NestJS-Dienst gesendet. Von
            dort gehen die Daten zu LanguageTool für Rechtschreibung und
            Grammatikprüfung und kommen als Korrekturergebnis zurück.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Mikrofon und Sprache</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mikrofonzugriff wird nur angefragt, wenn du Aufnahme oder
            Spracherkennung aktiv startest. Gespeicherte Aufnahmen bleiben
            lokal. Browser-Spracherkennung kann unter den Datenschutzregeln des
            jeweiligen Browser- oder Betriebssystem-Anbieters laufen.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Tracking und Werbung</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Diese Version enthält keine Lernkonten, kein Werbe-SDK, keinen
            Verkauf personenbezogener Daten und kein Cross-App-Tracking.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Deine Kontrolle</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            In den Einstellungen findest du Export, Import und Reset. Du kannst
            Mikrofonzugriff verweigern, offline lernen und lokale Daten direkt
            in der App oder in den Geräteeinstellungen entfernen.
          </p>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Fragen und Support</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Weil diese Version keine serverseitigen Lernkonten erstellt, werden
            lokale Lerndaten direkt auf deinem Gerät verwaltet.
          </p>
          <Link
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
            href="/support"
          >
            Installations- und Supporthilfe öffnen →
          </Link>
        </section>
      </div>
    </main>
  );
}
