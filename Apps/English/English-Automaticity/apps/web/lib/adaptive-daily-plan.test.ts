import { describe, expect, test } from "bun:test";
import {
	allocateCoreMissionMinutes,
	buildAdaptiveDailyPlan,
	calculateDailyProgress,
} from "./adaptive-daily-plan";

describe("adaptive daily plan", () => {
	test("allocates six core activities to the exact selected duration", () => {
		for (const minutes of [15, 30, 45, 60] as const) {
			expect(
				allocateCoreMissionMinutes(minutes).reduce(
					(total, activityMinutes) => total + activityMinutes,
					0,
				),
			).toBe(minutes);
		}
	});
	test("prioritizes yesterday recall before every other activity", () => {
		const plan = buildAdaptiveDailyPlan({
			sessionMinutes: 15,
			hasPreviousLesson: true,
			previousLessonRecalled: false,
			dueReviewCount: 3,
			activeErrorCount: 2,
			hasIncompleteLesson: true,
			masteryScore: 90,
			automaticityScore: 90,
		});

		expect(plan.mission).toBe("recall");
		expect(plan.blocks[0]?.id).toBe("recall");
		expect(plan.blocks[1]?.id).toBe("review");
		expect(plan.blocks.map((block) => block.minutes)).toEqual([3, 3, 3, 4, 2]);
	});

	test("does not advance while review, errors, or unfinished work remain", () => {
		const plan = buildAdaptiveDailyPlan({
			sessionMinutes: 60,
			hasPreviousLesson: true,
			previousLessonRecalled: true,
			dueReviewCount: 0,
			activeErrorCount: 0,
			hasIncompleteLesson: true,
			masteryScore: 95,
			automaticityScore: 90,
		});

		expect(plan.mission).toBe("resume");
		expect(plan.canAdvance).toBeFalse();
		expect(plan.blocks[1]?.id).toBe("resume");
		expect(
			plan.blocks.slice(0, 3).every((block) => block.breakAfterMinutes === 4),
		).toBeTrue();
	});

	test("advances only after the can-do quality gate", () => {
		const plan = buildAdaptiveDailyPlan({
			sessionMinutes: 60,
			hasPreviousLesson: true,
			previousLessonRecalled: true,
			dueReviewCount: 0,
			activeErrorCount: 0,
			hasIncompleteLesson: false,
			masteryScore: 82,
			automaticityScore: 72,
		});

		expect(plan.mission).toBe("advance");
		expect(plan.canAdvance).toBeTrue();
		expect(plan.blocks[1]?.id).toBe("new_lesson");
		expect(plan.blocks.map((block) => block.minutes)).toEqual([
			10, 10, 10, 12, 6,
		]);
	});

	test("keeps every selectable route inside its promised duration", () => {
		for (const sessionMinutes of [15, 30, 45, 60] as const) {
			const plan = buildAdaptiveDailyPlan({
				sessionMinutes,
				hasPreviousLesson: false,
				previousLessonRecalled: true,
				dueReviewCount: 0,
				activeErrorCount: 0,
				hasIncompleteLesson: false,
				masteryScore: 80,
				automaticityScore: 70,
			});
			const total = plan.blocks.reduce(
				(sum, block) => sum + block.minutes + block.breakAfterMinutes,
				0,
			);
			expect(total).toBe(sessionMinutes);
		}
	});

	test("keeps all four CEFR skills in every selectable daily route", () => {
		for (const sessionMinutes of [15, 30, 45, 60] as const) {
			const plan = buildAdaptiveDailyPlan({
				sessionMinutes,
				hasPreviousLesson: true,
				previousLessonRecalled: false,
				dueReviewCount: 1,
				activeErrorCount: 1,
				hasIncompleteLesson: true,
				masteryScore: 50,
				automaticityScore: 40,
			});
			const skills = new Set(plan.blocks.flatMap((block) => block.skills));
			expect(skills).toEqual(
				new Set(["listening", "reading", "speaking", "writing"]),
			);
			expect(plan.blocks.every((block) => block.minutes > 0)).toBeTrue();
		}
	});

	test("keeps coverage, mastery, and automaticity separate", () => {
		expect(
			calculateDailyProgress({
				levelTopicCount: 12,
				coveredTopicCount: 3,
				masteryScores: [80, 70, 60],
				automaticityScore: 45,
			}),
		).toEqual({ coverage: 25, mastery: 70, automaticity: 45 });
	});
});
