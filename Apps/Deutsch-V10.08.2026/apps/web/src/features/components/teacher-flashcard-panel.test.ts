import { describe, expect, it } from "bun:test";

import { parseBatchLine } from "./teacher-flashcard-panel";

describe("parseBatchLine", () => {
  it("parses a front|back line", () => {
    expect(parseBatchLine("laufen | to run")).toEqual({ front: "laufen", back: "to run" });
  });

  it("parses a front|back|sentence line", () => {
    expect(parseBatchLine("gegessen | Partizip von essen | Sie hat früh gegessen.")).toEqual({
      front: "gegessen",
      back: "Partizip von essen",
      originalSentence: "Sie hat früh gegessen.",
    });
  });

  it("returns null when front is missing", () => {
    expect(parseBatchLine(" | to run")).toBeNull();
  });

  it("returns null when back is missing", () => {
    expect(parseBatchLine("laufen |  ")).toBeNull();
  });

  it("returns null for a line with no separator", () => {
    expect(parseBatchLine("nur irgendein Text")).toBeNull();
  });

  it("trims whitespace around each field", () => {
    expect(parseBatchLine("  laufen   |   to run   ")).toEqual({ front: "laufen", back: "to run" });
  });
});
