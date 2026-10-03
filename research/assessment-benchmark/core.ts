import { createHash } from "node:crypto";
export const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export interface Edit { start: number; end: number; type: string; replacement: string; annotator: string }
export interface Sentence { text: string; edits: Edit[] }
export function parseM2(source: string): Sentence[] {
  return source.trim().split(/\r?\n\s*\r?\n/).map(block => {
    const lines = block.split(/\r?\n/);
    if (!lines[0]?.startsWith("S ")) throw Error("Invalid M2 sentence");
    const text = lines[0].slice(2), size = text.split(" ").length;
    const edits = lines.slice(1).map(line => {
      const fields = line.split("|||"), span = /^A (-?\d+) (-?\d+)$/.exec(fields[0] ?? "");
      if (!span || fields.length !== 6) throw Error("Invalid M2 edit");
      const start = Number(span[1]), end = Number(span[2]);
      if (fields[1] !== "noop" && (start < 0 || start > end || end > size)) throw Error("Invalid M2 span");
      return { start, end, type: fields[1]!, replacement: fields[2]!, annotator: fields[5]! };
    });
    if (!edits.length) throw Error("Missing explicit annotations");
    return { text, edits };
  });
}
// All annotators must agree that the sentence has an error / no correction.
// Uncorrectable (UNK) and mixed annotator verdicts are kept out of diagnostics.
export function referenceLabel(sentence: Sentence): "error" | "clean" | "ambiguous" {
  if (sentence.edits.some(e => /(^|:)(UNK|Um)$/i.test(e.type))) return "ambiguous";
  const annotators = [...new Set(sentence.edits.map(e => e.annotator))];
  const changed = annotators.map(a => sentence.edits.some(e => e.annotator === a && e.type !== "noop"));
  return changed.every(Boolean) ? "error" : changed.every(x => !x) ? "clean" : "ambiguous";
}
export function wilson(successes: number, n: number): { low: number; high: number } | null {
  if (!Number.isInteger(n) || !Number.isInteger(successes) || n < 0 || successes < 0 || successes > n) throw Error("Invalid counts");
  if (!n) return null;
  const z = 1.959963984540054, p = successes / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return { low: Math.max(0, c - h), high: Math.min(1, c + h) };
}
export type Verdict = "correct" | "incorrect" | "uncertain";
export function writingMetrics(rows: { label: "error" | "clean"; verdict: Verdict }[]) {
  const errors = rows.filter(r => r.label === "error"), clean = rows.filter(r => r.label === "clean");
  const falseAccept = errors.filter(r => r.verdict === "correct").length, trueAccept = clean.filter(r => r.verdict === "correct").length;
  const falseAcceptance95 = wilson(falseAccept, errors.length), correctAcceptance95 = wilson(trueAccept, clean.length);
  const detectedErrors = errors.filter(r => r.verdict === "incorrect").length;
  const errorDetection95 = wilson(detectedErrors, errors.length);
  return { count: rows.length, errors: errors.length, clean: clean.length, falseAccept, trueAccept,
    falseAcceptanceRate: errors.length ? falseAccept / errors.length : null,
    correctAcceptanceRate: clean.length ? trueAccept / clean.length : null,
    abstentions: rows.filter(r => r.verdict === "uncertain").length,
    coverage: rows.length ? rows.filter(r => r.verdict !== "uncertain").length / rows.length : 0,
    falseAcceptance95, correctAcceptance95, detectedErrors, errorDetection95,
    protocolVersion: 3,
    diagnosticScreenPassed: errors.length >= 100 && clean.length >= 100 && falseAccept === 0 && falseAcceptance95!.high <= .05 && correctAcceptance95!.low >= .9 && errorDetection95!.low >= .9 };
}
export function regressionMetrics(expected: number[], actual: number[]) {
  if (!expected.length || expected.length !== actual.length || [...expected,...actual].some(x => !Number.isFinite(x))) throw Error("Invalid paired scores");
  const mean = (x: number[]) => x.reduce((a,b) => a+b, 0)/x.length;
  const ex = mean(expected), ac = mean(actual);
  let product = 0, squareX = 0, squareY = 0;
  for (let i = 0; i < expected.length; i++) { const x=expected[i]!-ex,y=actual[i]!-ac; product+=x*y;squareX+=x*x;squareY+=y*y; }
  const correlation = squareX > 1e-12 && squareY > 1e-12 ? product / Math.sqrt(squareX*squareY) : null;
  const mae = mean(actual.map((x,i) => Math.abs(x-expected[i]!)));
  return { count: actual.length, mae, correlation, diagnosticScreenPassed: actual.length >= 100 && actual.every(x=>x>=0&&x<=10) && mae <= 1 && correlation !== null && correlation >= .8 };
}
