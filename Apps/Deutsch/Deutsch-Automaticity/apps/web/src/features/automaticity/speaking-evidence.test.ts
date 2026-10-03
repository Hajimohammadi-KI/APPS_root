import { describe, expect, it } from "bun:test";

import { speakingEvidenceBlock } from "./speaking-evidence";

describe("speaking evidence gate", () => {
  it("rejects typed text without a real audio blob", () => {
    expect(
      speakingEvidenceBlock({
        audioSize: 0,
        seconds: 60,
        requiredSeconds: 45,
        shadowingComplete: true,
      }),
    ).toBe("missing-audio");
  });

  it("requires enough recorded time and every shadowing stage", () => {
    expect(
      speakingEvidenceBlock({
        audioSize: 100,
        seconds: 20,
        requiredSeconds: 30,
        shadowingComplete: true,
      }),
    ).toBe("too-short");
    expect(
      speakingEvidenceBlock({
        audioSize: 100,
        seconds: 30,
        requiredSeconds: 30,
        shadowingComplete: false,
      }),
    ).toBe("incomplete-shadowing");
  });

  it("accepts a complete recorded attempt", () => {
    expect(
      speakingEvidenceBlock({
        audioSize: 100,
        seconds: 45,
        requiredSeconds: 45,
        shadowingComplete: true,
      }),
    ).toBeNull();
  });
});
