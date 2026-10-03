import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type Platform = "android" | "ios" | "windows";

interface AndroidConfig {
  packageId: string;
  versionCode: number;
}

interface IosConfig {
  bundleId: string;
}

interface WindowsConfig {
  packageId: string;
  publisherDisplayName: string;
  publisherCommonName: string;
  storeIdentityConfigured: boolean;
}

interface StorePackageConfig {
  appUrl: string;
  manifestPath: string;
  name: string;
  fullName: string;
  version: string;
  themeColor: string;
  backgroundColor: string;
  android: AndroidConfig;
  ios: IosConfig;
  windows: WindowsConfig;
}

interface ManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: string;
}

interface WebManifest {
  name?: string;
  short_name?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  orientation?: string;
  background_color?: string;
  theme_color?: string;
  icons?: ManifestIcon[];
  shortcuts?: unknown[];
  [key: string]: unknown;
}

interface AndroidPackageJob {
  id: string;
  status: "Queued" | "InProgress" | "Completed" | "Failed";
  errors: string[];
  logs: string[];
}

const projectRoot = resolve(import.meta.dir, "..");
const configPath = resolve(
  projectRoot,
  "distribution/store-package.config.json",
);
const outputRoot = resolve(projectRoot, "artifacts/store-packages");
const androidService = "https://pwabuilder-cloudapk.azurewebsites.net";
const windowsService =
  "https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip";
const iosService = "https://www.pwabuilder.com/api/iospackage/create";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${context}.${key} must be a non-empty string.`);
  }
  return value;
}

function requireInteger(
  record: Record<string, unknown>,
  key: string,
  context: string,
): number {
  const value = record[key];
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${context}.${key} must be a positive integer.`);
  }
  return value as number;
}

function requireRecord(
  record: Record<string, unknown>,
  key: string,
  context: string,
): Record<string, unknown> {
  const value = record[key];
  if (!isRecord(value)) {
    throw new Error(`${context}.${key} must be an object.`);
  }
  return value;
}

function parseConfig(value: unknown): StorePackageConfig {
  if (!isRecord(value)) {
    throw new Error("Store package configuration must be an object.");
  }

  const android = requireRecord(value, "android", "config");
  const ios = requireRecord(value, "ios", "config");
  const windows = requireRecord(value, "windows", "config");
  const storeIdentityConfigured = windows.storeIdentityConfigured;

  if (typeof storeIdentityConfigured !== "boolean") {
    throw new Error(
      "config.windows.storeIdentityConfigured must be a boolean.",
    );
  }

  return {
    appUrl: requireString(value, "appUrl", "config"),
    manifestPath: requireString(value, "manifestPath", "config"),
    name: requireString(value, "name", "config"),
    fullName: requireString(value, "fullName", "config"),
    version: requireString(value, "version", "config"),
    themeColor: requireString(value, "themeColor", "config"),
    backgroundColor: requireString(value, "backgroundColor", "config"),
    android: {
      packageId: requireString(android, "packageId", "config.android"),
      versionCode: requireInteger(android, "versionCode", "config.android"),
    },
    ios: {
      bundleId: requireString(ios, "bundleId", "config.ios"),
    },
    windows: {
      packageId: requireString(windows, "packageId", "config.windows"),
      publisherDisplayName: requireString(
        windows,
        "publisherDisplayName",
        "config.windows",
      ),
      publisherCommonName: requireString(
        windows,
        "publisherCommonName",
        "config.windows",
      ),
      storeIdentityConfigured,
    },
  };
}

function parseManifest(value: unknown): WebManifest {
  if (!isRecord(value)) {
    throw new Error("The deployed web manifest is not a JSON object.");
  }
  if (
    !Array.isArray(value.icons) ||
    !value.icons.some(
      (icon) =>
        isRecord(icon) && typeof icon.src === "string" && icon.src.length > 0,
    )
  ) {
    throw new Error("The deployed web manifest has no usable icons.");
  }
  return value as WebManifest;
}

