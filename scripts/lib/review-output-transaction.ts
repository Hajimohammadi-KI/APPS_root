import { mkdir, readFile, writeFile, rename, realpath } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { sha256 } from "./automaticity-release-reviews";
export interface ReviewOutput {
  path: string;
  expectedSha256: string;
  contents: string;
}
/** Preserve every original before replacement; refuse concurrent changes and retain recovery files. */
export async function commitReviewOutputs(
  root: string,
  folder: string,
  outputs: readonly ReviewOutput[],
) {
  const base = await realpath(root),
    seen = new Set<string>();
  const inside = (path: string) => {
    const target = resolve(base, path),
      rel = relative(base, target);
    if (!rel || rel.startsWith("..") || isAbsolute(rel))
      throw Error("Review output escapes the workspace");
    return target;
  };
  const backup = inside(`${folder}/originals`);
  await mkdir(backup);
  const prepared = [];
  for (const output of outputs) {
    const target = inside(output.path),
      actual = await realpath(target),
      rel = relative(base, actual);
    if (
      rel.startsWith("..") ||
      isAbsolute(rel) ||
      seen.has(actual.toLowerCase())
    )
      throw Error("Duplicate or external review output");
    seen.add(actual.toLowerCase());
    const original = await readFile(target);
    if (sha256(original) !== output.expectedSha256)
      throw Error(`Source changed before review application: ${output.path}`);
    const originalPath = resolve(backup, output.path);
    await mkdir(dirname(originalPath), { recursive: true });
    await writeFile(originalPath, original, { flag: "wx" });
    const pending =
      target + `.review-${sha256(output.contents).slice(0, 16)}.pending`;
    await writeFile(pending, output.contents, { flag: "wx" });
    prepared.push({ ...output, target, original, pending, written: false });
  }
  try {
    // Check the whole set again immediately before the first replacement.
    for (const row of prepared)
      if (sha256(await readFile(row.target)) !== row.expectedSha256)
        throw Error(`Concurrent change: ${row.path}`);
    for (const row of prepared) {
      if (sha256(await readFile(row.target)) !== row.expectedSha256)
        throw Error(`Concurrent change: ${row.path}`);
      await rename(row.pending, row.target);
      row.written = true;
    }
    for (const row of prepared)
      if (sha256(await readFile(row.target)) !== sha256(row.contents))
        throw Error(`Post-write mismatch: ${row.path}`);
  } catch (error) {
    for (const row of prepared.reverse())
      if (
        row.written &&
        sha256(await readFile(row.target)) === sha256(row.contents)
      )
        await writeFile(row.target, row.original);
    throw error;
  }
  return prepared.map((row) => ({
    path: row.path,
    beforeSha256: row.expectedSha256,
    afterSha256: sha256(row.contents),
  }));
}
