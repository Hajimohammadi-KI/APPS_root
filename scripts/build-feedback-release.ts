import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const product = Bun.argv[2];
if (product !== "English" && product !== "German") throw Error("Choose English or German");
const root = resolve(import.meta.dir, ".."), app = resolve(root, product === "English" ? "Apps/English/English-Automaticity" : "Apps/Deutsch-Automaticity");
const check = product === "English" ? "check" : "verify", output = resolve(app, "artifacts");
await mkdir(output, { recursive: true });
const receipt = { startedAt: new Date().toISOString(), finishedAt: "", product, check, checkExit: null as number | null, packageExit: null as number | null,
  version: JSON.parse(await readFile(resolve(app, "distribution/windows-modern/setup.config.json"), "utf8")).version };
async function run(command: string, log: string) {
  const child = Bun.spawn(["bun", "run", command], { cwd: app, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  await writeFile(resolve(output, log), stdout + "\nSTDERR\n" + stderr); return exit;
}
try {
  receipt.checkExit = await run(check, "feedback-release-check.log");
  if (receipt.checkExit === 0) receipt.packageExit = await run("package:windows-exe", "feedback-release-package.log");
} finally {
  receipt.finishedAt = new Date().toISOString();
  await writeFile(resolve(output, "feedback-build-receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify(receipt));
}
if (receipt.checkExit !== 0 || receipt.packageExit !== 0) process.exitCode = 1;
