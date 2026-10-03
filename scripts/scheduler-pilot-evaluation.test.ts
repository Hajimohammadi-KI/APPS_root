import { test, expect } from "bun:test";
import { fixture } from "./lib/scheduler-pilot-test-fixture";
import { evaluateSchedulerPilot } from "./lib/scheduler-pilot-evaluation";
import {
  enrollSchedulerPilot,
  schedulerPilotCards,
  recordPilotDelivery,
  stopSchedulerPilot,
} from "../shared/learning-core/src/automaticity/scheduler-pilot";
import type {
  AttemptEvent,
  AssessmentEvent,
} from "../shared/learning-core/src/automaticity/contracts";
const responseAt = "2026-09-11T12:00:00.000Z",
  finalAt = "2026-09-27T12:00:00.000Z";
async function enrolled(language: "en" | "de" = "en") {
  const f = await fixture(language);
  const enrollment = enrollSchedulerPilot(
    f.store,
    f.plan,
    f.digest,
    f.events,
    f.at,
  );
  return { ...f, enrollment };
}
type Fixture = Awaited<ReturnType<typeof enrolled>>;
function answer(
  f: Fixture,
  index: number,
  verdict: "pass" | "needs_repair",
  reviewedAt = responseAt,
) {
  const original = f.events.find(
    (e) => e.id === `attempt-${index}-5`,
  ) as AttemptEvent;
  const prior = f.events.find(
    (e) => e.id === `judge-${index}-5`,
  ) as AssessmentEvent;
  const attempt = {
    ...structuredClone(original),
    id: `response-${index}`,
    at: responseAt,
    timing: { ...original.timing, startedAt: responseAt },
  };
  const assessment = {
    ...structuredClone(prior),
    id: `result-${index}`,
    attemptId: attempt.id,
    at: reviewedAt,
    verdict,
    dimensions: {
      ...prior.dimensions,
      grammar: verdict === "pass" ? ("pass" as const) : ("fail" as const),
    },
  };
  f.events.push(attempt, assessment);
}
function deliver(f: Fixture, index: number) {
  const cards = schedulerPilotCards(f.plan, f.enrollment, f.events, responseAt);
  recordPilotDelivery(f.store, f.plan, f.enrollment, cards[index]!, responseAt);
}
const evaluate = (f: Fixture) =>
  evaluateSchedulerPilot(
    f.pack,
    f.approvals,
    f.plan,
    f.events,
    f.store.data,
    finalAt,
  );
for (const language of ["en", "de"] as const)
  test(`${language}: reviews after the experiment window score original responses, including failures`, async () => {
    const f = await enrolled(language);
    deliver(f, 0);
    deliver(f, 1);
    answer(f, 0, "pass", finalAt);
    answer(f, 1, "needs_repair", finalAt);
    const report = await evaluate(f);
    expect(report.observations.map((r) => r.outcome)).toEqual(["pass", "fail"]);
    expect(report.arms.map((r) => [r.arm, r.assessed, r.accuracy])).toEqual([
      ["baseline", 1, 0],
      ["fsrs", 1, 1],
    ]);
    expect(report.causalBenefitEstablished).toBe(false);
  });
test("missing, unlogged and unapproved outcomes are not successes", async () => {
  const f = await enrolled();
  expect((await evaluate(f)).observations.map((r) => r.outcome)).toEqual([
    "missing",
    "missing",
  ]);
  answer(f, 0, "pass");
  expect((await evaluate(f)).observations[0]!.outcome).toBe(
    "unlogged_response",
  );
  const g = await enrolled();
  deliver(g, 0);
  answer(g, 0, "pass");
  (g.events.at(-1) as AssessmentEvent).evaluator.reviewId =
    "unapproved-procedure";
  expect((await evaluate(g)).observations[0]!.outcome).toBe("unassessed");
});
test("withdrawal and a failed withdrawal archive exclude later practice", async () => {
  const f = await enrolled();
  stopSchedulerPilot(f.store, "en", "2026-09-07T12:00:00.000Z");
  answer(f, 0, "pass");
  expect((await evaluate(f)).observations.map((r) => r.outcome)).toEqual([
    "withdrawn",
    "withdrawn",
  ]);
  const g = await enrolled();
  g.store.fail = true;
  expect(() => stopSchedulerPilot(g.store, "en", responseAt)).toThrow();
  expect((await evaluate(g)).observations.map((r) => r.outcome)).toEqual([
    "withdrawal_time_unknown",
    "withdrawal_time_unknown",
  ]);
});
test("tampered baseline and changed delivery bindings are rejected", async () => {
  const f = await enrolled();
  const key = [...f.store.data.keys()].find((k) => k.includes(":enrollment:"))!;
  const record = JSON.parse(f.store.data.get(key)!);
  record.baseline = [];
  f.store.data.set(key, JSON.stringify(record));
  await expect(evaluate(f)).rejects.toThrow("Baseline snapshot");
  const g = await enrolled();
  deliver(g, 0);
  const dk = [...g.store.data.keys()].find((k) => k.includes(":delivery:"))!;
  const delivery = JSON.parse(g.store.data.get(dk)!);
  delivery.arm = "baseline";
  g.store.data.set(dk, JSON.stringify(delivery));
  await expect(evaluate(g)).rejects.toThrow("Invalid delivery");
});
