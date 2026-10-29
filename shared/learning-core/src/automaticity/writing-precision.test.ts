import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { assertWritingPrecision } from "../writing-precision";
import type { CurriculumPack } from "./curriculum";

test("W29 every installed correct example and accepted answer passes the precision gate", () => {
  let count = 0;
  for (const language of ["en", "de"] as const) {
    const candidates = [new URL(`../../content/curriculum-${language}.json`, import.meta.url), new URL(`../../../../apps/web/public/learning-core/curriculum-${language}.json`, import.meta.url)];
    const path = candidates.find(p => existsSync(p));
    if (!path) continue;
    const pack = JSON.parse(readFileSync(path, "utf8")) as CurriculumPack;
    const sentences = [...new Set(pack.units.flatMap(u => [...u.examples, ...u.tasks.flatMap(t => t.acceptedAnswers)]))];
    assertWritingPrecision(sentences, language);
    count += sentences.length;
  }
  expect(count).toBeGreaterThan(300);
  expect(() => assertWritingPrecision(["a hour"], "en")).toThrow("EN_INITIAL_SOUND");
});
