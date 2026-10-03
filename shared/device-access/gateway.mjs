import http from "node:http";
import https from "node:https";
import { spawn } from "node:child_process";
import {
  createReadStream,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export function isPrivateAddress(address = "") {
  const value = address.replace(/^::ffff:/, "");
  if (value === "::1") return true;
  const octets = value.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  )
    return false;
  return (
    octets[0] === 127 ||
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}

export function acceptsRequest(request, host, port) {
  if (!isPrivateAddress(request.socket.remoteAddress)) return false;
  const allowed = new Set([
    `${host}:${port}`,
    `127.0.0.1:${port}`,
    `localhost:${port}`,
  ]);
  if (!allowed.has(request.headers.host)) return false;
  // A LAN gateway must not turn a cross-site form into a local write or paid API call.
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.headers.origin
  ) {
    try {
      if (new URL(request.headers.origin).host !== request.headers.host)
        return false;
    } catch {
      return false;
    }
  }
  return true;
}

function handler({ host, port, upstream, roadmap, certificates, secure }) {
  return (request, response) => {
    if (!acceptsRequest(request, host, port)) {
      response.writeHead(403).end("Local network access only.");
      return;
    }
    response.setHeader("X-Content-Type-Options", "nosniff");
    if (!upstream) {
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405).end("Read-only viewer");
        return;
      }
      const pathname = new URL(request.url, `http://${request.headers.host}`)
        .pathname;
      // Only these public files are served, never a workspace directory or private key.
      const files = {
        "/": [roadmap, "text/html; charset=utf-8"],
        "/LANGUAGE-AUTOMATICITY-ROADMAP.html": [
          roadmap,
          "text/html; charset=utf-8",
        ],
        "/device-ca.cer": [
          join(certificates, "device-ca.cer"),
          "application/x-x509-ca-cert",
        ],
      };
      const file = files[pathname];
      if (!file || !existsSync(file[0])) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": file[1],
        "Cache-Control": "no-store",
      });
      if (request.method === "HEAD") response.end();
      else
        createReadStream(file[0])
          .on("error", () => response.destroy())
          .pipe(response);
      return;
    }
    if (!request.url?.startsWith("/") || request.url.startsWith("//")) {
      response.writeHead(400).end("Invalid path");
      return;
    }
    // The destination is fixed by configuration; request paths cannot choose another host.
    const proxy = http.request(
      {
        hostname: "127.0.0.1",
        port: upstream,
        path: request.url,
        method: request.method,
        headers: {
          ...request.headers,
          "x-forwarded-host": request.headers.host,
          "x-forwarded-proto": secure ? "https" : "http",
          "x-forwarded-for": request.socket.remoteAddress,
        },
        timeout: 120000,
      },
      (backend) => {
        response.writeHead(backend.statusCode ?? 502, backend.headers);
        backend.on("error", () => response.destroy());
        backend.pipe(response);
      },
    );
    proxy.on("error", () => {
      if (!response.headersSent)
        response.writeHead(503).end("App is starting. Please retry shortly.");
      else response.destroy();
    });
    proxy.on("timeout", () => proxy.destroy());
    request.on("aborted", () => proxy.destroy());
    request.pipe(proxy);
  };
}

