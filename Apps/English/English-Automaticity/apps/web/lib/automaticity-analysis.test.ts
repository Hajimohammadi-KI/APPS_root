import { describe, expect, it } from "bun:test";

import {
	analyzePresentPerfect,
	countPresentPerfectUses,
	practiceAnswerMatches,
} from "./automaticity-analysis";

describe("Present Perfect offline analysis", () => {
	it("counts regular and irregular participles", () => {
		expect(
			countPresentPerfectUses(
				"I have worked today. She has written a report. We have never seen it.",
			),
		).toBe(3);
	});

	it("accepts a complete six-sentence journal with four target uses", () => {
		const result = analyzePresentPerfect(
			"I have worked on my project today. I have written two notes. I have never used this method before. My friend has given me advice. The advice is useful. I feel more confident now.",
		);

		expect(result.sentenceCount).toBe(6);
		expect(result.targetUses).toBe(4);
		expect(result.targetHit).toBe(true);
	});

	it("reports auxiliary agreement errors", () => {
		const result = analyzePresentPerfect("She have written a note.");

		expect(result.issues[0]?.code).toBe("auxiliary_agreement");
		expect(result.issues[0]?.corrected).toBe("She has");
	});

	it("does not mark short recognition-only input as output mastery", () => {
		const result = analyzePresentPerfect("I have worked.");

		expect(result.targetHit).toBe(false);
		expect(result.score).toBeLessThan(100);
	});

	it("preserves required capitalization and sentence punctuation", () => {
		const expected = "I have worked on this project since May";
		expect(practiceAnswerMatches(`${expected}.`, expected)).toBe(true);
		expect(practiceAnswerMatches(`  ${expected}  `, expected)).toBe(true);
		expect(practiceAnswerMatches("i have worked on this project since may", expected)).toBe(false);
		expect(practiceAnswerMatches(`${expected}???`, expected)).toBe(false);
		expect(practiceAnswerMatches("I have not worked on this project since May", expected)).toBe(false);
	});
});
