import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface PackageManifest {
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const root = resolve(import.meta.dir, "..");

async function readManifest(relativePath: string) {
  return JSON.parse(
    await readFile(resolve(root, relativePath), "utf8"),
  ) as PackageManifest;
}

function requireValue(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}

const [workspace, web, api] = await Promise.all([
  readManifest("package.json"),
  readManifest("apps/web/package.json"),
  readManifest("apps/api/package.json"),
]);

const webTypeScript = web.devDependencies?.typescript;
const apiTypeScript = api.devDependencies?.typescript;
const apiDependencies = api.dependencies ?? {};
const webDependencies = web.dependencies ?? {};
const apiScripts = api.scripts ?? {};

requireValue(
  typeof Bun !== "undefined" && Boolean(Bun.version),
  "Stack verification must run with Bun.",
);
requireValue(
  workspace.packageManager?.startsWith("bun@"),
  "The workspace packageManager must be Bun.",
);
requireValue(
  webTypeScript?.startsWith("7.") && apiTypeScript?.startsWith("7."),
  "Both applications must pin TypeScript 7.",
);
requireValue(
  apiDependencies["@nestjs/core"] &&
    apiDependencies["@nestjs/common"] &&
    apiDependencies["@nestjs/platform-express"],
  "The backend must use NestJS.",
);
requireValue(
  webDependencies.next &&
    webDependencies.react &&
    webDependencies.shadcn,
  "The frontend must use Next.js, React, and shadcn/ui.",
);
requireValue(
  apiScripts.dev?.startsWith("bun ") &&
    apiScripts.start?.startsWith("bun ") &&
    apiScripts["start:prod"]?.startsWith("bun "),
  "Every backend runtime script must use Bun.",
);
requireValue(
  apiScripts.build?.includes("tsc -p tsconfig.build.json"),
  "The backend build must use the TypeScript 7 CLI.",
);

console.table([
  {
    layer: "workspace",
    runtime: `Bun ${Bun.version}`,
    framework: "Bun workspaces",
    typescript: "7.0.2",
  },
  {
    layer: "frontend",
    runtime: "Bun scripts",
    framework: `Next.js ${webDependencies.next} + shadcn ${webDependencies.shadcn}`,
    typescript: webTypeScript,
  },
  {
    layer: "backend",
    runtime: "Bun",
    framework: `NestJS ${apiDependencies["@nestjs/core"]}`,
    typescript: apiTypeScript,
  },
]);
