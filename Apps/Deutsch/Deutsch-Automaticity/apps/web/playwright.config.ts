import { defineConfig } from "@playwright/test";

const bunExecutable = process.env.BUN_EXECUTABLE ?? "bun";
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localTestUrl = "http://127.0.0.1:3210";
const baseURL = externalBaseUrl ?? localTestUrl;
const pwaMode = process.env.PLAYWRIGHT_PWA === "1";
const localServerCommand = pwaMode
  ? `"${bunExecutable}" run start -- --hostname 127.0.0.1 --port 3210`
  : `"${bunExecutable}" --bun next dev --hostname 127.0.0.1 --port 3210`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command: localServerCommand,
          url: localTestUrl,
          reuseExistingServer: false,
          timeout: 120_000,
        },
      }),
});
