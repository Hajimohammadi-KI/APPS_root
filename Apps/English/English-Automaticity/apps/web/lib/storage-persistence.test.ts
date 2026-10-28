import { expect, test } from "bun:test";
import { ownsStorageKey } from "@automaticity/learning-core/automaticity";
import {
	backupReminder,
	lastBackupKey,
	newerVersionKey,
	persistentStorageStatus,
	quarantineKey,
	readStoredState,
	recordBackup,
	recoveryEntries,
	recoveryNamespace,
	requestPersistentStorage,
	writeStoredState,
	type KeyValueStorage,
} from "./storage-persistence";

class MemoryStorage implements KeyValueStorage {
	private readonly map = new Map<string, string>();
	failWrites = false;
	get length() { return this.map.size; }
	key(index: number) { return [...this.map.keys()][index] ?? null; }
	getItem(key: string) { return this.map.get(key) ?? null; }
	setItem(key: string, value: string) { if (this.failWrites) throw new Error("quota"); this.map.set(key, value); }
	removeItem(key: string) { this.map.delete(key); }
}

const LANGUAGE = "en";
const OTHER_LANGUAGE = "de";
const KEY = "grammar-automaticity:v27";
const NS = recoveryNamespace(LANGUAGE, KEY);

test("corrupt saved state is quarantined and later saves succeed", () => {
	const storage = new MemoryStorage();
	storage.setItem(KEY, "{not json");
	const read = readStoredState(storage, KEY, 27, NS);
	expect(read).toEqual({ kind: "corrupt", quarantineKey: quarantineKey(NS) });
	expect(storage.getItem(quarantineKey(NS))).toBe("{not json");
	expect(storage.getItem(KEY)).toBeNull();
	expect(writeStoredState(storage, KEY, { version: 27, ok: true })).toBe(true);
	expect(JSON.parse(storage.getItem(KEY) ?? "")).toEqual({ version: 27, ok: true });
	expect(recoveryEntries(storage, NS)).toEqual([[quarantineKey(NS), "{not json"]]);
});

// captureCompleteBackup exports exactly the localStorage keys that
// ownsStorageKey accepts for the language, so ownership is the export rule.
test("recovery keys belong to this language and are therefore exported by a complete backup", () => {
	for (const name of [quarantineKey(NS), newerVersionKey(NS, 30), lastBackupKey(NS)]) {
		expect(ownsStorageKey(name, LANGUAGE)).toBe(true);
		expect(ownsStorageKey(name, OTHER_LANGUAGE)).toBe(false);
	}
});

test("state from a newer app version is snapshotted before normalization", () => {
	const storage = new MemoryStorage();
	storage.setItem(KEY, JSON.stringify({ version: 30, future: true }));
	const read = readStoredState(storage, KEY, 27, NS);
	expect(read.kind).toBe("ok");
	if (read.kind !== "ok") return;
	expect(read.version).toBe(30);
	expect(read.newerSnapshotKey).toBe(newerVersionKey(NS, 30));
	expect(storage.getItem(newerVersionKey(NS, 30))).toContain('"future":true');
	// The snapshot is not overwritten by a later, already-normalized read.
	storage.setItem(KEY, JSON.stringify({ version: 30, future: false }));
	readStoredState(storage, KEY, 27, NS);
	expect(storage.getItem(newerVersionKey(NS, 30))).toContain('"future":true');
});

test("current and missing state read normally and quota errors are reported", () => {
	const storage = new MemoryStorage();
	expect(readStoredState(storage, KEY, 27, NS)).toEqual({ kind: "missing" });
	storage.setItem(KEY, JSON.stringify({ version: 27 }));
	expect(readStoredState(storage, KEY, 27, NS)).toMatchObject({ kind: "ok", version: 27, newerSnapshotKey: null });
	storage.failWrites = true;
	expect(writeStoredState(storage, KEY, {})).toBe(false);
});

test("backup reminder reports the last export and becomes overdue after 30 days", () => {
	const storage = new MemoryStorage();
	const now = new Date("2026-10-28T10:00:00Z");
	expect(backupReminder(storage, NS, now)).toEqual({ lastBackupAt: null, overdue: true });
	recordBackup(storage, NS, "2026-10-01T10:00:00Z");
	expect(storage.getItem(lastBackupKey(NS))).toBe("2026-10-01T10:00:00Z");
	expect(backupReminder(storage, NS, now)).toEqual({ lastBackupAt: "2026-10-01T10:00:00Z", overdue: false });
	expect(backupReminder(storage, NS, new Date("2026-11-01T10:00:00Z")).overdue).toBe(true);
});

test("persistent storage request and status handle unsupported and failing browsers", async () => {
	expect(await requestPersistentStorage({})).toEqual({ supported: false, persisted: false });
	expect(await persistentStorageStatus(undefined)).toEqual({ supported: false, persisted: false });
	const granted = { storage: { persist: async () => true, persisted: async () => true } };
	expect(await requestPersistentStorage(granted)).toEqual({ supported: true, persisted: true });
	expect(await persistentStorageStatus(granted)).toEqual({ supported: true, persisted: true });
	const failing = { storage: { persist: async () => { throw new Error("denied"); } } };
	expect(await requestPersistentStorage(failing)).toEqual({ supported: true, persisted: false });
});
