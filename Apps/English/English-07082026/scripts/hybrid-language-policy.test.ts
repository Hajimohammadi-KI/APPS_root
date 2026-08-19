import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");
const bridgeSource = readFileSync(
  resolve(projectRoot, "..", "..", "..", "shared", "ai-provider-bridge.cjs"),
  "utf8",
);
const routeSource = readFileSync(
  resolve(projectRoot, "apps", "web", "app", "api", "ai", "route.ts"),
  "utf8",
);
const coachSource = readFileSync(
  resolve(
    projectRoot,
    "apps",
    "web",
    "features",
    "components",
    "hybrid-language-coach.tsx",
  ),
  "utf8",
);

describe("hybrid language feedback policy", () => {
  test("desktop LLM prompt preserves evidence boundaries", () => {
    expect(bridgeSource).toContain('purpose === "language-analysis"');
    expect(bridgeSource).toContain(
      "Never award CEFR, mastery, automaticity, comprehension, or pronunciation",
    );
    expect(bridgeSource).toContain("A transcript is not audio evidence");
    expect(bridgeSource).toContain("Return exactly these three short sections");
  });

  test("browser route carries the same safeguards", () => {
    expect(routeSource).toContain('body.purpose === "language-analysis"');
    expect(routeSource).toContain(
      "Never award CEFR, mastery, automaticity, comprehension, or pronunciation",
    );
		expect(routeSource).toContain("a transcript is not audio evidence");
		expect(routeSource).not.toContain("No explanation was returned");
  });

  test("LLM action is gated by a connected provider", () => {
    expect(coachSource).toContain(
      "!analysis || !provider?.connected || askingLlm",
    );
    expect(coachSource).toContain("Unverified diagnostic feedback");
  });
});
