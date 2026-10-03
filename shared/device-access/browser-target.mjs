import assert from "node:assert/strict";
import { isPrivateAddress } from "./gateway.mjs";

/** Test runners use an isolated CDP profile and require an explicit LAN target. */
export function assertTestTarget(app) {
  const url = new URL(app);
  const host = url.hostname;
  assert(["http:", "https:"].includes(url.protocol));
  assert(!url.username && !url.password);
  assert(
    ["127.0.0.1", "localhost"].includes(host) ||
      (host === process.env.DEVICE_TEST_HOST && isPrivateAddress(host)),
    "Browser tests require loopback or an explicitly selected private device host.",
  );
}
