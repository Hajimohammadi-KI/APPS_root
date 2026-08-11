"use client";

import * as React from "react";
import { ArrowUpCircle, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReleaseManifest {
  version: string;
  changes: string[];
}

const fallbackRelease: ReleaseManifest = {
  version: "27.1.0",
  changes: [
    "Daily Training and Automaticity Mission now appear as one Today’s Practice route",
    "An original visual conversation coach",
    "Integrated Skills lessons open directly in Conversation Studio",
    "Listening playback and speaking practice are connected",
  ],
};

export function AppUpdateNotice() {
  const [registration, setRegistration] =
    React.useState<ServiceWorkerRegistration | null>(null);
  const [release, setRelease] = React.useState(fallbackRelease);
  const [ready, setReady] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const updatingRef = React.useRef(false);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;

    void fetch("/release-manifest.json", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (!active || !value || typeof value !== "object") return;
        const candidate = value as Partial<ReleaseManifest>;
        if (
          typeof candidate.version === "string" &&
          Array.isArray(candidate.changes) &&
          candidate.changes.every((item) => typeof item === "string")
        ) {
          setRelease({ version: candidate.version, changes: candidate.changes });
        }
      })
      .catch(() => undefined);

    const onControllerChange = () => {
      if (updatingRef.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    void navigator.serviceWorker.register("/sw.js").then((nextRegistration) => {
      if (!active) return;
      setRegistration(nextRegistration);
      if (nextRegistration.waiting) setReady(true);
      nextRegistration.addEventListener("updatefound", () => {
        const worker = nextRegistration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setReady(true);
          }
        });
      });
    });

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  if (!ready) return null;

  function installUpdate() {
    const waitingWorker = registration?.waiting;
    if (!waitingWorker) return;
    updatingRef.current = true;
    setUpdating(true);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <Card
      aria-labelledby="app-update-title"
      aria-live="polite"
      className="app-update-notice"
      role="dialog"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-800">
            <Sparkles aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-violet-700">
              Version {release.version} is ready
            </p>
            <CardTitle className="mt-1 text-xl" id="app-update-title">
              Update English Automaticity?
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-700">
          Your saved learning data will stay on this device. Nothing changes
          until you choose Update now.
        </p>
        <ul className="mt-3 space-y-1 pl-5 text-sm leading-6 text-slate-700">
          {release.changes.map((change) => (
            <li className="list-disc" key={change}>
              {change}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={updating} onClick={installUpdate}>
            <ArrowUpCircle aria-hidden />
            {updating ? "Updating..." : "Update now"}
          </Button>
          <Button onClick={() => setReady(false)} variant="outline">
            <Clock3 aria-hidden /> Later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
