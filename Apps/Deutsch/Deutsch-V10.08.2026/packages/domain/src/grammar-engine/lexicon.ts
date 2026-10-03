import type { Genus, GrammaticalCase } from "./types";

/**
 * Starter lexicons for the rule engine below. These cover the vocabulary
 * used in the app's own A1/A2 grammar examples plus the sentences in the
 * rule specification this engine implements — not all of German. Extend the
 * arrays/maps here as new verbs, nouns or prepositions need coverage; the
 * tagger and rules fall back to "unknown" (no case checked) for anything
 * absent instead of guessing.
 */

const CASES: readonly GrammaticalCase[] = ["NOM", "AKK", "DAT", "GEN"];
const GENERA: readonly Genus[] = ["m", "f", "n", "p"];

export const DEFINITE_TABLE: Record<GrammaticalCase, Record<Genus, string>> = {
	NOM: { m: "der", f: "die", n: "das", p: "die" },
	AKK: { m: "den", f: "die", n: "das", p: "die" },
	DAT: { m: "dem", f: "der", n: "dem", p: "den" },
	GEN: { m: "des", f: "der", n: "des", p: "der" },
};

const EIN_ENDINGS: Record<GrammaticalCase, Record<Genus, string>> = {
	NOM: { m: "", f: "e", n: "", p: "e" },
	AKK: { m: "en", f: "e", n: "", p: "e" },
	DAT: { m: "em", f: "er", n: "em", p: "en" },
	GEN: { m: "es", f: "er", n: "es", p: "er" },
};

export const EIN_STEMS = [
	"ein",
	"kein",
	"mein",
	"dein",
	"sein",
	"ihr",
	"unser",
	"euer",
] as const;

export function einWortForm(
	stem: (typeof EIN_STEMS)[number],
	grammaticalCase: GrammaticalCase,
	genus: Genus,
): string {
	const ending = EIN_ENDINGS[grammaticalCase][genus];
	// "euer" drops its second e before any non-empty ending: eure, euren, eures, eurer.
	const effectiveStem = stem === "euer" && ending !== "" ? "eur" : stem;
	return effectiveStem + ending;
}

export function declineArticle(
	grammaticalCase: GrammaticalCase,
	genus: Genus,
): string {
	return DEFINITE_TABLE[grammaticalCase][genus];
}

interface ArticleReading {
	readonly kind: "definite" | "ein-wort";
	readonly stem?: (typeof EIN_STEMS)[number];
	readonly case: GrammaticalCase;
	readonly genus: Genus;
}

function buildReverseArticleIndex(): Map<string, readonly ArticleReading[]> {
	const index = new Map<string, ArticleReading[]>();
	const add = (form: string, reading: ArticleReading) => {
		const key = form.toLocaleLowerCase("de");
		const existing = index.get(key);
		if (existing) {
			existing.push(reading);
		} else {
			index.set(key, [reading]);
		}
	};

	for (const grammaticalCase of CASES) {
		for (const genus of GENERA) {
			add(declineArticle(grammaticalCase, genus), {
				kind: "definite",
				case: grammaticalCase,
				genus,
			});
			for (const stem of EIN_STEMS) {
				add(einWortForm(stem, grammaticalCase, genus), {
					kind: "ein-wort",
					stem,
					case: grammaticalCase,
					genus,
				});
			}
		}
	}
	return index;
}

export const REVERSE_ARTICLE_INDEX = buildReverseArticleIndex();

/**
 * Every case a given article surface form can represent, independent of
 * genus. e.g. "die" => [NOM, AKK] (never DAT/GEN, for any genus), "den" =>
 * [AKK, DAT] (masculine accusative or plural dative). An unrecognized form
 * returns an empty array, meaning "unknown, do not check".
 */
export function articleCompatibleCases(
	surfaceForm: string,
): readonly GrammaticalCase[] {
	const readings =
		REVERSE_ARTICLE_INDEX.get(surfaceForm.toLocaleLowerCase("de")) ?? [];
	return [...new Set(readings.map((reading) => reading.case))];
}

/**
 * Every case a given article surface form can represent for a *known*
 * noun genus. This is the precise check: "der" is genus-independently
 * {NOM, DAT, GEN} (masculine NOM, feminine DAT/GEN, plural GEN), but for a
 * masculine noun specifically it can only mean NOM — the DAT/GEN readings
 * require a different genus. Falls back to the full genus-independent set
 * when genus is unknown, since narrowing further would just be a guess.
 */
export function articleCasesForGenus(
	surfaceForm: string,
	genus: Genus | null,
): readonly GrammaticalCase[] {
	const readings =
		REVERSE_ARTICLE_INDEX.get(surfaceForm.toLocaleLowerCase("de")) ?? [];
	if (!genus) {
		return [...new Set(readings.map((reading) => reading.case))];
	}
	return [
		...new Set(
			readings
				.filter((reading) => reading.genus === genus)
				.map((reading) => reading.case),
		),
	];
}

