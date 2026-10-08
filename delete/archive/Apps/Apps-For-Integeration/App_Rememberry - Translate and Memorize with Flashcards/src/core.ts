export const deckSchemaVersion = 2;
export const projectBridgeStorageKey = "lingobridge.flashcards.v1";
export const defaultDeckId = "deck-default";

export type CardLanguage = "de" | "fa" | "en";
export type InterfaceLanguage = "de" | "fa" | "en";
export type ReviewGrade = "again" | "hard" | "good" | "easy";
export type LearningMode = "text" | "listening" | "typing";
export type CardSort = "due" | "random" | "new";

export interface Flashcard {
  readonly id: string;
  readonly deckId: string;
  readonly front: string;
  readonly back: string;
  readonly notes?: string;
  readonly sourceLanguage: CardLanguage;
  readonly targetLanguage: CardLanguage;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly dueAt: number;
  readonly intervalDays: number;
  readonly repetitions: number;
  readonly lapses: number;
  readonly ease: number;
  readonly lastReviewedAt?: number;
  readonly sourceUrl?: string;
  readonly sourceTitle?: string;
}

export interface DeckDefinition {
  readonly id: string;
  readonly name: string;
  readonly sourceLanguage: CardLanguage;
  readonly targetLanguage: CardLanguage;
  readonly createdAt: number;
}

export interface ExtensionSettings {
  readonly interfaceLanguage: InterfaceLanguage;
  readonly activeDeckId: string;
  readonly learningMode: LearningMode;
  readonly cardsPerSession: number | "all";
  readonly cardSort: CardSort;
  readonly smartRepeat: boolean;
  readonly reverseMode: boolean;
  readonly pronounceAnswer: boolean;
  readonly selectionBubble: boolean;
  readonly autoSaveSelection: boolean;
  readonly highlightCards: boolean;
  readonly disabledSites: readonly string[];
  readonly onboardingComplete: boolean;
}

export interface StudyStats {
  readonly streak: number;
  readonly lastStudyDate: string;
  readonly reviewsToday: number;
  readonly totalReviews: number;
}

export interface FlashcardDeck {
  readonly version: typeof deckSchemaVersion;
  readonly updatedAt: number;
  readonly decks: readonly DeckDefinition[];
  readonly cards: readonly Flashcard[];
  readonly settings: ExtensionSettings;
  readonly stats: StudyStats;
}

export interface NewCardInput {
  readonly front: string;
  readonly back?: string;
  readonly notes?: string;
  readonly deckId?: string;
  readonly sourceLanguage: CardLanguage;
  readonly targetLanguage: CardLanguage;
  readonly sourceUrl?: string;
  readonly sourceTitle?: string;
}

