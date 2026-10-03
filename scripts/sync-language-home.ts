import { resolve } from "node:path";
const root = resolve(import.meta.dir, "..");
const targets = [
  "Apps/English/English-Automaticity/apps/web",
  "Apps/Deutsch/Deutsch-Automaticity/apps/web/src",
];
const files = { "learning-home.tsx": "components/learning-home.tsx", "learning-home.css": "app/styles/pages/learning-home.css", "learning-navigation.tsx": "components/learning-navigation.tsx", "learning-chrome.css": "app/styles/pages/learning-chrome.css", "studio-calm.css": "app/studio/source/calm.css" };
for (const target of targets) for (const [source, destination] of Object.entries(files)) {
  const bytes = await Bun.file(resolve(root, "shared/language-home", source)).text();
  const path = resolve(root, target, destination);
  if (Bun.argv.includes("--check")) {
    if (!(await Bun.file(path).exists()) || await Bun.file(path).text() !== bytes) throw Error(`Home mirror differs: ${target}/${destination}`);
  } else await Bun.write(path, bytes);
}
console.log("Language home mirrors match.");
