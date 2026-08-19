import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const testPort = process.env.RESPONSIVE_TEST_PORT ?? "4412";
const baseUrl = `http://127.0.0.1:${testPort}`;
let serverOutput = "";

function remember(chunk) {
  serverOutput = `${serverOutput}${chunk}`.slice(-20_000);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
      ...options,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code ?? "none"} (${signal ?? "no signal"}).`));
    });
  });
}

async function waitForReady() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.status === 200) return;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Local tracker did not become HTTP-ready.\n${serverOutput}`);
}

async function stopProcessTree(child) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === "win32") {
    await run("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    }).catch(() => undefined);
  } else {
    child.kill("SIGTERM");
  }
}

const server = spawn(
  "bun",
  ["run", "dev:vercel", "--", "-H", "127.0.0.1", "-p", testPort],
  {
  cwd: projectRoot,
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
  },
);
server.stdout.on("data", remember);
server.stderr.on("data", remember);

try {
  await Promise.race([
    waitForReady(),
    new Promise((_, reject) =>
      server.once("exit", (code) =>
        reject(new Error(`Local tracker exited before readiness (code ${code}).\n${serverOutput}`)),
      ),
    ),
  ]);
  await run(process.execPath, ["scripts/verify-vercel.mjs", baseUrl], {
    env: {
      ...process.env,
      VERIFY_PERSISTENCE: "0",
      ALLOW_LOCAL_API_FAILURES: "1",
    },
  });
} finally {
  await stopProcessTree(server);
}
