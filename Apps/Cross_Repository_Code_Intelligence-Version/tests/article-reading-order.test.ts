import { describe, expect, test } from "bun:test";
import { allDays, sources } from "../app/plan-data";

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

    expectedArticleOrder.forEach((sourceId, index) => {
      expect(sources[sourceId].driveName?.startsWith(`${String(index + 1).padStart(2, "0")}_`)).toBeTrue();
    });
  });

  test("uses unique article filenames", () => {
    const names = expectedArticleOrder.map((sourceId) => sources[sourceId].driveName);
    expect(new Set(names).size).toBe(names.length);
  });
});
