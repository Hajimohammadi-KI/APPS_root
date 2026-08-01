import { join } from "node:path";

const webDirectory = join(import.meta.dir, "..", "apps", "web");
const playwright = Bun.spawn(
  [process.execPath, "x", "playwright", "test", ...Bun.argv.slice(2)],
  {
    cwd: webDirectory,
    env: {
      ...process.env,
      BUN_EXECUTABLE: process.execPath,
    },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  },
);

process.exitCode = await playwright.exited;
