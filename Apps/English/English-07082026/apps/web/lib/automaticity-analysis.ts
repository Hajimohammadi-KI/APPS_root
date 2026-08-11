export type AutomaticityIssueCode =
	| "missing_target"
	| "auxiliary_agreement"
	| "language_error"
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

	const wrongHas = cleanText.match(/\b(?:I|you|we|they)\s+has\b/i);
	if (wrongHas) {
		issues.push({
			code: "auxiliary_agreement",
			message: "Use have with I, you, we, and they.",
			original: wrongHas[0],
			corrected: wrongHas[0].replace(/has/i, "have"),
		});
	}

	const wrongHave = cleanText.match(/\b(?:he|she|it)\s+have\b/i);
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
