import { expect, test } from "bun:test";
import {
  databaseNames,
  deleteCompleteLearnerData,
  keysRemovedByRestore,
} from "./backup";
import { ownsStorageKey, type LocalStore } from "./storage";

const memoryStorage = (
  entries: [string, string][],
): LocalStore & {
  keys: () => string[];
} => {
  const map = new Map(entries);
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    keys: () => [...map.keys()].sort(),
  };
};
/** Only deleteDatabase, answered asynchronously like a browser; `blocked`
 * names a database another tab keeps open. */
const fakeIndexedDB = (blocked = "") => {
  const deleted: string[] = [];
  const factory = {
    deleteDatabase(name: string) {
      const request: {
        onsuccess: null | (() => void);
        onerror: null | (() => void);
        onblocked: null | (() => void);
        error: null;
      } = { onsuccess: null, onerror: null, onblocked: null, error: null };
      setTimeout(() => {
        if (name === blocked) request.onblocked?.();
        else {
          deleted.push(name);
          request.onsuccess?.();
        }
      }, 0);
      return request;
    },
  } as unknown as IDBFactory;
  return { factory, deleted };
};

test("the German app's own keys belong to it and to its backups", () => {
  for (const key of [
    "deutschflow:grammar-error-patterns:v1",
    "deutschflow-case-automaticity-v1",
  ]) {
    expect(ownsStorageKey(key, "de")).toBe(true);
    expect(ownsStorageKey(key, "en")).toBe(false);
  }
});

test("deleting all learner data removes exactly what a complete backup covers", async () => {
  const storage = memoryStorage([
    ["grammar-automaticity:v27", "{}"],
    ["english-daily-minutes", "15"],
    ["automaticity:v2:en:event:1", "{}"],
    ["automaticity:v2:de:event:1", "{}"],
    ["deutschflow:grammar-error-patterns:v1", "[]"],
    ["english-oauth-token", "secret"],
    ["unrelated-site-setting", "x"],
  ]);
  const { factory, deleted } = fakeIndexedDB();
  const result = await deleteCompleteLearnerData(
    { storage, indexedDB: factory },
    "en",
  );
  expect(result).toEqual({ keys: 3, databases: 5 });
  expect(storage.keys()).toEqual([
    "automaticity:v2:de:event:1",
    "deutschflow:grammar-error-patterns:v1",
    "english-oauth-token",
    "unrelated-site-setting",
  ]);
  expect(deleted).toEqual([
    ...databaseNames("en"),
    "automaticity-recovery-v2-en",
  ]);
});

test("a database held open elsewhere stops the deletion before progress is removed", async () => {
  const storage = memoryStorage([["deutsch-daily-minutes", "10"]]);
  const { factory } = fakeIndexedDB(databaseNames("de")[0]);
  await expect(
    deleteCompleteLearnerData({ storage, indexedDB: factory }, "de", 20),
  ).rejects.toThrow("Schließe die anderen Tabs");
  expect(storage.keys()).toEqual(["deutsch-daily-minutes"]);
});

test("restoring a backup made before deutschflow keys were included keeps them", () => {
  const existing = [
    "deutsch-daily-minutes",
    "deutschflow:grammar-error-patterns:v1",
    "deutsch-old-setting",
  ];
  expect(keysRemovedByRestore(existing, ["deutsch-daily-minutes"])).toEqual([
    "deutsch-old-setting",
  ]);
  // A backup that carries such keys restores them exactly.
  expect(
    keysRemovedByRestore(existing, [
      "deutsch-daily-minutes",
      "deutschflow-case-automaticity-v1",
    ]),
  ).toEqual(["deutschflow:grammar-error-patterns:v1", "deutsch-old-setting"]);
});
