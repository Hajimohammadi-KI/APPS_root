import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  conversationTopics,
  grammarCategory,
  GRAMMAR_CATEGORIES,
  grammarUnits,
  legacyGrammarUnits,
  legacyOnlineResources,
  onlineResources,
  qSkillsIntroResources,
  qSkillsLevels,
  qSkillsSourceFolder,
} from "./index";
import { repairGrammarUnitLinks } from "./resource-links";

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  const valueStart = startIndex + start.length;
  const endIndex = source.indexOf(end, valueStart);
  expect(endIndex).toBeGreaterThan(valueStart);
  return source.slice(valueStart, endIndex);
}

function evaluateCatalog<T>(source: string): T {
  // This evaluates only immutable catalog literals from the checked-in legacy archive.
  return Function(`"use strict"; return (${source});`)() as T;
}

describe("legacy content parity", () => {
  test("keeps the original PWA source bundle complete and extractable", async () => {
    const root = resolve(import.meta.dir, "../../..");
    const requiredFiles = [
      "index.html",
      "resources.css",
      "resources.js",
      "manifest.webmanifest",
      "service-worker.js",
      "offline.html",
      "assets/dashboard-banner.svg",
      "icons/icon-192.png",
      "icons/icon-512.png",
    ];

    for (const filename of requiredFiles) {
      expect(await Bun.file(resolve(root, filename)).exists()).toBe(true);
    }

  });

  test("preserves every v27 catalog", () => {
    expect(conversationTopics).toHaveLength(72);
    expect(legacyGrammarUnits).toHaveLength(84);
    expect(legacyOnlineResources).toHaveLength(43);
    expect(onlineResources).toHaveLength(43);
  });

  test("keeps every extracted legacy record and field byte-for-field equivalent", async () => {
    const root = resolve(import.meta.dir, "../../..");
    const [indexHtml, resourcesJs] = await Promise.all([
      Bun.file(resolve(root, "index.html")).text(),
      Bun.file(resolve(root, "resources.js")).text(),
    ]);

    expect(conversationTopics).toEqual(
      evaluateCatalog(
        sliceBetween(indexHtml, "TOPICS=", ", GRAMMAR="),
      ),
    );
    expect(legacyGrammarUnits).toEqual(
      evaluateCatalog(
        sliceBetween(indexHtml, "GRAMMAR=", ", T="),
      ),
    );
    expect(legacyOnlineResources).toEqual(
      evaluateCatalog(
        sliceBetween(
          resourcesJs,
          "const ONLINE_RESOURCE_GROUPS = ",
          ";\n\nfunction",
        ),
      ),
    );
  });

  test("excludes the retired private project from the English product", async () => {
    const root = resolve(import.meta.dir, "../../..");
    const removedFiles = [
      "apps/web/features/screens/thesis-screen.tsx",
      "packages/content/src/generated/thesis.ts",
      "thesis-sprint.css",
      "thesis-sprint.js",
    ];
    for (const filename of removedFiles) {
      expect(await Bun.file(resolve(root, filename)).exists()).toBe(false);
    }

    const forbidden = [
      new RegExp(["Cross", "Repository", "Code"].join("-"), "i"),
      new RegExp(["Code", "Database Evidence Graph"].join("-"), "i"),
      new RegExp(["Thesis", "B2\\+ Sprint"].join(" "), "i"),
      new RegExp(["screen", "thesis"].join("="), "i"),
      new RegExp(["thesis", "sprint"].join("-"), "i"),
    ];
    const sourceGlob = new Bun.Glob("**/*.{ts,tsx,js,css,html,md}");
    const sourceRoots = [
      "apps/web",
      "docs",
      "packages/content/src",
      "scripts",
    ];
    const sources: Array<[string, string]> = [];
    for (const sourceRoot of sourceRoots) {
      for await (const filename of sourceGlob.scan({
        cwd: resolve(root, sourceRoot),
      })) {
        if (
          sourceRoot === "packages/content/src" &&
          filename === "content.test.ts"
        ) {
          continue;
        }
        sources.push([
          `${sourceRoot}/${filename}`,
          await Bun.file(resolve(root, sourceRoot, filename)).text(),
        ]);
      }
    }
    for (const filename of ["README.md", "index.html", "service-worker.js"]) {
      sources.push([filename, await Bun.file(resolve(root, filename)).text()]);
    }

    for (const [filename, source] of sources) {
      for (const pattern of forbidden) {
        expect(source, `${filename} contains retired private material`).not.toMatch(
          pattern,
        );
      }
    }
  });

  test("adds the researched curriculum without changing the legacy core", () => {
    expect(grammarUnits).toHaveLength(112);
    expect(grammarUnits.slice(0, legacyGrammarUnits.length)).toEqual(
      legacyGrammarUnits.map((unit) =>
        repairGrammarUnitLinks({
          ...unit,
          exercises: [
            ...unit.exercises,
            [
              `State the rule for “${unit.title}” from memory.`,
              unit.recallTest,
            ],
            [
              `Write the transfer model for “${unit.title}” accurately.`,
              unit.transferTest,
            ],
            [
              `Repair this common error for “${unit.title}” and write the full corrected sentence.`,
              unit.repairTest,
            ],
          ],
        }),
      ),
    );
  });

  test("replaces retired external links with current official resources", () => {
    const visibleUrls = [
      ...grammarUnits.flatMap((unit) => unit.links.map((link) => link[1])),
      ...onlineResources.map((resource) => resource.url),
    ];

    for (const url of visibleUrls) {
      expect(new URL(url).protocol).toBe("https:");
    }

    const testEnglishUrls = visibleUrls.filter((url) =>
      url.includes("test-english.com"),
    );
    for (const url of testEnglishUrls) {
      expect(url).toMatch(/^https:\/\/test-english\.com\/grammar-points\//);
    }

    const nonGrammarUrls = onlineResources.map((resource) => resource.url);
    expect(nonGrammarUrls.some((url) => url.includes("test-english.com"))).toBe(
      false,
    );
  });

  test("keeps every legacy grammar lesson on its exact topic page", () => {
    const repairedLegacyUnits = grammarUnits.slice(0, legacyGrammarUnits.length);

    for (const [index, legacyUnit] of legacyGrammarUnits.entries()) {
      expect(repairedLegacyUnits[index]?.title).toBe(legacyUnit.title);
      expect(repairedLegacyUnits[index]?.links.map((link) => link[1])).toEqual(
        legacyUnit.links.map((link) => link[1]),
      );
    }
  });

  test("keeps exact-topic present simple lessons on Test-English", () => {
    const presentSimpleUnits = grammarUnits.filter((unit) =>
      [
        "Present simple affirmative",
        "Present simple negatives",
        "Present simple questions",
      ].includes(unit.title),
    );

    expect(presentSimpleUnits).toHaveLength(3);
    for (const unit of presentSimpleUnits) {
      expect(unit.links.find((link) => link[3] === "explanation")?.[1]).toBe(
        "https://test-english.com/grammar-points/a1/present-simple/",
      );
      expect(unit.links.find((link) => link[3] === "exercise")?.[1]).toBe(
        "https://test-english.com/grammar-points/a1/present-simple/#exercises",
      );
    }
  });

  test("never sends grammar units to a generic grammar hub page", () => {
    for (const unit of grammarUnits) {
      for (const link of unit.links) {
        expect(link[1]).not.toMatch(
          /^https:\/\/learnenglish\.britishcouncil\.org\/free-resources\/grammar\/(a1-a2|b1-b2|c1)$/,
        );
      }
    }
  });

  test("provides at least six exercises and both resource roles per unit", () => {
    for (const unit of grammarUnits) {
      expect(unit.exercises.length).toBeGreaterThanOrEqual(6);
      expect(unit.links.some((link) => link[3] === "explanation")).toBe(true);
      expect(unit.links.some((link) => link[3] === "exercise")).toBe(true);
    }
  });

  test("maps every grammar unit into one of the 14 filters", () => {
    expect(new Set(grammarUnits.map(grammarCategory)).size).toBeGreaterThan(1);
    for (const unit of grammarUnits) {
      expect(GRAMMAR_CATEGORIES).toContain(grammarCategory(unit));
    }
  });

  test("preserves all CEFR bands from A1 through C2", () => {
    expect(new Set(grammarUnits.map((unit) => unit.level))).toEqual(
      new Set(["A1", "A2", "B1", "B2", "C1", "C2"]),
    );
  });

  test("maps all five Q: Skills levels, forty units, and four skills per unit", () => {
    expect(qSkillsLevels).toHaveLength(5);
    expect(qSkillsLevels.flatMap((level) => level.units)).toHaveLength(40);
    expect(qSkillsIntroResources).toHaveLength(4);
    expect(qSkillsSourceFolder).toContain("drive.google.com/drive/folders/");

    for (const [index, level] of qSkillsLevels.entries()) {
      expect(level.level).toBe(index + 1);
      expect(level.units).toHaveLength(8);
      expect(level.resources).toHaveLength(5);
      expect(level.units.map((unit) => unit.number)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);
      for (const unit of level.units) {
        expect(unit.listeningSkill.length).toBeGreaterThan(0);
        expect(unit.speakingSkill.length).toBeGreaterThan(0);
        expect(unit.readingSkill.length).toBeGreaterThan(0);
        expect(unit.writingSkill.length).toBeGreaterThan(0);
        expect(unit.speakingAssignment.length).toBeGreaterThan(0);
        expect(unit.writingAssignment.length).toBeGreaterThan(0);
      }
    }

    const resourceUrls = [
      ...qSkillsIntroResources.map((resource) => resource.url),
      ...qSkillsLevels.flatMap((level) =>
        level.resources.map((resource) => resource.url),
      ),
    ];
    expect(new Set(resourceUrls).size).toBe(resourceUrls.length);
    for (const url of resourceUrls) {
      expect(url).toMatch(/^https:\/\/drive\.google\.com\/file\/d\//);
    }
  });
});
