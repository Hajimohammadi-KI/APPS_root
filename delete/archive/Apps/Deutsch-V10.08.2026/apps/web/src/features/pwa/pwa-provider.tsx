"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type InstallPlatform =
  "windows" | "android" | "iphone" | "ipad" | "other";

export type InstallPromptResult = "accepted" | "dismissed" | "unavailable";

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{
    readonly outcome: "accepted" | "dismissed";
    readonly platform: string;
  }>;
  prompt(): Promise<void>;
}

interface StandaloneNavigator extends Navigator {
  readonly standalone?: boolean;
}

interface PwaContextValue {
  readonly platform: InstallPlatform;
  readonly installed: boolean;
  readonly canPrompt: boolean;
  readonly serviceWorkerReady: boolean;
  promptInstall(): Promise<InstallPromptResult>;
}

const PwaContext = createContext<PwaContextValue | undefined>(undefined);

function detectPlatform(): InstallPlatform {
  const userAgent = navigator.userAgent;
  const iPadDesktopMode =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPad/i.test(userAgent) || iPadDesktopMode) {
    return "ipad";
  }
  if (/iPhone|iPod/i.test(userAgent)) {
    return "iphone";
  }
  if (/Android/i.test(userAgent)) {
    return "android";
  }
  if (/Windows/i.test(userAgent)) {
    return "windows";
  }
  return "other";
}

function isStandalone(): boolean {
  const standaloneNavigator = navigator as StandaloneNavigator;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    standaloneNavigator.standalone === true ||
    navigator.userAgent.includes("DeutschFlowDesktop/")
  );
}

export function PwaProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [installed, setInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");

    function updateInstalledState() {
      setInstalled(isStandalone());
    }

    function captureInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setInstalled(true);
    }

    const initialStateTimer = window.setTimeout(() => {
      setPlatform(detectPlatform());
      updateInstalledState();
    }, 0);
    displayMode.addEventListener("change", updateInstalledState);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(initialStateTimer);
      displayMode.removeEventListener("change", updateInstalledState);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    let cancelled = false;

    async function registerWorker() {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        await navigator.serviceWorker.ready;
        if (!cancelled) {
          setServiceWorkerReady(true);
        }
      } catch {
        if (!cancelled) {
          setServiceWorkerReady(false);
        }
      }
    }

    void registerWorker();
    return () => {
      cancelled = true;
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallPromptResult> => {
    if (!installPrompt) {
      return "unavailable";
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    return choice.outcome;
  }, [installPrompt]);

  const value = useMemo<PwaContextValue>(
    () => ({
      platform,
      installed,
      canPrompt: installPrompt !== null,
      serviceWorkerReady,
      promptInstall,
    }),
    [installPrompt, installed, platform, promptInstall, serviceWorkerReady],
  );

  return <PwaContext value={value}>{children}</PwaContext>;
}

export function usePwa(): PwaContextValue {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used inside PwaProvider.");
  }
  return context;
}
