"use client";

import * as React from "react";
import {
	grammarUnits,
	type CefrLevel,
	type GrammarUnit,
} from "@grammar/content";
import {
	appStateCalendarEvents,
	readDesktopCalendarStatus,
} from "@/lib/desktop-calendar";
import { makeId, todayKey } from "@/lib/utils";
import {
	emptyEvidenceSummary,
	mergeLearnerProfile,
	readLearnerProfile,
	type EvidenceSummary,
	type PlacementMode,
} from "@/lib/learner-profile";

export type MasteryStatus =
	| "new"
	| "learning"
	| "usable"
	| "stable"
	| "automatic";
export type AttemptMode =
	| "recognition"
	| "writing"
	| "speaking"
	| "repair"
	| "transfer"
	| "timed";
export type ErrorClass =
	| "word_order"
	| "case"
	| "article"
	| "auxiliary"
	| "ending"
	| "tense"
	| "agreement"
	| "spelling"
	| "other";

export interface Settings {
	apiBaseUrl: string;
	minWords: number;
	dailyStudyMinutes: 15 | 30 | 45 | 60;
	honovrLanguage: "en";
	saveAudio: boolean;
	onlineFeedback: boolean;
	readingProfile: "standard" | "dyslexia";
	textScale: 100 | 112 | 125;
	readingRuler: boolean;
	lowStimulation: boolean;
	timedChallenges: boolean;
	showStreaks: boolean;
	movementBreaks: boolean;
	ttsRate: number;
	spellingAffectsMastery: boolean;
}

export interface LearnerPreferences {
	displayName: string;
	avatarDataUrl: string;
	selfDeclaredLevel: CefrLevel | null;
	verifiedLevel: CefrLevel | null;
	placementMode: PlacementMode;
	placementCheckedAt: string | null;
	shareAcrossApps: boolean;
	allowOnlineAI: boolean;
	includeEvidenceInExport: boolean;
}

export interface Attempt {
	id: string;
	grammarTitle: string;
	mode: AttemptMode;
	inputText: string;
	correctedText: string;
	targetHit: boolean;
	accuracyScore: number;
	fluencyScore: number;
	latencyMs: number | null;
	passed: boolean;
	verified?: boolean;
	createdAt: string;
	// Speaking attempts only. audioId links to the matching record saved via
	// putAudio() (lib/audio-db.ts), so a speaking score is traceable back to
	// the exact recording it was derived from. rawTranscript is the
	// speech-to-text output captured the moment recording stopped, before
	// the learner has any chance to edit it in the review textarea --
	// inputText for a speaking attempt is that post-edit ("reviewed")
	// version. The two are intentionally allowed to be identical (most
	// learners don't edit); what matters is that editing one never
	// overwrites the other.
	audioId?: string;
	rawTranscript?: string;
	// Provenance for the `verified` claim: which content package produced the
	// grammar/exercises being assessed (packages/content's version, so old
	// evidence stays traceable to the rules that graded it if content
	// changes later), and whether a real online provider was actually
	// consulted or this fell back to a local heuristic. This is a stand-in
	// for the task/rubric/provider versioning that packages/evidence-domain
	// defines -- that package isn't wired into any runtime attempt-recording
	// path yet, so this records what's honestly available today rather than
	// a task/rubric version number nothing here actually assigns.
	contentVersion?: string;
	assessedBy?: "online" | "offline";
}

export interface ErrorItem {
	id: string;
	grammarTitle: string;
	topic: string;
	errorClass: ErrorClass;
	originalText: string;
	correctedText: string;
	explanation: string;
	occurrenceCount: number;
	repairStatus: "new" | "scheduled" | "improving" | "fixed";
	nextRepairAt: number;
	lastSeenAt: string;
}

export interface ReviewItem {
	id: string;
	sourceType: "grammar_topic" | "error_item";
	sourceId: string;
	topic: string;
	original: string;
	corrected: string;
	intervalDays: number;
	dueAt: number;
	successStreak: number;
	stabilityScore: number;
	mode: "mixed" | "repair" | "production" | "timed";
	status: "pending" | "done" | "rescheduled";
	// Incremented each time successStreak reaches
	// RECALL_MASTERY_STREAK_THRESHOLD. Distinct from `status === "done"`
	// (legacy: retired the item from the queue permanently after one
	// streak) -- a milestone keeps the item cycling at the longest interval
	// indefinitely, so long-term retention keeps getting re-checked instead
	// of being assumed forever from one streak completed months ago.
	masteryMilestonesReached?: number;
}

export interface TopicMastery {
	grammarTitle: string;
	status: MasteryStatus;
	recognitionScore: number;
	writingScore: number;
	speakingScore: number;
	repairScore: number;
	transferScore: number;
	automaticityScore: number;
	successfulReviews: number;
	activeErrorCount: number;
	lastSuccessAt: string | null;
	nextReviewAt: number | null;
	// Median of the last 10 verified writing/transfer attempts' latencyMs
	// (time from first keystroke to save). null until enough timed attempts
	// exist. Automaticity is a speed claim, not just an accuracy one -- see
	// WRITING_LATENCY_THRESHOLD_MS below.
	medianWritingLatencyMs: number | null;
}

export interface Session {
	id: string;
	date: string;
	topic: string;
	grammarTitle: string;
	transcript: string;
	corrected: string;
	seconds: number;
	targetUses: number;
}

export interface DailyPlan {
	completed: number[];
	answers: Record<string, string>;
}

export interface OutcomeEvidence {
	goal: string;
	baselineScore: number | null;
	followupScore: number | null;
	retentionScore: number | null;
	independentlyRated: boolean;
	assessorNote: string;
}

