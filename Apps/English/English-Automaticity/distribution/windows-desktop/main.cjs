const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");
const crypto = require("node:crypto");

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  session,
  shell,
} = require("electron");

const WEB_PORT = 3202;
const API_PORT = 4201;
const APP_URL = `http://127.0.0.1:${WEB_PORT}/`;
const APP_ORIGIN = new URL(APP_URL).origin;
const READER_PORT = 4332;
const READER_URL = `http://127.0.0.1:${READER_PORT}/`;
const READER_ORIGIN = new URL(READER_URL).origin;
const DESKTOP_VERSION = "27.3.30";
const DESKTOP_USER_AGENT_TOKEN = `EnglishGrammarAutomaticityDesktop/${DESKTOP_VERSION}`;
const ALLOWED_PERMISSIONS = new Set(["media", "notifications"]);
const USER_DATA_DIRECTORY = "English Grammar Automaticity";
const configuredUserDataRoot =
  process.env.ENGLISH_GRAMMAR_USER_DATA_ROOT?.trim() ||
  process.env.ENGLISH_GRAMMAR_DATA_ROOT?.trim();
const PDF_CHANNEL = "desktop:choose-pdf";
const CALENDAR_RESOURCES_PATH =
  process.env.STUDY_CALENDAR_RESOURCE_ROOT || process.resourcesPath;
const CALENDAR_BRIDGE_PATH = path.join(
  CALENDAR_RESOURCES_PATH,
  "google-calendar-bridge.cjs",
);
const LEARNER_PROFILE_BRIDGE_PATH = path.join(
  CALENDAR_RESOURCES_PATH,
  "learner-profile-bridge.cjs",
);
const AI_PROVIDER_BRIDGE_PATH = path.join(
  CALENDAR_RESOURCES_PATH,
  "ai-provider-bridge.cjs",
);
const UPDATE_CHECK_SCRIPT = path.join(
  process.resourcesPath,
  "update",
  "check-for-updates.ps1",
);
const UPDATE_CONFIG = path.join(
  process.resourcesPath,
  "update",
  "update-config.json",
);
let disposeGoogleCalendarBridge = null;
let disposeLearnerProfileBridge = null;
let disposeAIProviderBridge = null;
let webProcess = null;
let apiProcess = null;
let readerProcess = null;
let readerManagedByDesktop = false;
const readerWindows = new Set();

function checkForUpdatesInBackground() {
  if (
    process.env.ENGLISH_GRAMMAR_DISABLE_UPDATE_CHECK === "1" ||
    !fs.existsSync(UPDATE_CHECK_SCRIPT) ||
    !fs.existsSync(UPDATE_CONFIG)
  ) {
    return;
  }
  const powershell = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  const child = spawn(
    powershell,
    [
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      UPDATE_CHECK_SCRIPT,
      "-Configuration",
      UPDATE_CONFIG,
      "-Automatic",
    ],
    { detached: true, windowsHide: true, stdio: "ignore" },
  );
  child.unref();
}

app.setPath(
  "userData",
  configuredUserDataRoot
    ? path.resolve(configuredUserDataRoot)
    : path.join(app.getPath("appData"), USER_DATA_DIRECTORY),
);
app.setAppUserModelId("app.englishgrammar.automaticity.desktop");

function waitForEndpoint(url, attempts = 100) {
  return new Promise((resolve, reject) => {
    let remaining = attempts;
    const probe = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (
          response.statusCode &&
          response.statusCode >= 200 &&
          response.statusCode < 500
        ) {
          resolve();
          return;
        }
        retry();
      });
      request.setTimeout(1_000, () => request.destroy());
      request.on("error", retry);
    };
    const retry = () => {
      remaining -= 1;
      if (remaining <= 0) {
        reject(new Error(`Local service did not become ready: ${url}`));
        return;
      }
      setTimeout(probe, 150);
    };
    probe();
  });
}

function readJsonEndpoint(url) {
  return new Promise((resolve) => {
    const request = http.get(url, { headers: { Accept: "application/json" } }, (response) => {
      const chunks = [];
      let size = 0;
      response.on("data", (chunk) => {
        size += chunk.length;
        if (size <= 128 * 1024) chunks.push(chunk);
      });
      response.on("end", () => {
        if (response.statusCode !== 200 || size > 128 * 1024) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch {
          resolve(null);
        }
      });
    });
    request.setTimeout(1_000, () => request.destroy());
    request.on("error", () => resolve(null));
  });
}

