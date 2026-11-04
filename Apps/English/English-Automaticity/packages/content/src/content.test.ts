import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  conversationTopics,
  grammarCategory,
  getGrammarLessonGuide,
  GRAMMAR_CATEGORIES,
  grammarUnits,
  legacyGrammarUnits,
  legacyOnlineResources,
  onlineResources,
  INTEGRATED_SKILLS,
  buildAutomaticitySteps,
  integratedSkillsLevels,
  englishMediationB1Pilot,
  releasedEnglishMediationB1,
} from "./index";
import { assessMediationContentRelease } from "@automaticity/learning-core";
import {
  UNIT_CONTENT_REVISIONS,
  checkedPracticeFor,
  controlledPracticeFor,
} from "@automaticity/learning-core/content-revisions";
import type { GrammarExercise } from "./types";
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
  test("quarantines the B1 mediation pilot until independent human review", () => {
    expect(englishMediationB1Pilot).toHaveLength(1);
    expect(englishMediationB1Pilot[0]?.language).toBe("en");
    expect(englishMediationB1Pilot[0]?.cefrLevel).toBe("B1");
    expect(englishMediationB1Pilot[0]?.modes).toContain("mediation");
    expect(englishMediationB1Pilot[0]?.modes).toContain("transfer");
    expect(releasedEnglishMediationB1).toEqual([]);
    expect(
      assessMediationContentRelease(englishMediationB1Pilot[0]!)
        .readyForDailyPlan,
    ).toBe(false);
  });

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
      expect(await Bun.file(resolve(root, "legacy", filename)).exists()).toBe(
        true,
      );
    }
  });

  test("preserves every v27 catalog", () => {
    expect(conversationTopics).toHaveLength(72);
    expect(legacyGrammarUnits).toHaveLength(84);
    expect(legacyOnlineResources).toHaveLength(43);
    expect(onlineResources).toHaveLength(43);
  });

  test("keeps complete A1-C2 grammar and conversation title coverage", () => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    for (const level of levels) {
      const grammarTitles = grammarUnits
        .filter((unit) => unit.level === level)
        .map((unit) => unit.title.trim());
      const conversationTitles = conversationTopics
        .filter((topic) => topic.level === level)
        .map((topic) => topic.topic.trim());

      expect(grammarTitles.length).toBeGreaterThanOrEqual(14);
      expect(new Set(grammarTitles).size).toBe(grammarTitles.length);
      expect(conversationTitles).toHaveLength(12);
      expect(new Set(conversationTitles).size).toBe(conversationTitles.length);
      expect(conversationTitles.every(Boolean)).toBe(true);
    }
  });

  test("gives every conversation topic four level-appropriate spoken chunks", () => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
    const firstChunkByLevel = new Map<string, string>();

    for (const level of levels) {
      const topics = conversationTopics.filter(
        (topic) => topic.level === level,
      );
      expect(topics).toHaveLength(12);

      for (const topic of topics) {
        expect(topic.spokenChunks).toHaveLength(4);
        expect(
          topic.spokenChunks.every(
            (chunk) =>
              chunk.text.trim().length >= 5 &&
              chunk.purpose.trim().length >= 8 &&
              chunk.example.trim().length >= 12,
          ),
        ).toBe(true);
        expect(
          new Set(topic.spokenChunks.map((chunk) => chunk.text)).size,
        ).toBe(4);
      }

      firstChunkByLevel.set(level, topics[0]?.spokenChunks[0]?.text ?? "");
    }

    expect(firstChunkByLevel.size).toBe(levels.length);
    expect(new Set(firstChunkByLevel.values()).size).toBe(levels.length);
  });

  test("ships the exact authored grammar catalog to the visual Grammar Lab", async () => {
    const root = resolve(import.meta.dir, "../../..");
    const browserSource = await Bun.file(
      resolve(root, "apps/web/public/replacements/en/grammar-curriculum.js"),
    ).text();
    const normalizedBrowserSource = browserSource.replaceAll("\r\n", "\n");
    const browserCatalog = JSON.parse(
      sliceBetween(
        normalizedBrowserSource,
        "window.__ENGLISH_GRAMMAR_UNITS__ = ",
        ";\n",
      ),
    );

    expect(grammarUnits).toHaveLength(112);
    // Six exercises, then the learner's error-notebook items of the unit.
    for (const unit of grammarUnits) {
      const notebook = checkedPracticeFor("en", unit.title).filter(
        (row) => row.notebook,
      );
      const focused = controlledPracticeFor("en", unit.title).filter((row) =>
        unit.exercises.some(([prompt]) => prompt === row.prompt),
      );
      expect(unit.exercises.slice(6).map(([prompt]) => prompt)).toEqual(
        [...notebook, ...focused].map((row) => row.prompt),
      );
      expect(unit.exercises).toHaveLength(6 + notebook.length + focused.length);
    }
    expect(browserCatalog).toEqual(grammarUnits);
  });

  test("keeps every legacy catalog identity while allowing teaching-copy repairs", async () => {
    const root = resolve(import.meta.dir, "../../..");
    const [indexHtml, resourcesSource] = await Promise.all([
      Bun.file(resolve(root, "legacy", "index.html")).text(),
      Bun.file(resolve(root, "legacy", "resources.js")).text(),
    ]);
    const resourcesJs = resourcesSource.replaceAll("\r\n", "\n");

    const extractedTopics = evaluateCatalog<
      Array<{
        track: string;
        level: string;
        skill: string;
        category: string;
        topic: string;
        targetGrammar: string;
      }>
    >(sliceBetween(indexHtml, "TOPICS=", ", GRAMMAR="));
    const catalogIdentity = ({
      track,
      level,
      skill,
      category,
      topic,
      targetGrammar,
    }: {
      track: string;
      level: string;
      skill: string;
      category: string;
      topic: string;
      targetGrammar: string;
    }) => ({
      track,
      level,
      skill,
      category,
      topic,
      targetGrammar,
    });

    expect(conversationTopics.map(catalogIdentity)).toEqual(
      extractedTopics.map(catalogIdentity),
    );
    expect(
      conversationTopics.every(
        ({ task, modelAnswer }) => task.trim() && modelAnswer.trim(),
      ),
    ).toBe(true);
    expect(
      conversationTopics.some(({ modelAnswer }) =>
        modelAnswer.includes("I would like to talk about"),
      ),
    ).toBe(false);
    expect(legacyGrammarUnits).toEqual(
      evaluateCatalog(sliceBetween(indexHtml, "GRAMMAR=", ", T=")),
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
    const sourceRoots = ["apps/web", "docs", "packages/content/src", "scripts"];
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
    sources.push([
      "README.md",
      await Bun.file(resolve(root, "README.md")).text(),
    ]);
    for (const filename of ["index.html", "service-worker.js"]) {
      sources.push([
        `legacy/${filename}`,
        await Bun.file(resolve(root, "legacy", filename)).text(),
      ]);
    }

    for (const [filename, source] of sources) {
      for (const pattern of forbidden) {
        expect(
          source,
          `${filename} contains retired private material`,
        ).not.toMatch(pattern);
      }
    }
  });

  test("adds the researched curriculum with explicit repairs shared with the independent path", () => {
    expect(grammarUnits).toHaveLength(112);
    const revisions = UNIT_CONTENT_REVISIONS.filter(
      (row) => row.language === "en",
    );
    const revised = new Set([
      "Layered subordination",
      ...revisions.map((row) => row.title),
    ]);
    // Copying a model sentence, explaining the rule, reciting it or a can-do
    // statement, and repeating the first error checked nothing. The model
    // sentence returns as a recall item and the learning path's checked items
    // fill the unit; its first exercise stays as authored.
    const exercise = ({
      prompt,
      answers: [answer, ...alternatives],
    }: {
      prompt: string;
      answers: readonly string[];
    }): GrammarExercise =>
      alternatives.length
        ? [prompt, answer!, { acceptedAnswers: alternatives }]
        : [prompt, answer!];
    // The Lab checks a prompt with a gap or one that asks to correct,
    // complete, choose, change or transform; any other prompt is self-checked.
    // The Lab's rule: an expected answer, or a prompt with a gap or a task verb.
    const checkedInLab = ([prompt, , metadata]: GrammarExercise) =>
      metadata?.answerRole === "expected" ||
      /_{2,}|…|\.\.\.|^(correct|complete|choose|change|transform)\b/i.test(
        prompt,
      );
    for (const legacy of legacyGrammarUnits.filter(
      (unit) => !revised.has(unit.title),
    )) {
      const unit = grammarUnits.find((row) => row.title === legacy.title)!;
      expect(unit.exercises[0]).toEqual(legacy.exercises[0]!);
      for (const row of checkedPracticeFor("en", unit.title).slice(0, 2))
        expect(unit.exercises).toContainEqual(exercise(row));
    }
    for (const unit of grammarUnits) {
      expect(unit.exercises.length).toBeGreaterThanOrEqual(6);
      expect(
        unit.exercises.filter(([prompt]) =>
          /^(State the rule|Write the transfer model|Explain the rule|Type (the|another) model sentence)/u.test(
            prompt,
          ),
        ),
      ).toEqual([]);
      expect(
        `${unit.title}: ${unit.exercises.filter((row) => !checkedInLab(row)).map(([prompt]) => prompt)}`,
      ).toBe(`${unit.title}: `);
      const answers = unit.exercises.map(([, answer]) => answer);
      expect(`${unit.title}: ${answers.length - new Set(answers).size}`).toBe(
        `${unit.title}: 0`,
      );
    }
    const layered = grammarUnits.find(
      (unit) => unit.title === "Layered subordination",
    )!;
    expect(layered.commonError).toBe(
      "Although the data were limited, the pattern that emerge was consistent. → Although the data were limited, the pattern that emerged was consistent.",
    );
    expect(layered.exercises[0]).toEqual([
      "Correct only the verb form and keep the meaning: Although the data were limited, the pattern that emerge was consistent.",
      "Although the data were limited, the pattern that emerged was consistent.",
    ]);
    for (const revision of revisions) {
      const unit = grammarUnits.find((row) => row.title === revision.title);
      expect(unit?.title).toBe(revision.title);
      const repair = revision.repair;
      if (repair) {
        expect(unit!.commonError).toBe(`${repair.source} → ${repair.answer}`);
        expect(
          unit!.exercises.find(([prompt]) => prompt === repair.prompt),
        ).toEqual(
          repair.alternatives
            ? [
                repair.prompt,
                repair.answer,
                { acceptedAnswers: [...repair.alternatives] },
              ]
            : [repair.prompt, repair.answer],
        );
      }
      if (revision.examples)
        expect(unit!.examples).toEqual([...revision.examples]);
    }
    expect(
      legacyGrammarUnits.find((unit) => unit.title === layered.title)!
        .commonError,
    ).toBe("Stacked clauses with unclear reference.");
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
    const repairedLegacyUnits = grammarUnits.slice(
      0,
      legacyGrammarUnits.length,
    );

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

  test("provides a complete teaching and automaticity path for every grammar unit", () => {
    for (const unit of grammarUnits) {
      const guide = getGrammarLessonGuide(unit);
      expect(guide.canDo.length, unit.title).toBeGreaterThan(20);
      expect(guide.meaning.length, unit.title).toBeGreaterThanOrEqual(2);
      expect(guide.patterns.length, unit.title).toBeGreaterThanOrEqual(4);
      expect(guide.decisionSteps.length, unit.title).toBeGreaterThanOrEqual(4);
      expect(guide.contrasts.length, unit.title).toBeGreaterThanOrEqual(1);
      expect(
        guide.practiceStages.map((practice) => practice.stage),
        unit.title,
      ).toEqual([
        "Notice",
        "Choose",
        "Build",
        "Repair",
        "Personalise",
        "Speak",
      ]);
      expect(
        new Set(guide.practiceStages.map((practice) => practice.prompt)).size,
        unit.title,
      ).toBe(guide.practiceStages.length);
      for (const grammarPattern of guide.patterns) {
        expect(grammarPattern.form.trim().length, unit.title).toBeGreaterThan(
          5,
        );
        expect(grammarPattern.use.trim().length, unit.title).toBeGreaterThan(5);
        expect(
          grammarPattern.example.trim().length,
          unit.title,
        ).toBeGreaterThan(7);
      }
    }
  });

  test("teaches both statement and interaction forms for core verb grammar", () => {
    for (const title of [
      "Present simple affirmative",
      "Present continuous",
      "Past simple irregular",
      "Present perfect",
    ]) {
      const unit = grammarUnits.find((candidate) => candidate.title === title);
      expect(unit, title).toBeDefined();
      const labels = getGrammarLessonGuide(unit!).patterns.map((item) =>
        item.label.toLowerCase(),
      );
      expect(
        labels.some((label) => label.includes("affirmative")),
        title,
      ).toBe(true);
      expect(
        labels.some((label) => label.includes("negative")),
        title,
      ).toBe(true);
      expect(
        labels.some((label) => label.includes("question")),
        title,
      ).toBe(true);
    }
  });

  test("keeps advanced lesson patterns specific to the selected title", () => {
    const expectations: Record<string, string[]> = {
      "Cleft sentences": ["It-cleft: person", "What-cleft", "All-cleft"],
      "Causative have/get": [
        "Arrange a service with have",
        "Cause with have",
        "Persuade with get",
      ],
      "Advanced punctuation and grammar": ["Semicolon", "Colon", "Dash"],
      "British and American grammar": [
        "Recent past",
        "Past participle",
        "Collective noun",
      ],
    };

    for (const [title, requiredLabels] of Object.entries(expectations)) {
      const unit = grammarUnits.find((candidate) => candidate.title === title);
      expect(unit, title).toBeDefined();
      const labels = getGrammarLessonGuide(unit!).patterns.map(
        (grammarPattern) => grammarPattern.label,
      );
      for (const requiredLabel of requiredLabels) {
        expect(labels, title).toContain(requiredLabel);
      }
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

  test("provides an original A1-C2 four-skill automaticity curriculum", () => {
    expect(integratedSkillsLevels.map((level) => level.cefr)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2",
    ]);
    expect(integratedSkillsLevels.flatMap((level) => level.units)).toHaveLength(
      72,
    );
    expect(INTEGRATED_SKILLS).toEqual([
      "listening",
      "speaking",
      "reading",
      "writing",
    ]);

    const unitIds = new Set<string>();
    const stepIds = new Set<string>();
    for (const level of integratedSkillsLevels) {
      expect(level.baseLessons).toHaveLength(4);
      expect(level.exitCriteria).toHaveLength(4);
      expect(level.units).toHaveLength(12);
      for (const unit of level.units) {
        expect(unitIds.has(unit.id)).toBe(false);
        unitIds.add(unit.id);
        expect(unit.vocabulary.length).toBeGreaterThanOrEqual(6);
        expect(unit.listeningText.trim().split(/\s+/).length).toBeGreaterThan(
          15,
        );
        expect(unit.speakingPrompt.trim().split(/\s+/).length).toBeGreaterThan(
          8,
        );
        for (const skill of INTEGRATED_SKILLS) {
          const steps = buildAutomaticitySteps(level.cefr, unit, skill);
          expect(steps).toHaveLength(7);
          expect(steps.map((step) => step.stage)).toEqual([
            "understand",
            "recognise",
            "recall",
            "supported",
            "independent",
            "transfer",
            "review",
          ]);
          for (const step of steps) {
            expect(step.minWords).toBeGreaterThan(0);
            expect(stepIds.has(step.id)).toBe(false);
            stepIds.add(step.id);
          }
        }
      }
    }
    expect(stepIds.size).toBe(2016);

    const publicCurriculum = JSON.stringify(integratedSkillsLevels);
    expect(publicCurriculum).not.toContain("drive.google.com");
    expect(publicCurriculum).not.toContain("official speaking task");
  });
});
