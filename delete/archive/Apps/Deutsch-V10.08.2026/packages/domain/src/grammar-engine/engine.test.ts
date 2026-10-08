import { describe, expect, it } from "bun:test";

import { checkSentence } from "./engine";

function ruleIds(text: string): readonly string[] {
	return checkSentence(text).map((error) => error.rule);
}

describe("grammar engine: correct sentences produce no errors", () => {
	const correct = [
		"Ich sehe den Mann.",
		"Ich helfe dem Mann.",
		"Ich gebe dem Mann das Buch.",
		"Ich warte für den Mann.",
		"Ich fahre mit dem Mann.",
		"Ich gehe in die Schule.",
		"Ich bin in der Schule.",
		"Ich gehe morgen nach Hause.",
		"Weil ich nach Hause gehe.",
		"Ich kann Deutsch sprechen.",
		"Ich habe gearbeitet.",
		"Ich habe gemacht.",
		"Ich sehe das Buch.",
		"Die Frau ist müde.",
	];

	for (const sentence of correct) {
		it(`accepts "${sentence}"`, () => {
			expect(checkSentence(sentence)).toEqual([]);
		});
	}
});

describe("Rule 1: AKKUSATIV_OBJEKT", () => {
	it("flags a nominative object after an accusative verb", () => {
		const errors = checkSentence("Ich sehe der Mann.");
		expect(ruleIds("Ich sehe der Mann.")).toContain("AKKUSATIV_OBJEKT");
		expect(errors[0]?.correctedSentence).toBe("Ich sehe den Mann.");
	});
});

describe("Rule 2: DATIV_OBJEKT", () => {
	it("flags a nominative object after a dative verb", () => {
		const errors = checkSentence("Ich helfe der Mann.");
		expect(ruleIds("Ich helfe der Mann.")).toContain("DATIV_OBJEKT");
		expect(errors[0]?.correctedSentence).toBe("Ich helfe dem Mann.");
	});
});

describe("Rule 3: DATIV_AKKUSATIV", () => {
	it("flags a nominative receiver on a ditransitive verb", () => {
		const errors = checkSentence("Ich gebe der Mann das Buch.");
		expect(ruleIds("Ich gebe der Mann das Buch.")).toContain("DATIV_AKKUSATIV");
		expect(errors[0]?.correctedSentence).toBe("Ich gebe dem Mann das Buch.");
	});
});

describe("Rule 4: PRAEPOSITIONEN", () => {
	it("flags a dative object after an accusative-only preposition", () => {
		const errors = checkSentence("Ich warte für dem Mann.");
		expect(ruleIds("Ich warte für dem Mann.")).toContain("PRAEPOSITIONEN");
		expect(errors[0]?.correctedSentence).toBe("Ich warte für den Mann.");
	});

	it("flags an accusative object after a dative-only preposition", () => {
		const errors = checkSentence("Ich fahre mit den Mann.");
		expect(ruleIds("Ich fahre mit den Mann.")).toContain("PRAEPOSITIONEN");
		expect(errors[0]?.correctedSentence).toBe("Ich fahre mit dem Mann.");
	});
});

describe("Rule 5: WECHSELPRAEPOSITIONEN", () => {
	it("requires accusative for motion (wohin?)", () => {
		const errors = checkSentence("Ich gehe in der Schule.");
		expect(ruleIds("Ich gehe in der Schule.")).toContain(
			"WECHSELPRAEPOSITIONEN",
		);
		expect(errors[0]?.correctedSentence).toBe("Ich gehe in die Schule.");
	});

	it("requires dative for a static location (wo?)", () => {
		const errors = checkSentence("Ich bin in die Schule.");
		expect(ruleIds("Ich bin in die Schule.")).toContain(
			"WECHSELPRAEPOSITIONEN",
		);
		expect(errors[0]?.correctedSentence).toBe("Ich bin in der Schule.");
	});
});

describe("Rule 6: VERB_POSITION", () => {
	it("flags a finite verb that isn't the second constituent", () => {
		const errors = checkSentence("Ich morgen gehe nach Hause.");
		expect(ruleIds("Ich morgen gehe nach Hause.")).toContain("VERB_POSITION");
		expect(errors[0]?.correctedSentence).toBe("Ich gehe morgen nach Hause.");
	});
});

describe("Rule 7: NEBENSATZ_VERBPOSITION", () => {
	it("flags a subordinate clause whose verb isn't clause-final", () => {
		const errors = checkSentence("weil ich gehe nach Hause.");
		expect(ruleIds("weil ich gehe nach Hause.")).toContain(
			"NEBENSATZ_VERBPOSITION",
		);
		expect(errors[0]?.correctedSentence).toBe("Weil ich nach Hause gehe.");
	});
});

describe("Rule 8: MODALVERB_INFINITIV", () => {
	it("flags a conjugated verb where the modal expects a bare infinitive", () => {
		const errors = checkSentence("Ich kann spreche Deutsch.");
		expect(ruleIds("Ich kann spreche Deutsch.")).toContain(
			"MODALVERB_INFINITIV",
		);
		expect(errors[0]?.expected).toBe("sprechen");
	});
});

describe("Rule 9: PERFEKT", () => {
	it("flags a bare infinitive where haben/sein expects Partizip II", () => {
		const errors = checkSentence("Ich habe arbeiten.");
		expect(ruleIds("Ich habe arbeiten.")).toContain("PERFEKT");
		expect(errors[0]?.correctedSentence).toBe("Ich habe gearbeitet.");
	});
});

describe("Rule 10: ARTIKEL_DEKLINATION", () => {
	it("flags an article whose genus doesn't match the noun", () => {
		const errors = checkSentence("Ich sehe der Buch.");
		expect(ruleIds("Ich sehe der Buch.")).toContain("ARTIKEL_DEKLINATION");
		expect(errors[0]?.correctedSentence).toBe("Ich sehe das Buch.");
	});
});
