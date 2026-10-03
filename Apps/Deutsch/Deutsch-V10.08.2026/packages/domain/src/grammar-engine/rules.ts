import {
	applyNpCorrection,
	chunksBefore,
	correctedNpText,
	firstChunkEndIndex,
	moveTokenAfterIndex,
	moveTokenToClauseEnd,
	npText,
	objectNounPhrases,
	renderTokens,
	replaceRange,
} from "./helpers";
import {
	ACCUSATIVE_VERBS,
	AKK_PREPOSITIONEN,
	articleCompatibleGenera,
	DAT_PREPOSITIONEN,
	DATIVE_VERBS,
	DITRANSITIVE_VERBS,
	declineArticle,
	guessInfinitive,
	guessParticiple,
	MOTION_VERBS,
	POSITION_VERBS,
	WECHSEL_PRAEPOSITIONEN,
} from "./lexicon";
import { isVerbShaped } from "./parser";
import type { GrammarRule, ValidationResult } from "./types";

function ok(): ValidationResult {
	return { valid: true };
}

function invalid(
	message: string,
	errorSpan?: string,
	expected?: string,
): ValidationResult {
	return {
		valid: false,
		message,
		...(errorSpan !== undefined ? { errorSpan } : {}),
		...(expected !== undefined ? { expected } : {}),
	};
}

/** Rule 1: verbs like sehen/kaufen/haben govern an accusative object. */
export const akkusativObjektRule: GrammarRule = {
	id: "AKKUSATIV_OBJEKT",
	name: "Akkusativobjekt",
	match(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		return Boolean(verb && ACCUSATIVE_VERBS.includes(verb.lemma));
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		if (!verb) return ok();
		const object = objectNounPhrases(analysis, verb)[0];
		if (!object || object.compatibleCases.length === 0) return ok();
		if (object.compatibleCases.includes("AKK")) return ok();
		return invalid(
			`Das Verb „${verb.lemma}“ verlangt ein Akkusativobjekt.`,
			npText(object),
			correctedNpText(object, "AKK") ?? undefined,
		);
	},
	correction(analysis, result) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const object = objectNounPhrases(analysis, verb)[0]!;
		const corrected = applyNpCorrection(analysis, object, "AKK");
		return {
			corrected,
			explanation: `Das Verb „${verb.lemma}“ verlangt ein Akkusativobjekt. ${
				result.expected
					? `„${result.errorSpan}“ wird im Akkusativ zu „${result.expected}“.`
					: ""
			}`.trim(),
			level: "A1",
		};
	},
};

/** Rule 2: verbs like helfen/danken/gefallen govern a dative object. */
export const dativObjektRule: GrammarRule = {
	id: "DATIV_OBJEKT",
	name: "Dativobjekt",
	match(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		return Boolean(verb && DATIVE_VERBS.includes(verb.lemma));
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		if (!verb) return ok();
		const object = objectNounPhrases(analysis, verb)[0];
		if (!object || object.compatibleCases.length === 0) return ok();
		if (object.compatibleCases.includes("DAT")) return ok();
		return invalid(
			`Das Verb „${verb.lemma}“ verlangt ein Dativobjekt.`,
			npText(object),
			correctedNpText(object, "DAT") ?? undefined,
		);
	},
	correction(analysis, result) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const object = objectNounPhrases(analysis, verb)[0]!;
		const corrected = applyNpCorrection(analysis, object, "DAT");
		return {
			corrected,
			explanation: `Das Verb „${verb.lemma}“ verlangt ein Dativobjekt. ${
				result.expected
					? `„${result.errorSpan}“ wird im Dativ zu „${result.expected}“.`
					: ""
			}`.trim(),
			level: "A2",
		};
	},
};

