import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.SCIO_E2E_BASE_URL ?? "https://127.0.0.1:5173";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.e2e\.ts/,
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: [
      "SCIO_DEV_HOST=127.0.0.1",
      "SCIO_DEV_PORT=5173",
      "SCIO_DEV_HTTPS=true",
      "SCIO_AUTH_DRIVER=memory",
      "SCIO_JWT_SECRET=test-e2e-secret",
      "SCIO_SESSION_TTL_SEC=900",
      "bunx",
      "vite",
      "dev",
      "--mode",
      "ssr",
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
    ].join(" "),
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
    ignoreHTTPSErrors: true,
  },
});
