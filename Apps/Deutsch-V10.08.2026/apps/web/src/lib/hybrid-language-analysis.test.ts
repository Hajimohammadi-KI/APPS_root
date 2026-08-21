import { describe, expect, test } from "bun:test";

import {
  analyzeLanguageSample,
  buildLanguageAnalysisLlmRequest,
} from "./hybrid-language-analysis";

describe("hybride Sprachanalyse", () => {
  test("vergleicht Inhaltswörter, ohne Überlappung als Verstehen auszugeben", () => {
    const analysis = analyzeLanguageSample({
      skill: "reading",
      language: "de",
      sourceText:
        "Der Zug fährt um neun nach Berlin, weil die Besprechung früh beginnt.",
      responseText:
        "Der Zug fährt um neun nach Berlin zu einer frühen Besprechung.",
    });
    const coverage = analysis.signals.find(
      (signal) => signal.id === "source-coverage",
    );
    expect(coverage?.value).not.toBe("N/A");
    expect(coverage?.detail).toContain("kein Verstehen");
    expect(analysis.evidenceClass).toBe("diagnostic-only");
  });

  test("beschreibt Tempo und Füllwörter ohne erfundene Aussprachewertung", () => {
    const analysis = analyzeLanguageSample({
      skill: "speaking",
      language: "de",
      responseText:
        "Ähm ich erkläre zuerst die Idee und dann gebe ich ein Beispiel.",
      durationSeconds: 30,
    });
    expect(
      analysis.signals.find((signal) => signal.id === "pace")?.value,
    ).toMatch(/WPM$/u);
    expect(
      analysis.signals.find((signal) => signal.id === "fillers")?.value,
    ).toBe("1");
    expect(analysis.limitations.join(" ")).toContain("Aussprache");
  });

  test("baut eine LLM-Anfrage, die keine Beherrschung vergeben darf", () => {
    const input = {
      skill: "writing" as const,
      language: "de" as const,
      responseText:
        "Ich wähle diese Lösung, weil sie praktisch ist. Trotzdem hat sie eine Grenze.",
    };
    const analysis = analyzeLanguageSample(input);
    const request = buildLanguageAnalysisLlmRequest(input, analysis);
    expect(request.purpose).toBe("language-analysis");
    expect(request.content).toContain(
      "do not award CEFR, mastery, or automaticity",
    );
    expect(request.content).toContain("one explicit repair");
  });
});
