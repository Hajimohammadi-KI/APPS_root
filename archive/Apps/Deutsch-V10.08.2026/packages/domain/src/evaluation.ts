import { checkSentence } from "./grammar-engine/engine";
import type { ErrorClass } from "./learner-state";

export type EvaluationKind =
	| "conversation"
	| "free"
	| "recall"
	| "review"
	| "sentences"
	| "why";

export type EvaluationNextAction =
	| "repeat"
	| "repair"
	| "transfer"
	| "schedule_review";

export interface GrammarTarget {
	readonly title: string;
	readonly rule: string;
	readonly examples: readonly string[];
}

export interface EvaluationIssue {
	readonly type: string;
	readonly message: string;
	readonly context?: string;
	readonly suggestion?: string;
	readonly errorClass: ErrorClass;
	readonly severity: "minor" | "major" | "critical";
}

export interface LanguageToolMatch {
	readonly offset: number;
	readonly length: number;
	readonly message?: string;
	readonly context?: {
		readonly text?: string;
	};
	readonly replacements?: readonly {
		readonly value?: string;
	}[];
	readonly rule?: {
		readonly issueType?: string;
	};
}

export interface LanguageToolResult {
	readonly matches: readonly LanguageToolMatch[];
	readonly online: boolean;
	readonly networkError?: string;
}

export interface EvaluationReport {
	readonly original: string;
	readonly corrected: string;
	readonly changed: boolean;
	readonly matches: readonly LanguageToolMatch[];
	readonly online: boolean;
	readonly networkError?: string;
	readonly issues: readonly EvaluationIssue[];
	/** Practice may continue, including after deterministic offline checks. */
	readonly practiceReady: boolean;
	/** Only verified reports may change mastery and CEFR evidence. */
	readonly verified: boolean;
	readonly ok: boolean;
	readonly targetHit: boolean;
	readonly relevant: boolean;
	readonly accuracyScore: number;
	readonly nextAction: EvaluationNextAction;
}

const TARGET_PATTERNS: ReadonlyArray<readonly [RegExp, RegExp]> = [
	[
		/perfekt/,
		/\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b[\s\S]*\b(ge\w+|[\wäöüß]+iert)\b/i,
	],
	[/präteritum/, /\b(war|warst|waren|wart|hatte|ging|kam|sagte|machte)\b/i],
	[/futur/, /\b(werde|wirst|wird|werden|werdet)\b[\s\S]*\b\w+en\b/i],
	[
		/passiv/,
		/\b(werde|wirst|wird|werden|werdet|wurde|wurden|worden)\b[\s\S]*\b(ge\w+|[\wäöüß]+iert)\b/i,
	],
	[
		/konjunktiv|höflich|irreale|indirekte rede/,
		/\b(würde|wäre|hätte|könnte|müsste|sollte|dürfte|möge|sei|seien)\b/i,
	],
	[
		/nebensatz|weil|dass|obwohl|konnektor/,
		/\b(weil|dass|obwohl|wenn|während|damit|bevor|nachdem|falls|indem)\b/i,
	],
	[
		/relativ/,
		/\b(der|die|das|den|dem|deren|dessen|welche|welcher|welches)\b[\s\S]*,/i,
	],
	[
		/trennbare/,
		/\b(stehe|steht|stehen|fange|fängt|fangen|komme|kommt|kommen|mache|macht|machen)\b[\s\S]*\b(auf|an|mit|ein|aus)\b/i,
	],
	[
		/modalverb/,
		/\b(kann|kannst|können|muss|musst|müssen|soll|sollen|darf|dürfen|will|wollen|möchte|möchten)\b/i,
	],
	[/akkusativ/, /\b(den|einen|keinen|meinen|deinen|diesen)\b/i],
	[/dativ/, /\b(dem|einem|keinem|meinem|deinem|diesem|der)\b/i],
	[/genitiv/, /\b(des|eines|meines|deines|dessen|deren)\b/i],
	[/komparativ|vergleich/, /\b(als|wie|besser|mehr|weniger|größer|kleiner)\b/i],
	[/superlativ/, /\b(am \w+sten|der beste|die beste|das beste)\b/i],
	[/negation/, /\b(nicht|kein|keine|keinen|keinem)\b/i],
	[
		/frage/,
		/\?|^(wer|was|wann|wo|wie|warum|welch|ist|sind|hast|hat|kann|können)\b/i,
	],
	[
		/imperativ/,
		/^(bitte\s+)?(geh|gehen sie|komm|kommen sie|mach|machen sie|sei|seien sie|nimm|nehmen sie)\b/i,
	],
];

