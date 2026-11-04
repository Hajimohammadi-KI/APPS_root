import { expect, test } from "bun:test";
import {
  CONTENT_CHECKS,
  CONTENT_TASK_CHECKS,
  approvedReviewDocuments,
  contentReviewSelection,
  reviewProblems,
  reviewTaskGroups,
  safeReviewSource,
  unitContentDigest,
  type UnitReviewForm,
} from "../shared/learning-core/src/automaticity/content-review";
import {
  activePracticeTasks,
  type CurriculumPack,
} from "../shared/learning-core/src/automaticity/curriculum";

for (const [language, folder] of [
  ["en", "English/English-Automaticity"],
  ["de", "Deutsch/Deutsch-Automaticity"],
] as const) {
  const pack = (await Bun.file(
    `Apps/${folder}/apps/web/public/learning-core/curriculum-${language}.json`,
  ).json()) as CurriculumPack;
  const unit = pack.units.find((row) => row.learningCycle)!;
  test(`${language}: exact unit links and safe invalid query fallback`, () => {
    const selected = pack.units.filter((row) => row.learningCycle).at(-1)!;
    expect(
      contentReviewSelection(pack, `?unit=${selected.id}&focus=cycle`),
    ).toEqual({ unit: selected, cycleOnly: true });
    for (const query of [
      "",
      "?unit=missing",
      "?unit=javascript:alert(1)",
      "?unit=%00&focus=unknown",
    ])
      expect(contentReviewSelection(pack, query)).toEqual({
        unit: pack.units[0],
        cycleOnly: false,
      });
    expect(
      contentReviewSelection(
        { ...pack, units: [] },
        "?unit=missing&focus=cycle",
      ),
    ).toEqual({ unit: undefined, cycleOnly: false });
  });
  test(`${language}: seven exact cycle tasks first, every other active task retained`, () => {
    const original = JSON.stringify(unit);
    const groups = reviewTaskGroups(unit);
    expect(groups.cycle.map((task) => task.id)).toEqual(
      unit.learningCycle!.steps.map((step) => step.taskId),
    );
    expect(groups.cycle).toHaveLength(7);
    expect(
      [...groups.cycle, ...groups.other].map((task) => task.id).sort(),
    ).toEqual(
      activePracticeTasks(unit)
        .map((task) => task.id)
        .sort(),
    );
    expect(JSON.stringify(unit)).toBe(original);
    const legacy = structuredClone(unit);
    delete legacy.learningCycle;
    expect(reviewTaskGroups(legacy)).toEqual({
      cycle: [],
      other: activePracticeTasks(legacy),
    });
    const missing = structuredClone(unit);
    missing.learningCycle!.steps[0]!.taskId = "not-installed";
    expect(reviewTaskGroups(missing).cycle).toHaveLength(6);
    expect([
      ...reviewTaskGroups(missing).cycle,
      ...reviewTaskGroups(missing).other,
    ]).toHaveLength(activePracticeTasks(unit).length);
  });
  test(`${language}: reviewing only the cycle cannot approve the whole unit`, async () => {
    const form: UnitReviewForm = {
      reviewerId: "Maria Keller",
      role: "Independent language teacher",
      reviewedAt: "2026-11-04T10:00:00.000Z",
      checks: Object.fromEntries(CONTENT_CHECKS.map((check) => [check, true])),
      note: "The seven cycle tasks have been checked against a reference grammar.",
      tasks: Object.fromEntries(
        reviewTaskGroups(unit).cycle.map((task) => [
          task.id,
          {
            checks: Object.fromEntries(
              CONTENT_TASK_CHECKS.map((check) => [check, true]),
            ),
            note: "The task and every answer were checked by the teacher.",
          },
        ]),
      ),
    };
    expect(
      reviewProblems(unit, form, "2026-11-04T11:00:00.000Z").length,
    ).toBeGreaterThan(0);
    await expect(
      approvedReviewDocuments(pack, unit, form, "2026-11-04T11:00:00.000Z"),
    ).rejects.toThrow("not complete");
  });
  test(`${language}: goal, purpose and mapping edits invalidate the exact review digest`, async () => {
    const digest = await unitContentDigest(unit);
    for (const field of ["goal", "purpose", "mapping"] as const) {
      const changed = structuredClone(unit);
      if (field === "goal") changed.learningCycle!.goals.meaning += " Changed";
      if (field === "purpose")
        changed.learningCycle!.steps[0]!.purpose += " Changed";
      if (field === "mapping")
        changed.learningCycle!.steps[0]!.taskId += " Changed";
      expect(await unitContentDigest(changed)).not.toBe(digest);
    }
  });
}
test("review references allow only absolute HTTP(S) source URLs", () => {
  expect(safeReviewSource("https://example.org/grammar")).toBe(
    "https://example.org/grammar",
  );
  expect(safeReviewSource("http://example.org/grammar")).toBe(
    "http://example.org/grammar",
  );
  for (const input of [
    "javascript:alert(1)",
    "data:text/html,test",
    "file:///etc/passwd",
    "/relative",
    "",
    "https://user:password@example.org/",
  ])
    expect(safeReviewSource(input)).toBeNull();
});
