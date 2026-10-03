import { expect, test } from "bun:test";
import { boundedResponse, candidateChoice, parseContextVerdict } from "./context-candidate";
test("a model cannot pass changed text or claim a repair without source evidence", () => {
  expect(() => parseContextVerdict({ verdict: "correct", correction: "He goes.", evidence: [] }, "He go.")).toThrow();
  expect(() => parseContextVerdict({ verdict: "incorrect", correction: "He goes.", evidence: ["went"] }, "He go.")).toThrow();
  expect(() => parseContextVerdict({ verdict: "incorrect", correction: "He goes.", evidence: [] }, "He go.")).toThrow();
  expect(parseContextVerdict({ verdict: "incorrect", correction: "He goes.", evidence: ["He go"] }, "He go.").verdict).toBe("incorrect");
  expect(parseContextVerdict({ verdict: "correct", correction: "She works.", evidence: [] }, "She works.").verdict).toBe("correct");
  expect(() => parseContextVerdict({ verdict: "uncertain", correction: "He goes.", evidence: ["go"] }, "He go.")).toThrow();
});
test("model identity, truncated and oversized responses fail closed", async () => {
  expect(() => candidateChoice({ model: "wrong", system_fingerprint: "b11146-7fe450e19", choices: [] })).toThrow();
  await expect(boundedResponse(new Response('"' + "a".repeat(128000) + '"'))).rejects.toThrow("Oversized");
});
