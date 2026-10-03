"use client";

const DATABASE_NAME = "grammar-automaticity-file-access";
const DATABASE_VERSION = 1;
const STORE_NAME = "directory-handles";
const BACKUP_DIRECTORY_KEY = "backup-directory";

export const BACKUP_FILE_NAME = "grammar-automaticity-v27-backup.json";

type FilePermissionMode = "read" | "readwrite";
type FilePermissionState = "denied" | "granted" | "prompt";

interface BackupFileHandle {
  createWritable: () => Promise<{
    close: () => Promise<void>;
    write: (data: string) => Promise<void>;
  }>;
}

export interface BackupDirectoryHandle {
  kind: "directory";
  name: string;
  getFileHandle: (
    name: string,
    options: { create: boolean },
  ) => Promise<BackupFileHandle>;
  queryPermission?: (options: {
    mode: FilePermissionMode;
  }) => Promise<FilePermissionState>;
  requestPermission?: (options: {
    mode: FilePermissionMode;
  }) => Promise<FilePermissionState>;
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: FilePermissionMode;
    startIn?: "desktop" | "documents" | "downloads";
  }) => Promise<BackupDirectoryHandle>;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("The backup folder could not be opened."));
  });
}

async function saveDirectoryHandle(handle: BackupDirectoryHandle) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(handle, BACKUP_DIRECTORY_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(
        transaction.error ??
          new Error("The selected backup folder could not be remembered."),
      );
  });
  database.close();
}

export function supportsBackupDirectoryPicker() {
  if (typeof window === "undefined") return false;
  return (
    window.isSecureContext &&
    typeof (window as DirectoryPickerWindow).showDirectoryPicker === "function"
  );
}

export async function chooseBackupDirectory() {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;
  if (!picker) {
    throw new Error("Folder selection is not supported by this browser.");
  }
  const handle = await picker({
    id: "grammar-automaticity-backups",
    mode: "readwrite",
    startIn: "documents",
  });
  await saveDirectoryHandle(handle);
  return handle;
}

export async function getBackupDirectory() {
  if (typeof indexedDB === "undefined") return null;
  const database = await openDatabase();
  const handle = await new Promise<BackupDirectoryHandle | null>(
    (resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(BACKUP_DIRECTORY_KEY);
      request.onsuccess = () =>
        resolve((request.result as BackupDirectoryHandle | undefined) ?? null);
      request.onerror = () =>
        reject(
          request.error ??
            new Error("The saved backup folder could not be read."),
        );
    },
  );
  database.close();
  return handle;
}

async function ensureWritePermission(handle: BackupDirectoryHandle) {
  const options = { mode: "readwrite" as const };
  if (!handle.queryPermission && !handle.requestPermission) return true;
  if ((await handle.queryPermission?.(options)) === "granted") return true;
  return (await handle.requestPermission?.(options)) === "granted";
}

export async function writeBackupToDirectory(
  handle: BackupDirectoryHandle,
  contents: string,
) {
  if (!(await ensureWritePermission(handle))) {
    throw new Error(
      "Folder access was not granted. Choose the folder again and allow access.",
    );
  }
  const file = await handle.getFileHandle(BACKUP_FILE_NAME, { create: true });
  const writable = await file.createWritable();
  await writable.write(contents);
  await writable.close();
}

export function downloadBackup(contents: string) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = BACKUP_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
}
