import { cpSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = resolve(projectRoot, "apps/web");
const runtimeRoot = resolve(webRoot, ".next/standalone/apps/web");
const serverEntry = resolve(runtimeRoot, "server.js");

if (!existsSync(serverEntry)) {
  throw new Error("Standalone frontend is missing. Run `bun run build` first.");
}

mkdirSync(resolve(runtimeRoot, ".next"), { recursive: true });
cpSync(resolve(webRoot, ".next/static"), resolve(runtimeRoot, ".next/static"), {
  recursive: true,
  force: true,
});
cpSync(resolve(webRoot, "public"), resolve(runtimeRoot, "public"), {
  recursive: true,
  force: true,
});

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const child = spawn(process.execPath, [serverEntry], {
  cwd: runtimeRoot,
  env: {
    ...process.env,
    HOSTNAME: valueAfter("--hostname", process.env.HOSTNAME ?? "127.0.0.1"),
    PORT: valueAfter("--port", process.env.PORT ?? "3201"),
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
