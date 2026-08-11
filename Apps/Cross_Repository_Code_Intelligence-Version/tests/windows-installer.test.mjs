import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const setup = await readFile(new URL("../scripts/setup-windows.ps1", import.meta.url), "utf8");
const setupLauncher = await readFile(new URL("../SETUP-WINDOWS.bat", import.meta.url), "utf8");
const appLauncher = await readFile(new URL("../STARTEN-WINDOWS.bat", import.meta.url), "utf8");
const localSupervisor = await readFile(new URL("../scripts/start-local-app.ps1", import.meta.url), "utf8");
const uninstallLauncher = await readFile(new URL("../DEINSTALLIEREN-WINDOWS.bat", import.meta.url), "utf8");
const localEnvGenerator = await readFile(new URL("../scripts/generate-local-env.mjs", import.meta.url), "utf8");

test("Windows setup exposes install, update, repair, and uninstall", () => {
  for (const action of ["Install", "Update", "Repair", "Uninstall"]) {
    assert.match(setup, new RegExp(`\\b${action}\\b`));
  }
  assert.match(setupLauncher, /setup-windows\.ps1/);
  assert.match(uninstallLauncher, /-Action Uninstall/);
  assert.match(setupLauncher, /-WindowStyle Hidden/);
  assert.match(uninstallLauncher, /-WindowStyle Hidden/);
  assert.match(setupLauncher, /start "" powershell\.exe/);
  assert.match(uninstallLauncher, /start "" powershell\.exe/);
});

test("Windows setup detects and repairs incomplete installations", () => {
  assert.match(setup, /function Test-InstallFiles/);
  assert.match(setup, /function Test-IncompleteInstallation/);
  assert.match(setup, /node_modules\\\.bin\\bun\.cmd/);
  assert.match(setup, /\.env\.local/);
  assert.match(setup, /dist\\server\\index\.js/);
  assert.match(setup, /apps\\api\\dist\\main\.js/);
  assert.match(setup, /Unvollständige Installation erkannt/);
  assert.match(setup, /\$availableModes\["Repair"\] = \(\$installed -or \$incomplete\)/);
});

test("Windows setup uses a modern single-action interface", () => {
  assert.match(setup, /Cross Repository`nCode Intelligence/);
  assert.match(setup, /ERSTINSTALLATION AUSGEWÄHLT/);
  assert.match(setup, /Jetzt installieren/);
  assert.match(setup, /Installationsprotokoll/);
  assert.match(setup, /ProgressBarStyle\]::Marquee/);
  assert.match(setup, /\$white = \[System\.Drawing\.Color\]::White/);
  assert.match(setup, /New-UiLabel "Cross Repository`nCode Intelligence"[^\r\n]+\$white/);
  for (const [index, line] of setup.split(/\r?\n/).entries()) {
    if (/^\s*function\s+New-Ui/.test(line) || !/\bNew-Ui(?:Label|Button)\s/.test(line)) continue;
    assert.doesNotMatch(
      line,
      /(?:^|\s)\[System\.(?:Drawing|Windows\.Forms)\.[^\]]+\]::[A-Za-z_]\w*(?:\([^)]*\))?(?=\s|$)/,
      `Static .NET values passed to a PowerShell UI function must be parenthesized or assigned to a variable (line ${index + 1})`,
    );
  }
  assert.match(setup, /\$uiState = @\{ SelectedMode = "Install"; Busy = \$false \}/);
  assert.match(setup, /\$uiState\.SelectedMode = \$Mode/);
  assert.match(setup, /\$mode = \$uiState\.SelectedMode/);
  assert.match(setup, /UseVisualStyleBackColor = \$false/);
  assert.match(setup, /\$actionButton\.ForeColor = \$white/);
  assert.match(setup, /if \(\$uiState\.Busy\) \{ return \}/);
  assert.doesNotMatch(setup, /\$actionButton\.Enabled = \$false/);
  assert.doesNotMatch(setup, /\$modePanel\.Enabled = \$false/);
});

test("Windows setup uses the accessible purple palette", () => {
  assert.match(setup, /\$navy = \[System\.Drawing\.Color\]::FromArgb\(73, 52, 101\)/);
  assert.match(setup, /\$purple = \[System\.Drawing\.Color\]::FromArgb\(111, 82, 150\)/);
  assert.match(setup, /\$lavender = \[System\.Drawing\.Color\]::FromArgb\(241, 234, 250\)/);
  assert.match(setup, /\$button\.ForeColor = \$white/);
  assert.match(setup, /\$actionButton\.ForeColor = \$white/);
  assert.doesNotMatch(setup, /FromArgb\(17, 137, 124\)|FromArgb\(226, 247, 243\)/);
});

test("Windows setup retries dependency installation and preserves diagnostics", () => {
  assert.match(setup, /function Invoke-NpmAttempt/);
  assert.match(setup, /setup-install\.log/);
  assert.match(setup, /"cache", "verify"/);
  assert.match(setup, /3\. Versuch: kompatible Installation/);
  assert.match(setup, /Vollständiges Protokoll/);
  assert.match(setup, /Invoke-BunAttempt @\("run", "build:all"\)/);
  assert.match(setup, /Invoke-BunAttempt @\("run", "validate:artifact"\)/);
});

test("Windows setup removes the downloaded-file warning from installed app files", () => {
  assert.match(setup, /function Remove-DownloadedFileMark/);
  assert.match(setup, /Unblock-File -LiteralPath \$_\.FullName/);
  assert.match(setup, /Restore-SavedData\s+Remove-DownloadedFileMark\s+Install-Dependencies/);
});

