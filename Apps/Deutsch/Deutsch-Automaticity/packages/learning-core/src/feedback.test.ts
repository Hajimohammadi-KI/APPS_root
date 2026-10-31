import { expect, test } from "bun:test";
import {
  FEEDBACK_MESSAGE_LIMIT,
  feedbackAddress,
  feedbackEmail,
} from "./feedback";

const draft = {
  app: "en",
  release: "2026.10.31.1",
  page: "/practice?task=en.c.001.repair.0.writing&topic=Verb+be",
  category: "content",
  message: "The model answer for 'I am agree' looks wrong.\nThanks!",
} as const;

test("contact stays hidden until a valid address is configured", () => {
  expect(feedbackAddress("")).toBeNull();
  expect(feedbackAddress("not an address")).toBeNull();
  expect(feedbackAddress("a@b")).toBeNull();
  expect(feedbackAddress(" feedback@example.org ")).toBe(
    "feedback@example.org",
  );
  expect(feedbackEmail(draft, "")).toEqual({
    ok: false,
    reason: "unavailable",
  });
});

test("a feedback email carries the category, message, app, release and page path only", () => {
  const result = feedbackEmail(draft, "feedback@example.org");
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  const url = new URL(result.href);
  expect(url.protocol).toBe("mailto:");
  expect(url.pathname).toBe("feedback@example.org");
  expect(url.searchParams.get("subject")).toBe(
    "[English Automaticity] Content problem",
  );
  const body = url.searchParams.get("body")!;
  expect(body).toContain(
    "The model answer for 'I am agree' looks wrong.\nThanks!",
  );
  expect(body).toContain("Release: 2026.10.31.1");
  // The query string can hold learner context; only the path is shared.
  expect(body).toContain("Page: /practice\n");
  expect(body).not.toContain("task=");
  expect(result.body).toBe(body);
});

test("German feedback uses German labels", () => {
  const result = feedbackEmail(
    { ...draft, app: "de", category: "bug", page: "/grammatik" },
    "feedback@example.org",
  );
  expect(result.ok && new URL(result.href).searchParams.get("subject")).toBe(
    "[DeutschFlow] Fehler melden",
  );
});

test("empty and overlong messages are refused, never truncated", () => {
  expect(
    feedbackEmail({ ...draft, message: "  \n " }, "feedback@example.org"),
  ).toEqual({ ok: false, reason: "empty" });
  expect(
    feedbackEmail(
      { ...draft, message: "x".repeat(FEEDBACK_MESSAGE_LIMIT + 1) },
      "feedback@example.org",
    ),
  ).toEqual({ ok: false, reason: "too_long" });
  const longest = feedbackEmail(
    { ...draft, message: "ü".repeat(FEEDBACK_MESSAGE_LIMIT) },
    "feedback@example.org",
  );
  expect(longest.ok).toBe(true);
  // Stays within what current mail apps open; the page also offers copying.
  expect(longest.ok && longest.href.length).toBeLessThan(16000);
});
