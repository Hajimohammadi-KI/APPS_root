import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, openSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";
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
// Everything is resolved from this file's own location so the collection is not
// pinned to one absolute drive letter.
const appsRoot = resolve(root, "..");
const integration = join(appsRoot, "Apps-For-Integeration");
const pdfReaderHost = process.env.PDF_READER_ALLOW_LAN === "1" ? "0.0.0.0" : "127.0.0.1";
mkdirSync(logRoot, { recursive: true });

const apps = {
  english: {
    name: "English Automaticity",
    description: "Daily practice, grammar, conversation and learning evidence",
    url: "http://127.0.0.1:3202",
    ports: [3202, 4201],
    commands: [
      { cwd: join(appsRoot, "English", "English-07082026"), command: "bun run --cwd apps/api start", log: "english-api" },
      { cwd: join(appsRoot, "English", "English-07082026"), command: "bun run --cwd apps/web start -- --hostname 127.0.0.1 --port 3202", log: "english-web" },
    ],
  },
  german: {
    name: "Deutsch Automaticity",
    description: "Tagestraining, Grammatik, Sprechen und Lernnachweise",
    url: "http://127.0.0.1:3210",
    ports: [3210, 4210],
    commands: [
      { cwd: join(appsRoot, "Deutsch-V10.08.2026"), command: "bun run --cwd apps/api start", log: "german-api" },
      { cwd: join(appsRoot, "Deutsch-V10.08.2026"), command: "bun run --cwd apps/web start -- --hostname 127.0.0.1 --port 3210", log: "german-web" },
    ],
  },
  tracker: {
    name: "Cross Repository Tracker",
    description: "Study tracker, thesis plan, PDF workflow and integrations",
    url: "http://127.0.0.1:4312",
    ports: [4312, 4313],
    commands: [
      { cwd: join(appsRoot, "Cross_Repository_Code_Intelligence-Version"), command: "bun run start:api", log: "tracker-api" },
      { cwd: join(appsRoot, "Cross_Repository_Code_Intelligence-Version"), command: "bun run start", log: "tracker-web" },
    ],
  },
  settings: {
    name: "Settings",
    description: "Reusable preferences, accessibility and backup settings",
    url: "http://127.0.0.1:4323/settings",
    ports: [4323],
    commands: [
      { cwd: join(integration, "Einstellungen-APP"), command: "bun run start --port 4323", log: "settings" },
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
        cwd: join(integration, "Reader-PDF-App"),
        command: `node scripts/start-local.mjs --hostname ${pdfReaderHost} --port ${pdfReaderPort}`,
        log: "pdf-reader",
      },
    ],
  },
};

function isPortOpen(checkPort) {
  return new Promise((resolvePort) => {
    const socket = net.createConnection({ host, port: checkPort });
    const done = (value) => { socket.destroy(); resolvePort(value); };
    socket.setTimeout(350);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function appStatus(app) {
  const states = await Promise.all(app.ports.map(isPortOpen));
  const health = await probeHttpHealth(app.health);
  return {
    running: states[0] === true,
    ready: states.every(Boolean) && health.ready,
    health: app.health ? health : undefined,
    services: app.ports.map((servicePort, index) => ({ port: servicePort, running: states[index] })),
  };
}

function launch(command) {
  if (!existsSync(command.cwd)) throw new Error(`Missing app folder: ${command.cwd}`);
  const stdout = openSync(join(logRoot, `${command.log}.out.log`), "a");
  const stderr = openSync(join(logRoot, `${command.log}.error.log`), "a");
  const child = spawn("cmd.exe", ["/d", "/s", "/c", command.command], {
    cwd: command.cwd,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", stdout, stderr],
  });
  child.unref();
}

async function startApp(id) {
  const app = apps[id];
  if (!app) throw new Error("Unknown app");
  const before = await appStatus(app);
  for (let index = 0; index < app.commands.length; index++) {
    if (!before.services[index]?.running) launch(app.commands[index]);
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
    if (requestUrl.pathname === "/api/status") {
      const result = {};
      for (const [id, app] of Object.entries(apps)) result[id] = { ...app, ...(await appStatus(app)), commands: undefined };
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
