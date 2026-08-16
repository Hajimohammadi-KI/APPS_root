import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps", "web");
const target = join(web, ".next", "standalone", "apps", "web");

if (!existsSync(target)) {
  throw new Error("Standalone web build is missing. Run the web build first.");
}

mkdirSync(join(target, ".next"), { recursive: true });
cpSync(join(web, "public"), join(target, "public"), { recursive: true });
cpSync(join(web, ".next", "static"), join(target, ".next", "static"), {
  recursive: true,
});

console.log(`Prepared standalone assets at ${target}`);
