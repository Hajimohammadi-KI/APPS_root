// Shared read/write access to the SAME completion storage the main Study
// Tracker (app/study-tracker.tsx) already uses -- not a second, parallel
// completion system. Both the tracker and the /projekt-fahrplan roadmap
// read and write:
//   - the same localStorage key ("cross-repository-study-tracker:state:v2"),
//     under the same { completedIds: string[], ... } shape, and
//   - the same POST /api/state { action: "toggle", taskId, completed }
//     contract (see app/api/state/route.ts).
// A task item checked complete in one page is therefore immediately
// reflected in the other; there is one source of truth, not two.
import { DEVICE_ONLY_STORAGE } from "./storage-mode";
import { migrateLegacyId, migrateLegacyIds } from "../app/plan-data";

export const TRACKER_STORAGE_KEY = "cross-repository-study-tracker:state:v2";

type StoredShape = {
  completedIds?: unknown;
};

function parseCompletedIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as StoredShape;
    const ids = Array.isArray(parsed.completedIds) ? parsed.completedIds : [];
    return new Set(ids.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function readLocalCompletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    const current = parseCompletedIds(raw);
    const migrated = migrateLegacyIds(current);
    if ([...current].some((id) => migrateLegacyId(id) !== id)) {
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      localStorage.setItem(
        TRACKER_STORAGE_KEY,
        JSON.stringify({ ...parsed, completedIds: [...migrated] }),
      );
    }
    return migrated;
  } catch {
    return new Set();
  }
}

function writeLocalToggle(taskId: string, completed: boolean): boolean {
  try {
    const raw = localStorage.getItem(TRACKER_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const current = parseCompletedIds(raw);
    if (completed) current.add(taskId);
    else current.delete(taskId);
    localStorage.setItem(
      TRACKER_STORAGE_KEY,
      JSON.stringify({ ...parsed, completedIds: [...current] }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch the authoritative completed-item set. Tries the server (unless the
 * app is running in device-only storage mode), falling back to the local
 * mirror on any failure -- identical fallback order to study-tracker.tsx.
 */
export async function loadCompletedIds(): Promise<Set<string>> {
  if (DEVICE_ONLY_STORAGE) return readLocalCompletedIds();
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) throw new Error("state-load-failed");
    const payload = (await response.json()) as {
      progress?: Record<string, boolean>;
    };
    const progress = payload.progress ?? {};
    const completed = new Set(
      Object.entries(progress)
        .filter(([, done]) => Boolean(done))
        .map(([taskId]) => migrateLegacyId(taskId)),
    );
    return completed;
  } catch {
    return readLocalCompletedIds();
  }
}

/**
 * Toggle a single task/item id using the exact same API action the Study
 * Tracker uses, then mirror the result to localStorage. Returns whether the
 * item ended up completed.
 */
export async function toggleTaskCompletion(
  taskId: string,
  completed: boolean,
): Promise<boolean> {
  if (DEVICE_ONLY_STORAGE) {
    writeLocalToggle(taskId, completed);
    return completed;
  }
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", taskId, completed }),
    });
    if (!response.ok) throw new Error("toggle-failed");
    const payload = (await response.json()) as { completed?: boolean };
    const resolved = Boolean(payload.completed);
    writeLocalToggle(taskId, resolved);
    return resolved;
  } catch {
    writeLocalToggle(taskId, completed);
    return completed;
  }
}