function parseAndroidJob(value: unknown): AndroidPackageJob {
  if (!isRecord(value)) {
    throw new Error("Android package service returned an invalid job.");
  }

  const status = value.status;
  if (
    status !== "Queued" &&
    status !== "InProgress" &&
    status !== "Completed" &&
    status !== "Failed"
  ) {
    throw new Error("Android package service returned an unknown job status.");
  }

  return {
    id: requireString(value, "id", "androidJob"),
    status,
    errors: Array.isArray(value.errors)
      ? value.errors.filter((item): item is string => typeof item === "string")
      : [],
    logs: Array.isArray(value.logs)
      ? value.logs.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function getRequestedPlatforms(): Platform[] {
  const option = process.argv.find((value) => value.startsWith("--platform="));
  if (!option) {
    return ["android", "ios", "windows"];
  }

  const value = option.slice("--platform=".length);
  if (value === "all") {
    return ["android", "ios", "windows"];
  }
  if (value === "android" || value === "ios" || value === "windows") {
    return [value];
  }
  throw new Error(
    "--platform must be android, ios, windows, or all (the default).",
  );
}

function resolveIconUrl(manifest: WebManifest, manifestUrl: URL): string {
  const icons = manifest.icons ?? [];
  const preferred =
    icons.find(
      (icon) =>
        icon.type === "image/png" &&
        icon.sizes?.split(/\s+/u).includes("512x512"),
    ) ??
    icons.find((icon) => icon.type === "image/png") ??
    icons[0];

  if (!preferred) {
    throw new Error("No icon is available for store packaging.");
  }
  return new URL(preferred.src, manifestUrl).toString();
}

function resolveMaskableIconUrl(
  manifest: WebManifest,
  manifestUrl: URL,
): string {
  const icon = manifest.icons?.find((candidate) =>
    candidate.purpose?.split(/\s+/u).includes("maskable"),
  );
  return icon ? new URL(icon.src, manifestUrl).toString() : "";
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "user-agent": "DeutschFlow store packager/1.0" },
  });
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function postJson(url: string, payload: unknown): Promise<Response> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "DeutschFlow store packager/1.0",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `POST ${url} failed with HTTP ${response.status}: ${details}`,
    );
  }
  return response;
}

async function writeResponse(
  response: Response,
  outputPath: string,
): Promise<void> {
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()), {
    flag: "wx",
  });
}

async function packageAndroid(
  config: StorePackageConfig,
  manifest: WebManifest,
  appUrl: URL,
  manifestUrl: URL,
  iconUrl: string,
): Promise<void> {
  const outputPath = resolve(
    outputRoot,
    `android/DeutschFlow-Android-v${config.version}.zip`,
  );
  await mkdir(resolve(outputRoot, "android"), { recursive: true });

  const payload = {
    analysisId: null,
    additionalTrustedOrigins: [],
    appVersion: config.version,
    appVersionCode: config.android.versionCode,
    backgroundColor: manifest.background_color ?? config.backgroundColor,
    display: manifest.display === "fullscreen" ? "fullscreen" : "standalone",
    enableNotifications: false,
    enableSiteSettingsShortcut: true,
    fallbackType: "customtabs",
    features: {
      locationDelegation: { enabled: false },
      playBilling: { enabled: false },
    },
    fullScopeUrl: new URL(manifest.scope ?? "/", appUrl).toString(),
    host: appUrl.host,
    iconUrl,
    includeSourceCode: true,
    isChromeOSOnly: false,
    isMetaQuest: false,
    launcherName: config.name,
    maskableIconUrl: resolveMaskableIconUrl(manifest, manifestUrl),
    monochromeIconUrl: "",
    name: config.fullName,
    navigationColor: config.themeColor,
    navigationColorDark: "#0b2a55",
    navigationDividerColor: config.themeColor,
    navigationDividerColorDark: "#0b2a55",
    orientation: manifest.orientation ?? "any",
    packageId: config.android.packageId,
    pwaUrl: appUrl.toString(),
    shortcuts: manifest.shortcuts ?? [],
    signing: {
      file: null,
      alias: "deutschflow-upload",
      fullName: "DeutschFlow Admin",
      organization: "DeutschFlow",
      organizationalUnit: "Education",
      countryCode: "DE",
      keyPassword: "",
      storePassword: "",
    },
    signingMode: "new",
    splashScreenFadeOutDuration: 300,
    startUrl: new URL(manifest.start_url ?? "/", appUrl).pathname,
    themeColor: manifest.theme_color ?? config.themeColor,
    themeColorDark: "#0b2a55",
    webManifestUrl: manifestUrl.toString(),
    minSdkVersion: 23,
  };

  const enqueueResponse = await postJson(
    `${androidService}/enqueuePackageJob`,
    payload,
  );
  const jobId = (await enqueueResponse.text()).trim().replaceAll('"', "");
  if (!jobId) {
    throw new Error("Android package service returned no job ID.");
  }
  console.log(`Android packaging job: ${jobId}`);

  const deadline = Date.now() + 15 * 60 * 1000;
  while (Date.now() < deadline) {
    await Bun.sleep(5_000);
    const job = parseAndroidJob(
      await fetchJson(
        `${androidService}/getPackageJob?id=${encodeURIComponent(jobId)}`,
      ),
    );
    console.log(`Android status: ${job.status}`);

    if (job.status === "Failed") {
      throw new Error(
        `Android packaging failed: ${job.errors.join("; ") || job.logs.at(-1) || "unknown error"}`,
      );
    }
    if (job.status === "Completed") {
      const download = await fetch(
        `${androidService}/downloadPackageZip?id=${encodeURIComponent(jobId)}`,
      );
      if (!download.ok) {
        throw new Error(
          `Android package download failed with HTTP ${download.status}.`,
        );
      }
      await writeResponse(download, outputPath);
      console.log(`Android package saved: ${outputPath}`);
      return;
    }
  }

  throw new Error("Android packaging timed out after 15 minutes.");
}

