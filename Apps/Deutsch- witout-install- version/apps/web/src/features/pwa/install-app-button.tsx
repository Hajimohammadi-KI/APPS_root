"use client";

import { useState } from "react";
import { CheckCircle2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  type InstallActionResult,
  useInstallApp,
} from "@/features/pwa/use-install-app";
import { cn } from "@/lib/utils";

const resultMessages: Record<InstallActionResult, string> = {
  accepted: "Installation bestätigt.",
  "android-downloaded":
    "APK heruntergeladen. Öffne die Datei, um DeutschFlow zu installieren.",
  dismissed: "Installation abgebrochen.",
  guidance: "Installationsschritte geöffnet.",
  installed: "DeutschFlow ist bereits installiert.",
  "windows-downloaded":
    "Setup heruntergeladen. Öffne die Datei und wähle deinen Installationsordner.",
};

export function InstallAppButton({
  surface,
}: Readonly<{ surface: "header" | "settings" }>) {
  const { install, installed, label } = useInstallApp();
  const [message, setMessage] = useState("");

  async function handleInstall() {
    const result = await install();
    setMessage(resultMessages[result]);
  }

  return (
    <>
      <Button
        type="button"
        size={surface === "header" ? "sm" : "default"}
        variant={installed ? "outline" : "default"}
        disabled={installed}
        className={cn(
          surface === "header" &&
            "bg-gradient-to-r from-violet-700 to-purple-500 text-white shadow-sm hover:from-violet-600 hover:to-purple-400",
        )}
        onClick={() => void handleInstall()}
      >
        {installed ? (
          <CheckCircle2 data-icon="inline-start" />
        ) : (
          <Download data-icon="inline-start" />
        )}
        <span className={cn(surface === "header" && "hidden sm:inline")}>
          {label}
        </span>
        {surface === "header" && (
          <span className="sr-only sm:hidden">{label}</span>
        )}
      </Button>
      {message && (
        <span
          className={cn(
            surface === "header"
              ? "sr-only"
              : "text-xs leading-5 text-muted-foreground",
          )}
          role="status"
        >
          {message}
        </span>
      )}
    </>
  );
}
