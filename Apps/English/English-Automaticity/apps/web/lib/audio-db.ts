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
  await runAudio("readwrite",store=>store.put(record));
}

export async function listAudio() {
  return await runAudio("readonly",store=>store.getAll()) as AudioRecord[];
}

export async function deleteAudio(id: string) {
  await runAudio("readwrite",store=>store.delete(id));
}

async function runAudio<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  const database = await openDatabase();
  try { return await new Promise<T>((resolve, reject) => {
    const transaction=database.transaction(STORE,mode);
    const request=operation(transaction.objectStore(STORE));
    transaction.oncomplete=()=>resolve(request.result);
    transaction.onabort=()=>reject(transaction.error??new Error("Audio transaction aborted"));
    request.onerror = () => reject(request.error);
  }); } finally { database.close(); }
}
