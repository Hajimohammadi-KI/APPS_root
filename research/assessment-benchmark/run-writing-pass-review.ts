import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash, writingMetrics, type Verdict } from "./core";
import { attestWritingServer } from "./attest-writing-server";
import {
  proposeTransformerFeedback, transformerConfigurationSha256,
  TRANSFORMER_PROMPT_VERSION, type TransformerConfig,
} from "../../shared/learning-core/src/automaticity/transformer";

// A diagnostic re-use of the public v1 subset, never an independent holdout.
// Source texts/references stay local; only aggregates are copied into the apps.
const original = resolve(import.meta.dir, "runs/writing-qwen3-4b-v1");
const directory = resolve(import.meta.dir, "runs/writing-pass-review-v1");
const casesBytes = await Bun.file(resolve(original, "cases.jsonl")).text();
const priorBytes = await Bun.file(resolve(original, "predictions.jsonl")).text();
const manifest = await Bun.file(resolve(original, "manifest.json")).json();
if (hash(casesBytes) !== manifest.selectionSha256) throw Error("Frozen cases changed");
type Case = { id: string; language: "en" | "de"; source: string; text: string; label: "error" | "clean" };
type Row = Case & { verdict: Verdict; calls: number; elapsedMs: number; failure?: string };
const cases = casesBytes.trim().split("\n").map(line => JSON.parse(line) as Case)
  .filter(row => row.source !== "LOCNESS");
if (cases.some(row => !["Write & Improve", "falko", "merlin"].includes(row.source))) throw Error("Unknown source");
const previous = priorBytes.trim().split("\n").map(line => JSON.parse(line) as Case & { verdict: Verdict });
const config: TransformerConfig = {
  candidateId: "qwen3-4b-pass-review-diagnostic", version: "2026-10-03.1",
  modelAlias: "Qwen3-4B-Q4_K_M",
  modelSha256: "7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5",
  runtimeFingerprint: "b11146-7fe450e19", endpoint: "http://127.0.0.1:8769/v1/chat/completions", timeoutMs: 60000,
};
const taskPrompt = "Proofread this original sentence as standard written language. Check grammar, spelling, capitalization, punctuation and word choice; do not change style. No additional construction or task facts are required, so targetObserved and meaningPreserved are true unless the sentence is unintelligible. Missing context or genuine ambiguity requires not_assessed. A correct sentence must be accepted unchanged.";
const configurationSha256 = await transformerConfigurationSha256(config);
await mkdir(directory, { recursive: true });
const predictions = Bun.file(resolve(directory, "predictions.jsonl"));
if (await predictions.exists()) throw Error("Existing run: create a new version instead of overwriting");
const identity = await attestWritingServer();
await Bun.write(resolve(directory, "identity-pre-run.json"), JSON.stringify(identity, null, 2) + "\n");
await Bun.write(resolve(directory, "config.json"), JSON.stringify({ config, configurationSha256, promptVersion: TRANSFORMER_PROMPT_VERSION, taskPrompt }, null, 2) + "\n");
const publicCases = cases.map(row => JSON.stringify(row)).join("\n") + "\n";
const runManifest = {
  schemaVersion: 1, createdAt: new Date().toISOString(), selectionSha256: hash(publicCases),
  sourceSelectionSha256: hash(casesBytes), previousPredictionsSha256: hash(priorBytes), count: cases.length,
  protocolVersion: 3, policy: "Zero observed false accepts plus prior confidence, correct-acceptance and error-detection minimums; abstaining on everything fails.",
  limitation: "Same frozen public corpus subset as v1; development diagnostic, not a new holdout. Both reviews use the same model and may repeat errors. Changes include prompts, deterministic decoding and two-pass policy. Corpus labels include spelling, punctuation and word choice, not only grammar. No app task compliance qualification. No human release approval.",
};
await Bun.write(resolve(directory, "manifest.json"), JSON.stringify(runManifest, null, 2) + "\n");
await Bun.write(resolve(directory, "cases.jsonl"), publicCases);
const key = (await Bun.file(resolve(import.meta.dir, "data/llama-api-key.local")).text()).trim();
const writer = predictions.writer(), rows: Row[] = [];
let cursor = 0;
async function worker() {
  while (cursor < cases.length) {
    const row = cases[cursor++]!, started = performance.now();
    let calls = 0, verdict: Verdict = "uncertain", failure: string | undefined;
    try {
      const transport = (async (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        calls++;
        const headers = new Headers(init?.headers); headers.set("authorization", `Bearer ${key}`);
        return fetch(url, { ...init, headers });
      }) as typeof fetch;
      const feedback = await proposeTransformerFeedback({ language: row.language, modality: "writing", constructionId: `${row.language}.diagnostic`, prompt: taskPrompt, response: row.text }, config, transport);
      verdict = feedback.verdict === "pass" ? "correct" : feedback.verdict === "needs_repair" ? "incorrect" : "uncertain";
    } catch (error) { failure = error instanceof Error ? error.message : "Inference failed"; }
    const result = { ...row, verdict, calls, elapsedMs: Math.round(performance.now() - started), ...(failure ? { failure } : {}) };
    rows.push(result); writer.write(JSON.stringify(result) + "\n"); await writer.flush();
    if (rows.length % 32 === 0) console.log(JSON.stringify({ completed: rows.length, total: cases.length }));
  }
}
try { await Promise.all(Array.from({ length: 4 }, worker)); } finally { await writer.end(); }
await Bun.write(resolve(directory, "identity-post-run.json"), JSON.stringify(await attestWritingServer(), null, 2) + "\n");
if (rows.length !== cases.length || new Set(rows.map(row => row.id)).size !== cases.length) throw Error("Missing/duplicate outputs");
const report = {
  schemaVersion: 1, completedAt: new Date().toISOString(), configurationSha256,
  selectionSha256: runManifest.selectionSha256, predictionsSha256: hash(await Bun.file(resolve(directory, "predictions.jsonl")).text()),
  count: rows.length, twoReviewCases: rows.filter(row => row.calls === 2).length,
  failedFirstReviews: rows.filter(row => row.failure).length,
  languages: Object.fromEntries(["en", "de"].map(language => {
    const subset = rows.filter(row => row.language === language), ids = new Set(subset.map(row => row.id));
    const old = previous.filter(row => ids.has(row.id));
    if (old.length !== subset.length) throw Error("Unpaired comparison");
    return [language, { previous: writingMetrics(old), candidate: writingMetrics(subset) }];
  })),
  releaseEligible: false, limitations: runManifest.limitation,
};
await Bun.write(resolve(directory, "public-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
