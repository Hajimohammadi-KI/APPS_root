import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import {
  PAGE_CATALOG,
  buildPageAnalyticsRows,
  findUnknownPageRoutes,
  matchRoutePattern,
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

describe("Seitenanalyse", () => {
  test("hält den Routenkatalog mit den Quelloberflächen vollständig", () => {
    const catalogRoutes: string[] = PAGE_CATALOG.map((page) => page.route);
    expect(catalogRoutes.sort()).toEqual(sourceRoutes());
  });

  test("trennt angeforderte Weiterleitung und gerenderte Zielseite", () => {
    const dataset = parsePageRouteAttempts([
      {
        id: "redirect-1",
        sessionId: "session-1",
        requestedRoute: "/automatik",
        finalRoute: "/heute",
        routePattern: "/automatik",
        navigationType: "push",
        occurredAt: "2026-08-19T12:00:00.000Z",
      },
    ]);
    const rows = buildPageAnalyticsRows(dataset.events);
    expect(rows.find((row) => row.route === "/automatik")).toMatchObject({
      entryAttempts: 1,
      renderedViews: 0,
    });
    expect(rows.find((row) => row.route === "/heute")).toMatchObject({
      entryAttempts: 0,
      renderedViews: 1,
    });
    expect(dataset.quality.repairedRows).toBe(1);
  });

  test("normalisiert dynamische Materialrouten", () => {
    expect(matchRoutePattern("/deutsch-mit-marija/uebung/material-42")).toBe(
      "/deutsch-mit-marija/uebung/[materialId]",
    );
  });

  test("verwirft fehlerhafte Zeilen und doppelte Ereignis-IDs", () => {
    const valid = {
      id: "event-1",
      sessionId: "session-1",
      requestedRoute: "/analytics",
      finalRoute: "/analytics",
      routePattern: "/analytics",
      navigationType: "initial",
      occurredAt: "2026-08-19T12:00:00.000Z",
    };
    const dataset = parsePageRouteAttempts([valid, valid, { id: "defekt" }]);
    expect(dataset.events).toHaveLength(1);
    expect(dataset.quality).toMatchObject({
      duplicateRows: 1,
      rejectedRows: 1,
    });
  });

  test("meldet unbekannte Einstiegs- und Zielrouten getrennt", () => {
    const dataset = parsePageRouteAttempts([
      {
        id: "unknown-1",
        sessionId: "session-1",
        requestedRoute: "/alter-einstieg",
        finalRoute: "/fehlende-seite",
        routePattern: "/fehlende-seite",
        navigationType: "push",
        occurredAt: "2026-08-19T12:00:00.000Z",
      },
    ]);
    expect(findUnknownPageRoutes(dataset.events)).toEqual({
      requested: ["/alter-einstieg"],
      rendered: ["/fehlende-seite"],
    });
  });
});
