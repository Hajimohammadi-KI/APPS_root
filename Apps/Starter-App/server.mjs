import http, { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, openSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = 4300;
const root = resolve(import.meta.dirname);
const publicRoot = join(root, "public");
const logRoot = join(root, "logs");
const wslDir = join(root, "wsl");
// Everything is resolved from this file's own location so the collection is not
// pinned to one absolute drive letter.
const appsRoot = resolve(root, "..");
const integration = join(appsRoot, "Apps-For-Integeration");
mkdirSync(logRoot, { recursive: true });

// Tracker, PDF Reader, and Settings all run wrangler/workerd, whose listening
// socket is not reachable from Windows on this machine through any firewall,
// portproxy, or WSL2 networking-mode configuration -- confirmed through
// extensive testing (see docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md).
// A plain relay socket in front of it IS reachable, so these three run inside
// WSL2 via a small relay rather than directly on Windows like English/German.
function wslLaunch(scriptName) {
  return {
    executable: "wsl.exe",
    args: [
      "-d",
      "Ubuntu",
      "-u",
      "root",
      "--",
      "bash",
      `/mnt/d/APPS_root/Apps/Starter-App/wsl/${scriptName}`,
    ],
  };
}

const apps = {
  english: {
    name: "English Automaticity",
    description: "Daily practice, grammar, conversation and learning evidence",
    url: "http://127.0.0.1:3202",
    ports: [3202, 4201],
    commands: [
      { cwd: join(appsRoot, "English", "English-07082026"), executable: "bun.exe", args: ["run", "--cwd", "apps/api", "start"], log: "english-api", port: 4201 },
      { cwd: join(appsRoot, "English", "English-07082026"), executable: "bun.exe", args: ["run", "--cwd", "apps/web", "start", "--", "--hostname", "0.0.0.0", "--port", "3202"], log: "english-web", port: 3202 },
    ],
  },
  german: {
    name: "Deutsch Automaticity",
    description: "Tagestraining, Grammatik, Sprechen und Lernnachweise",
    url: "http://127.0.0.1:3210",
    ports: [3210, 4210],
    commands: [
      { cwd: join(appsRoot, "Deutsch-V10.08.2026"), executable: "bun.exe", args: ["run", "--cwd", "apps/api", "start"], log: "german-api", port: 4210 },
      { cwd: join(appsRoot, "Deutsch-V10.08.2026"), executable: "bun.exe", args: ["run", "--cwd", "apps/web", "start", "--", "--hostname", "0.0.0.0", "--port", "3210"], log: "german-web", port: 3210 },
    ],
  },
  tracker: {
    name: "Cross Repository Tracker",
    description: "Study tracker, thesis plan, PDF workflow and integrations",
    url: "http://127.0.0.1:4312",
    ports: [4312, 4313],
    runsInWsl: true,
    proxyPorts: [4312],
    commands: [
      { cwd: join(appsRoot, "Cross_Repository_Code_Intelligence-Version", "apps", "api"), executable: "bun.exe", args: ["run", "start"], log: "tracker-api", port: 4313 },
      { cwd: root, ...wslLaunch("launch-tracker.sh"), log: "tracker-web", port: 4312 },
    ],
  },
  settings: {
    name: "Settings",
    description: "Reusable preferences, accessibility and backup settings",
    url: "http://127.0.0.1:4323/settings",
    ports: [4323],
    runsInWsl: true,
    proxyPorts: [4323],
    commands: [
      { cwd: root, ...wslLaunch("launch-settings.sh"), log: "settings", port: 4323 },
    ],
  },
  pdf: {
    name: "PDF Reader",
    description: "Read, select, highlight, annotate and save PDFs",
    url: "http://127.0.0.1:4322",
    ports: [4322],
    runsInWsl: true,
    proxyPorts: [4322],
    commands: [
      { cwd: root, ...wslLaunch("launch-pdf-reader.sh"), log: "pdf-reader", port: 4322 },
    ],
  },
};

// Ports that need a Windows->WSL portproxy bridge (see ensure-portproxy.ps1).
// Set up once per Starter-App run, the first time any WSL-hosted app is
// started, rather than at startup -- avoids an unconditional UAC prompt for
// someone who only ever uses English/German.
const readyPortproxies = new Set();
function ensurePortproxy(ports = []) {
  const pendingPorts = ports.filter((proxyPort) => !readyPortproxies.has(proxyPort));
  if (pendingPorts.length === 0) return;
  const stdout = openSync(join(logRoot, "ensure-portproxy.out.log"), "a");
  const stderr = openSync(join(logRoot, "ensure-portproxy.error.log"), "a");
  const child = spawn(
    "powershell.exe",
    [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      join(wslDir, "ensure-portproxy.ps1"),
      "-PortsCsv",
      pendingPorts.join(","),
    ],
    { cwd: wslDir, windowsHide: true, stdio: ["ignore", stdout, stderr] },
  );
  // Intentionally NOT detached/unref'd -- callers that need the bridge in
  // place (startApp) await its exit before proceeding.
  return new Promise((resolveReady) => {
    child.on("exit", (exitCode) => {
      if (exitCode === 0) pendingPorts.forEach((proxyPort) => readyPortproxies.add(proxyPort));
      resolveReady();
    });
    child.on("error", () => resolveReady());
  });
}

// A raw TCP connect is not a reliable "is the app actually up" check for
// the three WSL-routed apps: once ensurePortproxy() creates the
// 127.0.0.1:<port> -> <wsl-ip>:<port> rule, Windows' own portproxy listener
// accepts the TCP handshake immediately -- regardless of whether the WSL
// side is actually listening -- so a bare TCP connect alone would report
// "running" even for a dead backend. An HTTP request has to actually
// round-trip through the relay to succeed.
function isHttpUp(checkPort) {
  return new Promise((resolvePort) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolvePort(value);
    };
    const request = http.get({ host, port: checkPort, path: "/", timeout: 1500 }, (response) => {
      response.resume();
      settle(true);
    });
    request.on("timeout", () => { request.destroy(); settle(false); });
    request.on("error", () => settle(false));
  });
}

