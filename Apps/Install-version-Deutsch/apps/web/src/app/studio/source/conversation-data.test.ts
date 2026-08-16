import { describe, expect, it } from "bun:test";
import { grammarUnits } from "@grammar/content";

import { conversationTopics } from "./conversation-data";

describe("conversation topic <-> grammar unit linking", () => {
  it("assigns every topic a real, existing grammarUnits title, not the bare CEFR level", () => {
    const titles = new Set(grammarUnits.map((unit) => unit.title));
    for (const topic of conversationTopics) {
      expect(topic.relatedGrammar).not.toBeNull();
      expect(titles.has(topic.relatedGrammar!)).toBe(true);
    }
  });

  it("only links a topic to a grammar unit at the same CEFR level", () => {
    for (const topic of conversationTopics) {
      const unit = grammarUnits.find((u) => u.title === topic.relatedGrammar);
      expect(unit?.level).toBe(topic.level);
    }
  });

  it("distributes topics across a level's units instead of collapsing onto one", () => {
    const byLevel = new Map<string, Set<string>>();
    for (const topic of conversationTopics) {
      const set = byLevel.get(topic.level) ?? new Set<string>();
      if (topic.relatedGrammar) set.add(topic.relatedGrammar);
      byLevel.set(topic.level, set);
    }
    for (const [level, relatedTitles] of byLevel) {
      expect(relatedTitles.size).toBeGreaterThan(1);
      void level;
    }
  });

  it("carries the real grammar link into the goal text shown to the learner", () => {
    for (const topic of conversationTopics) {
      if (topic.relatedGrammar) {
        expect(topic.goal).toContain(topic.relatedGrammar);
      }
    }
  });
});
