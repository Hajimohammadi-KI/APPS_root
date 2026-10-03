import { describe, expect, test } from "bun:test";
import { sanitizePdfReaderState, sanitizePdfReaderStateStore } from "../lib/pdf-reader-state";

describe("PDF reading and analysis persistence", () => {
  test("keeps reading position and analysis per document", () => {
    const state = sanitizePdfReaderState({
      page: 14,
      selectedText: "Selected text",
      selectedPage: 14,
      question: "Explain this",
      answer: "Analysis",
      translation: "Übersetzung",
      updatedAt: "2026-08-07T00:00:00.000Z",
    });
    expect(state).toMatchObject({ page: 14, selectedPage: 14, answer: "Analysis", translation: "Übersetzung" });
  });

  test("repairs broken browser data", () => {
    const state = sanitizePdfReaderState({ page: -1, selectedPage: "bad", answer: 4 });
    expect(state.page).toBe(1);
    expect(state.selectedPage).toBe(1);
    expect(state.answer).toBe("");
    const store = sanitizePdfReaderStateStore({ sample: { page: 2 }, "": { page: 3 } });
    expect(store.sample?.page).toBe(2);
    expect(Object.keys(store)).toEqual(["sample"]);
  });
});
