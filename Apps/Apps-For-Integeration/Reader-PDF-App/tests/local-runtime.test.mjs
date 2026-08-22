import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import net from "node:net";
import test from "node:test";

const testRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(testRoot, "..");
const fixture = join(testRoot, "fixtures", "reader-smoke.pdf");

async function freePort() {
  const server = net.createServer();
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolveClose) => server.close(resolveClose));
  return address.port;
}

async function waitForHealth(url, child) {
  let lastError = "not attempted";
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Local Reader exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return response.json();
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Local Reader did not become healthy: ${lastError}`);
}

test("serves an exact health contract and a loopback-only SHA-addressed PDF", async (context) => {
  const port = await freePort();
  const importRoot = await mkdtemp(join(tmpdir(), "reader-pdf-imports-"));
  const bytes = await readFile(fixture);
  const id = createHash("sha256").update(bytes).digest("hex");
  await copyFile(fixture, join(importRoot, `${id}.pdf`));

  const child = spawn(
    process.execPath,
    ["scripts/start-local.mjs", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PDF_READER_IMPORT_ROOT: importRoot,
        PDF_READER_RELEASE_VERSION: "runtime-test",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  context.after(async () => {
    if (child.exitCode === null) child.kill("SIGTERM");
    await new Promise((resolveExit) => child.once("exit", resolveExit));
    await rm(importRoot, { recursive: true, force: true });
  });

  const origin = `http://127.0.0.1:${port}`;
  const health = await waitForHealth(`${origin}/api/health`, child).catch((error) => {
    throw new Error(`${error.message}\n${stderr}`);
  });
  assert.deepEqual(health, {
    service: "research-pdf-studio",
    ready: true,
    contractVersion: 1,
    version: "runtime-test",
    storageBoundary: "browser-local",
    localPdfImport: "loopback-only",
  });

  const page = await fetch(`${origin}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") || "", /^text\/html/i);
  assert.match(await page.text(), /Research PDF Studio|Leselineal auf dieser Seite/);

  const assetName = Object.values(
    JSON.parse(await readFile(join(projectRoot, "dist", "client", ".vite", "manifest.json"), "utf8")),
  ).find((entry) => entry && typeof entry === "object" && entry.isEntry)?.file;
  assert.equal(typeof assetName, "string");
  const asset = await fetch(`${origin}/${assetName}`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get("content-type") || "", /javascript/);
  assert.ok((await asset.arrayBuffer()).byteLength > 1_000);

  const imported = await fetch(`${origin}/api/local-pdf?id=${id}`);
  assert.equal(imported.status, 200);
  assert.equal(imported.headers.get("content-type"), "application/pdf");
  const importedHash = createHash("sha256")
    .update(Buffer.from(await imported.arrayBuffer()))
    .digest("hex");
  assert.equal(importedHash, id);

  const invalid = await fetch(`${origin}/api/local-pdf?id=..%2Fsecret`);
  assert.equal(invalid.status, 400);
});