test("Windows uninstaller releases local processes and removes from a temporary working directory", () => {
  assert.match(setup, /function Stop-LocalAppProcesses/);
  assert.match(setup, /Get-CimInstance Win32_Process/);
  assert.match(setup, /"powershell\.exe"/);
  for (const processName of ["bun.exe", "wrangler.exe", "esbuild.exe"]) {
    assert.match(setup, new RegExp(`"${processName.replace(".", "\\.")}"`));
  }
  assert.match(setup, /Start-Process -FilePath "powershell\.exe" -ArgumentList \$arguments -WorkingDirectory \$env:TEMP/);
  assert.match(setup, /Stop-LocalAppProcesses\s+if \(\$dataChoice -eq \[System\.Windows\.Forms\.DialogResult\]::Yes\)/);
  assert.match(setup, /Remove-Shortcuts\s+Start-DeferredRemoval/);
  assert.match(setup, /if \(\$Mode -ne "Install"\) \{\s+Stop-LocalAppProcesses\s+\}\s+Copy-ApplicationFiles/);
});

test("Windows update migrates only known legacy local ports", () => {
  assert.match(localEnvGenerator, /function migrateLegacyValue/);
  assert.match(localEnvGenerator, /migrateLegacyValue\("API_PORT", "4311", "4313"\)/);
  assert.match(localEnvGenerator, /migrateLegacyValue\("WEB_ORIGIN", "http:\/\/127\.0\.0\.1:4310", "http:\/\/127\.0\.0\.1:4312"\)/);
  assert.match(localEnvGenerator, /migrateLegacyValue\("API_INTERNAL_URL", "http:\/\/127\.0\.0\.1:4311\/v1\/health", "http:\/\/127\.0\.0\.1:4313\/v1\/health"\)/);
});

test("Windows setup preserves local data during update and repair", () => {
  assert.match(setup, /\.wrangler/);
  assert.match(setup, /\.env\.local/);
  assert.match(setup, /Save-UserData/);
  assert.match(setup, /Restore-SavedData/);
});

test("Windows setup automatically restarts the app after a successful operation", () => {
  assert.match(setup, /Create-Shortcuts\s+\$verb = switch/);
  assert.match(setup, /\$launcherProcess = Start-App/);
  assert.match(setup, /Wait-ForAppReady \$launcherProcess/);
  assert.match(setup, /http:\/\/127\.0\.0\.1:4312\/api\/state/);
  assert.match(setup, /http:\/\/127\.0\.0\.1:4313\/v1\/health/);
  assert.match(setup, /Show-Info \"\$AppName wurde erfolgreich/);
  assert.match(setup, /Die App wurde automatisch gestartet/);
  assert.doesNotMatch(setup, /App jetzt starten\?/);
});

test("Windows setup closes itself after the launched app is ready", () => {
  assert.match(setup, /Invoke-InstallOperation \$mode -NoCompletionDialog/);
  assert.match(setup, /Invoke-InstallOperation \$mode -NoCompletionDialog\s+if \(\$openDeepLCheckBox\.Checked\)/);
  assert.match(setup, /if \(\$operationSucceeded\) \{\s+\$form\.Close\(\)\s+\}/);
});

test("Windows setup offers the official DeepL browser helper only by opt-in", () => {
  assert.match(setup, /Open-DeepLBrowserExtensionPage/);
  assert.match(setup, /https:\/\/www\.deepl\.com\/en\/app/);
  assert.match(setup, /DeepL wird nicht automatisch installiert/);
  assert.match(setup, /\$openDeepLCheckBox\.Checked = \$false/);
});

test("Windows launcher supervises compiled web and API without development watchers", () => {
  assert.match(appLauncher, /scripts\\start-local-app\.ps1/);
  assert.match(appLauncher, /dist\\server\\index\.js/);
  assert.match(appLauncher, /apps\\api\\dist\\main\.js/);
  assert.match(appLauncher, /http:\/\/127\.0\.0\.1:4312\/api\/state/);
  assert.match(appLauncher, /http:\/\/127\.0\.0\.1:4313\/v1\/health/);
  assert.doesNotMatch(appLauncher, /dev:all/);
  assert.match(localSupervisor, /\$MaxAttempts = 3/);
  assert.match(localSupervisor, /@\("run", "--cwd", "apps\/api", "start"\)/);
  assert.match(localSupervisor, /@\("run", "start"\)/);
  assert.match(localSupervisor, /http:\/\/127\.0\.0\.1:4312\/api\/state/);
  assert.match(localSupervisor, /http:\/\/127\.0\.0\.1:4313\/v1\/health/);
  assert.match(localSupervisor, /function Stop-ProcessTree/);
  assert.match(localSupervisor, /runtime-startup\.log/);
});

test("Windows setup creates desktop and Start menu shortcuts with an icon", async () => {
  assert.match(setup, /GetFolderPath\("Desktop"\)/);
  assert.match(setup, /GetFolderPath\("StartMenu"\)/);
  assert.match(setup, /Create-Shortcuts/);
  assert.match(setup, /app-icon\.ico/);
  const icon = await stat(new URL("../public/app-icon.ico", import.meta.url));
  assert.ok(icon.size > 1_000);
});

test("local Vite configuration has no hosting manifest dependency", async () => {
  const vite = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(vite, /\.openai\/hosting\.json/);
  assert.match(vite, /binding: "DB"/);
  assert.match(vite, /binding: "BUCKET"/);
});
