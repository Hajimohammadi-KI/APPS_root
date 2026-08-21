"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  Gauge,
  MonitorDown,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { buildLearningDataExport } from "@automaticity/learning-core";
import type { LearnerSettings } from "@grammar/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

const TEXT_SIZES: readonly {
  value: LearnerSettings["textScale"];
  label: string;
  hint: string;
}[] = [
  { value: 100, label: "100 %", hint: "Standardgröße" },
  { value: 112, label: "112 %", hint: "Leichter zu verfolgen" },
  { value: 125, label: "125 %", hint: "Größte Darstellung" },
];

export function SettingsScreen() {
  const { state, hydrated, updateLearnerProfile, updateSettings } =
    useLearnerState();
  const [exportStatus, setExportStatus] = useState("");
  const { settings } = state;

  if (!hydrated) {
    return (
      <div
        aria-busy="true"
        className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-7"
      >
        <h1 className="text-3xl font-black tracking-tight">Einstellungen</h1>
        <p className="mt-2 text-muted-foreground">
          Deine lokalen Einstellungen werden geladen …
        </p>
      </div>
    );
  }

  function exportData() {
    // Export the normalized evidence ledger alongside the legacy learner state.
    // Otherwise versioned responses, evidence, and events are silently omitted.
    const exportEnvelope = buildLearningDataExport({
      language: "de",
      exportedAt: new Date().toISOString(),
      learnerState: state,
      storage: window.localStorage,
    });
    const blob = new Blob([JSON.stringify(exportEnvelope, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `DeutschFlow-Lerndaten-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportStatus("Die lokale Sicherungsdatei wurde heruntergeladen.");
  }

  return (
    <div className="settings-page space-y-5">
      <header className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50/70 to-sky-50/70 p-5 shadow-sm sm:p-7">
        <Badge className="bg-violet-100 text-violet-800">
          Lokal und automatisch gespeichert
        </Badge>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Einstellungen
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Lesen, Fokus, Übungsumfang, Datenschutz und Sicherung funktionieren
          direkt in der Web-App – ohne separates Einstellungsmodul.
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="flex items-center gap-2">
                <Eye className="size-5 text-violet-700" />
                Lesen &amp; Fokus
              </h2>
            </CardTitle>
            <CardDescription>
              Darstellung und Reizniveau gelten sofort auf diesem Gerät.
            </CardDescription>
          </CardHeader>
          <CardContent className="settings-controls">
            <fieldset>
              <legend>Lesestil</legend>
              <div className="settings-options">
                <Choice
                  checked={settings.readingProfile === "standard"}
                  label="Standard"
                  name="reading-profile"
                  onChange={() =>
                    updateSettings({ readingProfile: "standard" })
                  }
                />
                <Choice
                  checked={settings.readingProfile === "dyslexia"}
                  label="Dyslexiefreundlich"
                  name="reading-profile"
                  onChange={() =>
                    updateSettings({ readingProfile: "dyslexia" })
                  }
                />
              </div>
            </fieldset>
            <fieldset>
              <legend>Textgröße</legend>
              <div className="settings-options settings-options-three">
                {TEXT_SIZES.map((option) => (
                  <Choice
                    checked={settings.textScale === option.value}
                    hint={option.hint}
                    key={option.value}
                    label={option.label}
                    name="text-scale"
                    onChange={() => updateSettings({ textScale: option.value })}
                  />
                ))}
              </div>
            </fieldset>
            <Toggle
              checked={settings.readingRuler}
              label="Leselineal auf Seiten anzeigen"
              onChange={(readingRuler) => updateSettings({ readingRuler })}
            />
            <Toggle
              checked={settings.lowStimulation}
              label="Bewegung und visuelle Intensität reduzieren"
              onChange={(lowStimulation) => updateSettings({ lowStimulation })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="flex items-center gap-2">
                <Gauge className="size-5 text-violet-700" />
                Tägliche Praxis
              </h2>
            </CardTitle>
            <CardDescription>
              Umfang und Qualitätsgrenzen für Sprechen und Schreiben.
            </CardDescription>
          </CardHeader>
          <CardContent className="settings-controls">
            <fieldset>
              <legend>Tägliche Lernzeit</legend>
              <div className="settings-options settings-options-three">
                {([15, 30, 45] as const).map((minutes) => (
                  <Choice
                    checked={settings.dailyStudyMinutes === minutes}
                    key={minutes}
                    label={`${minutes} Min.`}
                    name="daily-minutes"
                    onChange={() =>
                      updateSettings({ dailyStudyMinutes: minutes })
                    }
                  />
                ))}
              </div>
            </fieldset>
            <label className="settings-number">
              <span>
                <strong>Mindestwörter pro Gesprächsantwort</strong>
                <small>
                  Zu kurze Antworten werden nicht als Produktionsnachweis
                  ausgewertet.
                </small>
              </span>
              <input
                aria-label="Mindestwörter pro Gesprächsantwort"
                max={100}
                min={5}
                onChange={(event) =>
                  updateSettings({
                    minWords: Math.min(
                      100,
                      Math.max(5, Number(event.target.value) || 5),
                    ),
                  })
                }
                type="number"
                value={settings.minWords}
              />
            </label>
            <Toggle
              checked={settings.movementBreaks}
              label="Bewegungspausen erinnern"
              onChange={(movementBreaks) => updateSettings({ movementBreaks })}
            />
            <Toggle
              checked={settings.saveAudio}
              label="Eigene Aufnahmen lokal speichern"
              onChange={(saveAudio) => updateSettings({ saveAudio })}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <MonitorDown className="size-5 text-violet-700" />
              Auf deinem Gerät installieren
            </h2>
          </CardTitle>
          <CardDescription>
            Die Web-App läuft ohne Installation. Optional kannst du sie wie eine
            App auf dem Startbildschirm ablegen.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-installation">
          <InstallAppButton surface="settings" />
          <div className="settings-device-grid">
            <article>
              <MonitorDown aria-hidden="true" />
              <h3>Windows</h3>
              <p>Im Browser „App installieren“ wählen.</p>
            </article>
            <article>
              <Smartphone aria-hidden="true" />
              <h3>Android</h3>
              <p>Im Browsermenü „Zum Startbildschirm hinzufügen“ wählen.</p>
            </article>
            <article>
              <Smartphone aria-hidden="true" />
              <h3>iPhone &amp; iPad</h3>
              <p>Safari öffnen, Teilen und „Zum Home-Bildschirm“ wählen.</p>
            </article>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-700" />
              Datenschutz &amp; Sicherung
            </h2>
          </CardTitle>
          <CardDescription>
            Online-KI bleibt optional. Der Export enthält die aktuell lokal
            gespeicherten Lerndaten.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-controls">
          <Toggle
            checked={state.learner.allowOnlineAI}
            label="Online-KI für ausdrücklich gestartete Rückmeldungen erlauben"
            onChange={(allowOnlineAI) =>
              updateLearnerProfile({ allowOnlineAI })
            }
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={exportData}>
              <Download />
              Lerndaten exportieren
            </Button>
            {exportStatus ? (
              <p aria-live="polite" className="text-sm text-emerald-800">
                {exportStatus}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Choice({
  checked,
  hint,
  label,
  name,
  onChange,
}: {
  checked: boolean;
  hint?: string;
  label: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <label className="settings-choice">
      <input checked={checked} name={name} onChange={onChange} type="radio" />
      <span>
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
      </span>
    </label>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}
