import { describe, expect, test } from "bun:test";

import {
	analyzeLanguageSample,
	buildLanguageAnalysisLlmRequest,
} from "./hybrid-language-analysis";

describe("hybrid language analysis", () => {
	test("compares content words without presenting overlap as comprehension", () => {
		const analysis = analyzeLanguageSample({
			skill: "listening",
			language: "en",
			sourceText:
				"The train leaves Berlin at nine because the meeting starts early.",
			responseText: "The train leaves Berlin at nine for an early meeting.",
		});
		const coverage = analysis.signals.find(
			(signal) => signal.id === "source-coverage",
		);
		expect(coverage?.value).not.toBe("N/A");
		expect(coverage?.detail).toContain("not comprehension");
		expect(analysis.evidenceClass).toBe("diagnostic-only");
	});

	test("reports transcript pace and fillers without inventing pronunciation", () => {
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

	test("builds an LLM request that cannot award mastery", () => {
		const input = {
			skill: "writing" as const,
			language: "en" as const,
			responseText:
				"I chose this option because it is practical. However, it has one limitation.",
		};
		const analysis = analyzeLanguageSample(input);
		const request = buildLanguageAnalysisLlmRequest(input, analysis);
		expect(request.purpose).toBe("language-analysis");
		expect(request.content).toContain("do not award CEFR, mastery, or automaticity");
		expect(request.content).toContain("one explicit repair");
	});
});
