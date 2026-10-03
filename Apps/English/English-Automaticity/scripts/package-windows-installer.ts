import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");
const setupConfig = JSON.parse(
  await readFile(
    resolve(projectRoot, "distribution/windows-modern/setup.config.json"),
    "utf8",
  ),
) as { version: string };
const versionedFileName = `EnglishGrammar-Setup-v${setupConfig.version}.exe`;
const buildScript = resolve(
  projectRoot,
  "distribution/windows-modern/build-modern-installer.ps1",
);
const source = resolve(projectRoot, "EnglishGrammar-Setup.exe");
const payloadSource = resolve(projectRoot, "EnglishGrammar-Setup.payload.zip");
const skipElectronBuild = Bun.argv.includes("--skip-electron-build");
const buildCommand = [
  "powershell.exe",
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  buildScript,
];
if (skipElectronBuild) {
  buildCommand.push("-SkipElectronBuild");
}

const builder = Bun.spawn(
  buildCommand,
  {
    cwd: projectRoot,
    stdout: "inherit",
    stderr: "inherit",
  },
);

const exitCode = await builder.exited;
if (exitCode !== 0) {
  throw new Error(`Modern Windows setup build failed with code ${exitCode}.`);
}

const sourceInfo = await stat(source);
if (sourceInfo.size < 64_000) {
  throw new Error("Windows setup bootstrap is unexpectedly small.");
}

const payloadInfo = await stat(payloadSource);
if (payloadInfo.size < 1_000_000) {
  throw new Error("Windows setup payload is unexpectedly small.");
}

const sourceBytes = await readFile(source);
const hasher = new Bun.CryptoHasher("sha256");
hasher.update(sourceBytes);
const checksum = hasher.digest("hex");

const destinations = [
  resolve(
    projectRoot,
    "artifacts/windows-installer/EnglishGrammar-Setup.exe",
  ),
  resolve(
    projectRoot,
    `artifacts/windows-installer/${versionedFileName}`,
  ),
  resolve(
    projectRoot,
    "apps/web/public/downloads/EnglishGrammar-Setup.exe",
  ),
  resolve(
    projectRoot,
    `apps/web/public/downloads/${versionedFileName}`,
  ),
] as const;

for (const destination of destinations) {
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
  await copyFile(
    payloadSource,
    `${destination.replace(/\.exe$/i, "")}.payload.zip`,
  );
  await writeFile(
    `${destination}.sha256`,
    `${checksum}  ${destination.endsWith(versionedFileName) ? versionedFileName : "EnglishGrammar-Setup.exe"}\n`,
    "utf8",
  );
  console.log(`Windows setup saved: ${destination}`);
}

const publisher = Bun.spawn(
  [
    "powershell.exe",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    resolve(projectRoot, "../../../shared/windows-release/publish-language-update.ps1"),
    "-ProjectRoot",
    projectRoot,
    "-ProductId",
    "EnglishGrammarAutomaticityDesktop",
    "-ManifestName",
    "english-grammar-update.json",
    "-SetupFile",
    "EnglishGrammar-Setup.exe",
    "-PayloadFile",
    "EnglishGrammar-Setup.payload.zip",
    "-ReleaseSlug",
    "english-grammar",
  ],
  { cwd: projectRoot, stdout: "inherit", stderr: "inherit" },
);
if ((await publisher.exited) !== 0) {
  throw new Error("English update package publication failed.");
}

console.log(`SHA-256: ${checksum}`);