/** Every genus a given article surface form can represent, across all cases. */
export function articleCompatibleGenera(surfaceForm: string): readonly Genus[] {
	const readings =
		REVERSE_ARTICLE_INDEX.get(surfaceForm.toLocaleLowerCase("de")) ?? [];
	return [...new Set(readings.map((reading) => reading.genus))];
}

/**
 * Common A1/A2 nouns, keyed by their lowercased surface form (singular and
 * frequent plural forms both map directly to a genus, "p" for plurals,
 * rather than trying to derive plurals from a lemma).
 */
export const NOUN_GENUS: Record<string, Genus> = {
	mann: "m",
	männer: "p",
	frau: "f",
	frauen: "p",
	kind: "n",
	kinder: "p",
	buch: "n",
	bücher: "p",
	apfel: "m",
	äpfel: "p",
	auto: "n",
	autos: "p",
	tisch: "m",
	lampe: "f",
	fenster: "n",
	termin: "m",
	hund: "m",
	sonne: "f",
	lehrer: "m",
	lehrerin: "f",
	student: "m",
	studentin: "f",
	arzt: "m",
	ärztin: "f",
	ingenieur: "m",
	bruder: "m",
	brüder: "p",
	schwester: "f",
	freund: "m",
	freundin: "f",
	kaffee: "m",
	tee: "m",
	zeit: "f",
	hunger: "m",
	durst: "m",
	angst: "f",
	glück: "n",
	recht: "n",
	kurs: "m",
	schule: "f",
	wand: "f",
	bild: "n",
	park: "m",
	tasche: "f",
	mutter: "f",
	vater: "m",
	schlüssel: "m",
	platz: "m",
	mantel: "m",
	brief: "m",
	geschenk: "n",
	geschichte: "f",
	antwort: "f",
	frage: "f",
};

export const ACCUSATIVE_VERBS = [
	"sehen",
	"kaufen",
	"haben",
	"besuchen",
	"brauchen",
	"fragen",
	"lesen",
	"essen",
	"trinken",
	"machen",
	"kennen",
	"lieben",
];

export const DATIVE_VERBS = [
	"helfen",
	"danken",
	"gehören",
	"folgen",
	"gefallen",
	"antworten",
];

export const DITRANSITIVE_VERBS = [
	"geben",
	"schicken",
	"schenken",
	"zeigen",
	"erklären",
	"bringen",
];

export const SUBORDINATORS = [
	"weil",
	"dass",
	"ob",
	"wenn",
	"obwohl",
	"während",
	"damit",
	"bevor",
	"nachdem",
	"falls",
	"indem",
];

export const AKK_PREPOSITIONEN = ["für", "ohne", "durch", "gegen", "um"];
export const DAT_PREPOSITIONEN = [
	"mit",
	"bei",
	"von",
	"aus",
	"nach",
	"zu",
	"seit",
];
export const WECHSEL_PRAEPOSITIONEN = [
	"in",
	"an",
	"auf",
	"unter",
	"über",
	"vor",
	"hinter",
	"neben",
	"zwischen",
];

/** Fused preposition+article tokens ("im" = "in dem"). */
export const FUSED_PREPOSITIONS: Record<
	string,
	{ readonly preposition: string; readonly case: GrammaticalCase }
> = {
	im: { preposition: "in", case: "DAT" },
	ins: { preposition: "in", case: "AKK" },
	am: { preposition: "an", case: "DAT" },
	ans: { preposition: "an", case: "AKK" },
	zum: { preposition: "zu", case: "DAT" },
	zur: { preposition: "zu", case: "DAT" },
	beim: { preposition: "bei", case: "DAT" },
	vom: { preposition: "von", case: "DAT" },
};

/**
 * Verbs implying movement toward a place: Wechselpräposition -> AKK (wohin?).
 * Deliberately excludes verbs whose default reading is ambiguous even for
 * native speakers (laufen, springen can be either "moving within" [DAT] or
 * "moving into" [AKK] a place — the app's own Wechselpräpositionen material
 * uses "Ich laufe im Park" [DAT] as the canonical example) — including them
 * here would misfire on that correct sentence.
 */
export const MOTION_VERBS = [
	"gehen",
	"fahren",
	"fliegen",
	"kommen",
	"reisen",
	"stellen",
	"legen",
	"setzen",
];

/**
 * Verbs implying a static location: Wechselpräposition -> DAT (wo?).
 * Deliberately excludes verbs that take a fixed, non-spatial preposition
 * (e.g. "warten auf" = wait for, always AKK regardless of motion/position) —
 * that is a per-verb idiom (Rektion), not a Wechselpräposition choice, and
 * is out of scope for this heuristic.
 */
export const POSITION_VERBS = [
	"sein",
	"bleiben",
	"liegen",
	"stehen",
	"sitzen",
	"wohnen",
	"hängen",
];

export const MODAL_VERB_FORMS: Record<string, string> = {
	kann: "können",
	kannst: "können",
	können: "können",
	könnt: "können",
	muss: "müssen",
	musst: "müssen",
	müssen: "müssen",
	müsst: "müssen",
	darf: "dürfen",
	darfst: "dürfen",
	dürfen: "dürfen",
	dürft: "dürfen",
	soll: "sollen",
	sollst: "sollen",
	sollen: "sollen",
	sollt: "sollen",
	will: "wollen",
	willst: "wollen",
	wollen: "wollen",
	wollt: "wollen",
	möchte: "möchten",
	möchtest: "möchten",
	möchten: "möchten",
	möchtet: "möchten",
};

