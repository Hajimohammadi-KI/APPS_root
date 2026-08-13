export type AutomaticityIssueCode =
	| "missing_target"
	| "auxiliary_agreement"
	| "language_error"
	| "spelling_error"
	| "unfinished_sentence";

export interface AutomaticityIssue {
	code: AutomaticityIssueCode;
	message: string;
	original: string;
	corrected: string;
}

export interface AutomaticityAnalysis {
	sentenceCount: number;
	wordCount: number;
	targetUses: number;
	score: number;
	targetHit: boolean;
	issues: AutomaticityIssue[];
}

const IRREGULAR_PARTICIPLES = [
	"been",
	"become",
	"begun",
	"bought",
	"brought",
	"built",
	"caught",
	"chosen",
	"come",
	"done",
	"driven",
	"eaten",
	"fallen",
	"felt",
	"found",
	"forgotten",
	"given",
	"gone",
	"got",
	"gotten",
	"had",
	"heard",
	"kept",
	"known",
	"left",
	"lost",
	"made",
	"met",
	"paid",
	"read",
	"run",
	"said",
	"seen",
	"sent",
	"spoken",
	"spent",
	"stood",
	"taken",
	"taught",
	"thought",
	"told",
	"understood",
	"won",
	"worn",
	"written",
] as const;

const PARTICIPLE = `(?:[a-z]+ed|[a-z]+en|${IRREGULAR_PARTICIPLES.join("|")})`;
const MODIFIER = "(?:(?:never|ever|already|just|recently|yet)\\s+)?";
const PRESENT_PERFECT = new RegExp(
	`\\b(?:(?:i|you|we|they)\\s+have|(?:he|she|it|[A-Z][a-z]+)\\s+has)\\s+${MODIFIER}${PARTICIPLE}\\b`,
	"gi",
);

const WRONG_HAS_PATTERN = /\b(?:I|you|we|they)\s+has\b/i;
const WRONG_HAVE_PATTERN = /\b(?:he|she|it)\s+have\b/i;

function sentences(text: string): string[] {
	return text
		.split(/(?:[.!?]+|\n+)/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
}

function words(text: string): string[] {
	return text.trim().match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? [];
}

export function countPresentPerfectUses(text: string): number {
	return text.match(PRESENT_PERFECT)?.length ?? 0;
}

export function analyzePresentPerfect(text: string): AutomaticityAnalysis {
	const cleanText = text.trim();
	const sentenceCount = sentences(cleanText).length;
	const wordCount = words(cleanText).length;
	const targetUses = countPresentPerfectUses(cleanText);
	const issues: AutomaticityIssue[] = [];

	const wrongHas = cleanText.match(WRONG_HAS_PATTERN);
	if (wrongHas) {
		issues.push({
			code: "auxiliary_agreement",
			message: "Use have with I, you, we, and they.",
			original: wrongHas[0],
			corrected: wrongHas[0].replace(/has/i, "have"),
		});
	}

	const wrongHave = cleanText.match(WRONG_HAVE_PATTERN);
	if (wrongHave) {
		issues.push({
			code: "auxiliary_agreement",
			message: "Use has with he, she, and it.",
			original: wrongHave[0],
			corrected: wrongHave[0].replace(/have/i, "has"),
		});
	}

	if (cleanText && targetUses === 0) {
		issues.push({
			code: "missing_target",
			message:
				"Add have/has + past participle to connect a past event with now.",
			original: cleanText,
			corrected: "I have practised this structure today.",
		});
	}

	if (cleanText && !/[.!?]$/.test(cleanText)) {
		issues.push({
			code: "unfinished_sentence",
			message: "Finish the final sentence with punctuation.",
			original: cleanText,
			corrected: `${cleanText}.`,
		});
	}

	const sentenceScore = Math.min(35, Math.round((sentenceCount / 6) * 35));
	const targetScore = Math.min(50, Math.round((targetUses / 4) * 50));
	const accuracyScore = Math.max(0, 15 - issues.length * 5);
	const score = Math.min(100, sentenceScore + targetScore + accuracyScore);

	return {
		sentenceCount,
		wordCount,
		targetUses,
		score,
		targetHit: sentenceCount >= 6 && targetUses >= 4 && issues.length === 0,
		issues,
	};
}

export function normalizePracticeAnswer(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[.!?]+$/g, "")
		.replace(/\s+/g, " ");
}

