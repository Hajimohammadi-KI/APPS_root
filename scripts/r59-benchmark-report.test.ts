import { expect, test } from "bun:test";
import { editDiagnostics, editScopeDiagnostics } from "./r59-benchmark-report";

test("false corrections and disagreements are distinct from abstention and false acceptance", () => {
  const assessment = (verdict: "correct" | "incorrect", correction: string) => ({ verdict, correction, edits: [] });
  const phases = (a: ReturnType<typeof assessment> | null, b: ReturnType<typeof assessment> | null) => [a, b].map(value => ({ assessment: value, raw: null, failure: value ? null : "invalid", requestStarted: true }));
  const diagnostic = editDiagnostics([
    { language: "en", label: "clean", verdict: "incorrect", phases: phases(assessment("incorrect", "x"), assessment("incorrect", "x")) },
    { language: "en", label: "clean", verdict: "uncertain", phases: phases(assessment("incorrect", "x"), assessment("correct", "y")) },
    { language: "en", label: "error", verdict: "correct", phases: phases(assessment("correct", "z"), assessment("correct", "z")) },
    { language: "en", label: "clean", verdict: "uncertain", phases: phases(null, assessment("incorrect", "x")) },
    { language: "de", label: "error", verdict: "uncertain", phases: phases(assessment("incorrect", "a"), assessment("incorrect", "b")) },
  ]);
  expect(diagnostic.en).toEqual({ falseCorrections: 1, firstFalseCorrections: 2, reviewFalseCorrections: 2, reviewDisagreements: 1 });
  expect(diagnostic.de).toEqual({ falseCorrections: 0, firstFalseCorrections: 0, reviewFalseCorrections: 0, reviewDisagreements: 1 });
});

test("scope diagnostics retain context-only and no-op evidence without salvaging invalid edits", () => {
  const result = editScopeDiagnostics([
    { target: "A cat and a cat.", before: "bad context", after: "later", content: JSON.stringify({ edits: [
      { original: "bad context", replacement: "better context" },
      { original: "cat", replacement: "cat" },
      { original: "A cat", replacement: "A cat " },
      { original: "absent", replacement: "new" },
    ] }) },
    { target: "ok", before: "", after: "", content: undefined },
  ]);
  expect(result).toEqual({ quotedEdits: 4, uniqueTargetQuotes: 1, ambiguousTargetQuotes: 1, contextOnlyQuotes: 1, absentQuotes: 1, unchangedEdits: 2, unreadablePhases: 1 });
});
