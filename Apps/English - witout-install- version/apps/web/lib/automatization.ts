// Automatization Trainer: grounded in deliberate-practice / skill-acquisition
// theory (Suzuki, DeKeyser). Three practice modes -- retrieval, oral
// repetition/shadowing, formulaic-sequence drills -- share this app's
// existing exact/near-match grading (evaluatePracticeAnswer /
// practiceAnswerMatches, from lib/automaticity-analysis.ts) wherever the
// task is a fixed-answer recall. Free retelling (shadowing stage 5) is open
// production, so it is graded with the same marker/keyword-overlap technique
// evaluatePracticeAnswer already uses for open-production grammar answers,
// adapted here for a whole passage instead of one grammar transformation.
import { normalizePracticeAnswer } from "@/lib/automaticity-analysis";

export type AutomatizationModuleType = "retrieval" | "shadowing" | "formulaic";

export const AUTOMATIZATION_MODULE_TYPES: readonly AutomatizationModuleType[] = [
	"retrieval",
	"shadowing",
	"formulaic",
];

export const AUTOMATIZATION_MODULE_LABELS: Record<AutomatizationModuleType, string> = {
	retrieval: "Retrieval practice",
	shadowing: "Oral repetition / shadowing",
	formulaic: "Formulaic sequence drills",
};

// Maps the three Automatization Trainer AttemptMode values (app-store.tsx)
// onto the module types above. Any other AttemptMode (the pre-existing
// Grammar Lab / Automaticity Mission modes) is out of scope for this
// tracker and returns null.
export function attemptModeToModuleType(
	mode: string,
): AutomatizationModuleType | null {
	switch (mode) {
		case "auto_retrieval":
			return "retrieval";
		case "auto_shadowing":
			return "shadowing";
		case "auto_formulaic":
			return "formulaic";
		default:
			return null;
	}
}

export const AUTOMATIZATION_DAILY_MINUTES_OPTIONS = [5, 10, 15, 20] as const;
export type AutomatizationDailyMinutes =
	(typeof AUTOMATIZATION_DAILY_MINUTES_OPTIONS)[number];

export const AUTOMATIZATION_SKILL_FOCUS_OPTIONS = ["speaking", "writing"] as const;
export type AutomatizationSkillFocus =
	(typeof AUTOMATIZATION_SKILL_FOCUS_OPTIONS)[number];

// The 5-stage shadowing progression (Suzuki-style imitation practice built
// toward genuinely free production, not "listen and repeat" as a single
// step -- imitation alone is measurably weaker than retrieval/production for
// building durable, transferable speech). Stage 4 (delayed shadowing) is
// called out as the most important: holding the phrase in working memory
// for 1-2 seconds before producing it is what separates this from simple
// simultaneous mimicry.
export interface ShadowingStageSpec {
	stage: 1 | 2 | 3 | 4 | 5;
	title: string;
	instruction: string;
	// Playback rate to pass to lib/speech.ts's speak(text, { rate }) -- null
	// means "no audio for this stage" (stage 5, free retelling).
	rate: number | null;
	showTranscript: boolean;
	// Some stages are deliberately capped at one play, or ask for a fixed
	// number of repetitions, so the UI can enforce/represent that.
	maxPlays: number | null;
	requiredRepetitions: number;
	mostImportant?: boolean;
}

export const SHADOWING_STAGES: readonly ShadowingStageSpec[] = [
	{
		stage: 1,
		title: "1. Listen for meaning",
		instruction:
			"Play the audio once only. Do not repeat yet -- the goal is understanding the message, not imitating the sound.",
		rate: 1,
		showTranscript: false,
		maxPlays: 1,
		requiredRepetitions: 0,
	},
	{
		stage: 2,
		title: "2. Slow shadowing",
		instruction:
			"Replay at slow speed and shadow (repeat) almost simultaneously while it plays. If you miss 2-3 words, keep going -- do not stop or restart.",
		rate: 0.8,
		showTranscript: false,
		maxPlays: null,
		requiredRepetitions: 0,
	},
	{
		stage: 3,
		title: "3. Precise shadowing",
		instruction:
			"The transcript is now visible. Attend to word linking, stress, pauses, and sentence-final intonation. Repeat the passage twice. If you mispronounce or miss a word, keep going -- do not stop to fix it mid-sentence; note it and move on.",
		rate: 0.95,
		showTranscript: true,
		maxPlays: null,
		requiredRepetitions: 2,
	},
	{
		stage: 4,
		title: "4. Delayed shadowing",
		instruction:
			"Repeat with a deliberate 1-2 second lag behind the audio, not simultaneously. Holding the phrase in memory briefly before producing it is the most important part of this sequence. Errors are expected here -- keep going rather than stopping to correct them.",
		rate: 1,
		showTranscript: true,
		maxPlays: null,
		requiredRepetitions: 0,
		mostImportant: true,
	},
	{
		stage: 5,
		title: "5. Free retelling",
		instruction:
			"Audio off. Retell the same message in your own words -- paraphrase, don't imitate. This is the real test of whether the pattern is usable, not just memorized.",
		rate: null,
		showTranscript: false,
		maxPlays: 0,
		requiredRepetitions: 0,
	},
];

