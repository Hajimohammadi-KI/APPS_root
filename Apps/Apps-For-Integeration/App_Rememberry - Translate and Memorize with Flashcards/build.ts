import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = import.meta.dir;
const dist = resolve(root, "dist");

await rm(dist, { force: true, recursive: true });
await mkdir(dist, { recursive: true });

const build = await Bun.build({
  entrypoints: [
    resolve(root, "src/background.ts"),
    resolve(root, "src/content.ts"),
    resolve(root, "src/popup.ts"),
  ],
  format: "esm",
  outdir: dist,
  sourcemap: "linked",
  target: "browser",
});

if (!build.success) {
  for (const log of build.logs) {
    console.error(log);
  }
  process.exit(1);
}

for (const file of ["manifest.json", "popup.html", "popup.css"]) {
  await cp(resolve(root, file), resolve(dist, file));
}

console.log(`Chrome extension built in ${dist}`);
