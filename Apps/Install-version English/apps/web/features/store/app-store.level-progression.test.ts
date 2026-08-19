import { describe, expect, it } from "bun:test";
import { grammarUnits } from "@grammar/content";

import {
	advanceDailyGrammar,
	calculateAutomaticityEvidenceScore,
	CEFR_ORDER,
	DEFAULT_STATE,
	pickNextGrammarUnit,
	recalculateMastery,
	type AppState,
	type Attempt,
	type TopicMastery,
} from "./app-store";

function automaticMastery(title: string): TopicMastery {
	return {
		grammarTitle: title,
		status: "automatic",
		recognitionScore: 100,
		writingScore: 100,
		speakingScore: 100,
		repairScore: 100,
		transferScore: 100,
		automaticityScore: 100,
		successfulReviews: 5,
		activeErrorCount: 0,
		lastSuccessAt: new Date().toISOString(),
		nextReviewAt: null,
		medianWritingLatencyMs: 1000,
		practiceStage: 3,
	};
}

function baseState(level: AppState["learner"]["selfDeclaredLevel"]): AppState {
	return {
		...DEFAULT_STATE,
		learner: { ...DEFAULT_STATE.learner, selfDeclaredLevel: level, verifiedLevel: null },
	};
}

describe("daily grammar auto-progression", () => {
	it("does nothing for a topic that is still in progress", () => {
		const state = baseState("A1");
		const [firstA1] = grammarUnits.filter((unit) => unit.level === "A1");
		state.todayGrammar = { title: firstA1!.title, level: "A1", date: "2026-01-01" };
		state.mastery[firstA1!.title] = { ...automaticMastery(firstA1!.title), status: "learning" };

		advanceDailyGrammar(state);

		expect(state.todayGrammar?.title).toBe(firstA1!.title);
		expect(state.learner.selfDeclaredLevel).toBe("A1");
	});

	it("moves to the next un-mastered unit once the current one is automatic", () => {
		const state = baseState("A1");
		const a1Units = grammarUnits.filter((unit) => unit.level === "A1");
		expect(a1Units.length).toBeGreaterThan(1);
		state.todayGrammar = { title: a1Units[0]!.title, level: "A1", date: "2026-01-01" };
		state.mastery[a1Units[0]!.title] = automaticMastery(a1Units[0]!.title);

		advanceDailyGrammar(state);

		expect(state.todayGrammar?.title).not.toBe(a1Units[0]!.title);
		expect(state.todayGrammar?.level).toBe("A1");
	});

	it("advances the self-declared level once every unit in it is verified automatic", () => {
		const state = baseState("A1");
		const a1Units = grammarUnits.filter((unit) => unit.level === "A1");
		for (const unit of a1Units) {
			state.mastery[unit.title] = automaticMastery(unit.title);
		}
		const last = a1Units[a1Units.length - 1]!;
		state.todayGrammar = { title: last.title, level: "A1", date: "2026-01-01" };
		// Mirrors what refreshVerifiedLevel would have just computed: every A1
		// unit automatic, so A1 is fully verified.
		state.learner.verifiedLevel = "A1";

		advanceDailyGrammar(state);

		const nextLevel = CEFR_ORDER[CEFR_ORDER.indexOf("A1") + 1]!;
		expect(state.learner.selfDeclaredLevel).toBe(nextLevel);
		expect(state.todayGrammar?.level).toBe(nextLevel);
	});

	it("pickNextGrammarUnit returns null once the whole catalogue is mastered", () => {
		const state = baseState("C2");
		for (const unit of grammarUnits) {
			state.mastery[unit.title] = automaticMastery(unit.title);
		}
		expect(pickNextGrammarUnit(state)).toBeNull();
	});
});

function attempt(
	mode: Attempt["mode"],
	overrides: Partial<Attempt> = {},
): Attempt {
	return {
		id: `attempt-${mode}-${Math.random()}`,
		grammarTitle: "Present simple",
		mode,
		inputText: "answer",
		correctedText: "answer",
		targetHit: true,
		accuracyScore: 100,
		fluencyScore: mode === "speaking" ? 100 : 0,
		latencyMs: mode === "writing" || mode === "transfer" ? 30_000 : 4_000,
		passed: true,
		verified: true,
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

describe("independent automaticity evidence", () => {
	it("scores independence, consistency, speed, delayed transfer, and retention instead of averaging mastery skills", () => {
		const attempts = ["recognition", "writing", "speaking", "transfer"].flatMap(
			(mode) =>
				Array.from({ length: 3 }, (_, index) =>
					attempt(mode as Attempt["mode"], {
						...(mode === "transfer" && index === 2
							? { fromDueReview: true }
							: {}),
					}),
				),
		);

		expect(
			calculateAutomaticityEvidenceScore({
				attempts,
				successfulReviews: 2,
				activeErrorCount: 0,
				practiceStage: 3,
				hasLapsedRetention: false,
			}),
		).toBe(100);
	});

	it("keeps a trustworthy wrong answer and lets it lower mastery", () => {
		const state = baseState("A1");
		state.attempts = [
			attempt("recognition", {
				targetHit: false,
				passed: false,
				accuracyScore: 100,
			}),
		];

		recalculateMastery(state, "Present simple");

		expect(state.mastery["Present simple"]?.recognitionScore).toBe(59);
		expect(state.mastery["Present simple"]?.status).toBe("learning");
	});
});