function matchesReaderHealth(payload) {
  return (
    payload?.service === "research-pdf-studio" &&
    payload?.ready === true &&
    payload?.contractVersion === 1 &&
    payload?.storageBoundary === "browser-local" &&
    payload?.localPdfImport === "loopback-only"
  );
}

async function waitForReaderHealth(attempts = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (matchesReaderHealth(await readJsonEndpoint(`${READER_URL}api/health`))) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(
    `Research PDF Studio did not return its expected health contract on port ${READER_PORT}.`,
  );
}

function spawnLocalService(entryPoint, workingDirectory, environment) {
  const runtime = path.join(
    process.resourcesPath,
    "local-app",
    "runtime",
    "bun.exe",
  );
  const childEnvironment = {
    ...process.env,
    ...environment,
    ELECTRON_RUN_AS_NODE: undefined,
  };
  delete childEnvironment.ELECTRON_RUN_AS_NODE;
  return spawn(runtime, [entryPoint], {
    cwd: workingDirectory,
    env: childEnvironment,
    windowsHide: true,
    stdio: "ignore",
  });
}

function expandArchive(archivePath, destinationPath) {
  return new Promise((resolve, reject) => {
    const powershell = path.join(
      process.env.SystemRoot || "C:\\Windows",
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    const quotePowerShell = (value) => `'${value.replaceAll("'", "''")}'`;
    const command = `Expand-Archive -LiteralPath ${quotePowerShell(
      archivePath,
    )} -DestinationPath ${quotePowerShell(destinationPath)} -Force`;
    const encodedCommand = Buffer.from(command, "utf16le").toString("base64");
    const child = spawn(
      powershell,
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-EncodedCommand",
        encodedCommand,
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    let errorOutput = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      errorOutput += chunk;
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          errorOutput.trim() ||
            `The offline application could not be prepared (code ${code}).`,
        ),
      );
    });
  });
}

async function ensureWebRuntime(localRoot) {
  const archivePath = path.join(localRoot, "web.zip");
  const hashPath = path.join(localRoot, "web.sha256");
  if (!fs.existsSync(archivePath) || !fs.existsSync(hashPath)) {
    throw new Error("The offline web package is missing.");
  }

  const expectedHash = fs.readFileSync(hashPath, "utf8").trim();
  const runtimeCacheBase = configuredUserDataRoot
    ? path.resolve(configuredUserDataRoot)
    : process.env.LOCALAPPDATA ||
      path.join(app.getPath("home"), "AppData", "Local");
  const runtimeRoot = path.join(runtimeCacheBase, "EGA");
  const markerPath = path.join(runtimeRoot, ".payload-sha256");
  const webEntry = path.join(runtimeRoot, "apps", "web", "server.js");
  if (
    fs.existsSync(webEntry) &&
    fs.existsSync(markerPath) &&
    fs.readFileSync(markerPath, "utf8").trim() === expectedHash
  ) {
    return runtimeRoot;
  }

  const stagingRoot = path.join(runtimeCacheBase, `EGA-tmp-${process.pid}`);
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });
  try {
    await expandArchive(archivePath, stagingRoot);
    const stagedEntry = path.join(stagingRoot, "apps", "web", "server.js");
    if (!fs.existsSync(stagedEntry)) {
      throw new Error("The extracted offline web package is incomplete.");
    }
    fs.writeFileSync(
      path.join(stagingRoot, ".payload-sha256"),
      expectedHash,
      "utf8",
    );
    fs.rmSync(runtimeRoot, { recursive: true, force: true });
    fs.renameSync(stagingRoot, runtimeRoot);
  } catch (error) {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
  }
  return runtimeRoot;
}

