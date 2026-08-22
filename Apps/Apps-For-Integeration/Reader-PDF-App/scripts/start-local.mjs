import { createReadStream, existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Readable } from "node:stream";

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptRoot, "..");
const distRoot = join(projectRoot, "dist");
const clientRoot = join(distRoot, "client");
const workerPath = join(distRoot, "server", "index.js");
const packagePath = join(projectRoot, "package.json");

function readArgument(name, fallback) {
  const prefix = `--${name}=`;
  const index = process.argv.indexOf(`--${name}`);
  const inline = process.argv.find((value) => value.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const hostname = readArgument("hostname", process.env.HOSTNAME || "127.0.0.1");
const port = Number(readArgument("port", process.env.PORT || "4332"));
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid PDF Reader port: ${port}`);
}
if (!existsSync(workerPath) || !existsSync(clientRoot)) {
  throw new Error("The verified PDF Reader build is missing. Run `bun run build` first.");
}

const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const releaseVersion =
  process.env.PDF_READER_RELEASE_VERSION?.trim() || packageJson.version || "development";
const defaultImportRoot = join(
  process.env.LOCALAPPDATA || projectRoot,
  "English Grammar Automaticity",
  "PDF Reader Imports",
);
const importRoot = resolve(process.env.PDF_READER_IMPORT_ROOT || defaultImportRoot);
const worker = (await import(pathToFileURL(workerPath).href)).default;
if (!worker || typeof worker.fetch !== "function") {
  throw new Error("The PDF Reader worker does not expose a fetch handler.");
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function isInside(root, candidate) {
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  return candidate === root || candidate.startsWith(normalizedRoot);
}

function isLoopback(remoteAddress) {
  return (
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::1" ||
    remoteAddress === "::ffff:127.0.0.1"
  );
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function assetResponse(request) {
  const requestUrl = new URL(request.url);
  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    return new Response("Invalid asset path", { status: 400 });
  }
  const candidate = resolve(clientRoot, `.${pathname}`);
  if (!isInside(clientRoot, candidate)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const info = await stat(candidate);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    return new Response(await readFile(candidate), {
      headers: {
        "Cache-Control": pathname.includes("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
        "Content-Length": String(info.size),
        "Content-Type": contentTypes.get(extname(candidate).toLowerCase()) || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function requestBody(incoming) {
  const chunks = [];
  let size = 0;
  for await (const chunk of incoming) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 12 * 1024 * 1024) throw new Error("Request body exceeds 12 MB.");
    chunks.push(buffer);
  }
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

async function workerResponse(incoming, requestUrl) {
  const method = incoming.method || "GET";
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  const body = method === "GET" || method === "HEAD" ? undefined : await requestBody(incoming);
  const request = new Request(requestUrl, { method, headers, body });
  const pending = new Set();
  const executionContext = {
    passThroughOnException() {},
    waitUntil(promise) {
      const tracked = Promise.resolve(promise).finally(() => pending.delete(tracked));
      pending.add(tracked);
    },
  };
  const response = await worker.fetch(
    request,
    { ASSETS: { fetch: assetResponse } },
    executionContext,
  );
  if (pending.size) void Promise.allSettled([...pending]);
  return response;
}

async function sendWebResponse(outgoing, response, headOnly = false) {
  outgoing.statusCode = response.status;
  response.headers.forEach((value, name) => outgoing.setHeader(name, value));
  outgoing.setHeader("X-Content-Type-Options", "nosniff");
  if (headOnly || !response.body) {
    outgoing.end();
    return;
  }
  Readable.fromWeb(response.body).pipe(outgoing);
}

async function sendLocalPdf(incoming, outgoing, requestUrl) {
  if (!isLoopback(incoming.socket.remoteAddress)) {
    await sendWebResponse(outgoing, json({ ready: false, error: "Local PDF imports are loopback-only." }, 403));
    return;
  }
  const id = requestUrl.searchParams.get("id") || "";
  if (!/^[a-f0-9]{64}$/.test(id)) {
    await sendWebResponse(outgoing, json({ ready: false, error: "Invalid local PDF identifier." }, 400));
    return;
  }
  const pdfPath = resolve(importRoot, `${id}.pdf`);
  if (!isInside(importRoot, pdfPath) || !isAbsolute(pdfPath)) {
    await sendWebResponse(outgoing, json({ ready: false, error: "Invalid local PDF path." }, 400));
    return;
  }
  try {
    const info = await stat(pdfPath);
    if (!info.isFile()) throw new Error("not-file");
    outgoing.writeHead(200, {
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "Content-Length": String(info.size),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    });
    if (incoming.method === "HEAD") outgoing.end();
    else createReadStream(pdfPath).pipe(outgoing);
  } catch {
    await sendWebResponse(outgoing, json({ ready: false, error: "Local PDF was not found." }, 404));
  }
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const requestUrl = new URL(incoming.url || "/", `http://${hostname}:${port}`);
    if (requestUrl.pathname === "/api/health") {
      await sendWebResponse(
        outgoing,
        json({
          service: "research-pdf-studio",
          ready: true,
          contractVersion: 1,
          version: releaseVersion,
          storageBoundary: "browser-local",
          localPdfImport: "loopback-only",
        }),
        incoming.method === "HEAD",
      );
      return;
    }
    if (requestUrl.pathname === "/api/local-pdf") {
      await sendLocalPdf(incoming, outgoing, requestUrl);
      return;
    }
    if ((incoming.method === "GET" || incoming.method === "HEAD") && requestUrl.pathname !== "/") {
      const asset = await assetResponse(new Request(requestUrl));
      if (asset.status !== 404) {
        await sendWebResponse(outgoing, asset, incoming.method === "HEAD");
        return;
      }
    }
    await sendWebResponse(
      outgoing,
      await workerResponse(incoming, requestUrl),
      incoming.method === "HEAD",
    );
  } catch (error) {
    if (!outgoing.headersSent) {
      await sendWebResponse(
        outgoing,
        json(
          {
            ready: false,
            error: error instanceof Error ? error.message : "PDF Reader request failed.",
          },
          500,
        ),
      );
    } else {
      outgoing.destroy(error instanceof Error ? error : undefined);
    }
  }
});

server.listen(port, hostname, () => {
  console.log(
    JSON.stringify({
      service: "research-pdf-studio",
      ready: true,
      url: `http://${hostname}:${port}`,
      version: releaseVersion,
      importRoot,
    }),
  );
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
