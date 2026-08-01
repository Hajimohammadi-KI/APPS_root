"use client";

import * as React from "react";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Download,
  FolderCheck,
  FolderOpen,
  GraduationCap,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  Unplug,
  Upload,
} from "lucide-react";
import { grammarUnits } from "@grammar/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import {
  chooseBackupDirectory,
  downloadBackup,
  getBackupDirectory,
  supportsBackupDirectoryPicker,
  writeBackupToDirectory,
} from "@/lib/backup-directory";
import {
  connectDesktopCalendar,
  disconnectDesktopCalendar,
  readDesktopCalendarStatus,
  syncDesktopCalendar,
  type DesktopCalendarStatus,
} from "@/lib/desktop-calendar";
import {
  buildEnglishEvidence,
  normalizeAppState,
  useAppStore,
  type AppState,
} from "@/features/store/app-store";
import { PlacementCheck } from "@/features/components/placement-check";
import { AIProviderSettings } from "@/features/components/ai-provider-settings";
import { ProfileAvatar } from "@/features/components/profile-avatar";
import {
  CEFR_LEVELS,
  portableLearnerProfile,
  replaceLearnerProfile,
} from "@/lib/learner-profile";
import { profilePhotoFromFile } from "@/lib/profile-photo";

type QuickScreen = "daily" | "studio" | "grammar" | "errors";

