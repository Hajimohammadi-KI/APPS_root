import { declineArticle } from "./lexicon";
import type {
	Analysis,
	GrammaticalCase,
	NounPhrase,
	TaggedToken,
} from "./types";

/** Reconstructs a readable "preposition article noun" string for messages. */
export function npText(np: NounPhrase): string {
	return [np.preposition?.text, np.article?.text, np.noun?.text]
		.filter((part): part is string => Boolean(part))
		.join(" ");
}

/** Non-prepositional noun phrases appearing after a given token (the verb). */
export function objectNounPhrases(
	analysis: Analysis,
	after: TaggedToken | null,
): readonly NounPhrase[] {
	return analysis.nounPhrases.filter(
		(np) => np.preposition === null && (!after || np.startIndex > after.index),
	);
}

export function replaceRange(
	text: string,
	start: number,
	end: number,
	replacement: string,
): string {
	return text.slice(0, start) + replacement + text.slice(end);
}

/**
 * The corrected "(preposition) article noun" text for an NP in a required
 * case. Returns null when the noun's genus is unknown, since a definite
 * article cannot be chosen without it — callers should fall back to
 * reporting the case error without a precise rewritten form in that case.
 */
export function correctedNpText(
	np: NounPhrase,
	requiredCase: GrammaticalCase,
): string | null {
	if (!np.genus || !np.noun) return null;
	const article = declineArticle(requiredCase, np.genus);
	const prepositionWord = np.preposition ? `${np.preposition.lemma} ` : "";
	return `${prepositionWord}${article} ${np.noun.text}`.trim();
}

export function applyNpCorrection(
	analysis: Analysis,
	np: NounPhrase,
	requiredCase: GrammaticalCase,
): string {
	const replacement = correctedNpText(np, requiredCase);
	if (!replacement || !np.noun) return analysis.text;
	const start = np.preposition
		? np.preposition.start
		: (np.article?.start ?? np.noun.start);
	return replaceRange(analysis.text, start, np.noun.end, replacement);
}

/** Re-renders a token list as a sentence: spaces between words, none before
 * punctuation, first letter capitalized. Used by the word-order rules,
 * which reorder tokens rather than editing character ranges in place. */
export function renderTokens(tokens: readonly TaggedToken[]): string {
	let result = "";
	for (const token of tokens) {
		result +=
			token.pos === "PUNKT"
				? token.text
				: (result.length > 0 ? " " : "") + token.text;
	}
	return result.length > 0
		? result.charAt(0).toUpperCase() + result.slice(1)
		: result;
}

/** End index of the clause's first constituent (subject NP, or else just
 * the first token), i.e. where the finite verb belongs in a V2 clause. */
export function firstChunkEndIndex(analysis: Analysis): number {
	const firstToken = analysis.tokens[0];
	if (!firstToken) return 0;
	const firstNp = analysis.nounPhrases.find(
		(np) => np.startIndex === firstToken.index,
	);
	return firstNp ? firstNp.endIndex : firstToken.index;
}

export function moveTokenAfterIndex(
	tokens: readonly TaggedToken[],
	tokenToMove: TaggedToken,
	afterIndex: number,
): readonly TaggedToken[] {
	const withoutToken = tokens.filter(
		(token) => token.index !== tokenToMove.index,
	);
	const insertPosition = withoutToken.findIndex(
		(token) => token.index > afterIndex,
	);
	return insertPosition === -1
		? [...withoutToken, tokenToMove]
		: [
				...withoutToken.slice(0, insertPosition),
				tokenToMove,
				...withoutToken.slice(insertPosition),
			];
}

export function moveTokenToClauseEnd(
	tokens: readonly TaggedToken[],
	tokenToMove: TaggedToken,
): readonly TaggedToken[] {
	const withoutToken = tokens.filter(
		(token) => token.index !== tokenToMove.index,
	);
	const lastPunctuationIndex = withoutToken.findLastIndex(
		(token) => token.pos === "PUNKT",
	);
	return lastPunctuationIndex === -1
		? [...withoutToken, tokenToMove]
		: [
				...withoutToken.slice(0, lastPunctuationIndex),
				tokenToMove,
				...withoutToken.slice(lastPunctuationIndex),
			];
}

/** Number of top-level chunks (noun phrases, or standalone tokens like
 * adverbs) preceding a given token — used to spot V2 violations. */
export function chunksBefore(analysis: Analysis, before: TaggedToken): number {
	const npIndices = new Set<number>();
	for (const np of analysis.nounPhrases) {
		if (np.endIndex < before.index) {
			for (let i = np.startIndex; i <= np.endIndex; i++) npIndices.add(i);
		}
	}
	let chunks = new Set(
		analysis.nounPhrases
			.filter((np) => np.endIndex < before.index)
			.map((np) => np.startIndex),
	).size;
	for (const token of analysis.tokens) {
		if (
			token.index < before.index &&
			token.pos !== "PUNKT" &&
			!npIndices.has(token.index)
		) {
			chunks++;
		}
	}
	return chunks;
}
