import { describe, expect, it } from "bun:test";

import {
  buildAutomatizationTopic,
  computeAutomatizationMatrix,
  parseAutomatizationTopic,
} from "./automatization";
import { AUTOMATICITY_LATENCY_THRESHOLD_MS } from "./mastery";
import type { UserAttempt } from "./learner-state";

function attempt(overrides: Partial<UserAttempt>): UserAttempt {
  return {
    id: overrides.id ?? "attempt-1",
    date: overrides.date ?? new Date().toISOString(),
    topic: overrides.topic ?? "Automatisierung:retrieval:item-1",
    mode: overrides.mode ?? "recognition",
    inputText: overrides.inputText ?? "",
    correctedText: overrides.correctedText ?? "",
    targetHit: overrides.targetHit ?? true,
    verified: overrides.verified ?? true,
    accuracyScore: overrides.accuracyScore ?? 100,
    ...(overrides.latencyMs === undefined
      ? {}
      : { latencyMs: overrides.latencyMs }),
  };
}

describe("automatization topic encoding", () => {
  it("round-trips a plain module topic", () => {
    const topic = buildAutomatizationTopic("retrieval", "Akkusativ #1");
    expect(parseAutomatizationTopic(topic)).toEqual({
      module: "retrieval",
      itemId: "Akkusativ #1",
      stage: null,
    });
  });

  it("round-trips a shadowing topic with a stage", () => {
    const topic = buildAutomatizationTopic("shadowing", "alltag-kaffee", 4);
    expect(topic).toBe("Automatisierung:shadowing:alltag-kaffee:stufe4");
    expect(parseAutomatizationTopic(topic)).toEqual({
      module: "shadowing",
      itemId: "alltag-kaffee",
      stage: 4,
    });
  });

  it("sanitizes colons inside the item id so parsing stays unambiguous", () => {
    const topic = buildAutomatizationTopic(
      "formulaic",
      "es:kommt:darauf:an",
      undefined,
    );
    expect(parseAutomatizationTopic(topic)?.itemId).toBe("es-kommt-darauf-an");
  });

  it("round-trips a checkpoint topic and excludes it from matrix columns", () => {
    const topic = buildAutomatizationTopic("checkpoint", "checkpoint-1");
    expect(parseAutomatizationTopic(topic)).toEqual({
      module: "checkpoint",
      itemId: "checkpoint-1",
      stage: null,
    });
    const now = new Date("2026-08-15T12:00:00.000Z");
    const matrix = computeAutomatizationMatrix(
      [attempt({ topic, date: now.toISOString(), verified: false })],
      now,
    );
    const totals = matrix.flatMap((row) =>
      Object.values(row.cells).map((cell) => cell.attempts),
    );
    expect(totals.every((count) => count === 0)).toBe(true);
  });

  it("returns null for topics outside the Automatisierung namespace", () => {
    expect(parseAutomatizationTopic("Akkusativ")).toBeNull();
    expect(
      parseAutomatizationTopic("Automatisierung:unknown-module:x"),
    ).toBeNull();
  });
});

describe("computeAutomatizationMatrix", () => {
  it("buckets an attempt into the correct week and column", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const attempts = [
      attempt({
        topic: buildAutomatizationTopic("retrieval", "item-1"),
        date: new Date("2026-08-15T09:00:00.000Z").toISOString(),
        latencyMs: 2_000,
      }),
    ];
    const matrix = computeAutomatizationMatrix(attempts, now);
    expect(matrix).toHaveLength(4);
    const currentWeek = matrix[3]!;
    expect(currentWeek.weekLabel).toBe("Diese Woche");
    expect(currentWeek.cells.retrieval.attempts).toBe(1);
    expect(currentWeek.cells.retrieval.automaticAttempts).toBe(1);
    expect(matrix[0]!.cells.retrieval.attempts).toBe(0);
  });

  it("tracks each shadowing stage as its own column", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const attempts = [1, 2, 3, 4, 5].map((stage) =>
      attempt({
        id: `shadow-${stage}`,
        topic: buildAutomatizationTopic(
          "shadowing",
          "alltag-kaffee",
          stage as 1 | 2 | 3 | 4 | 5,
        ),
        date: now.toISOString(),
        verified: stage === 5,
        latencyMs: 3_000,
      }),
    );
    const matrix = computeAutomatizationMatrix(attempts, now);
    const currentWeek = matrix[3]!;
    // `as const` keeps stage a literal union (1|2|3|4|5) instead of widening
    // to number -- without it the template key is `shadowing-${number}`, which
    // cannot index the cell record and failed the package's typecheck.
    for (const stage of [1, 2, 3, 4, 5] as const) {
      expect(currentWeek.cells[`shadowing-${stage}` as const].attempts).toBe(1);
    }
    // Only stage 5 (free retelling) was recorded as verified in this test.
    expect(currentWeek.cells["shadowing-5"].automaticAttempts).toBe(1);
    expect(currentWeek.cells["shadowing-1"].automaticAttempts).toBe(0);
  });

  it("does not count a slow attempt as automatic even when verified and correct", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const attempts = [
      attempt({
        topic: buildAutomatizationTopic("formulaic", "seq-1"),
        date: now.toISOString(),
        latencyMs: AUTOMATICITY_LATENCY_THRESHOLD_MS + 5_000,
      }),
    ];
    const matrix = computeAutomatizationMatrix(attempts, now);
    const currentWeek = matrix[3]!;
    expect(currentWeek.cells.formulaic.attempts).toBe(1);
    expect(currentWeek.cells.formulaic.verifiedAttempts).toBe(1);
    expect(currentWeek.cells.formulaic.automaticAttempts).toBe(0);
  });

  it("ignores attempts from unrelated (non-Automatisierungstrainer) topics", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const attempts = [attempt({ topic: "Akkusativ", date: now.toISOString() })];
    const matrix = computeAutomatizationMatrix(attempts, now);
    const totals = matrix.flatMap((row) =>
      Object.values(row.cells).map((cell) => cell.attempts),
    );
    expect(totals.every((count) => count === 0)).toBe(true);
  });
});
