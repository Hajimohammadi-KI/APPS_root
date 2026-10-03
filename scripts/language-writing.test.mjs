import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const window = {};
runInNewContext(readFileSync(new URL("../shared/language-web/writing.js", import.meta.url), "utf8"), { window });
const parts = window.languageWriting.parts;
describe("bilingual exercise writing", () => {
  test("Persian instructions do not reverse or swallow the German sentence", () => {
    const result = parts("شکل داده‌شده را اصلاح کن. نادرست: Ich sein müde. پاسخ کامل را بنویس.", "fa");
    expect(result.map(row => row.lang)).toEqual(["fa", "de", "fa"]);
    expect(result.map(row => row.dir)).toEqual(["rtl", "ltr", "rtl"]);
    expect(result[1].text).toBe("Ich sein müde.");
    expect(result[2].text).toBe("پاسخ کامل را بنویس.");
  });
  test("keeps German diacritics, capitals and decomposed marks intact", () => {
    const text = "Äpfel, Öl, Übung, Straße, größer, müde, schön, Mu\u0308he.";
    expect(parts(text, "de")).toEqual([{ text, lang: "de", dir: "ltr", example: false }]);
  });
  test("English text remains LTR; Persian source remains RTL in translation prompts", () => {
    expect(parts("Correct the sentence: I am agree.", "en")[0].lang).toBe("en");
    const result = parts("Translate: من امروز خسته‌ام.", "en");
    expect(result.map(row => row.lang)).toEqual(["en", "fa"]);
    expect(result[1].text).toBe("من امروز خسته‌ام.");
  });
});
