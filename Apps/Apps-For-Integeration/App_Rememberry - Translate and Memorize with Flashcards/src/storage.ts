import {
  createDeck,
  type ExtensionSettings,
  type Flashcard,
  type FlashcardDeck,
  importDeck,
  projectBridgeStorageKey,
} from "./core";

const deckStorageKey = "lingobridge.deck.v2";
const legacyDeckStorageKey = "lingobridge.deck.v1";

export interface ProjectSyncMessage {
  readonly type: "LINGOBRIDGE_SYNC_CARDS";
  readonly deck: FlashcardDeck;
}

function localGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return chrome.storage.local.get(keys) as Promise<Record<string, T>>;
}

export async function getDeck(): Promise<FlashcardDeck> {
  const result = await localGet<unknown>([deckStorageKey, legacyDeckStorageKey]);
  const stored = result[deckStorageKey] ?? result[legacyDeckStorageKey];
  if (!stored) return createDeck();
  try {
    const deck = importDeck(stored);
    if (!result[deckStorageKey]) await replaceDeck(deck);
    return deck;
  } catch {
    return createDeck();
  }
}

export async function replaceDeck(deck: FlashcardDeck): Promise<FlashcardDeck> {
  const validDeck = importDeck(deck);
  const updated = { ...validDeck, updatedAt: Date.now() };
  await chrome.storage.local.set({ [deckStorageKey]: updated });
  return updated;
}

export async function updateDeck(
  change: (deck: FlashcardDeck) => FlashcardDeck,
): Promise<FlashcardDeck> {
  return replaceDeck(change(await getDeck()));
}

export async function saveDeck(cards: readonly Flashcard[]): Promise<FlashcardDeck> {
  return updateDeck((deck) => ({ ...deck, cards }));
}

export async function saveSettings(
  settings: ExtensionSettings,
): Promise<FlashcardDeck> {
  return updateDeck((deck) => ({ ...deck, settings }));
}

export async function syncDeckToLocalProjects(deck: FlashcardDeck): Promise<number> {
  const tabs = await chrome.tabs.query({ url: ["http://127.0.0.1/*", "http://localhost/*"] });
  const message: ProjectSyncMessage = { type: "LINGOBRIDGE_SYNC_CARDS", deck };
  const results = await Promise.all(
    tabs
      .filter((tab): tab is chrome.tabs.Tab & { id: number } => Number.isInteger(tab.id))
      .map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return 1;
        } catch {
          return 0;
        }
      }),
  );
  return results.reduce<number>((total, result) => total + result, 0);
}

export function projectBridgePayload(deck: FlashcardDeck): string {
  return JSON.stringify({ key: projectBridgeStorageKey, updatedAt: deck.updatedAt, cards: deck.cards });
}
