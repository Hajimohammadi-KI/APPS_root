import { isRecord, validDate, validHash, type Language } from "./contracts";
import { ownsStorageKey, type LocalStore } from "./storage";

type EncodedValue =
  | null
  | boolean
  | number
  | string
  | { kind: "array"; values: EncodedValue[] }
  | { kind: "object"; entries: [string, EncodedValue][] }
  | {
      kind: "blob";
      mime: string;
      base64: string;
      sha256: string;
      bytes: number;
    };
export interface DatabaseSnapshot {
  name: string;
  version: number;
  stores: {
    name: string;
    keyPath: string | null;
    records: { key: string | number; value: EncodedValue }[];
  }[];
}
export interface CompleteBackup {
  kind: "automaticity.complete-backup";
  version: 2;
  language: Language;
  createdAt: string;
  localStorage: [string, string][];
  databases: DatabaseSnapshot[];
  sha256: string;
}
export interface BrowserPersistence {
  storage: LocalStore;
  indexedDB: IDBFactory;
}
export const databaseNames = (language: Language) =>
  language === "en"
    ? [
        "GrammarAutomaticityV27",
        "english-automaticity-teacher-content",
        "automaticity-v2-en",
        "automaticity-migration-v2-en",
      ]
    : [
        "GrammarAutomaticityV11_de",
        "deutsch-automaticity-teacher-content",
        "automaticity-v2-de",
        "automaticity-migration-v2-de",
      ];
const journalName = (language: Language) =>
  `automaticity-recovery-v2-${language}`;
const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
};
const base64ToBytes = (value: string) =>
  Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const SHA256_K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
  0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
  0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
  0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
  0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
  0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
  0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
  0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value: number, bits: number) {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256Fallback(bytes: Uint8Array) {
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const bitLength = bytes.length * 8;
  for (let index = 0; index < 8; index++) {
    padded[paddedLength - 1 - index] = (bitLength / 2 ** (index * 8)) & 0xff;
  }

  const hash = Uint32Array.from([
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19,
  ]);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index++) {
      const position = offset + index * 4;
      words[index] =
        (padded[position]! << 24) |
        (padded[position + 1]! << 16) |
        (padded[position + 2]! << 8) |
        padded[position + 3]!;
    }
    for (let index = 16; index < 64; index++) {
      const first =
        rotateRight(words[index - 15]!, 7) ^
        rotateRight(words[index - 15]!, 18) ^
        (words[index - 15]! >>> 3);
      const second =
        rotateRight(words[index - 2]!, 17) ^
        rotateRight(words[index - 2]!, 19) ^
        (words[index - 2]! >>> 10);
      words[index] =
        (words[index - 16]! + first + words[index - 7]! + second) >>> 0;
    }

    let a = hash[0]!;
    let b = hash[1]!;
    let c = hash[2]!;
    let d = hash[3]!;
    let e = hash[4]!;
    let f = hash[5]!;
    let g = hash[6]!;
    let h = hash[7]!;
    for (let index = 0; index < 64; index++) {
      const sum1 =
        rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temporary1 = (h + sum1 + choose + SHA256_K[index]! + words[index]!) >>> 0;
      const sum0 =
        rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }

    hash[0] = (hash[0]! + a) >>> 0;
    hash[1] = (hash[1]! + b) >>> 0;
    hash[2] = (hash[2]! + c) >>> 0;
    hash[3] = (hash[3]! + d) >>> 0;
    hash[4] = (hash[4]! + e) >>> 0;
    hash[5] = (hash[5]! + f) >>> 0;
    hash[6] = (hash[6]! + g) >>> 0;
    hash[7] = (hash[7]! + h) >>> 0;
  }

  return [...hash].map((value) => value.toString(16).padStart(8, "0")).join("");
}

