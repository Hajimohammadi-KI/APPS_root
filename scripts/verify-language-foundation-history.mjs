// Run with Bun. Git is read-only; historical code runs only inside artifacts.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const en = "Apps/English/English-Automaticity";
const de = "Apps/Deutsch-Automaticity";
const git = (...args) => execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
const revision = git("rev-parse", "ee98a08^").toString().trim();
const output = resolve(root, `artifacts/language-foundation-history/${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(output, { recursive: true });
const digest = value => createHash("sha256").update(value).digest("hex");
const report = {
  createdAt: new Date().toISOString(), historicalRevision: revision,
  currentRevision: git("rev-parse", "HEAD").toString().trim(),
  scope: "Retrospective replay of exact pre-fix Git source, recorded today. Not an original pre-fix receipt. Synthetic inputs only; no learner or model qualification.",
  buildNote: "Historical source bytes are unchanged. External package resolution uses the existing app dependencies. The writing caller is extracted by TypeScript AST; UI/storage sinks are captured, not mounted.",
  sources: [], cases: [], status: "running",
};
const coreFiles = git("ls-tree", "-r", "--name-only", revision, "shared/learning-core/src").toString().trim().split(/\r?\n/).filter(path => path.endsWith(".ts") && !path.endsWith(".test.ts"));
const currentCoreFiles = (await readdir(resolve(root, "shared/learning-core/src"), {recursive: true})).filter(path => path.endsWith(".ts") && !path.endsWith(".test.ts")).map(path => "shared/learning-core/src/" + path.replaceAll("\\", "/"));
const files = [...new Set([...coreFiles, ...currentCoreFiles]),
  `${en}/apps/api/src/assessment/assessment.service.ts`, `${en}/apps/api/src/assessment/assessment.contract.ts`,
  `${en}/apps/web/lib/assessment.ts`, `${en}/apps/web/lib/utils.ts`, `${en}/apps/web/lib/automaticity-analysis.ts`,
  `${en}/apps/web/features/screens/automaticity-screen.tsx`, `${de}/packages/domain/src/evaluation.ts`,
];
for (const path of files) {
  const before = path.startsWith("shared/") && !coreFiles.includes(path) ? null : git("show", `${revision}:${path}`), after = await readFile(resolve(root, path));
  for (const [label, bytes] of [["before", before], ["after", after]]) {
    if (bytes === null) continue;
    const target = resolve(output, label, path);
    await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes);
  }
  report.sources.push({ path, beforeSha256: before === null ? null : digest(before), afterSha256: digest(after) });
}
const appRequire = createRequire(resolve(root, en, "package.json"));
const apiRequire = createRequire(resolve(root, en, "apps/api/package.json"));
const webRequire = createRequire(resolve(root, en, "apps/web/package.json"));
const coreRequire = createRequire(resolve(root, en, "packages/learning-core/package.json"));
const ts = appRequire("typescript");
const imported = {};
for (const label of ["before", "after"]) {
  const base = resolve(output, label);
  const entry = resolve(base, "entry.ts");
  const from = path => JSON.stringify("./" + path);
  await writeFile(entry, [
    `export {AssessmentService} from ${from(`${en}/apps/api/src/assessment/assessment.service.ts`)};`,
    `export {evaluateResponse} from ${from(`${en}/apps/web/lib/assessment.ts`)};`,
    `export * as de from ${from(`${de}/packages/domain/src/evaluation.ts`)};`,
    `export {buildAttemptVerticalSlice, normalizeDailySessionMinutes} from ${from("shared/learning-core/src/index.ts")};`,
  ].join("\n"));
  const bundle = await Bun.build({
    entrypoints: [entry], target: "bun", format: "esm", external: ["class-transformer", "class-validator"],
    plugins: [{ name: "resolve-existing-app-dependencies", setup(build) {
      build.onResolve({ filter: /^@\/lib\/utils$/ }, () => ({ path: resolve(base, en, "apps/web/lib/utils.ts") }));
      build.onResolve({ filter: /^(?:@nestjs\/common|zod)$/ }, args => ({ path: apiRequire.resolve(args.path) }));
      build.onResolve({ filter: /^(?:clsx|tailwind-merge)$/ }, args => ({ path: webRequire.resolve(args.path) }));
      build.onResolve({ filter: /^ts-fsrs$/ }, args => ({ path: coreRequire.resolve(args.path) }));
    } }],
  });
  assert(bundle.success, bundle.logs.map(String).join("\n"));
  const modulePath = resolve(base, "compiled.mjs");
  await writeFile(modulePath, await bundle.outputs[0].text());
  imported[label] = await import(pathToFileURL(modulePath).href);
}
async function check(id, expected, run) {
  const row = { id, expected, status: "running" }; report.cases.push(row);
  try { row.before = await run(imported.before, "before"); row.after = await run(imported.after, "after"); row.status = "passed"; }
  catch (error) { row.status = "failed"; row.error = String(error); }
}
const originalFetch = globalThis.fetch;
const text = "I can explain the result.";
try {
  for (const [name, payload] of [["missing", {}], ["null", {matches: null}], ["object", {matches: {}}]]) {
    await check(`upstream-${name}-matches`, "Pre-fix accepts malformed data as clean; current service rejects it.", async (api, label) => {
      globalThis.fetch = async () => Response.json(payload);
      let value, rejected = false;
      try { value = await new api.AssessmentService().assess({ text, language: "en-US" }); } catch { rejected = true; }
      assert.equal(rejected, label === "after");
      if (!rejected) assert.deepEqual(value.matches, []);
      return { rejected, returnedClean: !rejected && value.matches.length === 0 };
    });
  }
  await check("upstream-valid-empty-control", "Both versions accept a real empty matches array.", async api => {
    globalThis.fetch = async () => Response.json({ matches: [] });
    const value = await new api.AssessmentService().assess({ text, language: "en-US" });
    assert.deepEqual(value.matches, []); return { accepted: true };
  });
  await check("english-client-malformed-response", "Pre-fix client crashes on missing matches; current client returns an unassessed practice result. Direct client false-success was not reproduced.", async (api, label) => {
    globalThis.fetch = async () => Response.json({ original: text, corrected: text, changed: false, online: true });
    let result, error;
    try { result = await api.evaluateResponse(text, { grammar: {title: "Modal verbs", rule: "modal plus base form", examples: [text]}, minWords: 4, minSentences: 1, requiredTargetUses: 1 }, { onlineFeedback: true, apiBaseUrl: "http://synthetic.invalid" }); }
    catch (caught) { error = String(caught); }
    assert.equal(Boolean(error), label === "before");
    if (result) assert.equal(result.masteryEligible, false);
    return error ? { error } : { online: result.online, masteryEligible: result.masteryEligible };
  });
  for (const input of ["Bonjour tout le monde", "Hola amigo", "Hotel"]) {
    await check(`language-${input}`, "Pre-fix defaults uncertain Latin text to German; current detector abstains.", (api, label) => {
      const detected = api.de.detectAnswerLanguage(input);
      assert.equal(detected === "de", label === "before"); return { detected };
    });
  }
  await check("german-capitalization", "Pre-fix erases noun capitalization; current closed comparison preserves it.", (api, label) => {
    const result = api.de.analyzeClosedAnswer("Ich lese ein buch.", "Ich lese ein Buch.");
    assert.equal(result.correct, label === "before"); return { correct: result.correct };
  });
  await check("german-short-valid-alternative", "A short authored German answer must remain usable; current code accepts the declared alternative.", api => {
    const result = api.de.analyzeClosedAnswer("Hotel", "Hotel");
    assert.equal(result.correct, true); return { correct: result.correct };
  });
  const attempt = {
    attemptId: "synthetic-foundation", occurredAt: "2026-09-05T10:00:00.000Z", language: "en", cefrLevel: "B1", contentVersion: "fixture-1",
    topic: "Modal verbs", targetForm: "can + base form", prompt: "Describe an ability", mode: "transfer", inputText: text, correctedText: text,
    targetHit: true, accuracyScore: 100, attemptVerified: true, assessedBy: "online", sessionMinutes: 15, fromDueReview: true,
  };
  await check("due-and-transfer-flags", "Flags without prior response/time/context cannot establish delayed recall or novelty.", (api, label) => {
    const {evidence} = api.buildAttemptVerticalSlice(attempt);
    assert.equal(evidence.gates.delayedRecall, label === "before");
    assert.equal(evidence.gates.novelTransfer, label === "before");
    return { delayedRecall: evidence.gates.delayedRecall, novelTransfer: evidence.gates.novelTransfer };
  });
  await check("exposed-repair-is-practice", "Exposed copied repair cannot count as independent output.", (api, label) => {
    const {evidence} = api.buildAttemptVerticalSlice({...attempt, mode: "repair", independence: {unaided: false, firstAttempt: false, exampleExposed: true, solutionExposed: true}});
    assert.equal(evidence.masteryEligible, label === "before"); return { masteryEligible: evidence.masteryEligible };
  });
  await check("writing-store-verification-conflict", "The same unassessed output must remain unverified in both legacy stores.", async (api, label) => {
    const source = await readFile(resolve(output, label, en, "apps/web/features/screens/automaticity-screen.tsx"), "utf8");
    const ast = ts.createSourceFile("screen.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let functionText;
    const visit = node => { if (ts.isFunctionDeclaration(node) && node.name?.text === "saveWriting") functionText = node.getText(ast); ts.forEachChild(node, visit); };
    visit(ast); assert(functionText);
    await writeFile(resolve(output, label, "exact-saveWriting.ts"), functionText);
    const js = ts.transpileModule(functionText, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None}}).outputText;
    let saved, evidence; const plans = {};
    const deps = {
      analyzeLessonOutput: async () => ({targetHit: true, score: 100, verified: false, masteryEligible: false, corrected: text}),
      journal: text, setJournalAnalysis() {}, writePlan(k,v) {plans[k]=v;}, key: "fixture", topic: "Modal verbs", grammar: {level: "B1", rule: "can + base"},
      recordAttempt(value) {saved=value;}, appendLearningEvidenceBundleToStorage(_storage, bundle) {evidence=bundle.evidence;},
      window: {localStorage: {}}, buildAttemptVerticalSlice: api.buildAttemptVerticalSlice,
      normalizeDailySessionMinutes: api.normalizeDailySessionMinutes, missionMinutes: 15, addIssuesToErrorWorkshop() {}, setMessage() {},
    };
    // Exact function body from each revision. Only its environment is synthetic.
    await new Function("deps", `with(deps){return(async()=>{${js}\nawait saveWriting();})()}`)(deps);
    assert.equal(saved.verified, false);
    assert.equal(evidence.verification.status === "verified", label === "before");
    if (label === "after") { assert.equal(plans["fixture:writing"], "unassessed"); assert.equal(evidence.masteryEligible, false); }
    return { appVerified: saved.verified, evidenceVerified: evidence.verification.status === "verified", completion: plans["fixture:writing"], functionSha256: digest(functionText) };
  });
} finally {
  globalThis.fetch = originalFetch;
  report.status = report.cases.length === 13 && report.cases.every(row => row.status === "passed") ? "passed" : "failed";
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({status: report.status, cases: report.cases.length, failures: report.cases.filter(row=>row.status!=="passed"), output}, null, 2));
}
assert.equal(report.status, "passed");
