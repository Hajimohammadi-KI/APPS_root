import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = ["mobile-drawer.js", "mobile-drawer.css", "writing.js", "writing.css", "grammar-layout.js", "grammar-drafts.js", "learning-path.js", "navigation-config.js", "page-chrome.js", "page-chrome.css", "calm-theme.css", "explanation-language.css", "worksheet.css"];

// shared/navigation-config.json is the one list of learner routes; the static
// Daily and Grammar pages read it through this generated script.
const navigation = JSON.parse(await readFile(resolve(root, "shared/navigation-config.json"), "utf8"));
await writeFile(
  resolve(root, "shared/language-web/navigation-config.js"),
  `/* Generated from shared/navigation-config.json by scripts/sync-language-web.mjs. Do not edit. */\nwindow.languageNavigation = ${JSON.stringify(navigation, null, 2)};\n`,
);

for (const app of ["Apps/English/English-Automaticity", "Apps/Deutsch/Deutsch-Automaticity"]) {
  const destination = resolve(root, app, "apps/web/public/device-access");
  await mkdir(destination, { recursive: true });
  for (const asset of assets) await copyFile(resolve(root, "shared/language-web", asset), resolve(destination, asset));
}
// React pages import the same worksheet components through their global stylesheet.
for (const styles of ["Apps/English/English-Automaticity/apps/web/app/styles", "Apps/Deutsch/Deutsch-Automaticity/apps/web/src/app/styles"]) {
  await copyFile(resolve(root, "shared/language-web/worksheet.css"), resolve(root, styles, "103-worksheet.css"));
}
console.log("Language web assets synchronized to both apps.");
