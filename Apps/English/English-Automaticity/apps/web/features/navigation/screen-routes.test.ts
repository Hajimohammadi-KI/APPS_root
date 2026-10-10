import { describe, expect, test } from "bun:test";

import {
	canonicalScreenId,
	isAppShellPath,
	legacyScreenRedirect,
	screenHref,
	screenIds,
	screenPaths,
} from "./screen-routes";

describe("English screen routes", () => {
	test("every screen has one canonical path and home is the root", () => {
		for (const id of screenIds) {
			expect(screenPaths[id].startsWith("/")).toBe(true);
			expect(screenPaths[id]).not.toContain("?");
		}
		expect(screenPaths.home).toBe("/");
		expect(new Set(Object.values(screenPaths)).size).toBe(screenIds.length);
	});

	test("the old automaticity name still means the daily screen", () => {
		expect(canonicalScreenId("automaticity")).toBe("daily");
		expect(canonicalScreenId("errors")).toBe("errors");
		expect(canonicalScreenId("unknown")).toBeNull();
		expect(canonicalScreenId(null)).toBeNull();
	});

	test("screen links carry parameters and never re-add the screen query", () => {
		expect(screenHref("studio", { unit: "B1-04", screen: "errors" })).toBe(
			"/studio?unit=B1-04",
		);
		expect(screenHref("library", { filter: null })).toBe("/library");
		expect(screenHref("home")).toBe("/");
	});

	test("legacy ?screen= links land on the screen's own path", () => {
		expect(legacyScreenRedirect({ screen: "progress" })).toBe("/progress");
		expect(legacyScreenRedirect({ screen: "automaticity", activity: "5" })).toBe(
			"/daily?activity=5",
		);
		expect(legacyScreenRedirect({ screen: ["errors", "library"] })).toBe(
			"/errors",
		);
	});

	test("unknown or home screen queries fall back to the root without the query", () => {
		expect(legacyScreenRedirect({ screen: "nowhere", lang: "fa" })).toBe(
			"/?lang=fa",
		);
		expect(legacyScreenRedirect({ screen: "home" })).toBe("/");
	});

	test("shell screens are told apart from standalone pages", () => {
		for (const path of ["/", "/progress", "/errors", "/library"]) {
			expect(isAppShellPath(path)).toBe(true);
		}
		for (const path of ["/settings", "/studio", "/daily", "/grammar", null]) {
			expect(isAppShellPath(path)).toBe(false);
		}
	});

	test("ordinary home visits are not redirected", () => {
		expect(legacyScreenRedirect({})).toBeNull();
		expect(legacyScreenRedirect({ lang: "fa" })).toBeNull();
	});
});
