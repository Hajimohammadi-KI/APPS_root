import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function reservePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

test("status endpoint returns every configured application", async (context) => {
  const port = await reservePort();
  const serverFile = fileURLToPath(new URL("./server.mjs", import.meta.url));
  const child = spawn(process.execPath, [serverFile], {
    cwd: fileURLToPath(new URL(".", import.meta.url)),
    env: { ...process.env, STARTER_PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  context.after(() => child.kill());

  let response;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      response = await fetch(`http://127.0.0.1:${port}/api/status`);
      if (response.ok) break;
    } catch {
      // The child may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  assert.ok(response?.ok, "Starter status endpoint did not become ready");
  const status = await response.json();
  assert.deepEqual(Object.keys(status), ["english", "german", "tracker", "settings", "pdf"]);
  for (const app of Object.values(status)) {
    assert.equal(typeof app.ready, "boolean");
    assert.ok(Array.isArray(app.services));
  }
});