const OFFLINE_CORRECTIONS: ReadonlyArray<readonly [RegExp, string]> = [
	[/\bich habe gegangen\b/gi, "Ich bin gegangen"],
	[/\bmit der Mann\b/gi, "mit dem Mann"],
	[/\bich würde gegangen\b/gi, "ich würde gehen"],
	[/\bmehr besser\b/gi, "besser"],
];

export function classifyError(
	...fragments: readonly (string | undefined)[]
): ErrorClass {
	const text = fragments.filter(Boolean).join(" ").toLocaleLowerCase("de");

	if (
		/\b(hilfsverb|auxiliary|haben oder sein|mit „sein“|mit sein)\b/.test(text)
	) {
		return "auxiliary";
	}
	if (
		/\b(wortstellung|wortfolge|satzende|verbposition|verb position|nebensatz|verbzweit|v2)\b/.test(
			text,
		)
	) {
		return "word_order";
	}
	if (
		/\b(kasus|akkusativ|dativ|genitiv|nominativ|case|deklination)\b/.test(text)
	) {
		return "case";
	}
	if (/\b(artikel|article|genus)\b/.test(text)) {
		return "article";
	}
	if (/\b(endung|ending|adjektivdeklination)\b/.test(text)) {
		return "ending";
	}
	if (/\b(tempus|zeitform|tense|präteritum|perfekt|futur)\b/.test(text)) {
		return "tense";
	}
	if (/\b(kongruenz|agreement|übereinstimmung)\b/.test(text)) {
		return "agreement";
	}
	if (/\b(rechtschreibung|spelling|misspelling|tippfehler)\b/.test(text)) {
		return "spelling";
	}
	if (/\b(zielgrammatik|verlangte struktur)\b/.test(text)) {
		return "target_grammar";
	}
	return "other";
}

function issueSeverity(errorClass: ErrorClass): EvaluationIssue["severity"] {
	if (
		errorClass === "word_order" ||
		errorClass === "case" ||
		errorClass === "auxiliary" ||
		errorClass === "target_grammar"
	) {
		return "critical";
	}
	if (errorClass === "spelling" || errorClass === "other") {
		return "minor";
	}
	return "major";
}

function createIssue(
	issue: Omit<EvaluationIssue, "errorClass" | "severity"> & {
		readonly errorClass?: ErrorClass;
	},
): EvaluationIssue {
	const errorClass =
		issue.errorClass ??
		classifyError(issue.type, issue.message, issue.context, issue.suggestion);
	return {
		...issue,
		errorClass,
		severity: issueSeverity(errorClass),
	};
}

export function applyLanguageToolMatches(
	text: string,
	matches: readonly LanguageToolMatch[],
): string {
	let corrected = text;
	let offset = 0;

	for (const match of matches) {
		const replacement = match.replacements?.[0]?.value;
		if (!replacement) {
			continue;
		}
		const position = match.offset + offset;
		corrected =
			corrected.slice(0, position) +
			replacement +
			corrected.slice(position + match.length);
		offset += replacement.length - match.length;
	}

	return corrected;
}

export function offlineCorrect(text: string): string {
	return OFFLINE_CORRECTIONS.reduce(
		(corrected, [pattern, replacement]) =>
			corrected.replace(pattern, replacement),
		text,
	);
}

export function targetEvidencePresent(
	text: string,
	grammar: GrammarTarget,
): boolean {
	const title = grammar.title.toLocaleLowerCase("de");
	const specific = TARGET_PATTERNS.find(([name]) => name.test(title));
	if (specific) {
		return specific[1].test(text);
	}

	const stopWords = new Set([
		"diese",
		"dieser",
		"dieses",
		"einen",
		"einer",
		"werden",
		"verwendet",
		"korrekt",
		"satz",
		"sätze",
		"struktur",
		"grammatik",
		"deutsch",
	]);
	const clues = [grammar.rule, ...grammar.examples]
		.join(" ")
		.toLocaleLowerCase("de")
		.match(/\b[a-zäöüß]{4,}\b/g)
		?.filter((word) => !stopWords.has(word));
	const lowerText = text.toLocaleLowerCase("de");

	return clues?.some((word) => lowerText.includes(word)) ?? false;
}

