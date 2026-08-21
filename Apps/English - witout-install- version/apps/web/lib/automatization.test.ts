import { describe, expect, it } from "bun:test";

import {
	attemptModeToModuleType,
	buildAutomatizationMatrix,
	gradeFreeRetelling,
	SHADOWING_STAGES,
} from "./automatization";

describe("attemptModeToModuleType", () => {
	it("maps the three automatization attempt modes", () => {
		expect(attemptModeToModuleType("auto_retrieval")).toBe("retrieval");
		expect(attemptModeToModuleType("auto_shadowing")).toBe("shadowing");
		expect(attemptModeToModuleType("auto_formulaic")).toBe("formulaic");
	});

	it("returns null for pre-existing Grammar Lab / Automaticity Mission modes", () => {
		expect(attemptModeToModuleType("recognition")).toBeNull();
		expect(attemptModeToModuleType("writing")).toBeNull();
		expect(attemptModeToModuleType("speaking")).toBeNull();
		expect(attemptModeToModuleType("transfer")).toBeNull();
	});
});

describe("SHADOWING_STAGES", () => {
	it("has exactly 5 stages in order, with stage 4 marked most important", () => {
		expect(SHADOWING_STAGES.map((stage) => stage.stage)).toEqual([1, 2, 3, 4, 5]);
		expect(SHADOWING_STAGES[3]?.mostImportant).toBe(true);
		expect(SHADOWING_STAGES.filter((stage) => stage.mostImportant)).toHaveLength(1);
	});

	it("only allows a single play on stage 1 and no audio on stage 5", () => {
		expect(SHADOWING_STAGES[0]?.maxPlays).toBe(1);
		expect(SHADOWING_STAGES[4]?.rate).toBeNull();
	});

	it("shows the transcript only from stage 3 onward", () => {
		expect(SHADOWING_STAGES.map((stage) => stage.showTranscript)).toEqual([
			false,
			false,
			true,
			true,
			false,
		]);
	});
});

describe("gradeFreeRetelling", () => {
	const passage =
		"I have worked on an important project this week. I have already solved two difficult problems.";

	it("passes a genuine paraphrase that reuses enough content words", () => {
		const result = gradeFreeRetelling(
			passage,
			"This week I worked on a big project and solved two hard problems already.",
		);
		expect(result.passed).toBe(true);
		expect(result.overlapRatio).toBeGreaterThan(0);
	});

	it("rejects a retelling far too short to be genuine free production", () => {
		const result = gradeFreeRetelling(passage, "I worked.");
		expect(result.passed).toBe(false);
	});

	it("rejects a long retelling unrelated to the passage", () => {
		const result = gradeFreeRetelling(
			passage,
			"The weather today is sunny and warm with a light breeze from the coast.",
		);
		expect(result.passed).toBe(false);
	});

	it("does not require the retelling to be an exact copy of the passage", () => {
		// Copying verbatim should still pass (it trivially reuses the words),
		// but the grading itself must not special-case rejecting a copy --
		// unlike evaluatePracticeAnswer's "don't just repeat the prompt" rule,
		// which does not apply to a retelling task.
		const result = gradeFreeRetelling(passage, passage);
		expect(result.passed).toBe(true);
	});
});

describe("buildAutomatizationMatrix", () => {
	function isoDaysAgo(days: number): string {
		return new Date(Date.now() - days * 86_400_000).toISOString();
	}

	it("buckets attempts into 4 rolling 7-day weeks, oldest first", () => {
		const attempts = [
			{ mode: "auto_retrieval", createdAt: isoDaysAgo(0), accuracyScore: 100, latencyMs: 1000 },
			{ mode: "auto_retrieval", createdAt: isoDaysAgo(10), accuracyScore: 50, latencyMs: 2000 },
			{ mode: "auto_shadowing", createdAt: isoDaysAgo(25), accuracyScore: 80, latencyMs: null },
			{ mode: "recognition", createdAt: isoDaysAgo(0), accuracyScore: 100, latencyMs: null },
		];
		const matrix = buildAutomatizationMatrix(attempts);

		expect(matrix.weekLabels).toHaveLength(4);
		expect(matrix.weekLabels.at(-1)).toBe("This week");
		// Most recent retrieval attempt (day 0) lands in the last (this week) bucket.
		expect(matrix.cells.retrieval.at(-1)?.attempts).toBe(1);
		expect(matrix.cells.retrieval.at(-1)?.accuracy).toBe(100);
		// The day-10 retrieval attempt lands 2 weeks back.
		expect(matrix.cells.retrieval.at(-2)?.attempts).toBe(1);
		// The day-25 shadowing attempt lands in the oldest bucket.
		expect(matrix.cells.shadowing[0]?.attempts).toBe(1);
		// A non-automatization mode is excluded entirely.
		const totalTrackedAttempts = [
			...matrix.cells.retrieval,
			...matrix.cells.shadowing,
			...matrix.cells.formulaic,
		].reduce((sum, cell) => sum + cell.attempts, 0);
		expect(totalTrackedAttempts).toBe(3);
	});

	it("returns null accuracy/latency for empty cells instead of 0", () => {
		const matrix = buildAutomatizationMatrix([]);
		for (const moduleType of matrix.moduleTypes) {
			for (const cell of matrix.cells[moduleType]) {
				expect(cell.attempts).toBe(0);
				expect(cell.accuracy).toBeNull();
				expect(cell.medianLatencyMs).toBeNull();
			}
		}
	});
});