export async function startGateway({
  host,
  directory,
  root,
  manageApps = true,
}) {
  if (!isPrivateAddress(host) || host.startsWith("127."))
    throw new Error("Choose the computer's private IPv4 Wi-Fi address.");
  mkdirSync(directory, { recursive: true });
  const certificates = join(directory, "certificates");
  const children = new Set();
  let stopping = false;
  const services = [
    {
      name: "English web",
      root: "Apps/English/English-Automaticity",
      port: 3202,
      route: "/",
      runtime: "node",
      args: [
        "scripts/start-standalone.mjs",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3202",
      ],
    },
    {
      name: "German web",
      root: "Apps/Deutsch-Automaticity",
      port: 3210,
      route: "/",
      runtime: "node",
      args: [
        "scripts/start-standalone.mjs",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3210",
      ],
    },
    {
      name: "English API",
      root: "Apps/English/English-Automaticity",
      port: 4201,
      route: "/api/health",
      runtime: "bun",
      args: ["apps/api/dist/main.js"],
    },
    {
      name: "German API",
      root: "Apps/Deutsch-Automaticity",
      port: 4210,
      route: "/api/v1/health",
      runtime: "bun",
      args: ["apps/api/dist/main.js"],
    },
  ];
  // A rollback pins the gateway to the archived release, so restarting cannot
  // accidentally serve a newer build from the development checkout.
  const releaseFile = join(directory, "release-runtimes.json");
  if (existsSync(releaseFile)) {
    const releases = JSON.parse(readFileSync(releaseFile, "utf8"));
    if (releases.schemaVersion !== 1)
      throw new Error("Invalid release runtime configuration.");
    for (const service of services) {
      const language = service.name.startsWith("English") ? "en" : "de";
      const release = releases[language];
      if (!release?.runtimeRoot || !release.version)
        throw new Error(`Missing ${language} release pin.`);
      const web = service.name.endsWith("web");
      const entry = resolve(
        release.runtimeRoot,
        web ? "web/apps/web/server.js" : "api/main.js",
      );
      if (!existsSync(entry))
        throw new Error(`Pinned release is missing: ${entry}`);
      service.root = resolve(release.runtimeRoot, web ? "web/apps/web" : "api");
      service.args = [entry];
      const webPort = language === "en" ? 3202 : 3210;
      const origins = [
        `http://127.0.0.1:${webPort}`,
        `http://localhost:${webPort}`,
        `http://${host}:${webPort + 1}`,
        `https://${host}:${webPort + 2}`,
      ].join(",");
      service.env = web
        ? { PORT: String(service.port), HOSTNAME: "127.0.0.1" }
        : { WEB_ORIGINS: origins, CORS_ORIGINS: origins };
    }
  }
  const start = (service) => {
    if (stopping) return;
    const child = spawn(service.runtime, service.args, {
      cwd: resolve(root, service.root),
      windowsHide: true,
      stdio: "inherit",
      env: { ...process.env, HOST: "127.0.0.1", ...service.env },
    });
    children.add(child);
    child.on("error", (error) =>
      console.error(`${service.name}: ${error.message}`),
    );
    child.on("exit", () => {
      children.delete(child);
      if (!stopping) setTimeout(() => start(service), 5000);
    });
  };
  const roadmap = join(root, "docs/LANGUAGE-AUTOMATICITY-ROADMAP.html");
  const endpoints = [
    { port: 3203, upstream: 3202 },
    { port: 3211, upstream: 3210 },
    { port: 3317 },
  ];
  let tls;
  if (existsSync(join(certificates, "server-key.pem"))) {
    const metadata = JSON.parse(
      readFileSync(join(certificates, "certificate.json"), "utf8"),
    );
    if (metadata.host !== host || Date.parse(metadata.expires) < Date.now())
      throw new Error(
        "The device certificate must be renewed for this address.",
      );
    tls = {
      key: readFileSync(join(certificates, "server-key.pem")),
      cert: readFileSync(join(certificates, "server.pem")),
      minVersion: "TLSv1.2",
    };
    endpoints.push(
      { port: 3204, upstream: 3202, secure: true },
      { port: 3212, upstream: 3210, secure: true },
      { port: 3318, secure: true },
    );
  }
  if (manageApps)
    for (const service of services) {
      const healthy = await fetch(
        `http://127.0.0.1:${service.port}${service.route}`,
        { signal: AbortSignal.timeout(5000) },
      )
        .then((result) => result.ok)
        .catch(() => false);
      // Existing healthy desktop/preview processes are borrowed and are never stopped by this launcher.
      if (!healthy) start(service);
    }
  const servers = [];
  const stop = () => {
    stopping = true;
    for (const server of servers) server.close();
    for (const child of children) child.kill();
  };
  try {
    for (const endpoint of endpoints) {
      const handle = handler({ ...endpoint, host, certificates, roadmap });
      const server = endpoint.secure
        ? https.createServer(tls, handle)
        : http.createServer(handle);
      servers.push(server);
      await new Promise((ok, fail) => {
        server.once("error", fail);
        server.listen(endpoint.port, host, ok);
      });
    }
  } catch (error) {
    stop();
    throw error;
  }
  const urls = endpoints.map(
    ({ port, secure }) => `${secure ? "https" : "http"}://${host}:${port}/`,
  );
  writeFileSync(
    join(directory, "status.json"),
    JSON.stringify(
      { pid: process.pid, host, started: new Date().toISOString(), urls },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ urls }));
  return { stop, urls };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [host, directory] = process.argv.slice(2);
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const gateway = await startGateway({ host, directory, root });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => gateway.stop());
}
