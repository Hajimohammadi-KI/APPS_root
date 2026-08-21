import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import {
	PAGE_CATALOG,
	buildPageAnalyticsRows,
	findUnknownPageRoutes,
	parsePageRouteAttempts,
} from "./page-analytics";

function collectSurfaceFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(directory, entry.name);
		return entry.isDirectory() ? collectSurfaceFiles(fullPath) : [fullPath];
	});
}

function sourceRoutes(): string[] {
	const appRoot = join(import.meta.dir, "..", "app");
	return collectSurfaceFiles(appRoot)
		.filter((file) => /(?:page\.tsx|route\.ts)$/u.test(file))
		.map((file) => relative(appRoot, file).replaceAll("\\", "/"))
		.filter((file) => !file.startsWith("api/"))
		.map((file) => {
			const folder = dirname(file).replaceAll("\\", "/");
			return folder === "." ? "/" : `/${folder}`;
		})
		.sort();
}

describe("page analytics", () => {
	test("keeps the source route catalogue complete", () => {
		const catalogRoutes: string[] = PAGE_CATALOG.map((page) => page.route);
		expect(catalogRoutes.sort()).toEqual(sourceRoutes());
	});

	test("separates an external entry route from the rendered destination", () => {
		const dataset = parsePageRouteAttempts([
			{
				id: "handoff-1",
				sessionId: "session-1",
				requestedRoute: "/notebook",
				finalRoute: "/",
				routePattern: "/notebook",
				navigationType: "push",
				occurredAt: "2026-08-19T12:00:00.000Z",
			},
		]);
		const rows = buildPageAnalyticsRows(dataset.events);
		expect(rows.find((row) => row.route === "/notebook")).toMatchObject({
			entryAttempts: 1,
			renderedViews: 0,
		});
		expect(rows.find((row) => row.route === "/")).toMatchObject({
			entryAttempts: 0,
			renderedViews: 1,
		});
		expect(dataset.quality.repairedRows).toBe(1);
	});

	test("rejects malformed rows and removes duplicate event ids", () => {
		const valid = {
			id: "event-1",
			sessionId: "session-1",
			requestedRoute: "/analytics",
			finalRoute: "/analytics",
			routePattern: "/analytics",
			navigationType: "initial",
			occurredAt: "2026-08-19T12:00:00.000Z",
		};
		const dataset = parsePageRouteAttempts([valid, valid, { id: "broken" }]);
		expect(dataset.events).toHaveLength(1);
		expect(dataset.quality).toMatchObject({
			duplicateRows: 1,
			rejectedRows: 1,
		});
	});

	test("reports unknown requested and rendered routes separately", () => {
		const dataset = parsePageRouteAttempts([
			{
				id: "unknown-1",
				sessionId: "session-1",
				requestedRoute: "/retired-entry",
				finalRoute: "/missing-page",
				routePattern: "/missing-page",
				navigationType: "push",
				occurredAt: "2026-08-19T12:00:00.000Z",
			},
		]);
		expect(findUnknownPageRoutes(dataset.events)).toEqual({
			requested: ["/retired-entry"],
			rendered: ["/missing-page"],
		});
	});
});
