import { describe, expect, test } from "bun:test";

import { conversationTopics } from "./conversation-data";
import {
  comparableTokens,
  countWords,
  formatTime,
  issueSegments,
  isEvaluationResponse,
  readStudioEntry,
  safeSameOriginPath,
  studioAudioToStore,
  unique,
} from "./studio-helpers";

const origin = "https://english.example";

describe("studio helpers", () => {
  test("formats seconds as m:ss and counts words across scripts", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(countWords("  I don’t know – maybe 2 things ")).toBe(6);
    expect(unique(["A1", "A2", "A1"])).toEqual(["A1", "A2"]);
  });

  test("keeps return paths on the same origin", () => {
    expect(safeSameOriginPath("/daily?activity=2#top", "/", origin)).toBe(
      "/daily?activity=2#top",
    );
    expect(safeSameOriginPath("https://evil.example/daily", "/daily", origin)).toBe("/daily");
    expect(safeSameOriginPath(null, "/daily", origin)).toBe("/daily");
    expect(safeSameOriginPath("http://[bad", "/daily", origin)).toBe("/daily");
  });

  test("only a real LanguageTool payload counts as an evaluation", () => {
    expect(
      isEvaluationResponse({ original: "a", corrected: "b", provider: "LanguageTool", checkedAt: "now", issues: [] }),
    ).toBe(true);
    expect(isEvaluationResponse({ original: "a", corrected: "b", provider: "Other", checkedAt: "now", issues: [] })).toBe(false);
    expect(isEvaluationResponse(null)).toBe(false);
  });

  test("comparable tokens drop stop words and endings", () => {
    expect(comparableTokens("Introducing yourself clearly to your classes")).toEqual(["introduc", "yourself", "class"]);
  });

  test("daily deep link picks the activity, level, topic and a safe return path", () => {
    const entry = readStudioEntry("?from=daily&activity=3&level=A2&return=https://evil.example/x", origin);
    expect(entry?.kind).toBe("daily");
    if (entry?.kind !== "daily") return;
    expect(entry.activity).toBe(3);
    expect(entry.level).toBe("A2");
    expect(entry.returnPath).toBe("/daily");
    expect(conversationTopics.find((topic) => topic.id === entry.topicId)?.level).toBe("A2");
  });

  test("a non-numeric activity falls back to activity 2", () => {
    const entry = readStudioEntry("?from=daily&activity=abc", origin);
    expect(entry?.kind === "daily" && entry.activity).toBe(2);
  });

  test("integrated-skills deep link resolves the unit and a matching topic", () => {
    const entry = readStudioEntry("?source=integrated-skills&unit=a1-introductions&level=A1", origin);
    expect(entry?.kind).toBe("integrated-skills");
    if (entry?.kind !== "integrated-skills") return;
    expect(entry.context).toMatchObject({ level: "A1", number: 1 });
    expect(entry.topicId).not.toBeNull();
  });

  test("unknown units and plain visits open the studio normally", () => {
    expect(readStudioEntry("?source=integrated-skills&unit=nope", origin)).toBeNull();
    expect(readStudioEntry("", origin)).toBeNull();
  });

  test("the recording is kept only with explicit audio consent", () => {
    const audio = new Blob(["voice"], { type: "audio/webm" });
    expect(studioAudioToStore(audio, false, "a1")).toEqual({ audio: null });
    expect(studioAudioToStore(new Blob([]), true, "a1")).toEqual({ audio: null });
    expect(studioAudioToStore(audio, true, "a1")).toEqual({
      audio,
      audioReferenceId: "a1",
    });
  });
  test("flagged words are located exactly, without overlapping highlights", () => {
    const issue = (offset: number, length: number) => ({
      message: "m",
      offset,
      length,
      replacements: [],
      ruleId: "R",
      category: "Grammar",
    });
    const text = "I is very happy.";
    expect(issueSegments(text, [issue(2, 2), issue(2, 7), issue(10, 5)])).toEqual([
      { text: "I ", issue: null },
      { text: "is", issue: 0 },
      { text: " very ", issue: null },
      { text: "happy", issue: 2 },
      { text: ".", issue: null },
    ]);
    expect(issueSegments(text, [issue(0, 0), issue(40, 2)])).toEqual([
      { text, issue: null },
    ]);
    expect(issueSegments("", [])).toEqual([]);
  });
});
