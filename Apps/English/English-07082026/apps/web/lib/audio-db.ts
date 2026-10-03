export interface AudioRecord {
  id: string;
  blob: Blob;
  createdAt: string;
  grammarTitle: string;
  topic: string;
  transcript: string;
  corrected: string;
  repetitionStatus: "new" | "listened" | "repeated";
}

const DB_NAME = "GrammarAutomaticityV27";
const STORE = "audio";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putAudio(record: AudioRecord) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = database
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function listAudio() {
  const database = await openDatabase();
  return new Promise<AudioRecord[]>((resolve, reject) => {
    const request = database
      .transaction(STORE, "readonly")
      .objectStore(STORE)
      .getAll();
    request.onsuccess = () => resolve(request.result as AudioRecord[]);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAudio(id: string) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const request = database
      .transaction(STORE, "readwrite")
      .objectStore(STORE)
      .delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
