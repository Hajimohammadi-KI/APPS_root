export { analyzeSentence, checkSentence, detectErrors } from "./engine";
export {
	declineArticle,
	einWortForm,
	guessInfinitive,
	guessParticiple,
	NOUN_GENUS,
} from "./lexicon";
export { parseAnalysis } from "./parser";
export {
	akkusativObjektRule,
	artikelDeklinationRule,
	dativAkkusativRule,
	dativObjektRule,
	GRAMMAR_RULES,
	modalverbRule,
	nebensatzRule,
	perfektRule,
	praepositionenRule,
	verbPositionRule,
	wechselpraepositionenRule,
} from "./rules";
export { tagTokens } from "./tagger";
export { tokenize } from "./tokenizer";
export type {
	Analysis,
	ClauseType,
	CorrectionResult,
	DetectedError,
	Genus,
	GrammarRule,
	GrammaticalCase,
	NounPhrase,
	PosTag,
	TaggedToken,
	Token,
	ValidationResult,
	VerbPhrase,
} from "./types";
