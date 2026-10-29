import { expect, test } from "bun:test";
import { RecognitionCollector } from "./speech";
test("W23 final result revisions do not duplicate text and unknown confidence abstains", () => {
  const collector = new RecognitionCollector();
  const event = { resultIndex: 0, results: [{ isFinal: true, length: 2, 0: { transcript: "I think", confidence: 0.6 }, 1: { transcript: "I sink", confidence: 0.4 } }] };
  expect(collector.update(event).finalText).toBe("I think");
  const result = collector.update(event);
  expect(result.finalText).toBe("I think");
  expect(result.reliable).toBe(false);
  expect(result.alternatives[0]?.length).toBe(2);
  expect(new RecognitionCollector().update({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "hello" } }] }).reliable).toBe(false);
});
