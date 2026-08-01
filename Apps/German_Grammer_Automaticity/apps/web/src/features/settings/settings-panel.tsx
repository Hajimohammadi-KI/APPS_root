"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  Database,
  Download,
  GraduationCap,
  HardDrive,
  LockKeyhole,
  Languages,
  Monitor,
  RefreshCcw,
  RefreshCw,
  Save,
  Share2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Unplug,
  Wifi,
} from "lucide-react";

import { grammarUnits } from "@grammar/content";
import { CEFR_LEVELS, LEGACY_STORAGE_KEY } from "@grammar/domain";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ProfileAvatar } from "@/components/profile-avatar";
import {
  buildGermanEvidence,
  useLearnerState,
} from "@/features/learner-state/learner-state-provider";
import { InstallAppButton } from "@/features/pwa/install-app-button";
import { usePwa } from "@/features/pwa/pwa-provider";
import {
  connectDesktopCalendar,
  disconnectDesktopCalendar,
  readDesktopCalendarStatus,
  syncDesktopCalendar,
  type DesktopCalendarStatus,
} from "@/lib/desktop-calendar";
import { cn } from "@/lib/utils";
import {
  portableLearnerProfile,
  replaceLearnerProfile,
} from "@/lib/learner-profile";
import { profilePhotoFromFile } from "@/lib/profile-photo";
import { PlacementCheck } from "@/features/settings/placement-check";
import { AIProviderSettings } from "@/features/settings/ai-provider-settings";

interface StorageSummary {
  readonly usage: number | undefined;
  readonly quota: number | undefined;
  readonly persisted: boolean;
}

