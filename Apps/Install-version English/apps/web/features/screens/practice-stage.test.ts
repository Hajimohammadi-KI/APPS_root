import { describe, expect, it } from "bun:test";
import { nextPracticeStage } from "./automaticity-screen";

// Roadmap's three-stage timed-practice model (Stage 1 untimed >=90%,
// Stage 2 light-timing >=85%, Stage 3 real-time >=85%, regression at 20
// points below target). See STAGE_TARGET_ACCURACY / STAGE_REGRESSION_MARGIN
// in automaticity-screen.tsx for where these numbers are defined and why.
describe("nextPracticeStage", () => {
	it("advances Stage 1 to Stage 2 on a closed-book round meeting 90%", () => {
		expect(nextPracticeStage(1, 90, false)).toBe(2);
		expect(nextPracticeStage(1, 100, false)).toBe(2);
	});

	it("does not advance Stage 1 below its 90% target", () => {
		expect(nextPracticeStage(1, 89, false)).toBe(1);
	});

	it("advances Stage 2 to Stage 3 on a closed-book round meeting 85%", () => {
		expect(nextPracticeStage(2, 85, false)).toBe(3);
	});

	it("holds Stage 3 at Stage 3 even on a perfect round -- there is nowhere further to advance", () => {
		expect(nextPracticeStage(3, 100, false)).toBe(3);
	});

	it("regresses a stage on a clear accuracy collapse (20+ points below target)", () => {
		// Stage 2 target is 85; 64% is 21 points below -- past the margin.
		expect(nextPracticeStage(2, 64, false)).toBe(1);
		// Stage 3 target is 85; 64% is 21 points below.
		expect(nextPracticeStage(3, 64, false)).toBe(2);
	});

	it("does not regress on routine variance just under target", () => {
		// 70% at Stage 2 (target 85) is only 15 points under -- inside the margin.
		expect(nextPracticeStage(2, 70, false)).toBe(2);
	});

	it("never regresses below Stage 1", () => {
		expect(nextPracticeStage(1, 0, false)).toBe(1);
	});

	it("never moves the stage on an open-book round, regardless of score", () => {
		expect(nextPracticeStage(1, 100, true)).toBe(1);
		expect(nextPracticeStage(2, 0, true)).toBe(2);
		expect(nextPracticeStage(3, 100, true)).toBe(3);
	});
});
