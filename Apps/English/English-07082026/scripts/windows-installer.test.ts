import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");
const setupSource = readFileSync(
  resolve(projectRoot, "distribution/windows-modern/SetupApp.cs"),
  "utf8",
);
const setupConfig = JSON.parse(
  readFileSync(
    resolve(projectRoot, "distribution/windows-modern/setup.config.json"),
    "utf8",
  ),
) as Record<string, string>;
const buildScript = readFileSync(
  resolve(projectRoot, "distribution/windows-modern/build-modern-installer.ps1"),
  "utf8",
);
const desktopMain = readFileSync(
  resolve(projectRoot, "distribution/windows-desktop/main.cjs"),
  "utf8",
);

describe("Windows installation roadmap", () => {
  test("offers the same four lifecycle actions as the tracker", () => {
    for (const operation of ["Install", "Update", "Repair", "Uninstall"]) {
      expect(setupSource).toContain(`SetupOperation.${operation}`);
    }
    expect(setupSource).toContain("--silent-install");
    expect(setupSource).toContain("--silent-update");
    expect(setupSource).toContain("--silent-repair");
    expect(setupSource).toContain("--silent-uninstall");
  });

  test("shows three operation-specific steps", () => {
    for (const copy of [
      "Check the installation package",
      "Check the new version",
      "Check the installation",
      "Close the app safely",
      "Preserve learning data",
      "Choose what happens to data",
    ]) {
      expect(setupSource).toContain(copy);
    }
    expect(setupSource).toContain("ConfigureOperationRoadmap(selectedOperation)");
  });

  test("keeps data separate and uses the accessible tracker palette", () => {
    expect(setupSource).toContain("Product.DataRoot");
    expect(setupSource).toContain("Learning progress and settings are preserved");
    expect(setupSource).toContain("<Setter Property='Foreground' Value='White'/>");
    expect(setupConfig.darkColor).toBe("#493465");
    expect(setupConfig.accentColor).toBe("#6F5296");
    expect(setupConfig.accentSoftColor).toBe("#F1EAFA");
  });

  test("launches the app and closes setup after a successful operation", () => {
    expect(setupSource).toMatch(
      /if \(Environment\.GetEnvironmentVariable\(Product\.EnvironmentPrefix \+ "_NO_LAUNCH"\) != "1"\)\s*\{\s*Installer\.Launch\(\);\s*if \(selectedOperation == SetupOperation\.Install && openDeepLCheckBox\.IsChecked == true\)\s*BrowserHelpers\.OpenDeepLBrowserExtensionPage\(\);\s*Close\(\);\s*\}/,
    );
  });

  test("offers DeepL as an optional official browser helper", () => {
    expect(setupSource).toContain("DeepLBrowserExtensionPage");
    expect(setupSource).toContain("https://www.deepl.com/en/app");
    expect(setupSource).toContain("DeepL is not installed automatically");
    expect(setupSource).toContain("OpenDeepLCheckBox");
    expect(setupSource).toContain("IsChecked='False'");
    expect(setupSource).toContain(
      "selectedOperation == SetupOperation.Install && openDeepLCheckBox.IsChecked == true",
    );
  });

  test("packages and health-gates Research PDF Studio", () => {
    expect(setupConfig.version).toBe("27.3.18");
    expect(setupConfig.readerProject).toContain("Reader-PDF-App");
    expect(buildScript).toContain("Building the deterministic local PDF Reader");
    expect(buildScript).toContain("scripts\\start-local.mjs");
    expect(buildScript).toContain("readerPayloadRoot");
    expect(desktopMain).toContain("research-pdf-studio");
    expect(desktopMain).toContain("contractVersion === 1");
    expect(desktopMain).toContain("localPdfImport === \"loopback-only\"");
    expect(desktopMain).toContain("ENGLISH_GRAMMAR_USER_DATA_ROOT");
    expect(desktopMain).toContain("PDF Reader Imports");
    expect(desktopMain).toContain("createReaderWindow(target.toString())");
  });
});
