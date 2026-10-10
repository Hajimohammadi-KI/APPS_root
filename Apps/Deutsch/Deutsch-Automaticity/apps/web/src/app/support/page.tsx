import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SectionBox } from "@/components/ui/section-box";

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

      <PageHeader
        description="Öffne diese Web-App auf Handy, Tablet oder Computer. Dein Fortschritt wird in jedem Browser auf jedem Gerät separat gespeichert."
        framed
        kicker="Einmal installieren, überall lernen"
        title="Installation und Support"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionBox title="Windows">
          Öffne diese Web-App in Edge und wähle im Browsermenü "App
          installieren", wenn angeboten.
        </SectionBox>

        <SectionBox title="Android">
          Öffne diese Web-App in Chrome. Wähle im Browsermenü "Zum
          Startbildschirm hinzufügen" oder "App installieren", wenn angeboten.
        </SectionBox>

        <SectionBox title="iPhone und iPad">
          Öffne diese Web-App in Safari und wähle "Teilen → Zum
          Home-Bildschirm".
        </SectionBox>

        <SectionBox title="Offline-Nutzung">
          Öffne die App nach jedem Update einmal online. Katalog, Übungen,
          Fortschritt und Einstellungen funktionieren lokal.
        </SectionBox>

        <SectionBox title="Fortschritt sichern">
          Nutze "Einstellungen → Daten exportieren", bevor du Gerät wechselst,
          deinstallierst oder Browserdaten löschst.
        </SectionBox>

        <SectionBox
          footer={
            <Link
              className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
              href="/privacy"
            >
              Datenschutzhinweis lesen →
            </Link>
          }
          title="Auswertungsprobleme"
        >
          Die öffentliche Web-App ermöglicht Übungen auf diesem Gerät.
          Online-Auswertungen benötigen einen separat eingerichteten Dienst.
        </SectionBox>
      </div>
    </main>
  );
}
