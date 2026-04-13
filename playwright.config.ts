import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3001);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;

function loadEnvFile() {
  const envPath = ".env";
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  workers: 3,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
          command: `pnpm exec next dev --port ${PORT}`,
          url: BASE_URL,
          reuseExistingServer: false,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            ...process.env,
            NEXT_PUBLIC_E2E_TEST_MODE: process.env.NEXT_PUBLIC_E2E_TEST_MODE || "1",
            NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || BASE_URL,
          },
        },
});