export async function sha256(value: string | ArrayBuffer): Promise<string> {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    return [...new Uint8Array(await subtle.digest("SHA-256", bytes))]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return sha256Fallback(new Uint8Array(bytes));
}
async function encode(value: unknown): Promise<EncodedValue> {
  if (value === null || typeof value === "string" || typeof value === "boolean")
    return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Blob) {
    const buffer = await value.arrayBuffer();
    return {
      kind: "blob",
      mime: value.type,
      base64: bytesToBase64(new Uint8Array(buffer)),
      sha256: await sha256(buffer),
      bytes: buffer.byteLength,
    };
  }
  if (Array.isArray(value))
    return { kind: "array", values: await Promise.all(value.map(encode)) };
  if (
    isRecord(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  )
    return {
      kind: "object",
      entries: await Promise.all(
        Object.entries(value)
          .filter(([, v]) => v !== undefined)
          .map(
            async ([key, v]) =>
              [key, await encode(v)] as [string, EncodedValue],
          ),
      ),
    };
  throw new Error(
    "A stored record has an unsupported data type; export stopped without dropping it.",
  );
}
async function decode(value: unknown, depth = 0): Promise<unknown> {
  if (depth > 30) throw new Error("Backup record is too deeply nested.");
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  )
    return value;
  if (!isRecord(value)) throw new Error("Invalid encoded backup value.");
  if (value.kind === "array" && Array.isArray(value.values))
    return Promise.all(value.values.map((row) => decode(row, depth + 1)));
  if (value.kind === "object" && Array.isArray(value.entries)) {
    const result: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    for (const row of value.entries) {
      if (
        !Array.isArray(row) ||
        row.length !== 2 ||
        typeof row[0] !== "string" ||
        Object.hasOwn(result, row[0])
      )
        throw new Error("Invalid duplicate object field.");
      Object.defineProperty(result, row[0], {
        value: await decode(row[1], depth + 1),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return result;
  }
  if (
    value.kind === "blob" &&
    typeof value.base64 === "string" &&
    typeof value.mime === "string" &&
    validHash(value.sha256)
  ) {
    const bytes = base64ToBytes(value.base64);
    if (
      bytes.byteLength !== value.bytes ||
      (await sha256(bytes.buffer)) !== value.sha256
    )
      throw new Error("Audio/file checksum mismatch.");
    return new Blob([bytes], { type: value.mime });
  }
  throw new Error("Unsupported backup encoding.");
}
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}
function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Transaction aborted"));
  });
}
function existingDatabase(
  factory: IDBFactory,
  name: string,
): Promise<IDBDatabase | null> {
  return new Promise((resolve, reject) => {
    const opening = factory.open(name);
    let absent = false;
    opening.onupgradeneeded = () => {
      absent = true;
      opening.transaction?.abort();
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => (absent ? resolve(null) : reject(opening.error));
    opening.onblocked = () =>
      reject(
        new Error("Close other app tabs before backing up this database."),
      );
  });
}
async function snapshotDatabase(
  factory: IDBFactory,
  name: string,
): Promise<DatabaseSnapshot | null> {
  const db = await existingDatabase(factory, name);
  if (!db) return null;
  try {
    const names = [...db.objectStoreNames];
    const transaction = db.transaction(names, "readonly");
    const done = completed(transaction);
    const pending = names.map(async (storeName) => {
      const store = transaction.objectStore(storeName);
      if (Array.isArray(store.keyPath) || store.autoIncrement)
        throw new Error("Unsupported database schema; export stopped.");
      const keysRequest = request(store.getAllKeys());
      const valuesRequest = request(store.getAll());
      const [keys, values] = await Promise.all([keysRequest, valuesRequest]);
      const records = await Promise.all(
        keys.map(async (key, index) => {
          if (typeof key !== "string" && typeof key !== "number")
            throw new Error("Unsupported database key.");
          return { key, value: await encode(values[index]) };
        }),
      );
      return {
        name: storeName,
        keyPath: store.keyPath as string | null,
        records,
      };
    });
    const stores = await Promise.all(pending);
    await done;
    return { name, version: db.version, stores };
  } finally {
    db.close();
  }
}
export async function captureCompleteBackup(
  persistence: BrowserPersistence,
  language: Language,
  now = new Date().toISOString(),
  overrides: readonly [string, string][] = [],
): Promise<CompleteBackup> {
  const entries: [string, string][] = [];
  for (let i = 0; i < persistence.storage.length; i++) {
    const key = persistence.storage.key(i);
    if (key && ownsStorageKey(key, language)) {
      const value = persistence.storage.getItem(key);
      if (value !== null) entries.push([key, value]);
    }
  }
  for (const [key, value] of overrides) {
    if (!ownsStorageKey(key, language))
      throw new Error("Snapshot override does not belong to this language.");
    const index = entries.findIndex(([existing]) => existing === key);
    if (index >= 0) entries[index] = [key, value];
    else entries.push([key, value]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dbs = await Promise.all(
    databaseNames(language).map((name) =>
      snapshotDatabase(persistence.indexedDB, name),
    ),
  );
  const payload = {
    kind: "automaticity.complete-backup" as const,
    version: 2 as const,
    language,
    createdAt: now,
    localStorage: entries,
    databases: dbs.filter((row): row is DatabaseSnapshot => row !== null),
  };
  return { ...payload, sha256: await sha256(JSON.stringify(payload)) };
}
export async function validateCompleteBackup(
  value: unknown,
  language: Language,
): Promise<CompleteBackup> {
  if (
    !isRecord(value) ||
    value.kind !== "automaticity.complete-backup" ||
    value.version !== 2 ||
    value.language !== language ||
    !validDate(value.createdAt) ||
    !validHash(value.sha256) ||
    !Array.isArray(value.localStorage) ||
    !Array.isArray(value.databases)
  )
    throw new Error("This is not a compatible backup for this language.");
  const { sha256: checksum, ...payload } = value;
  if ((await sha256(JSON.stringify(payload))) !== checksum)
    throw new Error("Backup checksum mismatch; nothing was restored.");
  const keys = new Set<string>();
  for (const entry of value.localStorage) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== "string" ||
      typeof entry[1] !== "string" ||
      !ownsStorageKey(entry[0], language) ||
      keys.has(entry[0])
    )
      throw new Error("Invalid or duplicate backup storage key.");
    keys.add(entry[0]);
  }
  const databases = new Set<string>();
  for (const db of value.databases) {
    if (
      !isRecord(db) ||
      typeof db.name !== "string" ||
      !databaseNames(language).includes(db.name) ||
      databases.has(db.name) ||
      !Number.isSafeInteger(db.version) ||
      (db.version as number) < 1 ||
      !Array.isArray(db.stores)
    )
      throw new Error("Invalid backup database.");
    databases.add(db.name);
    const names = new Set<string>();
    for (const store of db.stores) {
      if (
        !isRecord(store) ||
        typeof store.name !== "string" ||
        !store.name ||
        names.has(store.name) ||
        (store.keyPath !== null && typeof store.keyPath !== "string") ||
        !Array.isArray(store.records)
      )
        throw new Error("Invalid backup store.");
      names.add(store.name);
      const recordKeys = new Set<string>();
      for (const record of store.records) {
        if (
          !isRecord(record) ||
          !(
            typeof record.key === "string" ||
            (typeof record.key === "number" && Number.isFinite(record.key))
          )
        )
          throw new Error("Invalid backup record key.");
        const key = `${typeof record.key}:${record.key}`;
        if (recordKeys.has(key))
          throw new Error("Duplicate backup record key.");
        recordKeys.add(key);
        const decoded = await decode(record.value);
        if (
          store.keyPath !== null &&
          (!isRecord(decoded) ||
            decoded[store.keyPath as string] !== record.key)
        )
          throw new Error("Backup record key does not match its identity.");
      }
    }
  }
  return value as unknown as CompleteBackup;
}
async function journal(
  factory: IDBFactory,
  language: Language,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = factory.open(journalName(language), 1);
    opening.onupgradeneeded = () =>
      opening.result.createObjectStore("recovery");
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error);
  });
}
async function writeJournal(
  factory: IDBFactory,
  language: Language,
  value: unknown,
): Promise<void> {
  const db = await journal(factory, language);
  try {
    const transaction = db.transaction("recovery", "readwrite");
    const done = completed(transaction);
    transaction.objectStore("recovery").put(value, "pending");
    await done;
  } finally {
    db.close();
  }
}
async function applySnapshot(
  p: BrowserPersistence,
  backup: CompleteBackup,
): Promise<void> {
  // Decode before opening write transactions, which must not await external work.
  for (const snapshot of backup.databases) {
    const values = await Promise.all(
      snapshot.stores.map(async (store) => ({
        ...store,
        records: await Promise.all(
          store.records.map(async (row) => ({
            key: row.key,
            value: await decode(row.value),
          })),
        ),
      })),
    );
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = p.indexedDB.open(snapshot.name, snapshot.version);
      opening.onupgradeneeded = () => {
        for (const store of snapshot.stores)
          if (!opening.result.objectStoreNames.contains(store.name))
            opening.result.createObjectStore(
              store.name,
              store.keyPath === null ? undefined : { keyPath: store.keyPath },
            );
      };
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
      opening.onblocked = () =>
        reject(new Error("Close other app tabs before restoring."));
    });
    try {
      for (const store of values) {
        if (!db.objectStoreNames.contains(store.name))
          throw new Error("Database layout differs; restore stopped.");
      }
      const transaction = db.transaction(
        values.map((store) => store.name),
        "readwrite",
      );
      const done = completed(transaction);
      for (const store of values) {
        const target = transaction.objectStore(store.name);
        if (target.keyPath !== store.keyPath) {
          transaction.abort();
          await done;
        }
        target.clear();
        for (const row of store.records) {
          if (store.keyPath === null) target.put(row.value, row.key);
          else target.put(row.value);
        }
      }
      await done;
    } finally {
      db.close();
    }
  }
  // Keep databases absent from a backup: additive restore avoids deleting newer media.
  const managed = new Set(backup.localStorage.map(([key]) => key));
  const existing: string[] = [];
  for (let i = 0; i < p.storage.length; i++) {
    const key = p.storage.key(i);
    if (key && ownsStorageKey(key, backup.language)) existing.push(key);
  }
  for (const [key, value] of backup.localStorage) p.storage.setItem(key, value);
  for (const key of existing) if (!managed.has(key)) p.storage.removeItem(key);
  for (const [key, value] of backup.localStorage)
    if (p.storage.getItem(key) !== value)
      throw new Error("Restored state could not be verified.");
}
export async function recoverInterruptedRestore(
  persistence: BrowserPersistence,
  language: Language,
): Promise<boolean> {
  const db = await journal(persistence.indexedDB, language);
  let pending: unknown;
  try {
    pending = await request(
      db
        .transaction("recovery", "readonly")
        .objectStore("recovery")
        .get("pending"),
    );
  } finally {
    db.close();
  }
  if (!pending) return false;
  const before = await validateCompleteBackup(pending, language);
  await applySnapshot(persistence, before);
  await writeJournal(persistence.indexedDB, language, null);
  return true;
}

