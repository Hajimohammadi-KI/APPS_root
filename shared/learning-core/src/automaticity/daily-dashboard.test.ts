import { expect, test } from "bun:test";
import { dailyDashboard } from "./daily-dashboard";
import {
  appendAutomaticityEvent,
  eventPrefix,
  type LocalStore,
} from "./storage";
import { loadDailyPlan, saveDailyPlan } from "./daily-plan";
import type { AttemptEvent } from "./contracts";

const now = new Date(2026, 9, 3, 12).toISOString();
function atDay(offset: number) {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString();
}
function store(): LocalStore {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
function attempt(
  id: string,
  at = now,
  language: "en" | "de" = "en",
): AttemptEvent {
  return {
    version: 2,
    type: "attempt",
    id,
    at,
    language,
    task: {
      id: "fixture",
      version: "1",
      constructionId: `${language}.c.001`,
      familyId: "G01",
      itemFamily: "one",
      contextId: "one",
      rubricVersion: "1",
      stage: "produce",
      modality: "writing",
      partition: "practice",
      transferCondition: "none",
      contentReview: "authored",
    },
    response: {
      text: "I am ready.",
      sha256: "a".repeat(64),
      originalTranscriptSha256: null,
      transcriptEdited: false,
    },
    timing: {
      startedAt: at,
      activeMs: null,
      firstInputMs: null,
      source: "unavailable",
    },
    assistance: {
      hintCount: 1,
      exampleSeen: false,
      solutionRevealed: false,
      selfReportedAssistance: false,
    },
    audio: null,
    previousAttemptId: null,
  };
}

test("home counts the practice ledger and chosen goal, not legacy completion flags", () => {
  const saved = store();
  saved.setItem(
    "grammar-automaticity:v27",
    JSON.stringify({ activity: { "2026-10-03": 99 }, completed: [1, 2, 3] }),
  );
  saveDailyPlan(saved, "en", {
    ...loadDailyPlan(saved, "en", now).plan,
    responseGoal: 5,
  });
  appendAutomaticityEvent(saved, attempt("one"));
  appendAutomaticityEvent(saved, attempt("two"));
  appendAutomaticityEvent(saved, attempt("other-language", now, "de"));
  const view = dailyDashboard(saved, "en", now);
  expect(view.responses).toBe(2);
  expect(view.percentage).toBe(40);
  expect(view.goal).toBe(5);
  expect(view.week.at(-1)?.count).toBe(2);
  expect(view.dueReviews).toBe(0);
});

test("week labels match their actual dates and yesterday's rhythm survives until today's practice", () => {
  const saved = store();
  appendAutomaticityEvent(saved, attempt("yesterday", atDay(-1)));
  appendAutomaticityEvent(saved, attempt("before", atDay(-2)));
  const view = dailyDashboard(saved, "en", now);
  expect(view.week.map((day) => day.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  expect(view.streak).toBe(2);
  expect(view.responses).toBe(0);
  appendAutomaticityEvent(saved, attempt("today"));
  expect(dailyDashboard(saved, "en", now).streak).toBe(3);
});

test("corrupt records remain intact and an unreadable total is never reported as zero percent", () => {
  const saved = store(),
    key = eventPrefix("en") + "broken";
  saved.setItem(key, "unfinished-json");
  expect(dailyDashboard(saved, "en", now).percentage).toBeNull();
  expect(saved.getItem(key)).toBe("unfinished-json");
});

test("new local day resets effort, preserves the stored plan, and caps the progress bar", () => {
  const saved = store();
  saveDailyPlan(saved, "en", {
    ...loadDailyPlan(saved, "en", now).plan,
    paused: true,
  });
  for (let index = 0; index < 4; index++)
    appendAutomaticityEvent(saved, attempt(`response-${index}`));
  expect(dailyDashboard(saved, "en", now)).toMatchObject({
    responses: 4,
    percentage: 100,
    paused: true,
  });
  expect(dailyDashboard(saved, "en", atDay(1))).toMatchObject({
    responses: 0,
    percentage: 0,
    paused: false,
  });
  expect(loadDailyPlan(saved, "en", now).plan.paused).toBe(true);
});
