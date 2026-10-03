import { describe, expect, test } from "bun:test";
import { grammarUnits as deUnits } from "../../Apps/Deutsch-Automaticity/packages/content/src/index";
import { grammarUnits as enUnits } from "../../Apps/English/English-Automaticity/packages/content/src/index";
import { worksheets } from "../../Apps/Deutsch-Automaticity/packages/content/src/grammar-worksheets";
import { a1Worksheets } from "../../Apps/Deutsch-Automaticity/packages/content/src/worksheet-seeds-a1";
import { germanSeeds } from "./seeds-de";
import { englishSeeds } from "./seeds-en";
import { catalogWorksheets } from "./build";

for (const [language, units, seeds, fixed, expected] of [
  ["de", deUnits, [...a1Worksheets, ...germanSeeds], worksheets, 144],
  ["en", enUnits, englishSeeds, [], 112],
] as const) {
  describe(`${language} worksheet curriculum`, () => {
    const catalog = catalogWorksheets(units, seeds, language, fixed);
    test("every canonical topic has one stable worksheet set", () => {
      expect(catalog).toHaveLength(expected);
      expect(new Set(catalog.map((w) => `${w.level}::${w.topic}`)).size).toBe(
        expected,
      );
      expect(new Set(catalog.map((w) => w.id)).size).toBe(expected);
    });
    test("all retrieval tasks have a complete diagnostic key and unique field IDs", () => {
      for (const unit of catalog) {
        const items = [
          ...unit.learn,
          ...unit.guided,
          ...unit.transform,
          unit.recall,
          ...unit.oral,
          ...unit.correction,
        ];
        expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
        for (const item of items) {
          for (const field of [
            item.prompt,
            item.answer,
            item.cause,
            item.trigger,
            item.category,
            item.contrast,
          ])
            expect(field.trim().length).toBeGreaterThan(0);
          expect(item.answer).not.toContain("[[");
          expect(item.answer).not.toContain("___");
          expect(item.cause).toContain("→");
        }
        expect(unit.decision).toHaveLength(3);
        expect(unit.transform).toHaveLength(1);
        expect(unit.oral).toHaveLength(3);
        expect(unit.personal.length).toBeGreaterThan(0);
      }
    });
    test("authored error substitutions differ from the correct target", () => {
      for (const seed of seeds) {
        for (const [, sentence, wrong] of seed.examples) {
          expect(sentence.match(/\[\[/g)).toHaveLength(1);
          expect(sentence.match(/\]\]/g)).toHaveLength(1);
          expect(sentence.match(/\[\[(.*?)\]\]/u)?.[1]).not.toBe(wrong);
        }
      }
    });
    test("missing or ambiguous mappings fail instead of reusing unrelated material", () => {
      expect(() =>
        catalogWorksheets(
          [{ title: "Missing topic", level: "A1" }],
          [],
          language,
        ),
      ).toThrow("expected one worksheet seed");
      const first = seeds[0]!;
      expect(() =>
        catalogWorksheets(
          [{ title: first.topic, level: first.level || "A1" }],
          [first, first],
          language,
        ),
      ).toThrow("found 2");
    });
  });
}
