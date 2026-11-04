import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const publicRoot = resolve(import.meta.dir, "../public/replacements/en");
const daily = readFileSync(resolve(publicRoot, "daily.html"), "utf8");
const grammar = readFileSync(resolve(publicRoot, "grammar.html"), "utf8");
const choiceKey = "automaticity:v2:en:choice";
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

test("daily entry has a shared main-path host and continuation while preserving seven activities", () => {
  expect(daily).toContain("data-learning-path-daily");
  expect(daily).toMatch(
    /<a\b[^>]*href="\/practice"[^>]*data-learning-path-continue/,
  );
  expect(daily).toContain("Supplementary seven-activity practice");
  expect(daily.match(/<article class="activity\b/g)?.length).toBe(7);
});

function dailyAction(localStorage: ReturnType<typeof storage>) {
  const start = daily.indexOf("levelSelect.addEventListener(");
  const tail = daily.slice(start);
  const bodyStart = tail.indexOf("=>") + 2;
  const body = tail.slice(bodyStart + tail.slice(bodyStart).indexOf("{") + 1);
  const end = body.match(/notify\(`[^`]*`\)\s*;?/);
  const endIndex = end?.index;
  if (!end || endIndex === undefined)
    throw new Error("Daily level change handler missing");
  const notices: string[] = [];
  runInNewContext(
    `(function(){${body.slice(0, endIndex + end[0].length)}})()`,
    {
      localStorage,
      levelSelect: { value: "B2" },
      notebookDaily: { dataset: {} },
      document: { getElementById: () => ({ textContent: "" }) },
      dailyTopic: () => "Supplementary B2",
      notify: (message: string) => notices.push(message),
      window: { dispatchEvent: () => {} },
      Event: class {},
      Date,
    },
  );
  return notices;
}

test("an explicit daily level change updates the shared choice without altering legacy profile", () => {
  const localStorage = storage();
  localStorage.setItem(
    "grammar-automaticity:v27",
    '{"learner":{"selfDeclaredLevel":"A2"}}',
  );
  dailyAction(localStorage);
  expect(JSON.parse(localStorage.getItem(choiceKey) ?? "null")).toMatchObject({
    version: 1,
    level: "B2",
  });
  expect(localStorage.getItem("grammar-automaticity:v27")).toBe(
    '{"learner":{"selfDeclaredLevel":"A2"}}',
  );
});

function grammarAction(localStorage: ReturnType<typeof storage>) {
  const start = grammar.indexOf('[data-action="use-today"]');
  const tail = grammar.slice(start);
  const bodyStart = tail.indexOf("=>") + 2;
  const body = tail.slice(bodyStart + tail.slice(bodyStart).indexOf("{") + 1);
  const end = body.match(/location\.href\s*=\s*`[^`]*`;/);
  const endIndex = end?.index;
  if (!end || endIndex === undefined)
    throw new Error("Use-today action missing");
  const location = { href: "" };
  const notices: string[] = [];
  runInNewContext(
    `(function(){${body.slice(0, endIndex + end[0].length)}})()`,
    {
      localStorage,
      progress: { activeLevel: "B1", activeTopic: "Present perfect" },
      lessonProfile: () => ({ rule: "Test rule" }),
      location,
      Date,
      crypto: { randomUUID: () => "review-fixture" },
      window: { dispatchEvent: () => {} },
      Event: class {},
      encodeURIComponent,
      notify: (message: string) => notices.push(message),
    },
  );
  return { location, notices };
}

test("Grammar Lab use-today preserves the explicit topic in the shared choice", () => {
  const localStorage = storage();
  localStorage.setItem(
    "grammar-automaticity:v27",
    '{"preserved":"learner data","reviews":[]}',
  );
  const { location } = grammarAction(localStorage);
  expect(JSON.parse(localStorage.getItem(choiceKey) ?? "null")).toMatchObject({
    version: 1,
    level: "B1",
    topic: "Present perfect",
  });
  expect(
    JSON.parse(localStorage.getItem("grammar-automaticity:v27") ?? "{}")
      .preserved,
  ).toBe("learner data");
  expect(location.href).toContain("/daily?from=grammar&level=B1");
});

test("explicit daily and Grammar Lab actions preserve unreadable canonical choice bytes and other learner state", () => {
  for (const raw of [
    "{broken",
    JSON.stringify({
      version: 2,
      level: "A1",
      updatedAt: "2026-11-04T09:00:00Z",
    }),
    JSON.stringify({ version: 1, level: "B9", updatedAt: "invalid" }),
  ]) {
    for (const entry of ["daily", "grammar"]) {
      const localStorage = storage();
      const profile = '{"preserved":"learner data","reviews":[]}';
      localStorage.setItem("grammar-automaticity:v27", profile);
      localStorage.setItem("english-cefr-level", "A2");
      localStorage.setItem(choiceKey, raw);
      const result =
        entry === "daily"
          ? { notices: dailyAction(localStorage), location: { href: "" } }
          : grammarAction(localStorage);
      expect(localStorage.getItem(choiceKey)).toBe(raw);
      expect(localStorage.getItem("grammar-automaticity:v27")).toBe(profile);
      expect(localStorage.getItem("english-cefr-level")).toBe("A2");
      expect(result.location.href).toBe("");
      expect(result.notices[0]).toContain("saved learning choice");
    }
  }
});

test("Grammar Lab use-today refuses unreadable or non-object learner data before changing any saved choice", () => {
  for (const raw of ["{broken", "null", "[]", "42", '"saved text"']) {
    const localStorage = storage();
    const canonical = JSON.stringify({
      version: 1,
      level: "A2",
      updatedAt: "2026-11-04T09:00:00Z",
    });
    localStorage.setItem("grammar-automaticity:v27", raw);
    localStorage.setItem(choiceKey, canonical);
    const result = grammarAction(localStorage);
    expect(localStorage.getItem("grammar-automaticity:v27")).toBe(raw);
    expect(localStorage.getItem(choiceKey)).toBe(canonical);
    expect(result.location.href).toBe("");
    expect(result.notices[0]).toContain("saved learner data");
  }
});

test("Grammar Lab use-today preserves unrelated saved reviews", () => {
  const localStorage = storage();
  const original = {
    id: "existing-review",
    sourceType: "grammar_topic",
    sourceId: "Other topic",
    status: "pending",
    original: "Original learner response",
  };
  localStorage.setItem(
    "grammar-automaticity:v27",
    JSON.stringify({ reviews: [original], preserved: "profile" }),
  );
  grammarAction(localStorage);
  const saved = JSON.parse(
    localStorage.getItem("grammar-automaticity:v27") ?? "null",
  );
  expect(saved.reviews[0]).toEqual(original);
  expect(saved.reviews).toHaveLength(2);
  expect(saved.preserved).toBe("profile");
});
