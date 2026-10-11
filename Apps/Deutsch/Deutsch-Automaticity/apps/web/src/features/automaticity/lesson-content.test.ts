import { describe, expect, test } from "bun:test";

import {
  lessonKey,
  requiredSpeakingSeconds,
  shadowingStages,
} from "./lesson-content";

describe("automatik lesson content", () => {
  test("lesson keys keep umlauts and collapse punctuation", () => {
    expect(lessonKey("Nebensatz mit weil")).toBe("automatik:nebensatz-mit-weil");
    expect(lessonKey("Präteritum: sein & haben")).toBe(
      "automatik:präteritum-sein-haben",
    );
  });

  test("beginners need 30 seconds of free speech, others 45", () => {
    expect(requiredSpeakingSeconds("A1")).toBe(30);
    expect(requiredSpeakingSeconds("A2")).toBe(30);
    expect(requiredSpeakingSeconds("B1")).toBe(45);
    expect(requiredSpeakingSeconds("C2")).toBe(45);
  });

  test("shadowing has five stages", () => {
    expect(shadowingStages).toHaveLength(5);
  });
});
