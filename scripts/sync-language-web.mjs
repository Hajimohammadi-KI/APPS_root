import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = ["mobile-drawer.js", "mobile-drawer.css", "writing.js", "writing.css", "grammar-layout.js", "grammar-drafts.js", "learning-path.js"];
for (const app of ["Apps/English/English-Automaticity", "Apps/Deutsch/Deutsch-Automaticity"]) {
  const destination = resolve(root, app, "apps/web/public/device-access");
  await mkdir(destination, { recursive: true });
  for (const asset of assets) await copyFile(resolve(root, "shared/language-web", asset), resolve(destination, asset));
}
console.log("Language web assets synchronized to both apps.");
