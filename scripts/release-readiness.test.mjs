import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";

import { loadTargets, probeCheck, verifyReleaseReadiness } from "./release-readiness.mjs";

test("every canonical target has a build and an honest access contract", async () => {
  const targets = await loadTargets();
  assert.deepEqual(targets.map((target) => target.id), ["english", "german", "tracker", "settings", "pdf"]);
  for (const target of targets) {
    assert.ok(target.projectDir);
    assert.equal(target.owner?.status, "assigned");
    assert.ok(target.owner?.name);
    assert.ok(target.owner?.reviewBy);
    assert.ok(target.build.command);
    assert.ok(target.build.args.length > 0);
    assert.ok(target.localChecks.length > 0);
    if (target.publicAccess === "public") assert.ok(target.publicChecks.length > 0);
    if (target.publicAccess === "local-only") assert.deepEqual(target.publicChecks, []);
  }
});

test("HTTP probes require both status and response contract", async () => {
  const server = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ service: "fixture", ready: true }));
      return;
    }
    response.writeHead(200, { "content-type": "text/html" });
    response.end('<!doctype html><html dir="ltr"><body>Fixture app</body></html>');
  });
  await new Promise((resolveReady) => server.listen(0, "127.0.0.1", resolveReady));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await probeCheck({ url: `${baseUrl}/`, kind: "html", includes: ['dir="ltr"'] })).passed, true);
    assert.equal((await probeCheck({ url: `${baseUrl}/health`, kind: "json", expected: { service: "fixture", ready: true } })).passed, true);
    assert.equal((await probeCheck({ url: `${baseUrl}/health`, kind: "json", expected: { ready: false } })).passed, false);
  } finally {
    await new Promise((resolveClosed, rejectClosed) => server.close((error) => error ? rejectClosed(error) : resolveClosed()));
  }
});

test("build-only and runtime-only stages cannot be combined", async () => {
  await assert.rejects(
    verifyReleaseReadiness(["--build-only", "--runtime-only"]),
    /either --build-only or --runtime-only/,
  );
});
