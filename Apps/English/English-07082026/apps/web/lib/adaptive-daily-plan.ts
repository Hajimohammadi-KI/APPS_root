export type DailySessionMinutes = 15 | 30 | 45;

export type DailyAutomaticityBlockId =
	| "grammar"
	| "mixed_practice"
	| "conversation_studio"
	| "review"
	| "automatization";

export interface DailyAutomaticityBlock {
	readonly id: DailyAutomaticityBlockId;
	readonly minutes: number;
	readonly practiceUnits: number;
}

export interface DailyAutomaticityProgram {
	readonly sessionMinutes: DailySessionMinutes;
	readonly volumeMultiplier: 1 | 2 | 3;
	readonly blocks: readonly DailyAutomaticityBlock[];
}

export const DAILY_SESSION_OPTIONS = [15, 30, 45] as const;

const DAILY_AUTOMATICITY_MINUTES: Record<
	DailySessionMinutes,
	readonly [number, number, number, number, number]
> = {
	15: [3, 3, 4, 2, 3],
	30: [6, 6, 8, 4, 6],
	45: [9, 10, 12, 5, 9],
};

const DAILY_AUTOMATICITY_UNITS: Record<
	DailySessionMinutes,
	readonly [number, number, number, number, number]
> = {
	15: [2, 2, 1, 2, 1],
	30: [4, 4, 2, 4, 2],
	45: [6, 6, 3, 6, 3],
};

/**
 * Builds the visible daily route. Every route contains grammar, mixed
 * retrieval, live production, delayed review, and automatization. More time
 * increases both minutes and practice volume; it never lowers the evidence
 * gates required to advance.
 */
export function buildDailyAutomaticityProgram(
	sessionMinutes: DailySessionMinutes,
): DailyAutomaticityProgram {
	const minutes = DAILY_AUTOMATICITY_MINUTES[sessionMinutes];
	const units = DAILY_AUTOMATICITY_UNITS[sessionMinutes];
	const ids: readonly DailyAutomaticityBlockId[] = [
		"grammar",
		"mixed_practice",
		"conversation_studio",
		"review",
		"automatization",
	];

	return {
		sessionMinutes,
		volumeMultiplier: (sessionMinutes / 15) as 1 | 2 | 3,
		blocks: ids.map((id, index) => ({
			id,
			minutes: minutes[index]!,
			practiceUnits: units[index]!,
		})),
	};
}

export type DailyMissionKind =
	| "recall"
	| "review"
	| "resume"
	| "consolidate"
	| "advance";

export type DailyBlockId =
	| "recall"
	| "review"
	| "resume"
	| "corrective"
	| "new_lesson"
	| "listening_vocabulary"
	| "speaking_grammar"
	| "save_schedule";

export interface AdaptiveDailySignals {
	readonly sessionMinutes: DailySessionMinutes;
	readonly hasPreviousLesson: boolean;
	readonly previousLessonRecalled: boolean;
	readonly dueReviewCount: number;
	readonly activeErrorCount: number;
	readonly hasIncompleteLesson: boolean;
	readonly masteryScore: number;
	readonly automaticityScore: number;
}

export interface AdaptiveDailyBlock {
	readonly id: DailyBlockId;
	readonly minutes: number;
	readonly breakAfterMinutes: number;
	readonly skills: readonly DailySkill[];
}

export type DailySkill = "listening" | "reading" | "speaking" | "writing";

export interface AdaptiveDailyPlan {
	readonly mission: DailyMissionKind;
	readonly canAdvance: boolean;
	readonly blocks: readonly AdaptiveDailyBlock[];
}

const CORE_MISSION_MINUTES: Record<
	DailySessionMinutes,
	readonly [number, number, number, number, number, number]
> = {
	15: [3, 2, 2, 3, 2, 3],
	30: [6, 5, 4, 5, 4, 6],
	45: [9, 7, 7, 7, 6, 9],
};

