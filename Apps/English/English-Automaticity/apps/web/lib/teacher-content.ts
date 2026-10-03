export type TeacherContentKind =
  "verb" | "example" | "exercise" | "conversation";
export type TeacherContentStatus = "draft" | "review" | "published";

export type TeacherContentPackage = {
  readonly format: "automaticity-teacher-content";
  readonly version: 1;
  readonly exportedAt: string;
  readonly items: readonly TeacherContentItem[];
};

export interface TeacherContentItem {
  id: string;
  kind: TeacherContentKind;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  body: string;
  contextKey: string;
  status?: TeacherContentStatus;
  audioName?: string;
  audioType?: string;
  updatedAt: string;
}

function contextSlug(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFD")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "")
    .slice(0, 48);
}

export function ensureTeacherContextKey(item: TeacherContentItem) {
  if (item.contextKey.trim()) return item.contextKey.trim();

  // Teachers supply teaching details; a stable internal key is generated so
  // audio can be linked without asking them to invent technical identifiers.
  const title = contextSlug(item.title) || "content";
  return `teacher.${item.level.toLowerCase()}.${item.kind}.${title}.${item.id.slice(0, 8)}`;
}

export function isPublishedTeacherContent(item: TeacherContentItem) {
  // Existing content predates publishing states, so it stays visible.
  return (item.status ?? "published") === "published";
}

const teacherContentKinds = new Set<TeacherContentKind>([
  "verb",
  "example",
  "exercise",
  "conversation",
]);
const teacherContentLevels = new Set<TeacherContentItem["level"]>([
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
]);
const teacherContentStatuses = new Set<TeacherContentStatus>([
  "draft",
  "review",
  "published",
]);

export function createTeacherContentPackage(
  items: readonly TeacherContentItem[],
): TeacherContentPackage {
  // Text-only export is intentional: it is a free, portable backup and avoids
  // silently copying human recordings without the teacher's explicit consent.
  return {
    format: "automaticity-teacher-content",
    version: 1,
    exportedAt: new Date().toISOString(),
    items: items.map(
      ({ audioName: _audioName, audioType: _audioType, ...item }) => item,
    ),
  };
}

export function parseTeacherContentPackage(
  value: unknown,
): TeacherContentItem[] {
  if (!value || typeof value !== "object") {
    throw new Error("Choose a teacher content package JSON file.");
  }
  const source = value as Partial<TeacherContentPackage>;
  if (
    source.format !== "automaticity-teacher-content" ||
    source.version !== 1 ||
    !Array.isArray(source.items)
  ) {
    throw new Error("This file is not a supported teacher content package.");
  }
  return source.items.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item ${index + 1} is invalid.`);
    }
    const candidate = item as Partial<TeacherContentItem>;
    if (
      typeof candidate.id !== "string" ||
      !teacherContentKinds.has(candidate.kind as TeacherContentKind) ||
      !teacherContentLevels.has(
        candidate.level as TeacherContentItem["level"],
      ) ||
      typeof candidate.title !== "string" ||
      typeof candidate.body !== "string" ||
      typeof candidate.contextKey !== "string" ||
      typeof candidate.updatedAt !== "string" ||
      (candidate.status !== undefined &&
        !teacherContentStatuses.has(candidate.status))
    ) {
      throw new Error(`Item ${index + 1} is incomplete or unsupported.`);
    }
    const kind = candidate.kind as TeacherContentKind;
    const level = candidate.level as TeacherContentItem["level"];
    const status = candidate.status as TeacherContentStatus | undefined;
    return {
      id: candidate.id,
      kind,
      level,
      title: candidate.title,
      body: candidate.body,
      contextKey: candidate.contextKey,
      ...(status ? { status } : {}),
      updatedAt: candidate.updatedAt,
    };
  });
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
    request.onerror = () =>
      reject(
        request.error ?? new Error("Teacher storage could not be opened."),
      );
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Teacher storage operation failed."));
  });
}

export async function listTeacherContent(): Promise<TeacherContentItem[]> {
  const db = await openDatabase();
  try {
    const items = await requestResult(
      db
        .transaction(CONTENT_STORE, "readonly")
        .objectStore(CONTENT_STORE)
        .getAll() as IDBRequest<TeacherContentItem[]>,
    );
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    db.close();
  }
}

export async function saveTeacherContent(
  item: TeacherContentItem,
  audio?: Blob | null,
): Promise<void> {
  const db = await openDatabase();
  try {
    const stores = audio ? [CONTENT_STORE, AUDIO_STORE] : [CONTENT_STORE];
    const transaction = db.transaction(stores, "readwrite");
    transaction.objectStore(CONTENT_STORE).put(item);
    if (audio) transaction.objectStore(AUDIO_STORE).put(audio, item.id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Teacher content could not be saved."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ?? new Error("Teacher content save was cancelled."),
        );
    });
  } finally {
    db.close();
  }
}

export async function deleteTeacherContent(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(
      [CONTENT_STORE, AUDIO_STORE],
      "readwrite",
    );
    transaction.objectStore(CONTENT_STORE).delete(id);
    transaction.objectStore(AUDIO_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ??
            new Error("Teacher content could not be deleted."),
        );
    });
  } finally {
    db.close();
  }
}

export async function getTeacherAudio(id: string): Promise<Blob | null> {
  const db = await openDatabase();
  try {
    return (await requestResult(
      db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).get(id),
    )) as Blob | null;
  } finally {
    db.close();
  }
}

export async function findTeacherContentByContextKey(
  contextKey: string,
): Promise<TeacherContentItem | null> {
  const items = await listTeacherContent();
  return (
    items.find(
      (item) =>
        item.contextKey === contextKey && isPublishedTeacherContent(item),
    ) ?? null
  );
}

export async function playTeacherAudioByContextKey(
  contextKey: string,
): Promise<boolean> {
  const item = await findTeacherContentByContextKey(contextKey);
  if (!item) return false;
  const blob = await getTeacherAudio(item.id);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), {
    once: true,
  });
  audio.addEventListener("error", () => URL.revokeObjectURL(url), {
    once: true,
  });
  await audio.play();
  return true;
}
