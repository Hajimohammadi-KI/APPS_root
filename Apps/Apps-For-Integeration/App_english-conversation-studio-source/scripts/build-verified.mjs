import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vinext = path.join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "vinext.cmd" : "vinext",
);
const worker = path.join(projectRoot, "dist", "server", "index.js");
const hosting = path.join(projectRoot, "dist", ".openai", "hosting.json");
const timeoutMs = Number.parseInt(process.env.SITES_BUILD_TIMEOUT_MS ?? "180000", 10);

// Run the platform-matched Vinext binary so a Windows checkout never loads a missing Linux native binding.
await access(vinext, constants.X_OK).catch(() => {
  throw new Error("Vinext is unavailable. Run npm run install:ci before building.");
});

console.log("Running bounded Vinext build...");
const isWindows = process.platform === "win32";
const child = spawn(
  isWindows ? process.env.ComSpec ?? "cmd.exe" : vinext,
  isWindows ? ["/d", "/s", "/c", `""${vinext}" build"`] : ["build"],
  {
    cwd: projectRoot,
    stdio: "inherit",
    windowsVerbatimArguments: isWindows,
  },
);
const timeout = setTimeout(() => {
  console.error(`Build exceeded ${timeoutMs}ms; stopping Vinext.`);
  child.kill("SIGTERM");
}, timeoutMs);

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
});
clearTimeout(timeout);
if (exitCode !== 0) process.exit(exitCode);

await access(worker, constants.F_OK);
JSON.parse(await readFile(hosting, "utf8"));
const workerUrl = pathToFileURL(worker);
workerUrl.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const module = await import(workerUrl.href);
if (typeof module.default?.fetch !== "function") {
  throw new Error("dist/server/index.js must export default.fetch.");
}
console.log("Validated Sites artifact: ESM Worker default.fetch and hosting manifest are present.");