async function packageIos(
  config: StorePackageConfig,
  manifest: WebManifest,
  appUrl: URL,
  manifestUrl: URL,
  iconUrl: string,
): Promise<void> {
  const outputPath = resolve(
    outputRoot,
    `ios/DeutschFlow-iOS-Xcode-v${config.version}.zip`,
  );
  await mkdir(resolve(outputRoot, "ios"), { recursive: true });

  const response = await postJson(iosService, {
    name: config.name,
    bundleId: config.ios.bundleId,
    url: new URL(manifest.start_url ?? "/", appUrl).toString(),
    imageUrl: iconUrl,
    splashColor: manifest.background_color ?? config.backgroundColor,
    progressBarColor: manifest.theme_color ?? config.themeColor,
    statusBarColor: manifest.theme_color ?? config.themeColor,
    permittedUrls: [appUrl.origin],
    manifestUrl: manifestUrl.toString(),
    manifest,
  });
  await writeResponse(response, outputPath);
  console.log(`iOS Xcode project saved: ${outputPath}`);
}

async function packageWindows(
  config: StorePackageConfig,
  manifest: WebManifest,
  appUrl: URL,
  manifestUrl: URL,
  iconUrl: string,
): Promise<void> {
  const suffix = config.windows.storeIdentityConfigured ? "Store" : "Sideload";
  const outputPath = resolve(
    outputRoot,
    `windows/DeutschFlow-Windows-${suffix}-v${config.version}.zip`,
  );
  await mkdir(resolve(outputRoot, "windows"), { recursive: true });

  const response = await postJson(windowsService, {
    name: config.name,
    packageId: config.windows.packageId,
    url: appUrl.toString(),
    version: config.version,
    allowSigning: true,
    publisher: {
      displayName: config.windows.publisherDisplayName,
      commonName: config.windows.publisherCommonName,
    },
    generateModernPackage: true,
    classicPackage: {
      generate: true,
      version: config.version,
      url: appUrl.toString(),
    },
    edgeHtmlPackage: { generate: false },
    manifestUrl: manifestUrl.toString(),
    manifest,
    images: {
      baseImage: iconUrl,
      backgroundColor: "transparent",
      padding: 0,
    },
    resourceLanguage: "de-de",
    enableWebAppWidgets: false,
    extensions: "appurihandler",
  });
  await writeResponse(response, outputPath);
  console.log(`Windows package saved: ${outputPath}`);
}

async function main(): Promise<void> {
  const requestedPlatforms = getRequestedPlatforms();
  const config = parseConfig(
    JSON.parse(await readFile(configPath, "utf8")) as unknown,
  );
  const appUrl = new URL(config.appUrl);
  const manifestUrl = new URL(config.manifestPath, appUrl);
  const manifest = parseManifest(await fetchJson(manifestUrl.toString()));
  const iconUrl = resolveIconUrl(manifest, manifestUrl);

  await mkdir(outputRoot, { recursive: true });
  console.log(`Packaging ${requestedPlatforms.join(", ")} from ${appUrl}`);

  for (const platform of requestedPlatforms) {
    if (platform === "android") {
      await packageAndroid(config, manifest, appUrl, manifestUrl, iconUrl);
    } else if (platform === "ios") {
      await packageIos(config, manifest, appUrl, manifestUrl, iconUrl);
    } else {
      await packageWindows(config, manifest, appUrl, manifestUrl, iconUrl);
    }
  }
}

await main();