/** Rule 3: ditransitive verbs (geben, schicken, ...) take "jemandem etwas". */
export const dativAkkusativRule: GrammarRule = {
	id: "DATIV_AKKUSATIV",
	name: "Dativ + Akkusativ",
	match(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		return Boolean(verb && DITRANSITIVE_VERBS.includes(verb.lemma));
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		if (!verb) return ok();
		const [receiver, thing] = objectNounPhrases(analysis, verb);
		if (!receiver || !thing) return ok();
		if (
			receiver.compatibleCases.length > 0 &&
			!receiver.compatibleCases.includes("DAT")
		) {
			return invalid(
				`Bei „jemandem etwas ${verb.lemma}“ steht der Empfänger im Dativ.`,
				npText(receiver),
				correctedNpText(receiver, "DAT") ?? undefined,
			);
		}
		if (
			thing.compatibleCases.length > 0 &&
			!thing.compatibleCases.includes("AKK")
		) {
			return invalid(
				`Bei „jemandem etwas ${verb.lemma}“ steht die Sache im Akkusativ.`,
				npText(thing),
				correctedNpText(thing, "AKK") ?? undefined,
			);
		}
		return ok();
	},
	correction(analysis, result) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const [receiver, thing] = objectNounPhrases(analysis, verb);
		const targetIsReceiver = result.message?.includes("Empfänger");
		const corrected = targetIsReceiver
			? applyNpCorrection(analysis, receiver!, "DAT")
			: applyNpCorrection(analysis, thing!, "AKK");
		return {
			corrected,
			explanation: `${result.message ?? ""} ${
				result.expected
					? `„${result.errorSpan}“ wird zu „${result.expected}“.`
					: ""
			}`.trim(),
			level: "A2",
		};
	},
};

/** Rule 4: fixed-case prepositions (für/ohne/... = AKK; mit/bei/... = DAT). */
export const praepositionenRule: GrammarRule = {
	id: "PRAEPOSITIONEN",
	name: "Präpositionen",
	match(analysis) {
		return analysis.nounPhrases.some(
			(np) =>
				np.preposition &&
				(AKK_PREPOSITIONEN.includes(np.preposition.lemma) ||
					DAT_PREPOSITIONEN.includes(np.preposition.lemma)),
		);
	},
	validate(analysis) {
		for (const np of analysis.nounPhrases) {
			if (!np.preposition || np.compatibleCases.length === 0) continue;
			const required = AKK_PREPOSITIONEN.includes(np.preposition.lemma)
				? "AKK"
				: DAT_PREPOSITIONEN.includes(np.preposition.lemma)
					? "DAT"
					: null;
			if (!required || np.compatibleCases.includes(required)) continue;
			return invalid(
				`Die Präposition „${np.preposition.lemma}“ verlangt den ${
					required === "AKK" ? "Akkusativ" : "Dativ"
				}.`,
				npText(np),
				correctedNpText(np, required) ?? undefined,
			);
		}
		return ok();
	},
	correction(analysis, result) {
		const np = analysis.nounPhrases.find(
			(phrase) => npText(phrase) === result.errorSpan,
		)!;
		const required = AKK_PREPOSITIONEN.includes(np.preposition!.lemma)
			? "AKK"
			: "DAT";
		const corrected = applyNpCorrection(analysis, np, required);
		return {
			corrected,
			explanation: `${result.message ?? ""} ${
				result.expected
					? `„${result.errorSpan}“ wird zu „${result.expected}“.`
					: ""
			}`.trim(),
			level: "A2",
		};
	},
};

/** Rule 5: Wechselpräpositionen take AKK for motion (wohin?), DAT for
 * location (wo?) — decided from the clause's main verb. */
