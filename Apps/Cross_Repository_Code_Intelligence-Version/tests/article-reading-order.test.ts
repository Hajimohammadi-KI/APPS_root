import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { allDays, sources } from "../app/plan-data";

const recoveredArticleFolder =
  "D:\\Bachelor-Thesis\\All Artikels\\Recovered_Articles_2026-08-07";

const expectedArticleOrder = [
  "hevner",
  "sweqa",
  "logiclens",
  "nagy",
  "shatnawi",
  "allamanis",
  "yamaguchi",
  "kilt",
  "draco",
  "codefuse",
  "graphcodebert",
] as const;

describe("article reading order", () => {
  test("keeps numbered article files aligned with first use in the tracker", () => {
    const firstUseOrder = allDays
      .flatMap((day) => day.sourceIds)
      .filter((sourceId, index, sourceIds) => sourceIds.indexOf(sourceId) === index)
      .filter((sourceId) => sourceId !== "proposal")
      .filter((sourceId) => sources[sourceId]?.driveName?.endsWith(".pdf"));

    expect(firstUseOrder).toEqual(expectedArticleOrder);

    expectedArticleOrder.forEach((sourceId) => {
      const fileName = sources[sourceId].driveName;
      expect(Boolean(fileName)).toBeTrue();
      expect(existsSync(join(recoveredArticleFolder, fileName!))).toBeTrue();
    });
  });

  test("uses unique article filenames", () => {
    const names = expectedArticleOrder.map((sourceId) => sources[sourceId].driveName);
    expect(new Set(names).size).toBe(names.length);
  });

  test("uses recovered-folder names for every local article source", () => {
    const localArticleNames = Object.values(sources)
      .filter((source) => source.id !== "proposal")
      .map((source) => source.driveName)
      .filter((fileName): fileName is string => Boolean(fileName?.endsWith(".pdf")));

    expect(localArticleNames.length).toBeGreaterThan(20);
    for (const fileName of localArticleNames) {
      expect(existsSync(join(recoveredArticleFolder, fileName))).toBeTrue();
    }
  });
});
