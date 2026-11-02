import { expect, test } from "bun:test";
import { skillReport } from "./overview";

const mode = (
  modality: "writing" | "speaking",
  values: Partial<{
    attempts: number;
    assessed: number;
    accuracy: number | null;
    delayed: number;
    transfer: number;
  }> = {},
) => ({
  modality,
  attempts: 0,
  assisted: 0,
  assessed: 0,
  accuracy: null,
  delayed: 0,
  transfer: 0,
  timing: [],
  ...values,
});

test("R97 every skill is reported, and a skill without evidence says so", () => {
  const empty = skillReport([mode("writing"), mode("speaking")]);
  expect(empty.map((row) => row.skill)).toEqual([
    "reading",
    "listening",
    "writing",
    "speaking",
    "interaction",
    "transfer",
  ]);
  expect(empty.map((row) => row.status)).toEqual([
    "not_measured",
    "not_measured",
    "none",
    "none",
    "not_measured",
    "none",
  ]);
  const report = skillReport([
    mode("writing", {
      attempts: 9,
      assessed: 4,
      accuracy: 0.75,
      delayed: 1,
      transfer: 2,
    }),
    mode("speaking", { attempts: 3 }),
  ]);
  expect(report.find((row) => row.skill === "writing")).toEqual({
    skill: "writing",
    status: "evidence",
    checked: 4,
    accuracy: 0.75,
    delayed: 1,
    saved: 9,
  });
  // Saved speech without a listener's review is practice, not evidence.
  expect(report.find((row) => row.skill === "speaking")?.status).toBe(
    "practice_only",
  );
  expect(report.find((row) => row.skill === "transfer")).toMatchObject({
    status: "evidence",
    checked: 2,
  });
});