export const wechselpraepositionenRule: GrammarRule = {
	id: "WECHSELPRAEPOSITIONEN",
	name: "Wechselpräpositionen",
	match(analysis) {
		return analysis.nounPhrases.some(
			(np) =>
				np.preposition && WECHSEL_PRAEPOSITIONEN.includes(np.preposition.lemma),
		);
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb;
		if (!verb) return ok();
		const isMotion = MOTION_VERBS.includes(verb.lemma);
		const isPosition = POSITION_VERBS.includes(verb.lemma);
		if (!isMotion && !isPosition) return ok();
		const required = isMotion ? "AKK" : "DAT";
		for (const np of analysis.nounPhrases) {
			if (
				!np.preposition ||
				!WECHSEL_PRAEPOSITIONEN.includes(np.preposition.lemma) ||
				np.compatibleCases.length === 0
			) {
				continue;
			}
			if (np.compatibleCases.includes(required)) continue;
			return invalid(
				`„${verb.lemma}“ beschreibt ${
					isMotion
						? "eine Bewegung (wohin?), also Akkusativ"
						: "eine Position (wo?), also Dativ"
				}.`,
				npText(np),
				correctedNpText(np, required) ?? undefined,
			);
		}
		return ok();
	},
	correction(analysis, result) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const required = MOTION_VERBS.includes(verb.lemma) ? "AKK" : "DAT";
		const np = analysis.nounPhrases.find(
			(phrase) => npText(phrase) === result.errorSpan,
		)!;
		const corrected = applyNpCorrection(analysis, np, required);
		return {
			corrected,
			explanation: `${result.message ?? ""} ${
				result.expected
					? `„${result.errorSpan}“ wird zu „${result.expected}“.`
					: ""
			}`.trim(),
			level: "A2",
		};
	},
};

/** Rule 6: in a Hauptsatz, the finite verb is the second constituent. */
export const verbPositionRule: GrammarRule = {
	id: "VERB_POSITION",
	name: "Verbposition (V2)",
	match(analysis) {
		return (
			analysis.clauseType === "HAUPTSATZ" &&
			Boolean(analysis.verbPhrase.finiteVerb)
		);
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb!;
		if (verb.index === 0) return ok();
		if (chunksBefore(analysis, verb) <= 1) return ok();
		return invalid(
			"Im Hauptsatz steht das finite Verb an Position 2.",
			verb.text,
		);
	},
	correction(analysis) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const reordered = moveTokenAfterIndex(
			analysis.tokens,
			verb,
			firstChunkEndIndex(analysis),
		);
		return {
			corrected: renderTokens(reordered),
			explanation:
				"Im deutschen Hauptsatz steht das finite Verb immer an Position 2, direkt nach dem ersten Satzglied.",
			level: "A1",
		};
	},
};

/** Rule 7: subordinate clauses (weil/dass/ob/wenn ...) send the finite verb
 * to the end. */
export const nebensatzRule: GrammarRule = {
	id: "NEBENSATZ_VERBPOSITION",
	name: "Nebensatz-Verbposition",
	match(analysis) {
		return (
			analysis.clauseType === "NEBENSATZ" &&
			Boolean(analysis.verbPhrase.finiteVerb)
		);
	},
	validate(analysis) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const contentTokens = analysis.tokens.filter(
			(token) => token.pos !== "PUNKT",
		);
		const lastContent = contentTokens[contentTokens.length - 1];
		if (!lastContent || verb.index === lastContent.index) return ok();
		return invalid(
			`Nach „${analysis.verbPhrase.subordinator?.lemma}“ steht das finite Verb am Satzende.`,
			verb.text,
		);
	},
	correction(analysis) {
		const verb = analysis.verbPhrase.finiteVerb!;
		const reordered = moveTokenToClauseEnd(analysis.tokens, verb);
		return {
			corrected: renderTokens(reordered),
			explanation:
				"In einem Nebensatz mit weil/dass/ob/wenn steht das konjugierte Verb ganz am Ende.",
			level: "A2",
		};
	},
};