const RETELLING_STOPWORDS = new Set([
	"a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "but",
	"is", "are", "was", "were", "i", "you", "he", "she", "it", "we", "they",
	"this", "that", "these", "those", "my", "your", "his", "her", "its",
	"our", "their", "be", "been", "being", "do", "does", "did", "not", "so",
	"very", "just", "with", "as", "will", "would", "can", "could",
]);

function significantWords(text: string): Set<string> {
	return new Set(
		normalizePracticeAnswer(text)
			.split(/\s+/)
			.filter((word) => word.length > 2 && !RETELLING_STOPWORDS.has(word)),
	);
}

export interface RetellingGrade {
	passed: boolean;
	overlapRatio: number;
	wordCount: number;
}

const MS_PER_DAY = 86_400_000;
const MIN_RETELLING_WORDS = 8;
const RETELLING_OVERLAP_THRESHOLD = 0.3;

// Free retelling is open production (a paraphrase), so it must not require
// verbatim overlap the way exact-match recall does -- it reuses
// evaluatePracticeAnswer's marker/keyword-overlap *technique* (significant
// content words shared with the source, filtered of stopwords) rather than
// evaluatePracticeAnswer itself, since that function's "reject if it just
// repeats the prompt's original sentence" rule is specific to
// wrong-to-correct grammar transforms and would incorrectly punish a
// retelling for sharing vocabulary with the passage it is retelling.
export function gradeFreeRetelling(passage: string, retelling: string): RetellingGrade {
	const trimmed = retelling.trim();
	const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
	if (!trimmed || wordCount < MIN_RETELLING_WORDS) {
		return { passed: false, overlapRatio: 0, wordCount };
	}
	const passageWords = significantWords(passage);
	const retellingWords = significantWords(trimmed);
	if (passageWords.size === 0) {
		return { passed: wordCount >= MIN_RETELLING_WORDS, overlapRatio: 0, wordCount };
	}
	const overlap = [...passageWords].filter((word) => retellingWords.has(word)).length;
	const overlapRatio = overlap / passageWords.size;
	return {
		passed: overlapRatio >= RETELLING_OVERLAP_THRESHOLD,
		overlapRatio,
		wordCount,
	};
}

// -- Rhythm/stress markup for passages -------------------------------------
// A small optional convention a passage's text may contain: "/" marks a
// short pause point, and "*word*" marks a stressed word/syllable. This is
// display-only (a reading aid for stage 3's transcript and beyond) -- it is
// never used for grading, and text with none of this markup degrades
// gracefully to "one token per word, no pauses, nothing stressed".

export interface PassageToken {
	text: string;
	stressed: boolean;
	pauseAfter: boolean;
}

const STRESS_MARKER = /^\*(.+)\*$/;

export function parsePassageMarkup(raw: string): PassageToken[] {
	const clauses = raw.split("/");
	const tokens: PassageToken[] = [];
	clauses.forEach((clause, clauseIndex) => {
		const words = clause.trim().split(/\s+/).filter(Boolean);
		words.forEach((word, wordIndex) => {
			const stressMatch = word.match(STRESS_MARKER);
			tokens.push({
				text: stressMatch ? stressMatch[1]! : word,
				stressed: Boolean(stressMatch),
				pauseAfter: wordIndex === words.length - 1 && clauseIndex < clauses.length - 1,
			});
		});
	});
	return tokens;
}

