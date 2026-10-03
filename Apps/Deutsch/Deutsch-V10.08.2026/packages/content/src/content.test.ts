import { describe, expect, it } from "bun:test";

import {
  FERTIGKEITEN,
  cefrCurriculum,
  catalogSummary,
  deutschMitMarijaSharedWithMeUrl,
  deutschMitMarijaSourceFolders,
  discussionAudioMaterials,
  discussionGuideMaterials,
  driveMaterialCollections,
  errorRepairMaterials,
  GRAMMAR_CATEGORIES,
  grammarCategoriesFor,
  grammarMaterialFolderUrl,
  grammarMaterialSources,
  grammarTrainingCatalog,
  grammarTrainingMaterials,
  grammarTrainingParts,
  grammarUnits,
  idiomDailyMaterials,
  speakingTopics,
  germanMediationB1Pilot,
  releasedGermanMediationB1,
} from "./index";
import { assessMediationContentRelease } from "@automaticity/learning-core";
import { isRetiredGermanResource } from "./resource-links";

describe("legacy content extraction", () => {
  it("hält den B1-Mediationspiloten bis zur unabhängigen menschlichen Prüfung zurück", () => {
    expect(germanMediationB1Pilot).toHaveLength(1);
    expect(germanMediationB1Pilot[0]?.language).toBe("de");
    expect(germanMediationB1Pilot[0]?.cefrLevel).toBe("B1");
    expect(germanMediationB1Pilot[0]?.modes).toContain("mediation");
    expect(germanMediationB1Pilot[0]?.modes).toContain("transfer");
    expect(releasedGermanMediationB1).toEqual([]);
    expect(
      assessMediationContentRelease(germanMediationB1Pilot[0]!)
        .readyForDailyPlan,
    ).toBe(false);
  });

  it("preserves the full v20.8 catalogs", () => {
    expect(catalogSummary.topicCount).toBe(79);
    expect(catalogSummary.grammarUnitCount).toBe(144);
    expect(catalogSummary.levels).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);

    for (const level of catalogSummary.levels) {
      expect(grammarUnits.filter((unit) => unit.level === level)).toHaveLength(
        24,
      );
    }
  });

  it("keeps every learning item addressable", () => {
    expect(new Set(speakingTopics.map((topic) => topic.topic)).size).toBe(79);
    expect(new Set(grammarUnits.map((unit) => unit.title)).size).toBe(144);
  });

  it("enthält vollständige Grammatik- und Gesprächsthemen von A1 bis C2", () => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

    for (const level of levels) {
      const grammarTitles = grammarUnits
        .filter((unit) => unit.level === level)
        .map((unit) => unit.title.trim());
      const conversationTitles = speakingTopics
        .filter((topic) => topic.level === level)
        .map((topic) => topic.topic.trim());

      expect(grammarTitles).toHaveLength(24);
      expect(new Set(grammarTitles).size).toBe(grammarTitles.length);
      expect(conversationTitles.length).toBeGreaterThanOrEqual(12);
      expect(new Set(conversationTitles).size).toBe(conversationTitles.length);
      expect(conversationTitles.every(Boolean)).toBe(true);
    }
  });

  it("keeps every grammar unit complete and directly linked", () => {
    for (const unit of grammarUnits) {
      expect(unit.level.trim()).not.toBe("");
      expect(unit.title.trim()).not.toBe("");
      expect(unit.rule.trim()).not.toBe("");
      expect(unit.examples.length).toBeGreaterThan(0);
      expect(unit.examples.every((example) => example.trim().length > 0)).toBe(
        true,
      );
      expect(unit.commonError.trim()).not.toBe("");
      expect(unit.explanation.overview.length).toBeGreaterThanOrEqual(100);
      expect(unit.explanation.formation.length).toBeGreaterThanOrEqual(2);
      expect(unit.explanation.usage.length).toBeGreaterThanOrEqual(2);
      expect(unit.explanation.wordOrder.length).toBeGreaterThanOrEqual(2);
      expect(unit.explanation.specialCases.length).toBeGreaterThanOrEqual(2);
      expect(unit.explanation.memoryTip.length).toBeGreaterThanOrEqual(30);
      expect(
        [
          ...unit.explanation.formation,
          ...unit.explanation.usage,
          ...unit.explanation.wordOrder,
          ...unit.explanation.specialCases,
        ].every((detail) => detail.trim().length >= 20),
      ).toBe(true);
      expect(unit.exercises.length).toBeGreaterThanOrEqual(5);
      expect(
        unit.exercises.every(
          (exercise) =>
            (exercise[0]?.trim().length ?? 0) > 0 &&
            (exercise[1]?.trim().length ?? 0) > 0,
        ),
      ).toBe(true);
      expect(new Set(unit.exercises.map((exercise) => exercise[0])).size).toBe(
        unit.exercises.length,
      );
      expect(unit.links).toHaveLength(2);
      expect(
        unit.links.filter((link) => link[3] === "explanation"),
      ).toHaveLength(1);
      expect(unit.links.filter((link) => link[3] === "exercise")).toHaveLength(
        1,
      );

      for (const link of unit.links) {
        expect(() => new URL(link[1])).not.toThrow();
        expect(link[1].startsWith("https://")).toBe(true);
        expect(new URL(link[1]).pathname).not.toBe("/");
        expect(link[4]).toBe(unit.title);
      }

      expect(unit.testAnswer.trim()).not.toBe("");
      expect(unit.recallTest.trim()).not.toBe("");
      expect(unit.repairTest.trim()).not.toBe("");
      expect(unit.transferTest.trim()).not.toBe("");
    }
  });

  it("does not expose retired Lingolia routes", () => {
    for (const link of grammarUnits.flatMap((unit) => unit.links)) {
      expect(isRetiredGermanResource(link[1])).toBe(false);
    }
  });

  it("assigns every unit to one or more useful grammar categories", () => {
    for (const unit of grammarUnits) {
      const categories = grammarCategoriesFor(unit);
      expect(categories.length).toBeGreaterThan(0);
      expect(
        categories.every((category) => GRAMMAR_CATEGORIES.includes(category)),
      ).toBe(true);
    }

    const infinitive = grammarUnits.find(
      (unit) => unit.title === "Infinitiv mit zu",
    );
    const prepositionalVerbs = grammarUnits.find(
      (unit) => unit.title === "Verben mit Präpositionen",
    );
    const personalPronouns = grammarUnits.find(
      (unit) => unit.title === "Personalpronomen und sein",
    );
    const temporalConnectors = grammarUnits.find(
      (unit) => unit.title === "wenn und als",
    );

    expect(infinitive).toBeDefined();
    expect(prepositionalVerbs).toBeDefined();
    expect(personalPronouns).toBeDefined();
    expect(temporalConnectors).toBeDefined();
    expect(grammarCategoriesFor(infinitive!)).toContain("Verben & Verbformen");
    expect(grammarCategoriesFor(infinitive!)).toContain("Satzbau & Nebensätze");
    expect(grammarCategoriesFor(prepositionalVerbs!)).toContain(
      "Verben & Verbformen",
    );
    expect(grammarCategoriesFor(prepositionalVerbs!)).toContain(
      "Präpositionen",
    );
    expect(grammarCategoriesFor(personalPronouns!)).not.toContain(
      "Nomen, Artikel & Plural",
    );
    expect(grammarCategoriesFor(temporalConnectors!)).toContain(
      "Konnektoren & Textverknüpfung",
    );
  });

  it("attributes every level to the supplied course material", () => {
    expect(new URL(grammarMaterialFolderUrl).hostname).toBe("drive.google.com");
    expect(grammarMaterialSources.length).toBeGreaterThanOrEqual(6);

    for (const level of catalogSummary.levels) {
      expect(
        grammarMaterialSources.some((source) => source.levels.includes(level)),
      ).toBe(true);
    }
  });

  it("keeps every speaking topic complete", () => {
    for (const topic of speakingTopics) {
      expect(topic.track.trim()).not.toBe("");
      expect(topic.level.trim()).not.toBe("");
      expect(topic.skill.trim()).not.toBe("");
      expect(topic.category.trim()).not.toBe("");
      expect(topic.topic.trim()).not.toBe("");
      expect(topic.task.trim()).not.toBe("");
      expect(topic.modelAnswer.trim()).not.toBe("");
      expect(topic.targetGrammar.trim()).not.toBe("");
      expect(topic.task).not.toMatch(/Sprich über sich vorstellen/i);
      expect(topic.modelAnswer).not.toMatch(/Ich möchte über [a-zäöüß]/);
      expect(topic.task).toContain(`„${topic.topic}“`);
    }
  });

  it("covers every CEFR level with topics, vocabulary and all six activity modes", () => {
    expect(cefrCurriculum.map((level) => level.stufe)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2",
    ]);
    expect(FERTIGKEITEN).toEqual([
      "Hören",
      "Lesen",
      "Sprechen",
      "Schreiben",
      "Mediation",
      "Online-Interaktion",
    ]);

    for (const level of cefrCurriculum) {
      expect(level.themen).toHaveLength(12);
      expect(level.wortschatz.length).toBeGreaterThanOrEqual(10);
      expect(level.ziel.trim()).not.toBe("");
      expect(level.aussprache.trim()).not.toBe("");
      expect(
        grammarUnits.filter((unit) => unit.level === level.stufe),
      ).toHaveLength(24);

      for (const fertigkeit of FERTIGKEITEN) {
        expect(level.kannBeschreibungen[fertigkeit].trim()).not.toBe("");
      }
    }
  });

  it("indexes the supplied Drive curricula without duplicate-file noise", () => {
    expect(driveMaterialCollections.length).toBeGreaterThanOrEqual(10);
    expect(idiomDailyMaterials).toHaveLength(24);
    expect(discussionAudioMaterials).toHaveLength(7);
    expect(discussionGuideMaterials).toHaveLength(5);
    expect(grammarTrainingParts).toHaveLength(4);
    expect(grammarTrainingCatalog).toHaveLength(4);
    expect(grammarTrainingCatalog.map((part) => part.items.length)).toEqual([
      33, 34, 31, 33,
    ]);
    expect(grammarTrainingMaterials).toHaveLength(131);
    expect(
      grammarTrainingMaterials.filter((item) => item.format === "PDF"),
    ).toHaveLength(127);
    expect(
      grammarTrainingMaterials.filter((item) => item.format === "Archiv"),
    ).toHaveLength(4);
    expect(errorRepairMaterials).toHaveLength(2);
    expect(deutschMitMarijaSourceFolders.map((folder) => folder.url)).toEqual([
      "https://drive.google.com/drive/folders/1w7QJaMHkH-mVYSXBxDw9nwd_FTVVLIUS?usp=drive_link",
      "https://drive.google.com/drive/folders/1l8nQtv35TEUeYpJA10SoUAhldSK53LBe?usp=drive_link",
      "https://drive.google.com/drive/folders/1jzgBp3kP8nTT_bqL9RlNMuFtZkpdm3Q8?usp=drive_link",
    ]);
    expect(deutschMitMarijaSharedWithMeUrl).toBe(
      deutschMitMarijaSourceFolders[0].url,
    );
    expect(grammarMaterialFolderUrl).toContain(
      "1isE3OWBFZcr9eRDwWvNXHWb5vo0qmGAF",
    );

    const marijaMaterials = [
      ...idiomDailyMaterials,
      ...discussionGuideMaterials,
      ...discussionAudioMaterials,
      ...grammarTrainingParts,
      ...grammarTrainingMaterials,
      ...errorRepairMaterials,
    ];

    expect(new Set(marijaMaterials.map((item) => item.url)).size).toBe(
      marijaMaterials.length,
    );
    expect(
      marijaMaterials.every(
        (item) => new URL(item.url).hostname === "drive.google.com",
      ),
    ).toBe(true);
    expect(
      marijaMaterials.some((item) => item.url.includes("/shared-with-me")),
    ).toBe(false);
  });
});
