import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";

const LOCAL_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

// Only this explicit allow-list reaches the Worker runtime. Provider secrets
// are never copied into Vite's client-facing `define` or `import.meta.env`.
const SERVER_ONLY_WORKER_ENV_KEYS = [
  "LOCAL_MODE",
  "PROVIDER_SECRETS_KEY_V1",
  "PROVIDER_SECRETS_ACTIVE_KEY_VERSION",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "DEEPL_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "API_INTERNAL_URL",
] as const;

function serverOnlyWorkerVars(mode: string) {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  const vars: Record<string, string> = {};
  for (const key of SERVER_ONLY_WORKER_ENV_KEYS) {
    const value = process.env[key] ?? fileEnv[key];
    if (typeof value === "string" && value.length > 0) vars[key] = value;
  }
  return vars;
}

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async ({ mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const localBindingConfig = {
    main: "./worker/index.ts",
    compatibility_flags: ["nodejs_compat"],
    vars: serverOnlyWorkerVars(mode),
    d1_databases: [
      {
        binding: "DB",
        database_name: "cross-repository-local",
        database_id: LOCAL_PLACEHOLDER_DATABASE_ID,
      },
    ],
    r2_buckets: [
      {
        binding: "BUCKET",
        bucket_name: "cross-repository-local-files",
      },
    ],
  };

  return {
    server: {
      host: "127.0.0.1",
      port: 4312,
      strictPort: true,
      allowedHosts: ["127.0.0.1", "localhost", "terminal.local"],
      watch: {
        ignored: ["**/.npm-cache/**", "**/.wrangler/**", "**/.next/**", "**/dist/**", "**/apps/api/dist/**"],
        ...(isCodexSeatbeltSandbox ? { useFsEvents: false, usePolling: true } : {}),
      },
    },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
