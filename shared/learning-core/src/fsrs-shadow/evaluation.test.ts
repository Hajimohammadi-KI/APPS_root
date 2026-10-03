import { expect, test } from "bun:test";
import { evaluateFsrsShadowHistory } from "./scheduler";
const first = {
  eventId: "first",
  reviewedAt: "2026-08-01T10:00:00.000Z",
  rating: 3 as const,
};
const second = {
  eventId: "second",
  reviewedAt: "2026-08-04T10:00:00.000Z",
  rating: 3 as const,
};
test("shadow predictions never see the current outcome and exclude the initial review", () => {
  const passed = evaluateFsrsShadowHistory([first, second]),
    failed = evaluateFsrsShadowHistory([first, { ...second, rating: 1 }]);
  expect(passed.predictions).toHaveLength(1);
  expect(passed.predictions[0]!.probability).toBe(
    failed.predictions[0]!.probability,
  );
  expect(passed.predictions[0]!.outcome).toBe(1);
  expect(failed.predictions[0]!.outcome).toBe(0);
  expect(passed.learnerScheduleApplied).toBe(false);
  expect(passed.learnerBenefitEstablished).toBe(false);
});
test("empty or single-review histories cannot invent calibration scores", () => {
  expect(evaluateFsrsShadowHistory([]).brierScore).toBeNull();
  expect(evaluateFsrsShadowHistory([first]).logLoss).toBeNull();
});
test("shadow predictions preserve input and reject duplicate, simultaneous or invalid reviews", () => {
  const input = [second, first],
    before = JSON.stringify(input);
  expect(evaluateFsrsShadowHistory(input).predictions).toHaveLength(1);
  expect(JSON.stringify(input)).toBe(before);
  expect(() => evaluateFsrsShadowHistory([first, first])).toThrow();
  expect(() =>
    evaluateFsrsShadowHistory([
      first,
      { ...second, reviewedAt: first.reviewedAt },
    ]),
  ).toThrow();
  expect(() =>
    evaluateFsrsShadowHistory([{ ...first, reviewedAt: "invalid" }]),
  ).toThrow();
});