// Plain speakable/gradable text with all markup characters removed -- what
// speak() and gradeFreeRetelling() should always receive, never the raw
// markup (a TTS engine would otherwise read "slash" and "asterisk" aloud).
export function stripPassageMarkup(raw: string): string {
	return raw
		.replace(/\*([^*]+)\*/g, "$1")
		.replace(/\//g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

// -- Three-speed drill (0.75x -> 0.90x -> 1.00x) ----------------------------
// An explicit sub-mode within slow/normal shadowing, layered onto the
// existing speak(text, { rate }) playback-rate control (lib/speech.ts) --
// no second rate-control path. Speed is not the goal: a markedly worse
// attempt at top speed (abandoned/restarted, or self-reported "fell apart")
// drops the learner back to a recovery speed rather than pushing forward.

export const SHADOWING_SPEED_LADDER = [0.75, 0.9, 1.0] as const;
export type ShadowingSpeedStep = (typeof SHADOWING_SPEED_LADDER)[number];
export const SHADOWING_RECOVERY_RATE = 0.85;

export interface SpeedDrillResult {
	nextRate: number;
	advanced: boolean;
	droppedBack: boolean;
}

export function nextShadowingSpeed(
	currentRate: number,
	strugglingSignal: boolean,
): SpeedDrillResult {
	const index = SHADOWING_SPEED_LADDER.indexOf(currentRate as ShadowingSpeedStep);
	const atTopSpeed = index === SHADOWING_SPEED_LADDER.length - 1;
	if (atTopSpeed && strugglingSignal) {
		return { nextRate: SHADOWING_RECOVERY_RATE, advanced: false, droppedBack: true };
	}
	if (index === -1 || atTopSpeed) {
		return { nextRate: currentRate, advanced: false, droppedBack: false };
	}
	return { nextRate: SHADOWING_SPEED_LADDER[index + 1]!, advanced: true, droppedBack: false };
}

// -- Today's single pronunciation target ------------------------------------
// One specific word/phrase the learner is deliberately targeting today,
// instead of trying to correct everything at once. If the learner hasn't set
// one explicitly (Settings.automatizationPronunciationTarget), auto-pick the
// formulaic sequence with the lowest average accuracy from their own
// auto_formulaic attempt history -- the correctedText of an auto_formulaic
// attempt is always the exact sequence text it graded against (see
// FormulaicModule), so grouping by correctedText recovers per-sequence
// accuracy without needing a separate sequence-id field.

export function pickAutoPronunciationTarget(
	attempts: readonly { mode: string; correctedText: string; accuracyScore: number }[],
): string | null {
	const totals = new Map<string, { sum: number; count: number }>();
	for (const attempt of attempts) {
		if (attempt.mode !== "auto_formulaic" || !attempt.correctedText.trim()) continue;
		const entry = totals.get(attempt.correctedText) ?? { sum: 0, count: 0 };
		entry.sum += attempt.accuracyScore;
		entry.count += 1;
		totals.set(attempt.correctedText, entry);
	}
	let worst: { sequence: string; average: number } | null = null;
	for (const [sequence, { sum, count }] of totals) {
		const average = sum / count;
		if (!worst || average < worst.average) worst = { sequence, average };
	}
	return worst?.sequence ?? null;
}

// -- 4-day checkpoint + 3-question self-check -------------------------------
// After every CHECKPOINT_SESSION_INTERVAL distinct practice days, prompt a
// short self-report. This is self-rated, not graded by the app -- the 3
// answers and an optional recording reference are stored in
// AppState.automatizationCheckpoints (features/store/app-store.tsx), and
// summarized here as a small addition to the existing 4-week matrix rather
// than a separate tracking system.

export const CHECKPOINT_SESSION_INTERVAL = 4;

export function countAutomatizationSessionDays(
	attempts: readonly { mode: string; createdAt: string }[],
	sinceMs: number,
): number {
	const days = new Set<string>();
	for (const attempt of attempts) {
		if (!attemptModeToModuleType(attempt.mode)) continue;
		const createdAtMs = Date.parse(attempt.createdAt);
		if (!Number.isFinite(createdAtMs) || createdAtMs <= sinceMs) continue;
		days.add(attempt.createdAt.slice(0, 10));
	}
	return days.size;
}

export function shouldPromptCheckpoint(
	attempts: readonly { mode: string; createdAt: string }[],
	lastCheckpointAtMs: number | null,
): boolean {
	return (
		countAutomatizationSessionDays(attempts, lastCheckpointAtMs ?? 0) >=
		CHECKPOINT_SESSION_INTERVAL
	);
}

export type CheckpointAnswer = "yes" | "no" | "partial";

export interface CheckpointSummary {
	count: number;
	completeSentencesYes: number;
	pausesBetweenSentencesYes: number;
	confidentKeyTermsYes: number;
}

interface CheckpointLike {
	createdAt: string;
	completeSentences: CheckpointAnswer;
	pausesBetweenSentences: CheckpointAnswer;
	confidentKeyTerms: CheckpointAnswer;
}

const CHECKPOINT_WINDOW_MS = 28 * MS_PER_DAY;

export function summarizeCheckpoints(
	checkpoints: readonly CheckpointLike[],
	now: number = Date.now(),
): CheckpointSummary {
	const recent = checkpoints.filter((checkpoint) => {
		const createdAtMs = Date.parse(checkpoint.createdAt);
		return Number.isFinite(createdAtMs) && now - createdAtMs <= CHECKPOINT_WINDOW_MS;
	});
	return {
		count: recent.length,
		completeSentencesYes: recent.filter((c) => c.completeSentences === "yes").length,
		pausesBetweenSentencesYes: recent.filter((c) => c.pausesBetweenSentences === "yes").length,
		confidentKeyTermsYes: recent.filter((c) => c.confidentKeyTerms === "yes").length,
	};
}

// -- "Shadow with variation" drill ------------------------------------------
// A natural extra step after stage 3 (precise shadowing): after
// requiredRepetitions exact repeats of a segment, present one lexical/
// structural variant of the same sentence and have the learner produce the
// ALTERED version with no audio support. Content-wise this only needs a
// small, hand-supplied variant per passage -- auto-generating variants is
// out of scope, so this drill activates only when a variant sentence has
// been supplied (e.g. by a teacher/learner alongside a custom passage), and
// stays inert (clearly optional, not silently broken) otherwise. Attempts
// are recorded on the same Attempt.stage field as the 5 core stages, using
// this fractional marker so they are distinguishable without adding a new
// AttemptMode or restructuring the 5-stage core.
export const VARIATION_DRILL_STAGE_MARKER = 3.5;

// -- 4-week tracking matrix --------------------------------------------

const MATRIX_WEEKS = 4;

export interface AutomatizationMatrixCell {
	attempts: number;
	accuracy: number | null;
	medianLatencyMs: number | null;
}

export interface AutomatizationMatrix {
	// Oldest week first, most recent week (containing today) last.
	weekLabels: string[];
	moduleTypes: readonly AutomatizationModuleType[];
	cells: Record<AutomatizationModuleType, AutomatizationMatrixCell[]>;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
		: sorted[mid]!;
}

function average(values: number[]): number | null {
	if (values.length === 0) return null;
	return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

interface MatrixAttemptLike {
	mode: string;
	createdAt: string;
	accuracyScore: number;
	latencyMs: number | null;
}

// Buckets by "days ago" in rolling 7-day windows ending today, not calendar
// weeks -- avoids ISO-week/timezone edge cases and always gives exactly 4
// buckets covering the trailing 28 days regardless of what day it is.
export function buildAutomatizationMatrix(
	attempts: readonly MatrixAttemptLike[],
	now: number = Date.now(),
): AutomatizationMatrix {
	const cells: Record<AutomatizationModuleType, AutomatizationMatrixCell[]> = {
		retrieval: [],
		shadowing: [],
		formulaic: [],
	};
	const buckets: Record<AutomatizationModuleType, MatrixAttemptLike[][]> = {
		retrieval: Array.from({ length: MATRIX_WEEKS }, () => []),
		shadowing: Array.from({ length: MATRIX_WEEKS }, () => []),
		formulaic: Array.from({ length: MATRIX_WEEKS }, () => []),
	};

	for (const attempt of attempts) {
		const moduleType = attemptModeToModuleType(attempt.mode);
		if (!moduleType) continue;
		const createdAtMs = Date.parse(attempt.createdAt);
		if (!Number.isFinite(createdAtMs)) continue;
		const daysAgo = Math.floor((now - createdAtMs) / MS_PER_DAY);
		if (daysAgo < 0 || daysAgo >= MATRIX_WEEKS * 7) continue;
		// weekIndex 0 = oldest (22-28 days ago), MATRIX_WEEKS-1 = this week.
		const weekFromToday = Math.floor(daysAgo / 7);
		const weekIndex = MATRIX_WEEKS - 1 - weekFromToday;
		buckets[moduleType][weekIndex]?.push(attempt);
	}

	const weekLabels: string[] = [];
	for (let weekIndex = 0; weekIndex < MATRIX_WEEKS; weekIndex += 1) {
		const weeksAgo = MATRIX_WEEKS - 1 - weekIndex;
		weekLabels.push(weeksAgo === 0 ? "This week" : `${weeksAgo} week${weeksAgo === 1 ? "" : "s"} ago`);
		for (const moduleType of AUTOMATIZATION_MODULE_TYPES) {
			const bucket = buckets[moduleType][weekIndex] ?? [];
			cells[moduleType].push({
				attempts: bucket.length,
				accuracy: average(bucket.map((attempt) => attempt.accuracyScore)),
				medianLatencyMs: median(
					bucket
						.map((attempt) => attempt.latencyMs)
						.filter((value): value is number => value !== null),
				),
			});
		}
	}

	return { weekLabels, moduleTypes: AUTOMATIZATION_MODULE_TYPES, cells };
}
