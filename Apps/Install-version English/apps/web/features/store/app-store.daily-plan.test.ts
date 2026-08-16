import { describe, expect, it } from "bun:test";

import { dailyPlanCompletion, lessonKey, type DailyPlan } from "./app-store";

describe("dailyPlanCompletion", () => {
	it("reads completion from the actual answer keys, not the unused completed[] field", () => {
		const key = lessonKey("Present Perfect");
		const plan: DailyPlan = {
			completed: [],
			answers: {
				[`${key}:practice`]: "done",
				[`${key}:writing`]: "done",
			},
		};

		// This is the exact bug: Home's progress ring used to read
		// plan.completed (always []) instead of plan.answers, so it always
		// showed 0% even when two of three activities were actually done.
		expect(dailyPlanCompletion(plan, key)).toEqual([true, true, false]);
	});

	it("is what both Home and Daily Practice must derive their progress from", () => {
		const key = lessonKey("Simple Past");
		const emptyPlan: DailyPlan = { completed: [], answers: {} };
		expect(dailyPlanCompletion(emptyPlan, key)).toEqual([false, false, false]);

		const fullPlan: DailyPlan = {
			completed: [],
			answers: {
				[`${key}:practice`]: "done",
				[`${key}:writing`]: "done",
				[`${key}:speaking`]: "done",
			},
		};
		expect(dailyPlanCompletion(fullPlan, key)).toEqual([true, true, true]);
	});

	it("normalizes 'Present Perfect' consistently regardless of casing", () => {
		expect(lessonKey("Present Perfect")).toBe(lessonKey("present perfect"));
	});
});
