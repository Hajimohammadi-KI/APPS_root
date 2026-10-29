import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { assertWritingPrecision } from "../writing-precision";
import type { CurriculumPack } from "./curriculum";
import { syntheticWritingErrors } from "../synthetic-writing-errors";
import { writingIssues } from "../writing-rules";

test("W29 every installed correct example and accepted answer passes the precision gate", () => {
  let count = 0;
  for (const language of ["en", "de"] as const) {
    const candidates = [
      new URL(`../../content/curriculum-${language}.json`, import.meta.url),
      new URL(
        `../../../../apps/web/public/learning-core/curriculum-${language}.json`,
        import.meta.url,
      ),
    ];
    const path = candidates.find((p) => existsSync(p));
    if (!path) continue;
    const pack = JSON.parse(readFileSync(path, "utf8")) as CurriculumPack;
    const sentences = [
      ...new Set(
        pack.units.flatMap((u) => [
          ...u.examples,
          ...u.tasks.flatMap((t) => t.acceptedAnswers),
        ]),
      ),
    ];
    assertWritingPrecision(sentences, language);
    count += sentences.length;
  }
  expect(count).toBeGreaterThan(300);
  expect(() => assertWritingPrecision(["a hour"], "en")).toThrow(
    "EN_INITIAL_SOUND",
  );
});
test("W30 synthetic mutations measure recall only, separately from the precision corpus", () => {
  const samples = [
    ...syntheticWritingErrors(
      ["I waited an hour.", "He has a car.", "I need some advice."],
      "en",
    ),
    ...syntheticWritingErrors(
      ["Er spricht mit mir.", "Ich bin gegangen.", "Ich lese ein Buch."],
      "de",
    ),
  ];
  expect(samples).toHaveLength(6);
  for (const sample of samples) {
    expect(sample.purpose).toBe("synthetic-recall-only");
    expect(writingIssues(sample.correct, sample.language)).toEqual([]);
    expect(
      writingIssues(sample.error, sample.language).some(
        (i) => i.ruleId === sample.ruleId,
      ),
    ).toBe(true);
  }
});
