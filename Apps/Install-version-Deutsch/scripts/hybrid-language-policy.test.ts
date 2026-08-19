import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");
const bridgeSource = readFileSync(
  resolve(projectRoot, "..", "..", "shared", "ai-provider-bridge.cjs"),
  "utf8",
);
const routeSource = readFileSync(
  resolve(projectRoot, "apps", "web", "src", "app", "api", "ai", "route.ts"),
  "utf8",
);
const coachSource = readFileSync(
  resolve(
    projectRoot,
    "apps",
    "web",
    "src",
    "features",
    "language-analysis",
    "hybrid-language-coach.tsx",
  ),
  "utf8",
);

describe("hybride Sprachfeedback-Regeln", () => {
  test("Desktop-LLM-Prompt wahrt Nachweisgrenzen", () => {
    expect(bridgeSource).toContain('purpose === "language-analysis"');
    expect(bridgeSource).toContain(
      "Never award CEFR, mastery, automaticity, comprehension, or pronunciation",
    );
    expect(bridgeSource).toContain("A transcript is not audio evidence");
    expect(bridgeSource).toContain("Return exactly these three short sections");
  });

  test("Browser-Route übernimmt dieselben Schutzregeln", () => {
    expect(routeSource).toContain('body.purpose === "language-analysis"');
    expect(routeSource).toContain(
      "Vergib niemals CEFR, Beherrschung, Automatik, Verstehen oder Aussprache",
    );
    expect(routeSource).toContain("ein Transkript ist kein Audionachweis");
    expect(routeSource).not.toContain("Es wurde keine Erklärung zurückgegeben");
  });

  test("LLM-Aktion setzt einen verbundenen Provider voraus", () => {
    expect(coachSource).toContain(
      "!analysis || !provider?.connected || askingLlm",
    );
    expect(coachSource).toContain("Unbestätigte Diagnose");
  });
});
