import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("product metrics stay small and exclude learner content", async () => {
  const catalog = JSON.parse(await readFile(resolve(root, "docs/product-quality-event-catalog.json"), "utf8"));
  const eventNames = Object.keys(catalog.events);
  const metricNames = Object.keys(catalog.metrics);

  assert.equal(catalog.schemaVersion, 1);
  assert.equal(catalog.privacy.collection, "opt-in");
  assert.equal(catalog.privacy.defaultStorage, "local-first");
  assert.deepEqual(eventNames, [
    "learning_task_started",
    "learning_task_finished",
    "repair_completed",
    "returned_after_error",
    "teacher_review_completed",
  ]);
  assert.equal(metricNames.length, 5);

  const allowed = new Set([
    ...catalog.commonFields,
    ...Object.values(catalog.events).flatMap((event) => event.additionalFields),
  ]);
  for (const prohibited of catalog.privacy.prohibitedFields) {
    assert.equal(allowed.has(prohibited), false, `${prohibited} must never be an analytics field`);
  }
});

test("canonical map names every active release target and keeps human ownership honest", async () => {
  const manifest = JSON.parse(await readFile(resolve(root, "scripts/release-targets.json"), "utf8"));
  const map = await readFile(resolve(root, "docs/CANONICAL-APP-MAP.md"), "utf8");
  const protocol = await readFile(resolve(root, "docs/USER-OBSERVATION-PROTOCOL.md"), "utf8");

  for (const target of manifest.targets) {
    assert.match(map, new RegExp(target.projectDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(target.owner?.name, "Elahe Hajimohammadi", `${target.id} needs an accountable owner`);
    assert.equal(target.owner?.status, "assigned", `${target.id} ownership must be explicit`);
    assert.match(target.owner?.assignedOn ?? "", /^\d{4}-\d{2}-\d{2}$/);
    assert.match(target.owner?.reviewBy ?? "", /^\d{4}-\d{2}-\d{2}$/);
    assert.match(map, new RegExp(target.owner.name));
  }
  assert.match(map, /ownership review due 1 December 2026/i);
  assert.match(map, /supported companion/i);
  assert.match(map, /LingoBridge/);
  assert.doesNotMatch(
    manifest.targets.map((target) => target.name).join("\n"),
    /LingoBridge/,
    "LingoBridge is a supported companion, not a sixth Starter release target",
  );
  for (const participant of ["L01", "L02", "L03", "L04", "L05", "T01", "T02"]) {
    assert.match(protocol, new RegExp(`\\| ${participant} \\|`));
  }
  assert.doesNotMatch(protocol, /\| (?:L|T)\d{2} \|[^\n]*\| complete \|/i, "The protocol must not claim unrun human sessions are complete");
});