function normalizedText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function cardId(now: number): string {
  return `card-${now.toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

function dateKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function daysBetween(left: string, right: string): number {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  return Math.round(
    (Date.parse(`${right}T00:00:00Z`) - Date.parse(`${left}T00:00:00Z`)) /
      86_400_000,
  );
}

export function createDefaultSettings(): ExtensionSettings {
  return {
    interfaceLanguage: "de",
    activeDeckId: defaultDeckId,
    learningMode: "text",
    cardsPerSession: "all",
    cardSort: "due",
    smartRepeat: true,
    reverseMode: false,
    pronounceAnswer: false,
    selectionBubble: true,
    autoSaveSelection: false,
    highlightCards: false,
    disabledSites: [],
    onboardingComplete: false,
  };
}

export function createNamedDeck(
  name: string,
  sourceLanguage: CardLanguage,
  targetLanguage: CardLanguage,
  now = Date.now(),
): DeckDefinition {
  const normalizedName = normalizedText(name);
  if (!normalizedName) throw new Error("Give the deck a name.");
  return {
    id: `deck-${now.toString(36)}-${crypto.randomUUID().slice(0, 6)}`,
    name: normalizedName.slice(0, 80),
    sourceLanguage,
    targetLanguage,
    createdAt: now,
  };
}

export function createCard(input: NewCardInput, now = Date.now()): Flashcard {
  const front = normalizedText(input.front);
  const back = normalizedText(input.back ?? "");
  const notes = normalizedText(input.notes ?? "");
  if (!front) throw new Error("Add a word, phrase, or sentence before saving a card.");
  if (front.length > 2_000 || back.length > 2_000 || notes.length > 2_000) {
    throw new Error("Keep each card field below 2,000 characters.");
  }
  return {
    id: cardId(now),
    deckId: input.deckId ?? defaultDeckId,
    front,
    back,
    ...(notes ? { notes } : {}),
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    createdAt: now,
    updatedAt: now,
    dueAt: now,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    ease: 2.5,
    ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    ...(input.sourceTitle ? { sourceTitle: input.sourceTitle } : {}),
  };
}

export function isDue(card: Flashcard, now = Date.now()): boolean {
  return card.dueAt <= now;
}

export function reviewCard(
  card: Flashcard,
  grade: ReviewGrade,
  now = Date.now(),
): Flashcard {
  const safeEase = Math.max(1.3, card.ease);
  const nextRepetitions = card.repetitions + 1;
  let intervalDays: number;
  let ease = safeEase;
  let dueAt: number;
  switch (grade) {
    case "again":
      intervalDays = 0;
      ease = Math.max(1.3, safeEase - 0.2);
      dueAt = now + 10 * 60 * 1_000;
      break;
    case "hard":
      intervalDays = card.repetitions === 0 ? 1 : Math.max(1, Math.round(card.intervalDays * 1.2));
      ease = Math.max(1.3, safeEase - 0.12);
      dueAt = now + intervalDays * 86_400_000;
      break;
    case "easy":
      intervalDays = card.repetitions === 0 ? 4 : Math.max(4, Math.round(card.intervalDays * (safeEase + 0.25)));
      ease = Math.min(3.4, safeEase + 0.15);
      dueAt = now + intervalDays * 86_400_000;
      break;
    default:
      intervalDays = card.repetitions === 0 ? 1 : card.repetitions === 1 ? 3 : Math.max(3, Math.round(card.intervalDays * safeEase));
      dueAt = now + intervalDays * 86_400_000;
  }
  return {
    ...card,
    dueAt,
    ease,
    intervalDays,
    repetitions: grade === "again" ? 0 : nextRepetitions,
    lapses: card.lapses + (grade === "again" ? 1 : 0),
    lastReviewedAt: now,
    updatedAt: now,
  };
}

export function recordStudy(stats: StudyStats, now = Date.now()): StudyStats {
  const today = dateKey(now);
  if (stats.lastStudyDate === today) {
    return { ...stats, reviewsToday: stats.reviewsToday + 1, totalReviews: stats.totalReviews + 1 };
  }
  const consecutive = daysBetween(stats.lastStudyDate, today) === 1;
  return {
    streak: consecutive ? stats.streak + 1 : 1,
    lastStudyDate: today,
    reviewsToday: 1,
    totalReviews: stats.totalReviews + 1,
  };
}

export function createDeck(cards: readonly Flashcard[] = [], now = Date.now()): FlashcardDeck {
  return {
    version: deckSchemaVersion,
    updatedAt: now,
    decks: [{ id: defaultDeckId, name: "Deutsch ↔ فارسی", sourceLanguage: "de", targetLanguage: "fa", createdAt: now }],
    cards,
    settings: createDefaultSettings(),
    stats: { streak: 0, lastStudyDate: "", reviewsToday: 0, totalReviews: 0 },
  };
}

export function languageLabel(language: CardLanguage): string {
  if (language === "de") return "Deutsch";
  if (language === "fa") return "فارسی";
  return "English";
}

export function translationUrl(text: string, sourceLanguage: CardLanguage, targetLanguage: CardLanguage): string {
  const query = new URLSearchParams({ sl: sourceLanguage, tl: targetLanguage, text: normalizedText(text), op: "translate" });
  return `https://translate.google.com/?${query.toString()}`;
}

export function isFlashcard(value: unknown): value is Flashcard {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<Flashcard>;
  return (
    typeof card.id === "string" && typeof card.front === "string" && typeof card.back === "string" &&
    ["de", "fa", "en"].includes(String(card.sourceLanguage)) && ["de", "fa", "en"].includes(String(card.targetLanguage)) &&
    typeof card.createdAt === "number" && typeof card.updatedAt === "number" && typeof card.dueAt === "number" &&
    typeof card.intervalDays === "number" && typeof card.repetitions === "number" && typeof card.ease === "number"
  );
}

function migrateCard(card: Flashcard | (Omit<Flashcard, "deckId" | "lapses"> & { deckId?: string; lapses?: number })): Flashcard {
  return { ...card, deckId: card.deckId ?? defaultDeckId, lapses: card.lapses ?? 0 };
}

export function importDeck(value: unknown): FlashcardDeck {
  if (!value || typeof value !== "object") throw new Error("This backup is not a LingoBridge deck.");
  const candidate = value as Omit<Partial<FlashcardDeck>, "version"> & { version?: number };
  if (!Array.isArray(candidate.cards) || !candidate.cards.every(isFlashcard)) {
    throw new Error("This backup contains an incomplete card.");
  }
  const migratedCards = candidate.cards.map(migrateCard);
  if (candidate.version === 1) return createDeck(migratedCards);
  if (candidate.version !== deckSchemaVersion || !Array.isArray(candidate.decks)) {
    throw new Error("This backup has an unsupported LingoBridge format.");
  }
  const defaults = createDeck(migratedCards);
  const decks = candidate.decks.filter((deck): deck is DeckDefinition => Boolean(deck && typeof deck.id === "string" && typeof deck.name === "string"));
  return {
    version: deckSchemaVersion,
    updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now(),
    decks: decks.length ? decks : defaults.decks,
    cards: migratedCards,
    settings: { ...defaults.settings, ...(candidate.settings ?? {}) },
    stats: { ...defaults.stats, ...(candidate.stats ?? {}) },
  };
}
