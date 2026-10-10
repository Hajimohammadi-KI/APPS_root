import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

const request = (path: string) =>
	new NextRequest(new URL(path, "https://english.example"));

describe("legacy screen link proxy", () => {
	test("only runs on the root path", () => {
		expect(config.matcher).toBe("/");
	});

	test("redirects old ?screen= links to the screen's own path", () => {
		const response = proxy(request("/?screen=errors"));
		expect(response.status).toBe(308);
		expect(response.headers.get("location")).toBe(
			"https://english.example/errors",
		);
	});

	test("keeps the other parameters and the old daily alias", () => {
		const response = proxy(request("/?screen=automaticity&activity=5"));
		expect(response.headers.get("location")).toBe(
			"https://english.example/daily?activity=5",
		);
	});

	test("drops an unknown screen name without looping", () => {
		const response = proxy(request("/?screen=nowhere&lang=fa"));
		expect(response.status).toBe(308);
		expect(response.headers.get("location")).toBe(
			"https://english.example/?lang=fa",
		);
		expect(proxy(request("/?lang=fa")).headers.get("location")).toBeNull();
	});

	test("ordinary home visits pass through", () => {
		expect(proxy(request("/")).headers.get("location")).toBeNull();
	});
});
