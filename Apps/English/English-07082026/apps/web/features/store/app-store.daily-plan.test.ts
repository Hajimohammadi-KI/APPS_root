import { describe, expect, it } from "bun:test";

import {
	dailyPlanCompletion,
	dailyPlanCompletionPercent,
	lessonKey,
	type DailyPlan,
} from "./app-store";

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

// Regression coverage for a real, user-visible bug: Daily Practice and Home
// each rounded this same tuple with a different formula and disagreed at
// 2-of-3 steps done (66% vs 67%). dailyPlanCompletionPercent is now the one
// shared formula both screens call.
describe("dailyPlanCompletionPercent", () => {
	it("agrees on 0/33/67/100 regardless of which screen used to compute it", () => {
		const key = lessonKey("Simple Past");
		const plans: DailyPlan[] = [
			{ completed: [], answers: {} },
			{ completed: [], answers: { [`${key}:practice`]: "done" } },
			{
				completed: [],
				answers: {
					[`${key}:practice`]: "done",
					[`${key}:writing`]: "done",
				},
			},
			{
				completed: [],
				answers: {
					[`${key}:practice`]: "done",
					[`${key}:writing`]: "done",
					[`${key}:speaking`]: "done",
				},
			},
		];

		expect(plans.map((plan) => dailyPlanCompletionPercent(plan, key))).toEqual([
			0, 33, 67, 100,
		]);
	});
});
