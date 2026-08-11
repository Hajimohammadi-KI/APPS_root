import { describe, expect, test } from "bun:test";
import {
  nlpCourseSessions,
  nlpLabDefinition,
  sources,
} from "../app/plan-data";

const expectedDates = [
  "2026-08-17",
  "2026-08-19",
  "2026-08-22",
  "2026-08-24",
  "2026-08-26",
  "2026-08-29",
  "2026-08-31",
  "2026-09-02",
  "2026-09-05",
  "2026-09-07",
];

describe("NLP Retrieval Lab live course", () => {
  test("uses the ten official Saturday, Monday, and Wednesday dates", () => {
    expect(nlpCourseSessions.map((session) => session.date)).toEqual(
      expectedDates,
    );
    expect(
      nlpCourseSessions.every((session) =>
        [1, 3, 6].includes(new Date(`${session.date}T12:00:00Z`).getUTCDay()),
      ),
    ).toBeTrue();
    expect(nlpCourseSessions).toHaveLength(10);
    expect(nlpCourseSessions.some((session) => session.date === "2026-09-10"))
      .toBeFalse();
  });

  test("keeps the fixed Berlin and Iran class times", () => {
    for (const session of nlpCourseSessions) {
      expect(session.berlinTime).toBe("17:30–19:10");
      expect(session.iranTime).toBe("19:00–20:40");
    }
  });

  test("connects every lesson to sources, engineering work, and evidence", () => {
    const deliverables = nlpCourseSessions.flatMap(
      (session) => session.deliverables,
    );
    expect(new Set(deliverables).size).toBe(deliverables.length);

    for (const session of nlpCourseSessions) {
      expect(session.sourceIds.length).toBeGreaterThanOrEqual(2);
      expect(session.sourceIds.every((sourceId) => Boolean(sources[sourceId])))
        .toBeTrue();
      expect(session.softwareEngineering.length).toBeGreaterThanOrEqual(3);
      expect(session.definitionOfDone.length).toBeGreaterThan(30);
    }
  });

  test("keeps neural training outside the required thesis core", () => {
    expect(nlpLabDefinition.courseStart).toBe("2026-08-17");
    expect(nlpLabDefinition.courseEnd).toBe("2026-09-07");
    expect(nlpLabDefinition.surgeryDate).toBe("2026-09-10");
    expect(nlpLabDefinition.deferred.join(" ")).toContain("fine-tuning");
    expect(nlpLabDefinition.integrationContract.boundary).toContain("verifier");
  });
});
