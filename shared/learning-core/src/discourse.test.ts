import { expect, test } from "bun:test";
import { discourseFeedback } from "./discourse";
test("W31 claim and reason cues are descriptive and preserve original positions", () => {
  const text = "I think libraries matter because everyone can learn there. They should stay open.";
  const result = discourseFeedback(text, "en", "B1");
  expect(result.claimCues).toHaveLength(2);
  expect(result.reasonCues).toHaveLength(1);
  expect(result.score).toBeNull();
  for (const span of [...result.claimCues, ...result.reasonCues]) expect(text.slice(span.start, span.end)).toBe(span.text);
  expect(discourseFeedback("Ich denke, wir sollten bleiben, weil es regnet.", "de", "B1").reasonCues).toHaveLength(1);
});
