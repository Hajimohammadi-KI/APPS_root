import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash, writingMetrics, type Verdict } from "./core";
import { attestWritingServer } from "./attest-writing-server";
import { readBoundedJson, transformerConfigurationSha256 } from "../../shared/learning-core/src/automaticity/transformer";
import { confirmsUnchangedText, textPassCheckRequest } from "../../shared/learning-core/src/automaticity/text-pass-check";

// Resume the unchanged first two stages from their frozen outcomes. This is an
// offline staged diagnostic, not an end-to-end latency run or fresh holdout.
const parent = resolve(import.meta.dir, "runs/writing-pass-review-v1");
const output = resolve(import.meta.dir, "runs/writing-text-check-v1");
const parentReport = await Bun.file(resolve(parent, "public-report.json")).json();
const parentConfig = await Bun.file(resolve(parent, "config.json")).json();
const bytes = await Bun.file(resolve(parent, "predictions.jsonl")).text();
if (hash(bytes) !== parentReport.predictionsSha256 || parentConfig.promptVersion !== "grammar-review-2026-10-03.4") throw Error("Changed parent outcomes");
type Row = { id: string; language: "en" | "de"; label: "error" | "clean"; text: string; verdict: Verdict; elapsedMs: number; calls: number };
const rows = bytes.trim().split("\n").map(line => JSON.parse(line) as Row);
if (rows.length !== 453 || new Set(rows.map(row => row.id)).size !== 453) throw Error("Incomplete parent run");
await mkdir(output, { recursive: true });
const file = Bun.file(resolve(output, "predictions.jsonl"));
if (await file.exists()) throw Error("Do not overwrite a frozen run");
const config = parentConfig.config;
const configurationSha256 = await transformerConfigurationSha256(config);
const manifest = {
  schemaVersion: 1, createdAt: new Date().toISOString(), configurationSha256,
  parentConfigurationSha256: parentReport.configurationSha256, parentPredictionsSha256: hash(bytes),
  sourceSelectionSha256: parentReport.selectionSha256, cases: rows.length,
  limitations: "Offline staged diagnostic on the same development cases: reuse frozen outcomes of the unchanged first two requests, then invoke the added text-only checker for every retained pass. Remaining timeout is 60 seconds minus recorded parent elapsed time; this is not end-to-end latency validation. All three reviews use the same model and can repeat errors. No independent holdout, app-task qualification or human release approval.",
};
await Bun.write(resolve(output, "identity-pre-run.json"), JSON.stringify(await attestWritingServer(), null, 2) + "\n");
await Bun.write(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
const key = (await Bun.file(resolve(import.meta.dir, "data/llama-api-key.local")).text()).trim();
const writer = file.writer(), results: (Row & { textCheck: string })[] = [];
let cursor = 0;
async function worker() {
  while (cursor < rows.length) {
    const row = rows[cursor++]!;
    let verdict = row.verdict, textCheck = "not_needed";
    if (verdict === "correct") {
      verdict = "uncertain";
      try {
        const remaining = config.timeoutMs - row.elapsedMs;
        if (remaining < 100) throw Error("Shared deadline exhausted");
        const body = await readBoundedJson(await fetch(config.endpoint, {
          method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(remaining), redirect: "error",
          body: JSON.stringify(textPassCheckRequest(row.language, row.text, config.modelAlias)),
        })) as { model?: string; system_fingerprint?: string; choices?: { finish_reason?: string; message?: { content?: string } }[] };
        const choice = body.choices?.[0];
        if (body.model !== config.modelAlias || body.system_fingerprint !== config.runtimeFingerprint || body.choices?.length !== 1 || choice?.finish_reason !== "stop") throw Error("Changed identity or incomplete response");
        const value: unknown = JSON.parse(choice.message?.content ?? "");
        const confirmed = confirmsUnchangedText(value, row.text);
        verdict = confirmed ? "correct" : "uncertain";
        textCheck = confirmed ? "confirmed_unchanged" : "not_confirmed";
      } catch (error) { textCheck = error instanceof Error ? error.message : "Check failed"; }
    }
    const result = { ...row, verdict, textCheck };
    results.push(result); writer.write(JSON.stringify(result) + "\n"); await writer.flush();
    if (results.length % 64 === 0) console.log(JSON.stringify({ completed: results.length, total: rows.length }));
  }
}
try { await Promise.all(Array.from({ length: 4 }, worker)); } finally { await writer.end(); }
await Bun.write(resolve(output, "identity-post-run.json"), JSON.stringify(await attestWritingServer(), null, 2) + "\n");
const report = {
  schemaVersion: 1, completedAt: new Date().toISOString(), configurationSha256,
  parentPredictionsSha256: manifest.parentPredictionsSha256, predictionsSha256: hash(await Bun.file(resolve(output, "predictions.jsonl")).text()),
  count: results.length, textCheckCases: results.filter(row => row.textCheck !== "not_needed").length,
  languages: Object.fromEntries(["en", "de"].map(language => [language, {
    previous: parentReport.languages[language].previous,
    twoTaskReviews: parentReport.languages[language].candidate,
    candidate: writingMetrics(results.filter(row => row.language === language)),
  }])), releaseEligible: false, limitations: manifest.limitations,
};
await Bun.write(resolve(output, "public-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
