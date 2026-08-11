export type TeacherContentKind = "verb" | "example" | "exercise" | "conversation";

export interface TeacherContentItem {
  id: string;
  kind: TeacherContentKind;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  body: string;
  contextKey: string;
  audioName?: string;
  audioType?: string;
  updatedAt: string;
}

const DB_NAME = "english-automaticity-teacher-content";
const DB_VERSION = 1;
const CONTENT_STORE = "content";
const AUDIO_STORE = "audio";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Teacher storage could not be opened."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Teacher storage operation failed."));
  });
}

export async function listTeacherContent(): Promise<TeacherContentItem[]> {
  const db = await openDatabase();
  try {
    const items = await requestResult(db.transaction(CONTENT_STORE, "readonly").objectStore(CONTENT_STORE).getAll() as IDBRequest<TeacherContentItem[]>);
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    db.close();
  }
}

export async function saveTeacherContent(item: TeacherContentItem, audio?: Blob | null): Promise<void> {
  const db = await openDatabase();
  try {
    const stores = audio ? [CONTENT_STORE, AUDIO_STORE] : [CONTENT_STORE];
    const transaction = db.transaction(stores, "readwrite");
    transaction.objectStore(CONTENT_STORE).put(item);
    if (audio) transaction.objectStore(AUDIO_STORE).put(audio, item.id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Teacher content could not be saved."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Teacher content save was cancelled."));
    });
  } finally {
    db.close();
  }
}

export async function deleteTeacherContent(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction([CONTENT_STORE, AUDIO_STORE], "readwrite");
    transaction.objectStore(CONTENT_STORE).delete(id);
    transaction.objectStore(AUDIO_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Teacher content could not be deleted."));
    });
  } finally {
    db.close();
  }
}

export async function getTeacherAudio(id: string): Promise<Blob | null> {
  const db = await openDatabase();
  try {
    return (await requestResult(db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).get(id))) as Blob | null;
  } finally {
    db.close();
  }
}

export async function findTeacherContentByContextKey(contextKey: string): Promise<TeacherContentItem | null> {
  const items = await listTeacherContent();
  return items.find((item) => item.contextKey === contextKey) ?? null;
}

export async function playTeacherAudioByContextKey(contextKey: string): Promise<boolean> {
  const item = await findTeacherContentByContextKey(contextKey);
  if (!item) return false;
  const blob = await getTeacherAudio(item.id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  audio.addEventListener("error", () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
  return true;
}
