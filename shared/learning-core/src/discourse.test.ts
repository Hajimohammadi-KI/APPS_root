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
test("W32 advanced discourse cues are level-specific observations from fixed lists", () => {
  const result = discourseFeedback("Arguably, it helps. Nevertheless, more evidence is needed.", "en", "C1");
  expect(result.advanced?.hedges.map(s => s.text)).toEqual(["Arguably"]);
  expect(result.advanced?.connectors.map(s => s.text)).toEqual(["Nevertheless"]);
  expect(discourseFeedback("Dennoch ist es möglicherweise sinnvoll.", "de", "C2").advanced?.hedges).toHaveLength(1);
  expect(discourseFeedback("However, it helps.", "en", "A1").advanced).toBeNull();
});
