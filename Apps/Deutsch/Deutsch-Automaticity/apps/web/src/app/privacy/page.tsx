import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SectionBox } from "@/components/ui/section-box";

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

      <PageHeader
        description="DeutschFlow ist so aufgebaut, dass der vollständige Lernkatalog und die meisten Lerndaten auf deinem Gerät bleiben."
        framed
        kicker="Klarer, lokaler Datenschutz"
        title="Datenschutz"
      >
        <p className="mt-2 text-sm text-muted-foreground">
          Zuletzt aktualisiert: {updated}
        </p>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionBox title="Daten auf deinem Gerät">
          Fortschritt, Einstellungen, Antworten, Fehlerhistorie,
          Wiederholungsstatus und lokal aufgenommene Audiodateien werden im
          Browser-Speicher oder in IndexedDB gespeichert. In dieser Version gibt
          es keine Kontosynchronisierung. Das Löschen von App- oder
          Website-Daten kann diese Inhalte entfernen.
        </SectionBox>

        <SectionBox title="Online-Auswertung">
          Wenn du eine Auswertung aktiv startest, werden Antworttext und
          ausgewählte Variante per HTTPS an den NestJS-Dienst gesendet. Von dort
          gehen die Daten zu LanguageTool für Rechtschreibung und
          Grammatikprüfung und kommen als Korrekturergebnis zurück.
        </SectionBox>

        <SectionBox title="Mikrofon und Sprache">
          Mikrofonzugriff wird nur angefragt, wenn du Aufnahme oder
          Spracherkennung aktiv startest. Gespeicherte Aufnahmen bleiben lokal.
          Browser-Spracherkennung kann unter den Datenschutzregeln des
          jeweiligen Browser- oder Betriebssystem-Anbieters laufen.
        </SectionBox>

        <SectionBox title="Tracking und Werbung">
          Diese Version enthält keine Lernkonten, kein Werbe-SDK, keinen Verkauf
          personenbezogener Daten und kein Cross-App-Tracking.
        </SectionBox>

        <SectionBox title="Deine Kontrolle">
          In den Einstellungen findest du Export, Import und Reset. Du kannst
          Mikrofonzugriff verweigern, offline lernen und lokale Daten direkt in
          der App oder in den Geräteeinstellungen entfernen.
        </SectionBox>

        <SectionBox
          footer={
            <Link
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              href="/support"
            >
              Installations- und Supporthilfe öffnen →
            </Link>
          }
          title="Fragen und Support"
        >
          Weil diese Version keine serverseitigen Lernkonten erstellt, werden
          lokale Lerndaten direkt auf deinem Gerät verwaltet.
        </SectionBox>
      </div>
    </main>
  );
}
