import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { commitReviewOutputs } from "./lib/review-output-transaction";
import { sha256 } from "./lib/automaticity-release-reviews";
async function fixture() {
  const root = await mkdtemp(
    resolve(import.meta.dir, "../artifacts/review-transaction-test-"),
  );
  await mkdir(resolve(root, "stage"));
  await writeFile(resolve(root, "catalog.json"), "original");
  return root;
}
test("review application preserves original bytes and verifies replacement hashes", async () => {
  const root = await fixture(),
    report = await commitReviewOutputs(root, "stage", [
      {
        path: "catalog.json",
        expectedSha256: sha256("original"),
        contents: "reviewed",
      },
    ]);
  expect(await readFile(resolve(root, "catalog.json"), "utf8")).toBe(
    "reviewed",
  );
  expect(
    await readFile(resolve(root, "stage/originals/catalog.json"), "utf8"),
  ).toBe("original");
  expect(report[0]!.afterSha256).toBe(sha256("reviewed"));
});
test("changed source, duplicate paths and workspace escapes cannot overwrite the catalog", async () => {
  for (const outputs of [
    [
      {
        path: "catalog.json",
        expectedSha256: sha256("stale"),
        contents: "bad",
      },
    ],
    [
      {
        path: "../external",
        expectedSha256: sha256("original"),
        contents: "bad",
      },
    ],
    [
      {
        path: "catalog.json",
        expectedSha256: sha256("original"),
        contents: "bad",
      },
      {
        path: "catalog.json",
        expectedSha256: sha256("original"),
        contents: "bad",
      },
    ],
  ]) {
    const root = await fixture();
    await expect(commitReviewOutputs(root, "stage", outputs)).rejects.toThrow();
    expect(await readFile(resolve(root, "catalog.json"), "utf8")).toBe(
      "original",
    );
  }
});