export type IntegratedSkillId =
	| "listening"
	| "speaking"
	| "reading"
	| "writing";

export interface IntegratedSkillsProgress {
	activeLevel: CefrLevel;
	activeUnitId: string;
	activeSkill: IntegratedSkillId;
	activeStep: number;
	completedAt: Record<string, string>;
	responses: Record<string, string>;
	reviewDue: Record<string, number>;
}

export interface AppState {
	version: 27;
	settings: Settings;
	learner: LearnerPreferences;
	outcomes: OutcomeEvidence;
	integratedSkills: IntegratedSkillsProgress;
	activity: Record<string, number>;
	attempts: Attempt[];
	dailyPlans: Record<string, DailyPlan>;
	errors: ErrorItem[];
	mastery: Record<string, TopicMastery>;
	reviews: ReviewItem[];
	sessions: Session[];
	todayGrammar: { title: string; level: string; date: string } | null;
}

const STORAGE_KEY = "grammar-automaticity:v27";
const LEGACY_KEY = "GrammarAutomaticityV11_en";
const RETIRED_PRIVATE_STORAGE_KEY = "thesis-b2-sprint-v24";
export const CEFR_ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Spaced-repetition schedule for reviews: each correct recall advances one
// step (reset to the first step on a miss). Reaching the streak threshold
// means the item has been recalled correctly enough times running that it's
// considered automatized, and it retires from the active review queue.
export const RECALL_INTERVAL_STEPS_DAYS: readonly number[] = [1, 3, 7, 14, 30, 60];
const FIRST_RECALL_INTERVAL_DAYS = 1;
export const RECALL_MASTERY_STREAK_THRESHOLD = 5;

function persistAppState(state: AppState) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// Keep the current in-memory session usable if browser storage is blocked.
	}
}

