import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

type Scope = {
  name: string;
  englishDir: string;
  germanDir: string;
  filter?: (relativePath: string) => boolean;
};

const root = resolve(import.meta.dir, "..", "..");
const englishRoot = join(root, "English_Grammer_Automaticity");
const germanRoot = join(root, "German_Grammer_Automaticity");

const brandSpecificInEnglish = new Set([
  "downloads/EnglishGrammar-Setup.exe",
  "downloads/EnglishGrammar-Setup.exe.sha256",
  "downloads/EnglishGrammar-Setup-v27.0.2.exe",
  "downloads/EnglishGrammar-Setup-v27.0.2.exe.sha256",
]);

const scopes: Scope[] = [
  {
    name: "web-app-routes",
    englishDir: join(englishRoot, "apps", "web", "app"),
    germanDir: join(germanRoot, "apps", "web", "src", "app"),
  },
  {
    name: "web-public",
    englishDir: join(englishRoot, "apps", "web", "public"),
    germanDir: join(germanRoot, "apps", "web", "public"),
    filter: (relativePath) => !brandSpecificInEnglish.has(relativePath),
  },
  {
    name: "docs-top-level",
    englishDir: join(englishRoot, "docs"),
    germanDir: join(germanRoot, "docs"),
    filter: (relativePath) => !relativePath.includes("/"),
  },
  {
    name: "scripts-overlap",
    englishDir: join(englishRoot, "scripts"),
    germanDir: join(germanRoot, "scripts"),
    filter: (relativePath) =>
      [
        "extract-legacy-content.ts",
        "package-stores.ts",
        "package-windows-installer.ts",
        "serve-legacy.ts",
      ].includes(relativePath),
  },
  {
    name: "root-parity-files",
    englishDir: englishRoot,
    germanDir: germanRoot,
    filter: (relativePath) =>
      [
        "playwright.config.ts",
        "manifest.webmanifest",
        "offline.html",
        "index.html",
      ].includes(relativePath),
  },
];

function listRelativeFiles(baseDir: string): string[] {
  if (!existsSync(baseDir)) {
    return [];
  }

  const output: string[] = [];

  function walk(currentDir: string, relativePrefix: string) {
    for (const entry of readdirSync(currentDir)) {
      const fullPath = join(currentDir, entry);
      const relativePath = relativePrefix
        ? `${relativePrefix}/${entry}`
        : entry;
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (stats.isFile()) {
        output.push(relativePath.replaceAll("\\", "/"));
      }
    }
  }

  walk(baseDir, "");
  return output.sort();
}

function calculateMissingInGerman(scope: Scope): string[] {
  const englishFiles = listRelativeFiles(scope.englishDir).filter(
    scope.filter ?? (() => true),
  );
  const germanFiles = new Set(
    listRelativeFiles(scope.germanDir).filter(scope.filter ?? (() => true)),
  );

  return englishFiles.filter((file) => !germanFiles.has(file));
}

const strict = process.argv.includes("--strict");
let totalMissing = 0;

console.log("English -> German parity report");
console.log(`English root: ${englishRoot}`);
console.log(`German root:  ${germanRoot}`);

for (const scope of scopes) {
  const missing = calculateMissingInGerman(scope);
  totalMissing += missing.length;

  console.log(`\n[${scope.name}] missing in German: ${missing.length}`);
  for (const file of missing.slice(0, 30)) {
    console.log(`- ${file}`);
  }
  if (missing.length > 30) {
    console.log(`- ... and ${missing.length - 30} more`);
  }
}

console.log(`\nTotal missing files in German: ${totalMissing}`);

if (strict && totalMissing > 0) {
  process.exit(1);
}
