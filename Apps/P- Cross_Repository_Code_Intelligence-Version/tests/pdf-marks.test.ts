import { describe, expect, test } from "bun:test";
import { upsertPdfMark, validatePdfMarks } from "../lib/pdf-marks";

describe("PDF mark persistence boundary", () => {
  test("keeps valid marks and normalizes safe defaults", () => {
    const [mark] = validatePdfMarks([{ id: "a", text: "selection", page: 2, tone: "blue", type: "underline" }]);
    expect(mark).toMatchObject({ id: "a", page: 2, tone: "blue", type: "underline", text: "selection" });
    expect(mark.anchor).toBeUndefined();
    expect(mark.createdAt).toEqual(expect.any(String));
  });

  test("drops malformed anchors instead of passing them to the renderer", () => {
    const [mark] = validatePdfMarks([{
      text: "selection",
      anchor: { page: 1, start: 4, end: 8, rects: [{ x: 0.2, y: 0.3, width: 4, height: 0.2 }, { x: 0, y: 0, width: 0, height: 1 }] },
    }]);
    expect(mark.anchor?.rects).toEqual([{ x: 0.2, y: 0.3, width: 1, height: 0.2 }]);
  });

  test("rejects empty records and invalid anchors", () => {
    expect(validatePdfMarks([null, {}, { text: "" }, { text: "ok", anchor: { page: 1, start: 8, end: 2, rects: [] } }])).toHaveLength(1);
    expect(validatePdfMarks([{ text: "ok", anchor: { page: 1, start: 8, end: 2, rects: [] } }])[0]?.anchor).toBeUndefined();
  });

  test("collapses duplicate marks while preserving useful note and translation data", () => {
    const anchor = { page: 2, start: 12, end: 21, rects: [{ x: 0.2, y: 0.3, width: 0.1, height: 0.02 }] };
    const marks = validatePdfMarks([
      { id: "new", text: "paradigms", page: 2, tone: "yellow", type: "highlight", anchor, note: "Important", createdAt: "2026-08-08T10:00:00.000Z" },
      { id: "old", text: "paradigms", page: 2, tone: "yellow", type: "highlight", anchor, translation: "Paradigmen", createdAt: "2026-08-08T09:00:00.000Z" },
    ]);

    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({ id: "new", page: 2, note: "Important", translation: "Paradigmen" });
  });

  test("never restores provider errors as saved translations", () => {
    const [mark] = validatePdfMarks([{
      id: "failed-translation",
      text: "paradigms",
      page: 1,
      translation: "OpenAI ist noch nicht eingerichtet. Verbinde OpenAI einmal in den zentralen Einstellungen.",
    }]);

    expect(mark.translation).toBeUndefined();
  });

  test("enriches an existing selection instead of creating another card", () => {
    const anchor = { page: 2, start: 12, end: 21, rects: [{ x: 0.2, y: 0.3, width: 0.1, height: 0.02 }] };
    const current = validatePdfMarks([{ id: "mark-1", text: "paradigms", page: 2, tone: "yellow", type: "highlight", anchor }]);
    const next = upsertPdfMark(current, {
      id: "mark-2",
      text: "paradigms",
      page: 2,
      tone: "blue",
      type: "underline",
      anchor,
      note: "Key concept",
      createdAt: "2026-08-08T11:00:00.000Z",
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: "mark-1", tone: "blue", type: "underline", note: "Key concept" });
  });
});