function formatBytes(bytes?: number): string {
  if (!bytes) {
    return "0 MB";
  }
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function SettingsPanel() {
  const {
    state,
    hydrated,
    updateSettings,
    updateLearnerProfile,
    updateOutcomeEvidence,
    importState,
    resetState,
  } = useLearnerState();
  const { platform, installed, canPrompt, serviceWorkerReady } = usePwa();
  const [minWords, setMinWords] = useState(state.settings.minWords);
  const [saveAudio, setSaveAudio] = useState(state.settings.saveAudio);
  const [settingsReady, setSettingsReady] = useState(false);
  const [status, setStatus] = useState("");
  const [calendar, setCalendar] = useState<DesktopCalendarStatus | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState("");
  const [storage, setStorage] = useState<StorageSummary>({
    usage: undefined,
    quota: undefined,
    persisted: false,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const timer = window.setTimeout(() => {
      setMinWords(state.settings.minWords);
      setSaveAudio(state.settings.saveAudio);
      setSettingsReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, state.settings]);

  useEffect(() => {
    let cancelled = false;
    async function readStorage() {
      if (!navigator.storage) {
        return;
      }
      const [estimate, persisted] = await Promise.all([
        navigator.storage.estimate(),
        navigator.storage.persisted?.() ?? false,
      ]);
      if (!cancelled) {
        setStorage({
          usage: estimate.usage,
          quota: estimate.quota,
          persisted,
        });
      }
    }
    void readStorage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    readDesktopCalendarStatus()
      .then(setCalendar)
      .catch((error: unknown) =>
        setCalendarMessage(
          error instanceof Error
            ? error.message
            : "Kalenderstatus nicht verfügbar.",
        ),
      );
  }, []);

  async function connectCalendar() {
    setCalendarBusy(true);
    setCalendarMessage("Google-Autorisierung wird geöffnet …");
    try {
      const next = await connectDesktopCalendar();
      setCalendar(next);
      const result = await syncDesktopCalendar(state);
      setCalendarMessage(
        `Verbunden als ${next.email}. ${result.total} Lerntermin(e) synchronisiert.`,
      );
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Google Kalender konnte nicht verbunden werden.",
      );
    } finally {
      setCalendarBusy(false);
    }
  }

  async function syncCalendar() {
    setCalendarBusy(true);
    try {
      const result = await syncDesktopCalendar(state);
      setCalendar((current) =>
        current ? { ...current, lastSyncAt: result.syncedAt } : current,
      );
      setCalendarMessage(
        `${result.total} Lerntermin(e) ohne Duplikate synchronisiert.`,
      );
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Kalender-Synchronisierung fehlgeschlagen.",
      );
    } finally {
      setCalendarBusy(false);
    }
  }

  async function disconnectCalendar() {
    if (!window.confirm("Google Kalender von dieser App trennen?")) {
      return;
    }
    setCalendarBusy(true);
    try {
      setCalendar(await disconnectDesktopCalendar());
      setCalendarMessage("Google Kalender wurde getrennt.");
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Google Kalender konnte nicht getrennt werden.",
      );
    } finally {
      setCalendarBusy(false);
    }
  }

  function saveSettings() {
    const nextMinWords = Math.min(200, Math.max(5, Number(minWords) || 12));
    updateSettings({
      minWords: nextMinWords,
      saveAudio,
    });
    setMinWords(nextMinWords);
    setStatus("Einstellungen gespeichert.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "grammar-automaticity-backup.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Sicherungsdatei exportiert.");
  }

  async function exportProfile() {
    try {
      const profile = await portableLearnerProfile();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(profile, null, 2)], {
          type: "application/json",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "study-suite-learner-profile.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Gemeinsames Lernprofil exportiert.");
    } catch (error) {
      setStatus(
        `Profil-Export fehlgeschlagen: ${
          error instanceof Error ? error.message : "Unbekannter Fehler"
        }`,
      );
    }
  }

  async function importData(file?: File) {
    if (!file) {
      return;
    }
    try {
      importState(JSON.parse(await file.text()));
      setStatus("Sicherung importiert. Bestehende Lerndaten wurden ersetzt.");
    } catch (error) {
      setStatus(
        `Import fehlgeschlagen: ${
          error instanceof Error ? error.message : "Ungültige JSON-Datei"
        }`,
      );
    }
  }

  function clearLearnerData() {
    if (
      window.confirm(
        "Wirklich alle Fortschritte, Sitzungen, Fehler und Einstellungen zurücksetzen? Audioaufnahmen in IndexedDB bleiben erhalten.",
      )
    ) {
      resetState();
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setStatus("Lerndaten wurden zurückgesetzt.");
    }
  }
  const evidence = buildGermanEvidence(state);
  const levelGates = CEFR_LEVELS.map((level) => {
    const levelTitles = grammarUnits
      .filter((unit) => unit.level === level)
      .map((unit) => unit.title);
    const titleSet = new Set(levelTitles);
    const automaticCount = levelTitles.filter(
      (title) => state.mastery[title]?.status === "automatic",
    ).length;
    const activeCriticalErrors = state.errors.filter(
      (error) =>
        titleSet.has(error.topic) &&
        error.critical &&
        error.repairStatus !== "fixed",
    ).length;
    const successful = state.attempts.filter(
      (attempt) =>
        titleSet.has(attempt.topic) &&
        attempt.verified === true &&
        attempt.targetHit &&
        attempt.accuracyScore >= 80,
    );
    const speaking = successful.filter(
      (attempt) => attempt.mode === "speaking",
    ).length;
    const writing = successful.filter(
      (attempt) => attempt.mode === "writing",
    ).length;
    const transfer = successful.filter(
      (attempt) => attempt.mode === "transfer",
    ).length;
    const minimumSamples = Math.max(6, Math.ceil(levelTitles.length * 0.5));

    return {
      level,
      ready:
        automaticCount === levelTitles.length &&
        activeCriticalErrors === 0 &&
        speaking >= minimumSamples &&
        writing >= minimumSamples &&
        transfer >= minimumSamples,
      requirements: [
        {
          key: "automatic",
          label: `Automatisierte Themen ${automaticCount}/${levelTitles.length}`,
          done: automaticCount === levelTitles.length,
          actionLabel: "Grammatik öffnen",
          href: "/grammatik",
        },
        {
          key: "errors",
          label: `Aktive kritische Fehler ${activeCriticalErrors}`,
          done: activeCriticalErrors === 0,
          actionLabel: "Fehlertraining öffnen",
          href: "/fehler",
        },
        {
          key: "speaking",
          label: `Sprech-Nachweise ${speaking}/${minimumSamples}`,
          done: speaking >= minimumSamples,
          actionLabel: "Studio öffnen",
          href: "/studio",
        },
        {
          key: "writing",
          label: `Schreib-Nachweise ${writing}/${minimumSamples}`,
          done: writing >= minimumSamples,
          actionLabel: "Heutigen Pfad öffnen",
          href: "/heute",
        },
        {
          key: "transfer",
          label: `Transfer-Nachweise ${transfer}/${minimumSamples}`,
          done: transfer >= minimumSamples,
          actionLabel: "Heutigen Pfad öffnen",
          href: "/heute",
        },
      ] as const,
    };
  });
  const activeGate =
    levelGates.find((gate) => gate.level === state.learner.selfDeclaredLevel) ??
    levelGates.find((gate) => !gate.ready) ??
    levelGates[levelGates.length - 1];
  const activeGateProgress = activeGate
    ? Math.round(
        (activeGate.requirements.filter((requirement) => requirement.done)
          .length /
          activeGate.requirements.length) *
          100,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="section-kicker">Kontrolle</p>
        <h1 className="section-title">Einstellungen & Daten</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Dieselbe lokale Datenstruktur wie v20.8, mit kompatiblem Export und
          Import. Audio wird nur gespeichert, wenn du es erlaubst.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5" />
            GER-Niveau & gemeinsames Lernprofil
          </CardTitle>
          <CardDescription>
            A1 bis C2 direkt wählen oder die freiwillige Einstufung nutzen. Das
            gewählte Niveau ist ein Einstieg, kein Kompetenznachweis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Name oder Profilbezeichnung (optional)
            <Input
              autoComplete="name"
              maxLength={120}
              onChange={(event) =>
                updateLearnerProfile({ displayName: event.target.value })
              }
              placeholder="Dein Name"
              value={state.learner.displayName}
            />
          </label>
          <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-amber-50 p-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar
                className="size-24"
                label={
                  state.learner.displayName
                    ? `Profilfoto von ${state.learner.displayName}`
                    : "Dein menschlicher Profilavatar"
                }
                photo={state.learner.avatarDataUrl}
              />
              <div className="min-w-0 flex-1">
                <strong className="block">Dein menschliches Profilfoto</strong>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Es erscheint bei deinen Sprechübungen in allen drei
                  installierten Apps. Das Foto wird nur lokal zugeschnitten und
                  komprimiert und nicht an einen Bilddienst gesendet.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => avatarInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <Camera aria-hidden className="size-4" />
                    {state.learner.avatarDataUrl
                      ? "Foto ändern"
                      : "Foto auswählen"}
                  </Button>
                  {state.learner.avatarDataUrl ? (
                    <Button
                      onClick={() => {
                        updateLearnerProfile({ avatarDataUrl: "" });
                        setStatus(
                          "Profilfoto entfernt; der menschliche Avatar ist aktiv.",
                        );
                      }}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 aria-hidden className="size-4" />
                      Foto entfernen
                    </Button>
                  ) : null}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setStatus("Profilfoto wird lokal verarbeitet …");
                      try {
                        const avatarDataUrl = await profilePhotoFromFile(file);
                        updateLearnerProfile({ avatarDataUrl });
                        setStatus(
                          "Profilfoto gespeichert und mit den installierten Apps geteilt.",
                        );
                      } catch (error) {
                        setStatus(
                          error instanceof Error
                            ? error.message
                            : "Das Profilfoto konnte nicht gespeichert werden.",
                        );
                      } finally {
                        event.target.value = "";
                      }
                    }}
                    ref={avatarInputRef}
                    type="file"
                  />
                </div>
              </div>
            </div>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">
            Mein Startniveau
            <select
              className="h-10 min-w-0 rounded-lg border bg-background px-3"
              onChange={(event) => {
                const level =
                  CEFR_LEVELS.find(
                    (candidate) => candidate === event.target.value,
                  ) ?? null;
                updateLearnerProfile({
                  selfDeclaredLevel: level,
                  verifiedLevel:
                    state.learner.selfDeclaredLevel === level
                      ? state.learner.verifiedLevel
                      : null,
                  placementMode: level ? "manual" : "not_set",
                  placementCheckedAt: null,
                });
                setStatus(
                  level
                    ? `${level} wurde als Startniveau gewählt und nicht als nachgewiesen markiert.`
                    : "Startniveau wurde entfernt.",
                );
              }}
              value={state.learner.selfDeclaredLevel ?? ""}
            >
              <option value="">Später wählen</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/35 p-3 text-sm">
              <strong className="block">Gewähltes Niveau</strong>
              <span className="text-muted-foreground">
                {state.learner.selfDeclaredLevel ?? "Noch nicht gewählt"}
              </span>
            </div>
            <div className="rounded-xl border bg-muted/35 p-3 text-sm">
              <strong className="block">Nachgewiesenes Niveau</strong>
              <span className="text-muted-foreground">
                {state.learner.verifiedLevel ??
                  "Noch nicht nachgewiesen – Training bleibt offen"}
              </span>
            </div>
          </div>
          <PlacementCheck
            onAccept={(level) => {
              updateLearnerProfile({
                selfDeclaredLevel: level,
                verifiedLevel:
                  state.learner.selfDeclaredLevel === level
                    ? state.learner.verifiedLevel
                    : null,
                placementMode: "optional_test",
                placementCheckedAt: new Date().toISOString(),
              });
              setStatus(
                `${level} wurde als Einstufungsempfehlung übernommen. Der Kompetenznachweis bleibt getrennt.`,
              );
            }}
          />
          <div className="rounded-xl border p-4">
            <strong className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4" />
              Datenschutz & Austausch zwischen Apps
            </strong>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                  href="/privacy"
                >
                  Datenschutzseite öffnen
                </Link>
                <Link
                  className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                  href="/support"
                >
                  Supportseite öffnen
                </Link>
                <Link
                  className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                  href="/offline"
                >
                  Offline-Hinweis öffnen
                </Link>
              </div>
            <div className="mt-3 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.shareAcrossApps}
                  className="mt-1 size-4 accent-sky-700"
                  onChange={(event) =>
                    updateLearnerProfile({
                      shareAcrossApps: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block">
                    Kompakten Fortschritt teilen
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    Die installierten Apps teilen Niveaus und Evidenzzahlen,
                    aber keine Antworten und keine Aufnahmen.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.allowOnlineAI}
                  className="mt-1 size-4 accent-sky-700"
                  onChange={(event) =>
                    updateLearnerProfile({
                      allowOnlineAI: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block">
                    Optionale Online-KI erlauben
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    Standardmäßig aus. Offline-Übungen bleiben ohne diese
                    Einwilligung verfügbar.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.includeEvidenceInExport}
                  className="mt-1 size-4 accent-sky-700"
                  onChange={(event) =>
                    updateLearnerProfile({
                      includeEvidenceInExport: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>Kompakte Evidenzzahlen in Profil-Exporte aufnehmen</span>
              </label>
            </div>
          </div>
          <AIProviderSettings
            onConnected={() =>
              updateLearnerProfile({
                allowOnlineAI: true,
              })
            }
          />
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <span className="rounded-xl border bg-muted/35 p-3">
              Sprechen: {evidence.speakingSamples}
            </span>
            <span className="rounded-xl border bg-muted/35 p-3">
              Schreiben: {evidence.writingSamples}
            </span>
            <span className="rounded-xl border bg-muted/35 p-3">
              Spontan: {evidence.spontaneousSamples}
            </span>
            <span className="rounded-xl border bg-muted/35 p-3">
              Verzögert: {evidence.delayedReviews}
            </span>
          </div>
          {activeGate ? (
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <strong className="flex items-center gap-2 text-sm">
                  <LockKeyhole className="size-4" />
                  Level-Progress-Gate
                </strong>
                <div className="flex items-center gap-2">
                  <Badge variant={activeGate.ready ? "secondary" : "outline"}>
                    {activeGate.level}
                  </Badge>
                  <Badge variant="outline">{activeGateProgress}%</Badge>
                </div>
              </div>
              <Progress
                aria-label={`Fortschritt Level-Nachweis ${activeGateProgress} Prozent`}
                value={activeGateProgress}
              />
              <div className="grid gap-2">
                {activeGate.requirements.map((requirement) => (
                  <div
                    key={requirement.key}
                    className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center"
                  >
                    <span className="min-w-0 flex-1">{requirement.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={requirement.done ? "secondary" : "outline"}
                      >
                        {requirement.done ? "Erfüllt" : "Offen"}
                      </Badge>
                      {!requirement.done ? (
                        <Link
                          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                          href={requirement.href}
                        >
                          {requirement.actionLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void exportProfile()}
              type="button"
              variant="outline"
            >
              <Download data-icon="inline-start" />
              Gemeinsames Profil exportieren
            </Button>
            <Button
              onClick={() => profileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              <Upload data-icon="inline-start" />
              Gemeinsames Profil importieren
            </Button>
            <input
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const profile = await replaceLearnerProfile(
                    JSON.parse(await file.text()),
                  );
                  const german = profile.languages.german;
                  updateLearnerProfile({
                    displayName: profile.displayName,
                    avatarDataUrl: profile.avatarDataUrl,
                    selfDeclaredLevel: german.selfDeclaredLevel,
                    verifiedLevel: german.verifiedLevel,
                    placementMode: german.placementMode,
                    placementCheckedAt: german.placementCheckedAt,
                    shareAcrossApps: profile.privacy.shareAcrossApps,
                    allowOnlineAI: profile.privacy.allowOnlineAI,
                    includeEvidenceInExport:
                      profile.privacy.includeEvidenceInExport,
                  });
                  updateSettings({ saveAudio: profile.privacy.storeAudio });
                  setStatus("Gemeinsames Lernprofil importiert.");
                } catch (error) {
                  setStatus(
                    `Profil-Import fehlgeschlagen: ${
                      error instanceof Error
                        ? error.message
                        : "Ungültige JSON-Datei"
                    }`,
                  );
                } finally {
                  event.target.value = "";
                }
              }}
              ref={profileInputRef}
              type="file"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ADHS- und Dyslexie-Einstellungen</CardTitle>
          <CardDescription>
            Eine ruhige, lesbare Oberfläche mit freiwilligem Zeitdruck. Die
            Einstellungen gelten sofort in der gesamten App.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-medium">
              Leseprofil
              <select
                className="h-10 rounded-md border bg-background px-3 text-base"
                onChange={(event) =>
                  updateSettings({
                    readingProfile:
                      event.target.value === "standard"
                        ? "standard"
                        : "dyslexia",
                  })
                }
                value={state.settings.readingProfile}
              >
                <option value="dyslexia">Dyslexie-freundlich</option>
                <option value="standard">Standard</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Textgröße
              <select
                className="h-10 rounded-md border bg-background px-3 text-base"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  updateSettings({
                    textScale: value === 100 || value === 125 ? value : 112,
                  });
                }}
                value={String(state.settings.textScale)}
              >
                <option value="100">100 %</option>
                <option value="112">112 % · empfohlen</option>
                <option value="125">125 %</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Vorlesegeschwindigkeit
              <select
                className="h-10 rounded-md border bg-background px-3 text-base"
                onChange={(event) =>
                  updateSettings({ ttsRate: Number(event.target.value) })
                }
                value={String(state.settings.ttsRate)}
              >
                <option value="0.7">Langsam</option>
                <option value="0.9">Angenehm</option>
                <option value="1">Normal</option>
                <option value="1.2">Schnell</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "readingRuler",
                  "Leselineal",
                  "Eine ruhige horizontale Lesehilfe folgt dem Zeiger.",
                ],
                [
                  "lowStimulation",
                  "Reizarmer Modus",
                  "Weniger Bewegung, Dekoration und visuelle Intensität.",
                ],
                [
                  "movementBreaks",
                  "Bewegungspausen",
                  "Sanfte Pausenhinweise in längeren Lerneinheiten.",
                ],
                [
                  "timedChallenges",
                  "Aufgaben mit Zeitdruck",
                  "Freiwillig; Geschwindigkeit ist kein Wissensnachweis.",
                ],
                [
                  "showStreaks",
                  "Lernserie anzeigen",
                  "Nur ein Gewohnheitssignal, niemals Kompetenznachweis.",
                ],
                [
                  "spellingAffectsMastery",
                  "Rechtschreibung zählt zur Grammatikbewertung",
                  "Standardmäßig aus: Rechtschreibung wird separat verbessert.",
                ],
              ] as const
            ).map(([key, title, description]) => (
              <label
                className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                key={key}
              >
                <input
                  checked={state.settings[key]}
                  className="mt-1 size-4 accent-sky-700"
                  onChange={(event) =>
                    updateSettings({ [key]: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block">{title}</strong>
                  <span className="text-muted-foreground">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wirksamkeitsnachweis</CardTitle>
          <CardDescription>
            Dieselbe Sprech- und Schreibaufgabe vor dem Lernen, danach und nach
            30 Tagen bewerten. So werden Verbesserung und Behalten getrennt von
            erledigten Lektionen sichtbar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Persönliches Kommunikationsziel
            <Input
              maxLength={240}
              onChange={(event) =>
                updateOutcomeEvidence({ goal: event.target.value })
              }
              value={state.outcomes.goal}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["baselineScore", "Ausgangswert"],
                ["followupScore", "Nachmessung"],
                ["retentionScore", "30-Tage-Behalten"],
              ] as const
            ).map(([key, label]) => (
              <label className="grid gap-1.5 text-sm font-medium" key={key}>
                {label} · 0–100
                <Input
                  inputMode="numeric"
                  max={100}
                  min={0}
                  onChange={(event) => {
                    const raw = event.target.value;
                    updateOutcomeEvidence({
                      [key]:
                        raw === ""
                          ? null
                          : Math.min(100, Math.max(0, Number(raw))),
                    });
                  }}
                  type="number"
                  value={state.outcomes[key] ?? ""}
                />
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <input
              checked={state.outcomes.independentlyRated}
              className="mt-1 size-4 accent-sky-700"
              onChange={(event) =>
                updateOutcomeEvidence({
                  independentlyRated: event.target.checked,
                })
              }
              type="checkbox"
            />
            <span>
              <strong className="block">
                Von einer zweiten Person bewertet
              </strong>
              <span className="text-muted-foreground">
                Lehrkraft oder verblindete Person nutzt dieselbe
                Bewertungsmatrix.
              </span>
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Hinweis zur Bewertung
            <Input
              maxLength={500}
              onChange={(event) =>
                updateOutcomeEvidence({ assessorNote: event.target.value })
              }
              placeholder="Optional; keine sensiblen Personendaten eingeben"
              value={state.outcomes.assessorNote}
            />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="size-5" />
              Training
            </CardTitle>
            <CardDescription>
              Regeln für Gesprächsauswertung und Aufnahme.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-1.5 text-sm font-medium">
              Mindestwörter pro Gesprächsantwort
              <Input
                type="number"
                min={5}
                max={200}
                value={minWords}
                disabled={!settingsReady}
                onChange={(event) => setMinWords(Number(event.target.value))}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
              <input
                type="checkbox"
                checked={saveAudio}
                disabled={!settingsReady}
                onChange={(event) => setSaveAudio(event.target.checked)}
                className="size-4 accent-sky-700"
              />
              <span>
                <strong className="block">Audio lokal speichern</strong>
                <span className="text-xs text-muted-foreground">
                  Aufnahmen bleiben in IndexedDB auf diesem Gerät.
                </span>
              </span>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Korrekturmotor
              <Input
                value="Lokale Basisprüfung + LanguageTool optional"
                disabled
              />
            </label>
            <p className="rounded-xl border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
              Offline-Übungen und lokale Hinweise funktionieren ohne
              Datenübertragung. LanguageTool wird nur mit deiner Einwilligung
              für optionales Online-Feedback aufgerufen.
            </p>
            <Button
              type="button"
              disabled={!settingsReady}
              onClick={saveSettings}
            >
              <Save data-icon="inline-start" />
              Einstellungen speichern
            </Button>
          </CardContent>
        </Card>

        <Card id="installation" className="scroll-mt-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" />
              Installation & lokaler Speicher
            </CardTitle>
            <CardDescription>
              DeutschFlow lässt sich auf diesem Gerät wie eine normale App
              öffnen und bleibt local-first.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <strong>Alles Nötige ist enthalten.</strong> Das Windows-Setup
              bringt die App-Laufzeit mit. Slack, Vercel, kostenpflichtige
              Software und separate Entwicklerwerkzeuge sind nicht nötig.
              Kalender und Online-KI bleiben freiwillig.
            </div>
            <StatusRow
              icon={<Database />}
              label="Lerndaten"
              value="localStorage · legacy-kompatibel"
            />
            <StatusRow
              icon={<HardDrive />}
              label="Browser-Speicher"
              value={`${formatBytes(storage.usage)} von ${formatBytes(
                storage.quota,
              )}${storage.persisted ? " · persistent" : ""}`}
            />
            <StatusRow
              icon={<Smartphone />}
              label="Installationsstatus"
              value={
                installed
                  ? "Als App geöffnet"
                  : canPrompt
                    ? "Bereit zur Installation"
                    : "Im Browser geöffnet"
              }
            />
            <StatusRow
              icon={<Wifi />}
              label="Offline-Bereitschaft"
              value={
                serviceWorkerReady
                  ? "Offline-Inhalte sind bereit"
                  : "Wird nach der Veröffentlichung aktiviert"
              }
            />
            <InstallAppButton surface="settings" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Google Kalender
          </CardTitle>
          <CardDescription>
            Fällige Wiederholungen und aktive Tagespläne automatisch
            synchronisieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            {!calendar?.available
              ? "Öffne die installierte Windows-App, um Google Kalender zu verbinden."
              : calendar.connected
                ? `Verbunden als ${calendar.email}`
                : calendar.configured
                  ? "Bereit zum Verbinden"
                  : "Die Kalender-Konfiguration fehlt in dieser Installation."}
          </div>
          <div className="flex flex-wrap gap-2">
            {calendar?.connected ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={calendarBusy}
                  onClick={() => void syncCalendar()}
                >
                  <RefreshCw data-icon="inline-start" />
                  Jetzt synchronisieren
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={calendarBusy}
                  onClick={() => void disconnectCalendar()}
                >
                  <Unplug data-icon="inline-start" />
                  Trennen
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={
                  calendarBusy || !calendar?.available || !calendar.configured
                }
                onClick={() => void connectCalendar()}
              >
                <CalendarDays data-icon="inline-start" />
                Mit Google Kalender verbinden
              </Button>
            )}
          </div>
          {calendarMessage ? (
            <p role="status" aria-live="polite" className="text-sm">
              {calendarMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card id="installationsschritte" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>
            <h2>Auf deinem Gerät installieren</h2>
          </CardTitle>
          <CardDescription>
            Wähle dein Gerät. Fortschritt und Einstellungen bleiben auf diesem
            Gerät gespeichert.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <InstallGuide
            icon={<Monitor />}
            title="Windows"
            current={platform === "windows"}
            steps={[
              "Oben auf „Windows-App installieren“ klicken und die Setup-Datei öffnen.",
              "Im Setup den gewünschten Installationsordner auswählen.",
              "Auf „Installieren“ klicken. Desktop- und Startmenü-Verknüpfung werden automatisch erstellt.",
            ]}
          />
          <InstallGuide
            icon={<Smartphone />}
            title="Android"
            current={platform === "android"}
            steps={[
              "Oben auf „Android-App installieren“ tippen.",
              "Die heruntergeladene APK öffnen und die Installation erlauben.",
              "Auf „Installieren“ tippen. Android verwaltet den Speicherort automatisch.",
            ]}
          />
          <InstallGuide
            icon={<Share2 />}
            title="iPhone & iPad"
            current={platform === "iphone" || platform === "ipad"}
            steps={[
              "DeutschFlow in Safari öffnen.",
              "Auf „Teilen“ und danach „Zum Home-Bildschirm“ tippen.",
              "„Als Web-App öffnen“ aktivieren und „Hinzufügen“ wählen.",
            ]}
          />
          <p className="text-xs leading-5 text-muted-foreground lg:col-span-3">
            Windows fragt im Setup nach dem Installationsordner. Android, iPhone
            und iPad verwalten den Installationsort aus Sicherheitsgründen
            selbst; eine freie Ordnerwahl ist dort nicht möglich.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datenportabilität</CardTitle>
          <CardDescription>
            Export und Import verwenden das ursprüngliche
            `GrammarAutomaticityV11_de`-Format.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={exportData}>
            <Download data-icon="inline-start" />
            JSON exportieren
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload data-icon="inline-start" />
            JSON importieren
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => void importData(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={clearLearnerData}
          >
            <RefreshCcw data-icon="inline-start" />
            Lerndaten zurücksetzen
          </Button>
        </CardContent>
      </Card>

      {status && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border bg-card p-3 text-sm"
        >
          <Check className="size-4 text-sky-700" />
          {status}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Deutsch</Badge>
        <Badge variant="outline">lokal gespeichert</Badge>
        <Badge variant="outline">kein Neon nötig</Badge>
      </div>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 [&>svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block text-sm">{label}</strong>
        <span className="block truncate text-xs text-muted-foreground">
          {value}
        </span>
      </span>
    </div>
  );
}

function InstallGuide({
  icon,
  title,
  current,
  steps,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  current: boolean;
  steps: readonly string[];
}>) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-muted/25 p-4",
        current && "border-sky-400 bg-sky-50 shadow-sm",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-sky-100 text-sky-700 [&>svg]:size-4">
          {icon}
        </span>
        <h3 className="font-semibold">{title}</h3>
        {current && (
          <Badge className="ml-auto bg-sky-100 text-sky-900 hover:bg-sky-100">
            Dieses Gerät
          </Badge>
        )}
      </div>
      <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky-100 text-xs font-semibold text-sky-800">
              {index + 1}
            </span>
            <span className="leading-5">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
