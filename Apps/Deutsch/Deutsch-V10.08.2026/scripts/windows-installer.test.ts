import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
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
const desktopPackage = JSON.parse(
  readFileSync(
    resolve(projectRoot, "distribution/windows-desktop/package.json"),
    "utf8",
  ),
) as {
  build: { extraResources: Array<{ from: string }>; win: { icon: string } };
};
const buildScript = readFileSync(
  resolve(projectRoot, "distribution/windows-modern/build-modern-installer.ps1"),
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
    expect(setupSource).toContain(
      "ConfigureOperationRoadmap(selectedOperation)",
    );
  });

  test("keeps data separate and uses the accessible tracker palette", () => {
    expect(setupSource).toContain("Product.DataRoot");
    expect(setupSource).toContain(
      "Learning progress and settings are preserved",
    );
    expect(setupSource).toContain(
      "<Setter Property='Foreground' Value='White'/>",
    );
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
    expect(setupSource).toContain("DeepL wird nicht automatisch installiert");
    expect(setupSource).toContain("OpenDeepLCheckBox");
    expect(setupSource).toContain("IsChecked='False'");
    expect(setupSource).toContain(
      "selectedOperation == SetupOperation.Install && openDeepLCheckBox.IsChecked == true",
    );
  });

  test("keeps installer resources portable and uses a real PNG icon", () => {
    // Relative paths keep packaging valid after the repository folder is renamed or cloned elsewhere.
    for (const resource of desktopPackage.build.extraResources) {
      expect(resource.from).not.toMatch(/^[A-Za-z]:[\\/]/);
      expect(resource.from).not.toContain("APPS_root");
      expect(
        existsSync(
          // electron-builder resolves extraResources from the desktop package directory.
          resolve(
            projectRoot,
            "distribution/windows-desktop",
            resource.from,
          ),
        ),
      ).toBe(true);
    }
    const icon = readFileSync(
      resolve(
        projectRoot,
        "distribution/windows-desktop",
        desktopPackage.build.win.icon,
      ),
    );
    // The PNG signature prevents an LFS recovery notice from reaching electron-builder.
    expect([...icon.subarray(0, 8)]).toEqual([
      137, 80, 78, 71, 13, 10, 26, 10,
    ]);
  });

  test("builds without a legacy LFS compatibility launcher", () => {
    expect(buildScript).toContain(
      "Compatibility launcher payload is unavailable; retaining the newly built launcher.",
    );
    expect(buildScript).not.toContain(
      'throw "Compatibility launcher payload does not exist:',
    );
  });
});
