import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { matchesExpectedHealth, probeHttpHealth } from "./health.mjs";

test("requires every service identity field", () => {
  const expected = { service: "research-pdf-studio", ready: true, contractVersion: 1 };
  assert.equal(matchesExpectedHealth({ ...expected, version: "0.1.0" }, expected), true);
  assert.equal(matchesExpectedHealth({ service: "other", ready: true, contractVersion: 1 }, expected), false);
  assert.equal(matchesExpectedHealth("ready", expected), false);
});

test("does not report a listening but incorrect HTTP service as ready", async (context) => {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ service: "wrong-service", ready: true, contractVersion: 1 }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const result = await probeHttpHealth({
    url: `http://127.0.0.1:${address.port}/api/health`,
    expected: { service: "research-pdf-studio", ready: true, contractVersion: 1 },
  });
  assert.equal(result.ready, false);
  assert.match(result.error, /did not match/i);
});

test("accepts the exact PDF Reader health contract", async (context) => {
  const payload = {
    service: "research-pdf-studio",
    ready: true,
    contractVersion: 1,
    storageBoundary: "browser-local",
  };
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const result = await probeHttpHealth({
    url: `http://127.0.0.1:${address.port}/api/health`,
    expected: { service: "research-pdf-studio", ready: true, contractVersion: 1 },
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.payload, payload);
});
