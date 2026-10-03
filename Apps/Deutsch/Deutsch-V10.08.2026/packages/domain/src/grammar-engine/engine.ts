import { parseAnalysis } from "./parser";
import { GRAMMAR_RULES } from "./rules";
import { tagTokens } from "./tagger";
import { tokenize } from "./tokenizer";
import type { Analysis, DetectedError } from "./types";

/** Runs the full pipeline (tokenize -> tag -> parse) for one sentence. */
export function analyzeSentence(text: string): Analysis {
	return parseAnalysis(text, tagTokens(tokenize(text)));
}

/** Runs every rule that matches this sentence and collects the failures. */
export function detectErrors(analysis: Analysis): readonly DetectedError[] {
	const errors: DetectedError[] = [];
	for (const rule of GRAMMAR_RULES) {
		if (!rule.match(analysis)) continue;
		const result = rule.validate(analysis);
		if (result.valid) continue;
		const correction = rule.correction(analysis, result);
		errors.push({
			rule: rule.id,
			name: rule.name,
			...(result.errorSpan !== undefined
				? { errorSpan: result.errorSpan }
				: {}),
			...(result.expected !== undefined ? { expected: result.expected } : {}),
			message: result.message ?? "",
			correctedSentence: correction.corrected,
			explanation: correction.explanation,
			level: correction.level,
		});
	}
	return errors;
}

/** Convenience one-shot entry point: sentence in, detected errors out. */
export function checkSentence(text: string): readonly DetectedError[] {
	return detectErrors(analyzeSentence(text));
}
