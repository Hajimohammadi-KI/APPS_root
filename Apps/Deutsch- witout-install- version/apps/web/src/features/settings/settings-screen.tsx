"use client";

import { useState } from "react";
import { Download, Eye, Gauge, ShieldCheck } from "lucide-react";
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
  const { state, updateLearnerProfile, updateSettings } = useLearnerState();
  const [exportStatus, setExportStatus] = useState("");
  const { settings } = state;

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
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
          Lokal gespeichert
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
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-5 text-violet-700" />
              Lesen &amp; Fokus
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
              <div className="settings-options">
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
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-5 text-violet-700" />
              Praxis
            </CardTitle>
            <CardDescription>
              Umfang und Rückmeldungen für die tägliche Arbeit.
            </CardDescription>
          </CardHeader>
          <CardContent className="settings-controls">
            <fieldset>
              <legend>Tägliche Lernzeit</legend>
              <div className="settings-options settings-options-four">
                {([15, 30, 45, 60] as const).map((minutes) => (
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
            <Toggle
              checked={settings.timedChallenges}
              label="Zeitaufgaben erlauben"
              onChange={(timedChallenges) =>
                updateSettings({ timedChallenges })
              }
            />
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
            <Toggle
              checked={settings.spellingAffectsMastery}
              label="Rechtschreibung für Grammatik-Mastery verlangen"
              onChange={(spellingAffectsMastery) =>
                updateSettings({ spellingAffectsMastery })
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-700" />
            Datenschutz &amp; Sicherung
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
              <p
                aria-live="polite"
                className="shared-status-enter text-sm text-emerald-800"
                role="status"
              >
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
