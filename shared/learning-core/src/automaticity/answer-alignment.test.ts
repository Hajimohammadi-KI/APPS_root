import { expect, test } from "bun:test";
import { alignAnswers } from "./answer-alignment";
test("W08 describes missing, extra, replaced and reordered tokens without grading", () => {
  expect(alignAnswers("I gone home.", "I have gone home.").map(e => e.type)).toEqual(["missing"]);
  expect(alignAnswers("I have have gone.", "I have gone.").map(e => e.type)).toEqual(["extra"]);
  const change = alignAnswers("She go home.", "She goes home.");
  expect(change[0]).toMatchObject({ type: "replace", start: 4, end: 6, original: "go", expected: "goes" });
  expect(alignAnswers("heute ich komme", "ich komme heute").some(e => e.type === "order")).toBe(true);
  expect(alignAnswers("Sie kommt!", "sie kommt?").length).toBe(2);
  expect(alignAnswers("a ".repeat(300), "b ".repeat(300))).toEqual([]);
});
