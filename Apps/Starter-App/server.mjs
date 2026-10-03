import http, { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, openSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { probeHttpHealth } from "./health.mjs";

const host = "127.0.0.1";

function readPort(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(value) && value >= 1024 && value <= 65_535 ? value : fallback;
}

const port = readPort("STARTER_PORT", 4300);
const pdfReaderPort = readPort("PDF_READER_PORT", 4332);
const root = resolve(import.meta.dirname);
const publicRoot = join(root, "public");
const logRoot = join(root, "logs");
const wslDir = join(root, "wsl");
// Everything is resolved from this file's own location so the collection is not
// pinned to one absolute drive letter.
const appsRoot = resolve(root, "..");
const integration = join(appsRoot, "Apps-For-Integeration");
const pdfReaderHost = process.env.PDF_READER_ALLOW_LAN === "1" ? "0.0.0.0" : "127.0.0.1";
mkdirSync(logRoot, { recursive: true });

function windowsPathToWsl(path) {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(path);
  if (!match) throw new Error(`Cannot convert path to WSL: ${path}`);
  return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll("\\", "/")}`;
}

function wslLaunch(appRoot) {
  const wslAppRoot = windowsPathToWsl(appRoot);
  const command =
    `bash "${wslAppRoot}/scripts/wsl/prepare-wsl.sh" "${wslAppRoot}" && ` +
    `exec bash "${wslAppRoot}/scripts/wsl/run-web.sh" "${wslAppRoot}"`;
  return {
    executable: "wsl.exe",
    args: ["-d", "Ubuntu", "-u", "root", "--", "bash", "-lc", command],
  };
}

const englishRoot = join(appsRoot, "English", "English-Automaticity");
const germanRoot = join(appsRoot, "Deutsch-Automaticity");
// Use the restored canonical Tracker tree; all launch and release tooling now resolves this same directory.
const trackerRoot = join(appsRoot, "Study-Tracker");
const settingsRoot = join(integration, "Einstellungen-APP");
const pdfReaderRoot = join(integration, "Reader-PDF-App");

const apps = Object.assign(Object.create(null), {
  english: {
    name: "English Automaticity",
    description: "Daily practice, grammar, conversation and learning evidence",
    url: "http://127.0.0.1:3202",
    ports: [3202, 4201],
    commands: [
      { cwd: englishRoot, executable: "bun.exe", args: ["run", "--cwd", "apps/api", "start"], log: "english-api", port: 4201 },
      { cwd: englishRoot, executable: "bun.exe", args: ["run", "--cwd", "apps/web", "start", "--", "--hostname", "127.0.0.1", "--port", "3202"], log: "english-web", port: 3202 },
    ],
  },
  german: {
    name: "Deutsch Automaticity",
    description: "Tagestraining, Grammatik, Sprechen und Lernnachweise",
    url: "http://127.0.0.1:3210",
    ports: [3210, 4210],
    commands: [
      { cwd: germanRoot, executable: "bun.exe", args: ["run", "--cwd", "apps/api", "start"], log: "german-api", port: 4210 },
      { cwd: germanRoot, executable: "bun.exe", args: ["run", "--cwd", "apps/web", "start", "--", "--hostname", "127.0.0.1", "--port", "3210"], log: "german-web", port: 3210 },
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
      { cwd: trackerRoot, executable: "bun.exe", args: ["run", "start:api"], log: "tracker-api", port: 4313 },
      { cwd: root, ...wslLaunch(trackerRoot), log: "tracker-web", port: 4312 },
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
      { cwd: root, ...wslLaunch(settingsRoot), log: "settings", port: 4323 },
    ],
  },
  pdf: {
    name: "PDF Reader",
    description: "Read, select, highlight, annotate and save PDFs",
    url: `http://127.0.0.1:${pdfReaderPort}`,
    ports: [pdfReaderPort],
    health: {
      url: `http://127.0.0.1:${pdfReaderPort}/api/health`,
      expected: { service: "research-pdf-studio", ready: true, contractVersion: 1 },
    },
    commands: [
      {
        cwd: pdfReaderRoot,
        executable: "node.exe",
        args: ["scripts/start-local.mjs", "--hostname", pdfReaderHost, "--port", String(pdfReaderPort)],
        log: "pdf-reader",
        port: pdfReaderPort,
      },
    ],
  },
});

const readyPortproxies = new Set();
function ensurePortproxy(ports = []) {
  const pendingPorts = ports.filter((proxyPort) => !readyPortproxies.has(proxyPort));
  if (pendingPorts.length === 0) return Promise.resolve();
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
  return new Promise((resolveReady) => {
    child.on("exit", (exitCode) => {
      if (exitCode === 0) pendingPorts.forEach((proxyPort) => readyPortproxies.add(proxyPort));
      resolveReady();
    });
    child.on("error", () => resolveReady());
  });
}

function isHttpUp(checkPort) {
  return new Promise((resolvePort) => {
    let settled = false;
    const settle = (value) => {
      if (settled) return;
      settled = true;
      resolvePort(value);
    };
    const request = http.get({ host, port: checkPort, path: "/", timeout: 1_500 }, (response) => {
      response.resume();
      settle(true);
    });
    request.on("timeout", () => { request.destroy(); settle(false); });
    request.on("error", () => settle(false));
  });
}

async function appStatus(app) {
  const states = await Promise.all(app.ports.map(isHttpUp));
  const health = await probeHttpHealth(app.health);
  return {
    running: states[0] === true,
    ready: states.every(Boolean) && health.ready,
    health: app.health ? health : undefined,
    services: app.ports.map((servicePort, index) => ({ port: servicePort, running: states[index] })),
  };
}

async function commandRunning(command) {
  return isHttpUp(command.port);
}

function launch(command) {
  if (!existsSync(command.cwd)) throw new Error(`Missing app folder: ${command.cwd}`);
  const stdout = openSync(join(logRoot, `${command.log}.out.log`), "a");
  const stderr = openSync(join(logRoot, `${command.log}.error.log`), "a");
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
    if (status.ready) return status;
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
      return sendJson(response, status.ready ? 200 : 503, { ...status, url: apps[id]?.url });
    }
    if (request.method === "POST" && requestUrl.pathname === "/api/start-all") {
      const result = {};
      for (const id of Object.keys(apps)) result[id] = await startApp(id);
      return sendJson(response, Object.values(result).every((status) => status.ready) ? 200 : 503, result);
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
