import { mkdir } from "node:fs/promises";
import { join } from "node:path";

type Target = "all" | "android" | "windows" | "ios";

interface PackageConfig {
  name: string;
  shortName: string;
  description: string;
  version: string;
  versionCode: number;
  origin: string;
  packageId: string;
  themeColor: string;
  backgroundColor: string;
  publisher: {
    displayName: string;
    windowsCommonName: string;
  };
}

interface AndroidJob {
  id: string;
  status: "Queued" | "InProgress" | "Completed" | "Failed";
  errors: string[];
  logs: string[];
}

const target = (Bun.argv[2] ?? "all") as Target;
if (!["all", "android", "windows", "ios"].includes(target)) {
  throw new Error(`Unknown target "${target}". Use all, android, windows, or ios.`);
}

const root = join(import.meta.dir, "..");
const config = (await Bun.file(
  join(root, "distribution", "app-package.json"),
).json()) as PackageConfig;
const origin = config.origin.replace(/\/$/, "");
const manifestUrl = `${origin}/manifest.webmanifest`;
const iconUrl = `${origin}/icons/icon-512.png`;
const outputRoot = join(root, "distribution", "build");

async function fetchChecked(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `${url} returned ${response.status} ${response.statusText}: ${details}`,
    );
  }
  return response;
}

async function writeZip(
  platform: Exclude<Target, "all">,
  fileName: string,
  response: Response,
) {
  const directory = join(outputRoot, platform);
  await mkdir(directory, { recursive: true });
  const path = join(directory, fileName);
  await Bun.write(path, await response.arrayBuffer());
  console.log(`${platform}: ${path}`);
}

console.log(`Validating ${origin}`);
await fetchChecked(origin);
const manifestResponse = await fetchChecked(manifestUrl);
const manifest = (await manifestResponse.json()) as Record<string, unknown>;
await fetchChecked(iconUrl);

async function packageWindows() {
  console.log("Generating Windows package…");
  const options = {
    name: config.shortName,
    packageId: "EnglishGrammarAutomaticity",
    url: origin,
    version: config.version,
    allowSigning: true,
    publisher: {
      displayName: config.publisher.displayName,
      commonName: config.publisher.windowsCommonName,
    },
    generateModernPackage: true,
    classicPackage: {
      generate: true,
      version: config.version,
      url: origin,
    },
    edgeHtmlPackage: { generate: false },
    manifestUrl,
    manifest,
    images: {
      baseImage: iconUrl,
      backgroundColor: "transparent",
      padding: 0,
    },
    resourceLanguage: "en-us",
    extensions: "appurihandler",
  };
  const response = await fetchChecked(
    "https://pwabuilder-windows-docker.azurewebsites.net/msix/generatezip",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(options),
    },
  );
  await writeZip(
    "windows",
    `english-grammar-automaticity-windows-v${config.version}.zip`,
    response,
  );
}

async function packageIOS() {
  console.log("Generating iOS Xcode project…");
  const options = {
    name: config.shortName,
    bundleId: config.packageId,
    url: origin,
    imageUrl: iconUrl,
    splashColor: config.backgroundColor,
    progressBarColor: config.themeColor,
    statusBarColor: config.themeColor,
    permittedUrls: [
      "english-grammar-automaticity-api.vercel.app",
      "languagetool.org",
    ],
    manifestUrl,
    manifest,
  };
  const response = await fetchChecked(
    "https://www.pwabuilder.com/api/iospackage/create",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(options),
    },
  );
  await writeZip(
    "ios",
    `english-grammar-automaticity-ios-xcode-v${config.version}.zip`,
    response,
  );
}

async function packageAndroid() {
  console.log("Queueing signed Android APK/AAB package…");
  const options = {
    analysisId: null,
    appVersion: config.version,
    appVersionCode: config.versionCode,
    backgroundColor: config.backgroundColor,
    display: "standalone",
    enableNotifications: false,
    enableSiteSettingsShortcut: true,
    fallbackType: "customtabs",
    features: {
      locationDelegation: { enabled: false },
      playBilling: { enabled: false },
    },
    host: new URL(origin).host,
    iconUrl,
    includeSourceCode: true,
    isChromeOSOnly: false,
    isMetaQuest: false,
    launcherName: config.shortName.slice(0, 30),
    maskableIconUrl: iconUrl,
    monochromeIconUrl: "",
    name: config.name,
    navigationColor: config.backgroundColor,
    navigationColorDark: "#101828",
    navigationDividerColor: config.backgroundColor,
    navigationDividerColorDark: "#101828",
    orientation: "any",
    packageId: config.packageId,
    pwaUrl: origin,
    shortcuts: manifest.shortcuts ?? [],
    signing: {
      file: null,
      alias: "grammar-automaticity",
      fullName: "English Grammar Automaticity Admin",
      organization: "English Grammar Automaticity",
      organizationalUnit: "Education",
      countryCode: "DE",
      keyPassword: "",
      storePassword: "",
    },
    signingMode: "new",
    splashScreenFadeOutDuration: 300,
    startUrl: "/",
    themeColor: config.themeColor,
    themeColorDark: "#101828",
    webManifestUrl: manifestUrl,
    fullScopeUrl: `${origin}/`,
    minSdkVersion: 23,
  };
  const jobResponse = await fetchChecked(
    "https://pwabuilder-cloudapk.azurewebsites.net/enqueuePackageJob",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(options),
    },
  );
  const jobId = (await jobResponse.text()).trim();
  console.log(`Android job: ${jobId}`);

  const deadline = Date.now() + 15 * 60 * 1000;
  let job: AndroidJob | undefined;
  while (Date.now() < deadline) {
    await Bun.sleep(4_000);
    const statusResponse = await fetchChecked(
      `https://pwabuilder-cloudapk.azurewebsites.net/getPackageJob?id=${encodeURIComponent(jobId)}`,
    );
    job = (await statusResponse.json()) as AndroidJob;
    console.log(`Android status: ${job.status}`);
    if (job.status === "Completed" || job.status === "Failed") break;
  }

  if (!job || job.status !== "Completed") {
    throw new Error(
      `Android packaging did not complete. ${job?.errors.join("\n") ?? "Timed out."}`,
    );
  }

  const response = await fetchChecked(
    `https://pwabuilder-cloudapk.azurewebsites.net/downloadPackageZip?id=${encodeURIComponent(jobId)}`,
  );
  await writeZip(
    "android",
    `english-grammar-automaticity-android-v${config.version}.zip`,
    response,
  );
}

if (target === "all" || target === "windows") await packageWindows();
if (target === "all" || target === "ios") await packageIOS();
if (target === "all" || target === "android") await packageAndroid();

console.log("Packaging complete.");