const recoveryPromises = new WeakMap<
  IDBFactory,
  Map<Language, Promise<boolean>>
>();
/** Coalesce React Strict Mode startup, before any learner-state provider writes. */
export function recoverBeforeMount(
  persistence: BrowserPersistence,
  language: Language,
): Promise<boolean> {
  let languages = recoveryPromises.get(persistence.indexedDB);
  if (!languages) {
    languages = new Map();
    recoveryPromises.set(persistence.indexedDB, languages);
  }
  let pending = languages.get(language);
  if (!pending) {
    pending = recoverInterruptedRestore(persistence, language);
    languages.set(language, pending);
  }
  return pending;
}
export async function restoreCompleteBackup(
  persistence: BrowserPersistence,
  input: unknown,
  language: Language,
): Promise<void> {
  const backup = await validateCompleteBackup(input, language);
  await recoverInterruptedRestore(persistence, language);
  const original = await captureCompleteBackup(persistence, language);
  for (const incoming of backup.databases) {
    const existing = original.databases.find((db) => db.name === incoming.name);
    if (
      existing &&
      (existing.version !== incoming.version ||
        incoming.stores.some(
          (store) =>
            !existing.stores.some(
              (row) => row.name === store.name && row.keyPath === store.keyPath,
            ),
        ))
    )
      throw new Error(
        "This database layout needs a versioned migration before restore.",
      );
  }
  // Empty rollback stores remove newly imported records after a failed restore,
  // while never deleting an original database or unrelated store.
  const rollbackDatabases = [
    ...original.databases,
    ...backup.databases
      .filter((db) => !original.databases.some((row) => row.name === db.name))
      .map((db) => ({
        ...db,
        stores: db.stores.map((store) => ({ ...store, records: [] })),
      })),
  ];
  const { sha256: _checksum, ...originalPayload } = original;
  const rollbackPayload = { ...originalPayload, databases: rollbackDatabases };
  const before: CompleteBackup = {
    ...rollbackPayload,
    sha256: await sha256(JSON.stringify(rollbackPayload)),
  };
  await writeJournal(persistence.indexedDB, language, before);
  try {
    await applySnapshot(persistence, backup);
    await writeJournal(persistence.indexedDB, language, null);
  } catch (error) {
    try {
      await applySnapshot(persistence, before);
      await writeJournal(persistence.indexedDB, language, null);
    } catch {
      throw new Error(
        "Restore was interrupted. The recovery copy is saved; reopen this page to recover.",
      );
    }
    throw error;
  }
}
