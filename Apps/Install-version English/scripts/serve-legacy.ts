import { resolve, sep } from "node:path";

const root = resolve(import.meta.dir, "..");
const port = Number(Bun.env.LEGACY_PORT ?? 3301);

function safeFilePath(pathname: string) {
  const relative = pathname === "/" ? "legacy/index.html" : decodeURIComponent(pathname.slice(1));
  const filePath = resolve(root, relative);
  return filePath === root || filePath.startsWith(`${root}${sep}`)
    ? filePath
    : null;
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const filePath = safeFilePath(url.pathname);
    if (!filePath) return new Response("Not found", { status: 404 });

    const file = Bun.file(filePath);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });

    return new Response(file, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  },
});

console.log(`Legacy v27 preview: ${server.url}legacy/index.html`);