export function SettingsScreen() {
  const { state, mutate, replaceState } = useAppStore();
  const [minWords, setMinWords] = React.useState(state.settings.minWords);
  const [saveAudio, setSaveAudio] = React.useState(state.settings.saveAudio);
  const [apiBaseUrl, setApiBaseUrl] = React.useState(state.settings.apiBaseUrl);
  const [status, setStatus] = React.useState(
    "Settings and progress stay saved in this browser.",
  );
  const [apiStatus, setApiStatus] = React.useState("Not checked");
  const [backupFolder, setBackupFolder] = React.useState<string | null>(null);
  const [calendar, setCalendar] = React.useState<DesktopCalendarStatus | null>(
    null,
  );
  const [calendarBusy, setCalendarBusy] = React.useState(false);
  const [calendarMessage, setCalendarMessage] = React.useState("");
  const [folderPickerSupported, setFolderPickerSupported] =
    React.useState(false);
  const profileInputRef = React.useRef<HTMLInputElement | null>(null);
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const [platform, setPlatform] = React.useState({
    pwa: "Checking...",
    storage: "Checking...",
  });

  React.useEffect(() => {
    const standalone =
      navigator.userAgent.includes("EnglishGrammarAutomaticityDesktop/") ||
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);
    const secure = window.isSecureContext;
    const serviceWorker = "serviceWorker" in navigator;
    setFolderPickerSupported(supportsBackupDirectoryPicker());
    getBackupDirectory()
      .then((handle) => setBackupFolder(handle?.name ?? null))
      .catch(() => undefined);
    setPlatform((current) => ({
      ...current,
      pwa: `${standalone ? "Installed" : "Opened in browser"} · ${
        secure ? "Secure context" : "Not secure"
      } · Service Worker ${serviceWorker ? "available" : "unavailable"}`,
    }));
    if (navigator.storage?.estimate) {
      navigator.storage
        .estimate()
        .then((estimate) =>
          setPlatform((current) => ({
            ...current,
            storage: `${Math.round((estimate.usage ?? 0) / 1024 / 1024)} MB / ${Math.round(
              (estimate.quota ?? 0) / 1024 / 1024,
            )} MB`,
          })),
        )
        .catch((error: unknown) =>
          setPlatform((current) => ({
            ...current,
            storage: error instanceof Error ? error.message : "Unavailable",
          })),
        );
    }
  }, []);

  React.useEffect(() => {
    readDesktopCalendarStatus()
      .then(setCalendar)
      .catch((error: unknown) =>
        setCalendarMessage(
          error instanceof Error
            ? error.message
            : "Calendar status unavailable.",
        ),
      );
  }, []);

  const connectCalendar = async () => {
    setCalendarBusy(true);
    setCalendarMessage("Waiting for Google authorization...");
    try {
      const next = await connectDesktopCalendar();
      setCalendar(next);
      const result = await syncDesktopCalendar(state);
      setCalendarMessage(
        `Connected as ${next.email}. Synced ${result.total} learning event(s).`,
      );
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Google Calendar connection failed.",
      );
    } finally {
      setCalendarBusy(false);
    }
  };

  const syncCalendar = async () => {
    setCalendarBusy(true);
    try {
      const result = await syncDesktopCalendar(state);
      setCalendar((current) =>
        current ? { ...current, lastSyncAt: result.syncedAt } : current,
      );
      setCalendarMessage(
        `Synced ${result.total} learning event(s) without duplicates.`,
      );
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Calendar sync failed.",
      );
    } finally {
      setCalendarBusy(false);
    }
  };

  const disconnectCalendar = async () => {
    if (!window.confirm("Disconnect Google Calendar from this app?")) return;
    setCalendarBusy(true);
    try {
      setCalendar(await disconnectDesktopCalendar());
      setCalendarMessage("Google Calendar disconnected.");
    } catch (error) {
      setCalendarMessage(
        error instanceof Error
          ? error.message
          : "Google Calendar could not be disconnected.",
      );
    } finally {
      setCalendarBusy(false);
    }
  };

  const testApi = async () => {
    setApiStatus("Checking...");
    try {
      const response = await fetch(
        `${apiBaseUrl.replace(/\/$/, "")}/api/health`,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { status?: string };
      setApiStatus(
        payload.status === "ok" ? "Connected" : "Unexpected response",
      );
    } catch (error) {
      setApiStatus(
        error instanceof Error ? error.message : "Connection failed",
      );
    }
  };

  const selectBackupFolder = async () => {
    try {
      const handle = await chooseBackupDirectory();
      setBackupFolder(handle.name);
      setStatus(`Backup folder selected: ${handle.name}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("No folder was selected.");
      } else {
        setStatus(
          error instanceof Error
            ? error.message
            : "Backup folder could not be selected.",
        );
      }
    }
  };

  const exportData = async () => {
    const contents = JSON.stringify(state, null, 2);
    try {
      const handle = await getBackupDirectory();
      if (handle) {
        await writeBackupToDirectory(handle, contents);
        setBackupFolder(handle.name);
        setStatus(`Backup saved to "${handle.name}".`);
        return;
      }
      downloadBackup(contents);
      setStatus(
        "Backup downloaded. The browser selected the location or asked you.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Backup could not be saved.",
      );
    }
  };
  const exportProfile = async () => {
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
      setStatus("Shared learner profile exported.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Profile export failed.",
      );
    }
  };
  const evidence = buildEnglishEvidence(state);
  const goToScreen = React.useCallback((target: QuickScreen) => {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", target);
    window.history.pushState({ screen: target }, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
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
        titleSet.has(error.grammarTitle) &&
        error.repairStatus !== "fixed" &&
        error.errorClass !== "spelling",
    ).length;
    const successful = state.attempts.filter(
      (attempt) =>
        titleSet.has(attempt.grammarTitle) &&
        attempt.verified === true &&
        attempt.passed,
    );
    const speaking = successful.filter((attempt) => attempt.mode === "speaking").length;
    const writing = successful.filter((attempt) => attempt.mode === "writing").length;
    const transfer = successful.filter(
      (attempt) => attempt.mode === "transfer" || attempt.mode === "timed",
    ).length;
    const minimumSamples = Math.max(6, Math.ceil(levelTitles.length * 0.5));
    const requirements = [
      {
        key: "automatic",
        label: `Automatic topics ${automaticCount}/${levelTitles.length}`,
        done: automaticCount === levelTitles.length,
        actionLabel: "Open Grammar Lab",
        action: "grammar" as QuickScreen,
      },
      {
        key: "errors",
        label: `Active critical errors ${activeCriticalErrors}`,
        done: activeCriticalErrors === 0,
        actionLabel: "Open Error Workshop",
        action: "errors" as QuickScreen,
      },
      {
        key: "speaking",
        label: `Speaking evidence ${speaking}/${minimumSamples}`,
        done: speaking >= minimumSamples,
        actionLabel: "Open Studio",
        action: "studio" as QuickScreen,
      },
      {
        key: "writing",
        label: `Writing evidence ${writing}/${minimumSamples}`,
        done: writing >= minimumSamples,
        actionLabel: "Open Daily Training",
        action: "daily" as QuickScreen,
      },
      {
        key: "transfer",
        label: `Transfer evidence ${transfer}/${minimumSamples}`,
        done: transfer >= minimumSamples,
        actionLabel: "Open Daily Training",
        action: "daily" as QuickScreen,
      },
    ] as const;

    return {
      level,
      ready: requirements.every((requirement) => requirement.done),
      requirements,
    };
  });
  const activeGate =
    levelGates.find((gate) => gate.level === state.learner.selfDeclaredLevel) ??
    levelGates.find((gate) => !gate.ready) ??
    levelGates[levelGates.length - 1];
  const activeGateProgress = activeGate
    ? Math.round(
        (activeGate.requirements.filter((requirement) => requirement.done).length /
          activeGate.requirements.length) *
          100,
      )
    : 0;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>
            Manage evidence rules, local audio recordings, the NestJS
            evaluation service, installation, and full progress backup.
          </p>
        </div>
        <Badge variant="success">Local first</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap aria-hidden className="size-5" />
            CEFR level and shared learner profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose A1-C2 directly if you know your level. Placement is optional.
            The selected level is a starting point; only repeated speaking,
            writing, listening, and delayed evidence confirms it.
          </p>
          <div className="settings-row">
            <Label htmlFor="learner-name">
              Name or profile label (optional)
            </Label>
            <Input
              autoComplete="name"
              id="learner-name"
              maxLength={120}
              name="learner-name"
              onChange={(event) =>
                mutate((draft) => {
                  draft.learner.displayName = event.target.value;
                })
              }
              placeholder="Your name"
              value={state.learner.displayName}
            />
          </div>
          <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-orange-50 p-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar
                className="size-24"
                label={
                  state.learner.displayName
                    ? `Profile photo of ${state.learner.displayName}`
                    : "Your human profile avatar"
                }
                photo={state.learner.avatarDataUrl}
              />
              <div className="min-w-0 flex-1">
                <strong className="block">Your human profile photo</strong>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  It appears next to your speaking activity in all three
                  installed apps. The photo is cropped and compressed locally;
                  it is never sent to an image service.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => avatarInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <Camera aria-hidden className="size-4" />
                    {state.learner.avatarDataUrl
                      ? "Change photo"
                      : "Select photo"}
                  </Button>
                  {state.learner.avatarDataUrl ? (
                    <Button
                      onClick={() => {
                        mutate((draft) => {
                          draft.learner.avatarDataUrl = "";
                        });
                        setStatus(
                          "Profile photo removed; the default human avatar is active.",
                        );
                      }}
                      type="button"
                      variant="outline"
                    >
                      <Trash2 aria-hidden className="size-4" />
                      Remove photo
                    </Button>
                  ) : null}
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setStatus("Processing profile photo locally...");
                      try {
                        const avatarDataUrl = await profilePhotoFromFile(file);
                        mutate((draft) => {
                          draft.learner.avatarDataUrl = avatarDataUrl;
                        });
                        setStatus(
                          "Profile photo saved and shared with installed apps.",
                        );
                      } catch (error) {
                        setStatus(
                          error instanceof Error
                            ? error.message
                            : "Profile photo could not be saved.",
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
          <div className="settings-row">
            <Label htmlFor="self-declared-level">My starting level</Label>
            <Select
              id="self-declared-level"
              name="self-declared-level"
              onChange={(event) => {
                const level =
                  CEFR_LEVELS.find((item) => item === event.target.value) ??
                  null;
                mutate((draft) => {
                  if (draft.learner.selfDeclaredLevel !== level) {
                    draft.learner.verifiedLevel = null;
                  }
                  draft.learner.selfDeclaredLevel = level;
                  draft.learner.placementMode = level ? "manual" : "not_set";
                  draft.learner.placementCheckedAt = null;
                });
                setStatus(
                  level
                    ? `${level} set as starting level; it is not yet verified.`
                    : "Starting level removed.",
                );
              }}
              value={state.learner.selfDeclaredLevel ?? ""}
            >
              <option value="">Choose later</option>
              {CEFR_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-secondary p-3 text-sm">
              <strong className="block">Selected level</strong>
              <span className="text-muted-foreground">
                {state.learner.selfDeclaredLevel ?? "Not selected"}
              </span>
            </div>
            <div className="rounded-xl border bg-secondary p-3 text-sm">
              <strong className="block">Verified level</strong>
              <span className="text-muted-foreground">
                {state.learner.verifiedLevel ??
                  "Not verified yet - tasks remain open"}
              </span>
            </div>
          </div>
          <PlacementCheck
            onAccept={(level) => {
              mutate((draft) => {
                if (draft.learner.selfDeclaredLevel !== level) {
                  draft.learner.verifiedLevel = null;
                }
                draft.learner.selfDeclaredLevel = level;
                draft.learner.placementMode = "optional_test";
                draft.learner.placementCheckedAt = new Date().toISOString();
              });
              setStatus(
                `${level} accepted as placement suggestion. Mastery still needs evidence.`,
              );
            }}
          />
          <div className="rounded-xl border p-4">
            <strong className="flex items-center gap-2 text-sm">
              <ShieldCheck aria-hidden className="size-4" />
              Privacy and cross-app sharing
            </strong>
            <div className="mt-3 grid gap-3 text-sm">
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.shareAcrossApps}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    mutate((draft) => {
                      draft.learner.shareAcrossApps = event.target.checked;
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block">
                    Share compact progress
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    Installed Study Tracker, DeutschFlow, and this app share
                    levels and evidence counts, never raw answers or audio.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.allowOnlineAI}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    mutate((draft) => {
                      draft.learner.allowOnlineAI = event.target.checked;
                      draft.settings.onlineFeedback = event.target.checked;
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <strong className="block">
                    Allow optional online AI
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    Off by default. Offline exercises remain available when this
                    is disabled.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  checked={state.learner.includeEvidenceInExport}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    mutate((draft) => {
                      draft.learner.includeEvidenceInExport =
                        event.target.checked;
                    })
                  }
                  type="checkbox"
                />
                <span>Include compact evidence counts in profile exports</span>
              </label>
            </div>
          </div>
          <AIProviderSettings
            onConnected={() =>
              mutate((draft) => {
                draft.learner.allowOnlineAI = true;
                draft.settings.onlineFeedback = true;
              })
            }
          />
          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <span className="rounded-xl border bg-secondary p-3">
              Speaking: {evidence.speakingSamples}
            </span>
            <span className="rounded-xl border bg-secondary p-3">
              Writing: {evidence.writingSamples}
            </span>
            <span className="rounded-xl border bg-secondary p-3">
              Spontaneous: {evidence.spontaneousSamples}
            </span>
            <span className="rounded-xl border bg-secondary p-3">
              Delayed reviews: {evidence.delayedReviews}
            </span>
          </div>
          {activeGate ? (
            <div className="rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <strong className="flex items-center gap-2 text-sm">
                  <LockKeyhole aria-hidden className="size-4" />
                  Level progress gate
                </strong>
                <div className="flex items-center gap-2">
                  <Badge variant={activeGate.ready ? "success" : "warning"}>
                    {activeGate.level}
                  </Badge>
                  <Badge variant="secondary">{activeGateProgress}%</Badge>
                </div>
              </div>
              <Progress
                aria-label={`Level verification progress ${activeGateProgress} percent`}
                value={activeGateProgress}
              />
              <div className="grid gap-2">
                {activeGate.requirements.map((requirement) => (
                  <div
                    className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center"
                    key={requirement.key}
                  >
                    <span className="min-w-0 flex-1">{requirement.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={requirement.done ? "success" : "warning"}>
                        {requirement.done ? "Done" : "Open"}
                      </Badge>
                      {!requirement.done ? (
                        <Button
                          onClick={() => goToScreen(requirement.action)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {requirement.actionLabel}
                        </Button>
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
              <Download aria-hidden className="size-4" />
              Export shared profile
            </Button>
            <Button
              onClick={() => profileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              <Upload aria-hidden className="size-4" />
              Import shared profile
            </Button>
            <input
              accept="application/json,.json"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const profile = await replaceLearnerProfile(
                    JSON.parse(await file.text()),
                  );
                  const english = profile.languages.english;
                  mutate((draft) => {
                    draft.learner = {
                      displayName: profile.displayName,
                      avatarDataUrl: profile.avatarDataUrl,
                      selfDeclaredLevel: english.selfDeclaredLevel,
                      verifiedLevel: english.verifiedLevel,
                      placementMode: english.placementMode,
                      placementCheckedAt: english.placementCheckedAt,
                      shareAcrossApps: profile.privacy.shareAcrossApps,
                      allowOnlineAI: profile.privacy.allowOnlineAI,
                      includeEvidenceInExport:
                        profile.privacy.includeEvidenceInExport,
                    };
                    draft.settings.saveAudio = profile.privacy.storeAudio;
                    draft.settings.onlineFeedback =
                      profile.privacy.allowOnlineAI;
                  });
                  setStatus("Gemeinsames Lernprofil wurde importiert.");
                } catch (error) {
                  setStatus(
                    error instanceof Error
                      ? error.message
                      : "Profile import failed.",
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

      <Card id="neuroinclusive-preferences">
        <CardHeader>
          <CardTitle>ADHD and Dyslexia Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="max-w-[70ch] text-sm text-muted-foreground">
            These settings change presentation and time pressure, not your
            learning level. By default, spelling evidence stays separate from
            grammar mastery, and timed tasks remain optional.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold">
              Reading profile
              <Select
                aria-label="Leseprofil"
                onChange={(event) =>
                  mutate((draft) => {
                    draft.settings.readingProfile =
                      event.target.value === "standard"
                        ? "standard"
                        : "dyslexia";
                  })
                }
                value={state.settings.readingProfile}
              >
                <option value="dyslexia">
                  Neuroinclusive · readable spacing and softer background
                </option>
                <option value="standard">Standard</option>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Text size
              <Select
                aria-label="Text size"
                onChange={(event) =>
                  mutate((draft) => {
                    const value = Number(event.target.value);
                    draft.settings.textScale =
                      value === 100 || value === 125 ? value : 112;
                  })
                }
                value={String(state.settings.textScale)}
              >
                <option value="100">100%</option>
                <option value="112">112% · empfohlen</option>
                <option value="125">125%</option>
              </Select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold">
              Read-aloud speed
              <Select
                aria-label="Vorlesegeschwindigkeit"
                onChange={(event) =>
                  mutate((draft) => {
                    draft.settings.ttsRate = Number(event.target.value);
                  })
                }
                value={String(state.settings.ttsRate)}
              >
                <option value="0.7">Slow</option>
                <option value="0.9">Comfortable</option>
                <option value="1">Normal</option>
                <option value="1.2">Fast</option>
              </Select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "readingRuler",
                  "Reading ruler",
                  "Follow the cursor with a calm horizontal reading band.",
                ],
                [
                  "lowStimulation",
                  "Low stimulation mode",
                  "Reduce motion, decoration, and visual intensity.",
                ],
                [
                  "movementBreaks",
                  "Movement breaks",
                  "Gently remind learners to pause during longer sessions.",
                ],
                [
                  "timedChallenges",
                  "Timed tasks",
                  "Optional. Disable when speed does not reflect knowledge.",
                ],
                [
                  "showStreaks",
                  "Show streaks",
                  "Optional habit signal; never treated as mastery evidence.",
                ],
                [
                  "spellingAffectsMastery",
                  "Spelling affects grammar mastery",
                  "Off by default so dyslexic spelling does not hide existing grammar knowledge.",
                ],
              ] as const
            ).map(([key, title, description]) => (
              <label
                className="flex items-start gap-3 rounded-xl border p-3 text-sm"
                key={key}
              >
                <input
                  checked={Boolean(
                    state.settings[key as keyof typeof state.settings],
                  )}
                  className="mt-1 size-4"
                  onChange={(event) =>
                    mutate((draft) => {
                      Object.assign(draft.settings, {
                        [key]: event.target.checked,
                      });
                    })
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
          <p className="text-sm" role="status">
            Settings are saved automatically and apply across the app.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Effectiveness Evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Score the same speaking and writing task from 0 to 100 before
            training, after the learning block, and again after 30 days. This
            separates real improvement and retention from simple completion.
          </p>
          <label className="grid gap-1.5 text-sm font-semibold">
            Personal communication goal
            <Input
              maxLength={240}
              onChange={(event) =>
                mutate((draft) => {
                  draft.outcomes.goal = event.target.value;
                })
              }
              value={state.outcomes.goal}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["baselineScore", "Baseline"],
                ["followupScore", "Follow-up"],
                ["retentionScore", "Retention after 30 days"],
              ] as const
            ).map(([key, label]) => (
              <label className="grid gap-1.5 text-sm font-semibold" key={key}>
                {label} · 0–100
                <Input
                  inputMode="numeric"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    mutate((draft) => {
                      const raw = event.target.value;
                      draft.outcomes[key] =
                        raw === ""
                          ? null
                          : Math.min(100, Math.max(0, Number(raw)));
                    })
                  }
                  type="number"
                  value={state.outcomes[key] ?? ""}
                />
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
            <input
              checked={state.outcomes.independentlyRated}
              className="mt-1 size-4"
              onChange={(event) =>
                mutate((draft) => {
                  draft.outcomes.independentlyRated = event.target.checked;
                })
              }
              type="checkbox"
            />
            <span>
              <strong className="block">
                Rated by another person
              </strong>
              <span className="text-muted-foreground">
                A teacher or independent assessor used the same rubric.
              </span>
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Assessor note
            <Input
              maxLength={500}
              onChange={(event) =>
                mutate((draft) => {
                  draft.outcomes.assessorNote = event.target.value;
                })
              }
              placeholder="Optional; do not enter sensitive personal data"
              value={state.outcomes.assessorNote}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning and Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="settings-row">
            <Label htmlFor="minimum-words">Minimum words per answer</Label>
            <Input
              autoComplete="off"
              id="minimum-words"
              inputMode="numeric"
              max={200}
              min={5}
              name="minimum-words"
              onChange={(event) => setMinWords(Number(event.target.value))}
              type="number"
              value={minWords}
            />
          </div>
          <div className="settings-row">
            <Label htmlFor="save-audio">Save audio</Label>
            <Select
              id="save-audio"
              name="save-audio"
              onChange={(event) => setSaveAudio(event.target.value === "yes")}
              value={saveAudio ? "yes" : "no"}
            >
              <option value="yes">Yes, in browser IndexedDB</option>
              <option value="no">No</option>
            </Select>
          </div>
          <div className="settings-row">
            <strong className="text-sm">Grammar engine</strong>
            <div className="rounded-xl border bg-secondary p-3 text-sm">
              <span className="block">
                Offline baseline check + optional LanguageTool online
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Online feedback runs only after consent in the shared learner
                profile above.
              </span>
            </div>
          </div>
          <div className="settings-row">
            <Label htmlFor="language-tool-url">LanguageTool-Endpunkt</Label>
            <Input
              autoComplete="off"
              id="language-tool-url"
              name="language-tool-url"
              readOnly
              value="https://api.languagetool.org/v2/check"
            />
          </div>
          <div className="settings-row">
            <Label htmlFor="api-url">NestJS-Bewertungs-API</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                autoComplete="url"
                id="api-url"
                inputMode="url"
                name="assessment-api-url"
                onChange={(event) => setApiBaseUrl(event.target.value)}
                type="url"
                value={apiBaseUrl}
              />
              <Button onClick={testApi} variant="outline">
                <Server aria-hidden className="size-4" />
                Check
              </Button>
            </div>
          </div>
          <div className="settings-row">
            <strong className="text-sm">API status</strong>
            <div
              aria-live="polite"
              className="rounded-xl border bg-secondary p-3 text-sm"
              role="status"
            >
              {apiStatus}
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              mutate((draft) => {
                draft.settings = {
                  ...draft.settings,
                  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
                  minWords,
                  saveAudio,
                  onlineFeedback: draft.learner.allowOnlineAI,
                };
              });
              setStatus("Settings saved.");
            }}
          >
            <CheckCircle2 aria-hidden className="size-4" />
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="settings-row">
            <strong className="text-sm">PWA / App</strong>
            <div className="rounded-xl border bg-secondary p-3 text-sm">
              {platform.pwa}
            </div>
          </div>
          <div className="settings-row">
            <strong className="text-sm">Browser storage</strong>
            <div className="rounded-xl border bg-secondary p-3 text-sm">
              {platform.storage}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays aria-hidden className="size-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Due reviews and active daily plans are synced automatically after
            you connect your Google account.
          </p>
          <div className="rounded-xl border bg-secondary p-3 text-sm">
            {!calendar?.available
              ? "Open the installed Windows app to connect Google Calendar."
              : calendar.connected
                ? `Connected as ${calendar.email}`
                : calendar.configured
                  ? "Ready to connect"
                  : "Calendar configuration is missing in this installation."}
          </div>
          <div className="flex flex-wrap gap-2">
            {calendar?.connected ? (
              <>
                <Button
                  disabled={calendarBusy}
                  onClick={syncCalendar}
                  variant="secondary"
                >
                  <RefreshCw aria-hidden className="size-4" />
                  Sync now
                </Button>
                <Button
                  disabled={calendarBusy}
                  onClick={disconnectCalendar}
                  variant="outline"
                >
                  <Unplug aria-hidden className="size-4" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                disabled={
                  calendarBusy || !calendar?.available || !calendar.configured
                }
                onClick={connectCalendar}
              >
                <CalendarDays aria-hidden className="size-4" />
                Connect Google Calendar
              </Button>
            )}
          </div>
          {calendarMessage ? (
            <p aria-live="polite" className="text-sm" role="status">
              {calendarMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Backup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="settings-row">
            <strong className="text-sm">Backup folder</strong>
            <div className="flex flex-col gap-2 rounded-xl border bg-secondary p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex min-w-0 items-center gap-2">
                {backupFolder ? (
                  <FolderCheck
                    aria-hidden
                    className="size-4 shrink-0 text-primary"
                  />
                ) : (
                  <FolderOpen aria-hidden className="size-4 shrink-0" />
                )}
                <span className="truncate">
                  {backupFolder ??
                    (folderPickerSupported
                      ? "No folder selected"
                      : "Browser download folder")}
                </span>
              </span>
              {folderPickerSupported ? (
                <Button
                  onClick={selectBackupFolder}
                  size="sm"
                  variant="outline"
                >
                  <FolderOpen aria-hidden className="size-4" />
                  {backupFolder ? "Change folder" : "Choose folder"}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData} variant="secondary">
              <Download aria-hidden className="size-4" />
              Export data
            </Button>
            <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold">
              <Upload aria-hidden className="size-4" />
              Import data
              <input
                accept="application/json"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = JSON.parse(await file.text()) as
                      AppState | Record<string, unknown>;
                    if ("version" in parsed && parsed.version === 27) {
                      replaceState(normalizeAppState(parsed));
                      setStatus("v27 backup imported.");
                    } else {
                      localStorage.setItem(
                        "GrammarAutomaticityV11_en",
                        JSON.stringify(parsed),
                      );
                      localStorage.removeItem("grammar-automaticity:v27");
                      setStatus(
                        "Legacy backup imported; migration will reload.",
                      );
                      window.location.reload();
                    }
                  } catch (error) {
                    setStatus(
                      error instanceof Error
                        ? error.message
                        : "Import failed.",
                    );
                  }
                }}
                type="file"
              />
            </label>
          </div>
          <p
            aria-live="polite"
            className="mt-4 rounded-xl border bg-secondary p-3 text-sm"
            role="status"
          >
            {status}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
