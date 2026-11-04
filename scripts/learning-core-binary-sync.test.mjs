import { test, expect } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { spawnSync } from "node:child_process";

test("binary speech assets cannot pass sync-check after invalid-byte corruption", () => {
  const root = mkdtempSync(join(tmpdir(), "learning-core-binary-"));
  const write = (path, value) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, value);
  };
  try {
    const source = join(root, "shared/learning-core");
    write(
      join(source, "sync-workspaces.mjs"),
      readFileSync(resolve("shared/learning-core/sync-workspaces.mjs")),
    );
    write(
      join(source, "browser/local-phoneme/model.hama"),
      Buffer.from([0, 255, 13, 10]),
    );
    write(join(source, "src/example.ts"), "export const example = true;\r\n");
    for (const app of [
      "Apps/English/English-Automaticity",
      "Apps/Deutsch/Deutsch-Automaticity",
    ]) {
      write(
        join(
          root,
          app,
          "packages/learning-core/browser/local-phoneme/model.hama",
        ),
        Buffer.from([0, 254, 13, 10]),
      );
      write(
        join(
          root,
          app,
          "apps/web/public/learning-core/local-phoneme/model.hama",
        ),
        Buffer.from([0, 254, 13, 10]),
      );
      write(
        join(root, app, "packages/learning-core/src/example.ts"),
        "export const example = true;\n",
      );
    }
    const run = (...args) =>
      spawnSync("node", [join(source, "sync-workspaces.mjs"), ...args], {
        encoding: "utf8",
      });
    const corrupted = run("--check");
    expect(corrupted.status).toBe(1);
    expect(corrupted.stderr).toContain("Stale:");
    expect(corrupted.stderr).not.toContain("example.ts");
    expect(run().status).toBe(0);
    expect(run("--check").status).toBe(0);
    expect(
      readFileSync(
        join(
          root,
          "Apps/English/English-Automaticity/apps/web/public/learning-core/local-phoneme/model.hama",
        ),
      ),
    ).toEqual(Buffer.from([0, 255, 13, 10]));
  } finally {
    if (
      dirname(resolve(root)) !== resolve(tmpdir()) ||
      !basename(root).startsWith("learning-core-binary-")
    )
      throw new Error("Refusing cleanup outside the test temporary directory.");
    rmSync(root, { recursive: true, force: true });
  }
});