/** Rule 8: a modal verb pairs with a bare infinitive, not a conjugated form. */
export const modalverbRule: GrammarRule = {
	id: "MODALVERB_INFINITIV",
	name: "Modalverb + Infinitiv",
	match(analysis) {
		return Boolean(
			analysis.verbPhrase.modalVerb && analysis.verbPhrase.infinitive,
		);
	},
	validate(analysis) {
		const modal = analysis.verbPhrase.modalVerb!;
		const infinitive = analysis.verbPhrase.infinitive!;
		const lower = infinitive.text.toLocaleLowerCase("de");
		if (lower.endsWith("en") || lower === "sein" || lower === "tun")
			return ok();
		return invalid(
			`Nach dem Modalverb „${modal.lemma}“ steht der Infinitiv, nicht die konjugierte Form.`,
			infinitive.text,
			guessInfinitive(infinitive.text),
		);
	},
	correction(analysis, result) {
		const infinitive = analysis.verbPhrase.infinitive!;
		const corrected = replaceRange(
			analysis.text,
			infinitive.start,
			infinitive.end,
			result.expected ?? infinitive.text,
		);
		return {
			corrected,
			explanation: `${result.message ?? ""} „${result.errorSpan}“ wird zu „${result.expected}“.`,
			level: "A1",
		};
	},
};

/** Rule 9: haben/sein pairs with a Partizip II in the Perfekt, not a bare
 * infinitive. */
export const perfektRule: GrammarRule = {
	id: "PERFEKT",
	name: "Perfekt (haben/sein + Partizip II)",
	match(analysis) {
		return Boolean(analysis.verbPhrase.auxiliary);
	},
	validate(analysis) {
		const aux = analysis.verbPhrase.auxiliary!;
		if (analysis.verbPhrase.participle) return ok();
		const candidate = analysis.tokens.find(
			(token) =>
				token.index !== aux.index &&
				token.pos !== "PUNKT" &&
				isVerbShaped(token),
		);
		if (!candidate) return ok();
		return invalid(
			`Nach „${aux.lemma}“ steht im Perfekt das Partizip II, nicht der Infinitiv.`,
			candidate.text,
			guessParticiple(guessInfinitive(candidate.text)),
		);
	},
	correction(analysis, result) {
		const aux = analysis.verbPhrase.auxiliary!;
		const candidate = analysis.tokens.find(
			(token) =>
				token.index !== aux.index &&
				token.pos !== "PUNKT" &&
				isVerbShaped(token),
		)!;
		const corrected = replaceRange(
			analysis.text,
			candidate.start,
			candidate.end,
			result.expected ?? candidate.text,
		);
		return {
			corrected,
			explanation: `${result.message ?? ""} „${result.errorSpan}“ wird zu „${result.expected}“.`,
			level: "A2",
		};
	},
};

/** Rule 10: an article must agree in genus with the noun it introduces,
 * independent of which case a governing verb or preposition requires. */
export const artikelDeklinationRule: GrammarRule = {
	id: "ARTIKEL_DEKLINATION",
	name: "Artikeldeklination",
	match(analysis) {
		return analysis.nounPhrases.some((np) => np.article && np.genus);
	},
	validate(analysis) {
		for (const np of analysis.nounPhrases) {
			if (!np.article || !np.genus) continue;
			const generaForArticle = articleCompatibleGenera(np.article.text);
			if (generaForArticle.includes(np.genus)) continue;
			const preferredCase = np.compatibleCases.includes("NOM")
				? "NOM"
				: (np.compatibleCases[0] ?? "NOM");
			return invalid(
				`Der Artikel „${np.article.text}“ passt nicht zum Genus von „${np.noun?.text}“.`,
				npText(np),
				`${declineArticle(preferredCase, np.genus)} ${np.noun?.text ?? ""}`.trim(),
			);
		}
		return ok();
	},
	correction(analysis, result) {
		return {
			corrected: result.errorSpan
				? analysis.text.replace(
						result.errorSpan,
						result.expected ?? result.errorSpan,
					)
				: analysis.text,
			explanation: `${result.message ?? ""} ${
				result.expected ? `Richtig ist „${result.expected}“.` : ""
			}`.trim(),
			level: "A1",
		};
	},
};

export const GRAMMAR_RULES: readonly GrammarRule[] = [
	akkusativObjektRule,
	dativObjektRule,
	dativAkkusativRule,
	praepositionenRule,
	wechselpraepositionenRule,
	verbPositionRule,
	nebensatzRule,
	modalverbRule,
	perfektRule,
	artikelDeklinationRule,
];
