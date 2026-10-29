import { expect, test } from "bun:test";
import { writingIssues } from "./writing-rules";

test("W12 a/an follows known initial sounds and abstains on ambiguous words", () => {
  for (const text of ["an hour", "an honest person", "a university", "a European city", "a one-way street", "an apple", "a user", "an herb", "a herb", "an SQL query"])
    expect(writingIssues(text, "en")).toEqual([]);
  for (const text of ["a hour", "an university", "a apple", "an user"])
    expect(writingIssues(text, "en")[0]?.ruleId).toBe("EN_INITIAL_SOUND");
});