/** Six core activities always add up to the learner's selected session time. */
export function allocateCoreMissionMinutes(
	sessionMinutes: DailySessionMinutes,
): readonly [number, number, number, number, number, number] {
	return CORE_MISSION_MINUTES[sessionMinutes];
}

const SESSION_LAYOUTS: Record<
	DailySessionMinutes,
	{
		readonly activityMinutes: readonly [number, number, number, number, number];
		readonly breakMinutes: readonly [number, number, number, number, number];
	}
> = {
	15: {
		activityMinutes: [3, 3, 3, 4, 2],
		breakMinutes: [0, 0, 0, 0, 0],
	},
	30: {
		activityMinutes: [5, 5, 6, 8, 3],
		breakMinutes: [0, 3, 0, 0, 0],
	},
	45: {
		activityMinutes: [8, 8, 8, 10, 3],
		breakMinutes: [4, 4, 0, 0, 0],
	},
};

function clampPercent(value: number): number {
	return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildAdaptiveDailyPlan(
	signals: AdaptiveDailySignals,
): AdaptiveDailyPlan {
	const dueReviewCount = Math.max(0, signals.dueReviewCount);
	const activeErrorCount = Math.max(0, signals.activeErrorCount);
	const masteryScore = clampPercent(signals.masteryScore);
	const automaticityScore = clampPercent(signals.automaticityScore);
	const canAdvance =
		!signals.hasPreviousLesson ||
		(!signals.hasIncompleteLesson &&
			dueReviewCount === 0 &&
			activeErrorCount === 0 &&
			masteryScore >= 75 &&
			automaticityScore >= 65);

	const mission: DailyMissionKind =
		signals.hasPreviousLesson && !signals.previousLessonRecalled
			? "recall"
			: dueReviewCount > 0 || activeErrorCount > 0
				? "review"
				: signals.hasIncompleteLesson
					? "resume"
					: canAdvance
						? "advance"
						: "consolidate";

	const priorityBlock: DailyBlockId =
		dueReviewCount > 0 || activeErrorCount > 0
			? "review"
			: signals.hasIncompleteLesson
				? "resume"
				: canAdvance
					? "new_lesson"
					: "corrective";
	const layout = SESSION_LAYOUTS[signals.sessionMinutes];
	const minutes = layout.activityMinutes;
	const breaks = layout.breakMinutes;

	return {
		mission,
		canAdvance,
		blocks: [
			{
				id: "recall",
				minutes: minutes[0],
				breakAfterMinutes: breaks[0],
				skills: ["reading", "writing"],
			},
			{
				id: priorityBlock,
				minutes: minutes[1],
				breakAfterMinutes: breaks[1],
				skills: ["reading", "writing"],
			},
			{
				id: "listening_vocabulary",
				minutes: minutes[2],
				breakAfterMinutes: breaks[2],
				skills: ["listening", "reading"],
			},
			{
				id: "speaking_grammar",
				minutes: minutes[3],
				breakAfterMinutes: breaks[3],
				skills: ["speaking", "writing"],
			},
			{
				id: "save_schedule",
				minutes: minutes[4],
				breakAfterMinutes: breaks[4],
				skills: ["writing"],
			},
		],
	};
}

export function calculateDailyProgress(input: {
	readonly levelTopicCount: number;
	readonly coveredTopicCount: number;
	readonly masteryScores: readonly number[];
	readonly automaticityScore: number;
}) {
	const coverage = input.levelTopicCount
		? (input.coveredTopicCount / input.levelTopicCount) * 100
		: 0;
	const mastery = input.masteryScores.length
		? input.masteryScores.reduce((sum, score) => sum + clampPercent(score), 0) /
			input.masteryScores.length
		: 0;
	return {
		coverage: clampPercent(coverage),
		mastery: clampPercent(mastery),
		automaticity: clampPercent(input.automaticityScore),
	};
}
