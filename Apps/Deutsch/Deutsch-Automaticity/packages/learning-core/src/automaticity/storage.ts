import {
  parseAutomaticityEvent,
  type AutomaticityEvent,
  type Language,
} from "./contracts";

export interface LocalStore {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const eventPrefix = (language: Language) =>
  `automaticity:v2:${language}:event:`;
export const sessionKey = (language: Language) =>
  `automaticity:v2:${language}:session`;

export function appendAutomaticityEvent(
  storage: LocalStore,
  event: AutomaticityEvent,
): void {
  parseAutomaticityEvent(event, event.language);
  const key = eventPrefix(event.language) + encodeURIComponent(event.id);
  const value = JSON.stringify(event);
  const previous = storage.getItem(key);
  if (previous !== null && previous !== value)
    throw new Error(
      "Event IDs are immutable; append a new assessment to revise a verdict.",
    );
  // One atomic key per event avoids read/modify/write races between browser tabs.
  storage.setItem(key, value);
  if (storage.getItem(key) !== value)
    throw new Error("The browser did not persist this event.");
}

export function readAutomaticityEvents(
  storage: LocalStore,
  language: Language,
): { events: AutomaticityEvent[]; unreadable: string[] } {
  const prefix = eventPrefix(language);
  const events: AutomaticityEvent[] = [];
  const unreadable: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      events.push(
        parseAutomaticityEvent(
          JSON.parse(storage.getItem(key) ?? "null"),
          language,
        ),
      );
    } catch {
      unreadable.push(key);
    }
  }
  return { events, unreadable };
}

export function ownsStorageKey(key: string, language: Language): boolean {
  // Keys belong to the current language origin. OAuth/token stores are excluded.
  if (/(?:token|api[-_]?key|secret|credential|oauth|password)/i.test(key))
    return false;
  const common = [
    "automaticity:learning-evidence:v1",
    "study-suite:learner-profile:v1",
  ];
  if (common.includes(key)) return true;
  if (key.startsWith("automaticity:learning-evidence:v1:")) return true;
  if (key.startsWith(`automaticity:v2:${language}:`)) return true;
  const exact =
    language === "en"
      ? ["grammar-automaticity:v27", "GrammarAutomaticityV11_en"]
      : [
          "GrammarAutomaticityV11_de",
          "german-automaticity:v20",
          "grammar-automaticity:de",
        ];
  const prefixes =
    language === "en"
      ? ["english-", "english:", "grammar-lab-en"]
      : ["deutsch-", "deutsch:", "german-", "grammar-lab-de"];
  return (
    exact.includes(key) || prefixes.some((prefix) => key.startsWith(prefix))
  );
}

/** Preserve legacy bytes once; absence of provenance must never become mastery. */
export function preserveLegacyState(
  storage: LocalStore,
  language: Language,
  at: string,
): { status: "saved" | "already_saved"; keys: number } {
  const key = `automaticity:v2:${language}:legacy-snapshot`;
  const existing = storage.getItem(key);
  if (existing !== null) {
    const parsed: unknown = JSON.parse(existing);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("entries" in parsed) ||
      !Array.isArray(parsed.entries)
    )
      throw new Error(
        "Existing migration snapshot is unreadable; originals were kept.",
      );
    return { status: "already_saved", keys: parsed.entries.length };
  }
  const entries: [string, string][] = [];
  for (let index = 0; index < storage.length; index++) {
    const candidate = storage.key(index);
    if (
      !candidate ||
      candidate.startsWith(`automaticity:v2:${language}:`) ||
      !ownsStorageKey(candidate, language)
    )
      continue;
    const value = storage.getItem(candidate);
    if (value !== null) entries.push([candidate, value]);
  }
  const snapshot = JSON.stringify({
    version: 2,
    language,
    at,
    interpretation: "legacy-unqualified",
    entries,
  });
  storage.setItem(key, snapshot);
  if (storage.getItem(key) !== snapshot)
    throw new Error(
      "Migration snapshot could not be verified; no legacy data was changed.",
    );
  return { status: "saved", keys: entries.length };
}
