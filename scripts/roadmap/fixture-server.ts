// Isolated verifier helper. Never receives the live roadmap paths.
import { resolve } from "node:path";
import { buildRoadmap, serveRoadmap } from "../language-roadmap";
const folder = resolve(Bun.argv[2]!);
const paths = {
  backlog: resolve(folder, "backlog.json"),
  history: resolve(folder, "history.json"),
  output: resolve(folder, "roadmap.html"),
};
if (Bun.argv.includes("--serve")) {
  const service = await serveRoadmap(paths, 0);
  await Bun.write(resolve(folder, "port.txt"), String(service.server.port));
  for (const signal of ["SIGTERM", "SIGINT"] as const)
    process.on(signal, () => {
      service.stop();
      process.exit();
    });
} else await buildRoadmap(paths, Bun.argv.includes("--check"));
