import { describe, expect, test } from "bun:test";

import { conversationTopics } from "./conversation-data";
import {
  countWords,
  formatTime,
  isEvaluationResponse,
  readStudioEntry,
  safeSameOriginPath,
  studioAudioToStore,
  unique,
} from "./studio-helpers";

const origin = "https://deutsch.example";

describe("studio helpers", () => {
  test("formats seconds and counts words with umlauts and digits", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(125)).toBe("2:05");
    expect(countWords(" Ich möchte 2 Brötchen, bitte ")).toBe(5);
    expect(unique(["B1", "B2", "B1"])).toEqual(["B1", "B2"]);
  });

  test("keeps return paths on the same origin", () => {
    expect(safeSameOriginPath("/heute?activity=2", "/", origin)).toBe(
      "/heute?activity=2",
    );
    expect(
      safeSameOriginPath("https://evil.example/heute", "/heute", origin),
    ).toBe("/heute");
    expect(safeSameOriginPath(null, "/heute", origin)).toBe("/heute");
  });

  test("only a real LanguageTool payload counts as an evaluation", () => {
    expect(
      isEvaluationResponse({
        original: "a",
        corrected: "b",
        provider: "LanguageTool",
        checkedAt: "now",
        issues: [],
      }),
    ).toBe(true);
    expect(isEvaluationResponse({ original: "a" })).toBe(false);
  });

  test("daily deep link picks activity, level, topic and a safe return path", () => {
    const entry = readStudioEntry(
      "?from=daily&activity=3&level=A2&return=https://evil.example/x",
      origin,
    );
    expect(entry?.activity).toBe(3);
    expect(entry?.level).toBe("A2");
    expect(entry?.returnPath).toBe("/heute");
    expect(
      conversationTopics.find((topic) => topic.id === entry?.topicId)?.level,
    ).toBe("A2");
  });

  test("a non-numeric activity falls back to activity 2 and plain visits open normally", () => {
    expect(readStudioEntry("?from=daily&activity=abc", origin)?.activity).toBe(
      2,
    );
    expect(readStudioEntry("", origin)).toBeNull();
  });

  test("the recording is kept only with explicit audio consent", () => {
    const audio = new Blob(["Stimme"], { type: "audio/webm" });
    expect(studioAudioToStore(audio, false, "a1")).toEqual({ audio: null });
    expect(studioAudioToStore(new Blob([]), true, "a1")).toEqual({
      audio: null,
    });
    expect(studioAudioToStore(audio, true, "a1")).toEqual({
      audio,
      audioReferenceId: "a1",
    });
  });
});
