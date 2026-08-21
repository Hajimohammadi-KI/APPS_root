import { LEGACY_STORAGE_KEY } from "@grammar/domain";

const AUDIO_STORE = "audio";

export interface AudioRecord {
  readonly id: string;
  readonly date: string;
  readonly topic: string;
  readonly transcript: string;
  readonly correctedTranscript?: string;
  readonly targetGrammar?: string;
  readonly repeatedAt?: string;
  readonly blob: Blob;
}

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(LEGACY_STORAGE_KEY, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(AUDIO_STORE)) {
        request.result.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const database = await openDatabase();
  if (!database) {
    return null;
  }
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = operation(
        database.transaction(AUDIO_STORE, mode).objectStore(AUDIO_STORE),
      );
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function saveAudio(record: AudioRecord): Promise<void> {
  await runRequest("readwrite", (store) => store.put(record));
}

export async function listAudio(): Promise<readonly AudioRecord[]> {
  return (await runRequest("readonly", (store) => store.getAll())) ?? [];
}

export async function deleteAudio(id: string): Promise<void> {
  await runRequest("readwrite", (store) => store.delete(id));
}

export async function markAudioRepeated(id: string): Promise<void> {
  const record = await runRequest<AudioRecord>("readonly", (store) =>
    store.get(id),
  );
  if (!record) {
    return;
  }
  await saveAudio({
    ...record,
    repeatedAt: new Date().toISOString(),
  });
}
