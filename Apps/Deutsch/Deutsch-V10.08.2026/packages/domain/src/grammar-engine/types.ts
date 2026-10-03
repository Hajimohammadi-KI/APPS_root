export type PosTag =
	| "ARTIKEL"
	| "NOMEN"
	| "PRONOMEN"
	| "VERB"
	| "MODALVERB"
	| "HILFSVERB"
	| "PARTIZIP"
	| "ADJEKTIV"
	| "ADVERB"
	| "PRAEPOSITION"
	| "KONJUNKTION"
	| "SUBJUNKTION"
	| "PUNKT"
	| "UNBEKANNT";

export type GrammaticalCase = "NOM" | "AKK" | "DAT" | "GEN";
export type Genus = "m" | "f" | "n" | "p";

export interface Token {
	readonly text: string;
	readonly index: number;
	readonly start: number;
	readonly end: number;
}

export interface TaggedToken extends Token {
	readonly pos: PosTag;
	readonly lemma: string;
	/** Case this token's surface form can encode, when it is an article/pronoun. */
	readonly possibleCases: readonly GrammaticalCase[];
	/** Genus this token's surface form can encode, when it is an article. */
	readonly possibleGenera: readonly Genus[];
}

export interface NounPhrase {
	readonly preposition: TaggedToken | null;
	readonly article: TaggedToken | null;
	readonly noun: TaggedToken | null;
	readonly tokens: readonly TaggedToken[];
	readonly startIndex: number;
	readonly endIndex: number;
	/** Noun genus resolved from the lexicon, when known (needed to build a correction). */
	readonly genus: Genus | null;
	/**
	 * Every case this NP's article surface form can represent, independent of
	 * genus (e.g. "die" => NOM or AKK, never DAT/GEN, for any genus). A rule
	 * flags an error when the required case is absent from this list; genus is
	 * only needed afterwards, to spell out the corrected article.
	 */
	readonly compatibleCases: readonly GrammaticalCase[];
}

export type ClauseType = "HAUPTSATZ" | "NEBENSATZ";

export interface VerbPhrase {
	readonly subordinator: TaggedToken | null;
	readonly finiteVerb: TaggedToken | null;
	readonly modalVerb: TaggedToken | null;
	readonly auxiliary: TaggedToken | null;
	readonly infinitive: TaggedToken | null;
	readonly participle: TaggedToken | null;
}

export interface Analysis {
	readonly text: string;
	readonly tokens: readonly TaggedToken[];
	readonly clauseType: ClauseType;
	readonly verbPhrase: VerbPhrase;
	readonly nounPhrases: readonly NounPhrase[];
}

export interface ValidationResult {
	readonly valid: boolean;
	readonly message?: string;
	readonly errorSpan?: string;
	readonly expected?: string;
}

export interface CorrectionResult {
	readonly corrected: string;
	readonly explanation: string;
	readonly level: string;
}

export interface GrammarRule {
	readonly id: string;
	readonly name: string;
	match(analysis: Analysis): boolean;
	validate(analysis: Analysis): ValidationResult;
	correction(analysis: Analysis, result: ValidationResult): CorrectionResult;
}

export interface DetectedError {
	readonly rule: string;
	readonly name: string;
	readonly errorSpan?: string;
	readonly expected?: string;
	readonly message: string;
	readonly correctedSentence: string;
	readonly explanation: string;
	readonly level: string;
}
