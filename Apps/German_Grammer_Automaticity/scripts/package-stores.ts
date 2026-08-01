const requested = process.argv[2] ?? "all";
const normalized = requested.toLowerCase();
const allowed = new Set(["all", "android", "ios", "windows"]);

if (!allowed.has(normalized)) {
  console.error(
    "Usage: bun scripts/package-stores.ts [all|android|ios|windows]",
  );
  process.exit(1);
}

const processResult = Bun.spawnSync(
  ["bun", "scripts/package-store-apps.ts", `--platform=${normalized}`],
  {
    cwd: new URL("..", import.meta.url),
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  },
);

process.exit(processResult.exitCode);
