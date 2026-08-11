import { describe, expect, it } from "bun:test";

import {
  createCard,
  createDeck,
  createNamedDeck,
  importDeck,
  isDue,
  recordStudy,
  reviewCard,
  translationUrl,
} from "./core";

const now = Date.UTC(2026, 7, 7, 12, 0, 0);

describe("LingoBridge review engine", () => {
  it("creates a German-to-Persian card due immediately", () => {
    const card = createCard(
      {
        front: "  Ich freue mich darauf. ",
        back: "مشتاقِ آن هستم.",
        sourceLanguage: "de",
        targetLanguage: "fa",
      },
      now,
    );

    expect(card.front).toBe("Ich freue mich darauf.");
    expect(card.back).toBe("مشتاقِ آن هستم.");
    expect(isDue(card, now)).toBe(true);
  });

  it("schedules a short retry after Again and a longer interval after Easy", () => {
    const card = createCard(
      { front: "Wort", sourceLanguage: "de", targetLanguage: "fa" },
      now,
    );

    expect(reviewCard(card, "again", now).dueAt).toBe(now + 10 * 60 * 1_000);
    expect(reviewCard(card, "easy", now).intervalDays).toBe(4);
  });

  it("makes a correctly encoded Google Translate link without sending text automatically", () => {
    const url = translationUrl("Guten Morgen", "de", "fa");

    expect(url).toContain("sl=de");
    expect(url).toContain("tl=fa");
    expect(url).toContain("Guten+Morgen");
  });

  it("rejects malformed backups", () => {
    expect(() => importDeck({ version: 1, cards: [{}] })).toThrow();
  });

  it("creates independent decks for German, Persian, and English learning", () => {
    const deck = createNamedDeck("B1 Reisen", "de", "fa", now);

    expect(deck.name).toBe("B1 Reisen");
    expect(deck.sourceLanguage).toBe("de");
    expect(deck.targetLanguage).toBe("fa");
  });

  it("keeps a same-day streak stable and advances it on the next day", () => {
    const initial = createDeck([], now).stats;
    const first = recordStudy(initial, now);
    const sameDay = recordStudy(first, now + 60_000);
    const nextDay = recordStudy(sameDay, now + 86_400_000);

    expect(sameDay.streak).toBe(1);
    expect(sameDay.reviewsToday).toBe(2);
    expect(nextDay.streak).toBe(2);
    expect(nextDay.reviewsToday).toBe(1);
  });

  it("migrates old local backups without losing cards", () => {
    const oldCard = createCard(
      { front: "lernen", back: "یاد گرفتن", sourceLanguage: "de", targetLanguage: "fa" },
      now,
    );
    const { deckId: _deckId, lapses: _lapses, ...legacyCard } = oldCard;
    const migrated = importDeck({ version: 1, cards: [legacyCard] });

    expect(migrated.version).toBe(2);
    expect(migrated.cards).toHaveLength(1);
    expect(migrated.cards[0]?.front).toBe("lernen");
    expect(migrated.cards[0]?.deckId).toBe("deck-default");
  });
});
