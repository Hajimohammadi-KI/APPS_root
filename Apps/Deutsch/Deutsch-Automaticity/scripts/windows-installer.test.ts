import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve, win32 } from "node:path";
import { runInNewContext } from "node:vm";

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
  resolve(
    projectRoot,
    "distribution/windows-modern/build-modern-installer.ps1",
  ),
  "utf8",
);
const desktopMain = readFileSync(
  resolve(projectRoot, "distribution/windows-desktop/main.cjs"),
  "utf8",
);
const updateConfig = JSON.parse(
  readFileSync(
    resolve(projectRoot, "distribution/windows-modern/update-config.json"),
    "utf8",
  ),
) as Record<string, string>;
const updaterSource = readFileSync(
  resolve(projectRoot, "distribution/windows-release/check-for-updates.ps1"),
  "utf8",
);

describe("Windows installation roadmap", () => {
  function desktopHarness(
    environment: Record<string, string>,
    fileSystem: Record<string, unknown> = {},
    spawnProcess: (...args: unknown[]) => unknown = () => {
      throw new Error("Profile configuration must not start a process");
    },
  ) {
    const configuredPaths: Array<{ name: string; value: string }> = [];
    const startupOrder: string[] = [];
    const app = {
      getPath: (name: string) => {
        expect(name).toBe("appData");
        return "C:\\Users\\Fixture\\AppData\\Roaming";
      },
      setPath: (name: string, value: string) => {
        configuredPaths.push({ name, value });
        startupOrder.push("profile");
      },
      requestSingleInstanceLock: () => {
        startupOrder.push("lock");
        return true;
      },
      whenReady: () => ({ then: () => undefined }),
      setAppUserModelId: () => undefined,
      on: () => undefined,
    };

    // Execute the real startup configuration without launching Electron,
    // services, or callbacks, or accessing an actual learner profile.
    const ensureWebRuntime = runInNewContext(
      `${desktopMain}\nensureWebRuntime;`,
      {
        require: (id: string) => {
          if (id === "electron") return { app };
          if (id === "node:path") return win32;
          if (id === "node:fs") return fileSystem;
          if (id === "node:http") return {};
          if (id === "node:child_process") {
            return { spawn: spawnProcess };
          }
          throw new Error(`Unexpected module during profile setup: ${id}`);
        },
        process: {
          env: environment,
          resourcesPath: "C:\\Fixture\\resources",
          pid: 2468,
        },
        URL,
        Buffer,
      },
    ) as (localRoot: string) => Promise<string>;
    expect(startupOrder).toEqual(["profile", "lock"]);
    expect(configuredPaths).toHaveLength(1);
    expect(configuredPaths[0]?.name).toBe("userData");
    return { profile: configuredPaths[0]?.value, ensureWebRuntime };
  }

  function configuredDesktopProfile(environment: Record<string, string>) {
    return desktopHarness(environment).profile;
  }

  test("preserves the existing desktop profile when no override is configured", () => {
    const expected = "C:\\Users\\Fixture\\AppData\\Roaming\\DeutschFlow";
    expect(configuredDesktopProfile({})).toBe(expected);
    expect(
      configuredDesktopProfile({
        DEUTSCHFLOW_USER_DATA_ROOT: "   ",
        DEUTSCHFLOW_DATA_ROOT: "\t",
      }),
    ).toBe(expected);
  });

  test("isolates the desktop profile under the explicit resolved user-data root", () => {
    expect(
      configuredDesktopProfile({
        DEUTSCHFLOW_USER_DATA_ROOT:
          " D:\\Fixture\\installer-cycle\\temporary\\..\\data ",
      }),
    ).toBe("D:\\Fixture\\installer-cycle\\data");
  });

  test("uses the installer data-root alias when the desktop override is blank", () => {
    expect(
      configuredDesktopProfile({
        DEUTSCHFLOW_USER_DATA_ROOT: " ",
        DEUTSCHFLOW_DATA_ROOT: " D:\\Fixture\\installer-cycle\\data ",
      }),
    ).toBe("D:\\Fixture\\installer-cycle\\data");
  });

  test("gives the desktop-specific root precedence over the installer alias", () => {
    expect(
      configuredDesktopProfile({
        DEUTSCHFLOW_USER_DATA_ROOT: "D:\\Fixture\\desktop-data",
        DEUTSCHFLOW_DATA_ROOT: "D:\\Fixture\\installer-data",
      }),
    ).toBe("D:\\Fixture\\desktop-data");
  });

  test("isolates runtime extraction and replacement while preserving the default cache", async () => {
    for (const [overrides, expectedBase] of [
      [{}, "C:\\Users\\Fixture\\AppData\\Local"],
      [
        {
          DEUTSCHFLOW_USER_DATA_ROOT: " D:\\Fixture\\data ",
          DEUTSCHFLOW_DATA_ROOT: "D:\\OtherFixture\\data",
        },
        "D:\\Fixture\\data",
      ],
      [{ DEUTSCHFLOW_DATA_ROOT: "D:\\Fixture\\alias" }, "D:\\Fixture\\alias"],
    ] as Array<[Record<string, string>, string]>) {
      const removed: string[] = [];
      const created: string[] = [];
      const written: string[] = [];
      const renamed: Array<[string, string]> = [];
      const extractionCommands: string[] = [];
      const runtime = desktopHarness(
        {
          LOCALAPPDATA: "C:\\Users\\Fixture\\AppData\\Local",
          ...overrides,
        },
        {
          existsSync: (file: string) =>
            /web\.(zip|sha256)$/.test(file) ||
            (file.includes("DFG-tmp-2468") && file.endsWith("server.js")),
          readFileSync: () => "fixture-payload-hash",
          rmSync: (file: string) => removed.push(file),
          mkdirSync: (file: string) => created.push(file),
          writeFileSync: (file: string) => written.push(file),
          renameSync: (from: string, to: string) => renamed.push([from, to]),
        },
        (_executable, args) => {
          const commandArgs = args as string[];
          extractionCommands.push(
            Buffer.from(commandArgs.at(-1)!, "base64").toString("utf16le"),
          );
          return {
            stderr: { setEncoding: () => undefined, on: () => undefined },
            once: (event: string, callback: (code: number) => void) => {
              if (event === "exit") callback(0);
            },
          };
        },
      );
      const expectedRuntime = win32.join(expectedBase, "DFG");
      const expectedStaging = win32.join(expectedBase, "DFG-tmp-2468");
      expect(
        await runtime.ensureWebRuntime("C:\\Fixture\\resources\\local-app"),
      ).toBe(expectedRuntime);
      expect(removed).toEqual([expectedStaging, expectedRuntime]);
      expect(created).toEqual([expectedStaging]);
      expect(written).toEqual([win32.join(expectedStaging, ".payload-sha256")]);
      expect(renamed).toEqual([[expectedStaging, expectedRuntime]]);
      expect(extractionCommands).toHaveLength(1);
      expect(extractionCommands[0]).toContain(
        `-DestinationPath '${expectedStaging}' -Force`,
      );
    }
  });

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
      // electron-builder resolves extraResources from the desktop package directory.
      const resolved = resolve(
        projectRoot,
        "distribution/windows-desktop",
        resource.from,
      );
      expect(existsSync(resolved)).toBe(true);
      // Every installer input lives inside this project, so copying the project folder is enough.
      expect(resolved.startsWith(projectRoot)).toBe(true);
    }
    expect(buildScript).not.toContain("shared\\GoogleOAuthPackaging.ps1");
    expect(buildScript).toContain(
      "distribution\\windows-release\\GoogleOAuthPackaging.ps1",
    );
    for (const file of [
      "GoogleOAuthPackaging.ps1",
      "publish-language-update.ps1",
      "setup-language-payload.ps1",
      "check-for-updates.ps1",
    ]) {
      expect(
        existsSync(resolve(projectRoot, "distribution/windows-release", file)),
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
    expect([...icon.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  test("builds without a legacy LFS compatibility launcher", () => {
    expect(buildScript).toContain(
      "Compatibility launcher payload is unavailable; retaining the newly built launcher.",
    );
    expect(buildScript).not.toContain(
      'throw "Compatibility launcher payload does not exist:',
    );
  });

  test("checks verified updates only after explicit consent", () => {
    expect(updateConfig.productId).toBe("DeutschFlowDesktop");
    expect(desktopMain).toContain("checkForUpdatesInBackground");
    expect(desktopMain).toContain("DEUTSCHFLOW_DISABLE_UPDATE_CHECK");
    expect(setupSource).toContain("InstalledUpdater");
    expect(setupSource).toContain("QuietUninstallString");
    expect(setupSource).toContain('key.SetValue("NoRepair", 0');
    expect(updaterSource).toContain("MessageBoxButtons]::YesNo");
    expect(updaterSource).toContain("Expand-SafeArchive");
    expect(updaterSource).toContain("setupSha256");
    expect(updaterSource).toContain("payloadSha256");
  });
});
