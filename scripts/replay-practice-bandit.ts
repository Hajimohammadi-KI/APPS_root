import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  isRecord,
  parseAutomaticityEvent,
} from "../shared/learning-core/src/automaticity/contracts";
import { digest } from "./lib/model-benchmark";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { replayPracticeBandit } from "./lib/practice-bandit";
const root = resolve(import.meta.dir, ".."),
  input = Bun.argv.find((arg) => arg.startsWith("--input="))?.slice(8);
if (!input && !Bun.argv.includes("--empty"))
  throw Error(
    "Pass an explicitly exported development log with --input=PATH, or --empty to record current readiness without learner data.",
  );
const bytes = input
  ? await readFile(resolve(root, input), "utf8")
  : JSON.stringify({ decisions: [], events: [] });
if (bytes.length > 20_000_000) throw Error("Development log is too large");
const value: unknown = JSON.parse(bytes);
if (
  !isRecord(value) ||
  !Array.isArray(value.decisions) ||
  !Array.isArray(value.events)
)
  throw Error("Expected decisions and immutable evidence events");
const runtime = await loadRepresentativeRuntime(root),
  now = new Date().toISOString();
const replay = await replayPracticeBandit(
  value.decisions,
  value.events.map((event) => parseAutomaticityEvent(event)),
  runtime.packs,
  now,
);
const folder = resolve(
  root,
  `artifacts/practice-bandit/${now.replace(/[:.]/g, "-")}`,
);
await mkdir(folder, { recursive: true });
await writeFile(
  resolve(folder, "report.json"),
  JSON.stringify(
    {
      ...replay,
      at: now,
      inputSha256: digest(bytes),
      sourceSha256: digest(
        await readFile(resolve(root, "scripts/lib/practice-bandit.ts"), "utf8"),
      ),
      packHashes: runtime.packHashes,
      limit:
        "Offline prototype only. No app policy is changed, no reward comes from model self-grading, and simulated arithmetic cannot establish learner benefit.",
    },
    null,
    2,
  ) + "\n",
  { flag: "wx" },
);
console.log(
  JSON.stringify({
    folder,
    observations: replay.observations.length,
    exclusions: replay.excluded.length,
    active: false,
    readiness: replay.readiness,
  }),
);
