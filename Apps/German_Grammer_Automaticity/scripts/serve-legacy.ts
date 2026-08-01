const root = new URL("../legacy/v20.8-static/", import.meta.url);
const port = Number(Bun.env.LEGACY_PORT ?? 8080);

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const relativePath =
      url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const fileUrl = new URL(relativePath, root);

    if (!fileUrl.pathname.startsWith(root.pathname)) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(fileUrl);
    if (!(await file.exists())) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(file);
  },
});

console.log(`Legacy v20.8 PWA: ${server.url}`);