async function startLocalApplication() {
  const localRoot = path.join(process.resourcesPath, "local-app");
  const webRuntime = await ensureWebRuntime(localRoot);
  const webRoot = path.join(webRuntime, "apps", "web");
  const webEntry = path.join(webRoot, "server.js");
  const apiRoot = path.join(localRoot, "api");
  const apiEntry = path.join(apiRoot, "main.js");
  const readerRoot = path.join(localRoot, "reader");
  const readerEntry = path.join(readerRoot, "scripts", "start-local.mjs");
  const readerImportsRoot = path.join(app.getPath("userData"), "PDF Reader Imports");
  for (const requiredFile of [
    path.join(localRoot, "runtime", "bun.exe"),
    apiEntry,
    webEntry,
    readerEntry,
    path.join(readerRoot, "dist", "server", "index.js"),
    path.join(readerRoot, "package.json"),
  ]) {
    if (!fs.existsSync(requiredFile)) {
      throw new Error(`The offline installation is incomplete: ${requiredFile}`);
    }
  }

  apiProcess = spawnLocalService(apiEntry, apiRoot, {
    CORS_ORIGINS: APP_ORIGIN,
    PORT: String(API_PORT),
  });
  webProcess = spawnLocalService(webEntry, webRoot, {
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    PORT: String(WEB_PORT),
  });
  fs.mkdirSync(readerImportsRoot, { recursive: true });
  if (!matchesReaderHealth(await readJsonEndpoint(`${READER_URL}api/health`))) {
    readerProcess = spawnLocalService(readerEntry, readerRoot, {
      HOSTNAME: "127.0.0.1",
      PDF_READER_IMPORT_ROOT: readerImportsRoot,
      PDF_READER_RELEASE_VERSION: DESKTOP_VERSION,
      PORT: String(READER_PORT),
    });
    readerManagedByDesktop = true;
  }
  await Promise.all([
    waitForEndpoint(`${APP_URL}`),
    waitForEndpoint(`http://127.0.0.1:${API_PORT}/api/health`),
    waitForReaderHealth(),
  ]);
}

function isAppUrl(value) {
  try {
    return new URL(value).origin === APP_ORIGIN;
  } catch {
    return false;
  }
}

function isReaderUrl(value) {
  try {
    return new URL(value).origin === READER_ORIGIN;
  } catch {
    return false;
  }
}

function isSafeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function fileSha256(pdfPath) {
  return new Promise((resolve, reject) => {
    const hasher = crypto.createHash("sha256");
    const stream = fs.createReadStream(pdfPath);
    stream.on("data", (chunk) => hasher.update(chunk));
    stream.once("error", reject);
    stream.once("end", () => resolve(hasher.digest("hex")));
  });
}

function createReaderWindow(url = READER_URL) {
  const readerWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 760,
    minHeight: 620,
    show: false,
    title: "Research PDF Studio",
    backgroundColor: "#F7F5FC",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      devTools: false,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
  });
  readerWindows.add(readerWindow);
  readerWindow.once("ready-to-show", () => readerWindow.show());
  readerWindow.once("closed", () => readerWindows.delete(readerWindow));
  readerWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (isReaderUrl(target)) void readerWindow.loadURL(target);
    else if (isSafeExternalUrl(target)) void shell.openExternal(target);
    return { action: "deny" };
  });
  readerWindow.webContents.on("will-navigate", (event, target) => {
    if (isReaderUrl(target)) return;
    event.preventDefault();
    if (isSafeExternalUrl(target)) void shell.openExternal(target);
  });
  readerWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());
  void readerWindow.loadURL(url);
  return readerWindow;
}

async function chooseAndOpenPdf(ownerWindow) {
  let pdfPath = process.env.DESKTOP_PDF_AUTOMATION_PATH;
  if (!pdfPath) {
    const result = await dialog.showOpenDialog(ownerWindow, {
      title: "Open a PDF file",
      buttonLabel: "Open in Research PDF Studio",
      defaultPath: app.getPath("documents"),
      properties: ["openFile"],
      filters: [
        { name: "PDF documents", extensions: ["pdf"] },
        { name: "All files", extensions: ["*"] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { status: "cancelled" };
    }
    [pdfPath] = result.filePaths;
  }

  pdfPath = path.resolve(pdfPath);
  if (
    path.extname(pdfPath).toLowerCase() !== ".pdf" ||
    !fs.existsSync(pdfPath) ||
    !fs.statSync(pdfPath).isFile()
  ) {
    return {
      status: "error",
      message: "Please choose a valid PDF file.",
    };
  }

  try {
    const readerImportsRoot = path.join(app.getPath("userData"), "PDF Reader Imports");
    fs.mkdirSync(readerImportsRoot, { recursive: true });
    const id = await fileSha256(pdfPath);
    const importedPath = path.join(readerImportsRoot, `${id}.pdf`);
    if (!fs.existsSync(importedPath)) fs.copyFileSync(pdfPath, importedPath);
    const target = new URL(READER_URL);
    target.searchParams.set("localPdf", id);
    target.searchParams.set("name", path.basename(pdfPath));
    createReaderWindow(target.toString());
    return {
      status: "opened",
      fileName: path.basename(pdfPath),
      viewer: "Research PDF Studio",
    };
  } catch {
    return {
      status: "error",
      message: "The PDF file could not be opened.",
    };
  }
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 880,
    minHeight: 640,
    show: false,
    title: "English Grammar Automaticity",
    backgroundColor: "#F8F5FC",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.bundle.cjs"),
      additionalArguments: [
        "--desktop-locale=en",
        "--desktop-dark=#493465",
        "--desktop-highlight=#7A5AA0",
      ],
      contextIsolation: true,
      devTools: false,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
  });

  const desktopUserAgent = `${mainWindow.webContents.getUserAgent()} ${DESKTOP_USER_AGENT_TOKEN}`;
  mainWindow.webContents.setUserAgent(desktopUserAgent);
  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("did-finish-load", () => {
    if (!isAppUrl(mainWindow.webContents.getURL())) {
      return;
    }
    void mainWindow.webContents.insertCSS(
      ".install-app-controls { display: none !important; }",
    );
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) {
      void mainWindow.loadURL(url, { userAgent: desktopUserAgent });
    } else if (isReaderUrl(url)) {
      createReaderWindow(url);
    } else if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url)) {
      return;
    }
    event.preventDefault();
    if (isReaderUrl(url)) {
      createReaderWindow(url);
    } else if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  let showingOfflinePage = false;
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, _description, _url, isMainFrame) => {
      if (!isMainFrame || errorCode === -3 || showingOfflinePage) {
        return;
      }
      showingOfflinePage = true;
      void mainWindow.loadFile(path.join(__dirname, "offline.html"));
    },
  );

  void mainWindow.loadURL(APP_URL, { userAgent: desktopUserAgent });
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

