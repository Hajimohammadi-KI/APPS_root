import { readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { digest, parseManifest, validateRun, type PredictionRun } from "./lib/model-benchmark";
import { isRecord } from "../shared/learning-core/src/automaticity/contracts";

const root = resolve(import.meta.dir, "..");
const args=Bun.argv.slice(2),arg=(name:string)=>args.find(value=>value.startsWith(`--${name}=`))?.slice(name.length+3);
if(args.some(value=>value.startsWith("--")&&!value.startsWith("--manifest=")&&!value.startsWith("--output=")))throw Error("Unknown diagnostic summary option");
if(arg("manifest")&&!arg("output"))throw Error("An alternate manifest requires a separate --output path to preserve the original comparison");
const folders = args.filter(value=>!value.startsWith("--"));
if (!folders.length) throw Error("Pass the directories containing the real development runs.");
const manifestPath=arg("manifest")??"docs/model-evaluation/development.json",outputPath=arg("output")??"docs/model-evaluation/development-comparison.json";
const manifest = parseManifest(JSON.parse(await readFile(resolve(root, manifestPath), "utf8")));
const candidates = [];
for (const folder of folders) {
  const runText = await readFile(resolve(root, folder, "run.json"), "utf8");
  const reportText = await readFile(resolve(root, folder, "report.json"), "utf8");
  const run = JSON.parse(runText) as PredictionRun;
  const report: unknown = JSON.parse(reportText);
  validateRun(manifest, run);
  if (run.partition !== "development" || !isRecord(report) || !Array.isArray(report.observations)) throw Error("Development diagnostics only.");
  const observations = report.observations.filter(isRecord);
  const languages = ["en", "de"].map((language) => {
    const rows = manifest.cases.filter(row => row.language === language && row.partition === "development");
    const ids = new Set(rows.map(row => row.id));
    const predictions = run.predictions.filter(row => ids.has(row.caseId));
    const times = predictions.map(row => row.latencyMs).filter((value): value is number => typeof value === "number").sort((a, b) => a - b);
    const annotated = observations.filter(row => typeof row.caseId === "string" && ids.has(row.caseId) && Array.isArray(row.matches) && row.matches.length > 0);
    const suggestedSpans = annotated.flatMap(row => (row.matches as unknown[]).filter(isRecord).map(match => {
      const input = rows.find(item => item.id === row.caseId)!;
      return {caseId: input.id, draftCategory: input.category, text: input.response.slice(Number(match.offset), Number(match.offset) + Number(match.length)), rule: isRecord(match.rule) ? match.rule.id : null};
    }));
    return {
      language, cases: rows.length,
      pass: predictions.filter(row => row.verdict === "pass").length,
      needsRepair: predictions.filter(row => row.verdict === "needs_repair").length,
      targetNotObserved: predictions.filter(row => row.verdict === "target_not_observed").length,
      abstentions: predictions.filter(row => row.verdict === "not_assessed").length,
      annotationCases: annotated.length,
      providerFailures: observations.filter(row => typeof row.caseId === "string" && ids.has(row.caseId) && typeof row.error === "string").length,
      byDraftCategory: [...new Set(rows.map(row => row.category))].map(category => ({category, cases: rows.filter(row => row.category === category).length, annotationCases: annotated.filter(row => rows.find(item => item.id === row.caseId)?.category === category).length})),
      medianLatencyMs: times.length ? (times[Math.floor((times.length - 1) / 2)]! + times[Math.ceil((times.length - 1) / 2)]!) / 2 : null,
      p95LatencyMs: times[Math.ceil(times.length * 0.95) - 1] ?? null,
      reportedApiCost: predictions.every(row => typeof row.cost === "number") ? predictions.reduce((sum, row) => sum + (row.cost ?? 0), 0) : null,
      suggestedSpans,
    };
  });
  candidates.push({candidate: run.candidate, startedAt: run.startedAt, finishedAt: run.finishedAt, source: {folder:relative(root,resolve(root,folder)).replace(/\\/g,"/"), runSha256: digest(runText), reportSha256: digest(reportText)}, languages});
}
const result = {
  schemaVersion: 1, benchmarkVersion: manifest.version, partition: "development", approved: false,
  manifestPath,manifestSha256:digest(JSON.stringify(manifest)),manifestPurpose:manifest.purpose,
  limit: "Original model-authored drafts, no independent human labels. Counts against draft categories are diagnostics, not accuracy estimates. Latency includes cold language initialization and adapter work. Local device and energy costs are unmeasured. LanguageTool suggestions do not assess task target or meaning; zero suggestions cannot award success.",
  candidates,
};
await writeFile(resolve(root, outputPath), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
