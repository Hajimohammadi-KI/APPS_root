import { expect, test } from "bun:test";
import { targetWritingInput } from "./target-writing-input";

test("target is last, context is read-only, and reference metadata never enters the model request", () => {
  const row = { language: "de" as const, text: 'Zitat: "Hallo".\nEnde.', before: "Vorher", after: "Danach", id: "private-id", label: "error", reference: "gold correction" };
  const payload = JSON.parse(targetWritingInput(row));
  expect(Object.keys(payload)).toEqual(["language", "read_only_context", "target"]);
  expect(payload).toEqual({ language: "de", read_only_context: { before: "Vorher", after: "Danach" }, target: row.text });
  expect(targetWritingInput(row)).not.toContain("gold correction");
  expect(targetWritingInput(row)).not.toContain("private-id");
});
