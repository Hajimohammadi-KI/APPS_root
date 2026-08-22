import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

const port = 4332;
const externalBaseUrl = process.env.READER_EXTERNAL_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 12_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: externalBaseUrl ?? `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `node scripts/start-local.mjs --hostname 127.0.0.1 --port ${port}`,
        env: {
          PDF_READER_IMPORT_ROOT: resolve("tests/.runtime-imports"),
          PDF_READER_RELEASE_VERSION: "browser-test",
        },
        reuseExistingServer: false,
        timeout: 120_000,
        url: `http://127.0.0.1:${port}/api/health`,
      },
});
