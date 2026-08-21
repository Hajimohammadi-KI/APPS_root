"use client";

import { useCallback, useMemo } from "react";

import { usePwa } from "@/features/pwa/pwa-provider";

export type InstallActionResult =
  | "accepted"
  | "android-downloaded"
  | "dismissed"
  | "guidance"
  | "installed"
  | "windows-downloaded";

const WINDOWS_INSTALLER_URL = "/downloads/DeutschFlow-Setup.exe";
const ANDROID_INSTALLER_URL = "/downloads/DeutschFlow-Android.apk";

function downloadInstaller(url: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function useInstallApp() {
  const { platform, installed, canPrompt, promptInstall } = usePwa();

  const label = useMemo(() => {
    if (installed) {
      return "App ist installiert";
    }
    if (platform === "windows") {
      return "Windows-App installieren";
    }
    if (platform === "android") {
      return "Android-App installieren";
    }
    return "App installieren";
  }, [installed, platform]);

  const install = useCallback(async (): Promise<InstallActionResult> => {
    if (installed) {
      return "installed";
    }
    if (platform === "windows") {
      downloadInstaller(WINDOWS_INSTALLER_URL, "DeutschFlow-Setup.exe");
      return "windows-downloaded";
    }
    if (platform === "android") {
      downloadInstaller(ANDROID_INSTALLER_URL, "DeutschFlow-Android.apk");
      return "android-downloaded";
    }
    if (canPrompt) {
      const result = await promptInstall();
      return result === "unavailable" ? "guidance" : result;
    }
    window.location.assign("/einstellungen#installationsschritte");
    return "guidance";
  }, [canPrompt, installed, platform, promptInstall]);

  return {
    install,
    installed,
    label,
    platform,
  } as const;
}