export function practiceAnswerMatches(
	value: string,
	expected: string,
): boolean {
	return normalizePracticeAnswer(value) === normalizePracticeAnswer(expected);
}

const PRACTICE_STOPWORDS = new Set([
	"a", "an", "the", "to", "of", "in", "on", "at", "for", "and", "or", "but",
	"is", "are", "was", "were", "i", "you", "he", "she", "it", "we", "they",
	"this", "that", "these", "those", "my", "your", "his", "her", "its",
	"our", "their", "be", "been", "being", "do", "does", "did", "not", "so",
	"very", "just",
]);

// Exercises whose prompt asks the learner to transform, complete, or correct
// a given sentence genuinely have more than one valid surface form (e.g.
// "I have worked on this project since May" and "I've worked on this
// project since May" are both correct). Exercises that ask the learner to
// reproduce or fill in one specific model sentence do not — exact match
// stays authoritative there.
const OPEN_PRODUCTION_PROMPT = /^(?:Transform|Complete|Correct the sentence)\s*:/i;

function expandContractions(text: string): string {
	return text
		.replace(/\bwon't\b/gi, "will not")
		.replace(/\bcan't\b/gi, "cannot")
		.replace(/n't\b/gi, " not")
		.replace(/'ve\b/gi, " have")
		.replace(/'re\b/gi, " are")
		.replace(/'m\b/gi, " am");
}

function significantWords(text: string): Set<string> {
	return new Set(
		words(expandContractions(text))
			.map((word) => word.toLowerCase())
			.filter((word) => word.length > 2 && !PRACTICE_STOPWORDS.has(word)),
	);
}

function extractPromptReference(prompt: string): string {
	const match = prompt.match(/^(?:Transform|Complete|Correct the sentence)\s*:\s*(.+)$/i);
	return match?.[1] ?? "";
}

/**
 * Grades a controlled Grammar Lab answer without requiring verbatim
 * reproduction of the single stored `expected` string. An exact
 * (normalized) match is always accepted. For open-production prompts
 * ("Transform:", "Complete:", "Correct the sentence:"), an answer is also
 * accepted when it (a) contains the grammar marker introduced by the model
 * answer relative to the prompt's source sentence, and (b) doesn't trip a
 * known auxiliary-agreement error. Prompts that ask the learner to
 * reproduce one specific model sentence (e.g. "Type the model sentence:")
 * keep requiring an exact match, since they genuinely have one right form.
 */
export function evaluatePracticeAnswer(
	answer: string,
	exercise: { prompt: string; expected: string },
): boolean {
	if (practiceAnswerMatches(answer, exercise.expected)) return true;

	const trimmedAnswer = answer.trim();
	if (!trimmedAnswer) return false;
	if (!OPEN_PRODUCTION_PROMPT.test(exercise.prompt.trim())) return false;

	// Reject an answer that just repeats the wrong/original sentence given
	// in the prompt unchanged.
	const reference = extractPromptReference(exercise.prompt);
	if (
		reference &&
		normalizePracticeAnswer(trimmedAnswer) === normalizePracticeAnswer(reference)
	) {
		return false;
	}

	if (
		WRONG_HAS_PATTERN.test(trimmedAnswer) ||
		WRONG_HAVE_PATTERN.test(trimmedAnswer)
	) {
		return false;
	}

	const expectedWords = significantWords(exercise.expected);
	const referenceWords = significantWords(reference);
	const markerWords = [...expectedWords].filter((word) => !referenceWords.has(word));
	// If nothing distinguishes the model answer from the prompt's source
	// sentence, fall back to requiring the full expected word set so the
	// check never degrades into accepting anything.
	const requiredWords = markerWords.length > 0 ? markerWords : [...expectedWords];
	if (requiredWords.length === 0) return false;

	const answerWords = significantWords(trimmedAnswer);
	const hasAllMarkers = requiredWords.every((word) => answerWords.has(word));
	if (!hasAllMarkers) return false;

	const overlap = [...expectedWords].filter((word) => answerWords.has(word)).length;
	const overlapRatio = expectedWords.size ? overlap / expectedWords.size : 0;
	return overlapRatio >= 0.5;
}
