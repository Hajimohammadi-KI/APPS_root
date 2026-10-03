import { test, expect } from "bun:test";
import { parseM2, referenceLabel, writingMetrics, regressionMetrics, wilson } from "./core";
test("M2 preserves noops, alternate annotators, insertion/deletion and rejects corrupt offsets", () => {
  const s = parseM2("S She walk .\nA 1 2|||R:VERB:SVA|||walks|||REQUIRED|||-NONE-|||0\nA -1 -1|||noop|||-NONE-|||REQUIRED|||-NONE-|||1\n")[0]!;
  expect(referenceLabel(s)).toBe("ambiguous"); expect(s.edits).toHaveLength(2);
  expect(() => parseM2("S a\nA 1 3|||R:X|||b|||REQUIRED|||-NONE-|||0")).toThrow();
});
test("accept-everything and abstain-everything cannot pass", () => {
  const labels = Array.from({length:200},(_,i) => ({label: i<100 ? "error" as const : "clean" as const}));
  for (const verdict of ["correct", "uncertain"] as const) expect(writingMetrics(labels.map(r=>({...r,verdict}))).diagnosticScreenPassed).toBe(false);
  expect(writingMetrics(labels.map(r=>({...r,verdict:r.label==="error"?"incorrect":"correct"}))).diagnosticScreenPassed).toBe(true);
  expect(wilson(0,100)!.high).toBeCloseTo(.0369935,5);
  expect(writingMetrics(labels.map(r=>({...r,verdict:r.label==="error"?"uncertain":"correct"}))).diagnosticScreenPassed).toBe(false);
});
test("audio correlation cannot be manufactured by a constant baseline",()=>{
  expect(regressionMetrics([1,2,3],[2,2,2]).correlation).toBeNull();
  expect(regressionMetrics([1,2,3],[1,2,3]).diagnosticScreenPassed).toBe(false);
  expect(regressionMetrics(Array.from({length:100},(_,i)=>i%10),Array.from({length:100},(_,i)=>i%10)).diagnosticScreenPassed).toBe(true);
  expect(()=>regressionMetrics([1],[NaN])).toThrow();
});

test("even one false acceptance fails the zero-observed-error screen", () => {
  const rows = Array.from({ length: 400 }, (_, i) => ({
    label: i < 200 ? "error" as const : "clean" as const,
    verdict: i > 0 && i < 200 ? "incorrect" as const : "correct" as const,
  }));
  expect(writingMetrics(rows).falseAccept).toBe(1);
  expect(writingMetrics(rows).diagnosticScreenPassed).toBe(false);
});
