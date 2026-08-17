import { describe, expect, it } from "bun:test";

import {
	analyzePresentPerfect,
	countPresentPerfectUses,
	evaluatePracticeAnswer,
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

	it("normalizes punctuation in controlled answers", () => {
		expect(practiceAnswerMatches("I have finished.", "i have finished")).toBe(
			true,
		);
	});
});

describe("Grammar Lab controlled-answer grading", () => {
	const transformExercise = {
		prompt: "Transform: I started this project in May and I still work on it.",
		expected: "I have worked on this project since May",
	};

	it("accepts the exact stored answer", () => {
		expect(
			evaluatePracticeAnswer(
				"I have worked on this project since May",
				transformExercise,
			),
		).toBe(true);
	});

	it("accepts a grammatically correct answer worded differently than the stored string", () => {
		expect(
			evaluatePracticeAnswer(
				"I've worked on this project since May.",
				transformExercise,
			),
		).toBe(true);
		expect(
			evaluatePracticeAnswer(
				"I have worked on this project since May, and it has been great.",
				transformExercise,
			),
		).toBe(true);
	});

	it("still rejects a genuinely incorrect answer", () => {
		expect(
			evaluatePracticeAnswer("I work on this project.", transformExercise),
		).toBe(false);
		expect(
			evaluatePracticeAnswer(
				"I started this project in May and I still work on it.",
				transformExercise,
			),
		).toBe(false);
	});

	it("rejects an answer with the wrong auxiliary even if it echoes other target words", () => {
		expect(
			evaluatePracticeAnswer(
				"I has worked on this project since May.",
				transformExercise,
			),
		).toBe(false);
	});

	it("accepts a valid rewording of a 'Correct the sentence' exercise", () => {
		const correctionExercise = {
			prompt: "Correct the sentence: I am agree.",
			expected: "I agree.",
		};
		expect(
			evaluatePracticeAnswer("Yes, I agree.", correctionExercise),
		).toBe(true);
		expect(
			evaluatePracticeAnswer("I am agree.", correctionExercise),
		).toBe(false);
	});

	it("still requires an exact match for single-form 'Type the model sentence' exercises", () => {
		const copyExercise = {
			prompt: "Type the model sentence: I am a student.",
			expected: "I am a student.",
		};
		expect(evaluatePracticeAnswer("I am a student.", copyExercise)).toBe(
			true,
		);
		expect(
			evaluatePracticeAnswer("I'm a student.", copyExercise),
		).toBe(false);
	});
});

// The repair family asks the learner to produce a whole sentence but does not
// begin with Transform/Complete/Correct, so it used to fall outside
// OPEN_PRODUCTION_PROMPT and was graded by exact match against the one stored
// key. Where that key is a bare corrected form ("two children"), a learner who
// followed the instruction and wrote a full sentence was marked wrong.
describe("repair prompts get open-production grading", () => {
	const fragmentKeyRepair = {
		prompt:
			"Repair this common error for “Plural nouns” and write the full corrected sentence.",
		expected: "two children",
	};

	it("accepts the stored corrected form itself", () => {
		expect(evaluatePracticeAnswer("two children", fragmentKeyRepair)).toBe(true);
	});

	it("accepts the full sentence the prompt actually asks for", () => {
		expect(
			evaluatePracticeAnswer("I have two children.", fragmentKeyRepair),
		).toBe(true);
	});

	it("still rejects an answer missing the target form", () => {
		expect(
			evaluatePracticeAnswer("I have two childs.", fragmentKeyRepair),
		).toBe(false);
	});
});
