import { countPerfectUses } from "@automaticity/learning-core/writing-rules";
import { writingIssues } from "@automaticity/learning-core/writing-rules";
import { matchesReferenceAnswer, normalizeReferenceAnswer } from "@automaticity/learning-core/reference-answer";

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
	return countPerfectUses(text);
}

export function analyzePresentPerfect(text: string): AutomaticityAnalysis {
	const cleanText = text.trim();
	const sentenceCount = sentences(cleanText).length;
	const wordCount = words(cleanText).length;
	const targetUses = countPresentPerfectUses(cleanText);
	const issues: AutomaticityIssue[] = [];

	for (const issue of writingIssues(cleanText, "en").filter(issue => issue.ruleId === "EN_SUBJECT_AGREEMENT")) {
 issues.push({ code: "auxiliary_agreement", message: issue.message, original: (cleanText.slice(0, issue.start).match(/\b(?:He|She|It|I|You|We|They)\s+$/i)?.[0] ?? "") + issue.original, corrected: (cleanText.slice(0, issue.start).match(/\b(?:He|She|It|I|You|We|They)\s+$/i)?.[0] ?? "") + issue.replacement });
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
	return normalizeReferenceAnswer(value);
}

export function practiceAnswerMatches(
	value: string,
	expected: string,
): boolean {
	return matchesReferenceAnswer(value, expected, { allowOptionalFinalPeriod: true });
}
