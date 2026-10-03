import type { Token } from "./types";

const TOKEN_PATTERN = /[A-Za-zÄÖÜäöüß]+|[.,!?;:]/g;

/**
 * Splits a sentence into word and punctuation tokens. This is intentionally
 * simple (regex-based, no clitic splitting): fused prepositions such as "im"
 * or "zum" are kept as single tokens and resolved directly in the tagger's
 * lexicon instead of being decomposed into "in" + "dem".
 */
export function tokenize(sentence: string): readonly Token[] {
	const tokens: Token[] = [];
	let match: RegExpExecArray | null;
	let index = 0;
	TOKEN_PATTERN.lastIndex = 0;
	while ((match = TOKEN_PATTERN.exec(sentence)) !== null) {
		tokens.push({
			text: match[0],
			index: index++,
			start: match.index,
			end: match.index + match[0].length,
		});
	}
	return tokens;
}
