import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const [sourceArgument, requiredMarker] = process.argv.slice(2);

if (!sourceArgument || !requiredMarker) {
  throw new Error("Usage: node build-roadmap-site.mjs <source-html> <required-marker>");
}

const siteRoot = process.cwd();
const sourcePath = resolve(siteRoot, sourceArgument);
const outputDirectory = resolve(siteRoot, "dist");
const outputPath = resolve(outputDirectory, "index.html");
const source = await readFile(sourcePath, "utf8");

const requiredChecks = [
  [source.startsWith("<!doctype html>"), "doctype"],
  [source.includes('<html lang="fa" dir="rtl">'), "Persian RTL document metadata"],
  [source.includes(requiredMarker), `marker: ${requiredMarker}`],
  [/v\d+\.\d+/.test(source), "version marker"],
  [source.trimEnd().endsWith("</html>"), "closing html element"],
];

for (const [passed, description] of requiredChecks) {
  if (!passed) {
    throw new Error(`Roadmap source is missing ${description}: ${sourcePath}`);
  }
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await copyFile(sourcePath, outputPath);

const output = await readFile(outputPath, "utf8");
if (output !== source) {
  throw new Error(`Built artifact differs from its authoritative source: ${outputPath}`);
}

console.log(`Built ${outputPath} from ${sourcePath}`);
