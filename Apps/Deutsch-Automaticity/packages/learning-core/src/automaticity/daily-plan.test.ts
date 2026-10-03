import { expect, test } from "bun:test";
import {
  dailyPlanKey,
  dailyResponseCount,
  loadDailyPlan,
  practiceDay,
  saveDailyPlan,
} from "./daily-plan";
import type { AttemptEvent } from "./contracts";

function store() {
  const data = new Map<string, string>();
  return {
    data,
    get length() {
      return data.size;
    },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}
const noon = new Date(2026, 8, 5, 12).toISOString();
test("a paused plan resumes unchanged and does not pause the next local day or other language", () => {
  const saved = store(),
    plan = {
      ...loadDailyPlan(saved, "en", noon).plan,
      responseGoal: 5 as const,
      paused: true,
    };
  saveDailyPlan(saved, "en", plan);
  expect(loadDailyPlan(saved, "en", noon).plan).toEqual(plan);
  expect(loadDailyPlan(saved, "de", noon).plan.paused).toBe(false);
  const next = new Date(2026, 8, 6, 0, 1).toISOString();
  expect(loadDailyPlan(saved, "en", next).plan).toEqual({
    version: 1,
    day: "2026-09-06",
    responseGoal: 3,
    paused: false,
  });
  expect(saved.getItem(dailyPlanKey("en", plan.day))).toBe(
    JSON.stringify(plan),
  );
});
test("corrupt daily-plan bytes remain intact until an explicit plan update archives them", () => {
  const saved = store(),
    key = dailyPlanKey("en", practiceDay(noon));
  saved.setItem(key, "unfinished-json");
  const loaded = loadDailyPlan(saved, "en", noon);
  expect(loaded.unreadable).toBe(true);
  expect(saved.getItem(key)).toBe("unfinished-json");
  saveDailyPlan(saved, "en", { ...loaded.plan, responseGoal: 8 });
  expect(
    [...saved.data.entries()].some(
      ([name, value]) =>
        name.startsWith(key + ":unreadable:") && value === "unfinished-json",
    ),
  ).toBe(true);
});
test("failed preservation never overwrites a corrupt plan", () => {
  const saved = store(),
    key = dailyPlanKey("en", practiceDay(noon));
  saved.setItem(key, "keep-original");
  const full = {
    ...saved,
    setItem() {
      throw new Error("quota");
    },
  };
  expect(() =>
    saveDailyPlan(full, "en", loadDailyPlan(saved, "en", noon).plan),
  ).toThrow("quota");
  expect(saved.getItem(key)).toBe("keep-original");
});
test("daily effort counts saved response identities once without requiring a correctness judgment", () => {
  const row = (id: string, at = noon, language = "en") =>
    ({ id, at, language }) as AttemptEvent;
  const prior = new Date(2026, 8, 4, 23, 59).toISOString(),
    future = new Date(2026, 8, 5, 13).toISOString();
  expect(
    dailyResponseCount(
      [
        row("first"),
        row("first"),
        row("repair"),
        row("de", noon, "de"),
        row("old", prior),
        row("future", future),
      ],
      "en",
      noon,
    ),
  ).toBe(2);
});
test("a goal is a small practice budget, not an arbitrary score or unlimited counter", () => {
  const saved = store(),
    plan = loadDailyPlan(saved, "en", noon).plan;
  expect(() =>
    saveDailyPlan(saved, "en", { ...plan, responseGoal: 100 as 3 }),
  ).toThrow("Invalid daily");
  expect(saved.length).toBe(0);
});
