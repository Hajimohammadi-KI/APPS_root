import { describe, expect, it } from "bun:test";

import { normalizeFlashcards } from "./learner-state";

describe("normalizeFlashcards", () => {
  it("gives a new card independent recognition and production schedules", () => {
    const [card] = normalizeFlashcards([
      { id: "c1", front: "Hund", back: "dog", source: "manual" },
    ]);
    expect(card!.recognition.stage).toBe(0);
    expect(card!.production.stage).toBe(0);
    expect(card!.recognition).not.toBe(card!.production);
  });

  it("migrates a pre-split card's old flat schedule into production, and starts recognition fresh", () => {
    const [card] = normalizeFlashcards([
      {
        id: "c1",
        front: "Hund",
        back: "dog",
        source: "manual",
        stage: 3,
        dueAt: 1_800_000_000_000,
        successStreak: 4,
        lapses: 1,
        lastGrade: "good",
      },
    ]);
    expect(card!.production.stage).toBe(3);
    expect(card!.production.successStreak).toBe(4);
    expect(card!.production.lapses).toBe(1);
    expect(card!.production.lastGrade).toBe("good");
    expect(card!.recognition.stage).toBe(0);
    expect(card!.recognition.lapses).toBe(0);
    expect(card!.recognition.lastGrade).toBeNull();
  });

  it("leaves an already-split card's two schedules independent", () => {
    const [card] = normalizeFlashcards([
      {
        id: "c1",
        front: "Hund",
        back: "dog",
        source: "manual",
        recognition: { stage: 5, dueAt: 1, successStreak: 5, lapses: 0, lastGrade: "good" },
        production: { stage: 1, dueAt: 2, successStreak: 1, lapses: 2, lastGrade: "again" },
      },
    ]);
    expect(card!.recognition.stage).toBe(5);
    expect(card!.production.stage).toBe(1);
    expect(card!.production.lapses).toBe(2);
  });

  it("drops rows that aren't records or are missing front/back entirely", () => {
    const cards = normalizeFlashcards([
      "not a record",
      { id: "c2", back: "dog", source: "manual" },
      { id: "c3", front: "Vogel", back: "bird", source: "manual" },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0]!.front).toBe("Vogel");
  });
});
