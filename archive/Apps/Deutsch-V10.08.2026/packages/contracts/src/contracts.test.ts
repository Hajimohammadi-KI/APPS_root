import { describe, expect, it } from "bun:test";

import { bootstrapResponseSchema, healthResponseSchema } from "./index";

describe("API contracts", () => {
  it("rejects an unhealthy health payload", () => {
    expect(() =>
      healthResponseSchema.parse({
        status: "down",
        service: "grammar-api",
        version: "0.1.0",
        timestamp: new Date().toISOString(),
      }),
    ).toThrow();
  });

  it("requires positive review intervals", () => {
    const result = bootstrapResponseSchema.safeParse({
      apiVersion: "v1",
      product: { name: "DeutschFlow", locale: "de" },
      content: { topics: 79, grammarUnits: 144, levels: ["A1"] },
      learning: {
        dailySteps: [{ id: "warmup", label: "Warm-up", minutes: 2 }],
        reviewIntervalsDays: [1, 0],
      },
      capabilities: {
        persistence: "local-first",
        sync: "planned",
        languageFeedback: "external",
      },
    });

    expect(result.success).toBe(false);
  });
});
