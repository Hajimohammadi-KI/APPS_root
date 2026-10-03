import type { StudioLanguage } from "./conversation-data";

export interface StoredEvaluationIssue {
  readonly message: string;
  readonly offset: number;
  readonly length: number;
  readonly replacements: readonly string[];
  readonly ruleId: string;
  readonly category: string;
}

export interface StoredConversationSession {
  readonly id: string;
  readonly createdAt: string;
  readonly language: StudioLanguage;
  readonly topicId: string;
  readonly transcript: string;
  readonly corrected: string;
  readonly durationSeconds: number;
  readonly wordCount: number;
  readonly wordsPerMinute: number;
  readonly provider: "LanguageTool";
  readonly checkedAt: string;
  readonly issues: readonly StoredEvaluationIssue[];
  readonly audio: Blob;
}

const DATABASE_NAME = "conversation-studio";
const STORE_NAME = "sessions";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("language", "language");
        store.createIndex("topicId", "topicId");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB could not be opened."));
  });
}

export async function saveConversationSession(
  session: StoredConversationSession,
): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(session);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("The session could not be saved."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ?? new Error("The save transaction was aborted."),
        );
    });
  } finally {
    database.close();
  }
}