export const AUXILIARY_VERB_FORMS: Record<string, string> = {
	habe: "haben",
	hast: "haben",
	hat: "haben",
	haben: "haben",
	habt: "haben",
	bin: "sein",
	bist: "sein",
	ist: "sein",
	sind: "sein",
	seid: "sein",
};

/** Irregular participles that don't follow the ge-...-t pattern. */
export const IRREGULAR_PARTICIPLES = [
	"gegangen",
	"gefahren",
	"gekommen",
	"geflogen",
	"gelaufen",
	"gewesen",
	"geblieben",
	"geworden",
	"gesehen",
	"gegeben",
	"geschrieben",
	"gelesen",
	"genommen",
	"gesprochen",
	"getroffen",
	"geholfen",
];

const REGULAR_PARTICIPLE_PATTERN = /^ge[a-zäöüß]+(t|et)$/;

export function looksLikeParticiple(word: string): boolean {
	const lower = word.toLocaleLowerCase("de");
	return (
		IRREGULAR_PARTICIPLES.includes(lower) ||
		REGULAR_PARTICIPLE_PATTERN.test(lower)
	);
}

/** Conjugated forms mapped to their infinitive, for common irregular verbs. */
export const VERB_INFINITIVE_FORMS: Record<string, string> = {
	spreche: "sprechen",
	sprichst: "sprechen",
	spricht: "sprechen",
	sprechen: "sprechen",
	sprecht: "sprechen",
	sehe: "sehen",
	siehst: "sehen",
	sieht: "sehen",
	sehen: "sehen",
	seht: "sehen",
	lese: "lesen",
	liest: "lesen",
	lesen: "lesen",
	lest: "lesen",
	fahre: "fahren",
	fährst: "fahren",
	fährt: "fahren",
	fahren: "fahren",
	fahrt: "fahren",
	nehme: "nehmen",
	nimmst: "nehmen",
	nimmt: "nehmen",
	nehmen: "nehmen",
	nehmt: "nehmen",
	helfe: "helfen",
	hilfst: "helfen",
	hilft: "helfen",
	helfen: "helfen",
	helft: "helfen",
	gebe: "geben",
	gibst: "geben",
	gibt: "geben",
	geben: "geben",
	gebt: "geben",
	gehe: "gehen",
	gehst: "gehen",
	geht: "gehen",
	gehen: "gehen",
};

/**
 * Best-effort infinitive lookup: known irregular table first, then a plain
 * "strip the personal ending, add -en" guess for regular weak verbs. The
 * guess is not always correct (separable prefixes, stem changes) and callers
 * should treat it as a suggestion, not a guarantee.
 */
export function guessInfinitive(word: string): string {
	const lower = word.toLocaleLowerCase("de");
	if (VERB_INFINITIVE_FORMS[lower]) {
		return VERB_INFINITIVE_FORMS[lower];
	}
	if (lower.endsWith("en")) {
		return lower;
	}
	const stem = lower.replace(/(e|st|t)$/, "");
	return `${stem}en`;
}

/** Common infinitive → Partizip II pairs that don't follow the weak pattern. */
export const INFINITIVE_TO_PARTICIPLE: Record<string, string> = {
	gehen: "gegangen",
	fahren: "gefahren",
	kommen: "gekommen",
	sehen: "gesehen",
	geben: "gegeben",
	schreiben: "geschrieben",
	lesen: "gelesen",
	nehmen: "genommen",
	sprechen: "gesprochen",
	treffen: "getroffen",
	helfen: "geholfen",
	sein: "gewesen",
	bleiben: "geblieben",
	werden: "geworden",
	fliegen: "geflogen",
	laufen: "gelaufen",
};

/**
 * Best-effort Partizip II for a given infinitive: the irregular table above
 * first, then the regular weak-verb pattern (ge- + stem + -t, with an extra
 * -e- when the stem ends in d/t, e.g. arbeiten -> gearbeitet).
 */
export function guessParticiple(infinitive: string): string {
	const lower = infinitive.toLocaleLowerCase("de");
	if (INFINITIVE_TO_PARTICIPLE[lower]) {
		return INFINITIVE_TO_PARTICIPLE[lower];
	}
	const stem = lower.replace(/en$/, "");
	const needsExtraE = /[dt]$/.test(stem);
	return `ge${stem}${needsExtraE ? "et" : "t"}`;
}

export const ADVERBS = [
	"heute",
	"morgen",
	"gestern",
	"oft",
	"immer",
	"manchmal",
	"selten",
	"nie",
	"schnell",
	"langsam",
	"gern",
	"hier",
	"dort",
	"dahin",
	"jetzt",
	"später",
	"früh",
	"spät",
];

export const KONJUNKTIONEN = ["und", "oder", "aber", "denn", "sondern"];
