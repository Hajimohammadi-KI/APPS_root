import { describe, expect, it } from "bun:test";

import {
  LEARNING_RESOURCES,
  RESOURCE_LEVELS,
} from "./learning-resource-catalog";

describe("learning resource catalog", () => {
  it("uses one exact CEFR level per learning resource", () => {
    expect(
      LEARNING_RESOURCES.every((resource) =>
        RESOURCE_LEVELS.includes(resource.level),
      ),
    ).toBe(true);
    expect(
      LEARNING_RESOURCES.some((resource) =>
        /A1.A2|B1.B2|C1.C2|B2.C1/u.test(resource.level),
      ),
    ).toBe(false);
  });

  it("creates a separate address for every grammar topic", () => {
    const grammar = LEARNING_RESOURCES.filter((resource) =>
      resource.id.startsWith("grammar-"),
    );

    expect(grammar).toHaveLength(144);
    for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
      expect(
        grammar.filter((resource) => resource.level === level),
      ).toHaveLength(24);
    }

    for (const resource of grammar) {
      const url = new URL(resource.href, "http://localhost");
      expect(url.pathname).toBe("/grammatik");
      expect(url.searchParams.get("topic")).toBe(resource.topic);
    }
  });

  it("shows only built-in routes and public resources to learners", () => {
    expect(
      LEARNING_RESOURCES.every(
        (resource) => !resource.href.includes("drive.google.com"),
      ),
    ).toBe(true);
    expect(
      LEARNING_RESOURCES.filter((resource) =>
        resource.id.startsWith("schubert-begegnungen-"),
      ),
    ).toHaveLength(2);
  });

  it("keeps every catalog entry unique and directly addressable", () => {
    expect(
      new Set(LEARNING_RESOURCES.map((resource) => resource.id)).size,
    ).toBe(LEARNING_RESOURCES.length);
    expect(
      new Set(LEARNING_RESOURCES.map((resource) => resource.href)).size,
    ).toBe(LEARNING_RESOURCES.length);
    expect(
      LEARNING_RESOURCES.every(
        (resource) =>
          resource.topic.trim().length > 0 && resource.href.trim().length > 0,
      ),
    ).toBe(true);
  });
});
