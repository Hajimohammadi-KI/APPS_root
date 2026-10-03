"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  recoverBeforeMount,
  preserveLegacyStateDurable,
} from "@automaticity/learning-core/automaticity";
export function LearningRecoveryBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      await recoverBeforeMount({ storage: localStorage, indexedDB }, "de");
      await preserveLegacyStateDurable(
        { storage: localStorage, indexedDB },
        "de",
        new Date().toISOString(),
      );
      if (active) setReady(true);
    })().catch((reason: unknown) => {
      if (active)
        setError(
          reason instanceof Error ? reason.message : "Storage unavailable",
        );
    });
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <main className="mx-auto max-w-xl p-8" role="alert">
        <h1>Lerndaten müssen wiederhergestellt werden</h1>
        <p>{error}</p>
        <p>
          Schließe andere App-Tabs und lade diese Seite neu. Vorhandene Daten
          wurden beibehalten.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Wiederherstellung erneut versuchen
        </button>
      </main>
    );
  if (!ready)
    return (
      <p role="status" className="p-8">
        Gespeicherte Lerndaten werden geprüft…
      </p>
    );
  return children;
}
