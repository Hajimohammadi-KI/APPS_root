import { expect, test } from "bun:test";
import { annotationSlice, assertDisjoint, originalContext, surfaceKey } from "./context-data";

test("original context preserves learner errors and target boundaries", () => {
  expect(originalContext("Yesterday. He go home. Then eat.", "He go home .")).toEqual({ before: "Yesterday.", text: "He go home.", after: "Then eat." });
  expect(originalContext("Yes. Yes.", "Yes .")).toBeNull();
  expect(originalContext("This is not I. FI am. After.", "I am .")).toBeNull();
});
test("split audit rejects author and normalized duplicate leakage", () => {
  const one = [{ group: "a", author: "user1", text: "He's here." }];
  expect(() => assertDisjoint(one, [{ group: "b", author: "user1", text: "New." }])).toThrow("author");
  expect(() => assertDisjoint(one, [{ group: "b", author: "user2", text: "HE’S here ." }])).toThrow("surface");
  expect(() => assertDisjoint(one, [{ group: "b", author: null, text: "New." }])).not.toThrow();
  expect(surfaceKey("Grüße .")).toBe(surfaceKey("GRÜẞE."));
});
test("slices describe annotation categories without changing labels", () => {
  expect(annotationSlice(["R:PUNCT"])).toBe("orthography-only");
  expect(annotationSlice(["R:NOUN:FORM", "R:PUNCT"])).toBe("morphology-syntax-present");
  expect(annotationSlice(["R:OTHER"])).toBe("other-or-contextual");
});
