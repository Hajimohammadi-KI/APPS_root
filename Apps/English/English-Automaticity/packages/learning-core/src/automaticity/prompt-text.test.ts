import { describe, expect, test } from "bun:test";
import { promptTextParts } from "./prompt-text";

describe("bilingual practice prompts", () => {
  test("separates a German instruction from the Persian sentence", () => {
    const value =
      "Übersetze ins Deutsche: در خیابان من یک سوپرمارکت وجود دارد.";
    const parts = promptTextParts(value, "de");
    expect(parts.map((part) => part.text).join("")).toBe(value);
    expect(parts.map((part) => [part.lang, part.dir])).toEqual([
      ["de", "ltr"],
      ["fa", "rtl"],
    ]);
  });
  test("isolates a Latin example inside Persian guidance", () => {
    const value = "جملهٔ Ich bin müde. را اصلاح کن.";
    const parts = promptTextParts(value, "de");
    expect(parts.map((part) => part.text).join("")).toBe(value);
    expect(parts.map((part) => part.lang)).toEqual(["fa", "de", "fa"]);
  });
  test.each([
    "Choose this/that: ___ folder.",
    "Ändere Größe und Straße.",
    "",
    "۱۲:۳۰ می‌روم؛ چرا؟",
  ])("preserves exact characters: %s", (value) => {
    expect(
      promptTextParts(value, "en")
        .map((part) => part.text)
        .join(""),
    ).toBe(value);
  });
});
