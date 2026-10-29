import { describe, expect, test } from "bun:test";

import { DEFAULT_STATE, normalizeAppState } from "./app-store";

describe("audio storage consent", () => {
	test("new learners do not store recordings until they opt in", () => {
		expect(DEFAULT_STATE.settings.saveAudio).toBe(false);
		expect(normalizeAppState({}).settings.saveAudio).toBe(false);
	});

	test("an explicit stored choice is preserved", () => {
		const state = normalizeAppState({
			...DEFAULT_STATE,
			settings: { ...DEFAULT_STATE.settings, saveAudio: true },
		});
		expect(state.settings.saveAudio).toBe(true);
	});
});