export function getTaskIssues(
	text: string,
	grammar: GrammarTarget,
	kind: EvaluationKind,
	taskPrompt?: string,
): readonly EvaluationIssue[] {
	const issues: EvaluationIssue[] = [];
	const sentences = text
		.split(/[.!?]+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);

	if (
		/perfekt/.test(grammar.title.toLocaleLowerCase("de")) &&
		/\b(gefahren|gegangen|gekommen|geflogen|gelaufen|gereist|aufgestanden|eingeschlafen|geworden|geblieben)\b/i.test(
			text,
		) &&
		/\b(habe|hast|hat|haben|habt)\b/i.test(text)
	) {
		issues.push(
			createIssue({
				type: "Zielgrammatik",
				message:
					"Bei einer Orts- oder Zustandsänderung wird das Perfekt dieser Verben mit „sein“ gebildet.",
				suggestion: text
					.replace(/\bich habe\b/i, "Ich bin")
					.replace(/\bdu hast\b/i, "Du bist")
					.replace(/\ber hat\b/i, "Er ist")
					.replace(/\bsie hat\b/i, "Sie ist")
					.replace(/\bwir haben\b/i, "Wir sind")
					.replace(/\bihr habt\b/i, "Ihr seid")
					.replace(/\bsie haben\b/i, "Sie sind"),
				errorClass: "auxiliary",
			}),
		);
	}

	if (
		kind === "sentences" &&
		new Set(sentences.map((sentence) => sentence.toLocaleLowerCase("de")))
			.size < sentences.length
	) {
		issues.push(
			createIssue({
				type: "Aufgabe",
				message:
					"Die Sätze sind identisch. Schreibe drei unterschiedliche Sätze.",
			}),
		);
	}

	if (
		(kind === "free" || kind === "sentences" || kind === "conversation") &&
		!targetEvidencePresent(text, grammar)
	) {
		issues.push(
			createIssue({
				type: "Zielgrammatik",
				message: `Die verlangte Struktur „${grammar.title}“ ist nicht eindeutig nachweisbar.`,
				errorClass: "target_grammar",
			}),
		);
	}

	if (kind === "recall") {
		const keywords =
			grammar.rule.toLocaleLowerCase("de").match(/\b[a-zäöüß]{5,}\b/g) ?? [];
		const lowerText = text.toLocaleLowerCase("de");
		if (!keywords.some((keyword) => lowerText.includes(keyword))) {
			issues.push(
				createIssue({
					type: "Inhalt",
					message:
						"Deine Erklärung nennt keinen zentralen Begriff aus der Regel.",
				}),
			);
		}
	}

	if (
		kind === "why" &&
		!/\b(weil|deshalb|denn|darum|verb|hilfsverb|partizip|kasus|endung|satzende|korrigiert|geändert)\b/i.test(
			text,
		)
	) {
		issues.push(
			createIssue({
				type: "Inhalt",
				message:
					"Nenne die geänderte Form und den grammatischen Grund der Korrektur.",
			}),
		);
	}

	if (!responseIsRelevant(text, taskPrompt, kind, grammar)) {
		issues.push(
			createIssue({
				type: "Aufgabenbezug",
				message:
					"Die Antwort ist zu kurz, zu wiederholend oder nicht klar mit der Aufgabe verbunden.",
			}),
		);
	}

	return issues;
}

const RELEVANCE_STOP_WORDS = new Set([
	"aber",
	"antwort",
	"aufgabe",
	"aus",
	"bei",
	"das",
	"dass",
	"dem",
	"den",
	"der",
	"des",
	"die",
	"dies",
	"eine",
	"einem",
	"einen",
	"einer",
	"erkläre",
	"für",
	"grammatik",
	"ist",
	"mit",
	"oder",
	"satz",
	"schreibe",
	"struktur",
	"und",
	"verwende",
	"von",
	"warum",
	"was",
	"wie",
	"wird",
	"zum",
	"zur",
]);

