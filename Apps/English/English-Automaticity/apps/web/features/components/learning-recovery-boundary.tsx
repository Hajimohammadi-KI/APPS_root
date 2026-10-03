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
      await recoverBeforeMount({ storage: localStorage, indexedDB }, "en");
      await preserveLegacyStateDurable(
        { storage: localStorage, indexedDB },
        "en",
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
        <h1>Learning data needs recovery</h1>
        <p>{error}</p>
        <p>
          Close other app tabs, then reload. Existing records have been kept.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Try recovery again
        </button>
      </main>
    );
  if (!ready)
    return (
      <p role="status" className="p-8">
        Checking saved learning data…
      </p>
    );
  return children;
}
