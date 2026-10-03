import { type BrowserPersistence, sha256 } from "./backup";
import { isRecord, type Language } from "./contracts";
import { ownsStorageKey } from "./storage";
export const migrationDatabaseName = (language: Language) =>
  `automaticity-migration-v2-${language}`;
/** Keep large legacy snapshots in IndexedDB so migration does not double the
 * app's small localStorage allocation. The first committed copy is immutable. */
export async function preserveLegacyStateDurable(
  persistence: BrowserPersistence,
  language: Language,
  at: string,
): Promise<{ status: "saved" | "already_saved"; keys: number }> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = persistence.indexedDB.open(migrationDatabaseName(language), 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("snapshots", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error("Close other app tabs before preserving learning data."),
      );
  });
  const read = () =>
    new Promise<unknown>((resolve, reject) => {
      const req = db
        .transaction("snapshots", "readonly")
        .objectStore("snapshots")
        .get("legacy");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const check = async (value: unknown) => {
    if (
      !isRecord(value) ||
      typeof value.payload !== "string" ||
      typeof value.sha256 !== "string" ||
      (await sha256(value.payload)) !== value.sha256
    )
      throw new Error(
        "The original migration snapshot is unreadable; it was not overwritten.",
      );
    const payload: unknown = JSON.parse(value.payload);
    if (
      !isRecord(payload) ||
      payload.language !== language ||
      !Array.isArray(payload.entries)
    )
      throw new Error("Wrong migration snapshot language or layout.");
    return payload.entries.length;
  };
  try {
    const existing = await read();
    if (existing !== undefined)
      return { status: "already_saved", keys: await check(existing) };
    const entries: [string, string][] = [];
    for (let index = 0; index < persistence.storage.length; index++) {
      const key = persistence.storage.key(index);
      if (
        !key ||
        key.startsWith(`automaticity:v2:${language}:`) ||
        !ownsStorageKey(key, language)
      )
        continue;
      const value = persistence.storage.getItem(key);
      if (value !== null) entries.push([key, value]);
    }
    const payload = JSON.stringify({
      version: 2,
      language,
      at,
      interpretation: "legacy-unqualified",
      entries,
    });
    const row = { id: "legacy", payload, sha256: await sha256(payload) };
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("snapshots", "readwrite");
        tx.objectStore("snapshots").add(row);
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error);
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "ConstraintError")
        return { status: "already_saved", keys: await check(await read()) };
      throw error;
    }
    return { status: "saved", keys: await check(await read()) };
  } finally {
    db.close();
  }
}
