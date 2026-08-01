import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const sourcePath = resolve(
  root,
  "StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html",
);
const outputPath = resolve(root, "apps/web/src/data/study-plan.json");

const source = await readFile(sourcePath, "utf8");
const match = source.match(/const DATA=(.*);\r?\nconst KEY=/s);

if (!match?.[1]) {
  throw new Error("Could not locate the legacy DATA payload.");
}

const data = JSON.parse(match[1]) as Record<string, unknown>;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(
  `Extracted legacy V${String(data.version)} data to ${outputPath}`,
);
