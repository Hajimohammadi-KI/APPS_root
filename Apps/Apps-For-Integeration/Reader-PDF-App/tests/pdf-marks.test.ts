import { describe, expect, test } from "bun:test";
import { validatePdfMarks } from "../lib/pdf-marks";

describe("PDF mark persistence boundary", () => {
  test("keeps valid marks and normalizes safe defaults", () => {
    const [mark] = validatePdfMarks([{ id: "a", text: "selection", page: 2, tone: "blue", type: "underline" }]);
    expect(mark).toMatchObject({ id: "a", page: 2, tone: "blue", type: "underline", text: "selection" });
    expect(mark.anchor).toBeUndefined();
    expect(mark.createdAt).toEqual(expect.any(String));
  });

  test("drops unsafe rectangles before rendering", () => {
    const [mark] = validatePdfMarks([{
      text: "selection",
      anchor: {
        page: 1,
        start: 4,
        end: 8,
        rects: [
          { x: 0.2, y: 0.3, width: 4, height: 0.2 },
          { x: 0, y: 0, width: 0, height: 1 },
        ],
      },
    }]);
    expect(mark.anchor?.rects).toEqual([{ x: 0.2, y: 0.3, width: 1, height: 0.2 }]);
  });
});
