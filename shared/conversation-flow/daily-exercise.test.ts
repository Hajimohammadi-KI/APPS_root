import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { dailyExercise, type DailyWorksheet } from "./daily-exercise";

for (const [language, app] of [
  ["en", "English/English-Automaticity"],
  ["de", "Deutsch-Automaticity"],
] as const) {
  const catalog = JSON.parse(
    await readFile(
      resolve(
        import.meta.dir,
        `../../Apps/${app}/apps/web/public/replacements/${language}/daily-worksheets.json`,
      ),
      "utf8",
    ),
  ) as { worksheets: DailyWorksheet[] };
  test(`${language}: all grammar topics retain their own context in three different oral activities`, () => {
    for (const worksheet of catalog.worksheets) {
      const exercises = [2, 3, 6].map((activity) =>
        dailyExercise(
          new URLSearchParams({
            from: "daily",
            activity: String(activity),
            worksheet: worksheet.id,
            level: worksheet.level,
            topic: worksheet.topic,
          }),
          catalog.worksheets,
          language,
        )!,
      );
      expect(new Set(exercises.map((item) => item.topic.id)).size).toBe(3);
      expect(new Set(exercises.map((item) => item.topic.task)).size).toBe(3);
      for (const item of exercises) {
        expect(item.worksheet.id).toBe(worksheet.id);
        expect(item.topic.targetForm).toBe(worksheet.focus);
        expect(item.topic.level).toBe(worksheet.level);
        expect(item.models.length).toBeGreaterThan(0);
      }
      expect(exercises[0]!.models).toEqual(
        worksheet.oral.map((item) => item.answer),
      );
      expect(exercises[2]!.models).toEqual(
        worksheet.models.map((item) => item.sentence),
      );
    }
  });
  test(`${language}: missing context cannot silently open the default introduction`, () => {
    expect(() =>
      dailyExercise(
        new URLSearchParams({
          from: "daily",
          activity: "3",
          worksheet: "missing",
        }),
        catalog.worksheets,
        language,
      ),
    ).toThrow();
    expect(
      dailyExercise(new URLSearchParams(), catalog.worksheets, language),
    ).toBeUndefined();
  });
}
