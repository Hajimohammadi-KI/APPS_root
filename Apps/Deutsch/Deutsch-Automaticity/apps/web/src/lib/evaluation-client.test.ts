import { describe, expect, it } from "bun:test";
import { requestEvaluation } from "./evaluation-client";

describe("unassessed evaluation responses", () => {
  it("keeps unknown language unassessed through the client and spelling accommodation", async () => {
    const report = await requestEvaluation({
      allowOnlineFeedback: false,
      apiBaseUrl: "",
      text: "Hotel",
      grammar: {
        title: "Nomen",
        rule: "Verwende ein Nomen.",
        examples: ["Das Hotel ist offen."],
      },
      kind: "free",
      spellingAffectsMastery: false,
    });
    expect(report).toMatchObject({
      status: "language_uncertain",
      accuracyScore: null,
      verified: false,
      ok: false,
    });
    expect(report.corrected).toBe("Hotel");
  });
});
