"use client";

import * as React from "react";
import {
  CheckCircle2,
  CircleHelp,
  Download,
  FolderCheck,
  FolderOpen,
  HardDrive,
  Monitor,
  Share2,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  chooseBackupDirectory,
  getBackupDirectory,
  supportsBackupDirectoryPicker,
} from "@/lib/backup-directory";

type InstallPlatform = "windows" | "android" | "ios" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function detectPlatform(): InstallPlatform {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIPadDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/android/.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/.test(userAgent) || isIPadDesktopMode) return "ios";
  if (/windows/.test(userAgent)) return "windows";
  return "other";
}

function isStandalone() {
  return (
    navigator.userAgent.includes("EnglishGrammarAutomaticityDesktop/") ||
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

const platformLabels: Record<InstallPlatform, string> = {
  android: "Android",
  ios: "iPhone / iPad",
  other: "This device",
  windows: "Windows",
};

export function InstallAppControl() {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [installPrompt, setInstallPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [platform, setPlatform] = React.useState<InstallPlatform>("other");
  const [backupFolder, setBackupFolder] = React.useState<string | null>(null);
  const [folderPickerSupported, setFolderPickerSupported] =
    React.useState(false);
  const [choosingFolder, setChoosingFolder] = React.useState(false);
  const [status, setStatus] = React.useState(
    "Choose a backup folder, then install the app.",
  );

  React.useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalledState = () => setInstalled(isStandalone());
    const handlePrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setStatus("English Automaticity is installed and ready to launch.");
    };

    setPlatform(detectPlatform());
    setFolderPickerSupported(supportsBackupDirectoryPicker());
    updateInstalledState();
    getBackupDirectory()
      .then((handle) => setBackupFolder(handle?.name ?? null))
      .catch(() => undefined);
    displayMode.addEventListener("change", updateInstalledState);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      displayMode.removeEventListener("change", updateInstalledState);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const openGuide = () => {
    if (installed) {
      setStatus("English Automaticity is already installed on this device.");
    } else if (installPrompt) {
      setStatus(
        "The app is ready. Choose a backup folder, then click Install.",
      );
    } else {
      setStatus("Follow the steps for your device.");
    }
    dialogRef.current?.showModal();
  };

  const selectBackupFolder = async () => {
    setChoosingFolder(true);
    try {
      const handle = await chooseBackupDirectory();
      setBackupFolder(handle.name);
      setStatus(
        `"${handle.name}" will be used for exported progress backups.`,
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus(
          "No folder selected. Your progress remains safely stored in the app.",
        );
      } else {
        setStatus(
          error instanceof Error
            ? error.message
            : "Could not choose the backup folder.",
        );
      }
    } finally {
      setChoosingFolder(false);
    }
  };

  const install = async () => {
    if (!installPrompt) {
      openGuide();
      return;
    }
    setStatus("Opening the browser's secure install dialog...");
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setStatus(
        "Installation confirmed. The app now appears with your other apps.",
      );
    } else {
      setStatus(
        "Installation canceled. You can reopen the guide anytime.",
      );
    }
    setInstallPrompt(null);
  };

  return (
    <>
      <div className="install-app-controls">
        <Button
          aria-label={
            installed
              ? "English Automaticity is installed"
              : "Install English Automaticity"
          }
          className="install-app-button"
          disabled={installed}
          onClick={openGuide}
          size="sm"
          variant={installed ? "outline" : "default"}
        >
          {installed ? (
            <CheckCircle2 aria-hidden className="size-4" />
          ) : (
            <Download aria-hidden className="size-4" />
          )}
          <span>{installed ? "Installed" : "Install app"}</span>
        </Button>
        <Button
          aria-label="Open installation guide"
          className="install-guide-button"
          onClick={openGuide}
          size="icon"
          title="Installation guide for Windows, Android, and iOS"
          variant="ghost"
        >
          <CircleHelp aria-hidden className="size-4" />
        </Button>
      </div>

      <dialog
        aria-labelledby="install-dialog-title"
        className="install-dialog"
        ref={dialogRef}
      >
        <div className="install-dialog-panel">
          <header className="install-dialog-header">
            <div>
              <Badge variant="success">Offline-capable PWA</Badge>
              <h2 id="install-dialog-title">Install English Automaticity</h2>
              <p>
                No programming knowledge needed. Set your backup folder and
                start installation like any other app.
              </p>
            </div>
            <form method="dialog">
              <Button
                aria-label="Close installation guide"
                size="icon"
                variant="ghost"
              >
                <X aria-hidden className="size-5" />
              </Button>
            </form>
          </header>

          <section
            aria-label="Complete installation package"
            className="install-setup-card"
          >
            <div className="install-setup-heading">
              <span className="install-platform-icon">
                <ShieldCheck aria-hidden className="size-5" />
              </span>
              <div>
                <h3>Everything required is included</h3>
                <p>
                  The Windows setup includes runtime dependencies. Slack,
                  Vercel, paid software, and extra developer tools are not
                  required. Calendar and online AI remain optional.
                </p>
              </div>
            </div>
          </section>

          <section
            aria-labelledby="install-setup-title"
            className="install-setup-card"
          >
            <div className="install-setup-heading">
              <span className="install-platform-icon">
                <HardDrive aria-hidden className="size-5" />
              </span>
              <div>
                <h3 id="install-setup-title">
                  1. Choose backup folder
                </h3>
                <p>
                  Lessons and progress stay in private app storage. The chosen
                  folder contains your readable exports.
                </p>
              </div>
            </div>
            <div className="install-folder-action">
              <div className="install-folder-status">
                {backupFolder ? (
                  <FolderCheck aria-hidden className="size-5" />
                ) : (
                  <FolderOpen aria-hidden className="size-5" />
                )}
                <span>
                  <strong>
                    {backupFolder
                      ? "Backup folder selected"
                      : "No folder selected yet"}
                  </strong>
                  <small>
                    {backupFolder ??
                      (folderPickerSupported
                        ? "You can change it later in Settings."
                        : "The browser asks for a save location on each export.")}
                  </small>
                </span>
              </div>
              {folderPickerSupported ? (
                <Button
                  disabled={choosingFolder}
                  onClick={selectBackupFolder}
                  variant="secondary"
                >
                  <FolderOpen aria-hidden className="size-4" />
                  {choosingFolder
                    ? "Opening folders..."
                    : backupFolder
                      ? "Change folder"
                      : "Choose folder"}
                </Button>
              ) : null}
            </div>
            <p className="install-location-note">
              The operating system chooses the protected install location. A
              website cannot change this system path.
            </p>
          </section>

          <div className="install-step-heading">
            <h3>2. Install on this device</h3>
            <p>Your current device is highlighted below.</p>
          </div>

          <div className="install-platform-grid">
            <article
              className="install-platform-card"
              data-current={platform === "windows"}
            >
              <span className="install-platform-icon">
                <Monitor aria-hidden className="size-5" />
              </span>
              <div>
                <div className="install-platform-title">
                  <h3>Windows</h3>
                  {platform === "windows" ? <Badge>Current device</Badge> : null}
                </div>
                <ol>
                  <li>
                    {installPrompt
                      ? "Click Install on this device below."
                      : "Use the install icon in the address bar of Edge or Chrome."}
                  </li>
                  <li>Confirm Install in the browser dialog.</li>
                  <li>Open the app from Start or pin it there.</li>
                </ol>
              </div>
            </article>

            <article
              className="install-platform-card"
              data-current={platform === "android"}
            >
              <span className="install-platform-icon">
                <Smartphone aria-hidden className="size-5" />
              </span>
              <div>
                <div className="install-platform-title">
                  <h3>Android</h3>
                  {platform === "android" ? <Badge>Current device</Badge> : null}
                </div>
                <ol>
                  <li>Open the HTTPS address in Chrome.</li>
                  <li>Tap Install app or open the browser menu.</li>
                  <li>Select Install app and confirm.</li>
                </ol>
              </div>
            </article>

            <article
              className="install-platform-card"
              data-current={platform === "ios"}
            >
              <span className="install-platform-icon">
                <Share2 aria-hidden className="size-5" />
              </span>
              <div>
                <div className="install-platform-title">
                  <h3>iPhone / iPad</h3>
                  {platform === "ios" ? <Badge>Current device</Badge> : null}
                </div>
                <ol>
                  <li>Open the HTTPS address in Safari.</li>
                  <li>Tap Share, then Add to Home Screen.</li>
                  <li>Tap Add and launch the new app.</li>
                </ol>
              </div>
            </article>
          </div>

          <div className="install-dialog-footer">
            <div aria-live="polite" role="status">
              <strong>{platformLabels[platform]}:</strong> {status}
            </div>
            {installPrompt && !installed ? (
              <Button onClick={install}>
                <Download aria-hidden className="size-4" />
                Install on this device
              </Button>
            ) : installed ? (
              <Badge variant="success">
                <CheckCircle2 aria-hidden className="size-4" />
                Installed
              </Badge>
            ) : (
              <span className="install-browser-hint">
                Follow the highlighted instructions above.
              </span>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
