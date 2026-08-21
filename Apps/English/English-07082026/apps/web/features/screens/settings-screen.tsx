"use client";

import * as React from "react";
import { Download, Eye, PenLine, Sparkles, Wand2 } from "lucide-react";
import { buildLearningDataExport } from "@automaticity/learning-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppStore, type Settings } from "@/features/store/app-store";
import {
  BACKUP_FILE_NAME,
  chooseBackupDirectory,
  downloadBackup,
  getBackupDirectory,
  supportsBackupDirectoryPicker,
  writeBackupToDirectory,
} from "@/lib/backup-directory";

const TEXT_SCALE_OPTIONS: Array<{
  value: Settings["textScale"];
  label: string;
  hint: string;
}> = [
  { value: 100, label: "100%", hint: "Default text size" },
  { value: 112, label: "112%", hint: "Larger, easier-to-track text" },
  { value: 125, label: "125%", hint: "Largest text for maximum ease" },
];

export function SettingsScreen() {
  const { state, mutate } = useAppStore();
  const { settings } = state;
  const [exportStatus, setExportStatus] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  // supportsBackupDirectoryPicker() reads a browser API (File System Access)
  // that doesn't exist during SSR -- calling it directly in JSX rendered
  // "false" on the server and (on browsers that support it) "true" on the
  // client, a real hydration mismatch caught by the e2e suite. Deferring the
  // real value to an effect (client-only, post-mount) mirrors the same
  // pattern install-app-control.tsx already uses for the same API.
  const [folderPickerSupported, setFolderPickerSupported] =
    React.useState(false);

  React.useEffect(() => {
    setFolderPickerSupported(supportsBackupDirectoryPicker());
  }, []);

  async function exportData() {
    setExporting(true);
    setExportStatus("");
    // Export the normalized evidence ledger as well as the legacy app state.
    // Previously the learner-facing backup silently omitted every versioned
    // response/evidence/event written by the automaticity routes.
    const contents = JSON.stringify(
      buildLearningDataExport({
        language: "en",
        exportedAt: new Date().toISOString(),
        learnerState: state,
        storage: window.localStorage,
      }),
      null,
      2,
    );
    try {
      const hasDirectoryPicker = supportsBackupDirectoryPicker();
      const savedDirectory = hasDirectoryPicker
        ? await getBackupDirectory()
        : null;
      if (savedDirectory) {
        await writeBackupToDirectory(savedDirectory, contents);
        setExportStatus(`Backup saved to "${savedDirectory.name}".`);
      } else {
        downloadBackup(contents);
        setExportStatus(`Backup downloaded as "${BACKUP_FILE_NAME}".`);
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" || error.name === "SecurityError")
      ) {
        setExportStatus(
          "No backup folder is available yet. Downloading the file instead.",
        );
        downloadBackup(contents);
      } else {
        setExportStatus(
          error instanceof Error ? error.message : "Backup export failed.",
        );
      }
    } finally {
      setExporting(false);
    }
  }

  async function selectFolderAndExport() {
    try {
      await chooseBackupDirectory();
    } catch {
      // The learner can still export via a normal file download below.
    }
    await exportData();
  }

  return (
    <div className="page-stack settings-screen">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>
            Reading, focus, grammar-accuracy, and backup preferences. Changes
            apply immediately and are saved on this device — no developer
            knowledge required.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Eye aria-hidden className="mr-2 inline size-5" />
            Reading &amp; focus
          </CardTitle>
          <CardDescription>
            ADHD and dyslexia-friendly reading support. Any learner can turn
            these on or off — nothing here requires a diagnosis.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-section">
          <fieldset className="settings-row">
            <legend>Reading style</legend>
            <div
              aria-label="Reading style"
              className="settings-choice-group"
              role="radiogroup"
            >
              <label className="settings-choice">
                <input
                  checked={settings.readingProfile === "standard"}
                  name="reading-profile"
                  onChange={() =>
                    mutate((draft) => {
                      draft.settings.readingProfile = "standard";
                    })
                  }
                  type="radio"
                  value="standard"
                />
                <span>
                  <strong>Standard reading</strong>
                  <small>The app's regular font and layout.</small>
                </span>
              </label>
              <label className="settings-choice">
                <input
                  checked={settings.readingProfile === "dyslexia"}
                  name="reading-profile"
                  onChange={() =>
                    mutate((draft) => {
                      draft.settings.readingProfile = "dyslexia";
                    })
                  }
                  type="radio"
                  value="dyslexia"
                />
                <span>
                  <strong>Dyslexia-friendly reading</strong>
                  <small>
                    Wider letter spacing, taller lines, and a dyslexia-tested
                    font.
                  </small>
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset className="settings-row">
            <legend>Text size</legend>
            <div
              aria-label="Text size"
              className="settings-choice-group"
              role="radiogroup"
            >
              {TEXT_SCALE_OPTIONS.map((option) => (
                <label className="settings-choice" key={option.value}>
                  <input
                    checked={settings.textScale === option.value}
                    name="text-scale"
                    onChange={() =>
                      mutate((draft) => {
                        draft.settings.textScale = option.value;
                      })
                    }
                    type="radio"
                    value={option.value}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="settings-row">
            <span id="low-stimulation-label">Motion &amp; visual intensity</span>
            <label className="settings-toggle">
              <input
                aria-describedby="low-stimulation-label"
                checked={settings.lowStimulation}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.settings.lowStimulation = event.target.checked;
                  })
                }
                type="checkbox"
              />
              <span>
                <strong>Reduce motion and visual intensity</strong>
                <small>
                  Turns off animations, decorative shapes, and drop shadows
                  across the app.
                </small>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <PenLine aria-hidden className="mr-2 inline size-5" />
            Grammar accuracy
          </CardTitle>
          <CardDescription>
            Grammar automaticity is the goal here, not spelling perfection.
            Spelling mistakes are always corrected and shown as feedback, but
            by default they do not block a grammar target or count heavily
            against your score — matching how a dysgraphia-friendly practice
            flow should work.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-section">
          <div className="settings-row">
            <span id="spelling-mastery-label">Spelling and mastery</span>
            <label className="settings-toggle">
              <input
                aria-describedby="spelling-mastery-label"
                checked={settings.spellingAffectsMastery}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.settings.spellingAffectsMastery =
                      event.target.checked;
                  })
                }
                type="checkbox"
              />
              <span>
                <strong>
                  Also require correct spelling for grammar mastery
                </strong>
                <small>
                  Off by default. Turn this on only if you specifically want
                  spelling accuracy to affect whether an answer passes.
                </small>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Wand2 aria-hidden className="mr-2 inline size-5" />
            Online grammar check
          </CardTitle>
          <CardDescription>
            Optional. Sends your typed practice answers to a language-check
            service for stronger corrections and mastery evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-section">
          <div className="settings-row">
            <span id="online-feedback-label">Online AI feedback</span>
            <label className="settings-toggle">
              <input
                aria-describedby="online-feedback-label"
                checked={settings.onlineFeedback}
                onChange={(event) =>
                  mutate((draft) => {
                    draft.settings.onlineFeedback = event.target.checked;
                  })
                }
                type="checkbox"
              />
              <span>
                <strong>Allow optional online AI grammar check</strong>
                <small>
                  Off by default. Practice still works offline without this.
                </small>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Download aria-hidden className="mr-2 inline size-5" />
            Backup your progress
          </CardTitle>
          <CardDescription>
            Save a readable, versioned copy of your progress, settings, saved
            errors, responses, and learning evidence to a folder you choose,
            or download it directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="settings-section">
          <div className="settings-export-actions">
            <Button disabled={exporting} onClick={() => void exportData()}>
              <Download aria-hidden className="size-4" />
              {exporting ? "Exporting..." : "Export data"}
            </Button>
            {folderPickerSupported ? (
              <Button
                disabled={exporting}
                onClick={() => void selectFolderAndExport()}
                variant="outline"
              >
                Choose a different backup folder
              </Button>
            ) : null}
          </div>
          {exportStatus ? (
            <p aria-live="polite" className="settings-export-status shared-status-enter" role="status">
              {exportStatus}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Sparkles aria-hidden className="mr-2 inline size-5" />
            About these settings
          </CardTitle>
        </CardHeader>
        <CardContent className="settings-section">
          <p className="settings-note">
            The reading ruler and read-aloud controls stay available from the{" "}
            <Badge variant="secondary">Reading and focus settings</Badge>{" "}
            button in the top toolbar on every screen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
