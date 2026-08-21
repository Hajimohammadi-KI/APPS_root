// Pre-flight for `bun run build`.
//
// Next deletes and recreates apps/web/.next/standalone during a build. On
// Windows a running standalone server holds that tree open, so the rmdir
// fails with a raw `EBUSY: resource busy or locked` and the build aborts.
// The error names a directory, not a process, so it reads like a broken build
// when it is only a running app -- it cost two failed installer builds before
// the cause was obvious. This check turns it into a sentence that says what
// to do.
//
// Detection is by process list, not by probing the filesystem. A rename probe
// was tried first and rejected: renaming the directory fails with EPERM on
// Windows for reasons unrelated to our servers (indexing, antivirus), which
// would have blocked perfectly good builds -- a worse failure than the one
// being prevented.
import { execFileSync } from "node:child_process";

if (process.platform !== "win32") process.exit(0);

let output = "";
try {
  output = execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | " +
        "Where-Object { $_.CommandLine -like '*standalone*' } | " +
        "ForEach-Object { \"$($_.ProcessId)`t$($_.CommandLine)\" }",
    ],
    { encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "ignore"] },
  );
} catch {
  // If the probe itself cannot run, do not block the build -- a missing
  // diagnostic must never be worse than no diagnostic at all.
  process.exit(0);
}

const holders = output
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

if (holders.length === 0) process.exit(0);

console.error(
  [
    "",
    "Cannot build: a standalone server is still running and holds",
    "apps/web/.next/standalone open. The build would fail with EBUSY.",
    "",
    ...holders.map((line) => `  PID ${line.split("\t")[0]}`),
    "",
    "Stop them, then build again:",
    "",
    `  powershell -NoProfile -Command "Stop-Process -Id ${holders
      .map((line) => line.split("\t")[0])
      .join(",")} -Force"`,
    "",
    "This is not a code error -- nothing is wrong with the source.",
    "",
  ].join("\n"),
);
process.exit(1);
