import type { Metadata } from "next";
import Link from "next/link";

import { feedbackAddress } from "@automaticity/learning-core/feedback";

import { PageHeader } from "@/components/page-header";
import { SectionBox } from "@/components/ui/section-box";

export const metadata: Metadata = {
  description:
    "Wie DeutschFlow Lerndaten lokal speichert und optionale Online-Auswertung verarbeitet.",
  title: "Datenschutz",
};

const updated = "1. August 2026";

export default function PrivacyPage() {
  const contact = feedbackAddress();
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

        <SectionBox title="Kommentare zu einer geprüften Antwort">
          Unter einer geprüften schriftlichen Antwort kannst du einen Kommentar
          senden, etwa dass du deine Antwort für richtig hältst. Erst nachdem du
          die Vorschau jedes Mal bestätigst, sendet die App genau diese
          Vorschau: Aufgabe, gespeicherte Antworten, deine Antwort, die Prüfung
          der App, den gewählten Grund und deinen Kommentar. Name, Profil,
          andere Antworten, Aufnahmen und Verlauf werden nicht gesendet. Der
          Kommentar wird als Issue in einem privaten GitHub-Repository (GitHub,
          USA) gespeichert, das nur die Verantwortlichen der App lesen, und
          dient zur Prüfung von Antworten und zur Verbesserung der Aufgaben. Ein
          Kommentar ändert dein Ergebnis nie von selbst; wird deine Antwort als
          richtig angenommen oder eine falsche Form erklärt, kann diese Form
          ohne Bezug zu dir Teil der Aufgabe werden. Dein Browser speichert eine
          Quittung unter „Meine Kommentare“; dort kannst du den Status und die
          Antwort lesen oder den Kommentar zurückziehen. Dabei werden dein Text
          und die Antwort gelöscht; nur ein geschlossener Eintrag mit der
          Aufgabennummer und dem gewählten Grund bleibt.
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
              href={contact ? "/support#contact" : "/support"}
            >
              {contact
                ? "Kontakt aufnehmen →"
                : "Installations- und Supporthilfe öffnen →"}
            </Link>
          }
          title="Fragen und Support"
        >
          Weil diese Version keine serverseitigen Lernkonten erstellt, werden
          lokale Lerndaten direkt auf deinem Gerät verwaltet.
          {contact
            ? ` Für Fragen oder Feedback schreibe an ${contact}. Feedback erreicht uns als gewöhnliche E-Mail mit deiner Adresse und Nachricht; es wird nur zum Antworten und zur Verbesserung der Apps genutzt und auf Wunsch gelöscht.`
            : null}
        </SectionBox>
      </div>
    </main>
  );
}
