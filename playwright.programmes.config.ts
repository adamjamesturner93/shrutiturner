import { defineConfig, devices } from "@playwright/test";
import { writeFileSync } from "node:fs";
import base from "./playwright.config";
process.env.PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3711";
process.env.PROGRAMME_TEST_CLOCK_FILE = "/tmp/rys-e2e-clock";
writeFileSync(process.env.PROGRAMME_TEST_CLOCK_FILE, "2027-01-25T09:00:00Z");
export default defineConfig({
  ...base,
  testIgnore: [],
  testDir: "./tests/e2e/programmes",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.PLAYWRIGHT_BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node scripts/programme-test-provider.mjs",
      url: "http://127.0.0.1:3799/health",
      reuseExistingServer: false,
    },
    {
      command: "pnpm run dev --port 3711",
      url: "http://127.0.0.1:3711",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        ...process.env,
        PROGRAMME_TEST_MODE: "1",
        INTERNAL_JOB_SECRET: "programme-fixture-job-secret",
        PROGRAMME_TEST_CLOCK_FILE: "/tmp/rys-e2e-clock",
        PROGRAMME_TEST_PROVIDER_URL: "http://127.0.0.1:3799",
        DAILY_API_BASE: "http://127.0.0.1:3799/v1",
        DAILY_API_KEY: "fixture",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3711",
        NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3711",
        SITE_STAGE: "live",
        NEXT_PUBLIC_E2E_TEST_MODE: "1",
      },
    },
  ],
});
