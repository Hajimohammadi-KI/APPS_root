import { describe, expect, test } from "bun:test";
import { syncLegacyPractice } from "./legacy";
import { readAutomaticityEvents, type LocalStore } from "./storage";
import { reduceAutomaticityEvents } from "./evidence";
import type { CurriculumPack } from "./curriculum";
const store = (): LocalStore => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
};
const pack = {
  language: "en",
  version: "1",
  mappingVersion: "1",
  units: [{ id: "en.c.1", title: "Past", level: "A1", familyIds: ["G06"] }],
} as CurriculumPack;
describe("legacy output continuity", () => {
  test("keeps originals, imports once and never upgrades legacy success", async () => {
    const s = store();
    const original = JSON.stringify({
      attempts: [
        {
          id: "a",
          grammarTitle: "Past",
          mode: "writing",
          inputText: "I walked.",
          createdAt: "2026-01-01T12:00:00Z",
          verified: true,
          passed: true,
          accuracyScore: 100,
        },
      ],
    });
    s.setItem("grammar-automaticity:v27", original);
    expect(
      (await syncLegacyPractice(s, "en", pack, "2026-02-01T12:00:00Z"))
        .imported,
    ).toBe(1);
    expect(
      (await syncLegacyPractice(s, "en", pack, "2026-02-01T12:00:00Z"))
        .imported,
    ).toBe(0);
    expect(s.getItem("grammar-automaticity:v27")).toBe(original);
    const rows = reduceAutomaticityEvents(
      readAutomaticityEvents(s, "en").events,
      "en",
      "2026-02-01T12:00:00Z",
    );
    expect(rows.attempts[0]?.attempt.response.text).toBe("I walked.");
    expect(rows.attempts[0]?.eligibleForMastery).toBe(false);
    expect(rows.attempts[0]?.independent).toBe(false);
  });
  test("preserves duplicate source rows, missing dates and corrupt originals", async () => {
    const s = store();
    const row = { inputText: "Original", createdAt: "2026-01-01T12:00:00Z" };
    s.setItem(
      "grammar-automaticity:v27",
      JSON.stringify({ attempts: [row, row, { inputText: "No date" }] }),
    );
    s.setItem("GrammarAutomaticityV11_en", "{partial");
    const result = await syncLegacyPractice(
      s,
      "en",
      pack,
      "2026-02-01T12:00:00Z",
    );
    expect(result.imported).toBe(2);
    expect(result.skipped).toHaveLength(2);
    expect(s.getItem("GrammarAutomaticityV11_en")).toBe("{partial");
  });
  test("imports German static output without crossing language history", async () => {
    const s = store();
    s.setItem(
      "grammar-automaticity:v27",
      JSON.stringify({
        attempts: [{ inputText: "English", createdAt: "2026-01-01T12:00:00Z" }],
      }),
    );
    s.setItem(
      "deutsch-automaticity:grammar-open-responses:v1",
      JSON.stringify([
        {
          response: "Ich bin hier.",
          occurredAt: "2026-01-01T12:00:00Z",
          topic: "Sein",
        },
      ]),
    );
    await syncLegacyPractice(
      s,
      "de",
      { ...pack, language: "de", units: [] },
      "2026-02-01T12:00:00Z",
    );
    expect(readAutomaticityEvents(s, "de").events).toHaveLength(1);
    expect(readAutomaticityEvents(s, "en").events).toHaveLength(0);
  });
});