app.whenReady().then(async () => {
  if (fs.existsSync(CALENDAR_BRIDGE_PATH)) {
    const { registerGoogleCalendarBridge } = require(CALENDAR_BRIDGE_PATH);
    disposeGoogleCalendarBridge = registerGoogleCalendarBridge({
      productId: "english-grammar-automaticity",
      productName: "English Grammar Automaticity",
      isTrustedUrl: isAppUrl,
      resourcesPath: CALENDAR_RESOURCES_PATH,
    });
  }
  if (fs.existsSync(LEARNER_PROFILE_BRIDGE_PATH)) {
    const { registerLearnerProfileBridge } = require(
      LEARNER_PROFILE_BRIDGE_PATH,
    );
    disposeLearnerProfileBridge = registerLearnerProfileBridge({
      productId: "english-grammar-automaticity",
      isTrustedUrl: isAppUrl,
    });
  }
  if (fs.existsSync(AI_PROVIDER_BRIDGE_PATH)) {
    const { registerAIProviderBridge } = require(AI_PROVIDER_BRIDGE_PATH);
    disposeAIProviderBridge = registerAIProviderBridge({
      isTrustedUrl: isAppUrl,
    });
  }

  ipcMain.handle(PDF_CHANNEL, async (event) => {
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    if (!ownerWindow || ownerWindow.isDestroyed()) {
      return {
        status: "error",
        message: "The file dialog is not available.",
      };
    }
    try {
      return await chooseAndOpenPdf(ownerWindow);
    } catch (error) {
      console.error("PDF picker failed:", error);
      return {
        status: "error",
        message: "The PDF picker could not be opened.",
      };
    }
  });

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      const requestingUrl = details.requestingUrl || webContents.getURL();
      callback(isAppUrl(requestingUrl) && ALLOWED_PERMISSIONS.has(permission));
    },
  );
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) =>
      Boolean(webContents) &&
      isAppUrl(requestingOrigin) &&
      ALLOWED_PERMISSIONS.has(permission),
  );

  try {
    await startLocalApplication();
    createMainWindow();
    setTimeout(checkForUpdatesInBackground, 2_500);
  } catch (error) {
    dialog.showErrorBox(
      "English Grammar Automaticity",
      error instanceof Error
        ? error.message
        : "The local application could not be started.",
    );
    app.quit();
    return;
  }
  app.on("second-instance", () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (!window) {
      createMainWindow();
      return;
    }
    if (window.isMinimized()) {
      window.restore();
    }
    window.focus();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  webProcess?.kill();
  webProcess = null;
  apiProcess?.kill();
  apiProcess = null;
  if (readerManagedByDesktop) readerProcess?.kill();
  readerProcess = null;
  readerManagedByDesktop = false;
  ipcMain.removeHandler(PDF_CHANNEL);
  disposeGoogleCalendarBridge?.();
  disposeGoogleCalendarBridge = null;
  disposeLearnerProfileBridge?.();
  disposeLearnerProfileBridge = null;
  disposeAIProviderBridge?.();
  disposeAIProviderBridge = null;
});