async function appStatus(app) {
  const states = await Promise.all(app.ports.map(isHttpUp));
  return {
    running: states[0] === true,
    ready: states.every(Boolean),
    services: app.ports.map((servicePort, index) => ({ port: servicePort, running: states[index] })),
  };
}

// Per-command status, keyed by each command's own declared port -- not
// positional index into `ports`, since command order and port order don't
// always match (e.g. the api command is listed before the web command, but
// `ports` lists web first to match the app's public URL).
async function commandRunning(command) {
  return isHttpUp(command.port);
}

function launch(command) {
  if (!existsSync(command.cwd)) throw new Error(`Missing app folder: ${command.cwd}`);
  const stdout = openSync(join(logRoot, `${command.log}.out.log`), "a");
  const stderr = openSync(join(logRoot, `${command.log}.error.log`), "a");
  // A detached wsl.exe is handed to the user's configured default terminal
  // host on Windows 11, which creates the black Windows Terminal window the
  // launcher is specifically meant to avoid. The long-lived Starter process
  // can own WSL children directly; unref still keeps the HTTP server free.
  const detached = command.executable.toLowerCase() !== "wsl.exe";
  const child = spawn(command.executable, command.args, {
    cwd: command.cwd,
    detached,
    windowsHide: true,
    stdio: ["ignore", stdout, stderr],
  });
  child.unref();
}

async function startApp(id) {
  const app = apps[id];
  if (!app) throw new Error("Unknown app");
  if (app.runsInWsl) await ensurePortproxy(app.proxyPorts);
  for (const command of app.commands) {
    if (!(await commandRunning(command))) launch(command);
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    const status = await appStatus(app);
    if (status.ready || (app.ports.length === 1 && status.running)) return status;
  }
  return appStatus(app);
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

const mimeTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
    if (requestUrl.pathname === "/api/health") {
      return sendJson(response, 200, { status: "ok" });
    }
    if (requestUrl.pathname === "/api/status") {
      const result = Object.fromEntries(
        await Promise.all(
          Object.entries(apps).map(async ([id, app]) => [
            id,
            { ...app, ...(await appStatus(app)), commands: undefined },
          ]),
        ),
      );
      return sendJson(response, 200, result);
    }
    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/start/")) {
      const id = requestUrl.pathname.split("/").pop();
      const status = await startApp(id);
      return sendJson(response, status.running ? 200 : 503, { ...status, url: apps[id]?.url });
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/start-all") {
      const result = {};
      for (const id of Object.keys(apps)) result[id] = await startApp(id);
      return sendJson(response, 200, result);
    }

    const relative = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
    const file = resolve(publicRoot, relative);
    if (!file.startsWith(publicRoot) || !existsSync(file)) {
      response.writeHead(404); response.end("Not found"); return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(file).pipe(response);
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
}).listen(port, host, () => {
  console.log(`App Starter ready at http://${host}:${port}`);
});