function contentTokens(text: string): readonly string[] {
	return (
		text
			.toLocaleLowerCase("de")
			.match(/[a-zäöüß][a-zäöüß'-]{2,}/g)
			?.filter((token) => !RELEVANCE_STOP_WORDS.has(token)) ?? []
	);
}

export function responseIsRelevant(
	text: string,
	taskPrompt: string | undefined,
	kind: EvaluationKind,
	grammar: GrammarTarget,
): boolean {
	const responseTokens = contentTokens(text);
	const uniqueResponse = new Set(responseTokens);
	if (uniqueResponse.size < 2) return false;
	if (
		responseTokens.length >= 6 &&
		uniqueResponse.size / responseTokens.length < 0.4
	) {
		return false;
	}
	if (
		(kind === "free" || kind === "sentences" || kind === "conversation") &&
		!targetEvidencePresent(text, grammar)
	) {
		return false;
	}
	// Kurze gelenkte Antworten müssen nicht dieselben Inhaltswörter wie die
	// Aufgabe wiederholen. Wenn die Zielform vorhanden ist und mindestens zwei
	// sinntragende Wörter vorkommen, darf die Übung fortgesetzt werden.
	if (responseTokens.length <= 5) return true;
	const promptTokens = new Set(contentTokens(taskPrompt ?? ""));
	if (promptTokens.size === 0) return true;
	return (
		[...uniqueResponse].some((token) => promptTokens.has(token)) ||
		uniqueResponse.size >= 7
	);
}

const RULE_ERROR_CLASSES: Readonly<Record<string, ErrorClass>> = {
	AKKUSATIV_OBJEKT: "case",
	DATIV_OBJEKT: "case",
	DATIV_AKKUSATIV: "case",
	PRAEPOSITIONEN: "case",
	WECHSELPRAEPOSITIONEN: "case",
	ARTIKEL_DEKLINATION: "article",
	VERB_POSITION: "word_order",
	NEBENSATZ_VERBPOSITION: "word_order",
	MODALVERB_INFINITIV: "other",
	PERFEKT: "tense",
};

/**
 * Runs the deterministic rule engine (see ./grammar-engine) over the
 * learner's text and turns any hit into an A1-appropriate issue — e.g.
 * "Das Verb „sehen“ verlangt ein Akkusativobjekt." instead of LanguageTool's
 * generic rule message. This runs *in addition to* the LanguageTool matches
 * below, not instead of them: the two are not de-duplicated by span, so a
 * mistake both catch surfaces twice (once pedagogical, once generic) rather
 * than being silently merged. Extend RULE_ERROR_CLASSES when rules.ts gains
 * a new rule id.
 */
export function ruleEngineIssues(text: string): readonly EvaluationIssue[] {
	const sentences = text
		.split(/(?<=[.!?])\s+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);

	return sentences.flatMap((sentence) =>
		checkSentence(sentence).map((detected) =>
			createIssue({
				type: detected.name,
				message: detected.explanation || detected.message,
				...(detected.correctedSentence &&
				detected.correctedSentence !== sentence
					? { suggestion: detected.correctedSentence }
					: {}),
				errorClass: RULE_ERROR_CLASSES[detected.rule] ?? "other",
			}),
		),
	);
}

export function evaluateAnswer(
	text: string,
	grammar: GrammarTarget,
	kind: EvaluationKind,
	languageTool: LanguageToolResult,
	taskPrompt?: string,
): EvaluationReport {
	const corrected = languageTool.online
		? applyLanguageToolMatches(text, languageTool.matches)
		: offlineCorrect(text);
	const languageIssues: EvaluationIssue[] = languageTool.matches.map(
		(match) => {
			const suggestion = match.replacements?.[0]?.value;
			return createIssue({
				type:
					match.rule?.issueType === "misspelling"
						? "Rechtschreibung"
						: "Grammatik/Stil",
				message: match.message ?? "Diese Stelle sollte korrigiert werden.",
				...(match.context?.text ? { context: match.context.text } : {}),
				...(suggestion ? { suggestion } : {}),
				...(match.rule?.issueType === "misspelling"
					? { errorClass: "spelling" as const }
					: {}),
			});
		},
	);
	const offlineIssue =
		!languageTool.online && corrected !== text
			? [
					createIssue({
						type: "Offline-Grammatik",
						message:
							"Die lokale Prüfung hat eine bekannte Form korrigiert. Repariere sie vor dem Fortfahren.",
						suggestion: corrected,
					}),
				]
			: [];
	const taskIssues = getTaskIssues(text, grammar, kind, taskPrompt);
	const engineIssues = ruleEngineIssues(text);
	const issues = [
		...languageIssues,
		...offlineIssue,
		...taskIssues,
		...engineIssues,
	];
	const targetCorrection = taskIssues.find(
		(issue) => issue.type === "Zielgrammatik" && issue.suggestion,
	)?.suggestion;
	const finalCorrection = targetCorrection ?? corrected;
	const targetHit = !taskIssues.some(
		(issue) =>
			issue.errorClass === "target_grammar" || issue.type === "Zielgrammatik",
	);
	const relevant = !taskIssues.some((issue) => issue.type === "Aufgabenbezug");
	const accuracyScore = Math.max(
		0,
		100 -
			issues.reduce(
				(penalty, issue) =>
					penalty +
					(issue.severity === "critical"
						? 30
						: issue.severity === "major"
							? 18
							: 8),
				0,
			),
	);
	const practiceReady = issues.length === 0;
	const verified = languageTool.online;
	const ok = verified && practiceReady;

	return {
		original: text,
		corrected: finalCorrection,
		changed: finalCorrection !== text,
		matches: languageTool.matches,
		online: languageTool.online,
		...(languageTool.networkError
			? { networkError: languageTool.networkError }
			: {}),
		issues,
		practiceReady,
		verified,
		ok,
		targetHit,
		relevant,
		accuracyScore,
		nextAction:
			issues.length > 0
				? "repair"
				: kind === "review"
					? "schedule_review"
					: "transfer",
	};
}
