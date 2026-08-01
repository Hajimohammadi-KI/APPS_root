const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  session,
  shell,
} = require("electron");

const WEB_PORT = 3000;
const API_PORT = 4000;
const APP_URL = `http://127.0.0.1:${WEB_PORT}/`;
const APP_ORIGIN = new URL(APP_URL).origin;
const DESKTOP_USER_AGENT_TOKEN = "DeutschFlowDesktop/1.0";
const ALLOWED_PERMISSIONS = new Set(["media", "notifications"]);
const USER_DATA_DIRECTORY = "DeutschFlow";
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
let disposeGoogleCalendarBridge = null;
let disposeLearnerProfileBridge = null;
let disposeAIProviderBridge = null;
let webProcess = null;
let apiProcess = null;

app.setPath("userData", path.join(app.getPath("appData"), USER_DATA_DIRECTORY));

function isAppUrl(value) {
  try {
    return new URL(value).origin === APP_ORIGIN;
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

function findMicrosoftEdge() {
  const candidates = [
    path.join(
      process.env["PROGRAMFILES(X86)"] || "",
      "Microsoft",
      "Edge",
      "Application",
      "msedge.exe",
    ),
    path.join(
      process.env.PROGRAMFILES || "",
      "Microsoft",
      "Edge",
      "Application",
      "msedge.exe",
    ),
    path.join(
      process.env.LOCALAPPDATA || "",
      "Microsoft",
      "Edge",
      "Application",
      "msedge.exe",
    ),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function openPdf(pdfPath) {
  const edgePath = findMicrosoftEdge();
  if (edgePath) {
    const edge = spawn(edgePath, ["--new-window", pdfPath], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    edge.once("error", () => {
      void shell.openPath(pdfPath);
    });
    edge.unref();
    return "Microsoft Edge";
  }

  const error = await shell.openPath(pdfPath);
  if (error) {
    throw new Error(error);
  }
  return "Windows PDF Viewer";
}

async function chooseAndOpenPdf(ownerWindow) {
  let pdfPath = process.env.DESKTOP_PDF_AUTOMATION_PATH;
  if (!pdfPath) {
    const result = await dialog.showOpenDialog(ownerWindow, {
      title: "PDF-Datei öffnen",
      buttonLabel: "In Microsoft Edge öffnen",
      defaultPath: app.getPath("documents"),
      properties: ["openFile"],
      filters: [
        { name: "PDF-Dokumente", extensions: ["pdf"] },
        { name: "Alle Dateien", extensions: ["*"] },
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
      message: "Bitte wählen Sie eine gültige PDF-Datei aus.",
    };
  }

  try {
    const viewer = await openPdf(pdfPath);
    return {
      status: "opened",
      fileName: path.basename(pdfPath),
      viewer,
    };
  } catch {
    return {
      status: "error",
      message: "Die PDF-Datei konnte nicht geöffnet werden.",
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
    title: "DeutschFlow",
    backgroundColor: "#f5fbff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.bundle.cjs"),
      additionalArguments: [
        "--desktop-locale=de",
        "--desktop-dark=#071B46",
        "--desktop-highlight=#36D790",
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url)) {
      void mainWindow.loadURL(url, { userAgent: desktopUserAgent });
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
    if (isSafeExternalUrl(url)) {
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

app.setAppUserModelId("app.deutschflow.grammar.desktop");

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
        reject(new Error(`Lokaler Dienst wurde nicht bereit: ${url}`));
        return;
      }
      setTimeout(probe, 150);
    };
    probe();
  });
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
            `Die Offline-Anwendung konnte nicht vorbereitet werden (Code ${code}).`,
        ),
      );
    });
  });
}

async function ensureWebRuntime(localRoot) {
  const archivePath = path.join(localRoot, "web.zip");
  const hashPath = path.join(localRoot, "web.sha256");
  if (!fs.existsSync(archivePath) || !fs.existsSync(hashPath)) {
    throw new Error("Das Offline-Webpaket fehlt.");
  }

  const expectedHash = fs.readFileSync(hashPath, "utf8").trim();
  const localAppData =
    process.env.LOCALAPPDATA ||
    path.join(app.getPath("home"), "AppData", "Local");
  const runtimeRoot = path.join(localAppData, "DFG");
  const markerPath = path.join(runtimeRoot, ".payload-sha256");
  const webEntry = path.join(runtimeRoot, "apps", "web", "server.js");
  if (
    fs.existsSync(webEntry) &&
    fs.existsSync(markerPath) &&
    fs.readFileSync(markerPath, "utf8").trim() === expectedHash
  ) {
    return runtimeRoot;
  }

  const stagingRoot = path.join(localAppData, `DFG-tmp-${process.pid}`);
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  fs.mkdirSync(stagingRoot, { recursive: true });
  try {
    await expandArchive(archivePath, stagingRoot);
    const stagedEntry = path.join(stagingRoot, "apps", "web", "server.js");
    if (!fs.existsSync(stagedEntry)) {
      throw new Error("Das entpackte Offline-Webpaket ist unvollständig.");
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
  for (const requiredFile of [
    path.join(localRoot, "runtime", "bun.exe"),
    apiEntry,
    webEntry,
  ]) {
    if (!fs.existsSync(requiredFile)) {
      throw new Error(
        `Die Offline-Installation ist unvollständig: ${requiredFile}`,
      );
    }
  }

  apiProcess = spawnLocalService(apiEntry, apiRoot, {
    API_PORT: String(API_PORT),
    WEB_ORIGINS: APP_ORIGIN,
  });
  webProcess = spawnLocalService(webEntry, webRoot, {
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    PORT: String(WEB_PORT),
  });
  await Promise.all([
    waitForEndpoint(`${APP_URL}`),
    waitForEndpoint(`http://127.0.0.1:${API_PORT}/api/v1/health`),
  ]);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

app.whenReady().then(async () => {
  if (fs.existsSync(CALENDAR_BRIDGE_PATH)) {
    const { registerGoogleCalendarBridge } = require(CALENDAR_BRIDGE_PATH);
    disposeGoogleCalendarBridge = registerGoogleCalendarBridge({
      productId: "deutschflow-grammar",
      productName: "DeutschFlow",
      isTrustedUrl: isAppUrl,
      resourcesPath: CALENDAR_RESOURCES_PATH,
    });
  }
  if (fs.existsSync(LEARNER_PROFILE_BRIDGE_PATH)) {
    const { registerLearnerProfileBridge } = require(
      LEARNER_PROFILE_BRIDGE_PATH,
    );
    disposeLearnerProfileBridge = registerLearnerProfileBridge({
      productId: "deutschflow-grammar",
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
        message: "Das Dateifenster ist nicht verfügbar.",
      };
    }
    try {
      return await chooseAndOpenPdf(ownerWindow);
    } catch (error) {
      console.error("PDF picker failed:", error);
      return {
        status: "error",
        message: "Die PDF-Auswahl konnte nicht geöffnet werden.",
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
  } catch (error) {
    dialog.showErrorBox(
      "DeutschFlow",
      error instanceof Error
        ? error.message
        : "Die lokale Anwendung konnte nicht gestartet werden.",
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
  ipcMain.removeHandler(PDF_CHANNEL);
  disposeGoogleCalendarBridge?.();
  disposeGoogleCalendarBridge = null;
  disposeLearnerProfileBridge?.();
  disposeLearnerProfileBridge = null;
  disposeAIProviderBridge?.();
  disposeAIProviderBridge = null;
});
