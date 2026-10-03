import { sha256 } from "./backup";
import type { Language } from "./contracts";
export interface StoredRecording {
  id: string;
  blob: Blob;
  sha256: string;
  durationMs: number;
  createdAt: string;
  language: Language;
  taskId: string;
}
function openMedia(
  factory: IDBFactory,
  language: Language,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(`automaticity-v2-${language}`, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("audio", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function storeRecording(
  factory: IDBFactory,
  input: Omit<StoredRecording, "sha256">,
): Promise<StoredRecording> {
  if (!input.blob.size || input.durationMs <= 0)
    throw new Error("No playable recording was captured.");
  const row = {
    ...input,
    sha256: await sha256(await input.blob.arrayBuffer()),
  };
  const db = await openMedia(factory, input.language);
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("audio", "readwrite");
      tx.objectStore("audio").put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
  return row;
}
export async function readRecording(
  factory: IDBFactory,
  language: Language,
  id: string,
): Promise<StoredRecording | null> {
  const db = await openMedia(factory, language);
  try {
    return await new Promise((resolve, reject) => {
      const req = db
        .transaction("audio", "readonly")
        .objectStore("audio")
        .get(id);
      req.onsuccess = () =>
        resolve((req.result as StoredRecording | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Use active visible time; background tabs and interrupted tasks do not look fluent. */
export class ResponseTimer {
  private active = 0;
  private last: number;
  private visible = true;
  private first: number | null = null;
  constructor(private readonly clock: () => number = () => performance.now()) {
    this.last = clock();
  }
  visibility(visible: boolean): void {
    this.tick();
    this.visible = visible;
  }
  private tick(): void {
    const next = this.clock();
    if (this.visible) this.active += Math.max(0, next - this.last);
    this.last = next;
  }
  input(): void {
    this.tick();
    if (this.first === null) this.first = this.active;
  }
  read(): { activeMs: number; firstInputMs: number | null } {
    this.tick();
    return {
      activeMs: Math.round(this.active),
      firstInputMs: this.first === null ? null : Math.round(this.first),
    };
  }
}
