import type { Attempt, Language, Review } from "./model";

// Add stores without touching the legacy sessions store or its audio blobs.
const DATABASE = "conversation-studio";
export function openStudioDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      for (const name of ["attempts-v2", "reviews-v2"]) {
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Storage unavailable"));
    request.onblocked = () =>
      reject(
        new Error("Close older Conversation Studio tabs and retry saving."),
      );
  });
}
async function put(store: string, value: Attempt | Review): Promise<void> {
  const db = await openStudioDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () =>
        reject(tx.error ?? new Error("Draft could not be saved"));
    });
  } finally {
    db.close();
  }
}
// Serialize checkpoints and edits so a slow earlier write cannot overwrite a newer draft.
let writes = Promise.resolve();
function enqueue(store: string, value: Attempt | Review): Promise<void> {
  const operation = writes.catch(() => undefined).then(() => put(store, value));
  writes = operation;
  return operation;
}
export const saveAttempt = (attempt: Attempt) =>
  enqueue("attempts-v2", attempt);
export const saveReview = (review: Review) => enqueue("reviews-v2", review);
export async function readStudio(
  language: Language,
): Promise<{ attempts: Attempt[]; reviews: Review[] }> {
  const db = await openStudioDatabase();
  try {
    const read = <T extends { language: Language }>(store: string) =>
      new Promise<T[]>((resolve, reject) => {
        const request = db
          .transaction(store, "readonly")
          .objectStore(store)
          .getAll();
        request.onsuccess = () =>
          resolve(
            (request.result as T[]).filter(
              (item) => item.language === language,
            ),
          );
        request.onerror = () => reject(request.error);
      });
    const [attempts, reviews] = await Promise.all([
      read<Attempt>("attempts-v2"),
      read<Review>("reviews-v2"),
    ]);
    return {
      attempts: attempts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      reviews: reviews.sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    };
  } finally {
    db.close();
  }
}
