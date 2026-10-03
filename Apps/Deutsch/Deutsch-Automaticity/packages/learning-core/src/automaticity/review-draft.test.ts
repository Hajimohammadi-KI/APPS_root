import { expect, test } from "bun:test";
import {
  parseReviewDraft,
  reviewDraftKey,
  saveReviewDraft,
  type ReviewDraft,
} from "./review-draft";
import { ownsStorageKey, type LocalStore } from "./storage";
import type { AttemptEvent } from "./contracts";
const attempt = {
  id: "a",
  language: "en",
  response: { sha256: "a".repeat(64) },
} as AttemptEvent;
const draft: ReviewDraft = {
  version: 1,
  attemptId: "a",
  responseSha256: "a".repeat(64),
  baseAssessmentId: null,
  reviewerKind: "human",
  reviewerName: "Synthetic reviewer",
  verdict: "needs_repair",
  opportunities: "2",
  feedback: "Synthetic unfinished feedback",
  correction: "Synthetic correction",
  updatedAt: "2026-09-05T08:00:00.000Z",
};
function store(): LocalStore {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}
test("review drafts preserve each field and belong to their language backup", () => {
  const storage = store(),
    raw = saveReviewDraft(storage, "en", attempt, draft, null);
  expect(parseReviewDraft(raw, attempt)).toEqual(draft);
  expect(ownsStorageKey(reviewDraftKey("en", "a"), "en")).toBe(true);
  expect(ownsStorageKey(reviewDraftKey("en", "a"), "de")).toBe(false);
});
test("review draft cannot move to a different response or language", () => {
  expect(() =>
    parseReviewDraft(JSON.stringify(draft), { ...attempt, id: "b" }),
  ).toThrow();
  expect(() =>
    parseReviewDraft(JSON.stringify(draft), {
      ...attempt,
      response: { ...attempt.response, sha256: "b".repeat(64) },
    }),
  ).toThrow();
  expect(() => saveReviewDraft(store(), "de", attempt, draft, null)).toThrow(
    "language",
  );
});
test("corrupt draft bytes remain intact", () => {
  const storage = store(),
    key = reviewDraftKey("en", "a");
  storage.setItem(key, "broken original");
  expect(() =>
    saveReviewDraft(storage, "en", attempt, draft, "broken original"),
  ).toThrow();
  expect(storage.getItem(key)).toBe("broken original");
});
test("a competing editor's newer draft is not overwritten", () => {
  const storage = store(),
    old = saveReviewDraft(storage, "en", attempt, draft, null);
  const newer = saveReviewDraft(
    storage,
    "en",
    attempt,
    { ...draft, feedback: "Newer feedback" },
    old,
  );
  expect(() =>
    saveReviewDraft(
      storage,
      "en",
      attempt,
      { ...draft, feedback: "Stale writer" },
      old,
    ),
  ).toThrow("another tab");
  expect(storage.getItem(reviewDraftKey("en", "a"))).toBe(newer);
});
test("quota failure and discarded writes cannot claim persistence", () => {
  const storage = store(),
    old = saveReviewDraft(storage, "en", attempt, draft, null);
  const full = {
    ...storage,
    setItem() {
      throw new Error("quota");
    },
  };
  expect(() =>
    saveReviewDraft(
      full,
      "en",
      attempt,
      { ...draft, feedback: "Unsaved" },
      old,
    ),
  ).toThrow("quota");
  expect(storage.getItem(reviewDraftKey("en", "a"))).toBe(old);
  const ignored = { ...storage, setItem() {} };
  expect(() =>
    saveReviewDraft(
      ignored,
      "en",
      attempt,
      { ...draft, feedback: "Ignored" },
      old,
    ),
  ).toThrow("could not be saved");
});
test("malformed draft fields are rejected before writes", () => {
  for (const change of [
    { version: 2 },
    { reviewerKind: "model" },
    { verdict: "100%" },
    { baseAssessmentId: 7 },
    { feedback: "x".repeat(10001) },
    { updatedAt: "unknown" },
  ])
    expect(() =>
      saveReviewDraft(
        store(),
        "en",
        attempt,
        { ...draft, ...change } as ReviewDraft,
        null,
      ),
    ).toThrow();
});
