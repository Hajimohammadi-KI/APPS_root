import { defineConfig } from "@playwright/test";

const webUrl = process.env.E2E_BASE_URL ?? "http://localhost:3201";
const apiUrl = process.env.E2E_API_URL ?? "http://localhost:4201";
const legacyUrl = process.env.E2E_LEGACY_URL ?? "http://localhost:3301";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: "test-results/artifacts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: webUrl,
    browserName: "chromium",
    channel:
      process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "msedge"),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "bun run legacy:preview",
      env: {
        LEGACY_PORT: new URL(legacyUrl).port,
      },
      reuseExistingServer: true,
      timeout: 30_000,
      url: `${legacyUrl}/legacy/index.html`,
    },
    {
      command: "bun run --cwd apps/api start",
      env: {
        CORS_ORIGINS: webUrl,
        PORT: new URL(apiUrl).port,
      },
      reuseExistingServer: true,
      timeout: 30_000,
      url: `${apiUrl}/api/health`,
    },
    {
      command: `bun run --cwd apps/web dev -- --port ${new URL(webUrl).port}`,
      env: {
        NEXT_PUBLIC_API_URL: apiUrl,
      },
      reuseExistingServer: true,
      timeout: 120_000,
      url: webUrl,
    },
  ],
});
