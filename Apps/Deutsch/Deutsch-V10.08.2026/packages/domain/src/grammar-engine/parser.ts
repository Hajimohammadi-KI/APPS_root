import {
	articleCasesForGenus,
	FUSED_PREPOSITIONS,
	NOUN_GENUS,
	VERB_INFINITIVE_FORMS,
} from "./lexicon";
import type {
	Analysis,
	ClauseType,
	NounPhrase,
	TaggedToken,
	VerbPhrase,
} from "./types";

/**
 * True for anything that could plausibly be filling a verb slot: a tagged
 * VERB/PARTIZIP, an untagged word ending in -en/-n (the regular infinitive
 * shape), or an untagged word that the irregular conjugation table
 * recognizes as *some* form of a known verb (this is what lets the engine
 * notice a wrongly-conjugated form like "spreche" standing where an
 * infinitive belongs — it wouldn't pass the -en/-n shape check on its own).
 * A wrongly-conjugated *regular* verb that also happens not to end in -en
 * (rare, but possible) will not be recognized — extend
 * VERB_INFINITIVE_FORMS in lexicon.ts to cover more verbs as needed.
 */
export function isVerbShaped(token: TaggedToken): boolean {
	if (token.pos === "VERB" || token.pos === "PARTIZIP") return true;
	if (token.pos !== "UNBEKANNT") return false;
	return (
		/en$|n$/.test(token.lemma) || Boolean(VERB_INFINITIVE_FORMS[token.lemma])
	);
}

function buildVerbPhrase(tokens: readonly TaggedToken[]): VerbPhrase {
	const subordinator = tokens.find((t) => t.pos === "SUBJUNKTION") ?? null;
	const modalVerb = tokens.find((t) => t.pos === "MODALVERB") ?? null;
	const auxiliary = tokens.find((t) => t.pos === "HILFSVERB") ?? null;
	const participle = tokens.find((t) => t.pos === "PARTIZIP") ?? null;

	const infinitive = modalVerb
		? (tokens.find(
				(t) =>
					t.index !== modalVerb.index &&
					t.pos !== "PARTIZIP" &&
					isVerbShaped(t),
			) ?? null)
		: null;

	const finiteVerb =
		modalVerb ?? auxiliary ?? tokens.find((t) => t.pos === "VERB") ?? null;

	return {
		subordinator,
		finiteVerb,
		modalVerb,
		auxiliary,
		infinitive,
		participle,
	};
}

function buildNounPhrases(tokens: readonly TaggedToken[]): NounPhrase[] {
	const phrases: NounPhrase[] = [];
	const consumedNounIndices = new Set<number>();

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token || token.pos !== "ARTIKEL") continue;

		const preceding = tokens[i - 1];
		const preposition =
			preceding && preceding.pos === "PRAEPOSITION" ? preceding : null;

		let noun: TaggedToken | null = null;
		for (let j = i + 1; j < Math.min(i + 3, tokens.length); j++) {
			const candidate = tokens[j];
			if (
				!candidate ||
				candidate.pos === "PUNKT" ||
				candidate.pos === "ARTIKEL" ||
				candidate.pos === "PRAEPOSITION"
			) {
				break;
			}
			if (candidate.pos === "NOMEN") {
				noun = candidate;
				break;
			}
		}
		if (!noun) {
			const next = tokens[i + 1];
			if (next && next.pos !== "PUNKT") {
				noun = next;
			}
		}
		if (!noun) continue;

		consumedNounIndices.add(noun.index);
		const genus = NOUN_GENUS[noun.lemma] ?? null;
		phrases.push({
			preposition,
			article: token,
			noun,
			tokens: tokens.slice(i, noun.index + 1),
			startIndex: preposition ? preposition.index : token.index,
			endIndex: noun.index,
			genus,
			compatibleCases: articleCasesForGenus(token.text, genus),
		});
	}

	// Fused preposition+article tokens ("im Park" = "in dem Park") carry an
	// unambiguous case directly on the preposition token; there is no
	// separate ARTIKEL token to find here.
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token || !(token.text.toLocaleLowerCase("de") in FUSED_PREPOSITIONS))
			continue;
		const noun = tokens[i + 1];
		if (!noun || noun.pos === "PUNKT" || consumedNounIndices.has(noun.index)) {
			continue;
		}
		phrases.push({
			preposition: token,
			article: null,
			noun,
			tokens: [token, noun],
			startIndex: token.index,
			endIndex: noun.index,
			genus: NOUN_GENUS[noun.lemma] ?? null,
			compatibleCases: token.possibleCases,
		});
	}

	return phrases.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Builds a shallow structural analysis of one sentence: clause type, the
 * verb phrase, and every noun phrase (bare or prepositional) with the cases
 * its article is compatible with. This is deliberately not a full
 * dependency parse with attachment disambiguation — it extracts just enough
 * structure for the valence-driven rules in ./rules.ts to check case
 * government, verb position and modal/participle pairing.
 */
export function parseAnalysis(
	text: string,
	tokens: readonly TaggedToken[],
): Analysis {
	const verbPhrase = buildVerbPhrase(tokens);
	const clauseType: ClauseType = verbPhrase.subordinator
		? "NEBENSATZ"
		: "HAUPTSATZ";
	const nounPhrases = buildNounPhrases(tokens);

	return { text, tokens, clauseType, verbPhrase, nounPhrases };
}
