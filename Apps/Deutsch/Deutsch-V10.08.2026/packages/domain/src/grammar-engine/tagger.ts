import {
	ACCUSATIVE_VERBS,
	ADVERBS,
	AKK_PREPOSITIONEN,
	AUXILIARY_VERB_FORMS,
	DAT_PREPOSITIONEN,
	DATIVE_VERBS,
	DITRANSITIVE_VERBS,
	FUSED_PREPOSITIONS,
	guessInfinitive,
	KONJUNKTIONEN,
	looksLikeParticiple,
	MODAL_VERB_FORMS,
	MOTION_VERBS,
	NOUN_GENUS,
	POSITION_VERBS,
	REVERSE_ARTICLE_INDEX,
	SUBORDINATORS,
	WECHSEL_PRAEPOSITIONEN,
} from "./lexicon";
import type { GrammaticalCase, PosTag, TaggedToken, Token } from "./types";

const PUNCTUATION = new Set([".", ",", "!", "?", ";", ":"]);
const PRONOUNS = new Set([
	"ich",
	"du",
	"er",
	"sie",
	"es",
	"wir",
	"ihr",
	"mich",
	"dich",
	"ihn",
	"uns",
	"euch",
	"mir",
	"dir",
	"ihm",
	"ihnen",
]);

const VERB_VALENCE_LEMMAS = new Set([
	...ACCUSATIVE_VERBS,
	...DATIVE_VERBS,
	...DITRANSITIVE_VERBS,
	...MOTION_VERBS,
	...POSITION_VERBS,
]);

function tag(
	token: Token,
	pos: PosTag,
	lemma: string,
	possibleCases: readonly GrammaticalCase[] = [],
	possibleGenera: readonly ("m" | "f" | "n" | "p")[] = [],
): TaggedToken {
	return { ...token, pos, lemma, possibleCases, possibleGenera };
}

/**
 * Assigns a part-of-speech tag to every token using the lexicons in
 * ./lexicon.ts. This is a rule/lookup-based tagger, not a trained
 * statistical model: anything outside the lexicon falls back to
 * "UNBEKANNT" rather than being guessed, so downstream rules simply skip
 * what they cannot verify instead of risking a wrong verdict.
 */
export function tagTokens(tokens: readonly Token[]): readonly TaggedToken[] {
	return tokens.map((token, position) => {
		const lower = token.text.toLocaleLowerCase("de");

		if (PUNCTUATION.has(token.text)) {
			return tag(token, "PUNKT", token.text);
		}
		if (SUBORDINATORS.includes(lower)) {
			return tag(token, "SUBJUNKTION", lower);
		}
		if (KONJUNKTIONEN.includes(lower)) {
			return tag(token, "KONJUNKTION", lower);
		}
		if (MODAL_VERB_FORMS[lower]) {
			return tag(token, "MODALVERB", MODAL_VERB_FORMS[lower]);
		}
		if (AUXILIARY_VERB_FORMS[lower]) {
			return tag(token, "HILFSVERB", AUXILIARY_VERB_FORMS[lower]);
		}
		if (FUSED_PREPOSITIONS[lower]) {
			const fused = FUSED_PREPOSITIONS[lower];
			return tag(token, "PRAEPOSITION", fused.preposition, [fused.case]);
		}
		if (AKK_PREPOSITIONEN.includes(lower)) {
			return tag(token, "PRAEPOSITION", lower, ["AKK"]);
		}
		if (DAT_PREPOSITIONEN.includes(lower)) {
			return tag(token, "PRAEPOSITION", lower, ["DAT"]);
		}
		if (WECHSEL_PRAEPOSITIONEN.includes(lower)) {
			return tag(token, "PRAEPOSITION", lower, ["AKK", "DAT"]);
		}
		if (PRONOUNS.has(lower)) {
			return tag(token, "PRONOMEN", lower);
		}
		if (REVERSE_ARTICLE_INDEX.has(lower)) {
			const readings = REVERSE_ARTICLE_INDEX.get(lower) ?? [];
			return tag(
				token,
				"ARTIKEL",
				lower,
				[...new Set(readings.map((reading) => reading.case))],
				[...new Set(readings.map((reading) => reading.genus))],
			);
		}
		if (NOUN_GENUS[lower]) {
			return tag(token, "NOMEN", lower, [], [NOUN_GENUS[lower]]);
		}
		if (looksLikeParticiple(token.text)) {
			return tag(token, "PARTIZIP", guessInfinitive(token.text));
		}
		if (ADVERBS.includes(lower)) {
			return tag(token, "ADVERB", lower);
		}

		const guessedLemma = guessInfinitive(token.text);
		if (
			VERB_VALENCE_LEMMAS.has(guessedLemma) ||
			VERB_VALENCE_LEMMAS.has(lower)
		) {
			return tag(
				token,
				"VERB",
				VERB_VALENCE_LEMMAS.has(lower) ? lower : guessedLemma,
			);
		}

		// Capitalized, non-sentence-initial words are, by German orthography,
		// almost always nouns even when absent from the lexicon.
		if (position > 0 && /^[A-ZÄÖÜ]/.test(token.text)) {
			return tag(token, "NOMEN", lower);
		}

		return tag(token, "UNBEKANNT", lower);
	});
}
