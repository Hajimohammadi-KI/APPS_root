/** Verify the compatibility patch is bounded and idempotent. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  WIDTH_COMPATIBILITY_STYLE,
  applyWidthCompatibilityCss,
} from "../tools/package_dashboard.mjs";


test("adds one width compatibility style without changing body content", () => {
  const source = "<!doctype html><html><head><title>Dashboard</title></head><body>evidence</body></html>";
  const result = applyWidthCompatibilityCss(source);
  assert.match(result, /cefr-portable-width-compatibility/);
  assert.match(result, /<body>evidence<\/body>/);
  assert.equal(result.split('id="cefr-portable-width-compatibility"').length - 1, 1);
});


test("is idempotent and keeps table scrolling language in the fix", () => {
  const once = applyWidthCompatibilityCss("<html><head></head><body></body></html>");
  assert.equal(applyWidthCompatibilityCss(once), once);
  assert.match(WIDTH_COMPATIBILITY_STYLE, /tables retain their own scroller/);
});