export const DEFAULT_STATE: AppState = {
	version: 27,
	settings: {
		apiBaseUrl:
			process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
			"http://127.0.0.1:4201",
		minWords: 12,
		dailyStudyMinutes: 15,
		honovrLanguage: "en",
		saveAudio: true,
		onlineFeedback: false,
		readingProfile: "dyslexia",
		textScale: 112,
		readingRuler: false,
		lowStimulation: true,
		timedChallenges: false,
		showStreaks: false,
		movementBreaks: true,
		ttsRate: 0.9,
		spellingAffectsMastery: false,
	},
	learner: {
		displayName: "",
		avatarDataUrl: "",
		selfDeclaredLevel: null,
		verifiedLevel: null,
		placementMode: "not_set",
		placementCheckedAt: null,
		shareAcrossApps: true,
		allowOnlineAI: false,
		includeEvidenceInExport: true,
	},
	outcomes: {
		goal: "Use English accurately in spontaneous speaking and writing",
		baselineScore: null,
		followupScore: null,
		retentionScore: null,
		independentlyRated: false,
		assessorNote: "",
	},
	integratedSkills: {
		activeLevel: "A1",
		activeUnitId: "a1-introductions",
		activeSkill: "listening",
		activeStep: 0,
		completedAt: {},
		responses: {},
		reviewDue: {},
	},
	activity: {},
	attempts: [],
	dailyPlans: {},
	errors: [],
	mastery: {},
	reviews: [],
	sessions: [],
	todayGrammar: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordArray<T>(value: unknown): T[] {
	return Array.isArray(value)
		? (value.filter((item) => isRecord(item)) as T[])
		: [];
}

function numericRecord(value: unknown): Record<string, number> {
	if (!isRecord(value)) return {};
	return Object.fromEntries(
		Object.entries(value).filter(
			(entry): entry is [string, number] =>
				typeof entry[1] === "number" && Number.isFinite(entry[1]),
		),
	);
}

function stringRecord(value: unknown): Record<string, string> {
	if (!isRecord(value)) return {};
	return Object.fromEntries(
		Object.entries(value)
			.filter(
				(entry): entry is [string, string] => typeof entry[1] === "string",
			)
			.map(([key, entryValue]) => [
				key.slice(0, 240),
				entryValue.slice(0, 12_000),
			]),
	);
}

function normalizeOutcomeScore(value: unknown) {
	return typeof value === "number" && Number.isFinite(value)
		? Math.min(100, Math.max(0, Math.round(value)))
		: null;
}

export function normalizeAppState(value: unknown): AppState {
	const fallback = structuredClone(DEFAULT_STATE);
	if (!isRecord(value)) return fallback;
	const settings = isRecord(value.settings) ? value.settings : {};
	const learner = isRecord(value.learner) ? value.learner : {};
	const outcomes = isRecord(value.outcomes) ? value.outcomes : {};
	const integratedSkills = isRecord(value.integratedSkills)
		? value.integratedSkills
		: {};
	const minWords =
		typeof settings.minWords === "number" && Number.isFinite(settings.minWords)
			? Math.min(200, Math.max(5, Math.round(settings.minWords)))
			: fallback.settings.minWords;
	const storedApiBaseUrl =
		typeof settings.apiBaseUrl === "string" && settings.apiBaseUrl.trim()
			? settings.apiBaseUrl.trim().replace(/\/$/, "")
			: fallback.settings.apiBaseUrl;
	const apiBaseUrl =
		storedApiBaseUrl === "http://localhost:4201"
			? fallback.settings.apiBaseUrl
			: storedApiBaseUrl;
	const todayGrammar =
		isRecord(value.todayGrammar) &&
		typeof value.todayGrammar.title === "string" &&
		typeof value.todayGrammar.level === "string" &&
		typeof value.todayGrammar.date === "string"
			? {
					title: value.todayGrammar.title,
					level: value.todayGrammar.level,
					date: value.todayGrammar.date,
				}
			: null;

	return {
		version: 27,
		settings: {
			apiBaseUrl,
			minWords,
			dailyStudyMinutes:
				settings.dailyStudyMinutes === 30 ||
				settings.dailyStudyMinutes === 45 ||
				settings.dailyStudyMinutes === 60
					? settings.dailyStudyMinutes
					: 15,
			honovrLanguage: "en",
			saveAudio:
				typeof settings.saveAudio === "boolean"
					? settings.saveAudio
					: fallback.settings.saveAudio,
			onlineFeedback:
				typeof settings.onlineFeedback === "boolean"
					? settings.onlineFeedback
					: fallback.settings.onlineFeedback,
			readingProfile:
				settings.readingProfile === "standard" ||
				settings.readingProfile === "dyslexia"
					? settings.readingProfile
					: fallback.settings.readingProfile,
			textScale:
				settings.textScale === 100 ||
				settings.textScale === 112 ||
				settings.textScale === 125
					? settings.textScale
					: fallback.settings.textScale,
			readingRuler:
				typeof settings.readingRuler === "boolean"
					? settings.readingRuler
					: fallback.settings.readingRuler,
			lowStimulation:
				typeof settings.lowStimulation === "boolean"
					? settings.lowStimulation
					: fallback.settings.lowStimulation,
			timedChallenges:
				typeof settings.timedChallenges === "boolean"
					? settings.timedChallenges
					: fallback.settings.timedChallenges,
			showStreaks:
				typeof settings.showStreaks === "boolean"
					? settings.showStreaks
					: fallback.settings.showStreaks,
			movementBreaks:
				typeof settings.movementBreaks === "boolean"
					? settings.movementBreaks
					: fallback.settings.movementBreaks,
			ttsRate:
				typeof settings.ttsRate === "number" &&
				Number.isFinite(settings.ttsRate)
					? Math.min(1.5, Math.max(0.6, settings.ttsRate))
					: fallback.settings.ttsRate,
			spellingAffectsMastery:
				typeof settings.spellingAffectsMastery === "boolean"
					? settings.spellingAffectsMastery
					: fallback.settings.spellingAffectsMastery,
		},
		learner: {
			displayName:
				typeof learner.displayName === "string"
					? learner.displayName.trim().slice(0, 120)
					: fallback.learner.displayName,
			avatarDataUrl:
				typeof learner.avatarDataUrl === "string" &&
				learner.avatarDataUrl.length <= 350_000 &&
				/^data:image\/(?:jpeg|png|webp);base64,/i.test(learner.avatarDataUrl)
					? learner.avatarDataUrl
					: fallback.learner.avatarDataUrl,
			selfDeclaredLevel: isCefrLevel(learner.selfDeclaredLevel)
				? learner.selfDeclaredLevel
				: null,
			verifiedLevel: isCefrLevel(learner.verifiedLevel)
				? learner.verifiedLevel
				: null,
			placementMode: isPlacementMode(learner.placementMode)
				? learner.placementMode
				: isCefrLevel(learner.selfDeclaredLevel)
					? "manual"
					: "not_set",
			placementCheckedAt:
				typeof learner.placementCheckedAt === "string" &&
				Number.isFinite(Date.parse(learner.placementCheckedAt))
					? new Date(learner.placementCheckedAt).toISOString()
					: null,
			shareAcrossApps:
				typeof learner.shareAcrossApps === "boolean"
					? learner.shareAcrossApps
					: fallback.learner.shareAcrossApps,
			allowOnlineAI:
				typeof learner.allowOnlineAI === "boolean"
					? learner.allowOnlineAI
					: fallback.learner.allowOnlineAI,
			includeEvidenceInExport:
				typeof learner.includeEvidenceInExport === "boolean"
					? learner.includeEvidenceInExport
					: fallback.learner.includeEvidenceInExport,
		},
		outcomes: {
			goal:
				typeof outcomes.goal === "string" && outcomes.goal.trim()
					? outcomes.goal.trim().slice(0, 240)
					: fallback.outcomes.goal,
			baselineScore: normalizeOutcomeScore(outcomes.baselineScore),
			followupScore: normalizeOutcomeScore(outcomes.followupScore),
			retentionScore: normalizeOutcomeScore(outcomes.retentionScore),
			independentlyRated:
				typeof outcomes.independentlyRated === "boolean"
					? outcomes.independentlyRated
					: fallback.outcomes.independentlyRated,
			assessorNote:
				typeof outcomes.assessorNote === "string"
					? outcomes.assessorNote.trim().slice(0, 500)
					: fallback.outcomes.assessorNote,
		},
		integratedSkills: {
			activeLevel:
				typeof integratedSkills.activeLevel === "string" &&
				CEFR_ORDER.includes(integratedSkills.activeLevel as CefrLevel)
					? (integratedSkills.activeLevel as CefrLevel)
					: fallback.integratedSkills.activeLevel,
			activeUnitId:
				typeof integratedSkills.activeUnitId === "string" &&
				integratedSkills.activeUnitId.trim()
					? integratedSkills.activeUnitId.trim().slice(0, 120)
					: fallback.integratedSkills.activeUnitId,
			activeSkill:
				integratedSkills.activeSkill === "listening" ||
				integratedSkills.activeSkill === "speaking" ||
				integratedSkills.activeSkill === "reading" ||
				integratedSkills.activeSkill === "writing"
					? integratedSkills.activeSkill
					: fallback.integratedSkills.activeSkill,
			activeStep:
				typeof integratedSkills.activeStep === "number" &&
				Number.isInteger(integratedSkills.activeStep)
					? Math.min(6, Math.max(0, integratedSkills.activeStep))
					: fallback.integratedSkills.activeStep,
			completedAt: stringRecord(integratedSkills.completedAt),
			responses: stringRecord(integratedSkills.responses),
			reviewDue: numericRecord(integratedSkills.reviewDue),
		},
		activity: numericRecord(value.activity),
		attempts: recordArray<Attempt>(value.attempts).map((attempt) => ({
			...attempt,
			verified:
				typeof attempt.verified === "boolean"
					? attempt.verified
					: attempt.passed,
		})),
		dailyPlans: isRecord(value.dailyPlans)
			? (value.dailyPlans as Record<string, DailyPlan>)
			: {},
		errors: recordArray<ErrorItem>(value.errors),
		mastery: isRecord(value.mastery)
			? (value.mastery as Record<string, TopicMastery>)
			: {},
		reviews: recordArray<ReviewItem>(value.reviews),
		sessions: recordArray<Session>(value.sessions),
		todayGrammar,
	};
}

function isCefrLevel(value: unknown): value is CefrLevel {
	return (
		typeof value === "string" &&
		["A1", "A2", "B1", "B2", "C1", "C2"].includes(value)
	);
}

function isPlacementMode(value: unknown): value is PlacementMode {
	return value === "not_set" || value === "manual" || value === "optional_test";
}

type LegacyState = {
	settings?: {
		minWords?: number;
		saveAudio?: boolean;
	};
	activity?: Record<string, number>;
	dailyPlans?: Record<string, DailyPlan>;
	errors?: Array<{
		date?: string;
		topic?: string;
		original?: string;
		corrected?: string;
	}>;
	reviews?: Array<{
		id?: string;
		due?: number;
		stage?: number;
		topic?: string;
		original?: string;
		corrected?: string;
	}>;
	sessions?: Array<{
		id?: string;
		date?: string;
		topic?: { topic?: string; targetGrammar?: string };
		transcript?: string;
		corrected?: string;
	}>;
	todayGrammar?: { title: string; level: string; date: string };
};

function migrateLegacy(): AppState {
	const state = structuredClone(DEFAULT_STATE);
	try {
		const legacy = JSON.parse(
			localStorage.getItem(LEGACY_KEY) ?? "{}",
		) as LegacyState;
		state.settings.minWords =
			legacy.settings?.minWords ?? state.settings.minWords;
		state.settings.saveAudio =
			legacy.settings?.saveAudio ?? state.settings.saveAudio;
		state.activity = legacy.activity ?? {};
		state.dailyPlans = legacy.dailyPlans ?? {};
		state.todayGrammar = legacy.todayGrammar ?? null;
		state.errors = (legacy.errors ?? []).map((error) => ({
			id: makeId("legacy-error"),
			grammarTitle: state.todayGrammar?.title ?? "Imported correction",
			topic: error.topic ?? "Imported correction",
			errorClass: "other",
			originalText: error.original ?? "",
			correctedText: error.corrected ?? "",
			explanation: "Imported from the v27 Error Engine.",
			occurrenceCount: 1,
			repairStatus: "scheduled",
			nextRepairAt: Date.now(),
			lastSeenAt: error.date ?? new Date().toISOString(),
		}));
		state.reviews = (legacy.reviews ?? []).map((review) => ({
			id: review.id ?? makeId("legacy-review"),
			sourceType: "grammar_topic",
			sourceId: review.topic ?? "imported",
			topic: review.topic ?? "Imported review",
			original: review.original ?? "",
			corrected: review.corrected ?? "",
			intervalDays: Math.max(1, review.stage ?? 1),
			dueAt: review.due ?? Date.now(),
			successStreak: 0,
			stabilityScore: 0,
			mode: "production",
			status: "pending",
		}));
		state.sessions = (legacy.sessions ?? []).map((session) => ({
			id: session.id ?? makeId("legacy-session"),
			date: session.date ?? new Date().toISOString(),
			topic: session.topic?.topic ?? "Imported session",
			grammarTitle:
				session.topic?.targetGrammar ?? state.todayGrammar?.title ?? "Imported",
			transcript: session.transcript ?? "",
			corrected: session.corrected ?? "",
			seconds: 0,
			targetUses: 0,
		}));
	} catch {
		return structuredClone(DEFAULT_STATE);
	}
	return state;
}

export function emptyMastery(grammarTitle: string): TopicMastery {
	return {
		grammarTitle,
		status: "new",
		recognitionScore: 0,
		writingScore: 0,
		speakingScore: 0,
		repairScore: 0,
		transferScore: 0,
		automaticityScore: 0,
		successfulReviews: 0,
		activeErrorCount: 0,
		lastSuccessAt: null,
		nextReviewAt: null,
		medianWritingLatencyMs: null,
	};
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
		: (sorted[middle] ?? 0);
}

// Calibrated for composing several original sentences (writing/transfer),
// not a quick spoken recall -- deliberately more generous than a
// recall-style threshold would be. Same purpose as German's
// AUTOMATICITY_LATENCY_THRESHOLD_MS (packages/domain/src/mastery.ts):
// automaticity requires fast, not just eventually-correct, production.
const WRITING_LATENCY_THRESHOLD_MS = 90_000;

function average(values: number[]) {
	if (values.length === 0) return 0;
	return Math.round(
		values.reduce((sum, value) => sum + value, 0) / values.length,
	);
}

export function recalculateMastery(draft: AppState, grammarTitle: string) {
	const current = draft.mastery[grammarTitle] ?? emptyMastery(grammarTitle);
	const attempts = draft.attempts.filter(
		(attempt) => attempt.grammarTitle === grammarTitle,
	);
	const verifiedFor = (mode: AttemptMode) =>
		attempts.filter((attempt) => attempt.mode === mode && attempt.verified === true);
	const scoreFor = (mode: AttemptMode) =>
		average(verifiedFor(mode).slice(-5).map((attempt) => attempt.accuracyScore));

	current.recognitionScore = scoreFor("recognition");
	current.writingScore = scoreFor("writing");
	current.speakingScore = scoreFor("speaking");
	current.repairScore = scoreFor("repair");
	current.transferScore = scoreFor("transfer");
	current.medianWritingLatencyMs = median(
		[...verifiedFor("writing"), ...verifiedFor("transfer")]
			.slice(-10)
			.map((attempt) => attempt.latencyMs)
			.filter((value): value is number => value !== null),
	);
	// Spelling mistakes are tracked and shown like any other error, but they
	// do not gate grammar automaticity — the same policy already applied to
	// deriveVerifiedLevel's CEFR-level check below. Without this exclusion an
	// unresolved spelling slip (a dysgraphia-adjacent, non-grammar issue)
	// could hold a topic below "automatic" status indefinitely even once its
	// grammar is genuinely mastered.
	current.activeErrorCount = draft.errors.filter(
		(error) =>
			error.grammarTitle === grammarTitle &&
			error.repairStatus !== "fixed" &&
			error.errorClass !== "spelling",
	).length;
	const grammarTopicReviews = draft.reviews.filter(
		(review) =>
			review.sourceType === "grammar_topic" && review.sourceId === grammarTitle,
	);
	current.successfulReviews = grammarTopicReviews.reduce(
		(sum, review) =>
			sum +
			// masteryMilestonesReached (added once retesting-after-mastery was
			// wired in) is the real count; `status === "done"` is a fallback for
			// review rows persisted before that change, so existing progress
			// isn't silently zeroed out.
			(review.masteryMilestonesReached ?? (review.status === "done" ? 1 : 0)),
		0,
	);
	// True if any grammar_topic review that has previously earned a mastery
	// milestone is currently mid-climb (streak reset below the threshold) --
	// i.e. a maintenance check was missed or failed since mastery was last
	// demonstrated. Automaticity claims should not survive that unnoticed.
	const hasLapsedRetention = grammarTopicReviews.some(
		(review) =>
			(review.masteryMilestonesReached ?? 0) > 0 &&
			review.successStreak < RECALL_MASTERY_STREAK_THRESHOLD,
	);
	current.nextReviewAt =
		draft.reviews
			.filter(
				(review) =>
					review.sourceType === "grammar_topic" &&
					review.sourceId === grammarTitle &&
					review.status === "pending",
			)
			.toSorted((a, b) => a.dueAt - b.dueAt)[0]?.dueAt ?? null;
	current.automaticityScore = average([
		current.recognitionScore,
		current.writingScore,
		current.speakingScore,
		current.repairScore,
		current.transferScore,
	]);

	// A single verified attempt can average to a passing score just as well
	// as five can -- scoreFor()'s average doesn't distinguish "one lucky
	// attempt" from "five consistent ones". Automaticity is a claim about
	// consistency under repetition, so require a minimum sample size per
	// skill in addition to the score threshold before it can be claimed.
	const MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC = 3;
	const hasEnoughAttempts =
		verifiedFor("recognition").length >= MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC &&
		verifiedFor("writing").length >= MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC &&
		verifiedFor("speaking").length >= MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC &&
		verifiedFor("transfer").length >= MINIMUM_VERIFIED_ATTEMPTS_FOR_AUTOMATIC;

	// Correctness alone isn't automaticity -- it also has to be fast.
	// Requires an actual measured median (not just "no data yet"): a topic
	// with no timed writing/transfer attempts hasn't demonstrated speed, so
	// it shouldn't default to passing this gate.
	const hasFastEnoughWriting =
		current.medianWritingLatencyMs !== null &&
		current.medianWritingLatencyMs <= WRITING_LATENCY_THRESHOLD_MS;

	if (
		current.recognitionScore >= 85 &&
		current.writingScore >= 80 &&
		current.speakingScore >= 80 &&
		current.repairScore >= 80 &&
		current.transferScore >= 75 &&
		current.successfulReviews >= 2 &&
		current.activeErrorCount <= 1 &&
		hasEnoughAttempts &&
		!hasLapsedRetention &&
		hasFastEnoughWriting
	) {
		current.status = "automatic";
	} else if (
		current.writingScore >= 75 &&
		current.speakingScore >= 75 &&
		current.transferScore >= 70
	) {
		current.status = "stable";
	} else if (
		current.writingScore >= 60 ||
		current.speakingScore >= 60 ||
		current.recognitionScore >= 70
	) {
		current.status = "usable";
	} else if (attempts.length > 0) {
		current.status = "learning";
	} else {
		current.status = "new";
	}

	current.lastSuccessAt =
		attempts
			.filter((attempt) => attempt.passed)
			.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
			?.createdAt ?? null;
	draft.mastery[grammarTitle] = current;
}

function latestAverage(values: number[]): number | null {
	if (values.length === 0) return null;
	const recent = values.slice(-10);
	return Math.round(
		recent.reduce((total, value) => total + value, 0) / recent.length,
	);
}

function deriveVerifiedLevel(state: AppState): CefrLevel | null {
	let verified: CefrLevel | null = null;
	for (const level of CEFR_ORDER) {
		const levelTitles = grammarUnits
			.filter((unit) => unit.level === level)
			.map((unit) => unit.title);
		if (levelTitles.length === 0) break;
		const titleSet = new Set(levelTitles);
		const allAutomatic = levelTitles.every(
			(title) => state.mastery[title]?.status === "automatic",
		);
		if (!allAutomatic) break;

		const activeCriticalErrors = state.errors.filter(
			(error) =>
				titleSet.has(error.grammarTitle) &&
				error.repairStatus !== "fixed" &&
				error.errorClass !== "spelling",
		).length;
		if (activeCriticalErrors > 0) break;

		const successful = state.attempts.filter(
			(attempt) =>
				titleSet.has(attempt.grammarTitle) &&
				attempt.verified === true &&
				attempt.passed,
		);
		const speaking = successful.filter(
			(attempt) => attempt.mode === "speaking",
		);
		const writing = successful.filter((attempt) => attempt.mode === "writing");
		const transfer = successful.filter(
			(attempt) => attempt.mode === "transfer" || attempt.mode === "timed",
		);
		const minimumSamples = Math.max(6, Math.ceil(levelTitles.length * 0.5));
		if (
			speaking.length < minimumSamples ||
			writing.length < minimumSamples ||
			transfer.length < minimumSamples
		) {
			break;
		}

		verified = level;
	}
	return verified;
}

function refreshVerifiedLevel(state: AppState) {
	if (!state.learner.selfDeclaredLevel) {
		state.learner.verifiedLevel = null;
		return;
	}
	state.learner.verifiedLevel = deriveVerifiedLevel(state);
}

const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export function adaptiveReviewInterval(
	currentInterval: number,
	successful: boolean,
	score: number,
	successStreak: number,
) {
	const currentIndex = Math.max(
		0,
		REVIEW_INTERVALS.findIndex((interval) => interval >= currentInterval),
	);
	if (!successful) {
		return REVIEW_INTERVALS[Math.max(0, currentIndex - 1)] ?? 1;
	}
	const confidentAdvance = score >= 95 && successStreak >= 2 ? 2 : 1;
	return (
		REVIEW_INTERVALS[
			Math.min(REVIEW_INTERVALS.length - 1, currentIndex + confidentAdvance)
		] ?? 30
	);
}

export function buildEnglishEvidence(state: AppState): EvidenceSummary {
	const level = state.learner.selfDeclaredLevel;
	if (!level) return emptyEvidenceSummary();
	const titles = new Set(
		grammarUnits
			.filter((unit) => unit.level === level)
			.map((unit) => unit.title),
	);
	const attempts = state.attempts.filter(
		(attempt) => titles.has(attempt.grammarTitle) && attempt.verified === true,
	);
	const speaking = attempts.filter((attempt) => attempt.mode === "speaking");
	const writing = attempts.filter((attempt) => attempt.mode === "writing");
	const spontaneous = attempts.filter(
		(attempt) =>
			attempt.passed &&
			(attempt.mode === "speaking" ||
				attempt.mode === "transfer" ||
				attempt.mode === "timed"),
	);
	const relevantReviews = state.reviews.filter(
		(review) =>
			titles.has(review.sourceId) &&
			review.sourceType === "grammar_topic" &&
			review.status === "done",
	);
	const activeCriticalErrors = state.errors.filter(
		(error) =>
			titles.has(error.grammarTitle) &&
			error.repairStatus !== "fixed" &&
			error.errorClass !== "spelling",
	);
	const speakingAccuracy = latestAverage(
		speaking.map((attempt) => attempt.accuracyScore),
	);
	const dailyRows = new Map<
		string,
		EvidenceSummary["dailyActivity"][number] & { scores: number[] }
	>();
	for (const [date, practiceCount] of Object.entries(state.activity)) {
		dailyRows.set(date, {
			date,
			practiceCount,
			speakingSamples: 0,
			writingSamples: 0,
			spontaneousSamples: 0,
			delayedReviews: 0,
			averageScore: null,
			scores: [],
		});
	}
	for (const attempt of attempts) {
		const date = attempt.createdAt.slice(0, 10);
		const row = dailyRows.get(date) ?? {
			date,
			practiceCount: 0,
			speakingSamples: 0,
			writingSamples: 0,
			spontaneousSamples: 0,
			delayedReviews: 0,
			averageScore: null,
			scores: [],
		};
		row.practiceCount += 1;
		row.scores.push(attempt.accuracyScore);
		if (attempt.passed && attempt.mode === "speaking") row.speakingSamples += 1;
		if (attempt.passed && attempt.mode === "writing") row.writingSamples += 1;
		if (
			attempt.passed &&
			["speaking", "transfer", "timed"].includes(attempt.mode)
		) {
			row.spontaneousSamples += 1;
		}
		dailyRows.set(date, row);
	}
	return {
		speakingSamples: speaking.filter((attempt) => attempt.passed).length,
		writingSamples: writing.filter((attempt) => attempt.passed).length,
		spontaneousSamples: spontaneous.length,
		delayedReviews: relevantReviews.length,
		criticalErrorCount: activeCriticalErrors.length,
		dailyActivity: [...dailyRows.values()]
			.map(({ scores, ...row }) => ({
				...row,
				averageScore: scores.length ? average(scores) : null,
			}))
			.sort((left, right) => left.date.localeCompare(right.date))
			.slice(-90),
		scores: {
			listening: null,
			reading: null,
			spoken_interaction: speakingAccuracy,
			spoken_production: speakingAccuracy,
			writing: latestAverage(writing.map((attempt) => attempt.accuracyScore)),
			grammar: latestAverage(attempts.map((attempt) => attempt.accuracyScore)),
			vocabulary: null,
			pronunciation: null,
			fluency: latestAverage(speaking.map((attempt) => attempt.fluencyScore)),
		},
	};
}

interface StoreValue {
	state: AppState;
	hydrated: boolean;
	mutate: (mutation: (draft: AppState) => void) => void;
	replaceState: (state: AppState) => void;
	recordAttempt: (attempt: Omit<Attempt, "id" | "createdAt">) => void;
	setTodayGrammar: (grammar: GrammarUnit) => void;
	completeReview: (reviewId: string, wasCorrect: boolean) => void;
}

const AppStoreContext = React.createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = React.useState<AppState>(DEFAULT_STATE);
	const [hydrated, setHydrated] = React.useState(false);
	const [profileReady, setProfileReady] = React.useState(false);
	const mutationVersion = React.useRef(0);

	React.useEffect(() => {
		localStorage.removeItem(RETIRED_PRIVATE_STORAGE_KEY);
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				setState(normalizeAppState(JSON.parse(stored)));
			} catch {
				setState(migrateLegacy());
			}
		} else {
			setState(migrateLegacy());
		}
		setHydrated(true);
	}, []);

	React.useEffect(() => {
		if (hydrated) persistAppState(state);
	}, [hydrated, state]);

	React.useEffect(() => {
		const root = document.documentElement;
		root.dataset.readingProfile = state.settings.readingProfile;
		root.dataset.textScale = String(state.settings.textScale);
		root.dataset.lowStimulation = String(state.settings.lowStimulation);
		return () => {
			delete root.dataset.readingProfile;
			delete root.dataset.textScale;
			delete root.dataset.lowStimulation;
		};
	}, [
		state.settings.lowStimulation,
		state.settings.readingProfile,
		state.settings.textScale,
	]);

	React.useEffect(() => {
		if (!hydrated) return;
		let cancelled = false;
		const versionAtRead = mutationVersion.current;
		void readLearnerProfile()
			.then((profile) => {
				if (cancelled) return;
				if (mutationVersion.current !== versionAtRead) {
					setProfileReady(true);
					return;
				}
				setState((current) => {
					const shared = profile.languages.english;
					return normalizeAppState({
						...current,
						settings: {
							...current.settings,
							saveAudio: profile.privacy.storeAudio,
							onlineFeedback: profile.privacy.allowOnlineAI,
						},
						learner: {
							...current.learner,
							displayName: profile.displayName || current.learner.displayName,
							avatarDataUrl: profile.avatarDataUrl,
							selfDeclaredLevel: profile.privacy.shareAcrossApps
								? (shared.selfDeclaredLevel ??
									current.learner.selfDeclaredLevel)
								: current.learner.selfDeclaredLevel,
							verifiedLevel: profile.privacy.shareAcrossApps
								? shared.verifiedLevel
								: current.learner.verifiedLevel,
							placementMode: profile.privacy.shareAcrossApps
								? shared.placementMode
								: current.learner.placementMode,
							placementCheckedAt: profile.privacy.shareAcrossApps
								? shared.placementCheckedAt
								: current.learner.placementCheckedAt,
							shareAcrossApps: profile.privacy.shareAcrossApps,
							allowOnlineAI: profile.privacy.allowOnlineAI,
							includeEvidenceInExport: profile.privacy.includeEvidenceInExport,
						},
					});
				});
				setProfileReady(true);
			})
			.catch(() => setProfileReady(true));
		return () => {
			cancelled = true;
		};
	}, [hydrated]);

	React.useEffect(() => {
		if (!hydrated || !profileReady) return;
		const timer = window.setTimeout(() => {
			const update = {
				displayName: state.learner.displayName,
				avatarDataUrl: state.learner.avatarDataUrl,
				privacy: {
					shareAcrossApps: state.learner.shareAcrossApps,
					allowOnlineAI: state.learner.allowOnlineAI,
					storeAudio: state.settings.saveAudio,
					includeEvidenceInExport: state.learner.includeEvidenceInExport,
				},
				...(state.learner.shareAcrossApps
					? {
							language: "english" as const,
							track: {
								selfDeclaredLevel: state.learner.selfDeclaredLevel,
								verifiedLevel: state.learner.verifiedLevel,
								placementMode: state.learner.placementMode,
								placementCheckedAt: state.learner.placementCheckedAt,
								evidence: buildEnglishEvidence(state),
							},
						}
					: {}),
			};
			void mergeLearnerProfile(update).catch(() => undefined);
		}, 750);
		return () => window.clearTimeout(timer);
	}, [hydrated, profileReady, state]);

	React.useEffect(() => {
		if (!hydrated || !profileReady) return;
		let cancelled = false;
		const refreshIdentity = () => {
			void readLearnerProfile()
				.then((profile) => {
					if (cancelled) return;
					setState((current) =>
						normalizeAppState({
							...current,
							learner: {
								...current.learner,
								displayName: profile.displayName,
								avatarDataUrl: profile.avatarDataUrl,
							},
						}),
					);
				})
				.catch(() => undefined);
		};
		window.addEventListener("focus", refreshIdentity);
		return () => {
			cancelled = true;
			window.removeEventListener("focus", refreshIdentity);
		};
	}, [hydrated, profileReady]);

	React.useEffect(() => {
		if (!hydrated || !window.studyCalendar) return;
		const timer = window.setTimeout(() => {
			void (async () => {
				try {
					const calendar = await readDesktopCalendarStatus();
					if (calendar.connected) {
						await window.studyCalendar?.sync(appStateCalendarEvents(state));
					}
				} catch {
					// A manual sync in Settings reports actionable Google errors.
				}
			})();
		}, 2_500);
		return () => window.clearTimeout(timer);
	}, [hydrated, state]);

	const mutate = React.useCallback((mutation: (draft: AppState) => void) => {
		mutationVersion.current += 1;
		setState((current) => {
			const draft = structuredClone(current);
			mutation(draft);
			refreshVerifiedLevel(draft);
			// These four grew without bound: months of daily use pushed the
			// deep-cloned/persisted state size (and recalculateMastery's scan
			// cost) up linearly forever. Capped to the same magnitude German
			// already caps `attempts` at.
			if (draft.attempts.length > 1_000) draft.attempts = draft.attempts.slice(-1_000);
			if (draft.errors.length > 500) draft.errors = draft.errors.slice(-500);
			if (draft.reviews.length > 1_000) draft.reviews = draft.reviews.slice(-1_000);
			if (draft.sessions.length > 500) draft.sessions = draft.sessions.slice(-500);
			// Persistence happens once, in the `useEffect([hydrated, state])`
			// below that watches every state change -- calling persistAppState
			// here too meant every mutation wrote to localStorage twice.
			return draft;
		});
	}, []);

	const replaceState = React.useCallback((next: AppState) => {
		mutationVersion.current += 1;
		const normalized = normalizeAppState(next);
		refreshVerifiedLevel(normalized);
		setState(normalized);
	}, []);

	const recordAttempt = React.useCallback(
		(attempt: Omit<Attempt, "id" | "createdAt">) => {
			mutate((draft) => {
				draft.attempts.push({
					...attempt,
					id: makeId("attempt"),
					createdAt: new Date().toISOString(),
				});
				draft.activity[todayKey()] = Math.max(
					1,
					draft.activity[todayKey()] ?? 0,
				);
				recalculateMastery(draft, attempt.grammarTitle);
			});
		},
		[mutate],
	);

	const setTodayGrammar = React.useCallback(
		(grammar: GrammarUnit) => {
			mutate((draft) => {
				draft.learner.selfDeclaredLevel = grammar.level;
				draft.todayGrammar = {
					title: grammar.title,
					level: grammar.level,
					date: todayKey(),
				};
				if (
					!draft.reviews.some(
						(review) =>
							review.sourceType === "grammar_topic" &&
							review.sourceId === grammar.title &&
							review.status === "pending",
					)
				) {
					draft.reviews.push({
						id: makeId("review"),
						sourceType: "grammar_topic",
						sourceId: grammar.title,
						topic: grammar.title,
						original: grammar.rule,
						corrected: grammar.rule,
						intervalDays: 1,
						dueAt: Date.now() + 86_400_000,
						successStreak: 0,
						stabilityScore: 0,
						mode: "production",
						status: "pending",
					});
				}
				recalculateMastery(draft, grammar.title);
			});
		},
		[mutate],
	);

	const completeReview = React.useCallback(
		(reviewId: string, wasCorrect: boolean) => {
			mutate((draft) => {
				const review = draft.reviews.find((item) => item.id === reviewId);
				if (!review) return;
				if (wasCorrect) {
					review.stabilityScore = Math.min(100, review.stabilityScore + 15);
					if (review.successStreak >= RECALL_MASTERY_STREAK_THRESHOLD) {
						// Already at the mastery streak: this is a long-interval
						// maintenance check, not a climb. Record the milestone again
						// and keep cycling at the longest interval rather than
						// retiring the item -- retention has to keep being
						// demonstrated, not just proven once.
						review.masteryMilestonesReached = (review.masteryMilestonesReached ?? 0) + 1;
						const maxInterval = RECALL_INTERVAL_STEPS_DAYS[RECALL_INTERVAL_STEPS_DAYS.length - 1] ?? FIRST_RECALL_INTERVAL_DAYS;
						review.dueAt = Date.now() + maxInterval * 86_400_000;
						review.status = "pending";
						return;
					}
					review.successStreak += 1;
					if (review.successStreak >= RECALL_MASTERY_STREAK_THRESHOLD) {
						review.masteryMilestonesReached = (review.masteryMilestonesReached ?? 0) + 1;
					}
					const stepIndex = RECALL_INTERVAL_STEPS_DAYS.indexOf(review.intervalDays);
					const clampedIndex = Math.min(
						Math.max(stepIndex + 1, 0),
						RECALL_INTERVAL_STEPS_DAYS.length - 1,
					);
					const nextInterval = RECALL_INTERVAL_STEPS_DAYS[clampedIndex] ?? FIRST_RECALL_INTERVAL_DAYS;
					review.intervalDays = nextInterval;
					review.dueAt = Date.now() + nextInterval * 86_400_000;
					review.status = "pending";
				} else {
					review.successStreak = 0;
					review.stabilityScore = Math.max(0, review.stabilityScore - 20);
					review.intervalDays = FIRST_RECALL_INTERVAL_DAYS;
					review.dueAt = Date.now() + FIRST_RECALL_INTERVAL_DAYS * 86_400_000;
					review.status = "pending";
				}
			});
		},
		[mutate],
	);

	const value = React.useMemo(
		() => ({
			state,
			hydrated,
			mutate,
			replaceState,
			recordAttempt,
			setTodayGrammar,
			completeReview,
		}),
		[state, hydrated, mutate, replaceState, recordAttempt, setTodayGrammar, completeReview],
	);

	return (
		<AppStoreContext.Provider value={value}>
			{children}
		</AppStoreContext.Provider>
	);
}

export function useAppStore() {
	const store = React.useContext(AppStoreContext);
	if (!store)
		throw new Error("useAppStore must be used inside AppStoreProvider");
	return store;
}

export function currentDailyPlan(state: AppState): DailyPlan {
	return state.dailyPlans[todayKey()] ?? { completed: [], answers: {} };
}
