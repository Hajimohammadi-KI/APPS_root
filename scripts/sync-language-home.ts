import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
const targets = [
  "Apps/English/English-Automaticity/apps/web",
  "Apps/Deutsch/Deutsch-Automaticity/apps/web/src",
];
// learning-home.css is no longer mirrored: since R67 each app styles its home
// screen with its own design system, and each app folder is self-contained.
const files = { "learning-home.tsx": "components/learning-home.tsx", "learning-navigation.tsx": "components/learning-navigation.tsx", "navigation-config.ts": "components/navigation-config.ts", "learning-chrome.css": "app/styles/pages/learning-chrome.css", "studio-calm.css": "app/studio/source/calm.css" };
const check = Bun.argv.includes("--check");

// shared/navigation-config.json is the one list of learner routes; the React
// navigation reads it through this generated module.
const navigation = await Bun.file(resolve(root, "shared/navigation-config.json")).text();
const generated = `// Generated from shared/navigation-config.json by scripts/sync-language-home.ts. Do not edit.\nexport const navigationConfig = ${navigation.trim()} as const;\n`;
const generatedPath = resolve(root, "shared/language-home/navigation-config.ts");
if (check) {
  if (!(await Bun.file(generatedPath).exists()) || (await Bun.file(generatedPath).text()) !== generated) throw Error("Home mirror differs: shared/language-home/navigation-config.ts");
} else await Bun.write(generatedPath, generated);

for (const target of targets) for (const [source, destination] of Object.entries(files)) {
  const bytes = await Bun.file(resolve(root, "shared/language-home", source)).text();
  const path = resolve(root, target, destination);
  if (check) {
    if (!(await Bun.file(path).exists()) || await Bun.file(path).text() !== bytes) throw Error(`Home mirror differs: ${target}/${destination}`);
  } else await Bun.write(path, bytes);
}
console.log("Language home mirrors match.");
