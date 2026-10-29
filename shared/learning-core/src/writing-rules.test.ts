import { expect, test } from "bun:test";
import { writingIssues } from "./writing-rules";
import { countPerfectUses } from "./english-lexicon";

test("W12 a/an follows known initial sounds and abstains on ambiguous words", () => {
  for (const text of ["an hour", "an honest person", "a university", "a European city", "a one-way street", "an apple", "a user", "an herb", "a herb", "an SQL query"])
    expect(writingIssues(text, "en")).toEqual([]);
  for (const text of ["a hour", "an university", "a apple", "an user"])
    expect(writingIssues(text, "en")[0]?.ruleId).toBe("EN_INITIAL_SOUND");
});
test("W14 participle lexicon excludes suffix lookalikes and includes irregular forms", () => {
  expect(countPerfectUses("I have a pen. She has green eyes.")).toBe(0);
  expect(countPerfectUses("I have sung. She has swum. We have practised.")).toBe(3);
  expect(writingIssues("She doesn't kiss. I did need help.", "en")).toEqual([]);
  expect(writingIssues("She doesn't goes. He did went.", "en").map(i => i.replacement)).toEqual(["go", "go"]);
});
test("W13 agreement respects questions, modals, subjunctives and noun phrase heads", () => {
  for (const text of ["Does she have a car?", "He may have left.", "I insist that he have a chance.", "She and he have arrived."])
    expect(writingIssues(text, "en").filter(i => i.ruleId === "EN_SUBJECT_AGREEMENT")).toEqual([]);
  expect(writingIssues("The list of items are ready.", "en").some(i => i.ruleId === "EN_SUBJECT_AGREEMENT")).toBe(true);
  expect(writingIssues("The lists of items are ready.", "en")).toEqual([]);
  expect(writingIssues("He have a car.", "en").some(i => i.replacement === "has")).toBe(true);
});
