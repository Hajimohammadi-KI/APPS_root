import { describe, expect, test } from "bun:test";

import { DEFAULT_STATE, normalizeAppState, profilePrivacy } from "./app-store";

describe("audio storage consent", () => {
	test("new learners do not store recordings until they opt in", () => {
		expect(DEFAULT_STATE.settings.saveAudio).toBe(false);
		expect(normalizeAppState({}).settings.saveAudio).toBe(false);
	});

	test("online checks are off and American spelling is the default variant", () => {
		expect(DEFAULT_STATE.settings.onlineFeedback).toBe(false);
		expect(DEFAULT_STATE.settings.englishVariant).toBe("en-US");
		const british = normalizeAppState({
			...DEFAULT_STATE,
			settings: { ...DEFAULT_STATE.settings, englishVariant: "en-GB" },
		});
		expect(british.settings.englishVariant).toBe("en-GB");
		const unknown = normalizeAppState({
			...DEFAULT_STATE,
			settings: { ...DEFAULT_STATE.settings, englishVariant: "en-ZZ" },
		});
		expect(unknown.settings.englishVariant).toBe("en-US");
	});

	test("the online-check consent written to the shared profile is the settings toggle", () => {
		const state = normalizeAppState({
			...DEFAULT_STATE,
			settings: { ...DEFAULT_STATE.settings, onlineFeedback: true },
		});
		expect(profilePrivacy(state).allowOnlineAI).toBe(true);
		expect(profilePrivacy(DEFAULT_STATE).allowOnlineAI).toBe(false);
	});

	test("an explicit stored choice is preserved", () => {
		const state = normalizeAppState({
			...DEFAULT_STATE,
			settings: { ...DEFAULT_STATE.settings, saveAudio: true },
		});
		expect(state.settings.saveAudio).toBe(true);
	});
});
