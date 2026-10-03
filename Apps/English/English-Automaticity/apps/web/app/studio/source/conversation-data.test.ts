import { describe, expect, test } from "bun:test";
import { conversationTopics, spokenChunksUsed } from "./conversation-data";

describe("natural spoken English chunks", () => {
  test("covers every conversation topic", () => {
    expect(conversationTopics).toHaveLength(72);
    expect(
      conversationTopics.every((topic) => topic.spokenChunks.length === 4),
    ).toBe(true);
  });

  test("matches chunks used in a learner transcript", () => {
    const topic = conversationTopics.find((candidate) => candidate.level === "A2");
    expect(topic).toBeDefined();

    const matches = spokenChunksUsed(
      "To be honest, I prefer the train. The thing is, it is much easier.",
      topic?.spokenChunks ?? [],
    );

    expect(matches.map((chunk) => chunk.text)).toEqual([
      "To be honest, ...",
      "The thing is, ...",
    ]);
  });

  test("does not invent matches from unrelated language", () => {
    const topic = conversationTopics.find((candidate) => candidate.level === "C2");
    expect(topic).toBeDefined();

    expect(
      spokenChunksUsed(
        "I enjoyed the discussion and would like to continue tomorrow.",
        topic?.spokenChunks ?? [],
      ),
    ).toEqual([]);
  });
});
